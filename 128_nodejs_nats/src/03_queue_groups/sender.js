// ============================================================
// 03 – Queue Groups – Sender
// ============================================================
import { connect, StringCodec } from "nats";

const sc = StringCodec();
const nc = await connect({ servers: "nats://localhost:4222" });

console.log("✅ [Sender] Connected. Sending 20 orders...\n");

const products = ["Laptop", "Phone", "Tablet", "Monitor", "Keyboard"];

for (let i = 1; i <= 20; i++) {
  const order = {
    id: i,
    product: products[Math.floor(Math.random() * products.length)],
    quantity: Math.floor(Math.random() * 5) + 1,
    total: (Math.random() * 500 + 50).toFixed(2),
    timestamp: new Date().toISOString(),
  };

  nc.publish("orders.process", sc.encode(JSON.stringify(order)));
  console.log(`📤 [Sender] Order #${i} sent: ${order.product}`);

  // Gửi chậm một chút để thấy distribution
  await new Promise(r => setTimeout(r, 100));
}

await nc.drain();
console.log("\n✅ [Sender] All 20 orders sent.");
