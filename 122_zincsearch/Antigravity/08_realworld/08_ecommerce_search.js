/**
 * BÀI 8: THỰC TẾ - Tìm kiếm sản phẩm E-commerce
 * =================================================
 * Ứng dụng thực tế kết hợp tất cả kỹ năng:
 *   ✅ Tạo index với mapping hợp lý
 *   ✅ Bulk import catalog sản phẩm
 *   ✅ Search bar: full-text + filter kết hợp
 *   ✅ Faceted search (lọc theo category, brand, price range)
 *   ✅ Sort (giá, rating, mới nhất)
 *   ✅ Aggregation cho sidebar filter
 *   ✅ Autocomplete / Suggest
 */

const zinc = require('../zinc_client');

const INDEX_NAME = 'ecommerce_catalog';

// ─────────────────────────────────────────────────
// SEED: Catalog sản phẩm điện tử 50 sản phẩm
// ─────────────────────────────────────────────────
const CATALOG = [
  { sku:'SKU001', name:'iPhone 15 Pro Max 256GB', brand:'Apple', category:'điện thoại', subcategory:'flagship', price:34990000, old_price:36990000, rating:4.9, review_count:1520, stock:85, color: ['titan đen', 'titan trắng', 'titan tự nhiên'], os:'iOS', released:'2024-01-01' },
  { sku:'SKU002', name:'iPhone 15 128GB',         brand:'Apple', category:'điện thoại', subcategory:'standard', price:22490000, old_price:24490000, rating:4.7, review_count:980,  stock:120, color:['hồng', 'vàng', 'xanh'], os:'iOS', released:'2024-01-15' },
  { sku:'SKU003', name:'Samsung Galaxy S24 Ultra', brand:'Samsung', category:'điện thoại', subcategory:'flagship', price:31990000, old_price:33990000, rating:4.8, review_count:2100, stock:60, color:['đen','trắng','xanh bộ'], os:'Android', released:'2024-02-01' },
  { sku:'SKU004', name:'Samsung Galaxy A55 5G',   brand:'Samsung', category:'điện thoại', subcategory:'mid-range', price:9990000, old_price:10990000, rating:4.4, review_count:450, stock:200, color:['xanh navy','bạc'], os:'Android', released:'2024-03-01' },
  { sku:'SKU005', name:'Xiaomi 14 Ultra',         brand:'Xiaomi', category:'điện thoại', subcategory:'flagship', price:24990000, old_price:27990000, rating:4.6, review_count:780, stock:45, color:['trắng titan','đen titan'], os:'Android', released:'2024-02-15' },
  { sku:'SKU006', name:'OPPO Find X7 Ultra',      brand:'OPPO', category:'điện thoại', subcategory:'flagship', price:26990000, old_price:28990000, rating:4.5, review_count:320, stock:30, color:['xanh titan'], os:'Android', released:'2024-01-10' },
  { sku:'SKU007', name:'MacBook Pro M3 14 inch',  brand:'Apple', category:'laptop', subcategory:'pro', price:54990000, old_price:58990000, rating:4.9, review_count:890, stock:25, color:['bạc','xám vũ trụ'], os:'macOS', released:'2023-11-01' },
  { sku:'SKU008', name:'MacBook Air M2',           brand:'Apple', category:'laptop', subcategory:'standard', price:29990000, old_price:32990000, rating:4.8, review_count:1200, stock:40, color:['bạc xanh bầu trời','vàng ánh trăng'], os:'macOS', released:'2023-06-01' },
  { sku:'SKU009', name:'Dell XPS 15 OLED',        brand:'Dell', category:'laptop', subcategory:'pro', price:42990000, old_price:45990000, rating:4.6, review_count:560, stock:15, color:['bạc platinum'], os:'Windows', released:'2024-01-20' },
  { sku:'SKU010', name:'Lenovo ThinkPad X1 Carbon', brand:'Lenovo', category:'laptop', subcategory:'business', price:38990000, old_price:41990000, rating:4.7, review_count:430, stock:20, color:['đen'], os:'Windows', released:'2024-02-10' },
  { sku:'SKU011', name:'Asus ROG Zephyrus G14',   brand:'Asus', category:'laptop', subcategory:'gaming', price:36990000, old_price:39990000, rating:4.7, review_count:670, stock:18, color:['trắng moonlight'], os:'Windows', released:'2024-03-05' },
  { sku:'SKU012', name:'Sony WH-1000XM5',         brand:'Sony', category:'tai nghe', subcategory:'over-ear', price:8490000, old_price:9490000, rating:4.9, review_count:3200, stock:80, color:['đen','bạc'], os:null, released:'2023-05-01' },
  { sku:'SKU013', name:'AirPods Pro 2',           brand:'Apple', category:'tai nghe', subcategory:'in-ear', price:6290000, old_price:6990000, rating:4.7, review_count:2100, stock:150, color:['trắng'], os:null, released:'2022-09-01' },
  { sku:'SKU014', name:'Bose QuietComfort 45',    brand:'Bose', category:'tai nghe', subcategory:'over-ear', price:6990000, old_price:7990000, rating:4.6, review_count:1500, stock:55, color:['trắng','đen'], os:null, released:'2023-01-01' },
  { sku:'SKU015', name:'Samsung Galaxy Watch 6',  brand:'Samsung', category:'đồng hồ', subcategory:'smartwatch', price:5990000, old_price:6990000, rating:4.5, review_count:870, stock:90, color:['đen graphite','bạc'], os:'Wear OS', released:'2023-08-10' },
  { sku:'SKU016', name:'Apple Watch Series 9',    brand:'Apple', category:'đồng hồ', subcategory:'smartwatch', price:10990000, old_price:11990000, rating:4.8, review_count:1800, stock:70, color:['midnight','starlight'], os:'watchOS', released:'2023-09-22' },
  { sku:'SKU017', name:'iPad Pro M2 11 inch',     brand:'Apple', category:'máy tính bảng', subcategory:'pro', price:22990000, old_price:24990000, rating:4.8, review_count:760, stock:35, color:['bạc','xám vũ trụ'], os:'iPadOS', released:'2022-10-18' },
  { sku:'SKU018', name:'Samsung Galaxy Tab S9',   brand:'Samsung', category:'máy tính bảng', subcategory:'flagship', price:17990000, old_price:19990000, rating:4.6, review_count:520, stock:40, color:['graphite','beige'], os:'Android', released:'2023-08-11' },
];

