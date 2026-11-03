const db = require('../config/db');
const { successResponse } = require('../utils/response');

async function getHistory(req, res, next) {
  try {
    const { 
      page = 1, 
      limit = 15, 
      status, 
      start_date, 
      end_date, 
      search, 
      is_export = 'false' 
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status && status !== 'semua') {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    if (start_date) {
      whereClause += ' AND DATE(p.tanggal_pinjam) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND DATE(p.tanggal_pinjam) <= ?';
      params.push(end_date);
    }

    if (search) {
      whereClause += ' AND (l.nomor LIKE ? OR p.member_id LIKE ? OR a.member_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Hitung total data
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total 
       FROM peminjaman p
       JOIN lokers l ON l.id = p.loker_id
       LEFT JOIN v_anggota a ON a.member_id = p.member_id
       ${whereClause}`,
      params
    );
    const totalRecords = countRows[0].total;

    // Ambil data
    let query = `
      SELECT 
        p.id,
        p.loker_id,
        l.nomor AS nomor_loker,
        l.ukuran AS ukuran_loker,
        l.lokasi AS lokasi_loker,
        p.member_id,
        COALESCE(a.member_name, p.member_id) AS member_name,
        a.member_type_id,
        a.member_phone,
        p.tanggal_pinjam,
        p.batas_kembali,
        p.tanggal_kembali,
        p.status,
        p.denda,
        p.catatan,
        pt_pinjam.nama AS petugas_pinjam,
        pt_kembali.nama AS petugas_kembali
      FROM peminjaman p
      JOIN lokers l ON l.id = p.loker_id
      LEFT JOIN v_anggota a ON a.member_id = p.member_id
      LEFT JOIN petugas pt_pinjam ON pt_pinjam.id = p.petugas_pinjam_id
      LEFT JOIN petugas pt_kembali ON pt_kembali.id = p.petugas_kembali_id
      ${whereClause}
      ORDER BY p.tanggal_pinjam DESC
    `;

    let data;
    if (is_export === 'true') {
      [data] = await db.query(query, params);
    } else {
      query += ' LIMIT ? OFFSET ?';
      [data] = await db.query(query, [...params, limitNum, offset]);
    }

    return successResponse(res, {
      items: data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum) || 1
      }
    }, 'Riwayat peminjaman berhasil diambil');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHistory
};

