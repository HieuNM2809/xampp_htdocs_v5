// ============================================================
// 02 – Request / Reply – Client
// ============================================================
import { connect, StringCodec } from "nats";

const sc = StringCodec();
const nc = await connect({ servers: "nats://localhost:4222" });

console.log("✅ [Client] Connected to NATS");

// Helper
async function request(subject, data, timeoutMs = 3000) {
  try {
    const msg = await nc.request(subject, sc.encode(JSON.stringify(data)), {
      timeout: timeoutMs,
    });
    return JSON.parse(sc.decode(msg.data));
  } catch (err) {
    return { error: err.message };
  }
}

// ── Test Math Service ────────────────────────────────────────
console.log("\n📐 Testing Calculator Service:");
const ops = [
  { operation: "add",      a: 10, b: 5 },
  { operation: "multiply", a: 6,  b: 7 },
  { operation: "divide",   a: 10, b: 0 },
  { operation: "subtract", a: 100, b: 37 },
];

for (const op of ops) {
  const result = await request("math.calculate", op);
  console.log("  →", JSON.stringify(result));
}

// ── Test User Service ────────────────────────────────────────
console.log("\n👤 Testing User Lookup Service:");
for (const id of [1, 2, 99]) {
  const result = await request("user.find", { id });
  console.log(`  → User ${id}:`, JSON.stringify(result));
}

await nc.drain();
console.log("\n✅ [Client] All requests done. Exiting.");
