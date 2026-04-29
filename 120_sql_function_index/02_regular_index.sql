-- ============================================================
-- FILE: 02_regular_index.sql
-- MỤC ĐÍCH: Giải thích Regular Index (Index thông thường)
--           và tại sao nó KHÔNG hoạt động với hàm/biểu thức
-- ============================================================

USE demo_function_index;

-- ============================================================
-- PHẦN 1 — Regular Index là gì?
-- ============================================================
/*
  Regular Index (Index thông thường) lưu trữ GIÁ TRỊ GỐC của cột,
  được sắp xếp theo thứ tự để tìm kiếm nhanh.

  Cấu trúc B-Tree bên trong:
      ['Bui Thi Hoa'] ──► row pointer
      ['Dang Van Giang'] ──► row pointer
      ['Hoang Van Em'] ──► row pointer
      ...
  
  Khi WHERE dùng đúng giá trị gốc → MySQL dùng index → nhanh.
  Khi WHERE dùng hàm (LOWER, YEAR, DATE...) → MySQL KHÔNG thể dùng
  index gốc → phải quét toàn bộ bảng (full table scan) → chậm.
*/

-- -------------------------------------------------------
-- 1.1 Tạo Regular Index trên cột full_name và email
-- -------------------------------------------------------
CREATE INDEX idx_full_name ON employees (full_name);
CREATE INDEX idx_email    ON employees (email);
CREATE INDEX idx_birth    ON employees (birth_date);
CREATE INDEX idx_salary   ON employees (salary);

SHOW INDEX FROM employees;

-- -------------------------------------------------------
-- 1.2 Trường hợp Regular Index HOẠT ĐỘNG (index được dùng)
-- -------------------------------------------------------

-- ✅ Tìm chính xác tên (giá trị gốc khớp với index)
EXPLAIN SELECT * FROM employees WHERE full_name = 'Nguyen Van An';
/*  key: idx_full_name   ← index được dùng! */

-- ✅ Tìm theo email chính xác
EXPLAIN SELECT * FROM employees WHERE email = 'tran.thi.binh@company.com';
/*  key: idx_email   ← index được dùng! */

-- ✅ Lọc theo salary range
EXPLAIN SELECT * FROM employees WHERE salary BETWEEN 10000000 AND 15000000;
/*  key: idx_salary   ← index được dùng! */

-- ✅ Tìm theo birth_date chính xác
EXPLAIN SELECT * FROM employees WHERE birth_date = '1990-03-15';
/*  key: idx_birth   ← index được dùng! */

-- -------------------------------------------------------
-- 1.3 Trường hợp Regular Index KHÔNG HOẠT ĐỘNG
--     (dùng hàm → full table scan)
-- -------------------------------------------------------

-- ❌ Tìm tên không phân biệt hoa thường
--    MySQL không so sánh được 'nguyen van an' với index lưu 'Nguyen Van An'
EXPLAIN SELECT * FROM employees WHERE LOWER(full_name) = 'nguyen van an';
/*  type: ALL   ← full table scan! index bị bỏ qua */

-- ❌ Tìm theo email uppercase
EXPLAIN SELECT * FROM employees WHERE UPPER(email) = 'NGUYEN.VAN.AN@COMPANY.COM';
/*  type: ALL   ← full table scan! */

-- ❌ Tìm nhân viên sinh năm 1990
--    Dù có index trên birth_date nhưng YEAR() bọc ngoài làm vô hiệu index
EXPLAIN SELECT * FROM employees WHERE YEAR(birth_date) = 1990;
/*  type: ALL   ← full table scan! */

-- ❌ Tìm nhân viên sinh tháng 3
EXPLAIN SELECT * FROM employees WHERE MONTH(birth_date) = 3;
/*  type: ALL   ← full table scan! */

-- ❌ Lương sau khi chia (tính bonus)
EXPLAIN SELECT * FROM employees WHERE ROUND(salary / 1000) = 12000;
/*  type: ALL   ← full table scan! */

-- -------------------------------------------------------
-- 1.4 Workaround cổ điển: viết lại WHERE để tránh hàm
--     (không phải lúc nào cũng khả thi)
-- -------------------------------------------------------

-- Thay YEAR(birth_date) = 1990  →  dùng range trên cột gốc
EXPLAIN SELECT * FROM employees
WHERE birth_date >= '1990-01-01' AND birth_date < '1991-01-01';
/*  type: range, key: idx_birth   ← index được dùng! */

-- Nhưng LOWER(full_name) = 'nguyen van an'  → KHÔNG thể rewrite đơn giản
-- nếu dữ liệu chứa hoa thường lẫn lộn (ví dụ: 'NGUYEN VAN AN', 'Nguyen Van An')

SELECT 'Phần Regular Index hoàn tất!' AS result;
