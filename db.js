require("dotenv").config();
const mysql = require("mysql2");

// ─────────────────────────────────────────────────────────
//  Aiven Cloud MySQL Configuration (SSL REQUIRED)
// ─────────────────────────────────────────────────────────
const dbConfig = {
    host: process.env.DB_HOST || "mysql-180fead7-kunalkhaire302-294e.c.aivencloud.com",
    port: parseInt(process.env.DB_PORT) || 26832,
    user: process.env.DB_USER || "avnadmin",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "defaultdb",
    ssl: {
        rejectUnauthorized: false   // Aiven uses a self-signed CA; set to true + add CA cert for stricter security
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000
};

// ─────────────────────────────────────────────────────────
//  Primary Database Pool  (Aiven – defaultdb)
// ─────────────────────────────────────────────────────────
const pool = mysql.createPool(dbConfig);

// ─────────────────────────────────────────────────────────
//  Shadow / Standby Pool
//  In cloud deployments, the shadow uses the same Aiven
//  instance unless a separate replica is configured.
// ─────────────────────────────────────────────────────────
const shadowPool = mysql.createPool(dbConfig);

console.log("☁️  Aiven Cloud MySQL – Real-time Sync Engine Initialized.");
console.log(`   Host : ${dbConfig.host}:${dbConfig.port}`);
console.log(`   DB   : ${dbConfig.database}`);
console.log(`   SSL  : REQUIRED`);

// ── Health Checks ──────────────────────────────────────────
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Primary Database Connection Failed:", err.message);
    } else {
        console.log("✅ Primary Database Connected (Aiven – defaultdb)");
        connection.release();
    }
});

shadowPool.getConnection((err, connection) => {
    if (err) {
        console.warn("⚠️  Shadow Database Connection Failed:", err.message);
    } else {
        console.log("✅ Shadow Standby Database Connected (Aiven – defaultdb)");
        connection.release();
    }
});

// ─────────────────────────────────────────────────────────
//  db wrapper – mirrors mutating queries to shadow pool
// ─────────────────────────────────────────────────────────
const db = {
    /**
     * Executes a query on the primary database.
     * Mutating statements (INSERT, UPDATE, DELETE …) are
     * automatically mirrored to the shadow pool.
     */
    query: (sql, params, cb) => {
        if (typeof params === "function") {
            cb = params;
            params = [];
        }

        return pool.query(sql, params, (err, result) => {
            const isMutating = /^(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE|TRUNCATE)/i.test(sql.trim());

            if (!err && isMutating) {
                shadowPool.query(sql, params, (syncErr) => {
                    if (syncErr) {
                        console.warn("[SHADOW SYNC ERROR]: Standby database sync failed.", {
                            message: syncErr.message,
                            sqlSnippet: sql.substring(0, 100)
                        });
                    }
                });
            }

            if (cb) cb(err, result);
        });
    },

    beginTransaction: (cb) =>
        pool.getConnection((err, conn) => {
            if (err) return cb(err);

            const originalQuery = conn.query.bind(conn);
            conn.query = (sql, params, callback) => {
                if (typeof params === "function") {
                    callback = params;
                    params = [];
                }

                return originalQuery(sql, params, (qErr, qRes) => {
                    const isMutating = /^(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE|TRUNCATE)/i.test(sql.trim());
                    if (!qErr && isMutating) {
                        shadowPool.query(sql, params, (sErr) => {
                            if (sErr) {
                                console.warn("[SHADOW SYNC ERROR]: Transaction query sync failed.", {
                                    message: sErr.message,
                                    sqlSnippet: sql.substring(0, 100)
                                });
                            }
                        });
                    }
                    if (callback) callback(qErr, qRes);
                });
            };

            conn.beginTransaction((txErr) => {
                if (txErr) {
                    conn.release();
                    return cb(txErr);
                }
                cb(null, conn);
            });
        }),

    commit: (conn, cb) =>
        conn.commit((err) => {
            conn.release();
            cb(err);
        }),

    rollback: (conn, cb) =>
        conn.rollback(() => {
            conn.release();
            cb();
        })
};

module.exports = db;