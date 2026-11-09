// db.js
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
  database: process.env.DB_NAME || "member_system",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

module.exports = pool.promise();
