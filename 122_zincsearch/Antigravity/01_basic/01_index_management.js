/**
 * BÀI 1: QUẢN LÝ INDEX (Index Management)
 * =========================================
 * ZincSearch gọi "index" là tương đương với "database table" trong SQL
 * hoặc "index" trong Elasticsearch.
 *
 * Các thao tác:
 * - Tạo index (Create)
 * - Liệt kê index (List)
 * - Lấy thông tin index (Get)
 * - Xóa index (Delete)
 */

const zinc = require('../zinc_client');

const INDEX_NAME = 'demo_products';

async function run() {
  console.log('='.repeat(60));
  console.log('BÀI 1: QUẢN LÝ INDEX - ZincSearch');
  console.log('='.repeat(60));

  // ─────────────────────────────────────────────────
  // 1. TẠO INDEX
  // Endpoint: PUT /api/index
  // ZincSearch cho phép tạo index với hoặc không có mapping
  // ─────────────────────────────────────────────────
  console.log('\n--- 1. Tạo Index ---');
  try {
    const createRes = await zinc.put('/api/index', {
      name: INDEX_NAME,
      storage_type: 'disk',       // 'disk' | 'memory' | 's3'
      shard_num: 1,
      mappings: {
        properties: {
          name: { type: 'text' },
          price: { type: 'numeric' },
          category: { type: 'keyword' },
          in_stock: { type: 'bool' },
          created_at: { type: 'time', format: 'yyyy-MM-dd HH:mm:ss', index: true }
        }
      }
    });
    console.log('✅ Tạo index thành công:', createRes.data);
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('ℹ️  Index đã tồn tại, tiếp tục...');
    }
  }

  // ─────────────────────────────────────────────────
  // 2. LIỆT KÊ TẤT CẢ INDEX
  // Endpoint: GET /api/index
  // ─────────────────────────────────────────────────
  console.log('\n--- 2. Liệt kê tất cả Index ---');
  const listRes = await zinc.get('/api/index');
  const indices = listRes.data.list || [];
  console.log(`✅ Tổng số index: ${indices.length}`);
  indices.forEach(idx => {
    console.log(`   - [${idx.name}] docs: ${idx.doc_num}, storage: ${idx.storage_type}`);
  });

  // ─────────────────────────────────────────────────
  // 3. LẤY THÔNG TIN MỘT INDEX
  // Endpoint: GET /api/index/:name  (hoặc list và filter)
  // ─────────────────────────────────────────────────
  console.log('\n--- 3. Lấy thông tin Index cụ thể ---');
  const found = indices.find(i => i.name === INDEX_NAME);
  if (found) {
    console.log('✅ Thông tin index:', JSON.stringify(found, null, 2));
  }

  // ─────────────────────────────────────────────────
  // SO SÁNH vs ELASTICSEARCH:
  // Elasticsearch: PUT /my_index { "mappings": { ... } }
  // ZincSearch:    PUT /api/index { "name": "...", "mappings": { ... } }
  //
  // Khác biệt chính:
  // - ZincSearch: schema-less theo mặc định (tự suy mapping từ dữ liệu)
  // - Elasticsearch: cần khai báo mapping rõ ràng, không tự thay đổi type
  // ─────────────────────────────────────────────────

  // ─────────────────────────────────────────────────
  // 4. XÓA INDEX (comment lại để không mất data)
  // Endpoint: DELETE /api/index/:name
  // ─────────────────────────────────────────────────
  // console.log('\n--- 4. Xóa Index ---');
  // const delRes = await zinc.delete(`/api/index/${INDEX_NAME}`);
  // console.log('✅ Xóa index:', delRes.data);

  console.log('\n✅ BÀI 1 HOÀN THÀNH');
}

run().catch(console.error);
