-- ============================================================
-- FILE: 03_function_index_basic.sql
-- MỤC ĐÍCH: Function Index (Functional Index) là gì?
--           Ví dụ cơ bản - MySQL 8.0+
-- ============================================================

USE demo_function_index;

-- ============================================================
-- PHẦN 1 — Function Index là gì?
-- ============================================================
/*
  Function Index (hay Functional Index / Expression Index) lưu trữ
  KẾT QUẢ CỦA MỘT HÀM/BIỂU THỨC thay vì giá trị gốc của cột.

  Cách MySQL thực hiện bên trong:
  1. MySQL thêm một cột ẨO (virtual/generated column) vào bảng
  2. Tạo index trên cột ẩn đó
  3. Khi query dùng hàm đúng với function index → optimizer tự dùng

  CÚ PHÁP:
      CREATE INDEX idx_name ON table ((expression));
      ──────────────────────────────────────────────
      Chú ý: expression phải bọc trong (( )) — hai cặp ngoặc!
             ngoặc ngoài = cú pháp CREATE INDEX
             ngoặc trong = đánh dấu đây là expression, không phải tên cột
  
  YÊU CẦU:
  - MySQL >=  8.0.13  (stable, recommended)
  - PostgreSQL >= 7.x  (hỗ trợ từ rất lâu)
  - Oracle: dùng tên "Function-Based Index"
  - SQL Server: dùng "Computed Column Index" (tương đương)
*/

-- ============================================================
-- VÍ DỤ 1: Tìm kiếm không phân biệt hoa thường (case-insensitive)
-- ============================================================

-- ── Bước 1: Xem vấn đề hiện tại ──
-- Email được nhập liệu lộn xộn: 'Nguyen.Van.An@Company.COM', 'tran.thi.binh@company.com'...
-- Nếu muốn tìm không phân biệt hoa thường:
EXPLAIN SELECT * FROM employees WHERE LOWER(email) = 'nguyen.van.an@company.com';
-- → type: ALL  ← Full scan vì LOWER() ngăn dùng idx_email

-- ── Bước 2: Tạo Function Index trên LOWER(email) ──
CREATE INDEX idx_email_lower
    ON employees ((LOWER(email)));   -- ← hai cặp ngoặc!

-- ── Bước 3: Kiểm tra index đã được tạo ──
SHOW INDEX FROM employees;
-- Thấy "Expression" trong cột Key_name, Expression chứa 'lower(`email`)'

-- ── Bước 4: Chạy lại EXPLAIN — MySQL tự nhận ra dùng function index ──
EXPLAIN SELECT * FROM employees WHERE LOWER(email) = 'nguyen.van.an@company.com';
/*
  type: ref
  key:  idx_email_lower    ← function index được dùng tự động!
  rows: 1
*/

-- ── Kết quả thực tế ──
SELECT id, full_name, email
FROM employees
WHERE LOWER(email) = 'nguyen.van.an@company.com';

-- ── So sánh: Regular index vẫn dùng được khi tìm chính xác ──
EXPLAIN SELECT * FROM employees WHERE email = 'tran.thi.binh@company.com';
-- key: idx_email  ← regular index vẫn dùng cho query chính xác

-- ============================================================
-- VÍ DỤ 2: Tìm theo tên không phân biệt hoa thường
-- ============================================================

CREATE INDEX idx_name_lower
    ON employees ((LOWER(full_name)));

EXPLAIN SELECT * FROM employees WHERE LOWER(full_name) = 'tran thi binh';
/*  key: idx_name_lower   ← function index được dùng! */

SELECT id, full_name, department
FROM employees
WHERE LOWER(full_name) = 'tran thi binh';

-- ============================================================
-- VÍ DỤ 3: Tìm kiếm theo năm sinh
-- ============================================================

-- ── Không có function index (chỉ có regular index) ──
EXPLAIN SELECT * FROM employees WHERE YEAR(birth_date) = 1990;
-- type: ALL  ← full scan dù có idx_birth

-- ── Tạo Function Index trên YEAR(birth_date) ──
CREATE INDEX idx_birth_year
    ON employees ((YEAR(birth_date)));

EXPLAIN SELECT * FROM employees WHERE YEAR(birth_date) = 1990;
/*  key: idx_birth_year   ← function index được dùng! */

SELECT id, full_name, birth_date
FROM employees
WHERE YEAR(birth_date) = 1990;

-- ── Tìm theo tháng ──
CREATE INDEX idx_birth_month
    ON employees ((MONTH(birth_date)));

EXPLAIN SELECT * FROM employees WHERE MONTH(birth_date) = 3;
/*  key: idx_birth_month  ← function index được dùng! */

-- ============================================================
-- VÍ DỤ 4: Biểu thức tính toán trên salary
-- ============================================================

-- Tìm nhân viên có lương (tính theo nghìn đồng) = 12000 (tức 12,000,000đ)
CREATE INDEX idx_salary_k
    ON employees ((ROUND(salary / 1000)));

EXPLAIN SELECT * FROM employees
WHERE ROUND(salary / 1000) = 12000;
/*  key: idx_salary_k  ← function index được dùng! */

SELECT id, full_name, salary, ROUND(salary / 1000) AS salary_k
FROM employees
WHERE ROUND(salary / 1000) = 12000;

SELECT 'Phần Function Index cơ bản hoàn tất!' AS result;
