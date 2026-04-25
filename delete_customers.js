const db = require('./db.js');

async function runQuery(sql) {
    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

async function start() {
    try {
        console.log("Disabling foreign key checks temporarily...");
        await runQuery("SET FOREIGN_KEY_CHECKS=0");
        
        console.log("Clearing all customer-linked users...");
        await runQuery("DELETE FROM users WHERE customer_id IS NOT NULL");
        
        console.log("Clearing all transactions...");
        await runQuery("DELETE FROM transactions");
        
        console.log("Clearing all accounts...");
        await runQuery("DELETE FROM account");
        
        console.log("Clearing all customers...");
        await runQuery("DELETE FROM customer");
        
        await runQuery("SET FOREIGN_KEY_CHECKS=1");
        
        console.log("Successfully deleted all customers and related data.");
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

start();
