/**
 * ============================================================
 * BƯỚC 04: COLLECTION TYPES (set / list / map) + TTL
 * ============================================================
 * - set<text>      -> mảng JS, không trùng, không thứ tự
 * - list<text>     -> mảng JS, có thứ tự, cho phép trùng
 * - map<text,text> -> object JS (hoặc Map)
 * - TTL: dữ liệu tự hết hạn sau N giây (lý tưởng cho session, OTP, cache)
 *
 * Chạy: npm run 04:collections
 * ============================================================
 */
import { createClient, setupKeyspace, cassandra } from './client.js';
const { types } = cassandra;

async function main() {
  await setupKeyspace();
  const client = createClient();

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id    uuid PRIMARY KEY,
        emails     set<text>,
        hobbies    list<text>,
        attributes map<text, text>
      )
    `);
    console.log('🏗️  Bảng "user_profiles" sẵn sàng');

    const userId = types.Uuid.random();

    // INSERT kèm collection
    await client.execute(
      `INSERT INTO user_profiles (user_id, emails, hobbies, attributes)
       VALUES (?, ?, ?, ?)`,
      [userId, ['hieu@example.com'], ['đọc sách'], { city: 'Hà Nội' }],
      { prepare: true }
    );
    console.log('\n➕ Tạo profile ban đầu');

    // Thêm phần tử: cú pháp "cột = cột + ?"
    await client.execute('UPDATE user_profiles SET emails = emails + ? WHERE user_id = ?', [['work@example.com'], userId], { prepare: true });
    await client.execute('UPDATE user_profiles SET hobbies = hobbies + ? WHERE user_id = ?', [['code'], userId], { prepare: true });
    await client.execute('UPDATE user_profiles SET attributes = attributes + ? WHERE user_id = ?', [{ job: 'dev' }, userId], { prepare: true });
    console.log('✏️  Thêm phần tử vào emails / hobbies / attributes');

    // Xóa 1 phần tử khỏi set: "cột = cột - ?"
    await client.execute('UPDATE user_profiles SET emails = emails - ? WHERE user_id = ?', [['hieu@example.com'], userId], { prepare: true });

    const rs = await client.execute('SELECT * FROM user_profiles WHERE user_id = ?', [userId], { prepare: true });
    const p = rs.first();
    console.log('\n🔎 Profile sau cập nhật:');
    console.log('   emails    :', p['emails']);
    console.log('   hobbies   :', p['hobbies']);
    console.log('   attributes:', p['attributes']);

    // ===== TTL =====
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id    uuid PRIMARY KEY,
        session_token text
      )
    `);
    const sid = types.Uuid.random();
    // Dòng tự hết hạn sau 60 giây
    await client.execute(
      'INSERT INTO sessions (session_id, session_token) VALUES (?, ?) USING TTL 60',
      [sid, 'abc.token.xyz'],
      { prepare: true }
    );
    const ttlRs = await client.execute(
      'SELECT session_token, TTL(session_token) AS ttl FROM sessions WHERE session_id = ?',
      [sid],
      { prepare: true }
    );
    console.log('\n⏳ TTL demo:');
    console.log(`   token còn sống thêm ~${ttlRs.first()['ttl']} giây rồi tự xóa`);
  } finally {
    await client.shutdown();
  }
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
