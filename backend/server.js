const app = require('./src/app');
const db = require('./src/config/db');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Tes koneksi database
    const connection = await db.getConnection();
    console.log(`[Database] Terhubung ke MySQL Database (${process.env.DB_NAME || 'loker_db'})`);
    connection.release();

    app.listen(PORT, () => {
      console.log(`[Server] Backend API berjalan di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Database Error] Gagal terhubung ke MySQL:', err.message);
    console.log('[Info] Pastikan MySQL berjalan (XAMPP/Laragon) dan database sudah di-import.');
    
    // Tetap jalankan server agar developer bisa melihat status di frontend
    app.listen(PORT, () => {
      console.log(`[Server] Backend API berjalan di http://localhost:${PORT} (Mode Warning: Database belum terhubung)`);
    });
  }
}

startServer();

