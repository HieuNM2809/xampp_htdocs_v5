# 📘 LEVEL 2: SSH Access & Node Management

## 1. Thêm Node SSH vào Cluster

### Cách 1: Join bằng Static Token

```yaml
# config/teleport-node.yaml - Config cho SSH node
version: v3
teleport:
  nodename: web-server-01
  data_dir: /var/lib/teleport
  auth_token: demo-node-token-12345
  auth_servers:
    - teleport-auth:3025

auth_service:
  enabled: false

proxy_service:
  enabled: false

ssh_service:
  enabled: true
  listen_addr: 0.0.0.0:3022
  # Labels để phân loại node
  labels:
    env: production
    role: webserver
    region: asia-southeast
  # Commands động - chạy lệnh để lấy label value
  commands:
    - name: hostname
      command: [hostname]
      period: 1m
    - name: kernel
      command: [uname, -r]
      period: 1h
```

```bash
# Hoặc join bằng command line
docker run -d \
  --name teleport-node \
  goteleport/teleport:16 \
  teleport start \
  --roles=node \
  --auth-server=teleport-auth:3025 \
  --token=demo-node-token-12345 \
  --labels=env=production,role=api
```

### Cách 2: Join bằng Short-lived Token (An toàn hơn)

```bash
# Trên Auth Server - tạo token tạm thời (expire sau 1 giờ)
docker exec teleport-demo \
  tctl tokens add \
  --type=node \
  --ttl=1h

# Output:
# Token: xxxxxxxxxxxxxxxx
# Expires: 2024-01-01 13:00:00
# 
# Run this on your node:
# teleport start --roles=node --token=xxxx --auth-server=proxy:3025
```

---

## 2. User Management & Roles

### Tạo Roles

```bash
# Tạo file role YAML
cat > roles/developer-role.yaml << 'EOF'
kind: role
version: v7
metadata:
  name: developer
  description: "Developer - access staging only"
spec:
  allow:
    # Login users trên SSH nodes
    logins: ["ubuntu", "ec2-user", "developer"]
    # Chỉ access nodes có label env=staging
    node_labels:
      env: ["staging", "dev"]
    # Cho phép port forwarding
    port_forwarding: true
    # Cho phép copy file (scp/sftp)
    forwarding_rules: []
    # Giới hạn commands có thể chạy (optional)
    rules:
      - resources: ["session"]
        verbs: ["list", "read"]  # xem sessions của mình
  deny:
    # Không được SSH bằng root
    logins: ["root"]
    # Không được access production
    node_labels:
      env: ["production"]
  options:
    # Session timeout
    max_session_ttl: 8h
    # Yêu cầu MFA để connect
    require_session_mfa: no
    # Ghi lại toàn bộ session
    record_session:
      default: best_effort
EOF

# Apply role
docker exec -i teleport-demo tctl create -f < roles/developer-role.yaml
```

```bash
# Role cho Ops team - full access
cat > roles/ops-role.yaml << 'EOF'
kind: role
version: v7
metadata:
  name: ops
  description: "Operations - full infrastructure access"
spec:
  allow:
    logins: ["root", "ubuntu", "ec2-user", "admin"]
    node_labels:
      "*": ["*"]  # Access tất cả nodes
    kubernetes_groups: ["system:masters"]
    kubernetes_labels:
      "*": ["*"]
    db_labels:
      "*": ["*"]
    db_names: ["*"]
    db_users: ["*"]
  options:
    max_session_ttl: 12h
    require_session_mfa: yes  # Bắt buộc MFA cho ops
EOF

docker exec -i teleport-demo tctl create -f < roles/ops-role.yaml
```

### Tạo Users và Gán Roles

```bash
# Tạo user mới với role developer
docker exec teleport-demo \
  tctl users add alice \
  --roles=developer \
  --logins=ubuntu,alice

# Tạo user ops với nhiều roles
docker exec teleport-demo \
  tctl users add bob \
  --roles=ops,developer \
  --logins=root,ubuntu,bob

# Xem danh sách users
docker exec teleport-demo tctl users ls

# Cập nhật role của user
docker exec teleport-demo \
  tctl users update alice \
  --set-roles=developer,auditor

# Xóa user
docker exec teleport-demo tctl users rm alice
```

