/**
 * ============================================================
 * BƯỚC 05: BATCH + COUNTER + LIGHTWEIGHT TRANSACTION (LWT)
 * ============================================================
 * - BATCH : gom nhiều lệnh ghi thành 1 đơn vị NGUYÊN TỬ (không phải để tăng tốc!)
 *           Hợp lý nhất khi đồng bộ vài bảng denormalized chứa cùng dữ liệu.
 * - COUNTER: cột đếm, phải nằm ở bảng riêng; trả về kiểu Long.
 * - LWT   : thao tác có điều kiện (IF NOT EXISTS / IF col = ?) dùng Paxos -> CHẬM, đừng lạm dụng.
 *
 * Chạy: npm run 05:batch
 * ============================================================
 */
import { createClient, setupKeyspace, cassandra } from './client.js';
const { types } = cassandra;

async function main() {
  await setupKeyspace();
  const client = createClient();

  try {
    // ===== BATCH: ghi cùng tin nhắn vào 2 bảng (2 chiều truy vấn) =====
    await client.execute(`CREATE TABLE IF NOT EXISTS messages_by_user (user_id uuid, message_id timeuuid, content text, PRIMARY KEY (user_id, message_id))`);
    await client.execute(`CREATE TABLE IF NOT EXISTS messages_by_room (room_id uuid, message_id timeuuid, content text, PRIMARY KEY (room_id, message_id))`);

    const userId = types.Uuid.random();
    const roomId = types.Uuid.random();
    const msgId = types.TimeUuid.now();
    const content = 'Xin chào cả nhà!';

    await client.batch(
      [
        { query: 'INSERT INTO messages_by_user (user_id, message_id, content) VALUES (?, ?, ?)', params: [userId, msgId, content] },
        { query: 'INSERT INTO messages_by_room (room_id, message_id, content) VALUES (?, ?, ?)', params: [roomId, msgId, content] },
      ],
      { prepare: true }
    );
    console.log('📦 BATCH: đã ghi cùng tin nhắn vào 2 bảng (nguyên tử)');

    // ===== COUNTER =====
    await client.execute(`CREATE TABLE IF NOT EXISTS page_views (page_id text PRIMARY KEY, views counter)`);
    for (let i = 0; i < 3; i++) {
      await client.execute('UPDATE page_views SET views = views + 1 WHERE page_id = ?', ['home'], { prepare: true });
    }
    const cRs = await client.execute('SELECT views FROM page_views WHERE page_id = ?', ['home'], { prepare: true });
    // counter trả về kiểu Long -> .toString()
    console.log(`\n🔢 COUNTER: page "home" có ${cRs.first()['views'].toString()} lượt xem`);

    // ===== LWT (compare-and-set) =====
    await client.execute(`CREATE TABLE IF NOT EXISTS accounts (username text PRIMARY KEY, email text)`);

    const r1 = await client.execute(
      `INSERT INTO accounts (username, email) VALUES (?, ?) IF NOT EXISTS`,
      ['hieu', 'a@e.com'],
      { prepare: true }
    );
    console.log(`\n🔐 LWT INSERT IF NOT EXISTS lần 1 -> applied = ${r1.wasApplied()}`);

    const r2 = await client.execute(
      `INSERT INTO accounts (username, email) VALUES (?, ?) IF NOT EXISTS`,
      ['hieu', 'b@e.com'],
      { prepare: true }
    );
    console.log(`🔐 LWT INSERT IF NOT EXISTS lần 2 -> applied = ${r2.wasApplied()} (username đã tồn tại nên bị từ chối)`);
  } finally {
    await client.shutdown();
  }
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
