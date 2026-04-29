/**
 * BÀI 2: CRUD DOCUMENT
 * =====================
 * Thao tác CRUD (Create, Read, Update, Delete) với document.
 * Trong ZincSearch, "document" tương đương "row" trong SQL.
 *
 * API path:
 *   Native API:          /api/:index/_doc
 *   ES-compatible API:   /es/:index/_doc
 */

const zinc = require('../zinc_client');

const INDEX_NAME = 'demo_products';

// Helper: format date → 'yyyy-MM-dd HH:mm:ss'
// ⚠️ ZincSearch 'time'/'date' field chấp nhận format ISO 8601 hoặc 'yyyy-MM-dd HH:mm:ss'
// Nếu bị lỗi parse, hãy xóa index cũ rồi chạy lại (vì mapping đã bị lưu từ lần trước)
function formatDate(d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Xóa index cũ và tạo lại để mapping sạch
async function resetIndex() {
  try { await zinc.delete(`/api/index/${INDEX_NAME}`); } catch {}
  await zinc.put('/api/index', {
    name: INDEX_NAME,
    storage_type: 'disk',
    mappings: {
      properties: {
        name:       { type: 'text' },
        price:      { type: 'numeric' },
        category:   { type: 'keyword' },
        brand:      { type: 'keyword' },
        in_stock:   { type: 'bool' },
        rating:     { type: 'numeric' },
        // created_at dùng type 'keyword' → lưu string, không parse date
        created_at: { type: 'keyword' }
      }
    }
  });
  console.log('✅ Reset index xong');
}

async function run() {
  console.log('='.repeat(60));
  console.log('BÀI 2: CRUD DOCUMENT - ZincSearch');
  console.log('='.repeat(60));

  // ─────────────────────────────────────────────────
  // 1. TẠO DOCUMENT (Create / Index)
  // POST /api/:index/_doc         → Auto generate ID
  // POST /api/:index/_doc/:id     → Dùng ID chỉ định
  // ─────────────────────────────────────────────────
  console.log('\n--- 1. Tạo Document (Auto ID) ---');
  await resetIndex();  // reset mapping sạch trước mỗi lần chạy demo
  const createRes = await zinc.post(`/api/${INDEX_NAME}/_doc`, {
    name: 'iPhone 15 Pro',
    price: 28990000,
    category: 'smartphone',
    brand: 'Apple',
    in_stock: true,
    rating: 4.8,
    tags: ['flagship', 'ios', '5g'],
    created_at: formatDate()  // → '2026-03-28 21:49:00' theo format mapping
  });
  console.log('✅ Tạo thành công, ID:', createRes.data.id);
  const autoDocId = createRes.data.id;

  console.log('\n--- 1b. Tạo Document (ID chỉ định) ---');
  const createWithIdRes = await zinc.put(`/api/${INDEX_NAME}/_doc/product-001`, {
    name: 'Samsung Galaxy S24',
    price: 22990000,
    category: 'smartphone',
    brand: 'Samsung',
    in_stock: true,
    rating: 4.6,
    tags: ['flagship', 'android', '5g'],
    created_at: formatDate()
  });
  console.log('✅ Tạo với ID tùy chỉnh:', createWithIdRes.data);

  // ─────────────────────────────────────────────────
  // 2. ĐỌC DOCUMENT (Read / Get by ID)
  //
  // ⚠️  ZincSearch v0.4.x không hỗ trợ ổn định GET /es/:idx/_doc/:id
  //    → Dùng term query trên _id để đọc chính xác theo ID
  //    → Cần đợi ~500ms để index refresh sau khi write
  // ─────────────────────────────────────────────────
  console.log('\n--- 2. Đọc Document theo ID ---');
  await new Promise(r => setTimeout(r, 500)); // chờ index refresh
  const getRes = await zinc.post(`/es/${INDEX_NAME}/_search`, {
    query: { term: { _id: 'product-001' } },
    size: 1
  });
  const found = getRes.data.hits?.hits?.[0];
  if (found) {
    console.log('✅ Document tìm thấy:');
    console.log('   ID:', found._id);
    console.log('   Data:', JSON.stringify(found._source, null, 2));
  } else {
    console.log('ℹ️  Chưa tìm thấy (index chưa refresh)');
  }


  // ─────────────────────────────────────────────────
  // 3. CẬP NHẬT DOCUMENT (Update)
  // PUT /api/:index/_doc/:id  → Full replace (upsert)
  //
  // ZincSearch KHÔNG hỗ trợ partial update (_update),
  // phải gửi toàn bộ document
  //
  // So với Elasticsearch:
  //   ES có POST /:index/_update/:id { "doc": { partial fields } }
  //   ZincSearch chỉ hỗ trợ full replace qua PUT
  // ─────────────────────────────────────────────────
  console.log('\n--- 3. Cập nhật Document (Full Replace) ---');
  const updateRes = await zinc.put(`/api/${INDEX_NAME}/_doc/product-001`, {
    name: 'Samsung Galaxy S24 Ultra',
    price: 31990000,               // Giá mới
    category: 'smartphone',
    brand: 'Samsung',
    in_stock: false,               // Hết hàng
    rating: 4.7,
    tags: ['flagship', 'android', '5g', 'ai'],
    updated_at: formatDate()
  });
  console.log('✅ Cập nhật thành công:', updateRes.data);

  // ─────────────────────────────────────────────────
  // 4. XÓA DOCUMENT (Delete)
  // DELETE /api/:index/_doc/:id
  // ─────────────────────────────────────────────────
  console.log('\n--- 4. Xóa Document ---');
  if (autoDocId) {
    const deleteRes = await zinc.delete(`/api/${INDEX_NAME}/_doc/${autoDocId}`);
    console.log('✅ Đã xóa document ID:', autoDocId, deleteRes.data);
  }

  console.log('\n✅ BÀI 2 HOÀN THÀNH');

  /*
   * ═══════════════════════════════════════════════
   * SO SÁNH ZINCSEARCH vs ELASTICSEARCH (CRUD)
   * ═══════════════════════════════════════════════
   *
   * | Thao tác     | ZincSearch                         | Elasticsearch                    |
   * |--------------|-------------------------------------|----------------------------------|
   * | Create       | POST /api/:idx/_doc                | POST /:idx/_doc                  |
   * | Create w/ ID | PUT  /api/:idx/_doc/:id            | PUT  /:idx/_doc/:id              |
   * | Read by ID   | GET  /es/:idx/_doc/:id (ES compat) | GET  /:idx/_doc/:id              |
   * | Update full  | PUT  /api/:idx/_doc/:id            | PUT  /:idx/_doc/:id              |
   * | Update part  | ❌ Không hỗ trợ                    | POST /:idx/_update/:id           |
   * | Delete       | DELETE /api/:idx/_doc/:id          | DELETE /:idx/_doc/:id            |
   */
}

run().catch(console.error);
