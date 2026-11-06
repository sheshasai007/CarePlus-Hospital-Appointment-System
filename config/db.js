require("dotenv").config();

const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "host.docker.internal",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "careplus"
});

db.connect(function(err) {
    if (err) {
        console.log("Database connection failed:", err.message);
    } else {
        console.log("MySQL Connected Successfully!");
    }
});

module.exports = db;