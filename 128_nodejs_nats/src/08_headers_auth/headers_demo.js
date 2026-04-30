// ============================================================
// 08 – Headers & Authentication
// ============================================================
import { connect, StringCodec, headers } from "nats";

const sc = StringCodec();

// ── Kết nối với credentials (token-based) ───────────────────
// Trong production, dùng: nats://token@localhost:4222
// hoặc NKey / JWT credentials
const nc = await connect({
  servers: "nats://localhost:4222",
  // token: "my-secret-token",   // uncomment nếu server yêu cầu auth
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectTimeWait: 1000,
  pingInterval: 30000,
  maxPingOut: 3,
});

console.log("✅ [Headers Demo] Connected\n");

// ── Subscriber với header inspection ────────────────────────
const sub = nc.subscribe("api.request");
(async () => {
  for await (const msg of sub) {
    const traceId      = msg.headers?.get("X-Trace-ID") || "N/A";
    const contentType  = msg.headers?.get("Content-Type") || "N/A";
    const authToken    = msg.headers?.get("Authorization") || "N/A";
    const version      = msg.headers?.get("X-API-Version") || "N/A";

    const body = JSON.parse(sc.decode(msg.data));

    console.log(`📩 Received request:`);
    console.log(`   Trace-ID  : ${traceId}`);
    console.log(`   Content   : ${contentType}`);
    console.log(`   API Ver   : ${version}`);
    console.log(`   Auth      : ${authToken.substring(0, 20)}...`);
    console.log(`   Body      :`, body);

    // Reply with headers too
    const replyHeaders = headers();
    replyHeaders.set("X-Trace-ID", traceId);         // propagate trace
    replyHeaders.set("X-Processed-By", "api-gateway");
    replyHeaders.set("X-Response-Time", `${Date.now()}ms`);
    replyHeaders.set("Content-Type", "application/json");

    if (msg.reply) {
      msg.respond(
        sc.encode(JSON.stringify({ status: "ok", echo: body })),
        { headers: replyHeaders }
      );
    }
  }
})();

// ── Publisher gửi message với headers ────────────────────────
console.log("📤 Sending requests with headers...\n");

const requests = [
  { path: "/api/users",   method: "GET",  body: { page: 1, limit: 10 } },
  { path: "/api/orders",  method: "POST", body: { product: "laptop", qty: 1 } },
  { path: "/api/profile", method: "GET",  body: { userId: 42 } },
];

for (const req of requests) {
  const h = headers();
  h.set("X-Trace-ID",    `trace-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  h.set("Content-Type",  "application/json");
  h.set("Authorization", `Bearer eyJhbGciOiJSUzI1NiJ9.eyJ1c2VyIjoiYWxpY2UifQ.signature`);
  h.set("X-API-Version", "2.0");
  h.set("X-Method",      req.method);

  try {
    const reply = await nc.request(
      "api.request",
      sc.encode(JSON.stringify({ path: req.path, ...req.body })),
      { headers: h, timeout: 3000 }
    );
    const response = JSON.parse(sc.decode(reply.data));
    const replyTraceId = reply.headers?.get("X-Trace-ID");
    console.log(`✅ [${req.method}] ${req.path}`);
    console.log(`   TraceID : ${replyTraceId}`);
    console.log(`   Response:`, response);
    console.log();
  } catch (err) {
    console.error(`❌ Request failed: ${err.message}`);
  }
}

// ── Connection status monitoring ─────────────────────────────
nc.status().then(async (iter) => {
  // iter is async iterable
}).catch(() => {});

await nc.drain();
console.log("✅ [Headers Demo] Done.");
