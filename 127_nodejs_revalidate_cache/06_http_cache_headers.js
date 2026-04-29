/**
 * ============================================================
 * LEVEL 6: HTTP CACHE HEADERS - Browser & CDN Revalidation
 * ============================================================
 * Khái niệm:
 *   - HTTP Cache hoạt động ở tầng browser, CDN, proxy
 *   - Server điều khiển thông qua response headers
 *   - Revalidate = browser hỏi server "data còn mới không?"
 *     -> Server trả 304 Not Modified (không gửi lại body)
 *     -> Hoặc 200 + data mới
 *
 * Các headers quan trọng:
 *   Cache-Control: max-age=60, stale-while-revalidate=300
 *   ETag: "abc123"          -> fingerprint của content
 *   Last-Modified: <date>   -> thời gian sửa cuối
 *   Vary: Accept-Language   -> cache khác nhau theo language
 *
 * Luồng revalidation:
 *   1. Browser lưu response + ETag/Last-Modified
 *   2. Sau max-age -> browser gửi conditional request:
 *      If-None-Match: "abc123"       (dùng ETag)
 *      If-Modified-Since: <date>     (dùng Last-Modified)
 *   3. Server so sánh -> 304 hoặc 200
 * ============================================================
 */

import express from "express";
import crypto from "crypto";

const app = express();
const PORT = 3006;

// -------------------------------------------------------
// Giả lập "database" data
// -------------------------------------------------------
let products = [
  { id: 1, name: "Laptop Pro", price: 25000000, stock: 50 },
  { id: 2, name: "Phone X", price: 15000000, stock: 100 },
  { id: 3, name: "Tablet Z", price: 10000000, stock: 75 },
];

let lastModified = new Date();

function getProductsEtag() {
  return crypto.createHash("md5").update(JSON.stringify(products)).digest("hex");
}

// -------------------------------------------------------
// Helper: Tính Cache-Control header
// -------------------------------------------------------
function buildCacheControlHeader(options = {}) {
  const {
    public: isPublic = true,
    maxAge = 0,
    sMaxAge = 0,
    staleWhileRevalidate = 0,
    staleIfError = 0,
    noStore = false,
    noCache = false,
    mustRevalidate = false,
    immutable = false,
  } = options;

  if (noStore) return "no-store";

  const parts = [];
  if (isPublic) parts.push("public");
  else parts.push("private");

  if (noCache) {
    parts.push("no-cache");
  } else {
    if (maxAge > 0) parts.push(`max-age=${maxAge}`);
    if (sMaxAge > 0) parts.push(`s-maxage=${sMaxAge}`);
    if (staleWhileRevalidate > 0) parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    if (staleIfError > 0) parts.push(`stale-if-error=${staleIfError}`);
    if (mustRevalidate) parts.push("must-revalidate");
    if (immutable) parts.push("immutable");
  }

  return parts.join(", ");
}

// -------------------------------------------------------
// ENDPOINT 1: No Cache (luôn fetch mới)
// -------------------------------------------------------
app.get("/api/no-cache", (req, res) => {
  console.log(`  📥 GET /api/no-cache`);

  res.setHeader("Cache-Control", "no-store");
  res.json({
    _info: "no-store: Browser không cache gì cả",
    timestamp: new Date().toISOString(),
    data: products,
  });
});

// -------------------------------------------------------
// ENDPOINT 2: Simple max-age (TTL-based)
// -------------------------------------------------------
app.get("/api/simple-cache", (req, res) => {
  console.log(`  📥 GET /api/simple-cache`);

  res.setHeader(
    "Cache-Control",
    buildCacheControlHeader({ maxAge: 30 }) // Cache 30 giây
  );
  res.json({
    _info: "max-age=30: Browser cache 30s, sau đó fetch mới",
    timestamp: new Date().toISOString(),
    data: products,
  });
});

