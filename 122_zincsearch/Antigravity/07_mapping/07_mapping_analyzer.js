/**
 * BÀI 7: MAPPING & ANALYZER (Định dạng dữ liệu & Phân tích văn bản)
 * ===================================================================
 * Mapping định nghĩa cấu trúc dữ liệu của index.
 * Analyzer quyết định cách phân tích văn bản khi index và search.
 *
 * Các kiểu dữ liệu ZincSearch hỗ trợ:
 *   text     : Full-text search, được phân tích (analyze)
 *   keyword  : Exact match, không phân tích
 *   numeric  : Số (int, float, double...)
 *   bool     : Boolean (true/false)
 *   time     : Date/time
 *
 * Khác với Elasticsearch:
 *   - ES có nhiều numeric types: integer, long, float, double, byte...
 *   - ES hỗ trợ custom analyzer phức tạp hơn
 *   - ES có nested, object, geo_point, geo_shape types
 *   - ZincSearch chỉ hỗ trợ analyzer built-in cơ bản
 */

const zinc = require('../zinc_client');

const INDEX_NAME = 'demo_articles';

async function run() {
  console.log('='.repeat(60));
  console.log('BÀI 7: MAPPING & ANALYZER - ZincSearch');
  console.log('='.repeat(60));

  // ─────────────────────────────────────────────────
  // 1. TẠO INDEX VỚI MAPPING RÕ RÀNG
  // Các field type có ảnh hưởng trực tiếp đến search behavior
  // ─────────────────────────────────────────────────
  console.log('\n--- 1. Tạo Index với Mapping đầy đủ ---');
  try {
    await zinc.put('/api/index', {
      name: INDEX_NAME,
      storage_type: 'disk',
      mappings: {
        properties: {
          // TEXT: Full-text search, được tokenize và lowercase
          title:       { type: 'text', analyzer: 'standard', index: true, store: true },
          content:     { type: 'text', analyzer: 'standard', index: true },

          // KEYWORD: Exact match, dùng cho filter/sort/agg
          category:    { type: 'keyword', index: true },
          author:      { type: 'keyword', index: true },
          status:      { type: 'keyword', index: true },

          // NUMERIC: Dùng cho range query và sort
          view_count:  { type: 'numeric', index: true },
          like_count:  { type: 'numeric', index: true },

          // BOOL: Boolean
          is_featured: { type: 'bool', index: true },
          is_published:{ type: 'bool', index: true },

          // TIME: Date/time với format
          published_at: {
            type:   'time',
            format: 'yyyy-MM-dd HH:mm:ss',
            index:  true
          },

          // TEXT không index: lưu mà không tìm kiếm được (tiết kiệm bộ nhớ)
          thumbnail_url: { type: 'text', index: false, store: true }
        }
      }
    });
    console.log('✅ Tạo index với mapping thành công');
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('ℹ️  Index đã tồn tại');
    } else throw err;
  }

  // ─────────────────────────────────────────────────
  // 2. XEM MAPPING HIỆN TẠI
  // GET /api/:index/mapping
  // ─────────────────────────────────────────────────
  console.log('\n--- 2. Xem Mapping hiện tại ---');
  const mappingRes = await zinc.get(`/api/${INDEX_NAME}/mapping`);
  const props = mappingRes.data?.mappings?.properties || {};
  console.log('  Các field và type:');
  Object.entries(props).forEach(([field, def]) => {
    console.log(`   • ${field}: type=${def.type}, index=${def.index ?? true}`);
  });

  // ─────────────────────────────────────────────────
  // 3. SEED DATA để demo analyzer behavior
  // ─────────────────────────────────────────────────
  console.log('\n--- 3. Insert test articles ---');
  const articles = [
    {
      title: 'Hướng dẫn ZincSearch từ cơ bản đến nâng cao',
      content: 'ZincSearch là công cụ tìm kiếm mã nguồn mở viết bằng Go, nhẹ và nhanh.',
      category: 'tutorial',
      author: 'Nguyen Van A',
      status: 'published',
      view_count: 1520,
      like_count: 234,
      is_featured: true,
      is_published: true,
      published_at: '2024-03-15 10:00:00',
      thumbnail_url: 'https://example.com/zinc.jpg'
    },
    {
      title: 'So sánh ZincSearch với Elasticsearch',
      content: 'Elasticsearch là nền tảng tìm kiếm mạnh mẽ nhưng nặng tài nguyên so với ZincSearch.',
      category: 'comparison',
      author: 'Tran Thi B',
      status: 'published',
      view_count: 3890,
      like_count: 512,
      is_featured: true,
      is_published: true,
      published_at: '2024-04-20 14:30:00',
      thumbnail_url: 'https://example.com/compare.jpg'
    },
    {
      title: 'Tối ưu hiệu năng tìm kiếm',
      content: 'Các kỹ thuật tối ưu index, query và analyzer giúp cải thiện tốc độ tìm kiếm.',
      category: 'performance',
      author: 'Le Van C',
      status: 'draft',
      view_count: 890,
      like_count: 67,
      is_featured: false,
      is_published: false,
      published_at: '2024-05-01 09:00:00',
      thumbnail_url: 'https://example.com/perf.jpg'
    }
  ];

  const lines = articles.flatMap(a => [
    JSON.stringify({ index: { _index: INDEX_NAME } }),
    JSON.stringify(a)
  ]).join('\n') + '\n';
  await zinc.post('/api/_bulk', lines, { headers: { 'Content-Type': 'application/x-ndjson' } });
  console.log('✅ Đã insert articles');

  // ─────────────────────────────────────────────────
  // 4. TEXT vs KEYWORD BEHAVIOR
  // text   → analyze → lowercase, tokenize → match "zincsearch"
  // keyword → exact match → phải khớp nguyên văn
  // ─────────────────────────────────────────────────
  console.log('\n--- 4. Text vs Keyword behavior ---');

  // Search trên text field (phân tích văn bản)
  const textSearchRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: { match: { title: 'hướng dẫn' } },  // Case-insensitive, analyzed
    _source: ['title', 'category']
  });
  console.log('  match "hướng dẫn" trên text field:');
  (textSearchRes.data.hits?.hits || []).forEach(h =>
    console.log(`   • ${h._source.title}`)
  );

  // Search trên keyword field (exact match)
  const keywordSearchRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: { term: { category: 'tutorial' } },  // Exact match
    _source: ['title', 'category']
  });
  console.log('\n  term "tutorial" trên keyword field:');
  (keywordSearchRes.data.hits?.hits || []).forEach(h =>
    console.log(`   • [${h._source.category}] ${h._source.title}`)
  );

  // ─────────────────────────────────────────────────
  // 5. SORT BY NUMERIC & TIME FIELD
  // ─────────────────────────────────────────────────
  console.log('\n--- 5. Sort by numeric field (view_count desc) ---');
  const sortRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: { match_all: {} },
    sort: [{ view_count: { order: 'desc' } }],
    _source: ['title', 'view_count', 'published_at']
  });
  (sortRes.data.hits?.hits || []).forEach(h =>
    console.log(`   • views=${h._source.view_count} | ${h._source.title}`)
  );

  console.log('\n✅ BÀI 7 HOÀN THÀNH');
}

run().catch(console.error);
