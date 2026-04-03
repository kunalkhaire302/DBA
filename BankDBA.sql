CREATE DATABASE bank_db;
USE bank_db;

CREATE TABLE customer (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50),
    phone VARCHAR(15),
    address VARCHAR(100)
);
select *from customer;


CREATE TABLE account (
    account_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    account_type VARCHAR(20),
    balance DECIMAL(10,2),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);
select *from account;


CREATE TABLE transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT,
    amount DECIMAL(10,2),
    type VARCHAR(10),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES account(account_id)
);
select *from transactions;

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50),
    password VARCHAR(50),
    role VARCHAR(20),
    customer_id INT,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);


INSERT INTO customer (name, email, phone, address)
VALUES ('Test Customer', 'cust1@example.com', '1234567890', '123 Test St');

-- Get the last inserted customer ID to link
SET @last_cust_id = LAST_INSERT_ID();

INSERT INTO users (username, password, role, customer_id)
VALUES 
('admin','admin123','admin', NULL),
('teller','teller123','teller', NULL),
('cust1','cust123','customer', @last_cust_id);

