# 🐳 Cài Đặt Teleport Bằng Docker

## Setup 1: Single Node (All-in-One) - Dành cho học tập

Đây là cách nhanh nhất để chạy Teleport local với Docker.

### Bước 1: Tạo cấu trúc thư mục

```bash
mkdir -p teleport-demo/{config,data,logs}
cd teleport-demo
```

### Bước 2: Tạo file cấu hình Teleport

```yaml
# config/teleport.yaml
version: v3
teleport:
  nodename: teleport-demo
  data_dir: /var/lib/teleport
  log:
    output: stderr
    severity: INFO
    format:
      output: text

auth_service:
  enabled: true
  cluster_name: demo-cluster
  listen_addr: 0.0.0.0:3025
  tokens:
    # Token để node SSH join cluster
    - "node:demo-node-token-12345"
    # Token để kube agent join cluster  
    - "kube:demo-kube-token-12345"

proxy_service:
  enabled: true
  listen_addr: 0.0.0.0:3023
  web_listen_addr: 0.0.0.0:443
  tunnel_listen_addr: 0.0.0.0:3024
  # Tắt HTTPS verification cho local dev
  https_keypairs: []
  acme: {}

ssh_service:
  enabled: true
  listen_addr: 0.0.0.0:3022
  labels:
    env: demo
    role: all-in-one
```

### Bước 3: Docker Compose cơ bản

```yaml
# docker-compose.yml
version: '3.8'

services:
  teleport:
    image: goteleport/teleport:16
    container_name: teleport-demo
    ports:
      - "443:443"       # Web UI
      - "3023:3023"     # SSH Proxy
      - "3024:3024"     # Tunnel
      - "3025:3025"     # Auth gRPC
    volumes:
      - ./config/teleport.yaml:/etc/teleport/teleport.yaml:ro
      - ./data:/var/lib/teleport
      - ./logs:/var/log/teleport
    command: ["teleport", "start", "--config=/etc/teleport/teleport.yaml"]
    restart: unless-stopped
    # Cần quyền cao hơn để tạo network interfaces
    cap_add:
      - NET_ADMIN
    networks:
      - teleport-net

networks:
  teleport-net:
    driver: bridge
```

### Bước 4: Khởi động

```bash
# Chạy Teleport
docker-compose up -d

# Xem log
docker-compose logs -f teleport

# Kiểm tra status
docker-compose ps
```

### Bước 5: Tạo Admin User đầu tiên

```bash
# Tạo invite token cho user admin
docker exec teleport-demo \
  tctl users add admin \
  --roles=editor,access \
  --logins=root,ubuntu,ec2-user

# Output sẽ có URL dạng:
# https://localhost/web/invite/xxxxxxxx
# Truy cập URL đó để đặt password + OTP
```

---

## Setup 2: Docker Compose với Local HTTPS (Self-signed cert)

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  teleport:
    image: goteleport/teleport:16
    container_name: teleport-dev
    hostname: localhost
    ports:
      - "3080:3080"     # Web UI (HTTP mode cho local)
      - "3023:3023"     # SSH Proxy
      - "3024:3024"     # Tunnel
      - "3025:3025"     # Auth gRPC
    volumes:
      - teleport-data:/var/lib/teleport
    # Dùng command trực tiếp thay vì config file
    command: >
      teleport start
      --roles=proxy,auth,node
      --insecure-no-tls
      --auth-server=localhost
      --token=devtoken123
      --labels=env=dev
    environment:
      - TELEPORT_LOG_LEVEL=DEBUG
    networks:
      - teleport-net

volumes:
  teleport-data:

networks:
  teleport-net:
```

---

## Setup 3: Sử Dụng `teleport configure` (Được Khuyến Nghị)

```bash
# Bước 1: Generate config tự động
docker run --rm goteleport/teleport:16 \
  teleport configure \
  --cluster-name=my-cluster.example.com \
  --output=/dev/stdout > config/teleport.yaml

# Bước 2: Xem và chỉnh sửa file vừa tạo
cat config/teleport.yaml
```

---

## Setup 4: Docker Compose Full Stack với PostgreSQL (Auth Storage)

```yaml
# docker-compose.full.yml
version: '3.8'

services:
  # Backend storage cho Teleport (thay thế SQLite mặc định)
  postgres:
    image: postgres:15-alpine
    container_name: teleport-postgres
    environment:
      POSTGRES_DB: teleport
      POSTGRES_USER: teleport
      POSTGRES_PASSWORD: teleport_secure_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - teleport-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U teleport"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Teleport Auth Server
  teleport-auth:
    image: goteleport/teleport:16
    container_name: teleport-auth
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./config/teleport-auth.yaml:/etc/teleport/teleport.yaml:ro
      - teleport-auth-data:/var/lib/teleport
    command: ["teleport", "start", "--config=/etc/teleport/teleport.yaml"]
    networks:
      - teleport-net

  # Teleport Proxy Server  
  teleport-proxy:
    image: goteleport/teleport:16
    container_name: teleport-proxy
    depends_on:
      - teleport-auth
    ports:
      - "443:443"
      - "3023:3023"
      - "3024:3024"
    volumes:
      - ./config/teleport-proxy.yaml:/etc/teleport/teleport.yaml:ro
      - teleport-proxy-data:/var/lib/teleport
    command: ["teleport", "start", "--config=/etc/teleport/teleport.yaml"]
    networks:
      - teleport-net

  # Teleport Node (SSH target)
  teleport-node:
    image: goteleport/teleport:16
    container_name: teleport-node
    depends_on:
      - teleport-auth
    volumes:
      - ./config/teleport-node.yaml:/etc/teleport/teleport.yaml:ro
    command: ["teleport", "start", "--config=/etc/teleport/teleport.yaml"]
    networks:
      - teleport-net
    labels:
      - "teleport.env=demo"

volumes:
  postgres-data:
  teleport-auth-data:
  teleport-proxy-data:

networks:
  teleport-net:
    driver: bridge
```

---

## Kiểm Tra Sau Khi Cài Đặt

```bash
# 1. Kiểm tra health của Teleport
curl -k https://localhost/webapi/ping

# Response mong đợi:
# {"server_version":"16.x.x","cluster_name":"demo-cluster",...}

# 2. Liệt kê nodes trong cluster
docker exec teleport-demo tctl nodes ls

# 3. Liệt kê users
docker exec teleport-demo tctl users ls

# 4. Kiểm tra auth service
docker exec teleport-demo tctl status
```

---

## Cài Đặt `tsh` Client (CLI để kết nối)

```bash
# macOS
brew install teleport

# Linux (Ubuntu/Debian)
curl https://goteleport.com/static/install.sh | bash -s 16

# Windows (PowerShell)
winget install Teleport

# Hoặc download binary trực tiếp từ:
# https://goteleport.com/download/
```

### Các Lệnh `tsh` Cơ Bản

```bash
# Login vào cluster
tsh login --proxy=localhost:443 --insecure --user=admin

# Liệt kê servers có thể SSH
tsh ls

# SSH vào một server
tsh ssh ubuntu@server-name

# Logout
tsh logout

# Kiểm tra trạng thái đăng nhập
tsh status
```

---

➡️ Tiếp theo: [../02_intermediate/01_ssh_access.md](../02_intermediate/01_ssh_access.md)
