/**
 * ============================================================
 * BƯỚC 02: CRUD CƠ BẢN (CREATE / INSERT / SELECT / UPDATE / DELETE)
 * ============================================================
 * Điểm nhấn:
 *   - Luôn dùng PREPARED STATEMENT ({ prepare: true }) + tham số "?"
 *     -> an toàn (chống injection), nhanh (cache query plan), tự suy kiểu cột
 *   - INSERT/UPDATE trong Cassandra đều là UPSERT (không có lỗi "duplicate key")
 *
 * Chạy: npm run 02:crud
 * ============================================================
 */
import { createClient, setupKeyspace, cassandra } from './client.js';
const { types } = cassandra;

async function main() {
  await setupKeyspace();
  const client = createClient();

  try {
    // --- CREATE TABLE ---
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id    uuid PRIMARY KEY,
        username   text,
        email      text,
        age        int,
        created_at timestamp
      )
    `);
    console.log('🏗️  Bảng "users" sẵn sàng');

    // --- INSERT ---
    const userId = types.Uuid.random();
    await client.execute(
      `INSERT INTO users (user_id, username, email, age, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'hieunm', 'hieu@example.com', 30, new Date()],
      { prepare: true }
    );
    console.log(`\n➕ INSERT user_id = ${userId}`);

    // --- SELECT theo partition key (truy vấn hiệu quả nhất) ---
    let rs = await client.execute(
      'SELECT * FROM users WHERE user_id = ?',
      [userId],
      { prepare: true }
    );
    console.log('\n🔎 SELECT 1 dòng:');
    console.log('   ', rs.first());

    // --- UPDATE (cũng là upsert) ---
    await client.execute(
      'UPDATE users SET email = ?, age = ? WHERE user_id = ?',
      ['hieu.new@example.com', 31, userId],
      { prepare: true }
    );
    rs = await client.execute(
      'SELECT username, email, age FROM users WHERE user_id = ?',
      [userId],
      { prepare: true }
    );
    console.log('\n✏️  UPDATE -> sau cập nhật:', rs.first());

    // --- DELETE 1 cột (đặt cột về null) ---
    await client.execute('DELETE email FROM users WHERE user_id = ?', [userId], { prepare: true });
    rs = await client.execute('SELECT username, email FROM users WHERE user_id = ?', [userId], { prepare: true });
    console.log('\n🗑️  DELETE cột email -> email giờ =', rs.first()['email']);

    // --- DELETE cả dòng ---
    await client.execute('DELETE FROM users WHERE user_id = ?', [userId], { prepare: true });
    rs = await client.execute('SELECT * FROM users WHERE user_id = ?', [userId], { prepare: true });
    console.log('🗑️  DELETE cả dòng -> số dòng còn lại:', rs.rowLength);
  } finally {
    await client.shutdown();
  }
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
