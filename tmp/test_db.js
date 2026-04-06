const mysql = require("mysql2");
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Sys#123"
});
db.connect(err => {
    if (err) {
        console.log("FAIL:", err.message);
        process.exit(1);
    } else {
        console.log("SUCCESS");
        db.query("SHOW DATABASES", (err, res) => {
            console.log(res.map(d => d.Database));
            process.exit(0);
        });
    }
});
