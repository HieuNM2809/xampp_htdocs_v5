# 📗 LEVEL 1: Teleport Cơ Bản

## 1. Teleport Là Gì?

**Teleport** (hay còn gọi là **Gravitational Teleport**) là một **Access Plane** (mặt phẳng truy cập) mã nguồn mở, cho phép các kỹ sư DevOps/SRE/Developer truy cập vào:

- 🖥️ **SSH** - Máy chủ Linux
- ☸️ **Kubernetes** - Cluster K8s
- 🗄️ **Databases** - PostgreSQL, MySQL, MongoDB, Redis,...
- 🌐 **Web Apps** - HTTP/HTTPS applications (internal)
- 🪟 **Windows** - Remote Desktop Protocol (RDP)

### Vấn Đề Teleport Giải Quyết

```
TRƯỚC KHI CÓ TELEPORT:
┌─────────────────────────────────────────────────┐
│  Dev A → SSH Key A → Server 1                  │
│  Dev B → SSH Key B → Server 1                  │
│  Dev A → VPN → internal-db:5432                │
│  Dev B → VPN + Bastion → staging-k8s           │
│  ⚠️ Không ai biết ai làm gì, không có audit log│
└─────────────────────────────────────────────────┘

SAU KHI CÓ TELEPORT:
┌─────────────────────────────────────────────────┐
│  Dev A ──┐                                      │
│  Dev B ──┤→ Teleport Proxy → Server 1          │
│  Dev C ──┤→ Teleport Proxy → internal-db        │
│           └→ Teleport Proxy → staging-k8s       │
│  ✅ Một điểm truy cập, RBAC, audit log đầy đủ  │
└─────────────────────────────────────────────────┘
```

## 2. Kiến Trúc Teleport

```
┌──────────────────────────────────────────────────────────────┐
│                    TELEPORT ARCHITECTURE                      │
│                                                              │
│  ┌──────────┐  HTTPS/WSS  ┌──────────────────────────────┐  │
│  │  Client  │────────────→│      Teleport Proxy           │  │
│  │(tsh CLI) │←────────────│   (Port 443, 3023, 3024)     │  │
│  └──────────┘             └──────────────┬───────────────┘  │
│                                          │ mTLS                │
│                                          ↓                    │
│                           ┌──────────────────────────────┐   │
│                           │      Teleport Auth Server     │   │
│                           │  (Certificates, Audit, RBAC) │   │
│                           └───────┬──────────────────────┘   │
│                                   │                           │
│              ┌────────────────────┼────────────────────┐     │
│              ↓                    ↓                    ↓     │
│     ┌─────────────┐    ┌─────────────┐    ┌──────────────┐  │
│     │  SSH Node   │    │  K8s Agent  │    │  DB Agent    │  │
│     │ (tele agent)│    │ (tele agent)│    │ (tele agent) │  │
│     └─────────────┘    └─────────────┘    └──────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Các Thành Phần Chính

| Thành phần | Mô tả |
|-----------|-------|
| **Auth Server** | Cấp phát certificates, lưu trữ audit log, quản lý RBAC |
| **Proxy Server** | Điểm vào duy nhất, reverse proxy, handle TLS |
| **Node/Agent** | Chạy trên các máy cần truy cập |
| **tsh** | CLI tool cho end-users |
| **tctl** | Admin CLI tool |
| **Web UI** | Giao diện web browser |

## 3. Teleport vs Traditional Access

| Tính năng | SSH thuần | VPN | Teleport |
|-----------|-----------|-----|----------|
| Quản lý key | Manual | N/A | ✅ Automatic cert |
| MFA | ❌ | Tùy | ✅ Built-in |
| Session recording | ❌ | ❌ | ✅ Built-in |
| Audit log | ❌ | Limited | ✅ Full detail |
| RBAC | ❌ | Limited | ✅ Fine-grained |
| Single Sign-On | ❌ | Tùy | ✅ (GitHub, Google, Okta) |
| Short-lived certs | ❌ | N/A | ✅ (default 12h) |

## 4. Concepts Quan Trọng

### Certificate-Based Auth
```
Thay vì SSH keys tĩnh → Teleport cấp certificates tạm thời:
- Default TTL: 12 giờ
- Tự động expire → không cần revoke thủ công
- Signed bởi Teleport CA → máy chủ tin tưởng

Flow:
User login → MFA → Teleport Auth → Issue Cert (12h) → SSH vào node
```

### Roles & RBAC
```yaml
# Ví dụ: Role chỉ cho phép SSH vào production với user "ec2-user"
kind: role
version: v7
metadata:
  name: prod-readonly
spec:
  allow:
    logins: ["ec2-user"]
    node_labels:
      env: ["production"]
    # Chỉ được phép đọc, không ghi
  deny:
    logins: ["root"]
```

### Labels & Node Selection
```
# Máy chủ được gắn labels:
Node 1: env=production, region=us-east
Node 2: env=staging, region=eu-west

# User với role "dev" chỉ access được env=staging
# User với role "ops" access được tất cả
```

## 5. Ports Teleport Sử Dụng

| Port | Protocol | Mục đích |
|------|----------|----------|
| 443 | HTTPS/WSS | Web UI & tunnel |
| 3023 | SSH | Proxy SSH port |
| 3024 | SSH | Tunnel từ node về proxy |
| 3025 | gRPC | Auth Server API |
| 3026 | HTTPS | K8s proxy port |
| 3028 | HTTPS | MySQL proxy port |

---
➡️ Tiếp theo: [02_docker_setup.md](02_docker_setup.md)
