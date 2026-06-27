/**
 * ============================================================
 * BƯỚC 06: CONSISTENCY LEVEL + PHÂN TRANG (paging)
 * ============================================================
 * - Consistency level: số replica phải phản hồi thì lệnh mới thành công.
 *   Truyền qua option { consistency: types.consistencies.xxx }.
 *   (Cluster 1 node RF=1 nên dùng ONE; cluster thật nên dùng LOCAL_QUORUM.)
 * - Paging: dùng fetchSize + pageState để duyệt partition lớn theo từng trang,
 *   tránh kéo toàn bộ dữ liệu về 1 lần.
 *
 * Chạy: npm run 06:paging
 * ============================================================
 */
import { createClient, setupKeyspace, cassandra } from './client.js';
const { types } = cassandra;

async function main() {
  await setupKeyspace();
  const client = createClient();

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS products (
        category   text,
        product_id uuid,
        name       text,
        PRIMARY KEY (category, product_id)
      )
    `);

    // Chèn 12 sản phẩm cùng partition "phone", ghi với consistency = ONE
    const category = 'phone';
    for (let i = 1; i <= 12; i++) {
      await client.execute(
        'INSERT INTO products (category, product_id, name) VALUES (?, ?, ?)',
        [category, types.Uuid.random(), `Sản phẩm ${i}`],
        { prepare: true, consistency: types.consistencies.one }
      );
    }
    console.log('➕ Đã chèn 12 sản phẩm vào partition "phone"');

    // ===== PHÂN TRANG thủ công bằng fetchSize + pageState =====
    console.log('\n📄 Phân trang (mỗi trang 5 dòng):');
    let pageState;
    let page = 0;
    do {
      const rs = await client.execute(
        'SELECT name FROM products WHERE category = ?',
        [category],
        { prepare: true, fetchSize: 5, pageState, consistency: types.consistencies.localOne }
      );
      page++;
      console.log(`   --- Trang ${page} (${rs.rowLength} dòng) ---`);
      rs.rows.forEach((r) => console.log(`       ${r['name']}`));
      pageState = rs.pageState; // chuỗi token để lấy trang kế; undefined => hết dữ liệu
    } while (pageState);

    console.log('\n💡 Nhất quán mạnh: RF=3 + ghi QUORUM + đọc QUORUM => luôn đọc dữ liệu mới nhất (R + W > RF).');
  } finally {
    await client.shutdown();
  }
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