// -------------------------------------------------------
// ENDPOINT 3: ETag-based Conditional Revalidation
// -------------------------------------------------------
app.get("/api/etag-cache", (req, res) => {
  const currentEtag = `"${getProductsEtag()}"`;
  console.log(`  📥 GET /api/etag-cache | If-None-Match: ${req.headers["if-none-match"] || "none"}`);

  // Kiểm tra If-None-Match header (conditional request)
  const clientEtag = req.headers["if-none-match"];
  if (clientEtag && clientEtag === currentEtag) {
    console.log(`  ✅ 304 Not Modified (ETag match)`);
    res.status(304).end(); // Không gửi body -> tiết kiệm bandwidth
    return;
  }

  // Data đã thay đổi hoặc lần đầu
  res.setHeader("ETag", currentEtag);
  res.setHeader("Cache-Control", buildCacheControlHeader({ noCache: true })); // Luôn revalidate, nhưng có thể 304
  res.json({
    _info: "ETag: Browser lưu ETag, mỗi request hỏi server có changed không",
    etag: currentEtag,
    data: products,
  });
});

// -------------------------------------------------------
// ENDPOINT 4: Last-Modified Revalidation
// -------------------------------------------------------
app.get("/api/last-modified-cache", (req, res) => {
  const clientModifiedSince = req.headers["if-modified-since"];
  console.log(`  📥 GET /api/last-modified | If-Modified-Since: ${clientModifiedSince || "none"}`);

  if (clientModifiedSince && new Date(clientModifiedSince) >= lastModified) {
    console.log(`  ✅ 304 Not Modified (Last-Modified match)`);
    res.status(304).end();
    return;
  }

  res.setHeader("Last-Modified", lastModified.toUTCString());
  res.setHeader("Cache-Control", "no-cache");
  res.json({
    _info: "Last-Modified: Revalidate dựa trên thời gian sửa đổi",
    lastModified: lastModified.toISOString(),
    data: products,
  });
});

// -------------------------------------------------------
// ENDPOINT 5: Stale-While-Revalidate (SWR cho HTTP)
// -------------------------------------------------------
app.get("/api/swr-cache", (req, res) => {
  console.log(`  📥 GET /api/swr-cache`);

  // max-age=10: fresh 10 giây
  // stale-while-revalidate=50: stale nhưng dùng được thêm 50s
  //   trong 50s đó, browser/CDN sẽ background-fetch để làm mới
  // stale-if-error=86400: nếu server lỗi, dùng cache cũ 1 ngày
  res.setHeader(
    "Cache-Control",
    buildCacheControlHeader({
      maxAge: 10,
      sMaxAge: 60,           // CDN cache 60s
      staleWhileRevalidate: 50,
      staleIfError: 86400,
    })
  );
  res.json({
    _info: "SWR: fresh 10s, stale+revalidate 50s, stale-if-error 1 ngày",
    timestamp: new Date().toISOString(),
    data: products,
  });
});

// -------------------------------------------------------
// ENDPOINT 6: Immutable (static assets)
// -------------------------------------------------------
app.get("/api/immutable-asset", (req, res) => {
  console.log(`  📥 GET /api/immutable-asset`);

  // Dùng cho static assets có content-hash trong URL
  // ví dụ: /static/app.a1b2c3.js
  res.setHeader(
    "Cache-Control",
    buildCacheControlHeader({
      maxAge: 31536000, // 1 năm
      immutable: true,  // Không cần revalidate bao giờ
    })
  );
  res.json({
    _info: "immutable: Cache vĩnh viễn (dùng cho versioned assets)",
    version: "1.0.0-a1b2c3d4",
    data: "static asset content",
  });
});

// -------------------------------------------------------
// ENDPOINT 7: Vary Header (cache theo Accept-Language)
// -------------------------------------------------------
const translations = {
  vi: { greeting: "Xin chào", lang: "Tiếng Việt" },
  en: { greeting: "Hello", lang: "English" },
};

app.get("/api/vary-cache", (req, res) => {
  const lang = req.headers["accept-language"]?.includes("vi") ? "vi" : "en";
  console.log(`  📥 GET /api/vary-cache | Lang: ${lang}`);

  res.setHeader("Cache-Control", "public, max-age=60");
  res.setHeader("Vary", "Accept-Language"); // Cache riêng cho mỗi language
  res.json({
    _info: "Vary: Cache khác nhau cho mỗi Accept-Language value",
    language: lang,
    ...translations[lang],
  });
});

