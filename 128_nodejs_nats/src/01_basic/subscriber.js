// ============================================================
// 01 – Basic Subscriber
// ============================================================
import { connect, StringCodec } from "nats";

const sc = StringCodec();
const nc = await connect({ servers: "nats://localhost:4222" });

console.log("✅ [Subscriber] Connected to NATS server");

// ── Subscribe exact subject ──────────────────────────────────
const sub1 = nc.subscribe("greetings");
(async () => {
  for await (const msg of sub1) {
    console.log(`📩 [greetings] ${sc.decode(msg.data)}`);
  }
})();

// ── Wildcard * (một token) ───────────────────────────────────
// app.events.user.* → nhận mọi event của user
const sub2 = nc.subscribe("app.events.user.*");
(async () => {
  for await (const msg of sub2) {
    const payload = JSON.parse(sc.decode(msg.data));
    console.log(`📩 [user.*] Subject: ${msg.subject}`, payload);
  }
})();

// ── Wildcard > (nhiều token) ─────────────────────────────────
// app.> → nhận tất cả message trong namespace app
const sub3 = nc.subscribe("app.>");
(async () => {
  for await (const msg of sub3) {
    console.log(`📩 [app.>] Subject: ${msg.subject} | Data: ${sc.decode(msg.data)}`);
  }
})();

console.log("👂 [Subscriber] Listening on: greetings, app.events.user.*, app.>");
console.log("   Press Ctrl+C to exit\n");

// Giữ process chạy
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down subscriber...");
  await nc.drain();
  process.exit(0);
});
