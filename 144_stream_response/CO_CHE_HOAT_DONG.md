# ⚙️ Cơ chế hoạt động — Chat Streaming (mock)

Tài liệu này giải thích **từng mắt xích** khiến câu trả lời hiện dần từng chữ,
từ lúc bạn gõ Enter đến khi chữ cuối cùng xuất hiện. Đọc kèm 2 file:
`server.js` (phía server) và `public/chat.html` (phía trình duyệt).

---

## 1. Ý tưởng cốt lõi

Cách **thường** (không stream): server sinh xong *toàn bộ* câu trả lời rồi mới
gửi 1 cục → người dùng nhìn màn hình trống suốt thời gian đó.

```
Gửi câu hỏi ──▶ [server nghĩ... 3s] ──▶ nhận NGUYÊN câu trả lời một lần
                 (màn hình trống)
```

Cách **stream**: server gửi **từng mẩu chữ ngay khi có**, trên **cùng một** kết
nối HTTP đang mở. Trình duyệt đọc tới đâu vẽ tới đó → cảm giác "đang gõ".

```
Gửi câu hỏi ──▶ chữ ──▶ chữ ──▶ chữ ──▶ chữ ──▶ ... (hiện dần, không chờ)
```

Điểm mấu chốt: **một HTTP response không nhất thiết phải gửi hết một lần**. Nó
có thể để mở và ghi dần (`res.write` nhiều lần) rồi mới `res.end()`. Trình duyệt
đọc được phần đã ghi mà không cần chờ đóng kết nối.

---

## 2. Kiến trúc tổng thể

```
┌─────────────────────────┐                       ┌──────────────────────────┐
│      TRÌNH DUYỆT         │                       │        server.js         │
│     (chat.html)          │                       │      (Node HTTP)         │
│                          │                       │                          │
│  ô nhập ─┐               │   POST /chat          │                          │
│          ▼               │   { messages:[...] }  │                          │
│      fetch() ────────────┼──────────────────────▶│  đọc body (readJsonBody) │
│          │               │                       │        │                 │
│          │               │   data: {delta}\n\n   │        ▼                 │
│      reader.read() ◀──────┼───────────────────────│  streamMock():           │
│          │  (lặp)        │   data: {delta}\n\n   │   ghi từng chữ + sleep   │
│          ▼               │   ...                 │        │                 │
│   vẽ chữ trước con trỏ   │   data: {done}\n\n    │        ▼                 │
│          │               │◀──────────────────────│  res.end()               │
│          ▼               │                       │                          │
│   lưu vào `messages`     │                       │                          │
└─────────────────────────┘                       └──────────────────────────┘
```

Chỉ có **2 đường**:
- `GET /` → trả trang `chat.html` (`server.js:95`).
- `POST /chat` → mở luồng SSE, đẩy chữ dần (`server.js:103`).

---

## 3. Luồng đầy đủ một lượt chat (sequence)

```
Người dùng   chat.html (JS)                 server.js
    │             │                              │
    │ gõ + Enter  │                              │
    ├────────────▶│ send()  (chat.html:123)      │
    │             │ • vẽ bong bóng user          │
    │             │ • messages.push(user)        │
    │             │ • vẽ bong bóng bot = 3 chấm   │
    │             │                              │
    │             │ fetch POST {messages} ───────▶│ nhận (server.js:103)
    │             │                              │ • readJsonBody -> parse
    │             │                              │ • kiểm tra messages rỗng?
    │             │                              │ • writeHead 200 text/event-stream
    │             │                              │ • streamMock() (server.js:78)
    │             │                              │     tách câu trả lời thành token
    │             │◀── data:{type:delta} ────────┤     res.write từng token
    │             │  chữ đầu: xoá 3 chấm,         │     await sleep(45)  ← nhịp gõ
    │             │  hiện con trỏ, chèn chữ       │        │ (lặp N lần)
    │             │◀── data:{type:delta} ────────┤        │
    │  thấy chữ   │  chèn chữ trước con trỏ       │        │
    │  hiện dần   │        ...                    │        ▼
    │             │◀── data:{type:done} ─────────┤     res.write(done + usage)
    │             │  bỏ con trỏ, hiện "↳ N token"│ res.end()
    │             │ messages.push(assistant)      │
    │             │ (lưu để lượt sau có ngữ cảnh) │
```

---

## 4. Giải phẫu phía SERVER (`server.js`)

### 4.1. Định tuyến
`http.createServer` (`server.js:91`) phân 2 nhánh theo `method` + `pathname`:
trang chủ trả HTML, `POST /chat` là endpoint stream.

### 4.2. Đọc body — `readJsonBody` (`server.js:34`)
Body của POST đến **theo từng chunk**. Hàm này gom các sự kiện `data` lại thành
chuỗi rồi `JSON.parse`, có chặn ~1MB để an toàn. Kết quả là object
`{ messages: [...] }` — **cả lịch sử hội thoại** client gửi lên.

