// 04 — Webhook server: nhận update từ Zalo qua HTTP POST (dùng built-in node:http, không cần Express).
//
// Thay vì tự đi hỏi (getUpdates), Zalo sẽ CHỦ ĐỘNG POST JSON tới URL bạn đăng ký.
// Chạy:  ZALO_BOT_TOKEN='<token>' WEBHOOK_SECRET_TOKEN='<secret>' npm run 04:webhook
//
// Zalo yêu cầu URL webhook là HTTPS công khai. Khi dev ở máy local, expose cổng này ra
// HTTPS bằng ngrok/cloudflared, rồi đăng ký URL đó: node src/04_webhook_admin.js set <url>

import { createServer } from "node:http";

const BOT_TOKEN = process.env.ZALO_BOT_TOKEN;
const API_BASE = process.env.ZALO_API_BASE || "https://bot-api.zaloplatforms.com";
if (!BOT_TOKEN) {
  console.error("❌ Chưa có token. Chạy:  ZALO_BOT_TOKEN=... npm run 04:webhook");
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const SECRET_TOKEN = process.env.WEBHOOK_SECRET_TOKEN || "";

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

const server = createServer((req, res) => {
  // health-check khi mở bằng trình duyệt (GET)
  if (req.method !== "POST") {
    res.writeHead(200);
    res.end("Zalo webhook server đang chạy");
    return;
  }

  // Xác thực: Zalo gắn secret token đã đăng ký vào header này.
  const got = req.headers["x-bot-api-secret-token"];
  if (SECRET_TOKEN && got !== SECRET_TOKEN) {
    console.warn("⚠️  Secret token không khớp → từ chối request");
    res.writeHead(401);
    res.end();
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    // Trả 200 NGAY để Zalo không retry; xử lý nghiệp vụ bất đồng bộ bên dưới.
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    handleUpdate(body).catch((err) => console.error("⚠️  Lỗi xử lý webhook:", err.message));
  });
});

async function handleUpdate(body) {
  const payload = JSON.parse(body);
  const update = payload.result || payload; // update nằm trong `result`
  const msg = update.message;
  if (!msg) return;

  const from = msg.from?.display_name || msg.from?.id || "?";
  const chat = msg.chat || {};
  // chat.id = chat_id cho sendMessage (02). Với NHÓM: thêm bot vào nhóm, nhắn 1 tin
  // trong nhóm → 2 dòng dưới in chat_id nhóm để copy.
  console.log(
    `📩 [${update.event_name}] ${from} → chat_id=${chat.id}` +
      (chat.type ? ` [${chat.type}${chat.name ? ` "${chat.name}"` : ""}]` : "") +
      `: ${msg.text ?? "(không phải text)"}`,
  );
  console.log("   ↳ chat:", JSON.stringify(chat));

  if (update.event_name === "message.text.received" && msg.text) {
    await callApi("sendMessage", { chat_id: msg.chat.id, text: `Webhook nhận được: ${msg.text}` });
  }
}

server.listen(PORT, () => {
  console.log(`🌐 Webhook server: http://localhost:${PORT}`);
  if (!SECRET_TOKEN) {
    console.log("⚠️  Chưa set WEBHOOK_SECRET_TOKEN → server KHÔNG xác thực request (chỉ nên vậy khi test).");
  }
  console.log("   Expose ra HTTPS rồi đăng ký:  node src/04_webhook_admin.js set <https-url>");
});
