# Luồng cache — API posts offline

Tài liệu mô tả cách **Service Worker** (`sw.js`) và **trang** (`app.js`) phối hợp để gọi `https://jsonplaceholder.typicode.com/posts`, ưu tiên mạng, và dùng **Cache Storage** khi không có mạng.

## Thành phần

| File | Vai trò |
|------|---------|
| `index.html` | UI, load `app.js` |
| `app.js` | Đăng ký SW, `fetch` URL posts, parse JSON, render |
| `sw.js` | `install` prefetch + `fetch` handler: network-first, fallback cache |

**Tên cache:** `posts-v1`  
**URL được SW xử lý:** chỉ `GET` đúng `POSTS_URL` (các request khác không qua `respondWith`).

---

## Vòng đời Service Worker

```mermaid
flowchart LR
  subgraph install["install"]
    A[caches.open]
    B[fetch POSTS_URL]
    C[cache.put]
    D[skipWaiting]
    A --> B --> C --> D
  end
  subgraph activate["activate"]
    E[clients.claim]
  end
  subgraph runtime["fetch GET POSTS_URL"]
    F{Mạng OK?}
    G[Trả response + cache.put]
    H[caches.match]
    I[Trả cached hoặc rỗng]
    F -->|Có| G
    F -->|Không| H --> I
  end
  install --> activate --> runtime
```

- **install:** cố gắng tải posts một lần và ghi vào cache (warm cache). Lỗi mạng vẫn `skipWaiting()` để không kẹt.
- **activate:** `claim()` để SW điều khiển tab hiện tại sớm.
- **fetch:** chỉ áp dụng chiến lược dưới đây cho đúng URL/method.

---

## Chiến lược: network-first + fallback cache

```mermaid
flowchart TD
  Start([Trang gọi fetch POSTS_URL]) --> SW{SW bắt được request?}
  SW -->|Đúng URL GET| Net[fetch từ mạng]
  SW -->|Khác| Pass[Trình duyệt xử lý mặc định]
  Net --> OK{response.ok?}
  OK -->|Có| Save[clone → cache.put]
  Save --> Return1[Trả response cho trang]
  OK -->|Không| Return1
  Net -->|Lỗi / offline| Match[caches.match POSTS_URL]
  Match --> Hit{Có trong cache?}
  Hit -->|Có| Return2[Trả bản đã lưu]
  Hit -->|Không| Empty[Trả 200 + body mảng rỗng]
```

- **Online, thành công:** response về trang ngay; ghi cache chạy song song (không chặn trả response).
- **Offline / lỗi mạng:** đọc cache; nếu chưa từng lưu → `[]` để `res.json()` không vỡ.

---

## Luồng từ lúc mở trang

```mermaid
sequenceDiagram
  participant P as app.js
  participant N as navigator
  participant SW as sw.js
  participant API as jsonplaceholder

  P->>N: register sw.js
  N->>SW: install / activate
  SW->>API: fetch POSTS_URL (prefetch install, nếu có mạng)
  SW->>SW: cache.put

  P->>N: fetch POSTS_URL
  N->>SW: fetch event
  SW->>API: fetch
  API-->>SW: 200 + JSON
  SW->>SW: cache.put bản mới
  SW-->>P: Response

  Note over P,API: Offline: SW không fetch được → caches.match → trả cached / rỗng
```

---

## Ghi chú vận hành

1. **HTTPS hoặc localhost:** Service Worker không chạy trên `file://` và cần ngữ cảnh bảo mật phù hợp.
2. **Lần đầu chưa có cache:** cần ít nhất một lần có mạng (install và/hoặc fetch thành công) để offline có dữ liệu.
3. **Đổi tên cache** (ví dụ `posts-v2`) khi muốn “bỏ” dữ liệu cũ hoặc tránh dùng bản stale quá lâu — có thể bổ sung bước xóa `posts-v1` trong `activate`.

---

## Sơ đồ tóm tắt (một nhìn)

```
[install]     prefetch POSTS_URL → Cache Storage (posts-v1)
                 ↓
[activate]    clients.claim()
                 ↓
[fetch GET]   mạng OK  → trả response + cập nhật cache
              mạng FAIL → cache hit → trả cached
                         cache miss → trả []
```
