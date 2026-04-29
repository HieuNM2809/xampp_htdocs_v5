/**
 * BÀI 4: TÌM KIẾM NÂNG CAO (Advanced Search)
 * =============================================
 * Kết hợp nhiều điều kiện với bool query:
 *   - must    : Tất cả điều kiện PHẢI đúng (AND)
 *   - should  : Ít nhất 1 điều kiện đúng (OR)
 *   - must_not: Điều kiện PHẢI SAI (NOT)
 *   - filter  : Giống must nhưng không tính score
 *
 * Nâng cao hơn:
 *   - multi_match    : Tìm trên nhiều field
 *   - query_string   : Cú pháp Lucene
 *   - fuzzy          : Tìm gần đúng (typo tolerance)
 *   - wildcard       : Tìm theo pattern (*, ?)
 *   - highlight      : Đánh dấu kết quả tìm kiếm
 *   - _source filter : Chỉ lấy field cần thiết
 */

const zinc = require('../zinc_client');

const INDEX_NAME = 'demo_products';

function printHits(res, label = '') {
  const hits = res.data.hits?.hits || [];
  const total = res.data.hits?.total?.value ?? hits.length;
  console.log(`  [${label}] Tìm thấy: ${total} docs`);
  hits.slice(0, 5).forEach(h => {
    const src = h._source;
    console.log(`   • score=${h._score?.toFixed(2)} | ${src.name} | ${src.category} | ${src.price?.toLocaleString()}đ`);
    if (h.highlight) {
      Object.entries(h.highlight).forEach(([field, snippets]) => {
        console.log(`     highlight [${field}]:`, snippets.join(' ... '));
      });
    }
  });
}

