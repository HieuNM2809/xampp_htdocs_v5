// 04 — Quản lý webhook: set / delete / info.
//
//   node src/04_webhook_admin.js set https://abc.ngrok.io   → đăng ký webhook
//   node src/04_webhook_admin.js info                       → xem cấu hình hiện tại
//   node src/04_webhook_admin.js delete                     → xoá webhook (quay lại dùng getUpdates)
//
// Với `set`: set sẵn WEBHOOK_SECRET_TOKEN để dùng lại đúng secret đó cho webhook server;
// nếu không, script tự sinh 1 secret ngẫu nhiên.

import { randomBytes } from "node:crypto";

const BOT_TOKEN = process.env.ZALO_BOT_TOKEN;
const API_BASE = process.env.ZALO_API_BASE || "https://bot-api.zaloplatforms.com";
if (!BOT_TOKEN) {
  console.error("❌ Chưa có token. Chạy:  ZALO_BOT_TOKEN=... node src/04_webhook_admin.js <cmd>");
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

const cmd = process.argv[2];

switch (cmd) {
  case "set": {
    const url = process.argv[3];
    if (!url) {
      console.error("❌ Thiếu URL. Dùng: node src/04_webhook_admin.js set https://your-domain");
      process.exit(1);
    }
    // secret_token 8-256 ký tự — Zalo gửi kèm trong header X-Bot-Api-Secret-Token.
    const secret = process.env.WEBHOOK_SECRET_TOKEN || randomBytes(16).toString("hex");
    const result = await callApi("setWebhook", { url, secret_token: secret });
    console.log("✅ Đã đăng ký webhook:", result.url);
    console.log("🔑 secret_token:", secret);
    console.log("   → Set secret này vào WEBHOOK_SECRET_TOKEN khi chạy 04:webhook để server xác thực.");
    break;
  }
  case "delete": {
    await callApi("deleteWebhook");
    console.log("✅ Đã xoá webhook. Giờ có thể dùng lại getUpdates (npm run 03:poll).");
    break;
  }
  case "info": {
    console.log(JSON.stringify(await callApi("getWebhookInfo"), null, 2));
    break;
  }
  default:
    console.error("Dùng: node src/04_webhook_admin.js <set|delete|info> [url]");
    process.exit(1);
}
