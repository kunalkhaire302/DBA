/**
 * init_aiven.js
 * Initializes the NexBank schema on the Aiven-hosted MySQL (defaultdb).
 * Run once:  node init_aiven.js
 */
require("dotenv").config();
const mysql = require("mysql2/promise");

const config = {
    host:               process.env.DB_HOST     || "mysql-180fead7-kunalkhaire302-294e.c.aivencloud.com",
    port:               parseInt(process.env.DB_PORT) || 26832,
    user:               process.env.DB_USER     || "avnadmin",
    password:           process.env.DB_PASSWORD,   // set in .env — never hardcode credentials
    database:           process.env.DB_NAME     || "defaultdb",
    ssl:                { rejectUnauthorized: false },
    multipleStatements: true,
};

const SCHEMA_SQL = `
-- ──────────────────────────────────────────────
--  DROP existing tables (order respects FK deps)
-- ──────────────────────────────────────────────
DROP TABLE IF EXISTS query_logs;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS user_privileges;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS customer;

-- ──────────────────────────────────────────────
--  Core Tables
-- ──────────────────────────────────────────────
CREATE TABLE customer (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(50)  NOT NULL,
    email       VARCHAR(50),
    phone       VARCHAR(15),
    address     VARCHAR(100)
);

CREATE TABLE account (
    account_id   INT PRIMARY KEY AUTO_INCREMENT,
    customer_id  INT,
    account_type VARCHAR(20),
    balance      DECIMAL(10,2),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

CREATE TABLE transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    account_id     INT,
    amount         DECIMAL(10,2),
    type           VARCHAR(10),
    date           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES account(account_id)
);

CREATE TABLE roles (
    role_id    INT PRIMARY KEY AUTO_INCREMENT,
    role_name  VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id     INT PRIMARY KEY AUTO_INCREMENT,
    username    VARCHAR(50)  NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20),
    position    VARCHAR(50),
    email       VARCHAR(100),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_id INT UNIQUE,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

CREATE TABLE user_privileges (
    privilege_id   INT PRIMARY KEY AUTO_INCREMENT,
    user_id        INT,
    privilege_name VARCHAR(50) NOT NULL,
    granted_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by     VARCHAR(50) DEFAULT 'System',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE audit_log (
    log_id       INT PRIMARY KEY AUTO_INCREMENT,
    table_name   VARCHAR(50),
    action       VARCHAR(50),
    old_value    TEXT,
    new_value    TEXT,
    performed_by VARCHAR(50) DEFAULT 'System_User',
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE query_logs (
    log_id           INT PRIMARY KEY AUTO_INCREMENT,
    query_text       TEXT,
    execution_time_ms INT,
    route_called     VARCHAR(100),
    timestamp        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────
--  Seed Data
-- ──────────────────────────────────────────────
INSERT INTO customer (name, email, phone, address)
VALUES ('Test Customer', 'cust1@example.com', '1234567890', '123 Test St');

INSERT INTO roles (role_name, description) VALUES
('admin',    'Administrator with full system access and privilege assignment capabilities'),
('teller',   'Staff member managing customer accounts and processing transactions'),
('customer', 'End-user with view-only access to their own accounts');

INSERT INTO users (username, password, role, position, email, customer_id) VALUES
('admin',  '$2b$10$V6/o2RJ3w6M.FWa3MNwlxulI86wuWvvaXzz6doenKOaAruhmghS.a', 'admin',    'Head Database Administrator', 'admin@nexbank.com',  NULL),
('teller', '$2b$10$oFqiaWPWz9yCo1YkPqZUeeTuEHh5KxSmFZvb75fFsgyalV39Xh.oa', 'teller',   'Senior Branch Teller',        'teller@nexbank.com', NULL),
('cust1',  '$2b$10$qfLcy2eBvLNsUeAvgYx1p.MiUrYYgACVWm45.PibA68BL6OauCpRy', 'customer', NULL,                          'cust1@example.com',  1);

INSERT INTO user_privileges (user_id, privilege_name) VALUES
(1, 'VIEW_ACCOUNTS'), (1, 'MANAGE_CUSTOMERS'), (1, 'PROCESS_TRANSACTIONS'),
(1, 'VIEW_REPORTS'),  (1, 'MANAGE_USERS'),     (1, 'AUDIT_ACCESS'),
(2, 'VIEW_ACCOUNTS'), (2, 'MANAGE_CUSTOMERS'), (2, 'PROCESS_TRANSACTIONS'),
(3, 'VIEW_ACCOUNTS');
`;

