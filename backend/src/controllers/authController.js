const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, 'Username dan password wajib diisi.', 400);
    }

    const [rows] = await db.query(
      'SELECT id, username, password_hash, nama, role, aktif FROM petugas WHERE username = ? LIMIT 1',
      [username.trim()]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'Username atau password salah.', 401);
    }

    const petugas = rows[0];

    if (!petugas.aktif) {
      return errorResponse(res, 'Akun Anda dinonaktifkan. Hubungi Administrator.', 403);
    }

    const isMatch = await bcrypt.compare(password, petugas.password_hash);
    if (!isMatch) {
      return errorResponse(res, 'Username atau password salah.', 401);
    }

    const payload = {
      id: petugas.id,
      username: petugas.username,
      nama: petugas.nama,
      role: petugas.role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super_secret_jwt_key_library_locker_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return successResponse(res, {
      token,
      user: payload
    }, 'Login berhasil');
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const [rows] = await db.query(
      'SELECT id, username, nama, role, aktif, created_at FROM petugas WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'Pengguna tidak ditemukan.', 404);
    }

    return successResponse(res, rows[0], 'Data pengguna berhasil diambil');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  getMe
};

