/**
 * ============================================================
 * SHARED CLIENT — Kết nối Cassandra dùng chung cho mọi bước
 * ============================================================
 * - `cassandra-driver` là driver chính thức của DataStax cho Node.js
 * - Một `Client` đã quản lý sẵn connection pool tới cả cluster,
 *   nên TÁI SỬ DỤNG 1 client cho toàn ứng dụng (đừng tạo mới mỗi query).
 * ============================================================
 */
import cassandra from 'cassandra-driver';

// Cho phép override qua biến môi trường (mặc định: Cassandra chạy local qua docker)
const CONTACT_POINTS = (process.env.CASSANDRA_CONTACT_POINTS || '127.0.0.1:9042').split(',');
const LOCAL_DC = process.env.CASSANDRA_LOCAL_DC || 'datacenter1';

export const KEYSPACE = 'shop_demo';

/**
 * Tạo client ĐÃ gắn sẵn keyspace -> dùng cho mọi thao tác CRUD.
 */
export function createClient() {
  return new cassandra.Client({
    contactPoints: CONTACT_POINTS,
    localDataCenter: LOCAL_DC,
    keyspace: KEYSPACE,
  });
}

/**
 * Tạo keyspace nếu chưa có (idempotent).
 * Phải dùng 1 kết nối tạm KHÔNG gắn keyspace, vì lúc này keyspace có thể chưa tồn tại.
 */
export async function setupKeyspace() {
  const admin = new cassandra.Client({
    contactPoints: CONTACT_POINTS,
    localDataCenter: LOCAL_DC,
  });
  await admin.execute(`
    CREATE KEYSPACE IF NOT EXISTS ${KEYSPACE}
    WITH replication = { 'class': 'SimpleStrategy', 'replication_factor': 1 }
  `);
  await admin.shutdown();
  console.log(`✅ Keyspace "${KEYSPACE}" sẵn sàng`);
}

// Re-export để các bước dùng types (Uuid, TimeUuid, consistencies...)
export { cassandra };
