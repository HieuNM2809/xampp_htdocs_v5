# 💬 Chat Streaming (mock) — trả lời hiện dần từng chữ

Một ví dụ **duy nhất, gọn**: giao diện chat mà câu trả lời **hiện dần từng chữ**
giống ChatGPT/Claude, thay vì chờ sinh xong cả câu mới trả về.

Câu trả lời là **mô phỏng** (server tự bịa, không gọi API nào) nên chạy được
ngay — **không cần API key, không cần cài gì**.

## 🔧 Chạy

```bash
node server.js          # rồi mở http://localhost:3144
```

(hoặc `npm start`)

## 🧠 Cơ chế (tóm tắt)

```
[Trình duyệt]  --POST /chat { messages:[...] }-->  [server.js]
      ^                                                  |
      |         data: {"type":"delta","text":"..."}      | "gõ" từng chữ
      +--------------- từng chữ về ngay ------------------+
```

1. **Gửi cả lịch sử hội thoại** — mỗi lượt client POST toàn bộ mảng `messages`
   (`{ role, content }`), nên khung sẵn sàng cho chat nhiều lượt.
2. **Streaming bằng `fetch` + đọc `response.body`** — không dùng `EventSource`
   (nó chỉ GET được). Đây đúng là cách web chat thật gửi kèm body rồi đọc dần.
3. **Khung SSE đơn giản** — mỗi sự kiện là một dòng `data: {json}\n\n`:

   | `type`  | Ý nghĩa |
   |---------|---------|
   | `delta` | một mẩu chữ (`text`) — lặp nhiều lần, đây là phần "gõ chữ" |
   | `done`  | kết thúc + `usage.output_tokens` |
   | `error` | có lỗi |

4. **Server "gõ" chữ** bằng cách cắt câu trả lời thành từng mẩu rồi đẩy dần, có
   độ trễ nhỏ (`sleep`) để thấy hiệu ứng:

   ```js
   for (const tok of tokens) {
     sse(res, { type: 'delta', text: tok });
     await sleep(45);
   }
   sse(res, { type: 'done', usage: { output_tokens: tokens.length } });
   ```

## 📂 File

| File | Vai trò |
|------|---------|
| `server.js` | HTTP server: phục vụ trang chat + endpoint `POST /chat` stream chữ (mock) |
| `public/chat.html` | UI chat: bong bóng tin nhắn, hiệu ứng gõ chữ, giữ lịch sử hội thoại |

## ⚡ Ghi nhớ

- **Streaming = phản hồi sớm**: chữ hiện ngay thay vì chờ cả câu (TTFB thấp).
- Đây là **mock** — muốn nối vào model thật, chỉ việc thay hàm `streamMock()`
  trong `server.js` bằng lời gọi stream của API, vẫn giữ nguyên khung SSE ở trên.
- Đổi tốc độ "gõ": sửa `sleep(45)` trong `server.js`.
