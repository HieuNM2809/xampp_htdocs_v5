-- ============================================================
-- FILE: 01_setup.sql
-- MỤC ĐÍCH: Tạo database và các bảng demo
-- ============================================================

-- Tạo database (MySQL)
CREATE DATABASE IF NOT EXISTS demo_function_index
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE demo_function_index;

-- -------------------------------------------------------
-- Bảng 1: employees — dùng cho ví dụ cơ bản
-- -------------------------------------------------------
DROP TABLE IF EXISTS employees;
CREATE TABLE employees (
    id         INT          NOT NULL AUTO_INCREMENT,
    full_name  VARCHAR(100) NOT NULL,        -- họ tên, có thể viết hoa/thường lẫn lộn
    email      VARCHAR(150) NOT NULL,        -- email, nhập liệu có thể lẫn chữ hoa
    birth_date DATE         NOT NULL,
    salary     DECIMAL(12,2) NOT NULL,
    department VARCHAR(50)  NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- Bảng 2: orders — dùng cho ví dụ nâng cao
-- -------------------------------------------------------
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    order_id     INT            NOT NULL AUTO_INCREMENT,
    customer_id  INT            NOT NULL,
    order_date   DATETIME       NOT NULL,
    total_amount DECIMAL(12,2)  NOT NULL,
    status       VARCHAR(20)    NOT NULL DEFAULT 'pending',
    note         TEXT,
    PRIMARY KEY (order_id)
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- Nạp dữ liệu mẫu — employees (100 dòng giả lập)
-- -------------------------------------------------------
INSERT INTO employees (full_name, email, birth_date, salary, department) VALUES
('Nguyen Van An',       'Nguyen.Van.An@Company.COM',   '1990-03-15', 12000000, 'IT'),
('TRAN THI BINH',       'tran.thi.binh@company.com',   '1985-07-22', 15000000, 'HR'),
('Le Van Cuong',        'LE.VAN.CUONG@COMPANY.COM',    '1992-11-01', 9000000,  'IT'),
('Pham Thi Dung',       'pham.thi.dung@company.com',   '1988-05-30', 18000000, 'Finance'),
('Hoang Van Em',        'Hoang.Van.Em@Company.Com',    '1995-01-10', 8500000,  'IT'),
('Vo Thi Phuong',       'vo.thi.phuong@company.com',   '1991-09-18', 11000000, 'Marketing'),
('Dang Van Giang',      'DANG.VAN.GIANG@COMPANY.COM',  '1987-04-25', 22000000, 'Finance'),
('Bui Thi Hoa',         'bui.thi.hoa@company.com',     '1993-12-05', 10500000, 'HR'),
('Nguyen Van Hung',     'Nguyen.Van.Hung@Company.COM', '1989-08-14', 13000000, 'IT'),
('Tran Van Khanh',      'tran.van.khanh@company.com',  '1996-02-28', 7800000,  'Marketing');

-- Thêm 90 dòng tự động
INSERT INTO employees (full_name, email, birth_date, salary, department)
SELECT
    CONCAT('Employee_', n),
    CONCAT('employee_', n, '@company.com'),
    DATE_ADD('1980-01-01', INTERVAL FLOOR(RAND()*5000) DAY),
    FLOOR(7000000 + RAND() * 20000000),
    ELT(1 + FLOOR(RAND() * 4), 'IT', 'HR', 'Finance', 'Marketing')
FROM (
    WITH RECURSIVE seq(n) AS (
        SELECT 11
        UNION ALL
        SELECT n + 1 FROM seq WHERE n < 100
    )
    SELECT n FROM seq
) AS nums;

-- -------------------------------------------------------
-- Nạp dữ liệu mẫu — orders (200 dòng)
-- -------------------------------------------------------
INSERT INTO orders (customer_id, order_date, total_amount, status)
SELECT
    FLOOR(1 + RAND() * 50),
    DATE_ADD('2023-01-01', INTERVAL FLOOR(RAND() * 730) DAY
           + INTERVAL FLOOR(RAND() * 86400) SECOND),
    ROUND(100000 + RAND() * 9900000, 2),
    ELT(1 + FLOOR(RAND() * 4), 'pending', 'processing', 'completed', 'cancelled')
FROM (
    WITH RECURSIVE seq(n) AS (
        SELECT 1
        UNION ALL
        SELECT n + 1 FROM seq WHERE n < 200
    )
    SELECT n FROM seq
) AS nums;

SELECT 'Setup hoàn tất!' AS result;
