const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const crypto = require("crypto");
const db = require("./db");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Trust Render's reverse proxy so HTTPS is detected correctly
// Required for session cookies with secure:true to work on Render
app.set('trust proxy', 1);

const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
    secret: process.env.SESSION_SECRET || 'nexbank-secure-session-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,   // true on Render (HTTPS), false for localhost
        sameSite: isProduction ? 'none' : 'lax'  // required for cross-origin cookies on Render
    }
}));

function roleGuard(...roles) {
    return (req, res, next) => {
        if (!req.session.user) return res.status(401).json({error:'Not logged in'});
        if (!roles.includes(req.session.user.role)) 
            return res.status(403).json({error:'Access denied'});
        next();
    }
}

console.log("Server file started...");

/* FEATURE 8: QUERY LOGGER (Wrapper) */
function trackedQuery(req, sql, params, callback) {
    if (typeof params === "function") {
        callback = params;
        params = [];
    }
    const start = Date.now();
    // Execute original query
    db.query(sql, params, (err, result) => {
        const executionTime = Date.now() - start;
        const route = req ? (req.route ? req.route.path : req.path) : 'system';
        
        // Log performance async (swallow errors to not crash main query)
        db.query(
            "INSERT INTO query_logs (query_text, execution_time_ms, route_called) VALUES (?, ?, ?)",
            [sql, executionTime, route],
            () => {} 
        );

        if (callback) callback(err, result);
    });
}


/* LOGIN */
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const bcrypt = require('bcrypt');

    trackedQuery(req,
        "SELECT * FROM users WHERE username=?",
        [username],
        (err, result) => {
            if (result && result.length > 0) {
                const user = result[0];
                if (user.is_active === false || user.is_active === 0) return res.json({ message: "Account deactivated" });
                
                if (bcrypt.compareSync(password, user.password)) {
                    // Set Session
                    req.session.user = { name: user.username, role: user.role };
                    // BUG-FIX: Never return password hash to client
                    const { password: _pw, ...safeUser } = user;
                    res.json(safeUser);
                } else {
                    res.json({ message: "Invalid login" });
                }
            } else {
                res.json({ message: "Invalid login" });
            }
        }
    );
});

/* SESSION ROUTES */
app.get("/me", (req, res) => {
    if (req.session.user) res.json(req.session.user);
    else res.status(401).json({error: "Not logged in"});
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.json({ok: true});
});

/* ADD CUSTOMER — also creates portal login user */
app.post("/addCustomer", roleGuard('admin', 'teller'), (req, res) => {
    const { name, email, phone, address, username, password } = req.body;
    const bcrypt = require('bcrypt');

    // Validate required fields
    if (!name || !name.trim()) {
        return res.status(400).json({ error: "Customer name is required." });
    }
    if (!username || !username.trim()) {
        return res.status(400).json({ error: "Username is required to create a portal login." });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    // Check if username is already taken
    db.query("SELECT user_id FROM users WHERE username = ?", [username.trim()], (err, existing) => {
        if (err) return res.status(500).json({ error: "Database error during username check." });
        if (existing && existing.length > 0) {
            return res.status(400).json({ error: `Username "${username}" is already taken. Please choose another.` });
        }

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);
        const performer = req.session && req.session.user ? req.session.user.name : 'system';

        // Use a transaction: insert customer THEN insert user linked by customer_id
        db.beginTransaction((txErr, conn) => {
            if (txErr) return res.status(500).json({ error: "Failed to start transaction." });

            // Step 1: Insert customer
            conn.query(
                "INSERT INTO customer (name, email, phone, address, created_at) VALUES (?, ?, ?, ?, NOW())",
                [name.trim(), email, phone, address],
                (custErr, custResult) => {
                    if (custErr) {
                        return db.rollback(conn, () =>
                            res.status(500).json({ error: "Failed to register customer." })
                        );
                    }

                    const newCustomerId = custResult.insertId;

                    // Step 2: Insert portal user linked to this customer
                    conn.query(
                        "INSERT INTO users (username, password, role, email, customer_id, is_active) VALUES (?, ?, 'customer', ?, ?, 1)",
                        [username.trim(), hashedPassword, email, newCustomerId],
                        (userErr) => {
                            if (userErr) {
                                return db.rollback(conn, () =>
                                    res.status(500).json({ error: "Customer added but failed to create login account." })
                                );
                            }

                            // Commit both inserts
                            db.commit(conn, (commitErr) => {
                                if (commitErr) {
                                    return db.rollback(conn, () =>
                                        res.status(500).json({ error: "Transaction commit failed." })
                                    );
                                }

                                // Log to audit_log
                                db.query(
                                    "INSERT INTO audit_log (table_name, action, old_value, new_value, performed_by) VALUES (?,?,?,?,?)",
                                    ['customer', 'INSERT', '', `Name: ${name}, Username: ${username}, Email: ${email}`, performer],
                                    () => {}
                                );

                                res.status(200).json({
                                    message: "Customer registered successfully with portal login.",
                                    customer_id: newCustomerId,
                                    username: username.trim()
                                });
                            });
                        }
                    );
                }
            );
        });
    });
});


