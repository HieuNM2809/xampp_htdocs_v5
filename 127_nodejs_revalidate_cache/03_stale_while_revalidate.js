/**
 * ============================================================
 * LEVEL 3: STALE-WHILE-REVALIDATE (SWR) PATTERN
 * ============================================================
 * Khái niệm:
 *   - "Stale" = dữ liệu cũ nhưng vẫn trả về cho user
 *   - "While Revalidate" = trong khi đó chạy fetch mới ở background
 *
 * Luồng hoạt động:
 *   1. Request đến
 *   2. Nếu cache còn fresh -> trả về cache (HIT)
 *   3. Nếu cache stale (hết TTL) -> trả về cache cũ NGAY LẬP TỨC
 *      + ĐỒNG THỜI chạy background fetch để làm mới cache
 *   4. Nếu cache không có -> fetch và chờ (MISS)
 *
 * Lợi ích:
 *   - User không bao giờ phải chờ (trừ lần đầu)
 *   - Dữ liệu luôn được cập nhật sau 1 request
 *
 * So sánh với TTL strict:
 *   - TTL strict: hết TTL -> user PHẢI CHỜ fetch mới
 *   - SWR:        hết TTL -> user nhận stale NGAY, background fetch
 * ============================================================
 */

// -------------------------------------------------------
// SWR Cache Implementation
// -------------------------------------------------------
class SWRCache {
  constructor() {
    this.store = new Map();
    // store entry: { value, freshUntil, staleUntil, revalidating }
  }

  /**
   * @param {string} key
   * @param {Function} fetcher - async function lấy dữ liệu mới
   * @param {object} options
   * @param {number} options.freshFor  - ms dữ liệu là "fresh" (default 5s)
   * @param {number} options.staleFor  - ms dữ liệu là "stale" nhưng vẫn dùng được (default 30s)
   */
  async get(key, fetcher, options = {}) {
    const { freshFor = 5000, staleFor = 30000 } = options;
    const now = Date.now();
    const entry = this.store.get(key);

    // ---- Trường hợp 1: Không có cache -> fetch và chờ ----
    if (!entry) {
      console.log(`  ❌ [SWR] MISS "${key}" - fetching...`);
      return this._fetchAndStore(key, fetcher, freshFor, staleFor);
    }

    // ---- Trường hợp 2: Cache FRESH -> trả về ngay ----
    if (now < entry.freshUntil) {
      const remainMs = entry.freshUntil - now;
      console.log(`  🟢 [SWR] FRESH "${key}" | còn fresh: ${remainMs}ms`);
      return entry.value;
    }

    // ---- Trường hợp 3: Cache STALE nhưng vẫn trong staleFor ----
    if (now < entry.staleUntil) {
      const staleMs = now - entry.freshUntil;
      console.log(`  🟡 [SWR] STALE "${key}" | đã stale: ${staleMs}ms - trả về stale + background revalidate`);

      // Background revalidate (không block request hiện tại)
      if (!entry.revalidating) {
        entry.revalidating = true;
        this._fetchAndStore(key, fetcher, freshFor, staleFor).then(() => {
          if (this.store.has(key)) {
            this.store.get(key).revalidating = false;
          }
          console.log(`  ✅ [SWR] Background revalidate "${key}" DONE`);
        });
      } else {
        console.log(`  ⏳ [SWR] "${key}" đang revalidating... không fetch thêm`);
      }

      return entry.value; // Trả về dữ liệu cũ NGAY
    }

    // ---- Trường hợp 4: Quá staleFor -> không dùng được nữa ----
    console.log(`  🔴 [SWR] STALE-EXPIRED "${key}" - must refetch`);
    return this._fetchAndStore(key, fetcher, freshFor, staleFor);
  }

  async _fetchAndStore(key, fetcher, freshFor, staleFor) {
    const value = await fetcher();
    const now = Date.now();
    this.store.set(key, {
      value,
      freshUntil: now + freshFor,
      staleUntil: now + freshFor + staleFor,
      revalidating: false,
    });
    return value;
  }

  // Xóa cache ngay lập tức (invalidate)
  invalidate(key) {
    this.store.delete(key);
    console.log(`  🔄 [SWR] INVALIDATED "${key}"`);
  }

  // Buộc revalidate ngay (xóa freshUntil để stale ngay)
  forceStale(key) {
    const entry = this.store.get(key);
    if (entry) {
      entry.freshUntil = 0; // Đặt về quá khứ -> stale ngay
      console.log(`  ⚡ [SWR] Force stale "${key}"`);
    }
  }
}

// -------------------------------------------------------
// Giả lập API call
// -------------------------------------------------------
let fetchCount = 0;

async function fetchWeatherData(city) {
  fetchCount++;
  const num = fetchCount;
  console.log(`  🌐 [API] Fetching weather for ${city}... (call #${num})`);
  await new Promise((r) => setTimeout(r, 200)); // Giả lập latency
  return {
    city,
    temp: Math.floor(Math.random() * 15) + 20,
    condition: ["Sunny", "Cloudy", "Rainy"][Math.floor(Math.random() * 3)],
    fetchedAt: new Date().toISOString(),
    callNumber: num,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cache = new SWRCache();

// -------------------------------------------------------
// DEMO
// -------------------------------------------------------
async function runDemo() {
  console.log("=".repeat(60));
  console.log("  DEMO: Stale-While-Revalidate (SWR) Pattern");
  console.log("=".repeat(60));

  const fetcher = () => fetchWeatherData("Hanoi");
  const opts = { freshFor: 1000, staleFor: 5000 }; // fresh 1s, stale 5s

  console.log("\n--- [0ms] Lần 1: Cache MISS -> fetch và chờ ---");
  const r1 = await cache.get("weather:Hanoi", fetcher, opts);
  console.log("  Result:", r1.temp + "°C", r1.condition, "| call#", r1.callNumber);

  console.log("\n--- [200ms] Lần 2: Cache FRESH ---");
  await sleep(200);
  const r2 = await cache.get("weather:Hanoi", fetcher, opts);
  console.log("  Result:", r2.temp + "°C", r2.condition, "| call#", r2.callNumber);

  console.log("\n--- [1.2s] Lần 3: Cache STALE -> trả stale + background fetch ---");
  await sleep(1000);
  const r3 = await cache.get("weather:Hanoi", fetcher, opts);
  console.log("  Result (stale):", r3.temp + "°C", "| call#", r3.callNumber);

  console.log("\n--- Chờ background fetch hoàn thành (300ms)... ---");
  await sleep(300);

  console.log("\n--- [1.5s] Lần 4: Cache đã được revalidate ở background ---");
  const r4 = await cache.get("weather:Hanoi", fetcher, opts);
  console.log("  Result (fresh):", r4.temp + "°C", "| call#", r4.callNumber);

  console.log("\n--- Force stale + lần 5 ---");
  cache.forceStale("weather:Hanoi");
  const r5 = await cache.get("weather:Hanoi", fetcher, opts);
  console.log("  Result (force stale -> stale data):", r5.temp + "°C", "| call#", r5.callNumber);

  await sleep(300); // chờ background

  console.log(`\n📊 Tổng API calls: ${fetchCount} (không có SWR sẽ là nhiều hơn)`);
}

runDemo();
