/**
 * ============================================================
 * BƯỚC 01: KẾT NỐI & TẠO KEYSPACE
 * ============================================================
 * Mục tiêu:
 *   - Kết nối tới cluster Cassandra
 *   - In thông tin phiên bản & các node phát hiện qua gossip
 *   - Tạo keyspace dùng cho các bước sau
 *
 * Chạy:    npm run 01:connect
 * Yêu cầu: Cassandra đang chạy (npm run docker:up) — đợi ~30-60s để node sẵn sàng
 * ============================================================
 */
import { cassandra, KEYSPACE, setupKeyspace } from './client.js';

async function main() {
  const client = new cassandra.Client({
    contactPoints: (process.env.CASSANDRA_CONTACT_POINTS || '127.0.0.1:9042').split(','),
    localDataCenter: process.env.CASSANDRA_LOCAL_DC || 'datacenter1',
  });

  try {
    console.log('🔌 Đang kết nối tới Cassandra...');
    await client.connect();
    console.log('✅ Đã kết nối!');

    // Các node đã phát hiện qua gossip (masterless => mọi node ngang hàng)
    console.log(`\n📡 Các host trong cluster (${client.hosts.length}):`);
    client.hosts.forEach((h) =>
      console.log(`   - ${h.address}  | datacenter: ${h.datacenter} | rack: ${h.rack}`)
    );

    // Truy vấn bảng hệ thống để lấy phiên bản
    const rs = await client.execute(
      'SELECT cluster_name, release_version, cql_version FROM system.local'
    );
    const row = rs.first();
    console.log('\n🗄️  Thông tin cluster:');
    console.log(`   - cluster_name  : ${row['cluster_name']}`);
    console.log(`   - Cassandra ver : ${row['release_version']}`);
    console.log(`   - CQL version   : ${row['cql_version']}`);

    // Tạo keyspace
    console.log('\n🏗️  Tạo keyspace...');
    await setupKeyspace();

    // Kiểm tra keyspace đã tồn tại (keyspace_name là partition key nên WHERE chạy trực tiếp)
    const ks = await client.execute(
      'SELECT keyspace_name FROM system_schema.keyspaces WHERE keyspace_name = ?',
      [KEYSPACE]
    );
    console.log(`🔎 Keyspace "${KEYSPACE}" tồn tại: ${ks.rowLength > 0 ? 'CÓ ✅' : 'KHÔNG ❌'}`);
  } finally {
    await client.shutdown();
    console.log('\n👋 Đã đóng kết nối.');
  }
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
