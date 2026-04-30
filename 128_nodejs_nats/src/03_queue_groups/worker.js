// ============================================================
// 03 – Queue Groups (Load Balancing)
// Nhiều worker cùng group → NATS chỉ deliver cho 1 worker
// Chạy nhiều instance file này để thấy load balancing
// ============================================================
import { connect, StringCodec } from "nats";

const sc = StringCodec();
const nc = await connect({ servers: "nats://localhost:4222" });

const WORKER_ID = process.env.WORKER_ID || Math.random().toString(36).slice(2, 6);

console.log(`✅ [Worker-${WORKER_ID}] Started and joined queue group "order-processors"`);

// Queue subscription: tất cả worker join group "order-processors"
// NATS sẽ round-robin hoặc random chọn 1 worker mỗi message
const sub = nc.subscribe("orders.process", {
  queue: "order-processors",  // ← key: queue group name
});

let processed = 0;

(async () => {
  for await (const msg of sub) {
    const order = JSON.parse(sc.decode(msg.data));

    // Giả lập xử lý mất thời gian
    const delay = Math.floor(Math.random() * 500) + 100;
    await new Promise(resolve => setTimeout(resolve, delay));

    processed++;
    console.log(
      `📦 [Worker-${WORKER_ID}] Processed order #${order.id}` +
      ` | Product: ${order.product} | Total: $${order.total}` +
      ` | Time: ${delay}ms | Count: ${processed}`
    );

    // Nếu subscriber muốn reply (optional)
    if (msg.reply) {
      msg.respond(sc.encode(JSON.stringify({
        status: "processed",
        workerId: WORKER_ID,
        orderId: order.id,
      })));
    }
  }
})();

process.on("SIGINT", async () => {
  console.log(`\n🛑 [Worker-${WORKER_ID}] Shutting down. Processed ${processed} orders.`);
  await nc.drain();
  process.exit(0);
});
