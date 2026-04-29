/**
 * ============================================================
 * LEVEL 5: REDIS CACHE - DISTRIBUTED REVALIDATION
 * ============================================================
 * Khái niệm:
 *   - Redis = in-memory data store, persistent, distributed
 *   - Dùng cho multi-instance Node.js (load balanced)
 *   - Revalidate = DEL key | SET key với TTL mới | EXPIRE
 *
 * Các kỹ thuật:
 *   A) Simple SET/GET với EX (expire)
 *   B) Cache-aside pattern
 *   C) Tag-based invalidation (dùng SET để nhóm key)
 *   D) Pub/Sub revalidation (real-time invalidation)
 *
 * Lưu ý: File này demo với MOCK Redis (không cần cài Redis thật)
 *         Phần comment có code thật dùng ioredis
 * ============================================================
 */

// -------------------------------------------------------
// MOCK Redis Client (thay thế cho ioredis trong demo)
// Trong production, dùng:
//   import Redis from 'ioredis';
//   const redis = new Redis({ host: 'localhost', port: 6379 });
// -------------------------------------------------------
class MockRedis {
  constructor() {
    this.store = new Map(); // key -> { value, expiresAt }
    this.sets = new Map();  // set operations (SADD/SMEMBERS)
    this.subscribers = new Map(); // channel -> [callbacks]
    console.log("  🔴 [Redis] Connected (mock)");
  }

  async set(key, value, ...args) {
    let expiresAt = Infinity;
    // Parse EX (seconds) hoặc PX (milliseconds)
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "EX") expiresAt = Date.now() + args[i + 1] * 1000;
      if (args[i] === "PX") expiresAt = Date.now() + args[i + 1];
    }
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(...keys) {
    let deleted = 0;
    for (const k of keys) {
      if (this.store.delete(k)) deleted++;
    }
    return deleted;
  }

  async exists(key) {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) return 0;
    return 1;
  }

  async expire(key, seconds) {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key) {
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (entry.expiresAt === Infinity) return -1;
    return Math.ceil((entry.expiresAt - Date.now()) / 1000);
  }

  // SET operations (để làm tag-based invalidation)
  async sadd(key, ...members) {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    members.forEach((m) => this.sets.get(key).add(m));
    return members.length;
  }

  async smembers(key) {
    return [...(this.sets.get(key) || new Set())];
  }

  async srem(key, ...members) {
    const s = this.sets.get(key);
    if (!s) return 0;
    members.forEach((m) => s.delete(m));
    return members.length;
  }

  // Pub/Sub (giả lập)
  async publish(channel, message) {
    const subs = this.subscribers.get(channel) || [];
    subs.forEach((cb) => setTimeout(() => cb(message), 10));
    return subs.length;
  }

  subscribe(channel, callback) {
    if (!this.subscribers.has(channel)) this.subscribers.set(channel, []);
    this.subscribers.get(channel).push(callback);
  }

  // Scan keys theo pattern
  async keys(pattern) {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return [...this.store.keys()].filter((k) => regex.test(k));
  }

  async flushall() {
    this.store.clear();
    this.sets.clear();
    return "OK";
  }
}

const redis = new MockRedis();

// -------------------------------------------------------
// PATTERN A: Simple Cache-Aside với Redis
// -------------------------------------------------------
async function getCachedData(key, fetcher, ttlSeconds = 60) {
  // 1. Thử lấy từ Redis
  const cached = await redis.get(key);
  if (cached) {
    const ttl = await redis.ttl(key);
    console.log(`  🎯 [Redis] HIT "${key}" | TTL: ${ttl}s`);
    return JSON.parse(cached);
  }

  // 2. Cache miss -> fetch
  console.log(`  ❌ [Redis] MISS "${key}" - fetching...`);
  const data = await fetcher();

  // 3. Lưu vào Redis với TTL
  await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
  console.log(`  ✅ [Redis] SET "${key}" | TTL: ${ttlSeconds}s`);

  return data;
}

// -------------------------------------------------------
// PATTERN B: Tag-Based Cache Invalidation
// -------------------------------------------------------
// Mỗi cache entry được gắn "tags"
// Khi tag bị invalidate -> tất cả entries có tag đó bị xóa

async function setCachedWithTags(key, value, tags = [], ttlSeconds = 60) {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);

  // Ghi key vào từng tag set
  for (const tag of tags) {
    await redis.sadd(`tag:${tag}`, key);
    console.log(`  🏷️  [Tags] Tagged "${key}" -> "${tag}"`);
  }
}

async function invalidateByTag(tag) {
  const tagKey = `tag:${tag}`;
  const keys = await redis.smembers(tagKey);

  if (keys.length === 0) {
    console.log(`  🏷️  [Tags] No keys for tag "${tag}"`);
    return;
  }

  // Xóa tất cả keys thuộc tag này
  await redis.del(...keys);
  // Xóa tag set
  await redis.del(tagKey);
  console.log(`  🔄 [Tags] Invalidated ${keys.length} keys for tag "${tag}": [${keys.join(", ")}]`);
}

