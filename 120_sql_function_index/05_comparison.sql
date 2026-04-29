-- ============================================================
-- FILE: 05_comparison.sql
-- MỤC ĐÍCH: So sánh trực tiếp Regular Index vs Function Index
--           Bảng tổng hợp, benchmark pattern, và best practices
-- ============================================================

USE demo_function_index;

-- ============================================================
-- SO SÁNH NHANH: EXPLAIN trước và sau khi thêm function index
-- ============================================================

-- ── Test Case A: Tìm email không phân biệt hoa thường ──────

-- Xóa function index tạm thời để quan sát sự khác biệt
DROP INDEX idx_email_lower ON employees;

-- TRƯỚC (chỉ có regular index)
EXPLAIN SELECT id, full_name FROM employees
WHERE LOWER(email) = 'le.van.cuong@company.com';
/*
  ┌──────────────────────────────────────────────────────────┐
  │ type: ALL  │ key: NULL  │ rows: 100  │ Extra: Using where │
  └──────────────────────────────────────────────────────────┘
  → Đọc 100 dòng, không dùng index
*/

-- Tạo lại function index
CREATE INDEX idx_email_lower ON employees ((LOWER(email)));

-- SAU (có function index)
EXPLAIN SELECT id, full_name FROM employees
WHERE LOWER(email) = 'le.van.cuong@company.com';
/*
  ┌──────────────────────────────────────────────────────────────┐
  │ type: ref  │ key: idx_email_lower  │ rows: 1  │ Extra: NULL  │
  └──────────────────────────────────────────────────────────────┘
  → Đọc đúng 1 dòng, dùng function index!
*/

-- ── Test Case B: Tìm theo năm sinh ─────────────────────────
DROP INDEX idx_birth_year ON employees;

-- TRƯỚC
EXPLAIN SELECT * FROM employees WHERE YEAR(birth_date) = 1988;
-- type: ALL, rows: 100

CREATE INDEX idx_birth_year ON employees ((YEAR(birth_date)));

-- SAU
EXPLAIN SELECT * FROM employees WHERE YEAR(birth_date) = 1988;
-- type: ref  hoặc range, rows: ít hơn


-- ============================================================
-- BẢNG SO SÁNH TỔNG HỢP (dạng comment để tham khảo nhanh)
-- ============================================================
/*
╔══════════════════════════╦════════════════════════╦═════════════════════════════╗
║ Tiêu chí                 ║ Regular Index          ║ Function Index              ║
╠══════════════════════════╬════════════════════════╬═════════════════════════════╣
║ Lưu trữ                  ║ Giá trị gốc của cột    ║ Kết quả của hàm/biểu thức  ║
╠══════════════════════════╬════════════════════════╬═════════════════════════════╣
║ Cú pháp                  ║ INDEX (column)         ║ INDEX ((expr))              ║
╠══════════════════════════╬════════════════════════╬═════════════════════════════╣
║ Hiệu quả với hàm         ║ ❌ Không               ║ ✅ Có                       ║
╠══════════════════════════╬════════════════════════╬═════════════════════════════╣
║ Hiệu quả với giá trị gốc ║ ✅ Có                  ║ ❌ Không (không thay thế)   ║
╠══════════════════════════╬════════════════════════╬═════════════════════════════╣
║ Chi phí lưu trữ          ║ Thấp                   ║ Cao hơn (lưu thêm kết quả) ║
╠══════════════════════════╬════════════════════════╬═════════════════════════════╣
║ Chi phí INSERT/UPDATE    ║ Thấp                   ║ Cao hơn (tính lại expr)     ║
╠══════════════════════════╬════════════════════════╬═════════════════════════════╣
║ Hỗ trợ ORDER BY          ║ ✅ Có                  ║ ✅ Có (với cùng expression)  ║
╠══════════════════════════╬════════════════════════╬═════════════════════════════╣
║ Hỗ trợ UNIQUE            ║ ✅ Có                  ║ ✅ Có                       ║
╠══════════════════════════╬════════════════════════╬═════════════════════════════╣
║ MySQL version yêu cầu    ║ Tất cả                 ║ >= 8.0.13                   ║
╠══════════════════════════╬════════════════════════╬═════════════════════════════╣
║ Phù hợp khi              ║ WHERE col = val        ║ WHERE func(col) = val       ║
║                          ║ col BETWEEN a AND b    ║ WHERE YEAR(col) = 2024      ║
║                          ║ ORDER BY col           ║ WHERE LOWER(col) = 'abc'    ║
╚══════════════════════════╩════════════════════════╩═════════════════════════════╝
*/

-- ============================================================
-- BEST PRACTICES — Khi nào dùng Function Index?
-- ============================================================
/*
  ✅ NÊN DÙNG khi:
  1. Query thường xuyên dùng hàm (LOWER, UPPER, YEAR, MONTH, DATE...)
  2. Dữ liệu nhập không nhất quán hoa/thường (case-insensitive search)
  3. Lọc theo thành phần thời gian (theo ngày, tháng, năm, giờ)
  4. Cần index trên biểu thức tính toán (JSON path, string manipulation)

  ❌ KHÔNG NÊN DÙNG khi:
  1. Query hiếm khi dùng hàm (tạo index tốn chi phí mà không dùng)
  2. Bảng nhỏ (<1000 dòng) — full scan đủ nhanh rồi
  3. Bảng có tỷ lệ INSERT/UPDATE cao → index cần rebuild liên tục
  4. Có thể rewrite WHERE mà không cần hàm (dùng range thay cho YEAR())

  💡 MẸO:
  - Luôn dùng EXPLAIN để kiểm tra trước khi tạo index
  - Dùng EXPLAIN ANALYZE để đo thời gian thực tế (MySQL 8.0+)
  - Một function index KHÔNG thay thế regular index, hai cái bổ sung cho nhau
  - Nếu collation là utf8mb4_unicode_ci hoặc _bin, cân nhắc dùng LOWER()
    hay chỉnh collation thay vì function index
*/

-- ============================================================
-- DEMO: Function Index cũng hỗ trợ UNIQUE
-- ============================================================

-- Đảm bảo mỗi email (lowercase) là duy nhất, dù nhập hoa hay thường
ALTER TABLE employees DROP INDEX idx_email_lower;

CREATE UNIQUE INDEX idx_email_lower_unique
    ON employees ((LOWER(email)));

-- Thử chèn email trùng (chỉ khác hoa thường) — sẽ bị lỗi duplicate
-- INSERT INTO employees (full_name, email, birth_date, salary, department)
-- VALUES ('Test User', 'NGUYEN.VAN.AN@COMPANY.COM', '2000-01-01', 5000000, 'IT');
-- → ERROR 1062 (23000): Duplicate entry 'nguyen.van.an@company.com' for key 'idx_email_lower_unique'

-- ============================================================
-- DEMO: Function Index với ORDER BY
-- ============================================================

-- Sắp xếp tên theo thứ tự alphabetical không phân biệt hoa thường
CREATE INDEX idx_name_sort ON employees ((LOWER(full_name)));

EXPLAIN SELECT id, full_name
FROM employees
ORDER BY LOWER(full_name)
LIMIT 10;
/*  key: idx_name_sort, Extra: Using index  ← không cần filesort! */

SELECT id, full_name
FROM employees
ORDER BY LOWER(full_name)
LIMIT 10;

SELECT 'So sánh hoàn tất!' AS result;