### 4.3. Mở luồng SSE — 3 header quan trọng (`server.js:120`)
```js
res.writeHead(200, {
  'Content-Type': 'text/event-stream; charset=utf-8', // báo đây là luồng sự kiện
  'Cache-Control': 'no-cache',                         // đừng cache, cần realtime
  Connection: 'keep-alive',                            // giữ kết nối mở để ghi dần
});
```
Quan trọng: **không set `Content-Length`**. Nhờ vậy Node tự dùng
`Transfer-Encoding: chunked` — nền tảng cho mọi HTTP streaming.

### 4.4. "Gõ" chữ — `streamMock` (`server.js:78`)
```js
const tokens = answer.match(/\S+\s*/g) || [];   // cắt câu trả lời thành "từ + khoảng trắng"
for (const tok of tokens) {
  if (res.writableEnded || res.destroyed) return; // client đóng tab -> dừng ngay
  sse(res, { type: 'delta', text: tok });          // ghi 1 mẩu chữ
  await sleep(45);                                 // nghỉ 45ms để mắt thấy hiệu ứng gõ
}
sse(res, { type: 'done', usage: { output_tokens: tokens.length } });
```
- `sleep(45)` chỉ để **mô phỏng** độ trễ. Model thật không cần dòng này — token
  tự về theo tốc độ sinh chữ.
- Kiểm tra `res.writableEnded || res.destroyed` mỗi vòng: nếu người dùng đóng
  tab giữa chừng thì ngừng, không ghi vào socket đã chết.

### 4.5. Đóng luồng & lỗi (`server.js:126`)
Handler bọc `streamMock` trong `try/catch/finally`: lỗi → gửi `data:{type:error}`;
`finally` luôn `res.end()` để chốt luồng.

---

## 5. Định dạng SSE — mổ xẻ `data: {...}\n\n`

Mỗi sự kiện là **một khối text** theo chuẩn Server-Sent Events, kết thúc bằng
**một dòng trống** (tức `\n\n`):

```
data: {"type":"delta","text":"Xin "}\n\n
└──┬─┘ └───────────────┬───────────┘ └┬┘
 nhãn        JSON payload (1 dòng)   dòng trống = hết 1 sự kiện
```

Ở demo này có đúng **3 loại** payload (định nghĩa trong header `server.js:16`):

| `type`  | Khi nào | Payload | Client làm gì |
|---------|---------|---------|---------------|
| `delta` | mỗi mẩu chữ | `{ text }` | chèn `text` vào bong bóng bot (phần "gõ chữ") |
| `done`  | 1 lần cuối | `{ usage }` | bỏ con trỏ, hiện số token |
| `error` | khi lỗi | `{ message }` | hiện bong bóng đỏ |

> Đây là khung tối giản. API thật của Claude cũng là SSE nhưng nhiều loại event
> hơn (`message_start`, `content_block_delta`, `message_stop`, ...). Bản chất
> giống hệt: **từng dòng `data:` mang một mẩu delta**.

---

## 6. Giải phẫu phía CLIENT (`public/chat.html`)

### 6.1. Gửi — `fetch` POST kèm lịch sử (`chat.html:144`)
```js
const resp = await fetch('/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages }),   // gửi CẢ mảng hội thoại, không chỉ câu mới
});
```

### 6.2. Nhận — đọc luồng bằng reader (`chat.html:152`)
```js
const reader = resp.body.getReader();   // đọc body dạng luồng, không chờ tải xong
const decoder = new TextDecoder();
let buf = '';

while (true) {
  const { value, done } = await reader.read(); // value = 1 chunk byte
  if (done) break;
  buf += decoder.decode(value, { stream: true });
  // ...tách frame ở dưới
}
```

### 6.3. Vì sao cần `buf` (buffer)? — điểm dễ sai nhất
Mạng **không** đảm bảo mỗi lần `read()` trả về đúng một sự kiện SSE trọn vẹn.
Một chunk có thể chứa **nhiều** sự kiện, hoặc **cắt ngang** giữa một sự kiện:

```
read() lần 1:  data: {"type":"delta","te
read() lần 2:  xt":"Xin "}\n\ndata: {"type":"del
read() lần 3:  ta","text":"chào"}\n\n
```

Vì vậy ta **nối vào `buf`** rồi cắt ra từng sự kiện trọn vẹn theo dấu `\n\n`
(`chat.html:162`); phần dư (sự kiện chưa đủ) để lại trong `buf` chờ chunk sau:
```js
let sep;
while ((sep = buf.indexOf('\n\n')) !== -1) {
  const frame = buf.slice(0, sep);   // 1 sự kiện trọn vẹn
  buf = buf.slice(sep + 2);          // giữ lại phần còn dở
  const dataLine = frame.split('\n').find((l) => l.startsWith('data:'));
  const evt = JSON.parse(dataLine.slice(5).trim()); // bỏ "data:" rồi parse JSON
  // ...xử lý theo evt.type
}
```

