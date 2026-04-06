const db = require('./db');

function runQuery(sql, label) {
  return new Promise(resolve => {
    db.query(sql, (err) => {
      if (err && !err.message.includes('Duplicate column')) console.error('Error on', label, ':', err.message);
      else console.log('OK:', label);
      resolve();
    });
  });
}

async function migrate() {
  // Add created_at to customer (ignore if exists)
  await runQuery(
    "ALTER TABLE customer ADD COLUMN created_at DATETIME DEFAULT NOW()",
    "add created_at to customer"
  );
  await runQuery(
    "UPDATE customer SET created_at = NOW() WHERE created_at IS NULL",
    "backfill created_at"
  );
  await runQuery(
    `CREATE TABLE IF NOT EXISTS audit_log (
      log_id INT AUTO_INCREMENT PRIMARY KEY,
      table_name VARCHAR(100),
      action VARCHAR(50),
      old_value TEXT,
      new_value TEXT,
      performed_by VARCHAR(100),
      performed_at DATETIME DEFAULT NOW()
    )`,
    "create audit_log"
  );
  await runQuery(
    `CREATE TABLE IF NOT EXISTS user_privileges (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      privilege_name VARCHAR(100) NOT NULL
    )`,
    "create user_privileges"
  );
  console.log('All migrations done!');
  process.exit(0);
}
migrate();
