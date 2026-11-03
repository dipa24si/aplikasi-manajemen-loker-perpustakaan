const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

async function getAllPetugas(req, res, next) {
  try {
    const [rows] = await db.query(
      'SELECT id, username, nama, role, aktif, created_at FROM petugas ORDER BY role ASC, nama ASC'
    );
    return successResponse(res, rows, 'Daftar petugas berhasil diambil');
  } catch (err) {
    next(err);
  }
}

async function createPetugas(req, res, next) {
  try {
    const { username, password, nama, role = 'petugas', aktif = 1 } = req.body;

    if (!username || !password || !nama) {
      return errorResponse(res, 'Username, password, dan nama wajib diisi.', 400);
    }

    const [exists] = await db.query('SELECT id FROM petugas WHERE username = ?', [username.trim()]);
    if (exists.length > 0) {
      return errorResponse(res, `Username "${username}" sudah digunakan.`, 409);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO petugas (username, password_hash, nama, role, aktif) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), password_hash, nama.trim(), role, aktif ? 1 : 0]
    );

    return successResponse(res, { id: result.insertId, username, nama, role }, 'Akun petugas berhasil dibuat', 201);
  } catch (err) {
    next(err);
  }
}

async function updatePetugas(req, res, next) {
  try {
    const { id } = req.params;
    const { nama, role, aktif, password } = req.body;

    const [exists] = await db.query('SELECT id FROM petugas WHERE id = ?', [id]);
    if (exists.length === 0) {
      return errorResponse(res, 'Petugas tidak ditemukan.', 404);
    }

    // Jika ada update password
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      await db.query('UPDATE petugas SET password_hash = ? WHERE id = ?', [password_hash, id]);
    }

    await db.query(
      'UPDATE petugas SET nama = COALESCE(?, nama), role = COALESCE(?, role), aktif = COALESCE(?, aktif) WHERE id = ?',
      [nama ? nama.trim() : null, role || null, aktif !== undefined ? (aktif ? 1 : 0) : null, id]
    );

    return successResponse(res, null, 'Data petugas berhasil diperbarui');
  } catch (err) {
    next(err);
  }
}

async function deletePetugas(req, res, next) {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === req.user.id) {
      return errorResponse(res, 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login.', 400);
    }

    const [result] = await db.query('DELETE FROM petugas WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return errorResponse(res, 'Petugas tidak ditemukan.', 404);
    }

    return successResponse(res, null, 'Akun petugas berhasil dihapus');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllPetugas,
  createPetugas,
  updatePetugas,
  deletePetugas
};

