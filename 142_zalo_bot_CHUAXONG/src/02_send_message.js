// 02 — sendMessage: gửi 1 tin nhắn văn bản tới một chat_id.
//
// Chạy:  ZALO_BOT_TOKEN='<token>' node src/02_send_message.js <chat_id> "nội dung"
//
// chat_id lấy ở đâu? → chạy 03 (polling) hoặc 04 (webhook); khi có người nhắn cho bot
// sẽ in ra chat_id của họ. Bot KHÔNG thể nhắn trước cho người chưa từng nhắn nó.
//
// Gửi vào NHÓM: thêm bot vào nhóm bằng link mời (trong thông báo khởi tạo bot), nhắn
// 1 tin trong nhóm → 03/04 in ra chat_id của nhóm; dùng chat_id đó để gửi thông báo.

const BOT_TOKEN = process.env.ZALO_BOT_TOKEN;
const API_BASE = process.env.ZALO_API_BASE || "https://bot-api.zaloplatforms.com";
if (!BOT_TOKEN) {
  console.error("❌ Chưa có token. Chạy:  ZALO_BOT_TOKEN=... node src/02_send_message.js ...");
  process.exit(1);
}

async function callApi(method, params = {}) {
  const res = await fetch(`${API_BASE}/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => null);
  if (!data || !data.ok) {
    throw new Error(`${method}: ${data?.description || data?.message || `HTTP ${res.status}`}`);
  }
  return data.result;
}

const chatId = process.argv[2] || process.env.CHAT_ID;
const text =
  process.argv[3] || `Xin chào từ Zalo Bot 👋 (gửi lúc ${new Date().toLocaleString("vi-VN")})`;

if (!chatId) {
  console.error('❌ Thiếu chat_id. Dùng: node src/02_send_message.js <chat_id> "nội dung"');
  process.exit(1);
}

const result = await callApi("sendMessage", { chat_id: chatId, text });
console.log("✅ Đã gửi. message_id =", result.message_id);
