// ============================================================
// 06 – Object Store (JetStream)
// Lưu trữ binary data lớn (file, blob) qua NATS
// ============================================================
import { connect } from "nats";
import { createHash } from "crypto";

const nc = await connect({ servers: "nats://localhost:4222" });
const js = nc.jetstream();

console.log("✅ [Object Store] Connected\n");

// ── Tạo Object Store bucket ──────────────────────────────────
const os = await js.views.os("file-storage", {
  storage: "file",          // lưu disk
  max_chunk_size: 128 * 1024, // 128KB mỗi chunk
});
console.log("🗄️  Object Store 'file-storage' ready\n");

// ── PUT – upload object ──────────────────────────────────────
const configData = Buffer.from(JSON.stringify({
  version: "1.0.0",
  database: { host: "localhost", port: 5432 },
  redis: { host: "localhost", port: 6379 },
  features: { darkMode: true, beta: false }
}, null, 2));

await os.put(
  { name: "app-config.json", description: "Application configuration" },
  configData
);
console.log(`📤 PUT app-config.json (${configData.length} bytes)`);

// Upload binary-ish data (simulate image)
const fakeImageData = Buffer.alloc(1024, 0xff); // 1KB fake data
await os.put(
  { name: "logo.png", description: "Company logo" },
  fakeImageData
);
console.log(`📤 PUT logo.png (${fakeImageData.length} bytes)`);

// ── GET – download object ────────────────────────────────────
console.log("\n📥 GET app-config.json:");
const result = await os.get("app-config.json");
if (result) {
  const data = await result.data;
  const config = JSON.parse(new TextDecoder().decode(data));
  console.log(`   Size   : ${data.byteLength} bytes`);
  console.log(`   Config :`, config);
}

// ── LIST – danh sách objects ─────────────────────────────────
console.log("\n📋 List all objects:");
const list = await os.list();
for await (const info of list) {
  console.log(`   - ${info.name} | ${info.size} bytes | ${info.description}`);
}

// ── INFO – metadata của object ───────────────────────────────
const info = await os.info("app-config.json");
console.log(`\n📊 Info for app-config.json:`);
console.log(`   Name   : ${info.name}`);
console.log(`   Size   : ${info.size}`);
console.log(`   Chunks : ${info.chunks}`);
console.log(`   Digest : ${info.digest}`);

// ── DELETE ───────────────────────────────────────────────────
await os.delete("logo.png");
console.log(`\n🗑️  Deleted logo.png`);

await nc.drain();
console.log("\n✅ [Object Store] Demo complete.");