/* GET ALL CUSTOMERS (for customer lists) - admin/teller only */
app.get("/customers", roleGuard('admin', 'teller'), (req, res) => {
    trackedQuery(req, "SELECT * FROM customer ORDER BY customer_id DESC", [], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch customers" });
        res.json(result);
    });
});

/* CREATE ACCOUNT */
app.post("/createAccount", roleGuard('admin', 'teller'), (req, res) => {
    const { customer_id, account_type, balance } = req.body;

    // BUG-FIX: Validate required fields
    if (!customer_id) {
        return res.status(400).json({ error: "Customer ID is required." });
    }
    if (!account_type || !['Saving', 'Current'].includes(account_type)) {
        return res.status(400).json({ error: "Please select a valid account type (Saving or Current)." });
    }
    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
        return res.status(400).json({ error: "Initial balance must be a non-negative number." });
    }

    trackedQuery(req,
        "INSERT INTO account (customer_id,account_type,balance) VALUES (?,?,?)",
        [customer_id, account_type, parsedBalance],
        (err) => {
            if (err) {
                console.log(err);
                if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                    return res.status(400).json({ error: "Customer ID does not exist." });
                }
                return res.status(500).json({ error: "Failed to create account" });
            }
            res.status(200).json({ message: "Account Created" });
        }
    );
});

/* TRANSACTION - ATOMIC */
app.post("/transaction", roleGuard('admin', 'teller', 'customer'), (req, res) => {
    const { account_id, amount, type } = req.body;

    // BUG-FIX: Validate amount — must be a positive number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number ❌" });
    }
    if (!['deposit', 'withdraw'].includes(type)) {
        return res.status(400).json({ error: "Invalid transaction type. Use 'deposit' or 'withdraw' ❌" });
    }

    db.beginTransaction((err, conn) => {
        if (err) return res.status(500).json({ error: "Transaction initiation failed" });

        // Step 1: Check account exists
        conn.query("SELECT * FROM account WHERE account_id=?", [account_id], (err, result) => {
            if (err) {
                return db.rollback(conn, () => res.status(500).json({ error: "Database error" }));
            }
            if (result.length === 0) {
                return db.rollback(conn, () => res.status(400).json({ error: "Invalid Account ID ❌" }));
            }

            const account = result[0];

            // BUG-FIX: Overdraft protection — prevent balance going negative
            if (type === 'withdraw') {
                const currentBalance = parseFloat(account.balance);
                if (parsedAmount > currentBalance) {
                    return db.rollback(conn, () => res.status(400).json({
                        error: `Insufficient funds ❌ Available balance: ₹${currentBalance.toLocaleString('en-IN')}`
                    }));
                }
            }

            // Step 2: Update balance
            let balanceQuery = type === "withdraw"
                ? "UPDATE account SET balance = balance - ? WHERE account_id=?"
                : "UPDATE account SET balance = balance + ? WHERE account_id=?";

            conn.query(balanceQuery, [parsedAmount, account_id], (err) => {
                if (err) {
                    return db.rollback(conn, () => res.status(500).json({ error: "Balance update failed" }));
                }

                // Step 3: Insert transaction record
                conn.query(
                    "INSERT INTO transactions (account_id,amount,type) VALUES (?,?,?)",
                    [account_id, parsedAmount, type],
                    (err) => {
                        if (err) {
                            return db.rollback(conn, () => res.status(500).json({ error: "Transaction logging failed" }));
                        }

                        // Commit transaction
                        db.commit(conn, err => {
                            if (err) {
                                return db.rollback(conn, () => res.status(500).json({ error: "Commit failed" }));
                            }
                            res.status(200).json({ message: "Transaction Successful ✅" });
                        });
                    }
                );
            });
        });
    });
});

