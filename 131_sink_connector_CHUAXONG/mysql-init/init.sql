CREATE DATABASE IF NOT EXISTS mydb;
USE mydb;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email) VALUES 
('Nguyen Van A', 'a@example.com'),
('Tran Thi B', 'b@example.com');
