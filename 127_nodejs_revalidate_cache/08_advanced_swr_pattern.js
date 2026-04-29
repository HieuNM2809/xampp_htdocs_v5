/**
 * ============================================================
 * LEVEL 8: ADVANCED SWR - REQUEST DEDUPLICATION + CACHE STAMPEDE
 * ============================================================
 * Vấn đề thực tế khi scale:
 *
 * 1. CACHE STAMPEDE (Thundering Herd):
 *    - Cache expire -> 1000 requests đến cùng lúc
 *    - Tất cả đều thấy MISS -> tất cả gọi DB
 *    - DB bị overwhelm -> crash
 *
 * 2. REQUEST DEDUPLICATION:
 *    - Nhiều request cho cùng key đến trong khi đang fetch
 *    - Chỉ nên có 1 fetch, các request khác chờ kết quả
 *
 * 3. PROBABILISTIC EARLY EXPIRATION:
 *    - Expire cache sớm hơn TTL với xác suất nhỏ
 *    - Dần dần revalidate trước khi cache chết hàng loạt
 *
 * 4. CACHE WARMING:
 *    - Preload cache trước khi cache expire
 *    - Chạy background job để warm up
 *
 * 5. WRITE-THROUGH vs WRITE-BEHIND:
 *    - Write-through: Cập nhật cache ngay khi write DB
 *    - Write-behind: Ghi DB async, cache cập nhật trước
 * ============================================================
 */

// -------------------------------------------------------
// Advanced SWR Cache với tất cả features
// -------------------------------------------------------
class AdvancedSWRCache {
  constructor(options = {}) {
    this.store = new Map();
    this.inFlight = new Map();   // key -> Promise (deduplication)
    this.warmupJobs = new Map(); // key -> timeout (proactive warming)

    this.options = {
      freshFor: options.freshFor || 5000,
      staleFor: options.staleFor || 30000,
      // Probabilistic expiration: beta > 1 = expire sớm hơn
      beta: options.beta || 1.0,
      warmupThreshold: options.warmupThreshold || 0.8, // Warm up khi còn 80% TTL
    };

    this.stats = {
      hits: 0, misses: 0, staleHits: 0,
      deduped: 0,     // Requests được dedup
      stampede: 0,    // Stampede events prevented
      bgRefreshes: 0, // Background refreshes
    };
  }

  // -------------------------------------------------------
  // Core get với deduplication + stampede prevention
  // -------------------------------------------------------
  async get(key, fetcher, options = {}) {
    const { freshFor, staleFor, beta } = { ...this.options, ...options };
    const now = Date.now();
    const entry = this.store.get(key);

    // === MISS: Không có cache ===
    if (!entry) {
      return this._fetchWithDedup(key, fetcher, freshFor, staleFor, "MISS");
    }

    // === PROBABILISTIC EARLY EXPIRATION ===
    // Thay vì expire đúng lúc freshUntil, ta expire sớm hơn một chút
    // xác suất tỉ lệ thuận với (TTL đã dùng / total TTL)
    // Formula: -cache_delta * beta * log(rand()) > ttl_remaining
    const cacheDelta = now - entry.fetchedAt;
    const ttlRemaining = entry.freshUntil - now;
    const shouldEarlyExpire =
      ttlRemaining > 0 &&
      -cacheDelta * beta * Math.log(Math.random()) > ttlRemaining;

    if (shouldEarlyExpire && !this.inFlight.has(key)) {
      console.log(`  ⚡ [SWR-ADV] Probabilistic early expire "${key}" -> background refresh`);
      this.stats.bgRefreshes++;
      // Background refresh (không block)
      this._fetchWithDedup(key, fetcher, freshFor, staleFor, "EARLY");
      // Vẫn trả về fresh data hiện tại
      this.stats.hits++;
      return { data: entry.value, source: "FRESH (early-refresh queued)", key };
    }

    // === FRESH: Trong TTL ===
    if (now < entry.freshUntil) {
      this.stats.hits++;
      const remaining = entry.freshUntil - now;
      console.log(`  🟢 [SWR-ADV] FRESH "${key}" | remaining: ${remaining}ms`);
      return { data: entry.value, source: "FRESH", key };
    }

    // === STALE: Hết freshFor nhưng trong staleFor ===
    if (now < entry.staleUntil) {
      this.stats.staleHits++;
      const staleAge = now - entry.freshUntil;
      console.log(`  🟡 [SWR-ADV] STALE "${key}" | stale age: ${staleAge}ms -> background refresh`);

      // Background refresh với deduplication
      this._fetchWithDedup(key, fetcher, freshFor, staleFor, "SWR");

      return { data: entry.value, source: "STALE", key };
    }

    // === STALE-EXPIRED: Quá già ===
    console.log(`  🔴 [SWR-ADV] STALE-EXPIRED "${key}" -> must fetch`);
    return this._fetchWithDedup(key, fetcher, freshFor, staleFor, "EXPIRED");
  }

