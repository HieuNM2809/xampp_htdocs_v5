# 🔴 LEVEL 3: Kubernetes Access

## 1. Kubernetes Integration

### Cách Teleport Hoạt Động Với K8s

```
User (tsh) → Teleport Proxy → Teleport K8s Agent → Kubernetes API Server
              |
              └→ RBAC check, audit log, session record
```

### Setup K8s Agent

```yaml
# config/teleport-kube.yaml
version: v3
teleport:
  data_dir: /var/lib/teleport
  auth_token: kube-join-token-12345
  auth_servers:
    - teleport-auth:3025

auth_service:
  enabled: false
proxy_service:
  enabled: false

kubernetes_service:
  enabled: true
  listen_addr: 0.0.0.0:3026
  
  # Kubernetes clusters để expose qua Teleport
  kubeconfig_file: /var/lib/teleport/kube.yaml
  
  # Labels cho cluster này
  labels:
    env: production
    region: ap-southeast-1
  
  # Tên cluster trong Teleport
  kube_cluster_name: prod-k8s-cluster
```

```yaml
# docker-compose với K8s agent
# docker-compose.k8s.yml
version: '3.8'

services:
  teleport-kube-agent:
    image: goteleport/teleport:16
    container_name: teleport-kube-agent
    volumes:
      - ./config/teleport-kube.yaml:/etc/teleport/teleport.yaml:ro
      - ~/.kube/config:/var/lib/teleport/kube.yaml:ro
    command: ["teleport", "start", "--config=/etc/teleport/teleport.yaml"]
    networks:
      - teleport-net

networks:
  teleport-net:
    external: true
```

---

## 2. Kubernetes RBAC với Teleport

```yaml
# Role cho phép access K8s cluster
kind: role
version: v7
metadata:
  name: k8s-developer
spec:
  allow:
    # Labels của K8s cluster phải match
    kubernetes_labels:
      env: ["staging"]
    
    # Groups trong K8s RBAC
    kubernetes_groups: ["developers", "system:authenticated"]
    
    # Fine-grained K8s resource access
    kubernetes_resources:
      - kind: pod
        namespace: "default"
        name: "*"
        verbs: ["get", "list", "watch", "exec"]
      
      - kind: deployment
        namespace: "default"  
        name: "*"
        verbs: ["get", "list", "watch"]
      
      - kind: secret
        namespace: "kube-system"
        name: "*"
        verbs: []  # Không có quyền gì với secrets
```

```yaml
# Trong K8s cluster, tạo ClusterRoleBinding cho Teleport
# teleport-k8s-rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: teleport-role
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods/exec", "pods/log"]
    verbs: ["create", "get"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: teleport-binding
subjects:
  - kind: Group
    name: developers     # Match với kubernetes_groups trong Teleport role
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: teleport-role
  apiGroup: rbac.authorization.k8s.io
```

---

## 3. Sử Dụng kubectl Qua Teleport

```bash
# Login vào Teleport
tsh login --proxy=teleport.example.com --user=alice

# Liệt kê K8s clusters qua Teleport
tsh kube ls

# OUTPUT:
# Kube Cluster Name   Labels             Selected
# ─────────────────── ─────────────────── ────────
# prod-k8s-cluster    env=production      
# staging-k8s         env=staging         

# Login vào K8s cluster
tsh kube login prod-k8s-cluster

# Bây giờ kubectl hoạt động qua Teleport!
kubectl get pods -n default

# Switch cluster
tsh kube login staging-k8s
kubectl get pods

# Xem kubeconfig đang dùng
tsh kube credentials prod-k8s-cluster

# Chạy kubectl exec (Teleport sẽ ghi lại)
kubectl exec -it my-pod -- /bin/bash

# Port forward qua Teleport
kubectl port-forward svc/my-service 8080:80
```

---

## 4. Database Access

### Cấu Hình Database Service

```yaml
# config/teleport-db.yaml
version: v3
teleport:
  data_dir: /var/lib/teleport
  auth_token: db-join-token-12345
  auth_servers:
    - teleport-auth:3025

auth_service:
  enabled: false
proxy_service:
  enabled: false

db_service:
  enabled: true
  
  databases:
    # PostgreSQL
    - name: prod-postgres
      description: "Production PostgreSQL"
      protocol: postgres
      uri: postgres-server:5432
      labels:
        env: production
        team: backend
    
    # MySQL
    - name: staging-mysql
      description: "Staging MySQL"
      protocol: mysql
      uri: mysql-server:3306
      labels:
        env: staging
    
    # MongoDB
    - name: analytics-mongo
      description: "Analytics MongoDB"
      protocol: mongodb
      uri: mongo-server:27017
      labels:
        env: production
        team: analytics
    
    # Redis
    - name: cache-redis
      description: "Redis Cache"
      protocol: redis
      uri: redis:6379
      labels:
        env: production
```

