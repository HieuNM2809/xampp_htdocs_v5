# 🚀 Quick Start - Teleport Docker Demo

## Chạy Ngay Trong 5 Phút

```bash
# Bước 1: Clone repo hoặc tạo thư mục
mkdir teleport-quickstart && cd teleport-quickstart

# Bước 2: Tạo config đơn giản nhất
cat > teleport.yaml << 'EOF'
version: v3
teleport:
  nodename: quickstart
  data_dir: /var/lib/teleport
auth_service:
  enabled: true
  cluster_name: quickstart-cluster
  tokens:
    - "node:mytoken123"
proxy_service:
  enabled: true
  web_listen_addr: 0.0.0.0:3080
  listen_addr: 0.0.0.0:3023
  tunnel_listen_addr: 0.0.0.0:3024
ssh_service:
  enabled: true
  labels:
    env: demo
EOF

# Bước 3: Chạy Teleport
docker run -d \
  --name teleport \
  -p 3080:3080 \
  -p 3023:3023 \
  -p 3024:3024 \
  -p 3025:3025 \
  -v $(pwd)/teleport.yaml:/etc/teleport/teleport.yaml \
  -v teleport-data:/var/lib/teleport \
  goteleport/teleport:16 \
  teleport start --config=/etc/teleport/teleport.yaml --insecure-no-tls

# Bước 4: Tạo admin user
docker exec teleport \
  tctl users add admin \
  --roles=editor,access \
  --logins=root,ubuntu

# Copy URL và mở browser!
```

---

## Teleport CLI Cheat Sheet

```bash
# ===== tsh - User CLI =====
tsh login --proxy=localhost:3080 --insecure --user=admin
tsh logout
tsh status

tsh ls                              # Xem nodes
tsh ssh ubuntu@hostname             # SSH
tsh scp file.txt ubuntu@host:/tmp   # Copy file

tsh kube ls                         # Xem K8s clusters
tsh kube login cluster-name         # Login K8s

tsh db ls                           # Xem databases
tsh db connect db-name              # Kết nối DB

tsh apps ls                         # Xem apps
tsh apps login app-name             # Login app

# ===== tctl - Admin CLI =====
tctl status                         # Cluster status
tctl users ls                       # List users
tctl users add username --roles=... # Tạo user
tctl users rm username              # Xóa user

tctl nodes ls                       # List nodes
tctl tokens ls                      # List tokens
tctl tokens add --type=node         # Tạo token

tctl create -f role.yaml            # Tạo role từ file
tctl get roles                      # Xem tất cả roles
tctl get role/rolename              # Xem role cụ thể
tctl rm role/rolename               # Xóa role

tctl events get --format=json       # Audit log
tctl recordings ls                  # List recordings

tctl lock --user=alice --ttl=1h     # Lock user
tctl locks ls                       # List locks
```

---

## Teleport Versions

| Version | Tính năng nổi bật |
|---------|-------------------|
| v16 (2024) | Machine ID v2, Audit Log to S3, Enhanced K8s |
| v15 | Access Graph, Device Trust |
| v14 | Teleport Policy, SCIM provisioning |
| v13 | MachineID mTLS, Postgres auto-user |

```bash
# Kiểm tra version đang chạy
docker exec teleport teleport version

# Xem latest version
curl -s https://api.github.com/repos/gravitational/teleport/releases/latest \
  | jq -r .tag_name
```

---

## So Sánh: Teleport OSS vs Enterprise vs Cloud

| Tính năng | OSS | Enterprise | Cloud |
|-----------|-----|------------|-------|
| SSH, K8s, DB, App | ✅ | ✅ | ✅ |
| RBAC | ✅ | ✅ | ✅ |
| GitHub SSO | ✅ | ✅ | ✅ |
| SAML/OIDC SSO | ❌ | ✅ | ✅ |
| FedRAMP compliance | ❌ | ✅ | ✅ |
| Access Requests | Basic | ✅ | ✅ |
| Device Trust | ❌ | ✅ | ✅ |
| Support | Community | 24/7 | 24/7 |
| Giá | Free | Custom | Usage-based |

---

## Tài Liệu Tham Khảo

- 📖 [Documentation](https://goteleport.com/docs/)
- 🐙 [GitHub](https://github.com/gravitational/teleport)
- 🐳 [Docker Hub](https://hub.docker.com/r/goteleport/teleport)
- 🎓 [Tutorials](https://goteleport.com/docs/getting-started/)
- 📺 [YouTube](https://www.youtube.com/@GoteleportHQ)
- 💬 [Slack Community](https://goteleport.com/slack)
- 📝 [Blog](https://goteleport.com/blog/)
