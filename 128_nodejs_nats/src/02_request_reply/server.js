// ============================================================
// 02 – Request / Reply Pattern
// Giống RPC: client gửi request, server xử lý & trả reply
// ============================================================
import { connect, StringCodec } from "nats";

const sc = StringCodec();
const nc = await connect({ servers: "nats://localhost:4222" });

console.log("✅ [Server] Ready to handle requests");

// ── Calculator Service ───────────────────────────────────────
const calcSub = nc.subscribe("math.calculate");
(async () => {
  for await (const msg of calcSub) {
    const { operation, a, b } = JSON.parse(sc.decode(msg.data));
    let result;

    switch (operation) {
      case "add":      result = a + b; break;
      case "subtract": result = a - b; break;
      case "multiply": result = a * b; break;
      case "divide":
        if (b === 0) {
          msg.respond(sc.encode(JSON.stringify({ error: "Division by zero" })));
          continue;
        }
        result = a / b;
        break;
      default:
        msg.respond(sc.encode(JSON.stringify({ error: `Unknown operation: ${operation}` })));
        continue;
    }

    const response = { operation, a, b, result };
    console.log(`🧮 [Server] ${a} ${operation} ${b} = ${result}`);
    msg.respond(sc.encode(JSON.stringify(response)));
  }
})();

// ── User Lookup Service ──────────────────────────────────────
const users = {
  1: { id: 1, name: "Alice", role: "admin" },
  2: { id: 2, name: "Bob",   role: "user" },
  3: { id: 3, name: "Carol", role: "user" },
};

const userSub = nc.subscribe("user.find");
(async () => {
  for await (const msg of userSub) {
    const { id } = JSON.parse(sc.decode(msg.data));
    const user = users[id];
    const response = user
      ? { success: true, user }
      : { success: false, error: `User ${id} not found` };
    console.log(`👤 [Server] Looking up user ${id}:`, response);
    msg.respond(sc.encode(JSON.stringify(response)));
  }
})();

console.log("🚀 [Server] Services running: math.calculate, user.find");
console.log("   Press Ctrl+C to stop\n");

process.on("SIGINT", async () => {
  await nc.drain();
  process.exit(0);
});