function toNDJSON(lines) {
  return lines.map(l => JSON.stringify(l)).join('\n') + '\n';
}

// ─────────────────────────────────────────────────
// SETUP: Tạo index và import data
// ─────────────────────────────────────────────────
async function setup() {
  try {
    await zinc.put('/api/index', {
      name: INDEX_NAME,
      storage_type: 'disk',
      mappings: {
        properties: {
          sku:          { type: 'keyword', index: true },
          name:         { type: 'text',    analyzer: 'standard', index: true },
          brand:        { type: 'keyword', index: true },
          category:     { type: 'keyword', index: true },
          subcategory:  { type: 'keyword', index: true },
          price:        { type: 'numeric', index: true },
          old_price:    { type: 'numeric', index: true },
          rating:       { type: 'numeric', index: true },
          review_count: { type: 'numeric', index: true },
          stock:        { type: 'numeric', index: true },
          os:           { type: 'keyword', index: true },
          released:     { type: 'time', format: 'yyyy-MM-dd', index: true }
        }
      }
    });
    console.log('✅ Tạo index ecommerce_catalog');
  } catch {
    console.log('ℹ️  Index đã tồn tại');
  }

  const bulkLines = CATALOG.flatMap(p => [
    { index: { _index: INDEX_NAME, _id: p.sku } },
    p
  ]);
  await zinc.post('/api/_bulk', toNDJSON(bulkLines),
    { headers: { 'Content-Type': 'application/x-ndjson' } }
  );
  console.log(`✅ Import ${CATALOG.length} sản phẩm`);
}

// ─────────────────────────────────────────────────
// USE CASE 1: Search bar thực tế
// Người dùng gõ từ khóa, hệ thống tìm sản phẩm
// ─────────────────────────────────────────────────
async function productSearch({ keyword, category, brand, minPrice, maxPrice, sortBy = 'relevance', page = 1, size = 5 }) {
  const must = [];
  const filter = [];

  // Full-text trên name với boost
  if (keyword) {
    must.push({
      multi_match: {
        query: keyword,
        fields: ['name^3', 'brand^2', 'category'],
        type: 'best_fields',
        fuzziness: 'AUTO'  // Tự suy ra fuzziness phù hợp
      }
    });
  } else {
    must.push({ match_all: {} });
  }

  // Filter (không ảnh hưởng relevance score)
  if (category) filter.push({ term: { category } });
  if (brand)    filter.push({ term: { brand } });
  if (minPrice || maxPrice) {
    const rangeQuery = { range: { price: {} } };
    if (minPrice) rangeQuery.range.price.gte = minPrice;
    if (maxPrice) rangeQuery.range.price.lte = maxPrice;
    filter.push(rangeQuery);
  }

  // Sort
  const sortMap = {
    relevance:  [{ _score: { order: 'desc' } }],
    price_asc:  [{ price: { order: 'asc' } }],
    price_desc: [{ price: { order: 'desc' } }],
    rating:     [{ rating: { order: 'desc' } }, { review_count: { order: 'desc' } }],
    newest:     [{ released: { order: 'desc' } }],
  };

  const res = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: { bool: { must, filter } },
    sort: sortMap[sortBy] || sortMap.relevance,
    from: (page - 1) * size,
    size,
    _source: ['sku', 'name', 'brand', 'category', 'price', 'old_price', 'rating', 'review_count', 'stock'],
    highlight: {
      fields: { name: { pre_tags: ['>>'], post_tags: ['<<'] } }
    },
    // Lấy agg cho sidebar
    aggs: {
      by_category: { terms: { field: 'category', size: 10 } },
      by_brand:    { terms: { field: 'brand', size: 10 } },
      price_range: {
        range: {
          field: 'price',
          ranges: [
            { key: 'Dưới 5tr',      to:   5000000 },
            { key: '5tr - 15tr',    from:  5000000, to: 15000000 },
            { key: '15tr - 30tr',   from: 15000000, to: 30000000 },
            { key: 'Trên 30tr',     from: 30000000 }
          ]
        }
      },
      avg_price: { avg: { field: 'price' } }
    }
  });

  return res.data;
}