---

## 3. SSH Session & Tính Năng Nâng Cao

### Session Recording

```bash
# Login với tsh
tsh login --proxy=localhost:443 --insecure --user=bob

# SSH vào node (session sẽ được ghi lại)
tsh ssh ubuntu@web-server-01

# === Trong session ===
sudo apt update
ls -la /var/log
cat /etc/nginx/nginx.conf
exit
```

```bash
# Xem danh sách sessions đã ghi
tsh recordings ls

# Xem lại recording (như video terminal)
tsh play <session-id>

# Export session thành file
tsh play --format=pty <session-id> > session.cast
# Xem bằng asciinema: asciinema play session.cast
```

### Port Forwarding

```bash
# Forward local port 8080 → remote port 80
tsh ssh -L 8080:localhost:80 ubuntu@web-server-01

# Forward nhiều ports
tsh ssh \
  -L 8080:localhost:80 \
  -L 5432:database-server:5432 \
  ubuntu@web-server-01

# Dynamic SOCKS proxy (tunnel all traffic)
tsh ssh -D 1080 ubuntu@jump-server
```

### File Transfer (SCP)

```bash
# Upload file
tsh scp ./local-file.txt ubuntu@web-server-01:/tmp/

# Download file
tsh scp ubuntu@web-server-01:/etc/nginx/nginx.conf ./

# Copy thư mục
tsh scp -r ./local-dir ubuntu@web-server-01:/var/www/
```

---

## 4. Tsh Commands Thường Dùng

```bash
# === Authentication ===
tsh login --proxy=your-teleport.example.com --user=alice
tsh logout
tsh status

# === Node Management ===
tsh ls                              # Liệt kê tất cả nodes
tsh ls --format=json                # Output JSON
tsh ls env=production               # Filter by label
tsh ls "env=prod,region=asia"       # Filter nhiều labels

# === SSH ===
tsh ssh ubuntu@server1              # SSH đơn giản
tsh ssh -l ubuntu server1           # Specify login user
tsh ssh ubuntu@server1 -- "ls -la" # Chạy command và thoát

# === Sessions ===
tsh sessions ls                     # List active sessions
tsh join <session-id>               # Join session của người khác (pair programming)
tsh recordings ls                   # List recorded sessions

# === Clusters ===
tsh clusters                        # Liệt kê tất cả clusters
tsh login --proxy=other-cluster.com # Login cluster khác
```

---

## 5. Multi-Factor Authentication (MFA)

```yaml
# Trong auth_service config:
auth_service:
  enabled: true
  authentication:
    type: local           # local | github | oidc | saml
    second_factor: otp    # off | otp | webauthn | optional | on
    webauthn:
      rp_id: my-teleport.example.com
```

```bash
# Thêm TOTP (Google Authenticator)
tsh mfa add
# Chọn: TOTP
# Scan QR code với app authenticator

# Thêm Hardware Key (YubiKey)
tsh mfa add
# Chọn: WEBAUTHN

# List MFA devices
tsh mfa ls

# Xóa MFA device
tsh mfa rm my-yubikey
```

---

## 6. Trusted Clusters (Multi-Cluster)

```yaml
# Trust từ leaf cluster sang root cluster
# trusted_cluster.yaml
kind: trusted_cluster
version: v2
metadata:
  name: leaf-cluster
spec:
  enabled: true
  token: root-trust-token
  # Address của root cluster
  web_proxy_addr: root.example.com:443
  # Map roles từ leaf sang root
  role_map:
    - remote: "developer"      # Role ở leaf cluster
      local: ["developer"]     # Map sang role ở root

# Apply ở leaf cluster
tctl create -f trusted_cluster.yaml
```

```bash
# Từ root cluster, access leaf cluster nodes
tsh ls --cluster=leaf-cluster

# SSH vào node ở leaf cluster
tsh ssh --cluster=leaf-cluster ubuntu@leaf-server-01
```

---

➡️ Tiếp theo: [02_rbac.md](02_rbac.md)
