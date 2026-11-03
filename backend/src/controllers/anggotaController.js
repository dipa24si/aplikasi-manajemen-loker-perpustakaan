const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

async function searchAnggota(req, res, next) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return successResponse(res, [], 'Hasil pencarian kosong');
    }

    const searchQuery = `%${q.trim()}%`;
    const [rows] = await db.query(
      `SELECT 
        a.member_id,
        a.member_name,
        a.member_type_id,
        a.member_email,
        a.member_phone,
        a.expire_date,
        a.aktif,
        p.id AS active_loan_id,
        l.nomor AS active_loker_nomor
       FROM v_anggota a
       LEFT JOIN peminjaman p ON p.member_id = a.member_id AND p.status = 'aktif'
       LEFT JOIN lokers l ON l.id = p.loker_id
       WHERE a.member_id LIKE ? OR a.member_name LIKE ?
       ORDER BY a.member_name ASC
       LIMIT 10`,
      [searchQuery, searchQuery]
    );

    return successResponse(res, rows, 'Hasil pencarian anggota');
  } catch (err) {
    next(err);
  }
}

async function getAnggotaById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT 
        a.*,
        p.id AS active_loan_id,
        p.loker_id AS active_loker_id,
        l.nomor AS active_loker_nomor,
        p.tanggal_pinjam AS active_tanggal_pinjam
       FROM v_anggota a
       LEFT JOIN peminjaman p ON p.member_id = a.member_id AND p.status = 'aktif'
       LEFT JOIN lokers l ON l.id = p.loker_id
       WHERE a.member_id = ?
       LIMIT 1`,
      [id.trim()]
    );

    if (rows.length === 0) {
      return errorResponse(res, `Anggota dengan ID "${id}" tidak ditemukan.`, 404);
    }

    return successResponse(res, rows[0], 'Data anggota ditemukan');
  } catch (err) {
    next(err);
  }
}

async function createAnggota(req, res, next) {
  try {
    const { member_id, member_name, member_type_id = 'Reguler', member_phone, member_email, expire_date } = req.body;

    if (!member_id || !member_name) {
      return errorResponse(res, 'ID Anggota (NIM/NIK) dan Nama Lengkap wajib diisi.', 400);
    }

    const [exists] = await db.query('SELECT member_id FROM v_anggota WHERE member_id = ?', [member_id.trim()]);
    if (exists.length > 0) {
      return errorResponse(res, `ID Anggota "${member_id}" sudah terdaftar.`, 409);
    }

    const defaultExpire = expire_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await db.query(
      `INSERT INTO anggota (member_id, member_name, member_type_id, member_phone, member_email, expire_date, aktif)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [member_id.trim(), member_name.trim(), member_type_id, member_phone || null, member_email || null, defaultExpire]
    );

    return successResponse(res, { member_id, member_name }, 'Anggota baru berhasil ditambahkan.', 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  searchAnggota,
  getAnggotaById,
  createAnggota
};

