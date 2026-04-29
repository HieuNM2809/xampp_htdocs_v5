-- ============================================================
-- FILE: 04_function_index_advanced.sql
-- MỤC ĐÍCH: Function Index nâng cao
--           - JSON expression index
--           - Composite function index
--           - Function index trên DATE/DATETIME
--           - Function index với IF/CASE
-- ============================================================

USE demo_function_index;

-- ============================================================
-- VÍ DỤ 5: Function Index trên DATE từ DATETIME
-- ============================================================
/*
  Bảng orders có cột order_date kiểu DATETIME.
  Người dùng hay truy vấn: "hôm nay có bao nhiêu đơn hàng?"
  → WHERE DATE(order_date) = '2024-06-15'
  → Regular index trên order_date KHÔNG hoạt động vì DATE() bọc ngoài!
*/

-- ── Kiểm tra không có function index ──
CREATE INDEX idx_order_date ON orders (order_date);

EXPLAIN SELECT * FROM orders WHERE DATE(order_date) = '2024-01-15';
-- type: ALL  ← full scan!

-- ── Tạo Function Index ──
CREATE INDEX idx_order_date_only
    ON orders ((DATE(order_date)));

EXPLAIN SELECT * FROM orders WHERE DATE(order_date) = '2024-01-15';
/*  key: idx_order_date_only  ← function index được dùng! */

-- ── Tìm đơn hàng theo tháng và năm ──
CREATE INDEX idx_order_ym
    ON orders ((DATE_FORMAT(order_date, '%Y-%m')));

EXPLAIN SELECT * FROM orders
WHERE DATE_FORMAT(order_date, '%Y-%m') = '2024-06';
/*  key: idx_order_ym */

-- ── Tìm theo giờ (buổi sáng/chiều) ──
CREATE INDEX idx_order_hour
    ON orders ((HOUR(order_date)));

-- Hiển thị tất cả đơn hàng đặt vào buổi sáng (7h–11h)
EXPLAIN SELECT * FROM orders
WHERE HOUR(order_date) BETWEEN 7 AND 11;
/*  key: idx_order_hour */

-- ── Tìm theo ngày trong tuần (0=Chủ nhật, 1=Thứ 2...) ──
CREATE INDEX idx_order_weekday
    ON orders ((DAYOFWEEK(order_date)));

SELECT COUNT(*) AS so_don, DAYOFWEEK(order_date) AS thu
FROM orders
WHERE DAYOFWEEK(order_date) = 2   -- Thứ 2
GROUP BY thu;

-- ============================================================
-- VÍ DỤ 6: Function Index với CONCAT / String manipulation
-- ============================================================

-- Tìm kiếm theo họ và tên kết hợp (dạng chuẩn hóa lowercase, no-space)
CREATE INDEX idx_name_normalized
    ON employees ((LOWER(REPLACE(full_name, ' ', ''))));

EXPLAIN SELECT * FROM employees
WHERE LOWER(REPLACE(full_name, ' ', '')) = 'nguyenvanan';
/*  key: idx_name_normalized */

SELECT id, full_name
FROM employees
WHERE LOWER(REPLACE(full_name, ' ', '')) = 'nguyenvanan';

-- ============================================================
-- VÍ DỤ 7: Function Index với ABS() - giá trị tuyệt đối
-- ============================================================

-- Giả sử lưu chênh lệch lương (âm = dưới mức, dương = trên mức)
-- Tìm những người có độ lệch > 5,000,000 (bất kể âm hay dương)
ALTER TABLE employees ADD COLUMN salary_diff DECIMAL(12,2) DEFAULT 0;
UPDATE employees SET salary_diff = salary - 12000000;

CREATE INDEX idx_salary_abs
    ON employees ((ABS(salary_diff)));

EXPLAIN SELECT * FROM employees WHERE ABS(salary_diff) > 5000000;
/*  key: idx_salary_abs */

-- ============================================================
-- VÍ DỤ 8: Partial String Index (MySQL không hỗ trợ SUBSTR trong index)
--          nhưng hỗ trợ LEFT() — hữu ích cho prefix lookup
-- ============================================================

-- Tìm theo 3 ký tự đầu của department
CREATE INDEX idx_dept_prefix
    ON employees ((LEFT(department, 3)));

EXPLAIN SELECT * FROM employees WHERE LEFT(department, 3) = 'Fin';
/*  key: idx_dept_prefix */

-- ============================================================
-- VÍ DỤ 9: Function Index với IF/CASE — Conditional Index
-- ============================================================
/*
  Một số database hỗ trợ "Partial Index" (WHERE clause trong index).
  MySQL không hỗ trợ trực tiếp, nhưng có thể mô phỏng bằng
  biểu thức IF/CASE.
  
  Ví dụ: Chỉ muốn index các đơn hàng CHƯA hoàn thành để dashboard
         query nhanh hơn (không cần index đơn đã xong).
*/

-- Mô phỏng partial index:
-- Lưu NULL cho đơn hoàn thành, lưu order_id cho đơn chưa hoàn thành
-- Index chỉ hiệu quả với giá trị NOT NULL
CREATE INDEX idx_pending_orders
    ON orders ((IF(status != 'completed', order_id, NULL)));

-- ============================================================
-- VÍ DỤ 10: Composite Function Index (nhiều biểu thức)
-- ============================================================
/*
  MySQL cho phép kết hợp cột thường và biểu thức trong một index.
  
  Ví dụ: Tìm đơn hàng của khách hàng cụ thể theo ngày
*/

CREATE INDEX idx_customer_date
    ON orders (customer_id, (DATE(order_date)));

EXPLAIN SELECT * FROM orders
WHERE customer_id = 5
  AND DATE(order_date) = '2024-03-20';
/*  key: idx_customer_date  ← composite function index */

-- ============================================================
-- VÍ DỤ 11: Kiểm tra index usage với EXPLAIN FORMAT=JSON
--           (chi tiết hơn EXPLAIN thông thường)
-- ============================================================

EXPLAIN FORMAT=JSON
SELECT e.id, e.full_name, e.email
FROM employees e
WHERE LOWER(e.email) = 'nguyen.van.an@company.com';
/*
  Trong output JSON, tìm:
  "index_name": "idx_email_lower"
  "using_index_condition": true
  "rows_examined_per_scan": 1   (thay vì 100 khi full scan)
*/

-- ============================================================
-- VÍ DỤ 12: EXPLAIN ANALYZE — đo thời gian thực tế (MySQL 8.0+)
-- ============================================================

-- Không có function index:
EXPLAIN ANALYZE
SELECT * FROM employees WHERE LOWER(full_name) = LOWER('TRAN THI BINH');

-- Có function index:
EXPLAIN ANALYZE
SELECT * FROM employees WHERE LOWER(full_name) = 'tran thi binh';

SELECT 'Phần Function Index nâng cao hoàn tất!' AS result;