async function run() {
  console.log('='.repeat(60));
  console.log('BÀI 4: TÌM KIẾM NÂNG CAO - ZincSearch');
  console.log('='.repeat(60));

  // ─────────────────────────────────────────────────
  // 1. BOOL QUERY - Kết hợp điều kiện
  // Tìm: smartphone của Apple HOẶC Samsung, giá <= 30tr, không hết hàng
  // ─────────────────────────────────────────────────
  console.log('\n--- 1. Bool Query (must + should + filter) ---');
  const boolRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: {
      bool: {
        must: [
          { term: { category: 'smartphone' } }  // PHẢI là smartphone
        ],
        should: [
          { term: { brand: 'apple' } },          // brand là Apple
          { term: { brand: 'samsung' } }          // HOẶC Samsung
        ],
        must_not: [
          { term: { in_stock: false } }           // KHÔNG được hết hàng
        ],
        filter: [
          { range: { price: { lte: 30000000 } } } // Giá <= 30tr (không tính score)
        ],
        minimum_should_match: 1  // Ít nhất 1 should phải match
      }
    },
    sort: [
      { rating: { order: 'desc' } },   // Sắp theo rating cao nhất
      { price: { order: 'asc' } }       // Sau đó giá thấp nhất
    ]
  });
  printHits(boolRes, 'bool');

  // ─────────────────────────────────────────────────
  // 2. MULTI_MATCH - Tìm trên nhiều field cùng lúc
  // ─────────────────────────────────────────────────
  console.log('\n--- 2. Multi-match (tìm trên nhiều field) ---');
  const multiRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: {
      multi_match: {
        query: 'pro',
        fields: ['name^2', 'category'],  // ^2 = nhân đôi score cho field name
        type: 'best_fields'  // 'best_fields' | 'most_fields' | 'cross_fields'
      }
    }
  });
  printHits(multiRes, 'multi_match');

  // ─────────────────────────────────────────────────
  // 3. QUERY STRING - Lucene syntax
  // Hỗ trợ: AND, OR, NOT, wildcard, range, grouping
  //
  // ⚠️  ZincSearch hỗ trợ query_string hạn chế hơn Elasticsearch
  // ─────────────────────────────────────────────────
  console.log('\n--- 3. Query String (Lucene syntax) ---');
  const queryStringRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: {
      query_string: {
        query: 'name:iphone OR name:macbook',
        default_operator: 'OR'
      }
    }
  });
  printHits(queryStringRes, 'query_string');

  // ─────────────────────────────────────────────────
  // 4. FUZZY - Tìm gần đúng (chịu lỗi chính tả)
  // fuzziness: 0, 1, 2 hoặc "AUTO"
  //
  // Ví dụ: "ipone" vẫn tìm thấy "iPhone"
  // ─────────────────────────────────────────────────
  console.log('\n--- 4. Fuzzy (chịu lỗi chính tả) ---');
  const fuzzyRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: {
      fuzzy: {
        name: {
          value: 'samsing',   // Typo: "samsing" → "samsung"
          fuzziness: 2        // Cho phép lệch 2 ký tự
        }
      }
    }
  });
  printHits(fuzzyRes, 'fuzzy');

  // ─────────────────────────────────────────────────
  // 5. WILDCARD - Tìm theo pattern
  // *  = nhiều ký tự bất kỳ
  // ?  = 1 ký tự bất kỳ
  //
  // ⚠️  Chậm trên dataset lớn, tránh dùng leading wildcard (*abc)
  // ─────────────────────────────────────────────────
  console.log('\n--- 5. Wildcard (*,?) ---');
  const wildcardRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: {
      wildcard: {
        name: { value: '*pro*' }  // Chứa "pro" ở bất kỳ vị trí nào
      }
    }
  });
  printHits(wildcardRes, 'wildcard');

  // ─────────────────────────────────────────────────
  // 6. HIGHLIGHT - Đánh dấu từ khóa trong kết quả
  // Giúp UI hiển thị vị trí match
  // ─────────────────────────────────────────────────
  console.log('\n--- 6. Highlight (đánh dấu từ khóa) ---');
  const highlightRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: {
      match: { name: 'galaxy pro' }
    },
    highlight: {
      fields: {
        name: {
          pre_tags: ['<strong>'],    // Tag mở
          post_tags: ['</strong>']   // Tag đóng
        }
      }
    }
  });
  printHits(highlightRes, 'highlight');

  // ─────────────────────────────────────────────────
  // 7. SOURCE FILTERING - Chỉ lấy field cần thiết
  // Giảm băng thông và tốc độ xử lý
  // ─────────────────────────────────────────────────
  console.log('\n--- 7. Source Filtering (chỉ lấy fields cần) ---');
  const sourceRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: { match_all: {} },
    _source: ['name', 'price', 'brand'],  // Chỉ lấy 3 fields
    size: 3
  });
  console.log('  Chỉ có 3 fields:');
  (sourceRes.data.hits?.hits || []).forEach(h => {
    console.log(`   •`, h._source);
  });

  console.log('\n✅ BÀI 4 HOÀN THÀNH');

  /*
   * ═══════════════════════════════════════════════
   * MỨC HỖ TRỢ QUERY ZincSearch vs Elasticsearch
   * ═══════════════════════════════════════════════
   *
   * | Query Type       | ZincSearch  | Elasticsearch |
   * |------------------|-------------|---------------|
   * | match_all        | ✅           | ✅             |
   * | match            | ✅           | ✅             |
   * | term             | ✅           | ✅             |
   * | range            | ✅           | ✅             |
   * | bool             | ✅           | ✅             |
   * | multi_match      | ✅           | ✅             |
   * | query_string     | ✅ Hạn chế   | ✅ Đầy đủ      |
   * | fuzzy            | ✅           | ✅             |
   * | wildcard         | ✅           | ✅             |
   * | highlight        | ✅           | ✅             |
   * | nested query     | ❌           | ✅             |
   * | has_child/parent | ❌           | ✅             |
   * | percolate        | ❌           | ✅             |
   * | kNN (vector)     | ❌           | ✅ (8.x+)       |
   */
}

run().catch(console.error);
