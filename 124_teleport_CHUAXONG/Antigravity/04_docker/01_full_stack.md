# 🐳 Docker Compose - Full Production Stack

## Cấu Trúc Thư Mục

```
teleport-production/
├── docker-compose.yml          # Main compose file
├── config/
│   ├── teleport-auth.yaml      # Auth server config
│   ├── teleport-proxy.yaml     # Proxy server config
│   ├── teleport-node.yaml      # SSH node config
│   ├── teleport-db.yaml        # Database service config
│   └── teleport-app.yaml       # App access config
├── certs/
│   └── (TLS certificates)
└── data/
    ├── auth/
    ├── proxy/
    └── node/
```

---

## Config Files

### Auth Server (config/teleport-auth.yaml)

```yaml
version: v3
teleport:
  nodename: teleport-auth-01
  data_dir: /var/lib/teleport
  log:
    output: stderr
    severity: INFO

auth_service:
  enabled: true
  cluster_name: my-production-cluster
  listen_addr: 0.0.0.0:3025
  
  # Authentication: local + GitHub
  authentication:
    type: local
    second_factor: otp
  
  # Join tokens
  tokens:
    - "node:secure-node-token-$(openssl rand -hex 16)"
    - "kube:secure-kube-token-$(openssl rand -hex 16)"
    - "db:secure-db-token-$(openssl rand -hex 16)"
    - "app:secure-app-token-$(openssl rand -hex 16)"
  
  # Audit log - lưu vào file
  audit_events_uri:
    - file:///var/lib/teleport/audit/events
  audit_sessions_uri: file:///var/lib/teleport/audit/sessions

proxy_service:
  enabled: false

ssh_service:
  enabled: false
```

### Proxy Server (config/teleport-proxy.yaml)

```yaml
version: v3
teleport:
  nodename: teleport-proxy-01
  data_dir: /var/lib/teleport
  auth_servers:
    - teleport-auth:3025

auth_service:
  enabled: false

proxy_service:
  enabled: true
  
  # Public address (dùng domain thật trong production)
  public_addr: teleport.example.com:443
  
  web_listen_addr: 0.0.0.0:443
  tunnel_listen_addr: 0.0.0.0:3024
  
  # Kubernetes proxy
  kube_listen_addr: 0.0.0.0:3026
  kube_public_addr: teleport.example.com:3026
  
  # MySQL proxy
  mysql_listen_addr: 0.0.0.0:3036
  
  # PostgreSQL proxy
  postgres_listen_addr: 0.0.0.0:5432
  
  # MongoDB proxy
  mongo_listen_addr: 0.0.0.0:27017
  
  # TLS - dùng Let's Encrypt trong production
  # acme:
  #   enabled: true
  #   email: admin@example.com
  
  # Hoặc manual cert
  https_keypairs:
    - key_file: /certs/privkey.pem
      cert_file: /certs/fullchain.pem

ssh_service:
  enabled: false
```

### SSH Node (config/teleport-node.yaml)

```yaml
version: v3
teleport:
  nodename: demo-node-01
  data_dir: /var/lib/teleport
  auth_token: secure-node-token
  auth_servers:
    - teleport-auth:3025

auth_service:
  enabled: false
proxy_service:
  enabled: false

ssh_service:
  enabled: true
  listen_addr: 0.0.0.0:3022
  labels:
    env: demo
    role: webserver
    os: ubuntu
  commands:
    - name: hostname
      command: [hostname]
      period: 1m
```

### Database Service (config/teleport-db.yaml)

```yaml
version: v3
teleport:
  data_dir: /var/lib/teleport
  auth_token: secure-db-token
  auth_servers:
    - teleport-auth:3025

auth_service:
  enabled: false
proxy_service:
  enabled: false

db_service:
  enabled: true
  databases:
    - name: demo-postgres
      description: "Demo PostgreSQL"
      protocol: postgres
      uri: postgres-demo:5432
      labels:
        env: demo
```

---

## Docker Compose Main File

