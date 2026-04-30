// ============================================================
// 01 – Basic Publish / Subscribe  (Fire-and-forget)
// Chạy subscriber TRƯỚC, sau đó chạy publisher
// ============================================================
import { connect, StringCodec } from "nats";

const sc = StringCodec();
const nc = await connect({ servers: "nats://localhost:4222" });

console.log("✅ [Publisher] Connected to NATS server");

// Publish đơn giản
nc.publish("greetings", sc.encode("Hello NATS! 🚀"));
console.log("📤 [Publisher] Sent: 'Hello NATS!'");

// Publish với subject phân cấp (dùng dấu chấm)
nc.publish("app.events.user.created", sc.encode(JSON.stringify({
  id: 1,
  name: "Nguyen Van A",
  email: "vana@example.com",
  createdAt: new Date().toISOString()
})));
console.log("📤 [Publisher] Sent user.created event");

// Publish nhiều message
for (let i = 1; i <= 5; i++) {
  nc.publish("app.counter", sc.encode(`Count: ${i}`));
}
console.log("📤 [Publisher] Sent 5 counter messages");

// Drain connection an toàn (flush và đóng)
await nc.drain();
console.log("🔌 [Publisher] Connection drained & closed");
