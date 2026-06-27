# Apache Cassandra — Tài liệu tổng quan

Tài liệu này trình bày kiến thức nền tảng và thực hành về **Apache Cassandra**: kiến trúc phân tán, mô hình dữ liệu, các ví dụ CQL từ cơ bản đến nâng cao, và so sánh chi tiết với MySQL / PostgreSQL để biết khi nào nên chọn hệ quản trị nào.

> Phiên bản tham chiếu: Cassandra 4.x / 5.0 (CQL 3.x). Các ví dụ chạy được trong `cqlsh`.
>
> 💻 **Ví dụ Node.js chạy được** (driver `cassandra-driver` + Docker): xem thư mục [`nodejs/`](./nodejs/README.md).

## Mục lục

1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan-về-apache-cassandra)
2. [Ví dụ cơ bản (CQL)](#2-ví-dụ-cơ-bản--các-lệnh-cql-thông-dụng)
3. [Ví dụ nâng cao](#3-ví-dụ-nâng-cao)
4. [Replication và Cluster nhiều node](#4-replication-và-cluster-nhiều-node)
5. [So sánh Cassandra vs MySQL vs PostgreSQL](#5-so-sánh-cassandra-vs-mysql-vs-postgresql)
6. [Kết luận — khi nào chọn Cassandra](#6-kết-luận--khi-nào-nên-chọn-cassandra)

---

## 1. Giới thiệu tổng quan về Apache Cassandra

### 1.1. Cassandra là gì?

Apache Cassandra là một **cơ sở dữ liệu NoSQL phân tán** thuộc nhóm **wide-column store** (lưu trữ theo cột mở rộng). Cassandra được phát triển ban đầu tại Facebook (2008) để giải quyết bài toán Inbox Search, sau đó trở thành dự án mã nguồn mở của Apache. Thiết kế của Cassandra kết hợp hai ý tưởng kinh điển:

- **Amazon Dynamo** → mô hình phân tán không có node chủ (masterless), tính sẵn sàng cao, nhân bản (replication).
- **Google BigTable** → mô hình dữ liệu wide-column và cơ chế lưu trữ (commit log, memtable, SSTable).

**Đặc điểm cốt lõi:**

| Đặc điểm | Mô tả |
|---|---|
| **Phân tán, masterless** | Mọi node ngang hàng (peer-to-peer), không có node chủ → **không có điểm chết duy nhất** (no single point of failure). |
| **Tính sẵn sàng cao (HA)** | Dữ liệu được nhân bản trên nhiều node/data center; mất một vài node vẫn đọc/ghi bình thường. |
| **Mở rộng tuyến tính** | Thêm node → tăng dung lượng và throughput gần như tuyến tính, không downtime. |
| **Tunable consistency** | Có thể chỉnh mức nhất quán cho từng truy vấn (từ eventual đến strong). |
| **Tối ưu ghi (write-optimized)** | Ghi append-only vào commit log + memtable nên throughput ghi rất cao. |
| **Multi-datacenter** | Hỗ trợ nhân bản qua nhiều data center / vùng địa lý ngay từ thiết kế. |

### 1.2. Kiến trúc phân tán

#### Ring (vòng) và phân phối dữ liệu

Các node trong một cluster được tổ chức thành một **ring** logic. Mỗi dòng dữ liệu được định vị bằng **token** sinh ra từ **partition key** thông qua hàm băm (mặc định là `Murmur3Partitioner`). Token quyết định node nào "sở hữu" dữ liệu đó — đây chính là **consistent hashing**.

```
            Node A (token range 0)
          /                        \
   Node D                            Node B
   (range 3)                        (range 1)
          \                        /
            Node C (token range 2)

partition key --hash--> token --> node sở hữu --> + các replica kế tiếp trên ring
```

#### Replication (nhân bản)

- **Replication Factor (RF)**: số bản sao của mỗi dòng dữ liệu. RF=3 nghĩa là mỗi dòng tồn tại trên 3 node.
- **Replication Strategy**:
  - `SimpleStrategy` — chỉ dùng cho 1 data center, môi trường dev/test.
  - `NetworkTopologyStrategy` — dùng cho production, cho phép cấu hình RF riêng cho từng data center.

#### Giao tiếp giữa các node

- **Gossip protocol**: các node trao đổi trạng thái (sống/chết, vị trí) với nhau định kỳ, không cần node trung tâm điều phối.
- **Coordinator node**: node nào nhận request từ client sẽ đóng vai trò *coordinator*, chịu trách nhiệm định tuyến request tới các replica phù hợp và gom kết quả trả về.

#### Đường ghi (write path)

```
Client → Coordinator → Replica node:
   1. Ghi vào Commit Log (trên đĩa, đảm bảo bền vững/durability)
   2. Ghi vào Memtable (trong RAM)
   3. Khi Memtable đầy → flush xuống SSTable (file bất biến trên đĩa)
   4. Compaction: gộp/định kỳ dọn dẹp các SSTable
```

SSTable là **immutable** (bất biến). Cập nhật và xóa không sửa file cũ mà ghi bản mới + **tombstone** (đánh dấu xóa); compaction sẽ dọn dẹp về sau.

#### Đường đọc (read path)

Khi đọc, Cassandra kiểm tra theo thứ tự: Memtable → Row cache → **Bloom filter** (lọc nhanh SSTable nào *không* chứa key) → Partition key cache → Partition index → SSTable, rồi hợp nhất (merge) các phiên bản theo timestamp mới nhất.

#### Tunable Consistency (nhất quán điều chỉnh được)

Mỗi truy vấn chỉ định **Consistency Level (CL)** — số replica phải phản hồi thì lệnh mới coi là thành công:

| Consistency Level | Ý nghĩa |
|---|---|
| `ONE` / `LOCAL_ONE` | Chỉ cần 1 replica phản hồi (nhanh nhất, nhất quán yếu nhất). |
| `QUORUM` | Đa số replica: `floor(RF/2) + 1`. |
| `LOCAL_QUORUM` | Quorum trong phạm vi data center cục bộ (giảm độ trễ liên DC). |
| `EACH_QUORUM` | Quorum ở **mỗi** data center. |
| `ALL` | Tất cả replica phải phản hồi (nhất quán mạnh nhất, sẵn sàng thấp nhất). |

**Công thức nhất quán mạnh (strong consistency):**

```
R (read CL) + W (write CL) > RF
```

Ví dụ RF=3, ghi `QUORUM` (W=2) + đọc `QUORUM` (R=2) → 2 + 2 > 3 → luôn đọc được dữ liệu mới nhất.

### 1.3. Mô hình dữ liệu

Mô hình của Cassandra phân tầng như sau:

```
Keyspace  (≈ database/schema, chứa cấu hình replication)
  └── Table  (≈ bảng, còn gọi là column family)
        └── Partition  (nhóm dòng cùng partition key, là đơn vị phân phối + lưu trữ)
              └── Row  (sắp xếp bên trong partition theo clustering columns)
                    └── Column  (cặp tên–giá trị, kèm timestamp & TTL)
```

#### Các khái niệm khóa

- **Keyspace**: tương đương "database" trong RDBMS, là nơi khai báo chiến lược nhân bản (replication).
- **Table**: tập hợp các dòng có cùng schema.
- **Primary Key** = **Partition Key** + **Clustering Columns**:

  ```cql
  PRIMARY KEY ( (partition_key_cols...) , clustering_col1, clustering_col2 ... )
  ```

  | Thành phần | Vai trò |
  |---|---|
  | **Partition Key** | Quyết định dòng dữ liệu nằm ở **node nào** (qua hàm băm). Tất cả dòng cùng partition key nằm chung 1 partition, trên cùng (các) node. **Bắt buộc xuất hiện trong mệnh đề `WHERE`** của hầu hết truy vấn. |
  | **Clustering Key/Columns** | Quyết định **thứ tự sắp xếp** các dòng *bên trong* một partition (ASC/DESC). Cho phép truy vấn theo dải (range) và sắp xếp hiệu quả. |

- **Composite Partition Key**: partition key gồm nhiều cột, khai báo bằng cặp ngoặc lồng `((col1, col2), ...)` để tránh partition quá lớn ("hot partition").

> **Nguyên tắc vàng:** Cassandra **thiết kế bảng theo truy vấn** (query-driven), không chuẩn hóa (normalize) như RDBMS. Bạn xác định trước các câu truy vấn cần phục vụ, rồi tạo bảng phù hợp — thường **phi chuẩn hóa (denormalize)** và chấp nhận lặp dữ liệu.

### 1.4. Khả năng mở rộng (scalability)

- **Scale-out theo chiều ngang**: muốn tăng năng lực → thêm node vào cluster. Cassandra tự động rebalance token range, **không cần downtime**.
- **Tăng trưởng tuyến tính**: thực nghiệm cho thấy throughput tăng gần như tuyến tính theo số node.
- **Multi-datacenter / multi-region**: nhân bản qua nhiều DC để phục vụ người dùng gần nhất và chịu lỗi ở mức data center.

---

## 2. Ví dụ cơ bản — các lệnh CQL thông dụng

> **CQL (Cassandra Query Language)** có cú pháp *giống* SQL nhưng KHÔNG hỗ trợ `JOIN`, subquery, hay các phép gộp phức tạp. Mọi ví dụ dưới đây chạy trong `cqlsh`.

### 2.1. Tạo Keyspace

```cql
-- Môi trường dev: SimpleStrategy
CREATE KEYSPACE IF NOT EXISTS shop
WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 1
};

-- Môi trường production: NetworkTopologyStrategy
CREATE KEYSPACE IF NOT EXISTS shop_prod
WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'datacenter1': 3      -- RF = 3 ở data center "datacenter1"
};

-- Chọn keyspace làm việc
USE shop;
```

### 2.2. Tạo Table

```cql
CREATE TABLE IF NOT EXISTS users (
  user_id     UUID PRIMARY KEY,   -- partition key đơn
  username    TEXT,
  email       TEXT,
  age         INT,
  created_at  TIMESTAMP
);
```

Một vài kiểu dữ liệu CQL thường gặp: `TEXT`/`VARCHAR`, `INT`, `BIGINT`, `DOUBLE`, `DECIMAL`, `BOOLEAN`, `UUID`, `TIMEUUID`, `TIMESTAMP`, `DATE`, `BLOB`, `INET`.

### 2.3. Thêm dữ liệu — INSERT

```cql
INSERT INTO users (user_id, username, email, age, created_at)
VALUES (uuid(), 'hieunm', 'hieu@example.com', 30, toTimestamp(now()));

-- Có thể chỉ định UUID cụ thể
INSERT INTO users (user_id, username, email, age, created_at)
VALUES (11111111-1111-1111-1111-111111111111, 'an', 'an@example.com', 25, toTimestamp(now()));
```

> Lưu ý: trong Cassandra, `INSERT` và `UPDATE` đều là phép **UPSERT** — nếu primary key đã tồn tại thì ghi đè, chưa có thì tạo mới. Không có lỗi "duplicate key" như RDBMS (trừ khi dùng `IF NOT EXISTS`).

### 2.4. Truy vấn — SELECT

```cql
-- Lấy theo partition key (hiệu quả nhất)
SELECT * FROM users
WHERE user_id = 11111111-1111-1111-1111-111111111111;

-- Chọn cột cụ thể + giới hạn số dòng
SELECT username, email FROM users LIMIT 10;

-- Đếm (cẩn thận: quét toàn cluster, tốn kém trên bảng lớn)
SELECT COUNT(*) FROM users;
```

> **Cảnh báo:** Truy vấn trên cột **không** thuộc partition/clustering key sẽ bị từ chối, trừ khi thêm `ALLOW FILTERING`. **Tránh `ALLOW FILTERING` trong production** vì nó quét toàn bộ dữ liệu (xem mục 3).

### 2.5. Cập nhật — UPDATE

```cql
UPDATE users
SET email = 'hieu.new@example.com', age = 31
WHERE user_id = 11111111-1111-1111-1111-111111111111;
```

> `WHERE` của `UPDATE` **bắt buộc** xác định đầy đủ primary key (không cập nhật hàng loạt theo điều kiện tùy ý như SQL).

### 2.6. Xóa — DELETE

```cql
-- Xóa nguyên dòng
DELETE FROM users
WHERE user_id = 11111111-1111-1111-1111-111111111111;

-- Xóa một cột (đặt về null)
DELETE email FROM users
WHERE user_id = 11111111-1111-1111-1111-111111111111;
```

> Mỗi lệnh `DELETE` tạo ra một **tombstone**. Quá nhiều tombstone (do xóa nhiều) làm chậm đọc — cần lưu ý khi thiết kế.

---

## 3. Ví dụ nâng cao

### 3.1. Thiết kế bảng theo truy vấn (query-driven modeling)

Trong Cassandra, **bạn thiết kế bảng cho từng câu truy vấn**, chấp nhận lặp dữ liệu. Ví dụ cần xem **tin nhắn của một người dùng, mới nhất trước**:

```cql
CREATE TABLE messages_by_user (
  user_id     UUID,
  message_id  TIMEUUID,     -- TIMEUUID vừa là id vừa mang thời gian
  content     TEXT,
  PRIMARY KEY (user_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);   -- mới nhất nằm đầu
```

```cql
-- Truy vấn rất hiệu quả: 1 partition, đã sắp xếp sẵn
SELECT * FROM messages_by_user
WHERE user_id = 11111111-1111-1111-1111-111111111111
LIMIT 20;
```

Nếu cần thêm truy vấn "tin nhắn theo phòng chat", ta tạo **bảng thứ hai** `messages_by_room` chứa cùng dữ liệu nhưng partition theo `room_id`. Đây là denormalization có chủ đích.

### 3.2. Composite partition key — tránh hot partition

Bảng dữ liệu cảm biến IoT: nếu partition chỉ theo `sensor_id`, một cảm biến ghi mãi sẽ tạo **partition khổng lồ**. Thêm `date` vào partition key để "băm nhỏ" theo ngày (kỹ thuật **time bucketing**):

```cql
CREATE TABLE sensor_data (
  sensor_id     UUID,
  date          TEXT,          -- ví dụ '2026-06-27' → bucket theo ngày
  reading_time  TIMESTAMP,
  value         DOUBLE,
  PRIMARY KEY ((sensor_id, date), reading_time)   -- composite partition key
) WITH CLUSTERING ORDER BY (reading_time DESC);
```

```cql
SELECT * FROM sensor_data
WHERE sensor_id = 22222222-2222-2222-2222-222222222222
  AND date = '2026-06-27'
  AND reading_time >= '2026-06-27 08:00:00';   -- truy vấn theo dải thời gian
```

### 3.3. Secondary Index

Cho phép truy vấn trên cột không thuộc primary key — **nhưng dùng thận trọng**:

```cql
CREATE INDEX idx_users_email ON users (email);

SELECT * FROM users WHERE email = 'an@example.com';
```

| Nên dùng khi | Tránh dùng khi |
|---|---|
| Cột có **cardinality trung bình** (không quá ít, không quá nhiều giá trị khác nhau). | Cột cardinality **rất cao** (ví dụ: email duy nhất) — kém hiệu năng. |
| Truy vấn kèm theo partition key để thu hẹp phạm vi. | Cột cardinality **rất thấp** (ví dụ: boolean) — quét quá nhiều. |
| | Cập nhật/xóa thường xuyên (sinh nhiều tombstone). |

> Với nhu cầu phức tạp hơn, cân nhắc **SASI index** hoặc tốt nhất là **tạo bảng riêng theo truy vấn** (mục 3.1) — thường là lựa chọn tối ưu nhất.

### 3.4. Materialized View

**Materialized View (MV)** tự động duy trì một "bản sao" của bảng gốc với primary key khác, giúp truy vấn theo chiều khác mà không phải tự ghi đồng bộ hai bảng:

```cql
CREATE MATERIALIZED VIEW users_by_email AS
  SELECT user_id, username, email, created_at
  FROM users
  WHERE email IS NOT NULL AND user_id IS NOT NULL
  PRIMARY KEY (email, user_id);   -- giờ có thể truy vấn theo email
```

```cql
SELECT * FROM users_by_email WHERE email = 'an@example.com';
```

> MV giảm công sức đồng bộ thủ công, nhưng có chi phí ghi và từng được xem là tính năng "experimental" ở một số phiên bản. Với hệ thống quan trọng, nhiều team vẫn ưu tiên **tự quản lý bảng denormalized**.

### 3.5. Collection types — set, list, map

```cql
CREATE TABLE user_profiles (
  user_id     UUID PRIMARY KEY,
  emails      SET<TEXT>,            -- tập hợp, không trùng, không thứ tự
  hobbies     LIST<TEXT>,           -- danh sách, có thứ tự, cho phép trùng
  attributes  MAP<TEXT, TEXT>       -- cặp key-value
);
```

```cql
-- Thêm phần tử
UPDATE user_profiles SET emails  = emails  + {'work@example.com'} WHERE user_id = ...;
UPDATE user_profiles SET hobbies = hobbies + ['reading']          WHERE user_id = ...;
UPDATE user_profiles SET attributes = attributes + {'city': 'Hanoi'} WHERE user_id = ...;

-- Xóa phần tử
UPDATE user_profiles SET emails = emails - {'work@example.com'} WHERE user_id = ...;
```

> Collection nên giữ **nhỏ** (vài chục–vài trăm phần tử). Dữ liệu lớn nên tách thành clustering rows. Dùng `FROZEN<...>` khi muốn coi cả collection là một giá trị bất biến (ví dụ để làm clustering key).

### 3.6. TTL — Time To Live

Tự động hết hạn dữ liệu sau N giây — lý tưởng cho session, cache, OTP, dữ liệu tạm:

```cql
-- Dòng tự xóa sau 1 giờ (3600 giây)
INSERT INTO sessions (session_id, data)
VALUES (uuid(), 'token...') USING TTL 3600;

-- Đặt TTL khi UPDATE
UPDATE users USING TTL 86400 SET email = 'temp@example.com' WHERE user_id = ...;

-- Kiểm tra TTL còn lại của một cột
SELECT TTL(email) FROM users WHERE user_id = ...;
```

### 3.7. Batch

Gom nhiều lệnh ghi vào một đơn vị. **Mục đích chính là tính nguyên tử (atomicity), KHÔNG phải để tăng tốc:**

```cql
BEGIN BATCH
  INSERT INTO messages_by_user (user_id, message_id, content)
    VALUES (?, now(), 'Hello');
  INSERT INTO messages_by_room (room_id, message_id, content)
    VALUES (?, now(), 'Hello');
APPLY BATCH;
```

| Loại batch | Đặc điểm |
|---|---|
| **Logged batch** (mặc định) | Đảm bảo tất cả lệnh hoặc cùng thành công hoặc cùng được retry. Tốn chi phí (ghi batchlog). |
| **Unlogged batch** | Không có đảm bảo nguyên tử giữa các partition; nhanh hơn. |

> **Anti-pattern phổ biến:** dùng batch nhiều partition để "ghi hàng loạt cho nhanh". Điều này dồn tải lên coordinator và **làm CHẬM hệ thống**. Batch chỉ nên gom các lệnh **trong cùng một partition**, hoặc dùng để đồng bộ vài bảng denormalized.

### 3.8. Counter & Lightweight Transactions (LWT)

```cql
-- Counter (phải nằm ở bảng riêng, chỉ chứa counter + primary key)
CREATE TABLE page_views (
  page_id TEXT PRIMARY KEY,
  views   COUNTER
);
UPDATE page_views SET views = views + 1 WHERE page_id = 'home';

-- LWT: thao tác có điều kiện (dùng Paxos, đảm bảo linearizable nhưng CHẬM)
INSERT INTO users (user_id, username) VALUES (uuid(), 'newbie') IF NOT EXISTS;
UPDATE users SET email = 'x@e.com' WHERE user_id = ... IF email = 'old@e.com';
```

> LWT giải quyết bài toán "compare-and-set" nhưng tốn 4 vòng giao tiếp (Paxos) → chỉ dùng khi thật sự cần, không lạm dụng.

### 3.9. Tổng hợp tối ưu hiệu năng

| Khuyến nghị | Lý do |
|---|---|
| **Thiết kế theo truy vấn**, denormalize, tạo nhiều bảng. | Cassandra không có JOIN; đọc theo partition key là nhanh nhất. |
| **Luôn truy vấn kèm partition key.** | Tránh quét toàn cluster. |
| **Tránh `ALLOW FILTERING`** trong production. | Quét toàn bộ dữ liệu → chậm, không scale. |
| **Giữ partition < ~100 MB và < ~100.000 dòng.** | Partition quá lớn gây nghẽn (hot partition), khó cân bằng. |
| **Tránh hot partition** (partition key phân bố đều). | Dồn tải lên ít node → mất lợi thế phân tán. |
| **Hạn chế tombstone** (đừng xóa/ghi-đè-null hàng loạt). | Tombstone làm chậm đọc; mô hình hóa bằng TTL khi hợp lý. |
| **Dùng `LOCAL_QUORUM`** trong môi trường multi-DC. | Giảm độ trễ liên data center. |
| **Dùng prepared statements** ở phía client driver. | Tái sử dụng query plan, giảm parsing. |
| **Chọn compaction strategy phù hợp** (STCS/LCS/TWCS). | TWCS cho dữ liệu time-series có TTL; LCS cho read-heavy. |

---

## 4. Replication và Cluster nhiều node

Replication (nhân bản) và clustering (gom nhiều node) là **tính năng cốt lõi, có sẵn từ gốc** của Cassandra — không phải tính năng "gắn thêm" như ở RDBMS truyền thống. Mọi cài đặt Cassandra đều là một *cluster*, và mức nhân bản được khai báo ngay ở keyspace.

### 4.1. Cluster — nhiều node hợp thành (native)

- **Masterless / peer-to-peer**: mọi node ngang hàng, **không có node chủ** → không có điểm chết duy nhất (no SPOF). Mất 1 node, cluster vẫn đọc/ghi bình thường.
- **Mở rộng ngang (scale-out)**: thêm node → Cassandra tự rebalance token range, **không downtime**.
- **Tự phát hiện nhau qua gossip**: node mới chỉ cần biết vài **seed node** là tham gia được vào ring.

> Ngay cả 1 node cũng là "cluster 1 node". Cluster thật sự có ý nghĩa (chịu lỗi + nhân bản) khi có ≥ 3 node.

### 4.2. Replication — nhân bản dữ liệu

Cấu hình ngay khi tạo keyspace, qua **Replication Factor (RF)** + **chiến lược nhân bản**:

```cql
-- Dev / 1 data center
CREATE KEYSPACE shop_dev
WITH replication = { 'class': 'SimpleStrategy', 'replication_factor': 3 };

-- Production: chỉ định RF cho TỪNG data center
CREATE KEYSPACE shop_prod
WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'datacenter1': 3        -- mỗi dòng có 3 bản sao trong DC này
};
```

- **RF = 3** → mỗi dòng tồn tại trên 3 node khác nhau. Vị trí các replica xác định qua consistent hashing: node sở hữu token của partition + (RF − 1) node kế tiếp trên ring.
- **Đổi RF về sau**: dùng `ALTER KEYSPACE`, rồi **bắt buộc** chạy `nodetool repair` để đồng bộ dữ liệu sang các replica mới.

```cql
ALTER KEYSPACE shop_prod
WITH replication = { 'class': 'NetworkTopologyStrategy', 'datacenter1': 5 };
```

### 4.3. Multi-datacenter / multi-region

Đây là thế mạnh mà RDBMS truyền thống rất khó theo kịp — nhân bản qua nhiều DC / vùng / đám mây chỉ bằng cấu hình keyspace:

```cql
CREATE KEYSPACE shop_global
WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'dc_asia':   3,
  'dc_europe': 3
};
```

Kết hợp consistency level **`LOCAL_QUORUM`** để đọc/ghi nhanh trong DC cục bộ mà vẫn bền vững (tránh độ trễ đi vòng qua DC khác).

### 4.4. Nhất quán đi cùng replication

Replication chỉ phát huy giá trị khi đi cùng **consistency level** (xem [mục 1.2](#12-kiến-trúc-phân-tán)). Nhắc lại công thức nhất quán mạnh:

```
R (đọc) + W (ghi) > RF
```

Ví dụ RF=3: ghi `QUORUM` (2) + đọc `QUORUM` (2) → luôn đọc được bản mới nhất, mà vẫn chịu được 1 node chết.

### 4.5. Triển khai & kiểm chứng (thực hành)

`docker-compose.yml` trong [`nodejs/`](./nodejs/) hiện là **1 node, RF=1, SimpleStrategy** → đủ để học CQL nhưng *chưa có nhân bản thật*. Muốn thấy replication + cluster hoạt động thật, cần **nhiều node + RF ≥ 2**.

**Phác thảo cluster 3 node bằng Docker** (1 seed + 2 node, cùng `CLUSTER_NAME`, cùng trỏ về seed):

```yaml
services:
  cassandra-1:                          # seed node
    image: cassandra:5.0
    container_name: cassandra-1
    environment:
      - CASSANDRA_CLUSTER_NAME=DemoCluster
      - CASSANDRA_DC=datacenter1
      - CASSANDRA_ENDPOINT_SNITCH=GossipingPropertyFileSnitch
      - CASSANDRA_SEEDS=cassandra-1
    ports: ["9042:9042"]
    healthcheck:
      test: ["CMD-SHELL", "nodetool status || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 10

  cassandra-2:
    image: cassandra:5.0
    container_name: cassandra-2
    environment:
      - CASSANDRA_CLUSTER_NAME=DemoCluster
      - CASSANDRA_DC=datacenter1
      - CASSANDRA_ENDPOINT_SNITCH=GossipingPropertyFileSnitch
      - CASSANDRA_SEEDS=cassandra-1       # vẫn trỏ về seed node
    depends_on:
      cassandra-1: { condition: service_healthy }

  cassandra-3:
    image: cassandra:5.0
    container_name: cassandra-3
    environment:
      - CASSANDRA_CLUSTER_NAME=DemoCluster
      - CASSANDRA_DC=datacenter1
      - CASSANDRA_ENDPOINT_SNITCH=GossipingPropertyFileSnitch
      - CASSANDRA_SEEDS=cassandra-1
    depends_on:
      cassandra-2: { condition: service_healthy }
```

> ⚠️ Các node phải **bootstrap lần lượt** (mỗi lần 1 node). Khai báo `depends_on … condition: service_healthy` ở trên ép node 2 chỉ khởi động sau khi node 1 sẵn sàng, node 3 sau node 2. Mỗi node mất khoảng ~1 phút.

**Kiểm chứng cluster & replication:**

```bash
# Xem trạng thái các node + % dữ liệu mỗi node nắm giữ
docker exec cassandra-1 nodetool status

# Xem 1 dòng cụ thể đang được nhân bản trên những node nào
docker exec cassandra-1 nodetool getendpoints shop_prod users <partition_key>
```

`nodetool status` sẽ hiện 3 node trạng thái `UN` (Up/Normal) với cột `Owns` ~33% mỗi node.

**Kiểm chứng khả năng chịu lỗi** (với keyspace RF=3):

```bash
docker stop cassandra-3                 # tắt 1 node
docker exec -it cassandra-1 cqlsh
```

```sql
CONSISTENCY QUORUM;                          -- cần 2/3 replica phản hồi
SELECT * FROM shop_prod.users LIMIT 5;       -- VẪN chạy được vì còn 2/3 replica sống
```

---

## 5. So sánh Cassandra vs MySQL vs PostgreSQL

### 5.1. Bảng so sánh tổng hợp

| Tiêu chí | **Apache Cassandra** | **MySQL** | **PostgreSQL** |
|---|---|---|---|
| **Loại CSDL** | NoSQL — wide-column store | RDBMS quan hệ | RDBMS quan hệ (object-relational) |
| **Mô hình dữ liệu** | Phi quan hệ; thiết kế **theo truy vấn**, denormalize; không JOIN | Quan hệ, chuẩn hóa (normalize), có khóa ngoại & JOIN | Quan hệ, chuẩn hóa; mạnh nhất về kiểu dữ liệu (JSONB, mảng, range, geometry...) |
| **Kiến trúc** | **Phân tán, masterless** (peer-to-peer), không SPOF | Chủ yếu **tập trung**; HA qua replication primary–replica | Chủ yếu **tập trung**; HA qua streaming replication |
| **Khả năng mở rộng** | **Scale-out** ngang, tuyến tính, thêm node không downtime | Chủ yếu **scale-up** (mạnh máy chủ); scale-out phức tạp (sharding thủ công, Vitess) | Chủ yếu **scale-up**; scale-out qua extension (Citus) / read replica |
| **Tính nhất quán** | **Tunable** — eventual → strong (qua consistency level); AP nghiêng theo CAP | **ACID** mạnh (InnoDB), nhất quán tức thời trên node chính | **ACID** mạnh, tuân thủ chuẩn SQL nghiêm ngặt; MVCC |
| **Giao dịch (transaction)** | Hạn chế: LWT (Paxos) cho thao tác có điều kiện; batch theo partition | Đầy đủ ACID, đa câu lệnh, đa bảng | Đầy đủ ACID, hỗ trợ transaction phức tạp, savepoint |
| **Hiệu năng GHI** | **Rất cao** (append-only, không cần đọc trước khi ghi); scale theo node | Tốt, nhưng giới hạn bởi 1 node primary | Tốt; tối ưu cho workload hỗn hợp |
| **Hiệu năng ĐỌC** | Rất nhanh **khi đọc theo partition key**; kém với truy vấn ad-hoc/JOIN | Nhanh với index B-tree; mạnh ở truy vấn quan hệ | Rất mạnh ở truy vấn phức tạp, JOIN, analytic, full-text |
| **Ngôn ngữ truy vấn** | **CQL** (giống SQL nhưng không JOIN/subquery/aggregate phức tạp) | **SQL** chuẩn | **SQL** chuẩn (tuân thủ tốt nhất), + nhiều mở rộng |
| **Index** | Primary key, secondary index (hạn chế), SASI, materialized view | B-tree, hash, fulltext, spatial | B-tree, hash, GIN, GiST, BRIN, partial, expression index |
| **JOIN** | ❌ Không hỗ trợ (denormalize thay thế) | ✅ Có | ✅ Có (đa dạng, mạnh) |
| **Multi-datacenter** | ✅ Hỗ trợ gốc, nhân bản qua nhiều DC | Hạn chế, cần cấu hình/giải pháp ngoài | Hạn chế, cần cấu hình/giải pháp ngoài |
| **Khả năng chịu lỗi** | Rất cao — mất vài node vẫn hoạt động | Mất primary → cần failover | Mất primary → cần failover |
| **Trường hợp phù hợp** | Ghi lớn liên tục, time-series, IoT, log, messaging, dữ liệu phân tán toàn cầu | Web app phổ thông, CMS, e-commerce vừa, đọc nhiều | Hệ thống cần truy vấn phức tạp, dữ liệu quan hệ chặt, phân tích, GIS, JSON |

### 5.2. Ưu / nhược điểm từng hệ

#### Apache Cassandra

| Ưu điểm | Nhược điểm |
|---|---|
| Mở rộng ngang tuyến tính, gần như không giới hạn. | Không JOIN, không subquery; truy vấn ad-hoc rất hạn chế. |
| Sẵn sàng cao, không điểm chết duy nhất. | Mô hình hóa khó, phải biết trước truy vấn; denormalize gây lặp dữ liệu. |
| Throughput ghi cực cao, độ trễ thấp & ổn định. | Nhất quán mạnh phải đánh đổi (CL cao → chậm hơn). |
| Multi-datacenter sẵn có. | Quản trị/vận hành phức tạp (tuning, compaction, repair). |
| Tunable consistency linh hoạt. | Tombstone & hot partition dễ gây sự cố nếu thiết kế sai. |

#### MySQL

| Ưu điểm | Nhược điểm |
|---|---|
| Phổ biến, dễ học, hệ sinh thái khổng lồ. | Scale-out (ghi) khó, thường phải sharding thủ công. |
| ACID đầy đủ, ổn định, hiệu năng tốt cho web app. | Tính năng SQL nâng cao kém phong phú hơn PostgreSQL. |
| Hỗ trợ & tài liệu dồi dào, vận hành đơn giản. | HA ghi phụ thuộc 1 primary → cần failover. |
| Nhiều engine (InnoDB, MyISAM). | Yếu khi dữ liệu cực lớn phân tán toàn cầu. |

#### PostgreSQL

| Ưu điểm | Nhược điểm |
|---|---|
| Tuân thủ chuẩn SQL tốt nhất, tính năng phong phú (JSONB, CTE, window function, mảng, GIS). | Mở rộng ghi theo chiều ngang vẫn cần extension (Citus) / giải pháp ngoài. |
| Truy vấn phức tạp, phân tích mạnh; MVCC tốt. | Vận hành tuning ở quy mô rất lớn đòi hỏi kinh nghiệm. |
| Khả năng mở rộng qua extension, kiểu dữ liệu tùy biến. | Một số tác vụ ghi cực lớn liên tục không bằng Cassandra. |
| ACID mạnh, độ tin cậy cao, mã nguồn mở thực sự. | |

---

## 6. Kết luận — khi nào nên chọn Cassandra

### Chọn **Cassandra** khi:

- ✅ **Khối lượng ghi rất lớn, liên tục**: log, sự kiện, metrics, time-series, IoT, telemetry.
- ✅ **Cần mở rộng ngang gần như không giới hạn** và **uptime cao** (không chấp nhận downtime, không điểm chết duy nhất).
- ✅ **Phân tán đa vùng / đa data center** (toàn cầu), người dùng ở nhiều khu vực địa lý.
- ✅ **Truy vấn biết trước, đơn giản theo khóa** (key-based), chấp nhận eventual consistency.
- ✅ Ví dụ điển hình: hệ thống messaging/chat, feed hoạt động, lưu lịch sử giao dịch/log, theo dõi cảm biến IoT, giỏ hàng/phiên ở quy mô cực lớn.

### Chọn **MySQL** hoặc **PostgreSQL** khi:

- ✅ Cần **giao dịch ACID mạnh** và nhất quán tức thời (ngân hàng, kế toán, thanh toán, đặt hàng).
- ✅ Dữ liệu **quan hệ chặt chẽ**, cần `JOIN`, ràng buộc khóa ngoại, truy vấn ad-hoc linh hoạt.
- ✅ Quy mô **vừa và nhỏ–trung bình**, đọc nhiều hơn ghi, một node/cụm primary–replica là đủ.
- ✅ Cần **báo cáo, phân tích, truy vấn phức tạp** → ưu tiên **PostgreSQL** (mạnh về SQL nâng cao, JSONB, window function, GIS).
- ✅ Ứng dụng web phổ thông, CMS, e-commerce vừa, cần đơn giản & hệ sinh thái lớn → **MySQL**.

### Tóm tắt một dòng

> **Cassandra** đánh đổi sự linh hoạt truy vấn và nhất quán mạnh để lấy **khả năng mở rộng ghi + tính sẵn sàng** ở quy mô lớn. Nếu bài toán của bạn là *"rất nhiều dữ liệu ghi, phân tán, luôn online"* → chọn Cassandra. Nếu là *"dữ liệu quan hệ, giao dịch chặt, truy vấn linh hoạt"* → chọn MySQL/PostgreSQL. Trong nhiều kiến trúc thực tế, người ta dùng **cả hai** (polyglot persistence): RDBMS cho dữ liệu lõi giao dịch, Cassandra cho dữ liệu quy mô lớn / time-series.

---

## Tài liệu tham khảo

- Tài liệu chính thức: <https://cassandra.apache.org/doc/latest/>
- CQL reference: <https://cassandra.apache.org/doc/latest/cassandra/cql/>
- DataStax CQL & data modeling guides: <https://docs.datastax.com/>