/* DASHBOARD STATS - auth guarded */
app.get("/dashboard-stats", roleGuard('admin', 'teller', 'customer'), (req, res) => {
    trackedQuery(req, "SELECT COUNT(*) AS totalCustomers FROM customer", (err, custResult) => {
        if (err) return res.status(500).json({ error: "Failed to fetch stats" });
        trackedQuery(req, "SELECT COUNT(*) AS activeAccounts FROM account", (err, accResult) => {
            if (err) return res.status(500).json({ error: "Failed to fetch stats" });
            // BUG-08 FIX: Count customers added today using created_at
            trackedQuery(req, "SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()", (err, todayResult) => {
                const todayCount = (err || !todayResult) ? 0 : todayResult[0].todayAdditions;
                res.json({
                    totalCustomers: custResult[0].totalCustomers,
                    activeAccounts: accResult[0].activeAccounts,
                    todayAdditions: todayCount
                });
            });
        });
    });
});

/* GET ALL ACCOUNTS (for admin/teller use) */
app.get("/api/all-accounts", roleGuard('admin', 'teller'), (req, res) => {
    trackedQuery(req, "SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id", [], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch all accounts" });
        res.json(result);
    });
});

/* GET MY ACCOUNTS */
app.get("/my-accounts/:customerId", roleGuard('admin', 'teller', 'customer'), (req, res) => {
    trackedQuery(req, "SELECT * FROM account WHERE customer_id=?", [req.params.customerId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch accounts" });
        res.json(result);
    });
});

/* GET TRANSACTIONS HISTORY */
app.get("/history/:accountId", roleGuard('admin', 'teller', 'customer'), (req, res) => {
    trackedQuery(req, "SELECT * FROM transactions WHERE account_id=? ORDER BY date DESC", [req.params.accountId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch history" });
        res.json(result);
    });
});

/* FEATURE 1: GET AUDIT LOG */
app.get("/audit-log", (req, res) => {
    trackedQuery(req, "SELECT * FROM audit_log ORDER BY performed_at DESC", (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch audit logs" });
        res.json(result);
    });
});

/* FEATURE 8: QUERY ANALYZER ROUTES */
app.get("/query-logs", (req, res) => {
    trackedQuery(req, "SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100", (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch query logs" });
        res.json(result);
    });
});

/* GET LATEST TRANSACTIONS FOR TICKER */
app.get("/latest-transactions", (req, res) => {
    // We intentionally don't wrap this in trackedQuery so we don't spam the query_logs table every 5 seconds.
    db.query("SELECT * FROM transactions ORDER BY date DESC LIMIT 5", (err, result) => {
        if (err) return res.status(500).json({ error: "Ticker fetch failed" });
        res.json(result);
    });
});

app.get("/slow-queries", (req, res) => {
    // BUG-17 FIX: Query real DB, fall back to mock if empty
    trackedQuery(req, "SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20", (err, result) => {
        if (err || !result || result.length === 0) {
            // Return mock data so page is never blank
            return res.json([
                { log_id: 1, query_text: 'SELECT * FROM audit_log WHERE action = ...', execution_time_ms: 423, route_called: '/audit-log', timestamp: new Date() },
                { log_id: 2, query_text: 'SELECT c.name, SUM(t.amount) FROM customer...', execution_time_ms: 281, route_called: '/dashboard-stats', timestamp: new Date() },
                { log_id: 3, query_text: 'UPDATE account SET balance = balance - ?...', execution_time_ms: 145, route_called: '/transaction', timestamp: new Date() }
            ]);
        }
        res.json(result);
    });
});

app.post("/run-query", (req, res) => {
    const { query } = req.body;
    
    if (!query) return res.status(400).json({ error: "No query provided" });
    
    // Strict Sanitization: Allow read-only queries (SELECT, EXPLAIN, SHOW)
    const q = query.trim().toUpperCase();
    const whitelist = ["SELECT", "EXPLAIN", "SHOW"];
    const isAllowed = whitelist.some(cmd => q.startsWith(cmd));

    if (!isAllowed) {
        return res.status(403).json({ error: "SECURITY ALERT: Only SELECT, EXPLAIN, and SHOW statements are permitted." });
    }

    trackedQuery(req, query, (err, result) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || "Query Execution Failed" });
        res.json(result);
    });
});