```yaml
# docker-compose.yml
version: '3.8'

services:
  # =========================================
  # TELEPORT AUTH SERVER
  # =========================================
  teleport-auth:
    image: goteleport/teleport:16
    container_name: teleport-auth
    hostname: teleport-auth
    volumes:
      - ./config/teleport-auth.yaml:/etc/teleport/teleport.yaml:ro
      - teleport-auth-data:/var/lib/teleport
    command: ["teleport", "start", "--config=/etc/teleport/teleport.yaml"]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "teleport", "status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - teleport-internal
    # Auth server không expose ra ngoài
    # chỉ communicate nội bộ

  # =========================================
  # TELEPORT PROXY SERVER
  # =========================================
  teleport-proxy:
    image: goteleport/teleport:16
    container_name: teleport-proxy
    hostname: teleport-proxy
    depends_on:
      teleport-auth:
        condition: service_healthy
    ports:
      - "443:443"       # Web UI + HTTPS
      - "3023:3023"     # SSH Proxy
      - "3024:3024"     # Reverse tunnel
      - "3026:3026"     # Kubernetes proxy
      - "3036:3036"     # MySQL proxy
    volumes:
      - ./config/teleport-proxy.yaml:/etc/teleport/teleport.yaml:ro
      - ./certs:/certs:ro
      - teleport-proxy-data:/var/lib/teleport
    command: ["teleport", "start", "--config=/etc/teleport/teleport.yaml"]
    restart: unless-stopped
    networks:
      - teleport-internal
      - teleport-external

  # =========================================
  # SSH NODE (target server)
  # =========================================
  teleport-node:
    image: goteleport/teleport:16
    container_name: teleport-node
    hostname: demo-node-01
    depends_on:
      teleport-auth:
        condition: service_healthy
    volumes:
      - ./config/teleport-node.yaml:/etc/teleport/teleport.yaml:ro
      - teleport-node-data:/var/lib/teleport
    command: ["teleport", "start", "--config=/etc/teleport/teleport.yaml"]
    restart: unless-stopped
    # Giả lập một "Linux server" với các service
    environment:
      - DEBIAN_FRONTEND=noninteractive
    networks:
      - teleport-internal

  # =========================================
  # SECOND SSH NODE
  # =========================================
  teleport-node-02:
    image: goteleport/teleport:16
    container_name: teleport-node-02
    hostname: demo-node-02
    depends_on:
      teleport-auth:
        condition: service_healthy
    volumes:
      - teleport-node02-data:/var/lib/teleport
    # Dùng command trực tiếp - development friendly
    command: >
      teleport start
      --roles=node
      --auth-server=teleport-auth:3025
      --token=secure-node-token
      --nodename=demo-node-02
      --labels=env=staging,role=database-server
    restart: unless-stopped
    networks:
      - teleport-internal

  # =========================================
  # DATABASE SERVICE
  # =========================================
  teleport-db-service:
    image: goteleport/teleport:16
    container_name: teleport-db-service
    depends_on:
      teleport-auth:
        condition: service_healthy
      postgres-demo:
        condition: service_healthy
    volumes:
      - ./config/teleport-db.yaml:/etc/teleport/teleport.yaml:ro
      - teleport-db-data:/var/lib/teleport
    command: ["teleport", "start", "--config=/etc/teleport/teleport.yaml"]
    restart: unless-stopped
    networks:
      - teleport-internal

  # =========================================
  # DEMO DATABASES
  # =========================================
  postgres-demo:
    image: postgres:15-alpine
    container_name: postgres-demo
    environment:
      POSTGRES_DB: demoapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: demo_password_123
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts/postgres:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d demoapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - teleport-internal

  mysql-demo:
    image: mysql:8
    container_name: mysql-demo
    environment:
      MYSQL_ROOT_PASSWORD: demo_root_password
      MYSQL_DATABASE: demoapp
      MYSQL_USER: app_user
      MYSQL_PASSWORD: demo_password_123
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - teleport-internal

  # =========================================
  # MONITORING (optional)
  # =========================================
  grafana:
    image: grafana/grafana:latest
    container_name: grafana-demo
    ports:
      - "3000:3000"
    environment:
      GF_AUTH_ANONYMOUS_ENABLED: "true"
      GF_AUTH_ANONYMOUS_ORG_ROLE: "Admin"
    networks:
      - teleport-internal

# =========================================
# VOLUMES
# =========================================
volumes:
  teleport-auth-data:
  teleport-proxy-data:
  teleport-node-data:
  teleport-node02-data:
  teleport-db-data:
  postgres-data:
  mysql-data:

# =========================================
# NETWORKS
# =========================================
networks:
  # Internal network - services communicate
  teleport-internal:
    driver: bridge
    internal: false
  
  # External network - chỉ proxy tiếp xúc internet
  teleport-external:
    driver: bridge
```

