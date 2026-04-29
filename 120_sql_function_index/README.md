# 📘 SQL Function Index — Hướng dẫn từ cơ bản đến nâng cao

> **Database:** MySQL 8.0.13+  
> **Mục tiêu:** Hiểu rõ Function Index là gì, so sánh với Regular Index, và áp dụng vào thực tế.

---

## 📂 Cấu trúc file

| File | Nội dung |
|------|----------|
| `01_setup.sql` | Tạo database, bảng, dữ liệu mẫu |
| `02_regular_index.sql` | Regular Index: hoạt động & thất bại khi dùng hàm |
| `03_function_index_basic.sql` | Function Index cơ bản |
| `04_function_index_advanced.sql` | Function Index nâng cao |
| `05_comparison.sql` | So sánh trực tiếp + best practices |
| `06_real_world_scenarios.sql` | Kịch bản thực tế |
| `07_pitfalls.sql` | Lỗi thường gặp & checklist |

> ▶ **Chạy theo đúng thứ tự** từ `01` → `07`.

---

## 1. Regular Index là gì?

**Regular Index** (index thông thường) lưu **giá trị gốc** của cột vào cấu trúc B-Tree đã sắp xếp, giúp truy vấn tìm kiếm không cần đọc toàn bộ bảng.

### Cú pháp

```sql
CREATE INDEX idx_email ON employees (email);
```

### Khi nào Regular Index **hoạt động** ✅

```sql
-- Tìm theo giá trị chính xác
WHERE email = 'abc@company.com'

-- Lọc theo khoảng
WHERE salary BETWEEN 10000000 AND 20000000

-- So sánh prefix (LIKE 'abc%')
WHERE full_name LIKE 'Nguyen%'
```

### Khi nào Regular Index **KHÔNG hoạt động** ❌

```sql
-- Bọc hàm bên ngoài cột → Index bị vô hiệu → Full Table Scan!
WHERE LOWER(email)      = 'abc@company.com'
WHERE YEAR(birth_date)  = 1990
WHERE DATE(order_date)  = '2024-01-15'
WHERE MONTH(birth_date) = 3
```

**Lý do:** MySQL lưu `'ABC@COMPANY.COM'` trong index, nhưng `LOWER()` biến đổi giá trị rồi mới so sánh — MySQL không biết kết quả trước → phải đọc hết bảng.

---

## 2. Function Index là gì?

**Function Index** (Functional Index / Expression Index) lưu **kết quả của một hàm hoặc biểu thức** thay vì giá trị gốc.

### Cơ chế bên trong

MySQL thực hiện 2 bước ngầm:
1. Tự động thêm **virtual column ẩn** chứa kết quả biểu thức
2. Tạo **regular B-Tree index** trên virtual column đó

Người dùng không thấy virtual column, nhưng optimizer tự nhận biết và sử dụng.

### Cú pháp — chú ý **hai cặp ngoặc** `(( ))`

```sql
CREATE INDEX idx_email_lower ON employees ((LOWER(email)));
--                                          ↑↑          ↑↑
--                            ngoặc ngoài = cú pháp CREATE INDEX
--                            ngoặc trong = báo hiệu "đây là expression"
```

### Yêu cầu

- MySQL **≥ 8.0.13**
- Hàm phải **deterministic** (cùng input → cùng output), không dùng được: `NOW()`, `RAND()`, `UUID()`

---

## 3. So sánh Regular Index vs Function Index

| Tiêu chí | Regular Index | Function Index |
|----------|:---:|:---:|
| Lưu trữ | Giá trị gốc | Kết quả hàm/biểu thức |
| Hiệu quả với `WHERE col = val` | ✅ | ❌ |
| Hiệu quả với `WHERE func(col) = val` | ❌ | ✅ |
| Chi phí disk | Thấp | Cao hơn |
| Chi phí INSERT/UPDATE | Thấp | Cao hơn (tính lại expr) |
| Hỗ trợ `UNIQUE` | ✅ | ✅ |
| Hỗ trợ `ORDER BY` | ✅ | ✅ (cùng expr) |
| MySQL version | Tất cả | ≥ 8.0.13 |
| Hàm deterministic bắt buộc | — | ✅ |

