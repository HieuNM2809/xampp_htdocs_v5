/**
 * ============================================================
 * LEVEL 2: TTL (Time-To-Live) CACHE - TỰ ĐỘNG REVALIDATE
 * ============================================================
 * Khái niệm:
 *   - TTL = thời gian sống của cache entry
 *   - Sau khi TTL hết, cache tự động expire (stale)
 *   - Revalidate = fetch data mới khi cache stale
 *
 * Chiến lược:
 *   A) Cache-aside (Lazy Loading): Chỉ load khi cần
 *   B) TTL strict: Hết TTL là block request chờ fetch mới
 *
 * Khi nào dùng:
 *   - Dữ liệu có thể chấp nhận stale trong khoảng thời gian ngắn
 *   - Giảm tải cho DB/API
 * ============================================================
 */

// -------------------------------------------------------
// Class TTLCache - tự xây dựng
// -------------------------------------------------------
class TTLCache {
  constructor(defaultTTL = 5000) {
    // ms
    this.store = new Map(); // key -> { value, expiresAt }
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.store.set(key, { value, expiresAt });
    console.log(
      `  ✅ [TTLCache] SET "${key}" | TTL: ${ttl}ms | expires: ${new Date(expiresAt).toISOString()}`
    );
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      // Cache đã expire
      this.store.delete(key);
      console.log(`  ⏰ [TTLCache] EXPIRED "${key}"`);
      return null;
    }

    const remainingMs = entry.expiresAt - Date.now();
    console.log(`  🎯 [TTLCache] HIT "${key}" | còn ${remainingMs}ms`);
    return entry.value;
  }

  delete(key) {
    this.store.delete(key);
    console.log(`  🔄 [TTLCache] REVALIDATED "${key}"`);
  }

  // Xóa tất cả entry đã expire
  purgeExpired() {
    let count = 0;
    for (const [key, entry] of this.store) {
      if (Date.now() > entry.expiresAt) {
        this.store.delete(key);
        count++;
      }
    }
    console.log(`  🧹 [TTLCache] Purged ${count} expired entries`);
  }

  stats() {
    const total = this.store.size;
    let expired = 0;
    for (const entry of this.store.values()) {
      if (Date.now() > entry.expiresAt) expired++;
    }
    return { total, expired, active: total - expired };
  }
}

// -------------------------------------------------------
// Giả lập API call tốn kém
// -------------------------------------------------------
let apiCallCount = 0;

async function fetchProductPrice(productId) {
  apiCallCount++;
  await new Promise((r) => setTimeout(r, 80));
  return {
    productId,
    price: Math.floor(Math.random() * 1000) + 100,
    currency: "VND",
    fetchedAt: new Date().toISOString(),
  };
}

// -------------------------------------------------------
// Service dùng TTL Cache
// -------------------------------------------------------
const priceCache = new TTLCache(2000); // TTL = 2 giây

async function getProductPrice(productId) {
  const key = `price:${productId}`;

  // Thử lấy từ cache
  const cached = priceCache.get(key);
  if (cached) return cached;

  // Cache miss -> fetch mới
  console.log(`  🌐 [API call #${apiCallCount + 1}] Fetching price for product ${productId}...`);
  const data = await fetchProductPrice(productId);
  priceCache.set(key, data, 2000); // Cache 2 giây
  return data;
}

// Revalidate thủ công (ví dụ: khi admin cập nhật giá)
function invalidateProductPrice(productId) {
  priceCache.delete(`price:${productId}`);
}

// -------------------------------------------------------
// Hàm sleep helper
// -------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// -------------------------------------------------------
// DEMO
// -------------------------------------------------------
async function runDemo() {
  console.log("=".repeat(55));
  console.log("  DEMO: TTL Cache - Tự động revalidate theo thời gian");
  console.log("=".repeat(55));

  console.log("\n--- [t=0s] Lần 1: Cache miss -> gọi API ---");
  const p1 = await getProductPrice(42);
  console.log("  Price:", p1.price, "| fetchedAt:", p1.fetchedAt);

  console.log("\n--- [t=0.5s] Lần 2: Cache hit (TTL còn 1.5s) ---");
  await sleep(500);
  const p2 = await getProductPrice(42);
  console.log("  Price:", p2.price, "| fetchedAt:", p2.fetchedAt);

  console.log("\n--- [t=1s] Revalidate thủ công (admin đổi giá) ---");
  await sleep(500);
  invalidateProductPrice(42);

  console.log("\n--- [t=1s] Sau revalidate -> miss -> fetch mới ---");
  const p3 = await getProductPrice(42);
  console.log("  Price:", p3.price, "| fetchedAt:", p3.fetchedAt);

  console.log("\n--- [t=3s] Chờ TTL hết tự nhiên (2s) ---");
  await sleep(2100);

  console.log("\n--- [t=3.1s] TTL expired -> auto revalidate ---");
  const p4 = await getProductPrice(42);
  console.log("  Price:", p4.price, "| fetchedAt:", p4.fetchedAt);

  console.log("\n--- Stats ---");
  console.log("  Cache stats:", priceCache.stats());
  console.log(`  Tổng API calls: ${apiCallCount}`);
}

runDemo();
