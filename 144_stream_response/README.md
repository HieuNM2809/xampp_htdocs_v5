# 🌊 Stream Response trong Node.js — Từ Cơ Bản đến Nâng Cao

Bộ ví dụ về **stream response**: trả dữ liệu theo từng mẩu (chunk/token) ngay khi
có, thay vì gom hết vào RAM rồi trả một cục. Đi từ Streams API gốc của Node đến
hiệu ứng "gõ chữ" của chatbot AI.

## 📚 Tổng Quan

| Level | File | Kỹ thuật | Độ khó |
|-------|------|----------|--------|
| 1 | `01_stream_basics.js` | Streams API: Readable/Writable, pipeline, **backpressure** | ⭐ |
| 2 | `02_http_chunked.js` | HTTP `Transfer-Encoding: chunked` (nền tảng mọi stream HTTP) | ⭐⭐ |
| 3 | `03_sse_server_sent_events.js` | Server-Sent Events (SSE) real-time về browser | ⭐⭐ |
| 4 | `04_stream_large_file.js` | Stream file lớn tiết kiệm RAM + HTTP Range | ⭐⭐⭐ |
| 5 | `05_transform_gzip.js` | Transform stream + gzip nén on-the-fly | ⭐⭐⭐ |
| 6 | `06_ndjson_stream.js` | Streaming JSON theo NDJSON (parse từng dòng) | ⭐⭐⭐ |
| 7 | `07_ai_token_stream_mock.js` | Hiệu ứng gõ chữ kiểu ChatGPT (SSE, **không cần key**) | ⭐⭐⭐⭐ |
| 8 | `08_claude_real_stream.js` | Stream **thật** từ Claude API (Anthropic SDK) | ⭐⭐⭐⭐⭐ |

## 🔧 Cài đặt & Chạy

**Level 1–7 chạy ngay, không cần cài gì** (chỉ dùng module built-in của Node 18+):

```bash
node 01_stream_basics.js
node 02_http_chunked.js
node 03_sse_server_sent_events.js   # mở http://localhost:3103
node 04_stream_large_file.js
node 05_transform_gzip.js
node 06_ndjson_stream.js
node 07_ai_token_stream_mock.js     # mở http://localhost:3107
```

Hoặc dùng script namespaced: `npm run 01:basics`, `npm run 03:sse`, ...

**Level 8** cần cài SDK và có API key:

```bash
npm install                 # cài @anthropic-ai/sdk
cp .env.example .env        # rồi điền ANTHROPIC_API_KEY vào .env
npm run 08:claude
```

> 🔒 `.env` đã nằm trong `.gitignore` của folder. Repo này là **public** —
> tuyệt đối không commit key. Xem thêm ghi chú bảo mật ở cuối.

## 📖 Giải Thích Chi Tiết

### Level 1 — Streams API & Backpressure
Khái niệm gốc. Dữ liệu chảy theo **chunk** qua `Readable → Writable`.
`pipeline`/`pipe` tự xử lý **backpressure**: nếu đích ghi chậm hơn nguồn phát,
nguồn bị ghì lại chờ → RAM luôn phẳng dù dữ liệu vô hạn.

```
Readable (nhanh) → [backpressure] → Writable (chậm)
   phát chunk        tự tạm dừng        tiêu thụ dần
```

### Level 2 — HTTP Chunked Encoding
Nền tảng của mọi "stream response" qua HTTP.

```
Response thường:  [Content-Length: 1000] → client chờ đủ 1000 byte mới xử lý
Response stream:  [Transfer-Encoding: chunked] → mỗi res.write() = 1 chunk tới ngay
```

Không set `Content-Length` → Node tự bật chunked. Test: `curl -N .../stream`.

### Level 3 — Server-Sent Events (SSE)
Kênh HTTP **một chiều** server → client, chạy trên chunked encoding.
Định dạng: `data: ...\n\n`. Browser dùng `EventSource` (tự reconnect).

| | SSE | WebSocket |
|---|---|---|
| Chiều | 1 chiều (server→client) | 2 chiều |
| Độ phức tạp | Rất đơn giản, HTTP thường | Cần handshake riêng |
| Hợp cho | Thông báo, tiến độ, **LLM token** | Chat 2 chiều, game |

### Level 4 — Stream File Lớn
`createReadStream(file).pipe(res)` thay vì `readFile` → RAM chỉ giữ vài chunk 64KB
dù file 20MB hay 5GB. Kèm demo **HTTP Range** (206 Partial Content) — nền tảng của
tua video và resume download.

### Level 5 — Transform Stream
Biến đổi dữ liệu **ngay trên luồng**: `source → uppercase → gzip → file`.
`stream.pipeline` tự truyền lỗi và đóng mọi stream (tránh rò rỉ file descriptor).

### Level 6 — NDJSON
Mỗi dòng là 1 JSON object (`{...}\n{...}\n`). Server phát từng record, client
`JSON.parse` từng dòng ngay khi tới — không chờ toàn bộ mảng. Chuẩn cho log,
export dữ liệu lớn, và là "họ hàng" của cách LLM stream delta.

### Level 7 — AI Token Streaming (mô phỏng)
Vì sao chatbot phải stream? Model sinh chữ theo **token**; stream từng token về
ngay → chữ hiện dần, không bắt user nhìn màn hình trống. File này mô phỏng bằng
SSE nhưng dùng **đúng khung sự kiện của Claude Messages API**:

```
message_start → content_block_start → content_block_delta (× N) → content_block_stop
              → message_delta (stop_reason + usage) → message_stop
```

### Level 8 — Stream Thật Từ Claude
Bản đời thực của Level 7. Anthropic SDK bọc sẵn SSE:

```js
const stream = client.messages.stream({ model: 'claude-opus-5', max_tokens: 1024, messages: [...] });
stream.on('text', (delta) => process.stdout.write(delta));  // in từng mẩu chữ
const final = await stream.finalMessage();                  // message hoàn chỉnh + usage
```

Đổi `model` sang `'claude-haiku-4-5'` để test nhanh/rẻ hơn.

## 🎯 Khi Nào Dùng Cái Gì?

| Tình huống | Giải pháp |
|-----------|-----------|
| Trả file/blob lớn | `createReadStream().pipe(res)` (Level 4) |
| Nén/mã hoá/parse trên luồng | Transform + pipeline (Level 5) |
| Đẩy tiến độ/thông báo real-time về browser | SSE (Level 3) |
| Export/log lượng bản ghi lớn qua API | NDJSON (Level 6) |
| Chatbot AI, hiệu ứng gõ chữ | SSE + token stream (Level 7, 8) |
| Chat 2 chiều, cộng tác real-time | WebSocket (ngoài phạm vi bộ này) |

## ⚡ Ghi Nhớ

1. **Streaming = ít RAM + phản hồi sớm** (Time To First Byte thấp).
2. **Luôn để backpressure làm việc** — dùng `pipe`/`pipeline`, đừng gom cả cục.
3. **SSE cần** `Content-Type: text/event-stream` và block kết thúc bằng dòng trống.
4. **Dọn dẹp khi client ngắt**: nghe `req.on('close')` để `clearInterval`/dừng phát.
5. **LLM stream** là SSE của token — Level 7 là mô phỏng, Level 8 là thật.

## 🔒 Bảo Mật (repo public)

- `.env` đã được gitignore trong folder này. Chỉ commit `.env.example`.
- Không hardcode `ANTHROPIC_API_KEY` vào code. SDK tự đọc từ biến môi trường.
- Nếu lỡ để lộ key → thu hồi (revoke) ngay trong Anthropic Console.