---

## Init Scripts

```sql
-- init-scripts/postgres/01_setup.sql
-- Tạo readonly user (Teleport sẽ dùng)
CREATE USER readonly WITH PASSWORD 'readonly_pass';
GRANT CONNECT ON DATABASE demoapp TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;

-- Tạo app_user
CREATE USER app_user WITH PASSWORD 'app_pass_123';
GRANT ALL PRIVILEGES ON DATABASE demoapp TO app_user;

-- Sample data
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO users (username, email) VALUES
    ('alice', 'alice@example.com'),
    ('bob', 'bob@example.com'),
    ('charlie', 'charlie@example.com');
```

---

## Makefile - Shortcut Commands

```makefile
# Makefile
.PHONY: up down logs init-admin node-ls user-ls

# Khởi động tất cả services
up:
	docker-compose up -d
	@echo "Waiting for services to start..."
	@sleep 10
	@echo "Teleport Web UI: https://localhost"

# Dừng services
down:
	docker-compose down

# Xem logs
logs:
	docker-compose logs -f

logs-auth:
	docker-compose logs -f teleport-auth

logs-proxy:
	docker-compose logs -f teleport-proxy

# Tạo admin user lần đầu
init-admin:
	docker exec teleport-auth \
		tctl users add superadmin \
		--roles=editor,access \
		--logins=root,ubuntu,admin
	@echo "Truy cập URL ở trên để đặt password!"

# Liệt kê nodes
node-ls:
	docker exec teleport-auth tctl nodes ls

# Liệt kê users
user-ls:
	docker exec teleport-auth tctl users ls

# Liệt kê auth tokens
token-ls:
	docker exec teleport-auth tctl tokens ls

# Xem cluster status
status:
	docker exec teleport-auth tctl status

# Xem audit events
audit:
	docker exec teleport-auth tctl events get --format=json | jq '.'

# Tạo invite link cho user mới
invite:
	@read -p "Username: " user; \
	docker exec teleport-auth tctl users add $$user \
		--roles=developer \
		--logins=ubuntu,$$user

# Health check
health:
	curl -sk https://localhost/webapi/ping | jq '.server_version'
```

---

## Chạy và Kiểm Tra

```bash
# 1. Khởi động toàn bộ stack
docker-compose up -d

# 2. Theo dõi log
docker-compose logs -f

# 3. Chờ auth healthy (khoảng 30-60 giây)
docker-compose ps

# 4. Tạo admin user đầu tiên
docker exec teleport-auth \
  tctl users add admin \
  --roles=editor,access \
  --logins=root,ubuntu

# 5. Truy cập Web UI
# https://localhost (accept self-signed cert)

# 6. Login bằng tsh
tsh login --proxy=localhost:443 --insecure --user=admin

# 7. Xem nodes
tsh ls

# 8. SSH vào demo node
tsh ssh ubuntu@demo-node-01

# 9. Kết nối database
tsh db ls
tsh db connect demo-postgres --db-user=readonly --db-name=demoapp

# 10. Xem audit log
tsh recordings ls
```

---

## Troubleshooting

```bash
# Xem logs chi tiết
docker-compose logs teleport-auth 2>&1 | grep -E "ERROR|WARN"

# Restart một service cụ thể
docker-compose restart teleport-proxy

# Vào trong container để debug
docker exec -it teleport-auth bash
  > teleport status
  > tctl status

# Xóa data và bắt đầu lại
docker-compose down -v
docker-compose up -d

# Kiểm tra network
docker network ls
docker network inspect teleport_teleport-internal

# Kiểm tra ports
netstat -tlnp | grep -E "443|3023|3024|3025"
```
