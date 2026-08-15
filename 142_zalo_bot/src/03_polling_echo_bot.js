// 03 — Echo bot bằng LONG POLLING (getUpdates).
//
// Bot lặp lại (echo) mọi tin nhắn văn bản người dùng gửi tới.
// Chạy:  ZALO_BOT_TOKEN='<token>' npm run 03:poll   (Ctrl+C để dừng)
//
// ⚠️  getUpdates KHÔNG hoạt động nếu bạn đã setWebhook trước đó. Nếu đang dùng webhook,
//     chạy `node src/04_webhook_admin.js delete` để xoá webhook trước.

const BOT_TOKEN = process.env.ZALO_BOT_TOKEN;
const API_BASE = process.env.ZALO_API_BASE || "https://bot-api.zaloplatforms.com";
if (!BOT_TOKEN) {
  console.error("❌ Chưa có token. Chạy:  ZALO_BOT_TOKEN=... npm run 03:poll");
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log("🤖 Echo bot đang chạy (long polling). Nhắn cho bot để thử. Ctrl+C để dừng.\n");

let running = true;
process.on("SIGINT", () => {
  console.log("\n👋 Đang dừng bot...");
  running = false;
});

while (running) {
  try {
    // Long poll: request treo tối đa 30s chờ tin nhắn mới. Không có offset —
    // server tự theo dõi update nào đã trả về nên không lo nhận trùng.
    const result = await callApi("getUpdates", { timeout: 30 });
    const updates = !result ? [] : Array.isArray(result) ? result : [result];

    if (updates.length === 0) {
      await sleep(500); // hết timeout, không có gì mới → poll tiếp
      continue;
    }

    for (const update of updates) {
      const msg = update.message;
      if (!msg) continue;

      const from = msg.from?.display_name || msg.from?.id || "?";
      const chat = msg.chat || {};
      // chat.id CHÍNH LÀ chat_id cần cho sendMessage (02). Với NHÓM: thêm bot vào nhóm
      // bằng link mời, nhắn 1 tin trong nhóm → 2 dòng dưới in chat_id nhóm để bạn copy.
      console.log(
        `📩 [${update.event_name}] ${from} → chat_id=${chat.id}` +
          (chat.type ? ` [${chat.type}${chat.name ? ` "${chat.name}"` : ""}]` : "") +
          `: ${msg.text ?? "(không phải text)"}`,
      );
      console.log("   ↳ chat:", JSON.stringify(chat));

      if (update.event_name === "message.text.received" && msg.text) {
        await callApi("sendMessage", { chat_id: msg.chat.id, text: `Bạn vừa nói: ${msg.text}` });
      }
    }
  } catch (err) {
    console.error("⚠️  Lỗi khi poll:", err.message);
    await sleep(3000); // lỗi mạng → chờ rồi thử lại, tránh spam
  }
}

process.exit(0);