### Docker Compose với Database

```yaml
# docker-compose.db.yml
version: '3.8'

services:
  # PostgreSQL target
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: appdb
    networks:
      - teleport-net

  # MySQL target
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: appdb
    networks:
      - teleport-net

  # Teleport Database Service
  teleport-db:
    image: goteleport/teleport:16
    volumes:
      - ./config/teleport-db.yaml:/etc/teleport/teleport.yaml:ro
    depends_on:
      - postgres
      - mysql
    networks:
      - teleport-net

networks:
  teleport-net:
    external: true
```

### Kết Nối Database Qua Teleport

```bash
# Login Teleport
tsh login --proxy=teleport.example.com --user=alice

# Liệt kê databases
tsh db ls

# OUTPUT:
# Name            Description           Labels
# ─────────────── ───────────────────── ──────────────
# prod-postgres   Production PostgreSQL env=production
# staging-mysql   Staging MySQL         env=staging

# Kết nối PostgreSQL (Teleport tạo local proxy)
tsh db connect prod-postgres --db-user=readonly --db-name=appdb

# Hoặc tạo local proxy thủ công
tsh db proxy prod-postgres \
  --db-user=readonly \
  --db-name=appdb \
  --port=5432 &

# Sau đó dùng psql bình thường
psql "host=localhost port=5432 dbname=appdb user=readonly"

# Kết nối MySQL
tsh db connect staging-mysql --db-user=app --db-name=appdb

# MySQL proxy
tsh db proxy staging-mysql --db-user=app --port=3306 &
mysql -h 127.0.0.1 -P 3306 -u app appdb

# Xem active database sessions
tsh db ls --active

# Logout database  
tsh db logout prod-postgres
```

### Auto User Creation (Database)

```yaml
# Database role với auto-provision
kind: role
version: v7
metadata:
  name: db-auto-user
spec:
  allow:
    db_labels:
      env: ["staging"]
    db_names: ["*"]
    db_users: ["{{internal.username}}"]  # Tự động tạo DB user cùng tên Teleport user
  options:
    # Tự động tạo và xóa DB user
    create_db_user: true          # PostgreSQL tự động tạo user
    create_db_user_mode: keep    # keep | best_effort | off
```

---

## 5. Application Access (Web Apps)

```yaml
# config/teleport-app.yaml
app_service:
  enabled: true
  
  apps:
    # Internal dashboard không có auth
    - name: grafana
      description: "Grafana Monitoring"
      uri: http://grafana:3000
      labels:
        team: ops
        env: production
      # Rewrite headers
      rewrite:
        redirect:
          - "http://grafana:3000"
          - "http://localhost:3000"
    
    # Jenkins với JWT auth
    - name: jenkins
      description: "Jenkins CI/CD"
      uri: http://jenkins:8080
      labels:
        team: devops
      # Dùng JWT để truyền user info
      rewrite:
        headers:
          - "Authorization: Bearer {{internal.jwt}}"
    
    # Internal API
    - name: internal-api
      description: "Private API"
      uri: http://api-server:8000
      labels:
        team: backend
      # Public URL qua Teleport proxy
      public_addr: api.teleport.example.com
```

```bash
# Liệt kê apps
tsh apps ls

# Login app (mở browser)
tsh apps login grafana

# Lấy URL và credentials
tsh apps config grafana

# Dùng curl qua app proxy
eval $(tsh apps config grafana --format=curl)
curl "$TELEPORT_APP_URL/api/health"

# Logout app
tsh apps logout grafana
```

---

## 6. Windows Desktop Access (RDP)

```yaml
# config/teleport-windows.yaml
version: v3
teleport:
  data_dir: /var/lib/teleport
  auth_token: windows-join-token
  auth_servers:
    - teleport-auth:3025

windows_desktop_service:
  enabled: true
  
  # Active Directory configuration
  ldap:
    addr: dc.company.local:636
    domain: company.local
    username: "COMPANY\\svc-teleport"
    server_name: dc.company.local
    insecure_skip_verify: false
    der_ca_file: /etc/teleport/windows-ca.cer
  
  # Tự động discover máy từ AD
  discovery:
    base_dn: "OU=Computers,DC=company,DC=local"
  
  # Hoặc define thủ công
  static_hosts:
    - name: dev-workstation
      ad: true
      addr: 192.168.1.100
      labels:
        env: dev
        team: development
```

```bash
# Liệt kê Windows desktops
tsh desktops ls

# Kết nối (mở Web UI RDP session)
tsh desktop connect dev-workstation --login=alice
```

---

➡️ Tiếp theo: [02_audit_advanced.md](02_audit_advanced.md)
