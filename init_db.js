const fs = require('fs');
const path = require('path');
const db = require('./db');

// Explicitly use the pool to avoid sync issues during init
const mysql = require('mysql2');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "Sys#123@",
    multipleStatements: true
};

const primaryConn = mysql.createConnection({ ...dbConfig, database: "bank_db" });
const shadowConn = mysql.createConnection({ ...dbConfig, database: "bank_db_shadow" });

async function initialize() {
    console.log("Starting Database Initialization...");

    const sqlFile = path.join(__dirname, 'BankDBA.sql');
    let sql = fs.readFileSync(sqlFile, 'utf8');

    // Remove DELIMITER lines as they are for the mysql CLI
    // and replace // with ; for the Node driver
    sql = sql.replace(/DELIMITER \/\//g, '');
    sql = sql.replace(/DELIMITER ;/g, '');
    sql = sql.replace(/\/\//g, ';');

    const executeSql = (conn, label) => {
        return new Promise((resolve, reject) => {
            conn.query(sql, (err) => {
                if (err) {
                    console.error(`[${label}] Error:`, err.message);
                    reject(err);
                } else {
                    console.log(`[${label}] Success.`);
                    resolve();
                }
            });
        });
    };

    try {
        console.log("Initializing Primary (bank_db)...");
        await executeSql(primaryConn, "PRIMARY");
        
        console.log("Initializing Shadow (bank_db_shadow)...");
        // For shadow, we need to make sure the database exists first
        // although BankDBA.sql has DROP/CREATE for bank_db (not shadow)
        // We'll replace 'bank_db' with 'bank_db_shadow' in the SQL for the shadow init
        const shadowSql = sql.replace(/USE bank_db/g, 'USE bank_db_shadow')
                             .replace(/CREATE DATABASE bank_db/g, 'CREATE DATABASE bank_db_shadow')
                             .replace(/DROP DATABASE IF EXISTS bank_db/g, 'DROP DATABASE IF EXISTS bank_db_shadow');
        
        await new Promise((resolve, reject) => {
            shadowConn.query(shadowSql, (err) => {
                if (err) {
                    console.error("[SHADOW] Error:", err.message);
                    reject(err);
                } else {
                    console.log("[SHADOW] Success.");
                    resolve();
                }
            });
        });

        console.log("\nDatabase Initialization Complete!");
        process.exit(0);
    } catch (err) {
        console.error("Initialization Failed.");
        process.exit(1);
    }
}

initialize();