// ─────────────────────────────────────────────────
// USE CASE 2: Autocomplete / Prefix suggest
// ─────────────────────────────────────────────────
async function autocomplete(prefix) {
  const res = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: {
      bool: {
        should: [
          { prefix: { name: prefix.toLowerCase() } },
          { match:  { name: { query: prefix, operator: 'and' } } }
        ]
      }
    },
    size: 5,
    _source: ['name', 'category', 'price']
  });
  return (res.data.hits?.hits || []).map(h => h._source);
}

// ─────────────────────────────────────────────────
// USE CASE 3: Dashboard thống kê
// ─────────────────────────────────────────────────
async function dashboardStats() {
  const res = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    size: 0,
    aggs: {
      total_value:      { sum: { field: 'price' } },
      avg_rating:       { avg: { field: 'rating' } },
      by_category:      { terms: { field: 'category', size: 10 } },
      by_brand:         { terms: { field: 'brand', size: 10 } },
      top_rated: {
        range: {
          field: 'rating',
          ranges: [
            { key: 'Dưới 4', to: 4.0 },
            { key: '4 - 4.5', from: 4.0, to: 4.5 },
            { key: '4.5 - 5', from: 4.5 }
          ]
        }
      }
    }
  });
  return res.data.aggregations;
}

// ─────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────
async function run() {
  console.log('='.repeat(60));
  console.log('BÀI 8: THỰC TẾ - E-Commerce Product Search');
  console.log('='.repeat(60));

  await setup();

  // Test 1: Search bar
  console.log('\n════ TEST 1: Search "iphone" ════');
  const r1 = await productSearch({ keyword: 'iphone', sortBy: 'price_asc' });
  console.log(`Tìm thấy: ${r1.hits.total?.value} sản phẩm`);
  (r1.hits.hits || []).forEach(h => {
    const s = h._source;
    const hl = h.highlight?.name?.[0] || s.name;
    console.log(`  • ${hl} | ${s.price.toLocaleString()}đ | ⭐ ${s.rating}`);
  });

  // Test 2: Filter by category + brand + price
  console.log('\n════ TEST 2: Laptop, Dell/Asus, 35-45 triệu ════');
  const r2 = await productSearch({
    category: 'laptop',
    minPrice: 35000000,
    maxPrice: 45000000,
    sortBy: 'rating'
  });
  console.log(`Tìm thấy: ${r2.hits.total?.value} sản phẩm`);
  (r2.hits.hits || []).forEach(h => {
    const s = h._source;
    console.log(`  • [${s.brand}] ${s.name} | ${s.price.toLocaleString()}đ | ⭐ ${s.rating}`);
  });

  // Test 3: Faceted aggregation (sidebar filters)
  console.log('\n════ TEST 3: Aggregation Sidebar ════');
  const r3 = await productSearch({ sortBy: 'relevance', size: 1 });
  console.log('  Danh mục:');
  (r3.aggregations?.by_category?.buckets || []).forEach(b =>
    console.log(`    • ${b.key}: ${b.doc_count} sản phẩm`)
  );
  console.log('  Khoảng giá:');
  (r3.aggregations?.price_range?.buckets || []).forEach(b =>
    console.log(`    • ${b.key}: ${b.doc_count} sản phẩm`)
  );
  console.log(`  Giá trung bình: ${r3.aggregations?.avg_price?.value?.toLocaleString()}đ`);

  // Test 4: Autocomplete
  console.log('\n════ TEST 4: Autocomplete "galaxy" ════');
  const suggestions = await autocomplete('galaxy');
  suggestions.forEach(s => console.log(`  💡 ${s.name} | ${s.price.toLocaleString()}đ`));

  // Test 5: Dashboard stats
  console.log('\n════ TEST 5: Dashboard Statistics ════');
  const stats = await dashboardStats();
  console.log(`  Tổng giá trị catalog: ${stats?.total_value?.value?.toLocaleString()}đ`);
  console.log(`  Rating trung bình:    ${stats?.avg_rating?.value?.toFixed(2)}`);
  console.log('  Top rated:');
  (stats?.top_rated?.buckets || []).forEach(b =>
    console.log(`    • ${b.key}: ${b.doc_count} sản phẩm`)
  );

  console.log('\n✅ BÀI 8 - ỨNG DỤNG THỰC TẾ HOÀN THÀNH');
}

run().catch(console.error);
