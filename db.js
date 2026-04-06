const mysql = require("mysql2");

// Configuration from db.real.js
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Sys#123@",
    database: "bank_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("Real MySQL Database Pool Initialized.");

// Simple health check
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database Connection Failed:", err.message);
    } else {
        console.log("✅ Database Connected Successfully");
        connection.release();
    }
});

// Wrapper to match the SQL-only interface
const db = {
    query: (sql, params, cb) => {
        if (typeof params === 'function') {
            cb = params;
            params = [];
        }
        return pool.query(sql, params, cb);
    },
    beginTransaction: (cb) => pool.getConnection((err, conn) => {
        if (err) return cb(err);
        conn.beginTransaction(err => {
            if (err) {
                conn.release();
                return cb(err);
            }
            // Add custom rollback/commit to the connection instance
            cb(null, conn);
        });
    }),
    // Re-expose legacy methods if used directly, though server.js mostly uses db.query
    commit: (conn, cb) => conn.commit(err => {
        conn.release();
        cb(err);
    }),
    rollback: (conn, cb) => conn.rollback(() => {
        conn.release();
        cb();
    })
};

module.exports = db;