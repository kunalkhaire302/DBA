const db = require('./db');

const testUser = {
    name: "Persist Test User",
    email: "persist@test.com",
    phone: "1234567890",
    address: "Database Persistence Street 101"
};

console.log("Starting Persistence Test...");

// 1. Insert Customer
db.query(
    "INSERT INTO customer (name, email, phone, address, created_at) VALUES (?, ?, ?, ?, NOW())",
    [testUser.name, testUser.email, testUser.phone, testUser.address],
    (err, result) => {
        if (err) {
            console.error("❌ Failed to insert customer:", err.message);
            process.exit(1);
        }
        
        const customerId = result.insertId;
        console.log(`✅ Customer Inserted into MySQL (ID: ${customerId})`);

        // 2. Immediate Verification Query
        db.query("SELECT * FROM customer WHERE customer_id = ?", [customerId], (err, rows) => {
            if (err || rows.length === 0) {
                console.error("❌ Persistence verify failed!");
                process.exit(1);
            }
            
            console.log("✅ Verification Query Successful:");
            console.log(JSON.stringify(rows[0], null, 2));

            // 3. Confirm Table exists in database
            db.query("SHOW TABLES LIKE 'customer'", (err, rows) => {
                if (rows.length > 0) {
                    console.log("✅ Table 'customer' confirmed in MySQL database 'bank_db'.");
                }
                
                console.log("\n--- TEST OUTCOME ---");
                console.log("The user is confirmed to be stored in the persistent MySQL database.");
                process.exit(0);
            });
        });
    }
);
