/**
 * BÀI 3: TÌM KIẾM CƠ BẢN (Basic Search)
 * ========================================
 * ZincSearch hỗ trợ 2 loại API tìm kiếm:
 *   1. Native API:          POST /api/:index/_search
 *   2. ES-compatible API:   POST /es/:index/_search  (khuyên dùng)
 *
 * Các loại query cơ bản:
 *   - match_all    : Lấy tất cả document
 *   - match        : Full-text search trên một field
 *   - term         : Tìm chính xác (keyword, số)
 *   - range        : Lọc theo khoảng giá trị
 *   - prefix       : Tìm theo prefix (bắt đầu bằng)
 */

const zinc = require('../zinc_client');

const INDEX_NAME = 'demo_products';

// Seed data để demo search
async function seedData() {
  const docs = [
    { name: 'iPhone 15 Pro Max', price: 34990000, category: 'smartphone', brand: 'Apple', rating: 4.9, in_stock: true },
    { name: 'iPhone 14', price: 19990000, category: 'smartphone', brand: 'Apple', rating: 4.5, in_stock: true },
    { name: 'Samsung Galaxy S24 Ultra', price: 31990000, category: 'smartphone', brand: 'Samsung', rating: 4.7, in_stock: true },
    { name: 'Samsung Galaxy A55', price: 9990000, category: 'smartphone', brand: 'Samsung', rating: 4.3, in_stock: false },
    { name: 'MacBook Pro M3', price: 54990000, category: 'laptop', brand: 'Apple', rating: 4.9, in_stock: true },
    { name: 'Dell XPS 15', price: 42990000, category: 'laptop', brand: 'Dell', rating: 4.6, in_stock: true },
    { name: 'Sony WH-1000XM5', price: 8490000, category: 'headphone', brand: 'Sony', rating: 4.8, in_stock: true },
    { name: 'AirPods Pro 2', price: 6290000, category: 'headphone', brand: 'Apple', rating: 4.7, in_stock: false }
  ];

  // Bulk insert nhanh
  const lines = docs.flatMap(doc => [
    JSON.stringify({ index: { _index: INDEX_NAME } }),
    JSON.stringify(doc)
  ]).join('\n') + '\n';

  await zinc.post('/api/_bulk', lines, {
    headers: { 'Content-Type': 'application/x-ndjson' }
  });
  console.log(`✅ Đã seed ${docs.length} documents`);
}

async function run() {
  console.log('='.repeat(60));
  console.log('BÀI 3: TÌM KIẾM CƠ BẢN - ZincSearch');
  console.log('='.repeat(60));

  await seedData();

  // ─────────────────────────────────────────────────
  // 1. MATCH ALL - Lấy tất cả document
  // ─────────────────────────────────────────────────
  console.log('\n--- 1. match_all (lấy tất cả) ---');
  const allRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: { match_all: {} },
    size: 20  // Số document trả về (default: 10)
  });
  const printHits = (res) => {
    const hits = res.data.hits?.hits || [];
    console.log(`  Tìm thấy: ${res.data.hits?.total?.value || hits.length} docs`);
    hits.forEach(h => console.log(`   • [${h._id}] ${h._source.name} - ${h._source.price?.toLocaleString()}đ`));
  };
  printHits(allRes);

  // ─────────────────────────────────────────────────
  // 2. MATCH - Full-text search
  // Tìm theo nội dung văn bản, hỗ trợ fuzzy matching
  // ─────────────────────────────────────────────────
  console.log('\n--- 2. match (full-text search) ---');
  const matchRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: {
      match: {
        name: {
          query: 'galaxy ultra',
          // operator: 'and'  // Mặc định là 'or'
        }
      }
    }
  });
  printHits(matchRes);

  // ─────────────────────────────────────────────────
  // 3. TERM - Tìm chính xác (exact match)
  // Dùng cho keyword, số, boolean (không phân tích văn bản)
  //
  // ⚠️  ZincSearch: term query với text field cần lowercase
  //     Elasticsearch: dùng .keyword sub-field
  // ─────────────────────────────────────────────────
  console.log('\n--- 3. term (chính xác) ---');
  const termRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: {
      term: { category: 'laptop' }  // keyword field → exact match
    }
  });
  printHits(termRes);

  // ─────────────────────────────────────────────────
  // 4. RANGE - Lọc theo khoảng
  // Hỗ trợ: gte, gt, lte, lt
  // ─────────────────────────────────────────────────
  console.log('\n--- 4. range (khoảng giá) ---');
  const rangeRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: {
      range: {
        price: {
          gte: 10000000,   // >= 10 triệu
          lte: 35000000    // <= 35 triệu
        }
      }
    },
    sort: [{ price: { order: 'asc' } }]  // Sắp xếp tăng dần
  });
  printHits(rangeRes);

  // ─────────────────────────────────────────────────
  // 5. PREFIX - Tìm theo tiền tố
  // ─────────────────────────────────────────────────
  console.log('\n--- 5. prefix (tiền tố) ---');
  const prefixRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: {
      prefix: { name: 'iphone' }  // Các sản phẩm có tên bắt đầu bằng "iphone"
    }
  });
  printHits(prefixRes);

  // ─────────────────────────────────────────────────
  // 6. PAGINATION - Phân trang
  // from: bỏ qua N docs đầu | size: số docs lấy
  // ─────────────────────────────────────────────────
  console.log('\n--- 6. Phân trang (page 1, 3 docs/page) ---');
  const pageRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: { match_all: {} },
    from: 0,    // Trang 1
    size: 3,    // 3 docs mỗi trang
    sort: [{ price: { order: 'desc' } }]
  });
  printHits(pageRes);

  console.log('\n✅ BÀI 3 HOÀN THÀNH');
}

run().catch(console.error);
