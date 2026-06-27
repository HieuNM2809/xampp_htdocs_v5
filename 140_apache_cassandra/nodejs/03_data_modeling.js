/**
 * ============================================================
 * BƯỚC 03: THIẾT KẾ THEO TRUY VẤN (query-driven modeling)
 * ============================================================
 * - Partition key  -> dữ liệu nằm ở NODE nào
 * - Clustering key -> THỨ TỰ sắp xếp các dòng BÊN TRONG 1 partition
 * - Thiết kế bảng để phục vụ đúng truy vấn cần dùng (chấp nhận denormalize)
 *
 * Demo 1: "lấy tin nhắn của 1 user, mới nhất trước"
 * Demo 2: composite partition key + time bucketing (chống hot partition)
 * Chạy:   npm run 03:modeling
 * ============================================================
 */
import { createClient, setupKeyspace, cassandra } from './client.js';
const { types } = cassandra;

async function main() {
  await setupKeyspace();
  const client = createClient();

  try {
    // ===== Demo 1: messages_by_user =====
    // partition theo user_id, sắp xếp theo message_id (TIMEUUID) GIẢM DẦN
    await client.execute(`
      CREATE TABLE IF NOT EXISTS messages_by_user (
        user_id    uuid,
        message_id timeuuid,
        content    text,
        PRIMARY KEY (user_id, message_id)
      ) WITH CLUSTERING ORDER BY (message_id DESC)
    `);
    console.log('🏗️  Bảng "messages_by_user" sẵn sàng');

    const userId = types.Uuid.random();
    for (let i = 1; i <= 5; i++) {
      await client.execute(
        'INSERT INTO messages_by_user (user_id, message_id, content) VALUES (?, ?, ?)',
        [userId, types.TimeUuid.now(), `Tin nhắn #${i}`],
        { prepare: true }
      );
    }
    console.log(`\n➕ Đã chèn 5 tin nhắn cho user ${userId}`);

    // 1 partition, đã sắp xếp sẵn theo clustering -> truy vấn rất nhanh
    const rs = await client.execute(
      `SELECT content, toTimestamp(message_id) AS sent_at
       FROM messages_by_user WHERE user_id = ? LIMIT 3`,
      [userId],
      { prepare: true }
    );
    console.log('\n🔎 3 tin nhắn MỚI NHẤT (clustering DESC):');
    rs.rows.forEach((r) => console.log(`   - [${r['sent_at'].toISOString()}] ${r['content']}`));

    // ===== Demo 2: sensor_data — composite partition key =====
    // partition = (sensor_id, date) -> "băm nhỏ" theo ngày để tránh partition khổng lồ
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        sensor_id    uuid,
        date         text,
        reading_time timestamp,
        value        double,
        PRIMARY KEY ((sensor_id, date), reading_time)
      ) WITH CLUSTERING ORDER BY (reading_time DESC)
    `);

    const sensorId = types.Uuid.random();
    const day = '2026-06-27';
    const base = new Date('2026-06-27T08:00:00Z');
    for (let i = 0; i < 4; i++) {
      await client.execute(
        'INSERT INTO sensor_data (sensor_id, date, reading_time, value) VALUES (?, ?, ?, ?)',
        [sensorId, day, new Date(base.getTime() + i * 3600_000), 20 + i],
        { prepare: true }
      );
    }
    console.log('\n🌡️  Đã ghi 4 mốc đo (partition = sensor_id + date)');

    // Range query theo clustering column reading_time
    const sensorRs = await client.execute(
      `SELECT reading_time, value FROM sensor_data
       WHERE sensor_id = ? AND date = ? AND reading_time >= ?`,
      [sensorId, day, new Date('2026-06-27T09:30:00Z')],
      { prepare: true }
    );
    console.log('🔎 Các mốc đo từ 09:30 trở đi:');
    sensorRs.rows.forEach((r) =>
      console.log(`   - ${r['reading_time'].toISOString()} = ${r['value']}`)
    );
  } finally {
    await client.shutdown();
  }
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
