# n8n — ví dụ chạy từ Cursor

Học **n8n** self-host trên máy local (Windows + Docker Desktop), import workflow mẫu, gọi webhook bằng PowerShell hoặc Agent trong Cursor.

## Cấu trúc

```
135_n8n/Cursor/
├── docker-compose.yml
├── .env.example
├── workflows/
│   └── 01_webhook_hello.json    # Import vào n8n
└── scripts/
    ├── 01_trigger_webhook.ps1   # Windows
    └── 01_trigger_webhook.sh      # Git Bash / WSL
```

## Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đang chạy
- Port **5678** chưa bị chiếm

## Quick start

### 1. Khởi động n8n

```powershell
cd E:\xampp_htdocs_v5\135_n8n\Cursor
docker compose up -d
docker compose logs -f n8n
```

Mở editor: **http://localhost:5678**

Lần đầu: tạo tài khoản owner (lưu local trong volume Docker).

### 2. Import workflow `01`

1. Trong n8n: **Workflows** → menu **⋯** → **Import from file**
2. Chọn `workflows/01_webhook_hello.json`
3. Mở workflow → bật **Active** (toggle góc trên phải)

Webhook production URL (sau khi active):

```text
POST http://localhost:5678/webhook/hello
```

### 3. Gọi thử webhook

**PowerShell** (từ thư mục `Cursor/`):

```powershell
.\scripts\01_trigger_webhook.ps1
```

**curl** (Git Bash / WSL):

```bash
./scripts/01_trigger_webhook.sh
```

Kết quả mong đợi (JSON):

```json
{
  "ok": true,
  "message": "Xin chào, Hiếu! (n8n demo 135)",
  "received": { "name": "Hiếu" }
}
```

### 4. Dừng stack

```powershell
docker compose down
```

Giữ data workflow: volume `n8n_data` (xóa hẳn bằng `docker compose down -v`).

---

## Dùng với Cursor Agent

Sau khi workflow **Active**, có thể nhờ Agent trong chat:

```text
Chạy docker compose trong 135_n8n/Cursor, đợi n8n lên, rồi POST http://localhost:5678/webhook/hello
với body {"name":"Cursor"} và cho tôi xem response.
```

Agent sẽ `docker compose up`, `curl`/`Invoke-RestMethod`, và báo lỗi nếu workflow chưa bật.

---

## Workflow 01 — làm gì?

```mermaid
flowchart LR
  A[POST /webhook/hello] --> B[Webhook node]
  B --> C[Set: ok, message, received]
  C --> D[Trả JSON cho client]
```

- Nhận JSON body (ví dụ `{ "name": "Hiếu" }`)
- Trả lời có `message` chào theo `name`, kèm `received` echo body

---

## Xây workflow 02 thủ công (không import)

Gợi ý bài tiếp theo trong UI:

1. **Schedule Trigger** — chạy mỗi 5 phút
2. **HTTP Request** — `GET https://httpbin.org/get`
3. **Set** — lưu field `url` từ response

So sánh: trigger theo lịch vs trigger theo webhook (workflow 01).

---

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| `404` trên `/webhook/hello` | Workflow chưa **Active** | Bật toggle Active, đợi vài giây |
| `connection refused` :5678 | Container chưa chạy | `docker compose up -d`, xem `docker compose ps` |
| Import lỗi node version | n8n image quá cũ/mới | `docker compose pull` rồi `up -d` lại |
| Cookie / đăng nhập lạ trên localhost | HTTPS vs HTTP | Giữ `N8N_SECURE_COOKIE=false` trong compose (đã có) |

---

## Ghi chú production

Demo này **chỉ cho local**: HTTP, không reverse proxy, SQLite trong container.

Lên server thật cần thêm: HTTPS, `WEBHOOK_URL` public, Postgres (hoặc DB managed), backup volume, và tắt/basic auth hoặc SSO — xem [n8n Docker docs](https://docs.n8n.io/hosting/installation/docker/).