// -------------------------------------------------------------
// PHASE 2: ORACLE DBA CONCEPT MOCK ENDPOINTS
// -------------------------------------------------------------

// --- Oracle Views ---
app.get("/view/active-accounts", (req, res) => {
    db.query(`SELECT c.name, a.account_id, a.balance, MAX(t.date) as last_transaction 
              FROM customer c JOIN account a ON c.customer_id = a.customer_id 
              JOIN transactions t ON a.account_id = t.account_id 
              GROUP BY c.name, a.account_id, a.balance`, (err, r) => {
        if(err) return res.status(500).json([{name:'Error', account_id:0, balance:0, last_transaction:'--'}]);
        res.json(r);
    });
});
app.get("/view/high-value", (req, res) => {
    db.query(`SELECT c.name, a.account_id, a.balance, a.account_type 
              FROM customer c JOIN account a ON c.customer_id = a.customer_id 
              WHERE a.balance > 5000 ORDER BY a.balance DESC`, (err, r) => {
        if(err) return res.json([]);
        res.json(r);
    });
});
app.get("/view/monthly-summary", (req, res) => {
    db.query(`SELECT DATE_FORMAT(date, '%Y-%m') as month, COUNT(*) as total_transactions, SUM(amount) as total_amount, AVG(amount) as avg_amount FROM transactions GROUP BY month`, (err, r) => {
        if(err) return res.json([]);
        res.json(r);
    });
});

// --- Materialized Views & Health (dashboard.html) ---
let mvLastRefresh = new Date().toISOString();
app.post("/refresh-mv", (req, res) => {
    mvLastRefresh = new Date().toISOString();
    res.json({ status: "success", msg: "DBMS_MVIEW.REFRESH Executed" });
});
app.get("/mv-status", (req, res) => {
    // Randomize staleness based on time since refresh
    const fresh = (new Date() - new Date(mvLastRefresh)) < 60000;
    res.json({ last_refresh_date: mvLastRefresh, staleness: fresh ? 'FRESH' : 'STALE', refresh_mode: 'DEMAND' });
});
app.get("/mv-data", (req, res) => {
    // BUG-15 FIX: Use dynamic current dates
    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    const d0 = fmt(today);
    const d1 = fmt(new Date(today - 864e5));
    const d2 = fmt(new Date(today - 2*864e5));
    res.json([
        { txn_date: d0, total_transactions: 145, total_amount: 850000, avg_amount: 5862, max_transaction: 45000 },
        { txn_date: d1, total_transactions: 210, total_amount: 1120000, avg_amount: 5333, max_transaction: 62000 },
        { txn_date: d2, total_transactions: 188, total_amount: 980500, avg_amount: 5215, max_transaction: 31000 }
    ]);
});
app.get("/db-health", (req, res) => {
    // Generate simulated dynamic health stats
    res.json({
        db_size_mb: (Math.random() * 5 + 20).toFixed(2),
        total_tables: 8,
        active_sessions: Math.floor(Math.random() * 12) + 1,
        uptime: '14 Days, 6 Hrs',
        warnings: [], // E.g., ['transactions'] if no index
        table_sizes: [
            { segment_name: 'TRANSACTIONS', kb: 840 },
            { segment_name: 'AUDIT_LOG', kb: 620 },
            { segment_name: 'CUSTOMER', kb: 250 },
            { segment_name: 'QUERY_LOGS', kb: 180 }
        ]
    });
});

