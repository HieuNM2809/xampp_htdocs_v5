# Jenkins Setup Guide: CMD, Schedules, Node.js & Docker

Hướng dẫn từ cơ bản đến nâng cao.

## Cấu trúc thư mục

```
123_jenskins_cmd_schedules/
├── 01_basic_cmd/           # Chạy lệnh CMD cơ bản
├── 02_schedules/           # Cron schedules
├── 03_nodejs/              # Pipeline với Node.js
├── 04_docker/              # Pipeline với Docker
├── 05_advanced/            # Pipeline nâng cao kết hợp tất cả
└── docker-compose.yml      # Jenkins bằng Docker Compose
```

---

## 🚀 Bước 1: Khởi động Jenkins bằng Docker

```bash
# Trong thư mục dự án
docker-compose up -d

# Truy cập Jenkins UI
# http://localhost:8080
```

> Lần đầu chạy, lấy initial admin password:
> ```bash
> docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
> ```

**Plugins cần cài:**
| Plugin | Dùng cho |
|--------|----------|
| `NodeJS` | Stage Node.js (Global Tool Config) |
| `Docker Pipeline` | `docker.build()`, `docker.withRegistry()` |
| `Pipeline` | Declarative Pipeline |
| `AnsiColor` | Màu sắc trong log |
| `Slack Notification` | Gửi thông báo Slack |
| `JUnit` | Hiển thị test results |

---

## 📂 Các ví dụ theo level

### Level 1 — Basic CMD `01_basic_cmd/Jenkinsfile`

| Khái niệm | Chi tiết |
|-----------|---------|
| `sh '...'` | Chạy lệnh Linux shell |
| `bat '...'` | Chạy lệnh Windows CMD |
| `returnStdout: true` | Capture output vào biến |
| `returnStatus: true` | Lấy exit code, không fail pipeline |
| `environment {}` | Biến môi trường toàn cục |
| `post { always/success/failure }` | Xử lý sau khi pipeline kết thúc |

---

### Level 2 — Schedules `02_schedules/Jenkinsfile`

**Cú pháp Cron:** `MINUTE HOUR DAY MONTH DOW`

```
H/30 * * * *   → Mỗi 30 phút
0 8 * * 1-5    → 8:00 sáng Thứ 2-6
H 2 * * *      → Mỗi đêm ~2am (H = hash, phân tán load)
@midnight      → Alias cho 0 0 * * *
@weekly        → Mỗi tuần 1 lần
```

| Trigger | Dùng khi nào |
|---------|-------------|
| `cron(...)` | Chạy theo giờ cố định |
| `pollSCM(...)` | Build khi có commit mới |
| `upstream(...)` | Build khi job khác xong |

---

### Level 3 — Node.js `03_nodejs/Jenkinsfile`

**Cần cấu hình trước:**
> Manage Jenkins → Global Tool Configuration → NodeJS → Add NodeJS → Đặt tên `NodeJS 20`

Flow:
```
Checkout → Env Check → npm ci → Lint → Unit Tests → Audit → Build → Archive → Deploy
```

Key patterns:
- `tools { nodejs 'NodeJS 20' }` — dùng NodeJS tool
- `parameters {}` — cho phép chọn env, bật/tắt tests khi chạy
- `when { expression {...} }` — stage chạy có điều kiện
- `junit testResults: '...'` — publish test report
- `input message: '...'` — approval gate trước deploy production

---

### Level 4 — Docker `04_docker/Jenkinsfile`

Flow:
```
Checkout → Docker Build → Security Scan → Test Image → Push Registry → Deploy → Smoke Test
```

**Cần cấu hình:**
> Manage Jenkins → Credentials → Add → Username+Password
> ID: `docker-hub-credentials`

Key patterns:
- `withCredentials([usernamePassword(...)])` — lấy Docker Hub credentials an toàn
- Test image bằng cách chạy container tạm, gọi health endpoint
- `docker image prune` trong `post.always` để dọn image cũ

---

### Level 5 — Advanced `05_advanced/Jenkinsfile`

Kết hợp tất cả + thêm:

| Feature | Mô tả |
|---------|-------|
| `agent none` + `agent { label '...' }` | Mỗi stage chạy trên agent riêng |
| `parallel { stage(...) {} }` | Chạy Tests + Lint + Audit cùng lúc |
| `options { disableConcurrentBuilds() }` | Không cho 2 build chạy song song |
| `input(submitter: 'admin')` | Chỉ user cụ thể mới approve được |
| `post { cleanup { cleanWs() } }` | Dọn workspace tự động |
| Rollback | Tự rollback production khi deploy fail |
| Notifications | Slack/Email/Teams trong `post.always` |

---

## 🔑 Cron Quick Reference

```
*    = mọi giá trị
,    = danh sách: 0,30 = phút 0 và 30
-    = khoảng: 1-5 = thứ 2 đến thứ 6
/    = bước: */15 = mỗi 15 đơn vị
H    = hash (Jenkins tự chọn để phân tán)

Ví dụ thực tế:
H/15 * * * *       → Mỗi 15 phút
0 9 * * 1-5        → 9:00 sáng các ngày trong tuần
0 1 * * 6          → 1:00 sáng thứ 7 (weekly cleanup)
H H 1 * *          → Đầu mỗi tháng (monthly report)
```