// Triggers must be created one at a time (multipleStatements doesn't support DELIMITER)
const TRIGGERS = [
    `CREATE TRIGGER after_account_insert
     AFTER INSERT ON account FOR EACH ROW
     BEGIN
         INSERT INTO audit_log (table_name, action, new_value, performed_by)
         VALUES ('account', 'INSERT', CONCAT('AccID: ', NEW.account_id, ', Bal: ', NEW.balance), COALESCE(@app_user, USER()));
     END`,

    `CREATE TRIGGER after_account_update
     AFTER UPDATE ON account FOR EACH ROW
     BEGIN
         INSERT INTO audit_log (table_name, action, old_value, new_value, performed_by)
         VALUES ('account', 'UPDATE', CONCAT('Bal: ', OLD.balance), CONCAT('Bal: ', NEW.balance), COALESCE(@app_user, USER()));
     END`,

    `CREATE TRIGGER after_account_delete
     AFTER DELETE ON account FOR EACH ROW
     BEGIN
         INSERT INTO audit_log (table_name, action, old_value, performed_by)
         VALUES ('account', 'DELETE', CONCAT('AccID: ', OLD.account_id, ', Bal: ', OLD.balance), COALESCE(@app_user, USER()));
     END`,

    `CREATE TRIGGER after_transaction_insert
     AFTER INSERT ON transactions FOR EACH ROW
     BEGIN
         INSERT INTO audit_log (table_name, action, new_value, performed_by)
         VALUES ('transactions', 'INSERT',
             CONCAT('TxnID: ', NEW.transaction_id, ', Acc: ', NEW.account_id, ', Amt: ', NEW.amount, ', Type: ', NEW.type),
             COALESCE(@app_user, USER()));
     END`,

    `CREATE TRIGGER after_user_insert
     AFTER INSERT ON users FOR EACH ROW
     BEGIN
         IF NEW.role = 'admin' THEN
             INSERT INTO user_privileges (user_id, privilege_name) VALUES
             (NEW.user_id, 'VIEW_ACCOUNTS'), (NEW.user_id, 'MANAGE_CUSTOMERS'),
             (NEW.user_id, 'PROCESS_TRANSACTIONS'), (NEW.user_id, 'VIEW_REPORTS'),
             (NEW.user_id, 'MANAGE_USERS'), (NEW.user_id, 'AUDIT_ACCESS');
         ELSEIF NEW.role = 'teller' THEN
             INSERT INTO user_privileges (user_id, privilege_name) VALUES
             (NEW.user_id, 'VIEW_ACCOUNTS'), (NEW.user_id, 'MANAGE_CUSTOMERS'),
             (NEW.user_id, 'PROCESS_TRANSACTIONS');
         ELSE
             INSERT INTO user_privileges (user_id, privilege_name) VALUES
             (NEW.user_id, 'VIEW_ACCOUNTS');
         END IF;
         INSERT INTO audit_log (table_name, action, new_value, performed_by)
         VALUES ('users', 'INSERT_PRIVS',
             CONCAT('Assigned default privileges for ', NEW.username), 'System_Trigger');
     END`,
];

async function init() {
    let conn;
    try {
        console.log("🔌 Connecting to Aiven MySQL...");
        conn = await mysql.createConnection(config);
        console.log("✅ Connected!\n");

        // Run schema (tables + seed data)
        console.log("📦 Creating tables and seeding data...");
        await conn.query(SCHEMA_SQL);
        console.log("✅ Tables created & seeded.\n");

        // Drop old triggers first
        const triggerNames = [
            "after_account_insert", "after_account_update", "after_account_delete",
            "after_transaction_insert", "after_user_insert"
        ];
        for (const t of triggerNames) {
            await conn.query(`DROP TRIGGER IF EXISTS ${t}`);
        }

        // Create triggers one by one
        console.log("⚡ Creating triggers...");
        for (const sql of TRIGGERS) {
            await conn.query(sql);
            const name = sql.match(/CREATE TRIGGER (\w+)/i)?.[1] || "unknown";
            console.log(`   ✅ Trigger: ${name}`);
        }

        console.log("\n🎉 Aiven database initialized successfully!");
        console.log("   Default logins:");
        console.log("   admin  / admin123");
        console.log("   teller / teller123");
        console.log("   cust1  / customer123");
    } catch (err) {
        console.error("❌ Initialization failed:", err.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

init();
