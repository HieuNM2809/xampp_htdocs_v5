-- ============================================================
-- FILE: 06_real_world_scenarios.sql
-- MỤC ĐÍCH: Kịch bản thực tế kết hợp nhiều kỹ thuật
-- ============================================================

USE demo_function_index;

-- ============================================================
-- KỊCH BẢN 1: Hệ thống tìm kiếm nhân viên (HR System)
-- ============================================================
/*
  Bài toán: Ứng dụng HR cho phép tìm nhân viên theo:
  - Tên (không phân biệt hoa thường, kể cả gõ thiếu dấu)
  - Email (không phân biệt hoa thường)
  - Năm/tháng sinh
  - Khoảng lương

  Với 1 triệu nhân viên, full scan sẽ rất chậm.
*/

-- Strategy: Dùng function index cho các cột hay bị query với hàm
CREATE INDEX idx_hr_email  ON employees ((LOWER(email)));           -- case-insensitive email
CREATE INDEX idx_hr_byear  ON employees ((YEAR(birth_date)));       -- lọc theo năm
CREATE INDEX idx_hr_bmonth ON employees ((MONTH(birth_date)));      -- lọc theo tháng
-- Regular index vẫn cần cho lương (dùng BETWEEN, không cần hàm)
-- → idx_salary đã tạo từ trước

-- API endpoint: GET /employees?email=NGUYEN.VAN.AN@COMPANY.COM
SELECT id, full_name, department, salary
FROM employees
WHERE LOWER(email) = LOWER('NGUYEN.VAN.AN@COMPANY.COM');  -- function index dùng!

-- API endpoint: GET /employees?birth_year=1990&department=IT
SELECT id, full_name, birth_date, department
FROM employees
WHERE YEAR(birth_date) = 1990
  AND department = 'IT';  -- function index + regular scan trên department

-- API endpoint: GET /employees?salary_min=10000000&salary_max=20000000
SELECT id, full_name, salary
FROM employees
WHERE salary BETWEEN 10000000 AND 20000000  -- regular index idx_salary
ORDER BY salary DESC;

-- ============================================================
-- KỊCH BẢN 2: Dashboard báo cáo đơn hàng (E-commerce)
-- ============================================================
/*
  Bài toán: Dashboard real-time hiển thị:
  - Doanh thu theo ngày
  - Số đơn theo giờ trong ngày (để biết giờ cao điểm)
  - Đơn hàng chưa xử lý (status = pending)
*/

-- Index cho báo cáo theo ngày
CREATE INDEX idx_report_day  ON orders ((DATE(order_date)));
CREATE INDEX idx_report_hour ON orders ((HOUR(order_date)));
CREATE INDEX idx_report_ym   ON orders ((DATE_FORMAT(order_date, '%Y-%m')));

-- Query 1: Doanh thu hôm nay
SELECT
    SUM(total_amount) AS doanh_thu,
    COUNT(*)          AS so_don
FROM orders
WHERE DATE(order_date) = CURDATE()
  AND status = 'completed';

EXPLAIN SELECT SUM(total_amount) FROM orders
WHERE DATE(order_date) = CURDATE() AND status = 'completed';
-- key: idx_report_day  ← function index!

-- Query 2: Số đơn theo từng giờ trong tháng này
SELECT
    HOUR(order_date) AS gio,
    COUNT(*)         AS so_don,
    SUM(total_amount) AS tong_tien
FROM orders
WHERE DATE_FORMAT(order_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
GROUP BY gio
ORDER BY gio;

EXPLAIN SELECT HOUR(order_date), COUNT(*) FROM orders
WHERE DATE_FORMAT(order_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
GROUP BY HOUR(order_date);
-- key: idx_report_ym  ← function index!

-- Query 3: Đơn hàng pending cần xử lý gấp (trong 24h qua)
SELECT order_id, customer_id, order_date, total_amount
FROM orders
WHERE status = 'pending'
  AND DATE(order_date) = CURDATE()
ORDER BY order_date DESC;

-- ============================================================
-- KỊCH BẢN 3: Function Index thay thế Generated Column
-- ============================================================
/*
  Cách cũ (trước MySQL 8.0.13): Dùng Generated Column (Virtual Column)
  để lưu kết quả hàm, rồi tạo index trên cột đó.
  
  Cách mới (MySQL 8.0.13+): Function Index tự động làm điều này bên trong.
  Về bản chất, chúng giống nhau!
*/

-- ── CÁCH CŨ: Generated Column + Regular Index ──
ALTER TABLE employees
    ADD COLUMN email_lower_col VARCHAR(150)
        AS (LOWER(email)) VIRTUAL;

CREATE INDEX idx_email_gen ON employees (email_lower_col);

EXPLAIN SELECT * FROM employees
WHERE email_lower_col = 'nguyen.van.an@company.com';
-- type: ref, key: idx_email_gen

-- ── CÁCH MỚI: Function Index (đơn giản hơn, không cần thêm cột) ──
-- Đã tạo idx_email_lower ở file trước
-- CREATE INDEX idx_email_lower ON employees ((LOWER(email)));

-- So sánh: Cả hai cho kết quả EXPLAIN giống nhau
-- Nhưng Function Index gọn gàng hơn, không làm lộ cột ảo ra ngoài

-- Cleanup generated column (không cần nữa)
ALTER TABLE employees DROP COLUMN email_lower_col;
DROP INDEX idx_email_gen ON employees;

-- ============================================================
-- KỊCH BẢN 4: Index trên JSON (MySQL 5.7+ JSON + 8.0 Function Index)
-- ============================================================
/*
  Nếu bảng có cột JSON, function index giúp index một field trong JSON.
*/

-- Thêm cột JSON vào bảng orders (giả lập metadata)
ALTER TABLE orders ADD COLUMN metadata JSON;

UPDATE orders
SET metadata = JSON_OBJECT(
    'region', ELT(1 + FLOOR(RAND() * 3), 'north', 'south', 'central'),
    'channel', ELT(1 + FLOOR(RAND() * 3), 'web', 'mobile', 'store'),
    'priority', FLOOR(1 + RAND() * 5)
)
WHERE order_id <= 20;  -- Chỉ update 20 dòng demo

-- Tạo Function Index trên JSON field
CREATE INDEX idx_order_region
    ON orders ((JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.region'))));

-- Hoặc dùng cú pháp ngắn hơn (MySQL 5.7.9+):
CREATE INDEX idx_order_channel
    ON orders ((metadata->>'$.channel'));

-- Query lọc theo JSON field sẽ dùng index
EXPLAIN SELECT * FROM orders
WHERE JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.region')) = 'north';
-- key: idx_order_region  ← function index trên JSON!

SELECT 'Kịch bản thực tế hoàn tất!' AS result;