### 6.4. Vẽ chữ & hiệu ứng (`chat.html:170`)
- **Chờ chữ đầu**: bong bóng bot ban đầu là 3 chấm nảy (`chat.html:137`).
- **Chữ đầu tiên về**: xoá 3 chấm, gắn **con trỏ nhấp nháy**, rồi từ đó mỗi
  `delta` **chèn text vào TRƯỚC con trỏ** (`cursor.before(...)`) → chữ mọc ra,
  con trỏ luôn ở cuối.
- **`done`**: gỡ con trỏ, hiện "↳ N token" (`chat.html:175`).
- **`error`**: `throw` để nhảy vào `catch`, đổi bong bóng sang đỏ (`chat.html:191`).

### 6.5. Chat nhiều lượt (`chat.html:190`)
HTTP là **stateless** — server không tự nhớ gì. Nên sau mỗi lượt, client đẩy câu
trả lời của bot vào `messages`:
```js
if (answer) messages.push({ role: 'assistant', content: answer });
```
Lượt sau gửi lại **toàn bộ** `messages` → model (thật) có đủ ngữ cảnh. Nếu gọi
hỏng thì `messages.pop()` để bỏ câu user vừa thêm, giữ lịch sử sạch (`chat.html:195`).

---

## 7. Vì sao `fetch` + reader mà không dùng `EventSource`?

`EventSource` là API sẵn có cho SSE, **nhưng chỉ gửi được `GET`** và không đính
kèm body/headers tuỳ ý. Chat cần **POST cả lịch sử hội thoại** (có thể rất dài),
nên ta tự đọc luồng bằng `fetch` + `getReader()`.

| | `EventSource` | `fetch` + reader (dùng ở đây) |
|---|---|---|
| Method | chỉ `GET` | mọi method (cần `POST`) |
| Gửi body | không | có (mảng `messages`) |
| Tự reconnect | có sẵn | tự lo |
| Tách sự kiện | trình duyệt lo | mình tự tách `\n\n` |

Đây đúng là cách các web chat thật (ChatGPT/Claude) đang làm.

---

## 8. Bản đồ code (mở đúng chỗ)

| Việc | Vị trí |
|------|--------|
| Định tuyến GET `/` (trả HTML) | `server.js:95` |
| Endpoint `POST /chat` | `server.js:103` |
| Đọc & parse body JSON | `server.js:34` (`readJsonBody`) |
| Ghi 1 sự kiện SSE | `server.js:53` (`sse`) |
| Nội dung câu trả lời (mock) | `server.js:59` (`fakeReply`) |
| Vòng lặp "gõ" chữ + `sleep` | `server.js:78` (`streamMock`) |
| Header mở luồng SSE | `server.js:120` |
| Gửi `fetch` POST kèm history | `chat.html:144` |
| Đọc luồng + tách frame `\n\n` | `chat.html:152` |
| Vẽ delta trước con trỏ | `chat.html:170` |
| Xử lý `done` / `error` | `chat.html:175` / `chat.html:183` |
| Lưu hội thoại nhiều lượt | `chat.html:190` |

---

## 9. Nối vào model THẬT (điểm mở rộng)

Toàn bộ khung ở trên **không đổi**. Chỉ cần thay ruột hàm `streamMock` bằng lời
gọi stream của một LLM, vẫn phát ra đúng 3 loại sự kiện `delta`/`done`/`error`.
Ví dụ với Anthropic SDK:

```js
// npm i @anthropic-ai/sdk  ; đặt ANTHROPIC_API_KEY trong môi trường
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();

async function streamClaude(messages, res) {
  const stream = client.messages.stream({
    model: 'claude-opus-5',
    max_tokens: 2048,
    messages,                                  // đúng shape { role, content }
  });
  stream.on('text', (t) => sse(res, { type: 'delta', text: t })); // đẩy từng mẩu chữ
  const final = await stream.finalMessage();
  sse(res, { type: 'done', usage: final.usage });
}
```
Client (`chat.html`) **không cần sửa gì** vì khung SSE giữ nguyên.

---

## 10. Ghi nhớ nhanh

1. Một HTTP response có thể **ghi dần** (`res.write` nhiều lần) rồi mới `end()`.
2. Không set `Content-Length` → Node tự bật **chunked** → stream được.
3. SSE = các khối `data: {json}` ngăn nhau bằng **dòng trống** (`\n\n`).
4. Client **phải buffer** vì một `read()` có thể cắt ngang giữa sự kiện.
5. Chat nhiều lượt: gửi lại **cả** `messages` mỗi lần (HTTP stateless).
6. Dọn dẹp khi client ngắt: kiểm tra `res.destroyed` để dừng phát.