  // -------------------------------------------------------
  // Fetch với Deduplication (Stampede Prevention)
  // -------------------------------------------------------
  async _fetchWithDedup(key, fetcher, freshFor, staleFor, reason) {
    // Nếu đã có request đang fetch -> chờ kết quả đó (DEDUP)
    if (this.inFlight.has(key)) {
      this.stats.deduped++;
      this.stats.stampede++;
      console.log(`  🛡️  [DEDUP] "${key}" already fetching -> piggyback (${reason})`);
      return this.inFlight.get(key);
    }

    // Tạo promise cho fetch này
    const fetchPromise = this._doFetch(key, fetcher, freshFor, staleFor, reason);
    this.inFlight.set(key, fetchPromise);

    try {
      const result = await fetchPromise;
      return result;
    } finally {
      this.inFlight.delete(key);
    }
  }

  async _doFetch(key, fetcher, freshFor, staleFor, reason) {
    this.stats.misses++;
    const startTime = Date.now();
    console.log(`  🌐 [FETCH] "${key}" (${reason}) - calling fetcher...`);

    const value = await fetcher(key);
    const fetchDuration = Date.now() - startTime;
    const now = Date.now();

    this.store.set(key, {
      value,
      fetchedAt: now,
      freshUntil: now + freshFor,
      staleUntil: now + freshFor + staleFor,
      fetchDuration,
    });

    console.log(`  ✅ [FETCH DONE] "${key}" | took: ${fetchDuration}ms`);

    // Setup proactive warming
    this._scheduleWarmup(key, fetcher, freshFor, staleFor);

    return { data: value, source: reason === "MISS" ? "MISS->FRESH" : "REVALIDATED", key };
  }

  // -------------------------------------------------------
  // Proactive Cache Warming
  // -------------------------------------------------------
  _scheduleWarmup(key, fetcher, freshFor, staleFor) {
    // Hủy job cũ nếu có
    if (this.warmupJobs.has(key)) {
      clearTimeout(this.warmupJobs.get(key));
    }

    // Schedule warm up tại 80% TTL
    const warmupDelay = freshFor * this.options.warmupThreshold;
    const timeout = setTimeout(() => {
      console.log(`  🔥 [WARMUP] Pre-emptively refreshing "${key}"...`);
      this.stats.bgRefreshes++;
      this._doFetch(key, fetcher, freshFor, staleFor, "WARMUP").catch(() => {});
    }, warmupDelay);

    this.warmupJobs.set(key, timeout);
  }

  // -------------------------------------------------------
  // Invalidation methods
  // -------------------------------------------------------
  invalidate(key) {
    this.store.delete(key);
    if (this.warmupJobs.has(key)) {
      clearTimeout(this.warmupJobs.get(key));
      this.warmupJobs.delete(key);
    }
    console.log(`  🔄 [INVALIDATE] "${key}"`);
  }

  invalidatePattern(pattern) {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) {
        this.invalidate(key);
        count++;
      }
    }
    return count;
  }

  // -------------------------------------------------------
  // Stats
  // -------------------------------------------------------
  printStats() {
    const { hits, misses, staleHits, deduped, stampede, bgRefreshes } = this.stats;
    const total = hits + misses + staleHits;
    console.log("\n📊 Advanced SWR Cache Stats:");
    console.log(`   Total served: ${total}`);
    console.log(`   Fresh hits:   ${hits} (${total ? ((hits / total) * 100).toFixed(1) : 0}%)`);
    console.log(`   Stale hits:   ${staleHits} (${total ? ((staleHits / total) * 100).toFixed(1) : 0}%)`);
    console.log(`   Actual fetches: ${misses}`);
    console.log(`   Deduped:      ${deduped} requests saved`);
    console.log(`   Stampede prevented: ${stampede}`);
    console.log(`   BG refreshes: ${bgRefreshes}`);
  }
}

