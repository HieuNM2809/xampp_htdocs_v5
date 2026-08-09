// 01 — getMe: xác minh token và xem thông tin bot.
//
// Chạy:  ZALO_BOT_TOKEN='<token-cua-ban>' node src/01_getme.js   (hoặc: npm run 01:getme)
// getMe là cách nhanh nhất để kiểm tra token có hợp lệ hay không.

const BOT_TOKEN = process.env.ZALO_BOT_TOKEN;
const API_BASE = process.env.ZALO_API_BASE || "https://bot-api.zaloplatforms.com";

if (!BOT_TOKEN) {
  console.error("❌ Chưa có token. Chạy:  ZALO_BOT_TOKEN=... node src/01_getme.js");
  process.exit(1);
}

// Gọi 1 method của Zalo Bot API: POST /bot<TOKEN>/<method>, body & response đều là JSON.
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

const me = await callApi("getMe");
console.log("✅ Token hợp lệ, bot đang hoạt động!\n");
console.log(JSON.stringify(me, null, 2));
console.log(`\n🤖 ${me.account_name}  (id=${me.id}, type=${me.account_type})`);
