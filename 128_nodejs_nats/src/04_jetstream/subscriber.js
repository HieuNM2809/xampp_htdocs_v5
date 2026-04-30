// ============================================================
// 04 – JetStream Subscriber (Durable Consumer)
// Durable consumer: có thể resume từ vị trí cuối khi restart
// ============================================================
import { connect, StringCodec, AckPolicy, DeliverPolicy } from "nats";

const sc = StringCodec();
const nc = await connect({ servers: "nats://localhost:4222" });
const js = nc.jetstream();
const jsm = await nc.jetstreamManager();

console.log("✅ [JetStream Subscriber] Connected");

// ── Tạo Durable Consumer ─────────────────────────────────────
const CONSUMER_NAME = "event-processor-v1";

try {
  await jsm.consumers.add("EVENTS", {
    durable_name: CONSUMER_NAME,
    ack_policy: AckPolicy.Explicit,          // phải ack rõ ràng
    deliver_policy: DeliverPolicy.All,       // nhận từ đầu stream
    filter_subject: "events.>",
    max_deliver: 3,                          // retry tối đa 3 lần nếu không ack
    ack_wait: 30 * 1e9,                      // 30s timeout để ack (nanoseconds)
  });
  console.log(`✅ Durable consumer '${CONSUMER_NAME}' created`);
} catch (err) {
  if (err.message?.includes("consumer name already in use")) {
    console.log(`✅ Durable consumer '${CONSUMER_NAME}' already exists – resuming`);
  } else throw err;
}

// ── Consume messages ──────────────────────────────────────────
const consumer = await js.consumers.get("EVENTS", CONSUMER_NAME);
const messages = await consumer.consume({ max_messages: 20 });

console.log("\n📥 Processing events:\n");
let count = 0;

for await (const msg of messages) {
  const event = JSON.parse(sc.decode(msg.data));

  console.log(`[Seq ${msg.seq}] 📩 ${event.type}`);
  console.log(`         ID: ${event.id}`);
  console.log(`         Payload: ${JSON.stringify(event.payload)}`);
  console.log(`         Time: ${event.timestamp}`);

  // Giả lập xử lý có thể fail
  const willFail = Math.random() < 0.1; // 10% chance fail

  if (willFail) {
    console.log(`         ❌ Processing failed! NAK (will retry)...`);
    msg.nak();  // NAK → NATS sẽ redeliver sau
  } else {
    // ACK → xác nhận đã xử lý xong, không redeliver
    msg.ack();
    console.log(`         ✅ ACK sent\n`);
    count++;
  }

  if (count >= 10) break;
}

console.log(`\n📊 Processed ${count} events successfully`);

await nc.drain();
