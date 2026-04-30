// ============================================================
// 07 – Microservices Pattern with NATS
// Mô phỏng hệ thống e-commerce: Order Service gọi các services
// ============================================================
import { connect, StringCodec } from "nats";

const sc = StringCodec();
const nc = await connect({ servers: "nats://localhost:4222" });

const SERVICE_NAME = "order-service";
console.log(`✅ [${SERVICE_NAME}] Started\n`);

// ── Utility: call another microservice ─────────────────────
async function callService(subject, data, timeout = 5000) {
  try {
    const msg = await nc.request(subject, sc.encode(JSON.stringify(data)), { timeout });
    return { ok: true, data: JSON.parse(sc.decode(msg.data)) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── Inventory Service ────────────────────────────────────────
const inventorySub = nc.subscribe("inventory.check");
(async () => {
  const stock = { "P001": 50, "P002": 0, "P003": 10 };
  for await (const msg of inventorySub) {
    const { productId, quantity } = JSON.parse(sc.decode(msg.data));
    const available = stock[productId] ?? 0;
    const canFulfill = available >= quantity;
    if (canFulfill) stock[productId] -= quantity;
    console.log(`📦 [inventory-service] Check ${productId} qty=${quantity}: ${canFulfill ? "✅ OK" : "❌ Out of stock"}`);
    msg.respond(sc.encode(JSON.stringify({ available, canFulfill })));
  }
})();

// ── Payment Service ──────────────────────────────────────────
const paymentSub = nc.subscribe("payment.process");
(async () => {
  for await (const msg of paymentSub) {
    const { orderId, amount, method } = JSON.parse(sc.decode(msg.data));
    // Giả lập 95% success rate
    const success = Math.random() > 0.05;
    console.log(`💳 [payment-service] Order ${orderId} $${amount} via ${method}: ${success ? "✅ OK" : "❌ Declined"}`);
    msg.respond(sc.encode(JSON.stringify({
      success,
      transactionId: success ? `TXN-${Date.now()}` : null,
      reason: success ? null : "Insufficient funds",
    })));
  }
})();

// ── Notification Service ─────────────────────────────────────
const notifSub = nc.subscribe("notification.send");
(async () => {
  for await (const msg of notifSub) {
    const { to, type, data } = JSON.parse(sc.decode(msg.data));
    console.log(`📧 [notification-service] Sent ${type} to ${to}`);
    msg.respond(sc.encode(JSON.stringify({ sent: true })));
  }
})();

// ── Order Service – Orchestrator ─────────────────────────────
const orderSub = nc.subscribe("order.create");
(async () => {
  for await (const msg of orderSub) {
    const order = JSON.parse(sc.decode(msg.data));
    const orderId = `ORD-${Date.now()}`;
    console.log(`\n🛒 [order-service] Processing order ${orderId} for user ${order.userId}`);

    // 1. Check inventory
    const inv = await callService("inventory.check", { productId: order.productId, quantity: order.quantity });
    if (!inv.ok || !inv.data.canFulfill) {
      const err = { success: false, orderId, reason: "Out of stock" };
      console.log(`  ❌ Inventory failed:`, err);
      msg.respond(sc.encode(JSON.stringify(err)));
      continue;
    }
    console.log(`  ✅ Inventory OK`);

    // 2. Process payment
    const pay = await callService("payment.process", {
      orderId, amount: order.total, method: order.paymentMethod
    });
    if (!pay.ok || !pay.data.success) {
      const err = { success: false, orderId, reason: pay.data?.reason || "Payment failed" };
      console.log(`  ❌ Payment failed:`, err);
      msg.respond(sc.encode(JSON.stringify(err)));
      continue;
    }
    console.log(`  ✅ Payment OK: ${pay.data.transactionId}`);

    // 3. Send confirmation
    await callService("notification.send", {
      to: order.email, type: "ORDER_CONFIRMED",
      data: { orderId, transactionId: pay.data.transactionId }
    });

    const result = { success: true, orderId, transactionId: pay.data.transactionId };
    console.log(`  ✅ Order complete:`, result);
    msg.respond(sc.encode(JSON.stringify(result)));
  }
})();

console.log("🚀 All microservices running:");
console.log("   - inventory.check");
console.log("   - payment.process");
console.log("   - notification.send");
console.log("   - order.create (orchestrator)\n");

// ── Demo: place some test orders ─────────────────────────────
await new Promise(r => setTimeout(r, 200)); // wait for subs to be ready

const testOrders = [
  { userId: 101, productId: "P001", quantity: 2, total: 199.98, paymentMethod: "card", email: "alice@example.com" },
  { userId: 102, productId: "P002", quantity: 1, total: 49.99,  paymentMethod: "card", email: "bob@example.com"   },
  { userId: 103, productId: "P003", quantity: 1, total: 89.99,  paymentMethod: "paypal", email: "carol@example.com" },
];

console.log("─".repeat(60));
console.log("TEST ORDERS:");
console.log("─".repeat(60));

for (const order of testOrders) {
  const result = await callService("order.create", order);
  console.log(`\n📋 Result for user ${order.userId}:`, result.data);
}

console.log("\n" + "─".repeat(60));
await nc.drain();
console.log("✅ [Microservices] Demo complete.");
