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

-- --------------------------------------------------------------------------
-- FEATURE 1: AUDIT LOG AND TRIGGERS
-- --------------------------------------------------------------------------

CREATE TABLE audit_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(50),
    action VARCHAR(10),
    old_value TEXT,
    new_value TEXT,
    performed_by VARCHAR(50) DEFAULT 'System_User',
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DELIMITER //

-- Triggers for Account Table
CREATE TRIGGER after_account_insert
AFTER INSERT ON account
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, new_value, performed_by)
    VALUES ('account', 'INSERT', CONCAT('AccID: ', NEW.account_id, ', Bal: ', NEW.balance), COALESCE(@app_user, USER()));
END //

CREATE TRIGGER after_account_update
AFTER UPDATE ON account
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, old_value, new_value, performed_by)
    VALUES ('account', 'UPDATE', CONCAT('Bal: ', OLD.balance), CONCAT('Bal: ', NEW.balance), COALESCE(@app_user, USER()));
END //

CREATE TRIGGER after_account_delete
AFTER DELETE ON account
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, old_value, performed_by)
    VALUES ('account', 'DELETE', CONCAT('AccID: ', OLD.account_id, ', Bal: ', OLD.balance), COALESCE(@app_user, USER()));
END //


-- Trigger for Transactions Table
CREATE TRIGGER after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, new_value, performed_by)
    VALUES ('transactions', 'INSERT', CONCAT('TxnID: ', NEW.transaction_id, ', Acc: ', NEW.account_id, ', Amt: ', NEW.amount, ', Type: ', NEW.type), COALESCE(@app_user, USER()));
END //

DELIMITER ;

-- --------------------------------------------------------------------------
-- FEATURE 8: QUERY ANALYZER LOGS
-- --------------------------------------------------------------------------
CREATE TABLE query_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    query_text TEXT,
    execution_time_ms INT,
    route_called VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- --------------------------------------------------------------------------
-- ORACLE SQL SUBMISSION REQUIREMENTS BELOW
-- NOTE: The following syntax is explicitly Oracle PL/SQL.
-- It is commented here for grading submission but mocked in Node.js 
-- to protect the local MySQL environment.
-- --------------------------------------------------------------------------
/*
CREATE OR REPLACE VIEW active_accounts_view AS
SELECT c.name, a.account_id, a.balance, MAX(t.timestamp) as last_transaction
FROM customer c
JOIN account a ON c.customer_id = a.customer_id
JOIN transactions t ON a.account_id = t.account_id
WHERE t.date >= SYSDATE - 30
GROUP BY c.name, a.account_id, a.balance;

CREATE OR REPLACE VIEW high_value_accounts_view AS
SELECT c.name, a.account_id, a.balance, a.account_type
FROM customer c JOIN account a ON c.customer_id = a.customer_id
WHERE a.balance > 50000
ORDER BY a.balance DESC;

CREATE OR REPLACE VIEW monthly_summary_view AS
SELECT TO_CHAR(date,'MON-YYYY') as month, COUNT(*) as total_transactions,
SUM(amount) as total_amount, AVG(amount) as avg_amount
FROM transactions GROUP BY TO_CHAR(date,'MON-YYYY');

CREATE MATERIALIZED VIEW daily_transaction_summary_mv
BUILD IMMEDIATE REFRESH COMPLETE ON DEMAND AS
SELECT TRUNC(date) as txn_date, COUNT(*) as total_transactions, SUM(amount) as total_amount,
AVG(amount) as avg_amount, MAX(amount) as max_transaction
FROM transactions GROUP BY TRUNC(date);

BEGIN
  DBMS_SCHEDULER.CREATE_JOB(job_name => 'NIGHTLY_BACKUP_JOB', job_type => 'PLSQL_BLOCK', job_action => 'BEGIN DBMS_BACKUP_RESTORE; END;', start_date => SYSTIMESTAMP, repeat_interval => 'FREQ=DAILY;BYHOUR=23;BYMINUTE=59', enabled => TRUE);
  DBMS_SCHEDULER.CREATE_JOB(job_name => 'REFRESH_MV_JOB', job_type => 'PLSQL_BLOCK', job_action => 'BEGIN DBMS_MVIEW.REFRESH(''DAILY_TRANSACTION_SUMMARY_MV'',''C''); END;', start_date => SYSTIMESTAMP, repeat_interval => 'FREQ=DAILY;BYHOUR=6;BYMINUTE=0', enabled => TRUE);
END;
/
*/
