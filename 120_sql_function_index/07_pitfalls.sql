-- ============================================================
-- FILE: 07_pitfalls.sql
-- MỤC ĐÍCH: Những lỗi hay gặp khi dùng Function Index
--           và cách phòng tránh
-- ============================================================

USE demo_function_index;

-- ============================================================
-- LỖI 1: Biểu thức trong WHERE không khớp với index
-- ============================================================
/*
  Function index chỉ được dùng khi biểu thức trong WHERE
  HOÀN TOÀN GIỐNG với biểu thức trong index.
  Nếu khác dù chỉ một chút → MySQL bỏ qua index.
*/

-- Index được tạo với LOWER(email)
-- CREATE INDEX idx_email_lower ON employees ((LOWER(email)));

-- ✅ ĐÚNG: biểu thức khớp hoàn toàn
EXPLAIN SELECT * FROM employees WHERE LOWER(email) = 'test@company.com';
-- key: idx_email_lower

-- ❌ SAI: dùng UPPER thay vì LOWER → không khớp → full scan!
EXPLAIN SELECT * FROM employees WHERE UPPER(email) = 'TEST@COMPANY.COM';
-- type: ALL

-- ❌ SAI: thêm TRIM() bên ngoài → không khớp → full scan!
EXPLAIN SELECT * FROM employees WHERE LOWER(TRIM(email)) = 'test@company.com';
-- type: ALL

-- ✅ FIX: Tạo index với đúng biểu thức đang dùng
CREATE INDEX idx_email_trim_lower ON employees ((LOWER(TRIM(email))));
EXPLAIN SELECT * FROM employees WHERE LOWER(TRIM(email)) = 'test@company.com';
-- key: idx_email_trim_lower  ✅

-- ============================================================
-- LỖI 2: Không biết MySQL version có hỗ trợ không
-- ============================================================

-- Kiểm tra version trước khi dùng Function Index
SELECT VERSION();  -- Phải >= 8.0.13

-- MySQL 5.7: Function Index KHÔNG được hỗ trợ
-- → Thay thế bằng Generated Column + Regular Index (xem kịch bản 3)
-- → Hoặc dùng Pattern: WHERE birth_date >= '1990-01-01' AND birth_date < '1991-01-01'

-- ============================================================
-- LỖI 3: Index không deterministic (không được phép)
-- ============================================================
/*
  Function Index YÊU CẦU hàm phải DETERMINISTIC:
  - Cùng input → luôn cho cùng output
  - LOWER('ABC') = 'abc' → luôn đúng

  Các hàm KHÔNG deterministic → MySQL từ chối tạo index:
  - NOW(), RAND(), UUID(), CURDATE() → kết quả thay đổi theo thời gian
*/

-- ❌ LỖI: Không thể tạo index trên NOW()
-- CREATE INDEX idx_bad ON orders ((DATE(NOW())));
-- → ERROR 3758: Expression of functional index 'idx_bad' contains a disallowed function.

-- ❌ LỖI: Không thể tạo index trên RAND()
-- CREATE INDEX idx_bad2 ON employees ((ROUND(RAND() * salary)));
-- → ERROR: non-deterministic expression

-- ✅ Các hàm được phép trong Function Index:
-- LOWER(), UPPER(), YEAR(), MONTH(), DAY(), HOUR(), DATE(),
-- ABS(), ROUND(), FLOOR(), CEIL(), LEFT(), RIGHT(),
-- CONCAT(), REPLACE(), TRIM(), JSON_EXTRACT()...

-- ============================================================
-- LỖI 4: Quên kiểm tra index có được dùng không
-- ============================================================
/*
  MySQL Optimizer không phải lúc nào cũng chọn dùng Function Index!
  Nếu bảng nhỏ hoặc statistics không tốt, optimizer có thể bỏ qua.
  Luôn dùng EXPLAIN để xác nhận.
*/

-- EXPLAIN xác nhận trước khi deploy
EXPLAIN SELECT * FROM employees WHERE LOWER(full_name) = 'nguyen van an';
-- Nếu key = NULL → index không được dùng → cần điều tra thêm

-- Force dùng index (debug only, không dùng trong production)
EXPLAIN SELECT * FROM employees
    USE INDEX (idx_name_lower)
WHERE LOWER(full_name) = 'nguyen van an';

-- ============================================================
-- LỖI 5: Tạo quá nhiều index
-- ============================================================
/*
  Mỗi index (kể cả function index) tốn:
  - Dung lượng disk
  - Thời gian INSERT/UPDATE/DELETE (phải update index)
  - Bộ nhớ buffer pool

  Nguyên tắc: Chỉ tạo index khi có query cụ thể cần tối ưu,
  không tạo index "phòng bị".
*/

-- Kiểm tra tất cả index hiện có của bảng
SHOW INDEX FROM employees;
SHOW INDEX FROM orders;

-- Kiểm tra index nào không được dùng (MySQL 8.0+)
-- Dùng sys schema (nếu có)
-- SELECT * FROM sys.schema_unused_indexes WHERE object_schema = 'demo_function_index';

-- ============================================================
-- LỖI 6: Function Index với NULL
-- ============================================================
/*
  Index thông thường bỏ qua NULL (B-Tree không lưu NULL).
  Function Index cũng bỏ qua NULL.
  
  Nếu biểu thức trả về NULL → dòng đó không có trong index.
*/

-- Xem nhân viên có salary_diff = NULL (nếu có)
SELECT COUNT(*) FROM employees WHERE salary_diff IS NULL;

-- LOWER(NULL) = NULL → dòng NULL *không có* trong idx_email_lower
-- Nếu cần tìm NULL, vẫn phải dùng IS NULL (không qua function index)
EXPLAIN SELECT * FROM employees WHERE email IS NULL;
-- key: NULL hoặc idx_email → không dùng idx_email_lower

-- ============================================================
-- CHECKLIST trước khi tạo Function Index
-- ============================================================
/*
  □ 1. MySQL version >= 8.0.13?
  □ 2. Hàm trong WHERE có deterministic không?
  □ 3. Query này có chạy thường xuyên không? (>100 lần/giây?)
  □ 4. Bảng có đủ lớn để cần index? (>10,000 dòng?)
  □ 5. Biểu thức trong index và WHERE phải GIỐNG NHAU chính xác?
  □ 6. Đã EXPLAIN để xác nhận index được dùng chưa?
  □ 7. Đã cân nhắc rewrite WHERE thay vì thêm function index chưa?
     (ví dụ: YEAR(col)=2024 → col BETWEEN '2024-01-01' AND '2024-12-31')
*/

SELECT 'Pitfalls hoàn tất!' AS result;
