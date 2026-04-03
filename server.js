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

app.use(session({
    secret: 'nexbank-secure-session-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // false since no HTTPS for localhost
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

    trackedQuery(req,
        "SELECT * FROM users WHERE username=? AND password=?",
        [username, password],
        (err, result) => {
            if (result.length > 0) {
                // Set Session
                req.session.user = { name: result[0].username, role: result[0].role };
                res.json(result[0]);
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

/* ADD CUSTOMER */
app.post("/addCustomer", (req, res) => {
    const { name, email, phone, address } = req.body;

    trackedQuery(req,
        "INSERT INTO customer (name,email,phone,address) VALUES (?,?,?,?)",
        [name, email, phone, address],
        (err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Failed to add customer" });
            }
            res.status(200).json({ message: "Customer Added" });
        }
    );
});

/* CREATE ACCOUNT */
app.post("/createAccount", (req, res) => {
    const { customer_id, account_type, balance } = req.body;

    trackedQuery(req,
        "INSERT INTO account (customer_id,account_type,balance) VALUES (?,?,?)",
        [customer_id, account_type, balance],
        (err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Failed to create account" });
            }
            res.status(200).json({ message: "Account Created" });
        }
    );
});

/* TRANSACTION - ATOMIC */
app.post("/transaction", (req, res) => {
    const { account_id, amount, type } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: "Transaction initiation failed" });

        // Step 1: Check account exists
        trackedQuery(req, "SELECT * FROM account WHERE account_id=?", [account_id], (err, result) => {
            if (err) {
                return db.rollback(() => res.status(500).json({ error: "Database error" }));
            }
            if (result.length === 0) {
                return db.rollback(() => res.status(400).json({ error: "Invalid Account ID ❌" }));
            }

            // Step 2: Update balance
            let balanceQuery = type === "withdraw"
                ? "UPDATE account SET balance = balance - ? WHERE account_id=?"
                : "UPDATE account SET balance = balance + ? WHERE account_id=?";

            trackedQuery(req, balanceQuery, [amount, account_id], (err) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ error: "Balance update failed" }));
                }

                // Step 3: Insert transaction record
                trackedQuery(req,
                    "INSERT INTO transactions (account_id,amount,type) VALUES (?,?,?)",
                    [account_id, amount, type],
                    (err) => {
                        if (err) {
                            return db.rollback(() => res.status(500).json({ error: "Transaction logging failed" }));
                        }

                        // Commit transaction
                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => res.status(500).json({ error: "Commit failed" }));
                            }
                            res.status(200).json({ message: "Transaction Successful ✅" });
                        });
                    }
                );
            });
        });
    });
});

/* DASHBOARD STATS */
app.get("/dashboard-stats", (req, res) => {
    trackedQuery(req, "SELECT COUNT(*) AS totalCustomers FROM customer", (err, custResult) => {
        if (err) return res.status(500).json({ error: "Failed to fetch stats" });
        trackedQuery(req, "SELECT COUNT(*) AS activeAccounts FROM account", (err, accResult) => {
            if (err) return res.status(500).json({ error: "Failed to fetch stats" });
            
            res.json({
                totalCustomers: custResult[0].totalCustomers,
                activeAccounts: accResult[0].activeAccounts,
                todayAdditions: 0 // Mocking today's metric as no timestamp exists in customer table
            });
        });
    });
});

/* GET MY ACCOUNTS */
app.get("/my-accounts/:customerId", (req, res) => {
    trackedQuery(req, "SELECT * FROM account WHERE customer_id=?", [req.params.customerId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch accounts" });
        res.json(result);
    });
});

/* GET TRANSACTIONS HISTORY */
app.get("/history/:accountId", (req, res) => {
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
    trackedQuery(req, "SELECT * FROM query_logs WHERE execution_time_ms > 100 ORDER BY timestamp DESC", (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch slow queries" });
        res.json(result);
    });
});

app.post("/run-query", (req, res) => {
    const { query } = req.body;
    
    if (!query) return res.status(400).json({ error: "No query provided" });
    
    // Strict Sanitization: Allow ONLY SELECT queries for security
    if (!query.trim().toUpperCase().startsWith("SELECT")) {
        return res.status(403).json({ error: "SECURITY ALERT: Only SELECT statements are permitted." });
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
    // Simulated aggregate data
    res.json([
        { txn_date: '2025-04-03', total_transactions: 145, total_amount: 850000, avg_amount: 5862, max_transaction: 45000 },
        { txn_date: '2025-04-02', total_transactions: 210, total_amount: 1120000, avg_amount: 5333, max_transaction: 62000 },
        { txn_date: '2025-04-01', total_transactions: 188, total_amount: 980500, avg_amount: 5215, max_transaction: 31000 }
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

app.post("/backup", roleGuard('admin'), (req, res) => {
    res.json({ok:true});
});

app.delete("/drop-index", roleGuard('admin', 'manager'), (req, res) => {
    res.json({ok:true});
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});