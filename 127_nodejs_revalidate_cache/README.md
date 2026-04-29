# 🚀 Node.js Cache Revalidation - Từ Cơ Bản đến Nâng Cao

## 📚 Tổng Quan

| Level | File | Kỹ thuật | Độ khó |
|-------|------|----------|--------|
| 1 | `01_basic_memory_cache.js` | In-Memory Cache + Manual Revalidate | ⭐ |
| 2 | `02_ttl_cache.js` | TTL (Time-To-Live) Auto Expire | ⭐⭐ |
| 3 | `03_stale_while_revalidate.js` | Stale-While-Revalidate (SWR) | ⭐⭐⭐ |
| 4 | `04_lru_cache.js` | LRU Cache + Pattern Revalidation | ⭐⭐⭐ |
| 5 | `05_redis_cache.js` | Redis + Tag-Based + Pub/Sub | ⭐⭐⭐⭐ |
| 6 | `06_http_cache_headers.js` | HTTP Headers (ETag, Last-Modified) | ⭐⭐⭐⭐ |
| 7 | `07_layered_cache.js` | Layered Cache L1/L2/L3 + Circuit Breaker | ⭐⭐⭐⭐⭐ |
| 8 | `08_advanced_swr_pattern.js` | Stampede Prevention + Deduplication | ⭐⭐⭐⭐⭐ |

---

## 🔧 Cài đặt & Chạy

```bash
npm install

# Chạy từng example
node 01_basic_memory_cache.js
node 02_ttl_cache.js
node 03_stale_while_revalidate.js
node 04_lru_cache.js
node 05_redis_cache.js
node 06_http_cache_headers.js    # Mở http://localhost:3006
node 07_layered_cache.js
node 08_advanced_swr_pattern.js
```

---

## 📖 Giải Thích Chi Tiết

### Level 1: Basic In-Memory Cache
```
Request → Check cache → HIT: return cache
                      → MISS: fetch DB → store cache → return
```
- **Revalidate**: Xóa thủ công bằng `delete cache[key]`
- **Dùng khi**: App nhỏ, dữ liệu đơn giản

### Level 2: TTL Cache
```
cache.set(key, value, ttl=5000ms)
// Sau 5 giây -> tự động expire
cache.get(key) // null nếu expired
```
- **Revalidate**: Tự động theo TTL hoặc xóa thủ công
- **Dùng khi**: Dữ liệu chấp nhận stale trong thời gian ngắn

### Level 3: Stale-While-Revalidate (SWR)
```
Lần 1 (0ms):    MISS  → fetch → lưu (fresh: 5s)
Lần 2 (3s):     FRESH → trả ngay
Lần 3 (6s):     STALE → trả stale NGAY + background fetch
Lần 4 (6.2s):   FRESH → dữ liệu mới (background đã xong)
```
- **Lợi ích**: User không bao giờ chờ (trừ lần đầu)
- **Dùng khi**: API response time quan trọng (UX)

### Level 4: LRU Cache
```
capacity = 3
[A, B, C] → access A → [B, C, A] → add D → EVICT B → [C, A, D]
```
- **Eviction**: Tự động xóa entry ít dùng nhất khi đầy
- **Pattern revalidate**: Xóa tất cả keys có prefix `"user:alice:"`

### Level 5: Redis Distributed Cache

**Tag-Based Invalidation:**
```
setCachedWithTags("article:1", data, ["tech", "featured"])
setCachedWithTags("article:2", data, ["tech"])
invalidateByTag("tech") → xóa article:1 và article:2
```

**Pub/Sub Real-time Invalidation:**
```
Instance A cập nhật user:1
  → Xóa Redis cache
  → Publish "cache:invalidate" {key: "user:1"}
  → Instance B, C nhận event → xóa L1 cache của mình
```

### Level 6: HTTP Cache Headers

| Header | Ý nghĩa |
|--------|---------|
| `Cache-Control: no-store` | Không cache gì |
| `Cache-Control: max-age=60` | Cache 60s |
| `Cache-Control: no-cache` | Luôn revalidate (có thể 304) |
| `Cache-Control: stale-while-revalidate=60` | Stale 60s + bg revalidate |
| `Cache-Control: immutable` | Không bao giờ revalidate |
| `ETag: "abc123"` | Fingerprint content, dùng cho conditional request |
| `Last-Modified: <date>` | Thời gian sửa đổi, dùng cho conditional request |
| `Vary: Accept-Language` | Cache riêng theo language |

**ETag Flow:**
```
GET /api/data         → 200 + ETag: "abc"
GET /api/data         → If-None-Match: "abc" → 304 Not Modified (no body!)
POST /update          → data changed
GET /api/data         → If-None-Match: "abc" → 200 + ETag: "xyz" + new data
```

### Level 7: Layered Cache (L1 → L2 → L3)
```
Request
  → L1 Memory (1ms):  HIT → return
  → L2 Redis (3ms):   HIT → populate L1 → return
  → L3 DB (100ms):    HIT → populate L1+L2 → return
                      FAIL → Circuit Breaker → Stale Fallback
```

**Circuit Breaker States:**
```
CLOSED → (failures >= threshold) → OPEN → (reset timeout) → HALF-OPEN → (success) → CLOSED
```

### Level 8: Advanced SWR - Production Grade

**Cache Stampede Problem:**
```
Cache expires → 1000 requests hit simultaneously
                → 1000 DB calls → DB crash! 💥
```

**Solution - Request Deduplication:**
```
Request 1  → inFlight["key"] = fetchPromise (fetch started)
Request 2  → inFlight["key"] exists → await same promise (DEDUP!)
Request 3  → inFlight["key"] exists → await same promise (DEDUP!)
... 997 more requests deduplicated
→ Only 1 actual DB/API call! ✅
```

**Probabilistic Early Expiration:**
```
Formula: -cacheDelta * beta * log(rand()) > ttlRemaining
→ Xác suất expire tăng dần khi gần hết TTL
→ Tránh tất cả cache expire cùng lúc (thundering herd)
```

---

## 🎯 Khi Nào Dùng Chiến Lược Nào?

| Scenario | Chiến lược đề xuất |
|----------|-------------------|
| Static data (config, translations) | `immutable` + long TTL |
| User profile (thay đổi ít) | SWR (freshFor=5m, staleFor=1h) |
| Product prices (update thường) | TTL ngắn + manual revalidate |
| Real-time data (stock, chat) | No cache hoặc TTL <5s |
| Multi-server deployment | Redis + Pub/Sub invalidation |
| High-traffic API | Layered cache + Stampede prevention |
| CDN/Browser caching | HTTP Cache Headers (ETag, SWR) |
| Related data (user's posts) | Tag-based invalidation |

---

## ⚡ Best Practices

1. **Cache ở nhiều tầng**: L1 (memory) → L2 (Redis) → L3 (DB)
2. **Dùng SWR thay TTL strict**: User không phải chờ
3. **Deduplication**: Tránh stampede với in-flight tracking
4. **Tag-based invalidation**: Dễ invalidate nhóm liên quan
5. **Stale-if-error**: Khi DB fail, dùng cache cũ thay vì crash
6. **Monitor cache hit rate**: >90% = tốt, <70% = cần review
7. **Đặt TTL hợp lý**: Cân bằng giữa freshness và performance