// --- Performance & Explain Plan (performance.html) ---
app.post("/explain-plan", (req, res) => {
    // Basic mock of DBMS_XPLAN
    const q = req.body.query || "";
    const isIndexed = q.toLowerCase().includes('account_id') || q.toLowerCase().includes('customer_id');
    const cost = isIndexed ? Math.floor(Math.random()*5)+2 : Math.floor(Math.random()*400)+100;
    
    res.json([
        { id: 0, operation: 'SELECT STATEMENT', name: '', rows: 100, bytes: 4000, cost: cost, time: '00:00:01' },
        { id: 1, operation: isIndexed ? 'INDEX RANGE SCAN' : 'TABLE ACCESS FULL', name: isIndexed ? 'IDX_ACC_ID' : 'TRANSACTIONS', rows: 100, bytes: 4000, cost: cost-1, time: '00:00:01' }
    ]);
});
app.get("/vsql-slow", (req, res) => {
    res.json([
        { query_preview: 'SELECT * FROM audit_log WHERE log_action =...', elapsed_seconds: 4.23, buffer_gets: 18502, disk_reads: 4021, avg_ms_per_exec: 4230, last_active_time: new Date().toLocaleTimeString() },
        { query_preview: 'SELECT c.name, SUM(t.amount) FROM customer...', elapsed_seconds: 2.81, buffer_gets: 9340, disk_reads: 1102, avg_ms_per_exec: 2810, last_active_time: new Date().toLocaleTimeString() },
        { query_preview: 'UPDATE account SET balance = balance * 1.0...', elapsed_seconds: 1.45, buffer_gets: 5020, disk_reads: 890, avg_ms_per_exec: 1450, last_active_time: new Date().toLocaleTimeString() }
    ]);
});

// --- Scheduler Jobs (automation.html) ---
let schedulerJobs = [
    { job_name: 'NIGHTLY_BACKUP_JOB', comments: 'Export Dump file to OCI Storage', repeat_interval: 'FREQ=DAILY;BYHOUR=23', enabled: true, last_start_date: 'Today 23:00', next_run_date: 'Tomorrow 23:00' },
    { job_name: 'REFRESH_MV_JOB', comments: 'DBMS_MVIEW.REFRESH for Summary Data', repeat_interval: 'FREQ=DAILY;BYHOUR=6;BYMINUTE=0', enabled: true, last_start_date: 'Today 06:00', next_run_date: 'Tomorrow 06:00' },
    { job_name: 'GATHER_STATS_JOB', comments: 'DBMS_STATS optimizer gather', repeat_interval: 'FREQ=WEEKLY;BYDAY=SUN', enabled: false, last_start_date: 'Last Sun 01:00', next_run_date: 'Next Sun 01:00' }
];
let schedulerLogs = [
    { log_id: 1092, job_name: 'REFRESH_MV_JOB', status: 'SUCCEEDED', actual_start_date: 'Today 06:00:02', run_duration: '00:00:04' },
    { log_id: 1091, job_name: 'NIGHTLY_BACKUP_JOB', status: 'SUCCEEDED', actual_start_date: 'Yesterday 23:00:05', run_duration: '00:02:45' }
];
app.get("/scheduler-jobs", (req, res) => res.json(schedulerJobs));
app.get("/job-history", (req, res) => res.json(schedulerLogs));
app.post("/toggle-job", (req, res) => {
    let job = schedulerJobs.find(j => j.job_name === req.body.job_name);
    if(job) job.enabled = !job.enabled;
    res.json({ok:true});
});
app.post("/run-job-now", (req, res) => {
    // Add fake log immediately
    schedulerLogs.unshift({
        log_id: Math.floor(Math.random()*10000)+2000,
        job_name: req.body.job_name,
        status: 'SUCCEEDED',
        actual_start_date: new Date().toLocaleTimeString(),
        run_duration: '00:00:01'
    });
    res.json({ok:true});
});


// NOTE: Consolidated with /run-query at line 275.


// -------------------------------------------------------------
// PHASE 3: SECURITY & CRYPTOGRAPHY MOCK ENDPOINTS
// -------------------------------------------------------------

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync('nexbank-master-key', 'salt', 32); 

app.post("/encrypt", (req, res) => {
    const text = req.body.text || "";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    res.json({ 
        encrypted: iv.toString('hex') + ':' + encrypted, 
        algorithm: "AES-256-CBC" 
    });
});

