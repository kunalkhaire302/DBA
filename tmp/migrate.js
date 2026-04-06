const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Sys#123@",
    multipleStatements: true
});

console.log("Starting Migration...");

let sql = fs.readFileSync(path.join(__dirname, "..", "BankDBA.sql"), "utf8");

// Strip DELIMITER statements and replace // with ; inside triggers
sql = sql.replace(/DELIMITER \/\//g, "");
sql = sql.replace(/DELIMITER ;/g, "");
sql = sql.replace(/\/\/ /g, ";");
sql = sql.replace(/\/\//g, ";");

// Hash initial seed passwords
const bcrypt = require('bcrypt');
sql = sql.replace("'admin123'", `'${bcrypt.hashSync('admin123', 10)}'`);
sql = sql.replace("'teller123'", `'${bcrypt.hashSync('teller123', 10)}'`);
sql = sql.replace("'cust123'", `'${bcrypt.hashSync('cust123', 10)}'`);

db.connect(err => {
    if (err) {
        console.error("❌ Connection failed:", err.message);
        process.exit(1);
    }
    
    console.log("✅ MySQL Connected.");
    
    db.query(sql, (err) => {
        if (err) {
            console.error("❌ Migration failed:", err.sqlMessage || err.message);
            process.exit(1);
        }
        console.log("🚀 Migration Successful! Database seeded.");
        process.exit(0);
    });
});
