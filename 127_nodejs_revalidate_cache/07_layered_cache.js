/**
 * ============================================================
 * LEVEL 7: LAYERED (MULTI-TIER) CACHE + CIRCUIT BREAKER
 * ============================================================
 * Kiến trúc:
 *   L1: In-Memory Cache (per process, ~1ms)
 *       ↓ miss
 *   L2: Redis Cache (distributed, ~1-5ms)
 *       ↓ miss
 *   L3: Database / External API (~50-500ms)
 *
 * Revalidation Strategy:
 *   - Write-through: Cập nhật L3 -> cập nhật L2 -> L1 tự expire
 *   - Write-behind: Cập nhật L3 async (eventual consistency)
 *   - Invalidation propagation: Xóa từ L1 -> L2 -> L3
 *
 * Circuit Breaker:
 *   - Nếu DB/API liên tục fail -> dùng stale cache thay vì crash
 *   - "Stale-if-error" pattern
 * ============================================================
 */

// -------------------------------------------------------
// Mock implementations
// -------------------------------------------------------
class L1Cache {
  constructor(maxSize = 100, defaultTTL = 5000) {
    this.store = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.name = "L1 (Memory)";
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // LRU: move to end
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    if (this.store.size >= this.maxSize) {
      // Evict LRU
      this.store.delete(this.store.keys().next().value);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  delete(key) { this.store.delete(key); }
  clear() { this.store.clear(); }
  size() { return this.store.size; }
}

class L2Cache {
  constructor(defaultTTL = 60000) {
    this.store = new Map();
    this.defaultTTL = defaultTTL;
    this.name = "L2 (Redis)";
    this.latency = 2; // ms
  }

  async get(key) {
    await new Promise((r) => setTimeout(r, this.latency));
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      if (entry) this.store.delete(key);
      return null;
    }
    return JSON.parse(JSON.stringify(entry.value)); // Deep clone
  }

  async set(key, value, ttl = this.defaultTTL) {
    await new Promise((r) => setTimeout(r, this.latency));
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  async delete(key) {
    await new Promise((r) => setTimeout(r, this.latency));
    this.store.delete(key);
  }

  async clear() { this.store.clear(); }
  size() { return this.store.size; }
}

class Database {
  constructor() {
    this.data = new Map([
      ["user:1", { id: 1, name: "Nguyen Van A", email: "a@example.com", role: "admin" }],
      ["user:2", { id: 2, name: "Tran Thi B", email: "b@example.com", role: "user" }],
      ["user:3", { id: 3, name: "Le Van C", email: "c@example.com", role: "user" }],
    ]);
    this.latency = 80;
    this.errorRate = 0; // 0-1, xác suất lỗi
    this.callCount = 0;
    this.name = "L3 (Database)";
  }

  async get(key) {
    this.callCount++;
    await new Promise((r) => setTimeout(r, this.latency));

    // Simulate errors
    if (Math.random() < this.errorRate) {
      throw new Error(`DB error for key "${key}"`);
    }

    return this.data.get(key) ?? null;
  }

  async set(key, value) {
    this.callCount++;
    await new Promise((r) => setTimeout(r, this.latency));
    this.data.set(key, value);
    return value;
  }
}

// -------------------------------------------------------
// Circuit Breaker
// -------------------------------------------------------
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeout = options.resetTimeout || 10000;
    this.state = "CLOSED"; // CLOSED | OPEN | HALF-OPEN
    this.failures = 0;
    this.lastFailTime = null;
  }

  async execute(fn) {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailTime > this.resetTimeout) {
        this.state = "HALF-OPEN";
        console.log("  ⚡ [Circuit] State: HALF-OPEN (testing...)");
      } else {
        throw new Error("Circuit OPEN - request rejected");
      }
    }

    try {
      const result = await fn();
      if (this.state === "HALF-OPEN") {
        this.state = "CLOSED";
        this.failures = 0;
        console.log("  ✅ [Circuit] State: CLOSED (recovered)");
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailTime = Date.now();
      if (this.failures >= this.failureThreshold) {
        this.state = "OPEN";
        console.log(`  🔴 [Circuit] State: OPEN (${this.failures} failures)`);
      }
      throw error;
    }
  }
}

