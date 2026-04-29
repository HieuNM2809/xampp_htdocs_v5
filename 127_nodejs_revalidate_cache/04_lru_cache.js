/**
 * ============================================================
 * LEVEL 4: LRU CACHE (Least Recently Used)
 * ============================================================
 * Khái niệm:
 *   - LRU = Xóa entry ít được dùng nhất khi cache đầy
 *   - Kết hợp TTL + LRU eviction policy
 *   - Revalidate = xóa entry cụ thể hoặc pattern matching
 *
 * Cấu trúc dữ liệu:
 *   - Dùng Map (duy trì insertion order) + doubly linked list
 *   - O(1) get/set/delete
 *
 * Khi nào dùng:
 *   - Cần giới hạn dung lượng cache
 *   - Muốn giữ "hot data" trong cache
 *   - Multi-tenant system (nhiều user, nhiều key)
 * ============================================================
 */

// -------------------------------------------------------
// LRU Cache tự xây dựng (không dùng thư viện)
// -------------------------------------------------------
class LRUCache {
  constructor(capacity, defaultTTL = 10000) {
    this.capacity = capacity;
    this.defaultTTL = defaultTTL;
    // Map giữ thứ tự: key -> { value, expiresAt }
    // Phần tử cuối = recently used nhất
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, evictions: 0, revalidations: 0 };
  }

  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const entry = this.cache.get(key);

    // Kiểm tra TTL
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`  ⏰ [LRU] EXPIRED "${key}"`);
      return null;
    }

    // Di chuyển lên cuối (recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.stats.hits++;

    const remainMs = entry.expiresAt - Date.now();
    console.log(`  🎯 [LRU] HIT "${key}" | TTL còn: ${remainMs}ms`);
    return entry.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    // Nếu key đã tồn tại -> update và move to end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Nếu full -> xóa entry cũ nhất (đầu Map)
    else if (this.cache.size >= this.capacity) {
      const lruKey = this.cache.keys().next().value;
      this.cache.delete(lruKey);
      this.stats.evictions++;
      console.log(`  🗑️  [LRU] EVICTED (LRU) "${lruKey}" (cache full)`);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
    console.log(`  ✅ [LRU] SET "${key}" | size: ${this.cache.size}/${this.capacity}`);
  }

  // Revalidate một key
  revalidate(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.stats.revalidations++;
      console.log(`  🔄 [LRU] REVALIDATED "${key}"`);
      return true;
    }
    return false;
  }

  // Revalidate theo pattern (prefix matching)
  revalidatePattern(pattern) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        this.stats.revalidations++;
        count++;
        console.log(`  🔄 [LRU] Pattern revalidated: "${key}"`);
      }
    }
    console.log(`  🔄 [LRU] Pattern "${pattern}*" -> ${count} entries removed`);
    return count;
  }

  // Revalidate toàn bộ
  flush() {
    const count = this.cache.size;
    this.cache.clear();
    console.log(`  🧹 [LRU] FLUSH: cleared ${count} entries`);
  }

  printStats() {
    const { hits, misses, evictions, revalidations } = this.stats;
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(1) : 0;
    console.log(`\n📊 LRU Cache Stats:`);
    console.log(`   Capacity:     ${this.cache.size}/${this.capacity}`);
    console.log(`   Hit Rate:     ${hitRate}% (${hits} hits / ${total} total)`);
    console.log(`   Evictions:    ${evictions}`);
    console.log(`   Revalidations: ${revalidations}`);
    console.log(`   Current keys: [${[...this.cache.keys()].join(", ")}]`);
  }
}

// -------------------------------------------------------
// Giả lập data repository
// -------------------------------------------------------
let dbCalls = 0;

async function fetchPost(postId) {
  dbCalls++;
  await new Promise((r) => setTimeout(r, 50));
  return {
    id: postId,
    title: `Post Title #${postId}`,
    content: `Content of post ${postId}`,
    author: `author_${postId % 5}`,
    views: Math.floor(Math.random() * 10000),
    updatedAt: new Date().toISOString(),
  };
}

// LRU Cache chỉ giữ 3 entries
const postCache = new LRUCache(3, 5000);

async function getPost(postId) {
  const key = `post:${postId}`;
  const cached = postCache.get(key);
  if (cached) return cached;

  console.log(`  📦 DB Query: post ${postId}...`);
  const post = await fetchPost(postId);
  postCache.set(key, post);
  return post;
}

// -------------------------------------------------------
// DEMO
// -------------------------------------------------------
async function runDemo() {
  console.log("=".repeat(60));
  console.log("  DEMO: LRU Cache với TTL và Pattern Revalidation");
  console.log("=".repeat(60));

  console.log("\n--- Bước 1: Thêm 3 posts vào cache (capacity=3) ---");
  await getPost(101);
  await getPost(102);
  await getPost(103);
  postCache.printStats();

  console.log("\n--- Bước 2: Truy cập post 101 (LRU order: 102 < 103 < 101) ---");
  await getPost(101); // 101 bây giờ là "recently used" nhất
  console.log("  LRU order: 102 < 103 < 101");

  console.log("\n--- Bước 3: Thêm post 104 -> cache full -> EVICT 102 (LRU nhất) ---");
  await getPost(104);
  postCache.printStats();

  console.log("\n--- Bước 4: Thêm post 105 -> EVICT 103 ---");
  await getPost(105);
  postCache.printStats();

  console.log("\n--- Bước 5: Revalidate theo pattern (author_1 viết lại nhiều bài) ---");
  // Giả sử author_1 cập nhật: cần revalidate tất cả post của họ
  // Thêm thêm dữ liệu để demo pattern
  const authorCache = new LRUCache(10, 10000);
  authorCache.set("post:author_1:10", { id: 10 });
  authorCache.set("post:author_1:20", { id: 20 });
  authorCache.set("post:author_2:30", { id: 30 });
  authorCache.set("post:author_1:40", { id: 40 });

  console.log("  Cache trước revalidate:", [...authorCache.cache.keys()]);
  authorCache.revalidatePattern("post:author_1:");
  console.log("  Cache sau revalidate:", [...authorCache.cache.keys()]);

  console.log("\n--- Bước 6: Single revalidate (user edit post 104) ---");
  postCache.revalidate("post:104");
  postCache.printStats();

  console.log(`\n  Tổng DB calls: ${dbCalls}`);
}

runDemo();
