# Teleport — hướng dẫn (tiếng Việt)

Tài liệu này nằm trong `.cursor/` để tham chiếu nhanh khi làm việc trong repo. **Teleport** ở đây là [Teleport Access Platform](https://goteleport.com/) (SSH, Kubernetes, ứng dụng nội bộ, database, v.v.), không phải khái niệm trong game.

---

## 1. Teleport là gì (cơ bản)

**Teleport** là hệ thống **kiểm soát truy cập tập trung** vào hạ tầng. Người dùng đăng nhập một lần (Web UI hoặc CLI `tsh`), nhận **chứng chỉ / credential ngắn hạn**, và mọi kết nối chịu **RBAC** (role-based access control), có thể **ghi phiên** (session recording) phục vụ audit.

**Ví dụ:** Thay vì phân tán SSH key trên 50 máy, bạn có một cluster Teleport: user `alice` role `developer` chỉ SSH được các node có label `env=staging`; khi nghỉ việc chỉ cần vô hiệu hóa user trên Teleport.

---

## 2. Vì sao dùng

| Khía cạnh | SSH truyền thống | Teleport |
|-----------|------------------|----------|
| Xác thực | Key cố định trên máy | SSO, MFA, cert ngắn hạn |
| Phân quyền | `authorized_keys` rải rác | RBAC tập trung (`tctl`, YAML) |
| Audit | Khó thống nhất | Event log, session recording |
| Ngoài SSH | — | K8s, HTTP app nội bộ, DB |

---

## 3. Kiến trúc (trung cấp)

- **Auth Service** — CA nội bộ, cấp chứng chỉ cho user/node, lưu cấu hình và identity backend.
- **Proxy Service** — Cổng vào (HTTPS, SSH qua proxy), Web UI, điểm kết nối cho `tsh`.
- **Agent** — Binary `teleport` chạy trên server (hoặc tương đương) để **đăng ký node** vào cluster; truy cập SSH vào máy thường cần agent (hoặc mô hình tương đương).

**Luồng tóm tắt:** User → `tsh login` → Auth cấp credential → `tsh ssh user@node` → kiểm tra role → kết nối tới node có agent.

---

## 4. Chủ đề nâng cao (hay gặp)

- **RBAC theo label:** Gắn role với `env=prod`, `team=backend`, từ chối lệnh nhạy cảm bằng `deny`.
- **Session recording:** Ghi lại SSH (và các giao thức hỗ trợ) để xem lại / compliance.
- **Application access:** Truy cập Grafana, Jenkins nội bộ qua Teleport thay VPN.
- **Database access:** Kết nối DB qua proxy Teleport, policy theo user.
- **Kubernetes:** `tsh kube login`, map Teleport role sang K8s RBAC.
- **Trusted clusters:** Nhiều site/region vẫn quản trị tập trung.
- **Machine ID:** Identity cho máy hoặc CI, tránh key dài hạn.

**Community vs Enterprise:** CE đủ cho lab và nhiều kịch bản; Enterprise có thêm tính năng thương mại (kiểm tra docs từng phiên bản).

---

## 5. Cài đặt bằng Docker (ví dụ)

Image CE distroless (không có shell trong container):

`public.ecr.aws/gravitational/teleport-distroless:<version>`

Thay `<version>` bằng tag cụ thể (ví dụ `18.7.2`). Cập nhật tag mới nhất tại [Installing Teleport on Docker](https://goteleport.com/docs/installation/docker/).

### 5.1. Sinh `teleport.yaml` mẫu (auth + proxy)

```bash
docker run --hostname teleport.example.com --rm \
  --entrypoint=/usr/local/bin/teleport \
  public.ecr.aws/gravitational/teleport-distroless:18.7.2 \
  configure --roles=proxy,auth > teleport.yaml
```

- `teleport.example.com` nên là **FQDN** thật mà trình duyệt và client trỏ tới (TLS, quảng bá URL).

### 5.2. Chạy container

```bash
mkdir -p teleport-data

docker run -d --name teleport \
  --hostname teleport.example.com \
  -p 443:443 -p 3023:3023 -p 3024:3024 -p 3025:3025 \
  -v "%cd%/teleport.yaml:/etc/teleport.yaml:ro" \
  -v "%cd%/teleport-data:/var/lib/teleport" \
  --restart unless-stopped \
  public.ecr.aws/gravitational/teleport-distroless:18.7.2
```

Trên PowerShell có thể dùng `${PWD}` thay `%cd%` tùy shell:

```powershell
docker run -d --name teleport `
  --hostname teleport.example.com `
  -p 443:443 -p 3023:3023 -p 3024:3024 -p 3025:3025 `
  -v "${PWD}/teleport.yaml:/etc/teleport.yaml:ro" `
  -v "${PWD}/teleport-data:/var/lib/teleport" `
  --restart unless-stopped `
  public.ecr.aws/gravitational/teleport-distroless:18.7.2
```

**Lưu ý:** Cổng cụ thể phụ thuộc file cấu hình; production cần TLS hợp lệ (Let’s Encrypt hoặc cert nội bộ) trong `proxy_service`.

### 5.3. Tạo user quản trị đầu tiên

Distroless không có bash; dùng `tctl` trong container:

```bash
docker exec teleport tctl users add admin --roles=editor,access
```

Làm theo output (link/token) để đăng ký mật khẩu hoặc MFA lần đầu.

### 5.4. Docker Compose (khung tối thiểu)

```yaml
services:
  teleport:
    image: public.ecr.aws/gravitational/teleport-distroless:18.7.2
    container_name: teleport
    hostname: teleport.example.com
    ports:
      - "443:443"
      - "3023:3023"
      - "3024:3024"
      - "3025:3025"
    volumes:
      - ./teleport.yaml:/etc/teleport.yaml:ro
      - ./teleport-data:/var/lib/teleport
    restart: unless-stopped
```

Debug cần shell: dùng image `teleport-distroless-debug` (có busybox) — xem tài liệu chính thức.

---

## 6. Client `tsh` (máy developer)

Cài `tsh` trên máy local (không bắt buộc chạy trong container server):

```bash
tsh login --proxy=teleport.example.com:443
tsh ls
tsh ssh ubuntu@ten-node-trong-cluster
```

---

## 7. Ví dụ theo mức độ (cơ bản → nâng cao)

Các lệnh dưới đây minh họa **thứ tự học**; cú pháp chi tiết có thể khác nhẹ theo phiên bản Teleport — luôn đối chiếu [docs](https://goteleport.com/docs/) của đúng bản bạn cài.

### 7.1. Mức cơ bản — đăng nhập và SSH một máy

**Bối cảnh:** Cluster đã chạy, đã có user (ví dụ `admin` từ mục 5.3), trên máy đích đã cài agent và join cluster.

```bash
# Đăng nhập (proxy = FQDN + cổng HTTPS)
tsh login --proxy=teleport.example.com:443 --user=alice

# Xem các node (SSH) đang được Teleport quản lý
tsh ls

# SSH vào node; <user-linux> phải nằm trong danh sách logins mà role của alice cho phép
tsh ssh ubuntu@hostname-hoac-label

# Xem phiên đăng nhập hiện tại
tsh status

# Thoát credential trên máy local
tsh logout
```

**Ôn tập khái niệm:** `tsh` là client; **Proxy** xác thực bạn; **Auth** cấp cert ngắn hạn; kết nối SSH đi qua Teleport tới **node agent**.

---

### 7.2. Mức cơ bản — tạo user và gán role có sẵn

**Bối cảnh:** Admin chạy `tctl` trên máy có quyền (hoặc `docker exec teleport tctl ...`).

```bash
# User chỉ cần vào SSH theo policy của role access (ví dụ lab)
tctl users add bob --roles=access

# User có quyền quản trị tài nguyên Teleport (tạo role, user, v.v.)
tctl users add carol --roles=editor,access
```

Role built-in thường gặp (tên có thể khác tùy bản; xem `tctl get roles`):

- **`access`** — thường dùng cho người cần SSH/app/db/k8s theo policy gắn vào role đó.
- **`editor`** — quản trị cấu hình cluster (mạnh, chỉ cấp cho admin).
- **`auditor`** (nếu bật) — xem session recording / audit.

Output của `users add` thường có **link kích hoạt** hoặc hướng dẫn đặt mật khẩu / MFA lần đầu.

---

### 7.3. Mức trung cấp — gắn nhãn (label) cho node và hạn chế theo môi trường

**Bối cảnh:** Khi cấu hình agent trên server (file `teleport.yaml` phía node hoặc flag tương đương), bạn khai báo label để RBAC lọc được.

Ví dụ ý tưởng label trên node:

```yaml
# Trên máy chủ (agent) — minh họa; đường dẫn/key chính xác xem docs "Joining Nodes"
ssh_service:
  enabled: true
  labels:
    env: staging
    team: backend
```

**Tạo role chỉ cho phép SSH vào staging** (resource file `dev-staging.yaml`, apply bằng `tctl create -f dev-staging.yaml`):

```yaml
kind: role
version: v7
metadata:
  name: dev-staging
spec:
  allow:
    logins: [ubuntu, debian]
    node_labels:
      env: staging
  deny:
    node_labels:
      env: production
```

```bash
tctl create -f dev-staging.yaml
tctl users add dave --roles=access,dev-staging
```

**Kết quả mong đợi:** User `dave` chỉ thấy / chỉ SSH được node có `env: staging`; bị chặn với `env: production` (nếu policy `deny` áp dụng đúng).

---

### 7.4. Mức trung cấp — thêm node vào cluster (join token)

**Bối cảnh:** Một server Linux mới cần vào Teleport để `tsh ssh` tới được.

```bash
# Token join ngắn hạn (ví dụ cho node, thời hạn giới hạn)
tctl tokens add --type=node --ttl=1h

# Trên máy mới: cài teleport agent cùng phiên bản cluster, chạy join với token vừa tạo
# (cú pháp chính xác: teleport start hoặc teleport node join — xem docs "Adding Nodes")
```

Sau khi join thành công, `tsh ls` (với user đủ quyền) sẽ thấy node mới.

---

### 7.5. Mức trung bậc cao — ghi phiên SSH (session recording)

**Bối cảnh:** Bật recording trong cấu hình cluster (auth / session recording — tùy phiên bản và edition). Khi bật, admin có thể xem lại phiên trong Web UI hoặc qua công cụ audit.

Ý tưởng cấu hình (minh họa, không copy nguyên sang production):

```yaml
# Trên Auth service — tham khảo docs "Session Recording"
auth_service:
  session_recording: node
```

- **`node`** — ghi phía node (phổ biến cho SSH).
- **`proxy`** — ghi phía proxy (một số kịch bản bắt buộc).

**Ví dụ hành vi:** User chạy `sudo rm -rf` trên server; security team mở recording trong UI để xác minh — không cần screen recorder thủ công.

---

### 7.6. Mức nâng cao — Application Access (ứng dụng HTTP nội bộ)

**Bối cảnh:** Có dịch vụ `http://grafana.internal:3000` không public; Teleport làm reverse proxy có xác thực.

Luồng điển hình:

1. Khai báo `app_service` trên agent (hoặc dedicated agent) trỏ tới URL nội bộ.
2. User: `tsh apps login` (hoặc đăng nhập Web UI) → chọn app → trình duyệt mở qua tunnel an toàn.

```bash
tsh apps login --proxy=teleport.example.com:443
tsh apps ls
# Mở app (tên app phụ thuộc cấu hình)
tsh proxy app grafana --port=3000
# Sau đó truy cập http://127.0.0.1:3000 trên máy local
```

**Lợi ích:** Không VPN toàn mạng; vẫn có SSO/MFA và audit theo policy Teleport.

---

### 7.7. Mức nâng cao — Kubernetes

```bash
tsh kube login teleport.example.com
tsh kube ls
kubectl get pods -A
```

Teleport map **Teleport role** → quyền trên cluster (thường qua Kubernetes `ClusterRoleBinding` / nhóm được Teleport đồng bộ). Chi tiết xem mục "Teleport Kubernetes Access".

---

### 7.8. Mức nâng cao — Database Access

Luồng khái niệm:

1. Agent Teleport (db service) hoặc discovery kết nối tới DB.
2. Admin định nghĩa user/db role trong Teleport.
3. Developer: `tsh db login`, sau đó `tsh db connect` hoặc dùng GUI qua cert do Teleport phát.

```bash
tsh db ls
tsh db login tên-db-trong-teleport
tsh db connect --db-user=readonly --db-name=myapp tên-db-trong-teleport
```

Mọi phiên có thể log/record tùy cấu hình và loại DB hỗ trợ.

---

### 7.9. Mức nâng cao — Trusted clusters (nhiều cluster / nhiều region)

**Bối cảnh:** Có cluster Teleport **root** (trung tâm) và cluster **leaf** (region khác). Leaf **tin cậy** root; user đăng nhập root có thể truy cập tài nguyên trên leaf theo RBAC.

Ví dụ ý tưởng (lệnh minh họa):

```bash
# Trên leaf: tạo trust relationship (tctl tokens add --type=trusted_cluster, v.v.)
# Trên root: tctl create -f trusted_cluster.yaml
```

Cụ thể từng field trong YAML xem docs "Trusted Clusters" — đây là phần dễ sai nhất khi chứng chỉ / CA không khớp.

---

### 7.10. Mức nâng cao — khóa user / thu hồi truy cập khẩn cấp

```bash
# Khóa user (không xóa)
tctl users update alice --set-locked=true

# Xóa user
tctl users rm alice

# Thu hồi toàn bộ session đang hoạt động (tùy phiên bản / tính năng)
# Xem docs "Locking" / session control
```

Kết hợp với cert ngắn hạn: sau TTL, user bị khóa sẽ không lấy credential mới.

---

### 7.11. Bảng tóm tắt lộ trình ví dụ

| Mức | Bạn thực hành gì | Kỹ năng |
|-----|------------------|---------|
| 7.1 | `tsh login`, `tsh ls`, `tsh ssh` | Dùng client, hiểu proxy/auth |
| 7.2 | `tctl users add`, role built-in | Onboarding user |
| 7.3 | Label node + role YAML | RBAC theo môi trường |
| 7.4 | Join token, agent mới | Mở rộng hạ tầng |
| 7.5 | Session recording | Audit / compliance |
| 7.6 | App access | Thay VPN cho HTTP nội bộ |
| 7.7 | `tsh kube` | K8s qua Teleport |
| 7.8 | `tsh db` | DB có kiểm soát |
| 7.9 | Trusted cluster | Đa site |
| 7.10 | Lock / rm user | Vận hành an toàn |

---

## 8. Liên kết tham khảo

- [Teleport Documentation](https://goteleport.com/docs/)
- [Installing Teleport on Docker](https://goteleport.com/docs/installation/docker/)