// -------------------------------------------------------
// Layered Cache Manager
// -------------------------------------------------------
class LayeredCacheManager {
  constructor() {
    this.l1 = new L1Cache(100, 5000);   // 5s TTL
    this.l2 = new L2Cache(60000);       // 60s TTL
    this.db = new Database();
    this.circuit = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 5000 });

    this.stats = {
      l1Hits: 0, l2Hits: 0, dbHits: 0,
      l1Misses: 0, l2Misses: 0,
      errors: 0, staleHits: 0,
    };

    // Stale cache dùng khi DB fail
    this.staleStore = new Map();
  }

  async get(key) {
    const timer = Date.now();

    // === L1 Check ===
    const l1Value = this.l1.get(key);
    if (l1Value !== null) {
      this.stats.l1Hits++;
      console.log(`  🟢 [L1 HIT] "${key}" | ${Date.now() - timer}ms`);
      return { data: l1Value, source: "L1", latency: Date.now() - timer };
    }
    this.stats.l1Misses++;

    // === L2 Check ===
    const l2Value = await this.l2.get(key);
    if (l2Value !== null) {
      this.stats.l2Hits++;
      // Populate L1 from L2
      this.l1.set(key, l2Value, 5000);
      console.log(`  🟡 [L2 HIT] "${key}" | ${Date.now() - timer}ms | populated L1`);
      return { data: l2Value, source: "L2", latency: Date.now() - timer };
    }
    this.stats.l2Misses++;

    // === DB/API ===
    try {
      const dbValue = await this.circuit.execute(() => this.db.get(key));
      this.stats.dbHits++;

      if (dbValue !== null) {
        // Populate cả L1 và L2 (write-through cache population)
        this.l1.set(key, dbValue, 5000);
        await this.l2.set(key, dbValue, 60000);
        this.staleStore.set(key, dbValue); // Lưu stale backup

        console.log(`  🔵 [DB HIT] "${key}" | ${Date.now() - timer}ms | populated L1+L2`);
      } else {
        console.log(`  ⬛ [DB MISS] "${key}" - not found`);
      }

      return { data: dbValue, source: "DB", latency: Date.now() - timer };
    } catch (error) {
      this.stats.errors++;
      console.log(`  🔴 [ERROR] "${key}" - ${error.message}`);

      // Fallback: dùng stale data nếu có
      const staleData = this.staleStore.get(key);
      if (staleData) {
        this.stats.staleHits++;
        console.log(`  🟠 [STALE FALLBACK] "${key}" | serving stale data`);
        return { data: staleData, source: "STALE", latency: Date.now() - timer };
      }

      throw error;
    }
  }

  async set(key, value) {
    // Write-through: cập nhật DB trước, rồi cache
    console.log(`  💾 [Write-through] Updating "${key}"...`);
    await this.db.set(key, value);

    // Cập nhật L2
    await this.l2.set(key, value, 60000);

    // L1 -> invalidate, để populate lại lần sau
    this.l1.delete(key);

    // Cập nhật stale store
    this.staleStore.set(key, value);

    console.log(`  ✅ [Write-through] "${key}" updated: L3+L2 written, L1 invalidated`);
    return value;
  }

  async invalidate(key) {
    console.log(`  🔄 [Invalidate] "${key}" from all layers...`);
    this.l1.delete(key);
    await this.l2.delete(key);
    // DB data vẫn còn, chỉ xóa cache
  }

  async invalidateAll() {
    console.log(`  🧹 [Invalidate ALL] Clearing L1 + L2...`);
    this.l1.clear();
    await this.l2.clear();
  }

  printStats() {
    const { l1Hits, l2Hits, dbHits, l1Misses, l2Misses, errors, staleHits } = this.stats;
    const totalRequests = l1Hits + l2Hits + dbHits + errors;
    console.log("\n📊 Layered Cache Statistics:");
    console.log(`   Total requests: ${totalRequests}`);
    console.log(`   L1 Hits: ${l1Hits} (${((l1Hits / totalRequests) * 100).toFixed(1)}%)`);
    console.log(`   L2 Hits: ${l2Hits} (${((l2Hits / totalRequests) * 100).toFixed(1)}%)`);
    console.log(`   DB Hits: ${dbHits} (${((dbHits / totalRequests) * 100).toFixed(1)}%)`);
    console.log(`   Errors: ${errors} | Stale Fallbacks: ${staleHits}`);
    console.log(`   L1 size: ${this.l1.size()} | L2 size: ${this.l2.size()}`);
    console.log(`   DB calls: ${this.db.callCount}`);
  }
}

// -------------------------------------------------------
// Giả lập sleep
// -------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// -------------------------------------------------------
// DEMO
// -------------------------------------------------------
async function runDemo() {
  const cache = new LayeredCacheManager();

  console.log("=".repeat(60));
  console.log("  DEMO: Layered Cache (L1 Memory -> L2 Redis -> L3 DB)");
  console.log("=".repeat(60));

  // === Lần 1: Warm up từ DB ===
  console.log("\n--- Lần 1,2,3: Warm up cache từ DB ---");
  await cache.get("user:1");
  await cache.get("user:2");
  await cache.get("user:3");

  // === Lần 2: L1 hits ===
  console.log("\n--- Lần 4,5,6: L1 Cache hits ---");
  await cache.get("user:1");
  await cache.get("user:2");
  await cache.get("user:3");

  // === Update + Revalidation ===
  console.log("\n--- Write-through update user:1 ---");
  await cache.set("user:1", { id: 1, name: "Nguyen Van A (Updated)", email: "new@example.com", role: "admin" });

  console.log("\n--- Sau update: L1 bị invalidate, L2 có data mới ---");
  await cache.get("user:1"); // L2 hit (data mới)
  await cache.get("user:1"); // L1 hit (vừa populate)

  // === Invalidation ===
  console.log("\n--- Invalidate user:2 từ tất cả layers ---");
  await cache.invalidate("user:2");
  await cache.get("user:2"); // DB hit

  // === Circuit Breaker Demo ===
  console.log("\n--- Bật error rate 100% để test Circuit Breaker ---");
  cache.db.errorRate = 1.0;
  cache.l1.clear(); // Xóa L1 để buộc xuống DB

  for (let i = 0; i < 5; i++) {
    try {
      await cache.get("user:3");
    } catch (e) {
      console.log(`  ❌ Request ${i + 1} failed: ${e.message}`);
    }
    await sleep(50);
  }

  cache.printStats();
}

runDemo();
