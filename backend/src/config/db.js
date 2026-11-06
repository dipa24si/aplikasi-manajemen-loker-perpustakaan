const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Muat .env baik saat dipanggil dari root maupun dari subfolder backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback ke cwd jika ada

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'loker_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

module.exports = pool;

