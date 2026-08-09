// 05 — Tin nhắn có ĐỊNH DẠNG (parse_mode) và gửi ẢNH (sendPhoto).
//
// Chạy:  ZALO_BOT_TOKEN='<token>' node src/05_rich_message.js <chat_id>
// Cú pháp markdown/html theo tài liệu: https://bot.zapps.me/docs/apis/sendMessage/

const BOT_TOKEN = process.env.ZALO_BOT_TOKEN;
const API_BASE = process.env.ZALO_API_BASE || "https://bot-api.zaloplatforms.com";
if (!BOT_TOKEN) {
  console.error("❌ Chưa có token. Chạy:  ZALO_BOT_TOKEN=... node src/05_rich_message.js <chat_id>");
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
if (!chatId) {
  console.error("❌ Thiếu chat_id. Dùng: node src/05_rich_message.js <chat_id>");
  process.exit(1);
}

// 1) Markdown
await callApi("sendMessage", {
  chat_id: chatId,
  text: "*Chữ đậm*\n_chữ nghiêng_\nDòng thường.",
  parse_mode: "markdown",
});
console.log("✅ Đã gửi tin nhắn markdown");

// 2) HTML
await callApi("sendMessage", {
  chat_id: chatId,
  text: "<b>Đậm HTML</b> và <i>nghiêng HTML</i>",
  parse_mode: "html",
});
console.log("✅ Đã gửi tin nhắn HTML");

// 3) Ảnh kèm caption
await callApi("sendPhoto", {
  chat_id: chatId,
  photo: "https://picsum.photos/600/400",
  caption: "Ảnh ngẫu nhiên gửi từ Zalo Bot 📷",
});
console.log("✅ Đã gửi ảnh");
