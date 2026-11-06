
require("dotenv").config();

const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "host.docker.internal",
    user: "root",
    password: process.env.DB_PASSWORD,
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
