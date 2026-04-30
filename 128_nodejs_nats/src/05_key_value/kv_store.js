// ============================================================
// 05 – Key/Value Store (JetStream KV)
// NATS KV: distributed key-value store với watch & history
// ============================================================
import { connect, StringCodec } from "nats";

const sc = StringCodec();
const nc = await connect({ servers: "nats://localhost:4222" });
const js = nc.jetstream();

console.log("✅ [KV Store] Connected to NATS JetStream\n");

// ── Tạo KV bucket ────────────────────────────────────────────
const kv = await js.views.kv("user-sessions", {
  history: 5,                   // giữ 5 version cũ
  ttl: 60 * 60 * 1000,          // key expires sau 1h (milliseconds)
});

console.log("🗄️  KV Bucket 'user-sessions' ready\n");

// ── PUT – lưu giá trị ────────────────────────────────────────
await kv.put("user:1001", sc.encode(JSON.stringify({
  userId: 1001, token: "abc123", ip: "192.168.1.1", loginAt: new Date().toISOString()
})));
await kv.put("user:1002", sc.encode(JSON.stringify({
  userId: 1002, token: "xyz789", ip: "10.0.0.5", loginAt: new Date().toISOString()
})));
await kv.put("config:theme", sc.encode("dark"));
await kv.put("config:lang",  sc.encode("vi"));

console.log("📝 PUT 4 keys");

// ── GET – lấy giá trị ────────────────────────────────────────
const entry = await kv.get("user:1001");
if (entry) {
  const session = JSON.parse(sc.decode(entry.value));
  console.log(`\n📖 GET user:1001:`);
  console.log(`   Revision: ${entry.revision}`);
  console.log(`   Value:`, session);
}

// ── UPDATE – cập nhật (optimistic concurrency via revision) ──
const existing = await kv.get("config:theme");
await kv.update("config:theme", sc.encode("light"), existing.revision);
console.log(`\n✏️  UPDATE config:theme: dark → light`);

// ── DELETE ───────────────────────────────────────────────────
await kv.delete("user:1002");
console.log(`🗑️  DELETE user:1002`);

// ── KEYS – list tất cả keys ──────────────────────────────────
console.log("\n🔑 All keys:");
const keys = await kv.keys();
for await (const key of keys) {
  console.log(`   - ${key}`);
}

// ── HISTORY – xem lịch sử thay đổi ─────────────────────────
console.log("\n📜 History for config:theme:");
const history = await kv.history({ key: "config:theme" });
for await (const h of history) {
  if (h.value.length > 0) {
    console.log(`   Rev ${h.revision}: "${sc.decode(h.value)}" op=${h.operation}`);
  }
}

// ── WATCH – observe changes realtime ────────────────────────
console.log("\n👁️  Watching all keys for 3 seconds...");
const watcher = await kv.watch();

setTimeout(async () => {
  // Trigger một số thay đổi
  await kv.put("config:lang", sc.encode("en"));
  await kv.put("user:1003", sc.encode(JSON.stringify({ userId: 1003, token: "new" })));
}, 500);

const watchTimeout = setTimeout(async () => {
  watcher.stop();
  await nc.drain();
  console.log("\n✅ [KV Store] Demo complete.");
  process.exit(0);
}, 3000);

for await (const entry of watcher) {
  if (entry.value.length > 0) {
    console.log(`   🔔 ${entry.operation} "${entry.key}" = "${sc.decode(entry.value)}"`);
  } else {
    console.log(`   🔔 ${entry.operation} "${entry.key}"`);
  }
}
