// ============================================================
// 04 – JetStream Publisher (Persistent Messaging)
// JetStream = NATS + persistence + at-least-once delivery
// ============================================================
import { connect, StringCodec, AckPolicy, RetentionPolicy, StorageType } from "nats";

const sc = StringCodec();
const nc = await connect({ servers: "nats://localhost:4222" });
const js = nc.jetstream();
const jsm = await nc.jetstreamManager();

console.log("✅ [JetStream Publisher] Connected");

// ── Tạo Stream ───────────────────────────────────────────────
// Stream lưu trữ messages ngay cả khi không có subscriber
try {
  await jsm.streams.add({
    name: "EVENTS",
    subjects: ["events.>"],             // capture tất cả events.* subjects
    retention: RetentionPolicy.Limits,  // giữ theo limit
    storage: StorageType.File,          // lưu ra disk (bền vững)
    max_msgs: 10_000,
    max_bytes: 50 * 1024 * 1024,        // 50MB
    max_age: 24 * 60 * 60 * 1e9,       // 24h (nanoseconds)
    num_replicas: 1,
  });
  console.log("📁 [JetStream] Stream 'EVENTS' created");
} catch (err) {
  if (err.message?.includes("stream name already in use")) {
    console.log("📁 [JetStream] Stream 'EVENTS' already exists");
  } else {
    throw err;
  }
}

// ── Publish messages ─────────────────────────────────────────
const eventTypes = ["user.created", "order.placed", "payment.processed", "shipment.sent"];

console.log("\n📤 Publishing 10 events to JetStream...");

for (let i = 1; i <= 10; i++) {
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const event = {
    id: `evt-${Date.now()}-${i}`,
    type: eventType,
    payload: { userId: Math.floor(Math.random() * 100), amount: (Math.random() * 200).toFixed(2) },
    timestamp: new Date().toISOString(),
  };

  // publish() trả về PubAck – xác nhận server đã lưu
  const ack = await js.publish(`events.${eventType}`, sc.encode(JSON.stringify(event)));
  console.log(`  ✅ Event #${ack.seq}: ${event.type} | stream: ${ack.stream}`);
}

// ── Xem thông tin stream ──────────────────────────────────────
const info = await jsm.streams.info("EVENTS");
console.log(`\n📊 Stream Info:
  Messages : ${info.state.messages}
  Bytes    : ${info.state.bytes}
  First Seq: ${info.state.first_seq}
  Last Seq : ${info.state.last_seq}`);

await nc.drain();
console.log("\n✅ [JetStream Publisher] Done.");
