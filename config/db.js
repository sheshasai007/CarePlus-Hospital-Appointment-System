const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "qwerty",
    database: "careplus"
});

db.connect(function(err) {
    if (err) {
        console.log("Database connection failed:", err.message);
    } else {
        console.log("MySQL Connected Successfully!");
    }
});

module.exports = db;