> 💡 **Hai loại bổ sung nhau**, không thay thế nhau. Nếu query vừa dùng giá trị gốc vừa dùng hàm, cần cả hai index.

---

## 4. Ví dụ thực hành

### 4.1 Case-insensitive search (Cơ bản)

```sql
-- Vấn đề: email nhập lộn hoa/thường
-- 'Nguyen.Van.An@Company.COM', 'tran.thi.binh@company.com'...

-- ❌ Regular index vô dụng
EXPLAIN SELECT * FROM employees WHERE LOWER(email) = 'test@company.com';
-- → type: ALL (full scan, 100+ dòng)

-- ✅ Tạo Function Index
CREATE INDEX idx_email_lower ON employees ((LOWER(email)));

-- ✅ Bây giờ dùng index
EXPLAIN SELECT * FROM employees WHERE LOWER(email) = 'test@company.com';
-- → type: ref, key: idx_email_lower, rows: 1
```

### 4.2 Lọc theo năm/tháng/ngày

```sql
-- ❌ Dù có index trên birth_date, YEAR() làm nó vô hiệu
EXPLAIN SELECT * FROM employees WHERE YEAR(birth_date) = 1990;
-- → type: ALL

-- ✅ Function Index cho từng thành phần thời gian
CREATE INDEX idx_birth_year  ON employees ((YEAR(birth_date)));
CREATE INDEX idx_birth_month ON employees ((MONTH(birth_date)));
CREATE INDEX idx_order_date  ON orders    ((DATE(order_date)));

EXPLAIN SELECT * FROM employees WHERE YEAR(birth_date) = 1990;
-- → type: ref, key: idx_birth_year ✅
```

### 4.3 Biểu thức tính toán

```sql
CREATE INDEX idx_salary_k ON employees ((ROUND(salary / 1000)));

SELECT * FROM employees WHERE ROUND(salary / 1000) = 12000;
-- → dùng idx_salary_k  ✅
```

### 4.4 Composite Function Index

```sql
-- Kết hợp cột thường + biểu thức
CREATE INDEX idx_cust_date
    ON orders (customer_id, (DATE(order_date)));

-- Optimizer sẽ dùng index cho query này
SELECT * FROM orders
WHERE customer_id = 5
  AND DATE(order_date) = '2024-03-20';
```

### 4.5 UNIQUE Function Index

```sql
-- Không cho phép email trùng dù khác hoa/thường
CREATE UNIQUE INDEX idx_email_unique
    ON employees ((LOWER(email)));

-- INSERT email 'NGUYEN.VAN.AN@COMPANY.COM' khi 'nguyen.van.an@company.com' đã tồn tại
-- → ERROR 1062: Duplicate entry
```

### 4.6 Function Index trên JSON (MySQL 5.7+ JSON + 8.0 Function Index)

```sql
-- Cột JSON: metadata = '{"region":"north","channel":"web"}'
CREATE INDEX idx_region
    ON orders ((JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.region'))));

-- Hoặc cú pháp ngắn (MySQL 5.7.9+)
CREATE INDEX idx_channel
    ON orders ((metadata->>'$.channel'));

-- Query lọc JSON field dùng được index
SELECT * FROM orders WHERE metadata->>'$.region' = 'north';
```

---

## 5. Workaround cho MySQL < 8.0.13

Nếu chưa thể nâng cấp lên MySQL 8.0.13, dùng **Generated Column + Regular Index**:

```sql
-- Bước 1: Thêm virtual column
ALTER TABLE employees
    ADD COLUMN email_lower VARCHAR(150) AS (LOWER(email)) VIRTUAL;

-- Bước 2: Tạo regular index trên virtual column
CREATE INDEX idx_email_gen ON employees (email_lower);

-- Bước 3: Query có thể dùng cột hoặc hàm đều được
SELECT * FROM employees WHERE email_lower = 'test@company.com';
```

**Nhược điểm:** Cột ẩn bị lộ ra trong `DESCRIBE`, `SELECT *` trả về thêm cột.

