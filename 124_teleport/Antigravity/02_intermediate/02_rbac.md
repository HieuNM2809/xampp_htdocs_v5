# 📘 LEVEL 2: RBAC & SSO Integration

## 1. RBAC (Role-Based Access Control) Chi Tiết

### Cấu Trúc Role

```yaml
kind: role
version: v7
metadata:
  name: role-name
  description: "Mô tả role"
  labels:
    team: backend

spec:
  # === ALLOW: Những gì được phép ===
  allow:
    # SSH logins
    logins: ["ubuntu", "ec2-user"]
    
    # Node labels phải match để được SSH
    node_labels:
      env: ["staging", "dev"]
      team: ["backend"]
    
    # Kubernetes
    kubernetes_groups: ["developers"]
    kubernetes_labels:
      env: ["staging"]
    kubernetes_resources:
      - kind: pod
        namespace: "default"
        name: "*"
        verbs: ["get", "list", "watch", "exec"]
    
    # Databases
    db_labels:
      env: ["staging"]
    db_names: ["app_db", "test_db"]
    db_users: ["readonly", "app_user"]
    
    # Desktop/RDP
    windows_desktop_labels:
      env: ["staging"]
    windows_desktop_logins: ["alice"]
    
    # Resource rules
    rules:
      - resources: ["session"]      # Loại resource
        verbs: ["list", "read"]     # Actions được phép

  # === DENY: Luôn ưu tiên hơn allow ===
  deny:
    logins: ["root"]
    node_labels:
      env: ["production"]

  # === OPTIONS: Cài đặt phiên ===
  options:
    # Thời gian tối đa của SSH certificate
    max_session_ttl: 8h
    
    # Yêu cầu MFA khi connect
    require_session_mfa: no    # no | session | hardware_key
    
    # Có cho phép agent forwarding không
    forward_agent: true
    
    # Có cho phép port forwarding không
    port_forwarding: true
    
    # Session recording mode
    record_session:
      default: best_effort    # off | node | proxy | best_effort
      desktop: true
    
    # Disconnect nếu lock
    lock: best_effort
    
    # Idle timeout (tự disconnect nếu idle)
    client_idle_timeout: 30m
    
    # Disconnect nếu cert expire trong session
    disconnect_expired_cert: true
    
    # Enhanced session recording (eBPF)
    enhanced_recording:
      enabled: true
      capture_command: true
      capture_network: true
```

### Role Templates với External Variables

```yaml
# Role này dùng traits từ SSO provider
kind: role
version: v7
metadata:
  name: sso-dynamic-role
spec:
  allow:
    # Dùng traits từ OIDC/SAML provider
    logins:
      - "{{internal.logins}}"          # Từ Teleport internal
      - "{{external.username}}"         # Từ SSO provider
    
    node_labels:
      team: ["{{external.team}}"]       # Team từ SSO
      env: ["{{external.allowed_envs}}"] # Envs từ SSO
    
    # Kubernetes group từ SSO groups  
    kubernetes_groups:
      - "{{external.groups}}"
    
    db_users:
      - "{{internal.db_users}}"
```

---

## 2. GitHub SSO Integration

```yaml
# config/teleport.yaml - Thêm GitHub connector
auth_service:
  enabled: true
  authentication:
    type: github
```

```yaml
# github-connector.yaml
kind: github
version: v3
metadata:
  name: github
spec:
  # Tạo OAuth App tại: https://github.com/settings/developers
  client_id: your-github-oauth-app-client-id
  client_secret: your-github-oauth-app-client-secret
  
  # URL Teleport sẽ redirect về sau login
  redirect_url: https://teleport.example.com/v1/webapi/github/callback
  
  # Map GitHub teams → Teleport roles
  teams_to_roles:
    - organization: your-github-org
      team: backend-engineers
      roles:
        - developer
        - db-readonly
    
    - organization: your-github-org
      team: devops
      roles:
        - ops
        - developer
    
    - organization: your-github-org
      team: security
      roles:
        - auditor
```

```bash
# Apply GitHub connector
docker exec -i teleport-demo tctl create -f < github-connector.yaml

# Test login via GitHub
tsh login --proxy=teleport.example.com --auth=github
```

---

## 3. Google Workspace (OIDC) Integration

```yaml
# google-oidc.yaml
kind: oidc
version: v3
metadata:
  name: google
spec:
  # Tạo OAuth client tại: https://console.cloud.google.com/
  issuer_url: https://accounts.google.com
  client_id: your-google-client-id.apps.googleusercontent.com
  client_secret: your-google-client-secret
  
  redirect_url: https://teleport.example.com/v1/webapi/oidc/callback
  
  # Scopes cần thiết
  scope: ["openid", "email", "profile"]
  
  # Claim để xác định claims (default: sub)
  username_claim: "email"
  
  # Claims từ Google token → Teleport roles
  claims_to_roles:
    # Chỉ cho phép email thuộc domain company.com
    - claim: hd
      value: "company.com"
      roles:
        - developer
    
    # Map custom claims (cần setup trong Google Workspace)
    - claim: groups
      value: "devops-team"
      roles:
        - ops
```

---

## 4. Audit Log

### Xem Audit Events

```bash
# Xem events realtime
docker exec teleport-demo tctl events watch

# Xem events trong khoảng thời gian
docker exec teleport-demo \
  tctl events get \
  --start="2024-01-01T00:00:00" \
  --end="2024-01-02T00:00:00"

# Filter theo loại event
docker exec teleport-demo \
  tctl events get \
  --type=session.start,session.end,auth

# Output JSON
docker exec teleport-demo \
  tctl events get --format=json | jq '.'
```

### Các Loại Audit Events Quan Trọng

| Event | Ý nghĩa |
|-------|---------|
| `auth` | Đăng nhập thành công/thất bại |
| `session.start` | Bắt đầu SSH session |
| `session.end` | Kết thúc SSH session |
| `session.command` | Command được chạy trong session |
| `session.network` | Network connection từ session |
| `user.create` | User được tạo |
| `role.created` | Role được tạo |
| `db.session.start` | Database session bắt đầu |
| `db.session.query` | SQL query được thực thi |
| `kube.request` | Kubernetes API request |
| `app.session.start` | Web app session bắt đầu |

### Export Audit Log ra Elasticsearch / S3

```yaml
# config/teleport.yaml - Cấu hình audit log storage
auth_service:
  enabled: true
  audit_events_uri:
    # Lưu vào S3
    - "s3://your-bucket/teleport-audit?region=ap-southeast-1"
    
    # Lưu vào DynamoDB
    - "dynamodb://teleport-audit-events"
    
    # Lưu vào Elasticsearch
    - "elasticsearch://elasticsearch:9200"
  
  # Session recordings storage
  audit_sessions_uri:
    - "s3://your-bucket/teleport-sessions?region=ap-southeast-1"
```

---

## 5. Locking (Emergency Access Revoke)

```bash
# Lock ngay lập tức một user (khi bị compromise)
tctl lock --user=alice --message="Security incident" --ttl=24h

# Lock một role
tctl lock --role=developer --ttl=1h

# Lock một node (ngăn kết nối vào node đó)
tctl lock --server-id=node-uuid --ttl=30m

# Xem danh sách locks đang active
tctl locks ls

# Xóa lock sớm hơn TTL
tctl locks rm <lock-name>
```

---

➡️ Tiếp theo: [../03_advanced/01_kubernetes.md](../03_advanced/01_kubernetes.md)
