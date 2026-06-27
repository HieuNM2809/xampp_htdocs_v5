# Ví dụ Node.js với Apache Cassandra

Bộ ví dụ Node.js (ESM) dùng driver chính thức [`cassandra-driver`](https://github.com/datastax/nodejs-driver) của DataStax, đi từ cơ bản đến nâng cao. Mỗi file là một bước độc lập, **nên chạy theo thứ tự** (`01` → `06`).

> Tài liệu lý thuyết về Cassandra nằm ở [`../README.md`](../README.md).

## Yêu cầu

- **Node.js** 18+ (cần hỗ trợ ESM + top-level features). Kiểm tra: `node -v`
- **Docker** + Docker Compose (để chạy Cassandra cục bộ)

## 1. Khởi động Cassandra

```bash
cd 140_apache_cassandra/nodejs

npm install          # cài cassandra-driver
npm run docker:up    # bật container Cassandra (cassandra:5.0)
```

> ⚠️ **Quan trọng:** Cassandra cần **~30–60 giây** để node sẵn sàng nhận kết nối (kể cả khi container đã "up"). Theo dõi log đến khi thấy *"Startup complete"* / *"Created default superuser"*:
>
> ```bash
> npm run docker:logs        # Ctrl+C để thoát khi đã sẵn sàng
> ```
>
> Nếu chạy script quá sớm sẽ gặp lỗi `NoHostAvailableError` — chỉ cần đợi thêm rồi chạy lại.

## 2. Chạy các ví dụ theo thứ tự

| Lệnh | File | Nội dung |
|---|---|---|
| `npm run 01:connect`     | `01_connect.js`          | Kết nối cluster, in phiên bản & node, **tạo keyspace** |
| `npm run 02:crud`        | `02_crud.js`             | CRUD cơ bản với prepared statement (CREATE/INSERT/SELECT/UPDATE/DELETE) |
| `npm run 03:modeling`    | `03_data_modeling.js`    | Thiết kế theo truy vấn: clustering order, composite partition key, range query |
| `npm run 04:collections` | `04_collections_ttl.js`  | Collection types (set/list/map) + TTL |
| `npm run 05:batch`       | `05_batch_counter_lwt.js`| Batch nguyên tử, counter, lightweight transaction (LWT) |
| `npm run 06:paging`      | `06_consistency_paging.js`| Consistency level + phân trang (fetchSize + pageState) |

Ví dụ:

```bash
npm run 01:connect
npm run 02:crud
# ... lần lượt tới 06
```

> Bước `01` tạo keyspace `shop_demo`. Các bước sau đều gọi `setupKeyspace()` (idempotent, `CREATE KEYSPACE IF NOT EXISTS`) nên vẫn chạy được độc lập, nhưng đọc theo thứ tự sẽ dễ hiểu nhất.

## 3. Mở cqlsh để kiểm tra trực tiếp (tùy chọn)

```bash
npm run cqlsh
```

```sql
USE shop_demo;
DESCRIBE TABLES;
SELECT * FROM users;
```

## 4. Dọn dẹp

```bash
npm run docker:down        # dừng & xóa container (giữ volume dữ liệu)
docker compose down -v     # xóa luôn volume nếu muốn sạch hoàn toàn
```

## Cấu trúc & ghi chú kỹ thuật

```
nodejs/
├── client.js                 # Kết nối dùng chung: createClient(), setupKeyspace(), KEYSPACE
├── 01_connect.js … 06_*.js   # 6 bước ví dụ
├── docker-compose.yml        # Cassandra 5.0 single-node
└── package.json
```

- **Tái sử dụng 1 `Client`**: driver đã quản lý connection pool cho cả cluster — không tạo client mới cho mỗi query. Các ví dụ luôn `await client.shutdown()` trong khối `finally` để thoát process gọn gàng.
- **Luôn dùng `{ prepare: true }`**: prepared statement giúp driver tự suy ra kiểu cột (truyền thẳng `Uuid`, `Date`, số JS...), tăng tốc và chống injection.
- **Cấu hình qua biến môi trường** (nếu Cassandra không chạy ở `127.0.0.1:9042`):

  ```bash
  CASSANDRA_CONTACT_POINTS=10.0.0.5:9042 CASSANDRA_LOCAL_DC=datacenter1 npm run 01:connect
  ```

- **`localDataCenter`** mặc định là `datacenter1`, khớp với `CASSANDRA_DC` trong `docker-compose.yml`. Nếu đổi DC trong compose thì sửa cả ở `client.js` (hoặc đặt biến môi trường).
