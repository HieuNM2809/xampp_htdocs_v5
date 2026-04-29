/**
 * ============================================================
 * LEVEL 1: BASIC IN-MEMORY CACHE - THỦ CÔNG REVALIDATE
 * ============================================================
 * Khái niệm:
 *   - Cache là nơi lưu trữ tạm thời kết quả để tránh tính toán lại
 *   - Revalidate = làm mới cache (xóa dữ liệu cũ, lấy dữ liệu mới)
 *
 * Khi nào dùng:
 *   - Ứng dụng nhỏ, không cần persist cache
 *   - Dữ liệu ít thay đổi
 * ============================================================
 */

// -------------------------------------------------------
// 1. Cache đơn giản nhất - dùng plain object
// -------------------------------------------------------
const simpleCache = {};

function getFromSimpleCache(key) {
  return simpleCache[key] ?? null;
}

function setToSimpleCache(key, value) {
  simpleCache[key] = value;
  console.log(`✅ [SimpleCache] Set: "${key}" = `, value);
}

function revalidateSimpleCache(key) {
  delete simpleCache[key];
  console.log(`🔄 [SimpleCache] Revalidated (deleted): "${key}"`);
}

function revalidateAllSimpleCache() {
  Object.keys(simpleCache).forEach((k) => delete simpleCache[k]);
  console.log(`🔄 [SimpleCache] ALL cache cleared`);
}

// -------------------------------------------------------
// 2. Giả lập fetch dữ liệu từ DB / API
// -------------------------------------------------------
let dbCallCount = 0;

async function fetchUserFromDB(userId) {
  dbCallCount++;
  console.log(`  📦 DB call #${dbCallCount} for userId=${userId}`);
  // Giả lập delay network
  await new Promise((r) => setTimeout(r, 100));
  return { id: userId, name: `User_${userId}`, age: 20 + userId };
}

// -------------------------------------------------------
// 3. Wrapper dùng cache
// -------------------------------------------------------
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  const cached = getFromSimpleCache(cacheKey);

  if (cached) {
    console.log(`  🎯 [Cache HIT] user:${userId}`);
    return cached;
  }

  console.log(`  ❌ [Cache MISS] user:${userId} - fetching from DB...`);
  const user = await fetchUserFromDB(userId);
  setToSimpleCache(cacheKey, user);
  return user;
}

// -------------------------------------------------------
// 4. DEMO chạy
// -------------------------------------------------------
async function runDemo() {
  console.log("=".repeat(55));
  console.log("  DEMO: Basic In-Memory Cache + Revalidation");
  console.log("=".repeat(55));

  console.log("\n--- Lần 1: Chưa có cache ---");
  const u1 = await getUser(1);
  console.log("  Result:", u1);

  console.log("\n--- Lần 2: Dùng cache (không gọi DB) ---");
  const u1Cached = await getUser(1);
  console.log("  Result:", u1Cached);

  console.log("\n--- Revalidate cache của user 1 ---");
  revalidateSimpleCache("user:1");

  console.log("\n--- Lần 3: Cache đã bị xóa -> gọi DB lại ---");
  const u1Fresh = await getUser(1);
  console.log("  Result:", u1Fresh);

  console.log("\n--- Lấy user 2 ---");
  await getUser(2);

  console.log("\n--- Revalidate ALL cache ---");
  revalidateAllSimpleCache();

  console.log("\n--- Sau revalidate ALL: cả user 1 và 2 đều miss ---");
  await getUser(1);
  await getUser(2);

  console.log(`\n📊 Tổng số lần gọi DB: ${dbCallCount}`);
}

runDemo();