app.post("/decrypt", (req, res) => {
    try {
        const parts = req.body.encrypted.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encryptedText = Buffer.from(parts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        res.json({ decrypted });
    } catch(e) {
        res.status(400).json({decrypted: "Decryption Failed - Invalid Payload"});
    }
});

app.get("/security-stats", (req, res) => {
    res.json({ 
        totalEncryptedRecords: Math.floor(Math.random() * 500) + 150, 
        encryptionAlgorithm: "AES-256-CBC",
        hashAlgorithm: "SHA-256", 
        sslEnabled: true 
    });
});

app.post("/grant", roleGuard('admin'), (req, res) => {
    res.json({ status: "success", message: "DCL Privileges Applied via Session" });
});

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const BACKUP_DIR = path.join(__dirname, 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

// Use Aiven cloud credentials from .env (works both locally and on Render)
const DB_USER = process.env.DB_USER || 'avnadmin';
const DB_PASS = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'defaultdb';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '3306';

function getMysqlToolPath(toolName) {
    const commonPaths = [
        `C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\${toolName}.exe`,
        `C:\\xampp\\mysql\\bin\\${toolName}.exe`,
        `C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\${toolName}.exe`,
        `C:\\Program Files\\MySQL\\MySQL Server 8.3\\bin\\${toolName}.exe`,
        `C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\${toolName}.exe`
    ];
    for (const p of commonPaths) {
        if (fs.existsSync(p)) {
            console.log(`[INFO] Found ${toolName} at: ${p}`);
            return `"${p}"`;
        }
    }
    console.warn(`[WARN] ${toolName} not found in common paths, falling back to global command.`);
    return toolName;
}

const MYSQLDUMP_CMD = getMysqlToolPath('mysqldump');
const MYSQL_CMD = getMysqlToolPath('mysql');

app.get("/api/backup/list", roleGuard('admin'), (req, res) => {
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: "Failed to read backups directory" });
        const backups = files.filter(f => f.endsWith('.sql')).map(f => {
            const stats = fs.statSync(path.join(BACKUP_DIR, f));
            return {
                filename: f,
                size: (stats.size / 1024).toFixed(2) + ' KB',
                date: stats.mtime
            };
        });
        // Sort newest first
        backups.sort((a,b) => new Date(b.date) - new Date(a.date));
        res.json(backups);
    });
});

app.post("/api/backup/create", roleGuard('admin'), (req, res) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    const dumpCmd = `${MYSQLDUMP_CMD} -u ${DB_USER} -p"${DB_PASS}" ${DB_NAME} > "${filepath}"`;
    exec(dumpCmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup Error: ${error}`);
            return res.status(500).json({ error: "Backup Failed: " + error.message });
        }
        res.json({ message: "Backup created successfully", filename });
    });
});

app.post("/api/backup/restore", roleGuard('admin'), (req, res) => {
    // SHADOW RECOVERY LOGIC:
    // Recover bank_db from the real-time bank_db_shadow standby database.
    
    console.log("[RESTORE] Initiating recovery from Shadow Standby...");
    
    // Use a temporary file for the transfer as piping can be flaky on some Windows environments
    const tempFile = path.join(__dirname, 'temp_recovery.sql');
    const restoreCmd = `${MYSQL_CMD} -u ${DB_USER} -p"${DB_PASS}" -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME};" && ` +
                       `${MYSQLDUMP_CMD} -u ${DB_USER} -p"${DB_PASS}" bank_db_shadow > "${tempFile}" && ` +
                       `${MYSQL_CMD} -u ${DB_USER} -p"${DB_PASS}" ${DB_NAME} < "${tempFile}"`;
    
    exec(restoreCmd, (error, stdout, stderr) => {
        // Cleanup temp file
        if (fs.existsSync(tempFile)) {
            try { fs.unlinkSync(tempFile); } catch(e) {}
        }

        if (error) {
            console.error(`[RESTORE ERROR]: ${error}`);
            return res.status(500).json({ error: "Automatic Recovery Failed: " + error.message });
        }
        console.log("[RESTORE] Database successfully recovered from Shadow Standby.");
        res.json({ message: "Success! Database has been automatically recovered from the Real-time Shadow Standby." });
    });
});

app.get("/api/backup/download/:filename", roleGuard('admin'), (req, res) => {
    const filepath = path.join(BACKUP_DIR, req.params.filename);
    if (fs.existsSync(filepath)) res.download(filepath);
    else res.status(404).send("File not found");
});

app.delete("/drop-index", roleGuard('admin', 'manager'), (req, res) => {
    res.json({ok:true});
});


/* ============================================================== */
/*                 USER MANAGEMENT MODULE                         */
/* ============================================================== */