---

## 6. Kiểm tra với EXPLAIN

Luôn dùng `EXPLAIN` để xác nhận index có được dùng không:

```sql
EXPLAIN SELECT * FROM employees WHERE LOWER(email) = 'test@company.com';
```

| Cột quan trọng | Ý nghĩa |
|---|---|
| `type: ALL` | ❌ Full table scan — không dùng index |
| `type: ref` | ✅ Dùng index bình thường |
| `type: range` | ✅ Dùng index theo khoảng |
| `key: NULL` | ❌ Không dùng index nào |
| `key: idx_name` | ✅ Tên index đang được dùng |
| `rows: 1` | ✅ Chỉ đọc 1 dòng |

```sql
-- EXPLAIN chi tiết hơn (MySQL 8.0+)
EXPLAIN FORMAT=JSON SELECT ...;

-- Đo thời gian thực tế (MySQL 8.0+)
EXPLAIN ANALYZE SELECT ...;
```

---

## 7. Lỗi thường gặp (Pitfalls)

### ❌ Lỗi 1: Biểu thức không khớp chính xác

```sql
CREATE INDEX idx ON employees ((LOWER(email)));

-- ❌ UPPER khác LOWER → không dùng được index!
WHERE UPPER(email) = 'TEST@COMPANY.COM'

-- ❌ Thêm TRIM → biểu thức khác → không dùng được!
WHERE LOWER(TRIM(email)) = 'test@company.com'

-- ✅ Phải khớp hoàn toàn
WHERE LOWER(email) = 'test@company.com'
```

### ❌ Lỗi 2: Hàm không deterministic

```sql
-- ❌ Lỗi: NOW() thay đổi theo thời gian
CREATE INDEX idx_bad ON orders ((DATE(NOW())));
-- → ERROR: Expression contains a disallowed function

-- ❌ Lỗi: RAND() không deterministic
CREATE INDEX idx_bad ON employees ((ROUND(RAND() * salary)));
```

### ❌ Lỗi 3: MySQL version < 8.0.13

```sql
-- Kiểm tra version trước
SELECT VERSION();  -- Phải >= 8.0.13
```

### ❌ Lỗi 4: Tạo quá nhiều index

Mỗi index tốn disk + làm chậm INSERT/UPDATE/DELETE. Chỉ tạo khi có query cụ thể cần tối ưu.

---

## 8. Checklist trước khi tạo Function Index

```
□ MySQL version >= 8.0.13?
□ Hàm sử dụng có deterministic không?
□ Query này chạy thường xuyên (> nhiều lần/giây)?
□ Bảng có đủ lớn để cần index (> 10,000 dòng)?
□ Biểu thức trong index và WHERE GIỐNG NHAU chính xác?
□ Đã EXPLAIN để xác nhận index được dùng chưa?
□ Đã cân nhắc rewrite WHERE thay vì thêm index chưa?
   Ví dụ: YEAR(col) = 2024  →  col BETWEEN '2024-01-01' AND '2024-12-31'
```

---

## 9. Hàm được phép trong Function Index

| ✅ Được phép | ❌ Không được phép |
|---|---|
| `LOWER()`, `UPPER()` | `NOW()`, `CURDATE()` |
| `YEAR()`, `MONTH()`, `DAY()` | `RAND()` |
| `HOUR()`, `DATE()` | `UUID()` |
| `ABS()`, `ROUND()`, `FLOOR()` | `SYSDATE()` |
| `LEFT()`, `RIGHT()`, `TRIM()` | Mọi hàm non-deterministic |
| `CONCAT()`, `REPLACE()` | |
| `JSON_EXTRACT()`, `JSON_UNQUOTE()` | |

---

## 10. Tham khảo

- [MySQL 8.0 Docs — Functional Key Parts](https://dev.mysql.com/doc/refman/8.0/en/create-index.html#create-index-functional-key-parts)
- [MySQL 8.0 Docs — Generated Columns](https://dev.mysql.com/doc/refman/8.0/en/create-table-generated-columns.html)
- [EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html)