// -------------------------------------------------------
// Giả lập heavy fetcher (chậm 200ms)
// -------------------------------------------------------
let globalFetchCount = 0;

async function heavyFetcher(key) {
  globalFetchCount++;
  const num = globalFetchCount;
  console.log(`    💎 Heavy fetch #${num} for "${key}"...`);
  await new Promise((r) => setTimeout(r, 200));
  return {
    key,
    data: `Fresh data for ${key}`,
    timestamp: new Date().toISOString(),
    fetchNumber: num,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// -------------------------------------------------------
// DEMO
// -------------------------------------------------------
async function runDemo() {
  const cache = new AdvancedSWRCache({
    freshFor: 800,    // 0.8s fresh
    staleFor: 3000,   // 3s stale
    beta: 1.5,        // Tăng probability của early expiration
    warmupThreshold: 0.7, // Warm up tại 70% TTL
  });

  console.log("=".repeat(60));
  console.log("  DEMO: Advanced SWR - Dedup + Stampede Prevention");
  console.log("=".repeat(60));

  // === DEMO 1: Stampede Prevention ===
  console.log("\n🔷 DEMO 1: Cache Stampede Prevention");
  console.log("  100 requests đồng thời cho cùng 1 key...");
  console.log("  Không có cache -> 100 requests MISS cùng lúc");
  console.log("  Với Dedup: chỉ 1 request thực sự fetch, 99 còn lại chờ\n");

  const start = Date.now();
  const promises = Array.from({ length: 10 }, (_, i) =>
    cache.get(`product:hot_item`, heavyFetcher).then((r) => ({ req: i + 1, ...r }))
  );

  const results = await Promise.all(promises);
  console.log(`\n  ⏱️  10 concurrent requests done in ${Date.now() - start}ms`);
  console.log(`  Actual fetches: ${globalFetchCount} (chỉ 1!)`);
  console.log(`  All got same data: ${results.every((r) => r.data.fetchNumber === results[0].data.fetchNumber)}`);

  // === DEMO 2: SWR Background Refresh ===
  console.log("\n🔷 DEMO 2: SWR - Background Refresh (non-blocking)");
  const fetcher2 = () => heavyFetcher("weather:HN");

  const w1 = await cache.get("weather:HN", fetcher2);
  console.log("  t=0: Fresh fetch:", w1.data.timestamp);

  await sleep(900); // Chờ cache stale

  console.log("\n  t=0.9s: Cache stale -> trả stale ngay, background refresh");
  const w2 = await cache.get("weather:HN", fetcher2);
  console.log("  Stale data trả ngay:", w2.source, "| fetchNumber:", w2.data.fetchNumber);

  await sleep(300); // Chờ background fetch hoàn thành

  console.log("\n  t=1.2s: Background đã xong -> fresh data mới");
  const w3 = await cache.get("weather:HN", fetcher2);
  console.log("  Fresh data:", w3.source, "| fetchNumber:", w3.data.fetchNumber);

  // === DEMO 3: Pattern Invalidation ===
  console.log("\n🔷 DEMO 3: Pattern Invalidation");
  await cache.get("user:alice:profile", heavyFetcher);
  await cache.get("user:alice:settings", heavyFetcher);
  await cache.get("user:bob:profile", heavyFetcher);

  console.log("\n  Invalidate tất cả cache của user:alice");
  const count = cache.invalidatePattern("user:alice:");
  console.log(`  Invalidated ${count} entries`);

  const afterAlice = await cache.get("user:alice:profile", heavyFetcher);
  const afterBob = await cache.get("user:bob:profile", heavyFetcher);
  console.log("  alice:profile source:", afterAlice.source); // MISS->FRESH
  console.log("  bob:profile source:", afterBob.source);     // FRESH

  cache.printStats();

  // Cleanup warmup timers
  for (const timer of cache.warmupJobs.values()) clearTimeout(timer);
}

runDemo();
