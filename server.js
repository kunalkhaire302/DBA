const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

console.log("Server file started...");

/* LOGIN */
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE username=? AND password=?",
        [username, password],
        (err, result) => {
            if (result.length > 0) {
                res.json(result[0]);
            } else {
                res.json({ message: "Invalid login" });
            }
        }
    );
});

/* ADD CUSTOMER */
app.post("/addCustomer", (req, res) => {
    const { name, email, phone, address } = req.body;

    db.query(
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

    db.query(
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
        db.query("SELECT * FROM account WHERE account_id=?", [account_id], (err, result) => {
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

            db.query(balanceQuery, [amount, account_id], (err) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ error: "Balance update failed" }));
                }

                // Step 3: Insert transaction record
                db.query(
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
    db.query("SELECT COUNT(*) AS totalCustomers FROM customer", (err, custResult) => {
        if (err) return res.status(500).json({ error: "Failed to fetch stats" });
        db.query("SELECT COUNT(*) AS activeAccounts FROM account", (err, accResult) => {
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
    db.query("SELECT * FROM account WHERE customer_id=?", [req.params.customerId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch accounts" });
        res.json(result);
    });
});

/* GET TRANSACTIONS HISTORY */
app.get("/history/:accountId", (req, res) => {
    db.query("SELECT * FROM transactions WHERE account_id=? ORDER BY date DESC", [req.params.accountId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch history" });
        res.json(result);
    });
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});