// -------------------------------------------------------
// PATTERN C: Pub/Sub Real-time Invalidation
// (Dùng trong multi-instance / microservices)
// -------------------------------------------------------
// Instance A cập nhật dữ liệu -> publish event
// Tất cả instances khác nhận event -> xóa local cache của mình

const localMemoryCache = new Map(); // L1 cache (in-memory, per instance)

// Setup subscriber (chạy khi khởi động server)
function setupCacheInvalidationSubscriber() {
  redis.subscribe("cache:invalidate", async (message) => {
    const { key, tag } = JSON.parse(message);
    if (key) {
      localMemoryCache.delete(key);
      console.log(`  📡 [PubSub] Received invalidation for key: "${key}" -> removed from L1`);
    }
    if (tag) {
      for (const [k] of localMemoryCache) {
        if (k.includes(tag)) {
          localMemoryCache.delete(k);
          console.log(`  📡 [PubSub] Removed L1 key: "${k}" (tag: ${tag})`);
        }
      }
    }
  });
  console.log("  📡 [PubSub] Subscribed to 'cache:invalidate'");
}

async function updateDataAndNotify(key, newValue) {
  // 1. Cập nhật DB (giả lập)
  console.log(`  💾 [DB] Updated data for "${key}"`);

  // 2. Xóa cache trong Redis
  await redis.del(key);
  localMemoryCache.delete(key);

  // 3. Publish event để các instances khác biết
  const event = JSON.stringify({ key });
  const receiverCount = await redis.publish("cache:invalidate", event);
  console.log(`  📡 [PubSub] Published invalidation for "${key}" (${receiverCount} subscribers notified)`);

  return newValue;
}

// -------------------------------------------------------
// Giả lập fetchers
// -------------------------------------------------------
let apiCount = 0;

async function fetchArticle(id) {
  apiCount++;
  await new Promise((r) => setTimeout(r, 50));
  return { id, title: `Article #${id}`, body: "...", category: id % 2 === 0 ? "tech" : "news" };
}

// -------------------------------------------------------
// DEMO
// -------------------------------------------------------
async function runDemo() {
  console.log("=".repeat(60));
  console.log("  DEMO: Redis Cache - Distributed Revalidation");
  console.log("=".repeat(60));

  // === DEMO A: Cache-Aside ===
  console.log("\n🔷 PATTERN A: Simple Cache-Aside");
  console.log("--------------------------------------");

  const a1 = await getCachedData("article:1", () => fetchArticle(1), 30);
  console.log("  Data:", a1.title);

  const a1c = await getCachedData("article:1", () => fetchArticle(1), 30);
  console.log("  Data (cached):", a1c.title);

  console.log("\n  [Revalidate] Admin xóa cache article:1");
  await redis.del("article:1");

  const a1f = await getCachedData("article:1", () => fetchArticle(1), 30);
  console.log("  Data (fresh):", a1f.title);

  // === DEMO B: Tag-Based Invalidation ===
  console.log("\n🔷 PATTERN B: Tag-Based Cache Invalidation");
  console.log("--------------------------------------");

  // Cache articles với tags
  await setCachedWithTags("article:10", await fetchArticle(10), ["tech", "featured"], 60);
  await setCachedWithTags("article:20", await fetchArticle(20), ["news"], 60);
  await setCachedWithTags("article:30", await fetchArticle(30), ["tech"], 60);
  await setCachedWithTags("article:40", await fetchArticle(40), ["tech", "featured"], 60);

  console.log("\n  [Action] User update toàn bộ articles thuộc tag 'tech'");
  await invalidateByTag("tech");

  // Kiểm tra lại
  const still10 = await redis.get("article:10");
  const still20 = await redis.get("article:20");
  console.log(`  article:10 still in cache: ${!!still10} (bị xóa vì có tag tech)`);
  console.log(`  article:20 still in cache: ${!!still20} (còn vì chỉ có tag news)`);

  // === DEMO C: Pub/Sub ===
  console.log("\n🔷 PATTERN C: Pub/Sub Real-time Invalidation");
  console.log("--------------------------------------");

  setupCacheInvalidationSubscriber();

  // Giả lập L1 cache đang có dữ liệu
  localMemoryCache.set("user:99", { id: 99, name: "Nguyen Van A" });
  console.log("  L1 cache trước:", [...localMemoryCache.keys()]);

  // Một instance khác cập nhật user:99
  await updateDataAndNotify("user:99", { id: 99, name: "Nguyen Van A (updated)" });

  // Chờ pub/sub xử lý
  await new Promise((r) => setTimeout(r, 100));
  console.log("  L1 cache sau invalidation:", [...localMemoryCache.keys()]);

  console.log(`\n📊 Tổng API calls: ${apiCount}`);
}

runDemo();