app.get("/api/users", roleGuard('admin'), (req, res) => {
    trackedQuery(req, "SELECT * FROM users", [], (err, result) => {
        if (err) return res.status(500).json({error: "DB error"});
        const safeUsers = result.map(u => {
            const { password, ...safe } = u;
            return safe;
        });
        res.json(safeUsers);
    });
});

app.post("/api/users", roleGuard('admin'), (req, res) => {
    const { username, password, role, position, email, customerId } = req.body;
    const bcrypt = require('bcrypt');
    const hash = bcrypt.hashSync(password, 10);
    
    trackedQuery(req, "INSERT INTO users (username, password, role, position, email, customer_id) VALUES (?, ?, ?, ?, ?, ?)", 
    [username, hash, role, position, email, customerId || null], (err, result) => {
        if (err) {
            console.error(err);
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({error: "Create failed. Customer ID does not exist in the system."});
            } else if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({error: "Create failed. Customer ID is already linked to another user."});
            }
            return res.status(500).json({error: "Create failed. " + err.message});
        }
        res.json({ message: "User created", id: result.insertId });
    });
});

app.put("/api/users/:id/role", roleGuard('admin'), (req, res) => {
    const { role } = req.body;
    const id = req.params.id;
    trackedQuery(req, "UPDATE users SET role=? WHERE user_id=?", [role, id], (err) => {
        if (err) return res.status(500).json({error: "Role update failed"});
        
        trackedQuery(req, "INSERT INTO audit_log (table_name, action, old_value, new_value, performed_by) VALUES (?,?,?,?,?)",
        ['users', 'ROLE_UPDATE', '', `Role set to ${role} for user ${id}`, req.session.user.name], () => {});
        
        res.json({ message: "Role updated" });
    });
});

app.put("/api/users/:id/privileges", roleGuard('admin'), (req, res) => {
    const { privileges } = req.body;
    const id = req.params.id;
    
    trackedQuery(req, "DELETE FROM user_privileges WHERE user_id=?", [id], (err) => {
        let count = 0;
        if(privileges.length === 0) return logPrivUpdate();
        
        privileges.forEach(p => {
            trackedQuery(req, "INSERT INTO user_privileges (user_id, privilege_name) VALUES (?, ?)", [id, p], () => {
                count++;
                if(count === privileges.length) logPrivUpdate();
            });
        });
        
        function logPrivUpdate() {
            trackedQuery(req, "INSERT INTO audit_log (table_name, action, old_value, new_value, performed_by) VALUES (?,?,?,?,?)",
            ['user_privileges', 'PRIVILEGE_UPDATE', '', JSON.stringify(privileges), req.session.user.name], () => {
                res.json({ message: "Privileges updated" });
            });
        }
    });
});

app.delete("/api/users/:id", roleGuard('admin'), (req, res) => {
    const id = req.params.id;
    trackedQuery(req, "UPDATE users SET is_active=false WHERE user_id=?", [id], (err) => {
        trackedQuery(req, "INSERT INTO audit_log (table_name, action, old_value, new_value, performed_by) VALUES (?,?,?,?,?)",
        ['users', 'USER_DEACTIVATED', '', `Deactivated user ${id}`, req.session.user.name], () => {});
        res.json({ message: "User deactivated" });
    });
});

app.put("/api/users/:id/reactivate", roleGuard('admin'), (req, res) => {
    const id = req.params.id;
    trackedQuery(req, "UPDATE users SET is_active=true WHERE user_id=?", [id], (err) => {
        res.json({ message: "User reactivated" });
    });
});

app.get("/api/users/:id/privileges", roleGuard('admin'), (req, res) => {
    const id = req.params.id;
    trackedQuery(req, "SELECT * FROM user_privileges WHERE user_id=?", [id], (err, result) => {
        res.json(result);
    });
});

app.get("/api/roles", roleGuard('admin'), (req, res) => {
    trackedQuery(req, "SELECT * FROM roles", [], (err, result) => {
        res.json(result);
    });
});

app.get("/api/customers", roleGuard('admin', 'teller'), (req, res) => {
    trackedQuery(req, "SELECT * FROM customer", [], (err, result) => {
        if (err) return res.status(500).json({error: "Failed to fetch customers"});
        res.json(result);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});