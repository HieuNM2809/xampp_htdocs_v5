/**
 * BÀI 6: BULK OPERATIONS (Thao tác hàng loạt)
 * =============================================
 * Bulk API cho phép thực hiện nhiều thao tác trong 1 request.
 * Quan trọng để import data lớn hiệu quả.
 *
 * ZincSearch bulk format: NDJSON (Newline Delimited JSON)
 *   { action_meta }
 *   { document_data }
 *   { action_meta }
 *   { document_data }
 *   ...
 *
 * Endpoint:
 *   POST /api/_bulk          → Global bulk (cần chỉ _index trong meta)
 *   POST /api/:index/_bulk   → Bulk cho index cụ thể
 */

const zinc = require('../zinc_client');

const INDEX_NAME = 'demo_orders';

// Utility: tạo NDJSON string từ array actions
function toNDJSON(lines) {
  return lines.map(l => JSON.stringify(l)).join('\n') + '\n';
}

// Sinh data ngẫu nhiên
function generateOrders(count) {
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const cities = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  const orders = [];
  for (let i = 1; i <= count; i++) {
    const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    orders.push({
      order_id: `ORD-${String(i).padStart(5, '0')}`,
      customer_name: `Khách hàng ${i}`,
      total_amount: Math.floor(Math.random() * 50000000) + 500000,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      items_count: Math.floor(Math.random() * 10) + 1,
      created_at: date.toISOString().split('T')[0]
    });
  }
  return orders;
}

async function run() {
  console.log('='.repeat(60));
  console.log('BÀI 6: BULK OPERATIONS - ZincSearch');
  console.log('='.repeat(60));

  // ─────────────────────────────────────────────────
  // 1. BULK INDEX - Nhập nhiều document cùng lúc
  // Nhanh hơn nhiều so với gọi từng request riêng lẻ
  // ─────────────────────────────────────────────────
  console.log('\n--- 1. Bulk Index (nhập 100 đơn hàng) ---');
  const orders = generateOrders(100);
  
  // Mỗi document cần 2 dòng: meta + data
  const bulkLines = orders.flatMap(order => [
    { index: { _index: INDEX_NAME, _id: order.order_id } },
    order
  ]);

  const startTime = Date.now();
  const bulkRes = await zinc.post('/api/_bulk',
    toNDJSON(bulkLines),
    { headers: { 'Content-Type': 'application/x-ndjson' } }
  );
  const elapsed = Date.now() - startTime;
  console.log(`✅ Bulk insert ${orders.length} docs trong ${elapsed}ms`);
  console.log(`   Kết quả:`, bulkRes.data);

  // ─────────────────────────────────────────────────
  // 2. SO SÁNH TỐC ĐỘ: Sequential vs Bulk
  // ─────────────────────────────────────────────────
  console.log('\n--- 2. So sánh tốc độ: 10 docs sequential vs bulk ---');
  const testOrders = generateOrders(10);

  // Sequential (tuần tự)
  const seqStart = Date.now();
  for (const order of testOrders) {
    await zinc.put(`/api/${INDEX_NAME}/_doc/seq-${order.order_id}`, order);
  }
  const seqTime = Date.now() - seqStart;

  // Bulk
  const blkLines = testOrders.flatMap(o => [
    { index: { _index: INDEX_NAME, _id: `blk-${o.order_id}` } },
    o
  ]);
  const blkStart = Date.now();
  await zinc.post('/api/_bulk', toNDJSON(blkLines),
    { headers: { 'Content-Type': 'application/x-ndjson' } }
  );
  const blkTime = Date.now() - blkStart;

  console.log(`  Sequential (10 requests): ${seqTime}ms`);
  console.log(`  Bulk (1 request):         ${blkTime}ms`);
  console.log(`  🚀 Bulk nhanh hơn ~${Math.round(seqTime / blkTime)}x`);

  // ─────────────────────────────────────────────────
  // 3. BULK UPDATE - Cập nhật nhiều document
  // Dùng action "index" với _id để upsert (create or replace)
  // ─────────────────────────────────────────────────
  console.log('\n--- 3. Bulk Upsert (update 5 orders) ---');
  const updateLines = orders.slice(0, 5).flatMap(o => [
    { index: { _index: INDEX_NAME, _id: o.order_id } },
    { ...o, status: 'delivered', updated_at: new Date().toISOString() }
  ]);
  await zinc.post('/api/_bulk', toNDJSON(updateLines),
    { headers: { 'Content-Type': 'application/x-ndjson' } }
  );
  console.log('✅ Đã cập nhật 5 orders → status: delivered');

  // ─────────────────────────────────────────────────
  // 4. BULK DELETE - Xóa nhiều document
  // ─────────────────────────────────────────────────
  console.log('\n--- 4. Bulk Delete (xóa 3 orders) ---');
  const deleteLines = orders.slice(0, 3).flatMap(o => [
    { delete: { _index: INDEX_NAME, _id: o.order_id } }
    // delete action không có dòng data theo sau
  ]);
  const delRes = await zinc.post('/api/_bulk', toNDJSON(deleteLines),
    { headers: { 'Content-Type': 'application/x-ndjson' } }
  );
  console.log('✅ Đã xóa 3 orders:', delRes.data);

  // ─────────────────────────────────────────────────
  // 5. CHUNK STRATEGY - Xử lý data lớn theo batch
  // Khuyến nghị: mỗi batch 1000-5000 docs
  // ─────────────────────────────────────────────────
  console.log('\n--- 5. Chunk Strategy (import theo batch) ---');
  const BATCH_SIZE = 25;
  const bigDataset = generateOrders(50);
  let totalImported = 0;

  for (let i = 0; i < bigDataset.length; i += BATCH_SIZE) {
    const chunk = bigDataset.slice(i, i + BATCH_SIZE);
    const chunkLines = chunk.flatMap(o => [
      { index: { _index: INDEX_NAME } },
      o
    ]);
    await zinc.post('/api/_bulk', toNDJSON(chunkLines),
      { headers: { 'Content-Type': 'application/x-ndjson' } }
    );
    totalImported += chunk.length;
    console.log(`  Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: import ${chunk.length} docs (tổng: ${totalImported})`);
  }
  console.log(`✅ Import xong ${totalImported} docs theo batch`);

  console.log('\n✅ BÀI 6 HOÀN THÀNH');
}

run().catch(console.error);