// -------------------------------------------------------
// ENDPOINT để update data và bust cache
// -------------------------------------------------------
app.post("/api/update-products", express.json(), (req, res) => {
  const { id, name, price } = req.body || {};
  const idx = products.findIndex((p) => p.id === id);

  if (idx !== -1) {
    products[idx] = { ...products[idx], name, price };
    lastModified = new Date(); // Update Last-Modified
    console.log(`  💾 [DB] Product ${id} updated -> ETag/LastModified changed`);
    res.json({ message: "Updated! Cache sẽ được revalidate theo ETag/Last-Modified" });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// -------------------------------------------------------
// Index: hiển thị tất cả endpoints
// -------------------------------------------------------
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <title>HTTP Cache Headers Demo</title>
  <style>
    body { font-family: monospace; background: #1a1a2e; color: #e0e0e0; padding: 20px; }
    h1 { color: #00d4ff; }
    h2 { color: #ff6b6b; }
    .endpoint { background: #16213e; border: 1px solid #0f3460; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .method { color: #4ecdc4; font-weight: bold; }
    .url { color: #ffe66d; }
    .desc { color: #aaa; margin: 5px 0; }
    .header { color: #ff9f43; font-size: 0.85em; }
    a { color: #00d4ff; }
    .note { background: #0d3b0d; border: 1px solid #2d5a2d; padding: 10px; border-radius: 5px; margin: 5px 0; }
  </style>
</head>
<body>
  <h1>🚀 HTTP Cache Headers Demo</h1>
  <p>Server đang chạy tại port ${PORT}. Dùng DevTools > Network tab để xem headers.</p>

  <h2>Endpoints</h2>

  <div class="endpoint">
    <span class="method">GET</span> <a class="url" href="/api/no-cache">/api/no-cache</a>
    <p class="desc">❌ Không cache gì - luôn gọi server</p>
    <p class="header">Cache-Control: no-store</p>
  </div>

  <div class="endpoint">
    <span class="method">GET</span> <a class="url" href="/api/simple-cache">/api/simple-cache</a>
    <p class="desc">⏱️ Cache 30 giây, sau đó fetch mới</p>
    <p class="header">Cache-Control: public, max-age=30</p>
  </div>

  <div class="endpoint">
    <span class="method">GET</span> <a class="url" href="/api/etag-cache">/api/etag-cache</a>
    <p class="desc">🏷️ ETag revalidation - trả 304 nếu không đổi</p>
    <p class="header">ETag + Cache-Control: no-cache</p>
  </div>

  <div class="endpoint">
    <span class="method">GET</span> <a class="url" href="/api/last-modified-cache">/api/last-modified-cache</a>
    <p class="desc">📅 Last-Modified revalidation</p>
    <p class="header">Last-Modified + Cache-Control: no-cache</p>
  </div>

  <div class="endpoint">
    <span class="method">GET</span> <a class="url" href="/api/swr-cache">/api/swr-cache</a>
    <p class="desc">⚡ Stale-While-Revalidate: fresh 10s, stale 50s</p>
    <p class="header">Cache-Control: public, max-age=10, s-maxage=60, stale-while-revalidate=50, stale-if-error=86400</p>
  </div>

  <div class="endpoint">
    <span class="method">GET</span> <a class="url" href="/api/immutable-asset">/api/immutable-asset</a>
    <p class="desc">♾️ Immutable: cache 1 năm, không bao giờ revalidate</p>
    <p class="header">Cache-Control: public, max-age=31536000, immutable</p>
  </div>

  <div class="endpoint">
    <span class="method">GET</span> <a class="url" href="/api/vary-cache">/api/vary-cache</a>
    <p class="desc">🌐 Vary: cache riêng theo Accept-Language</p>
    <p class="header">Vary: Accept-Language</p>
  </div>

  <div class="note">
    <strong>💡 Test ETag:</strong><br>
    1. Gọi /api/etag-cache -> nhận ETag<br>
    2. Gọi lại với header If-None-Match: "etag-value" -> nhận 304<br>
    3. POST /api/update-products để thay đổi data<br>
    4. Gọi lại /api/etag-cache -> 200 với data mới
  </div>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(`  🚀 HTTP Cache Headers Server đang chạy`);
  console.log(`  📍 URL: http://localhost:${PORT}`);
  console.log("=".repeat(60));
  console.log(`\n  Mở browser và vào http://localhost:${PORT}`);
  console.log(`  Dùng DevTools > Network tab để xem cache headers\n`);
});
