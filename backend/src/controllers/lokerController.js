const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

async function getAllLokers(req, res, next) {
  try {
    // Sinkronisasi otomatis: pulihkan loker yang 'terpakai' tapi tidak punya peminjaman aktif
    await db.query(
      'UPDATE lokers l SET l.status = ? WHERE l.status = ? AND NOT EXISTS (SELECT 1 FROM peminjaman p WHERE p.loker_id = l.id AND p.status = ?)',
      ['kosong', 'terpakai', 'aktif']
    );

    const { status, lokasi, ukuran, search } = req.query;

    let query = `
      SELECT 
        l.id,
        l.nomor,
        l.lokasi,
        l.ukuran,
        l.status,
        l.catatan,
        l.created_at,
        l.updated_at,
        COALESCE(p.id, plost.id) AS peminjaman_aktif_id,
        COALESCE(p.member_id, plost.member_id) AS member_id,
        COALESCE(p.tanggal_pinjam, plost.tanggal_pinjam) AS tanggal_pinjam,
        COALESCE(p.batas_kembali, plost.batas_kembali) AS batas_kembali,
        COALESCE(p.catatan, plost.catatan) AS catatan_pinjam,
        COALESCE(a.member_name, alost.member_name, p.member_id, plost.member_id) AS member_name,
        COALESCE(a.member_instansi, alost.member_instansi, '-') AS member_instansi,
        COALESCE(a.inst_name, alost.inst_name, '-') AS inst_name,
        COALESCE(a.member_type_id, alost.member_type_id) AS member_type_id,
        COALESCE(pt.nama, ptlost.nama) AS nama_petugas,
        CASE WHEN p.id IS NOT NULL THEN 'aktif' WHEN plost.id IS NOT NULL THEN 'kunci_hilang' ELSE NULL END AS loan_status
      FROM lokers l
      LEFT JOIN peminjaman p ON p.loker_id = l.id AND p.status = 'aktif'
      LEFT JOIN v_anggota a ON a.member_id = p.member_id
      LEFT JOIN petugas pt ON pt.id = p.petugas_pinjam_id
      LEFT JOIN peminjaman plost ON plost.loker_id = l.id AND plost.status = 'kunci_hilang' AND plost.id = (
        SELECT MAX(id) FROM peminjaman WHERE loker_id = l.id AND status = 'kunci_hilang'
      )
      LEFT JOIN v_anggota alost ON alost.member_id = plost.member_id
      LEFT JOIN petugas ptlost ON ptlost.id = plost.petugas_pinjam_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'semua') {
      query += ' AND l.status = ?';
      params.push(status);
    }

    if (ukuran && ukuran !== 'semua') {
      query += ' AND l.ukuran = ?';
      params.push(ukuran);
    }

    if (lokasi) {
      query += ' AND l.lokasi LIKE ?';
      params.push(`%${lokasi}%`);
    }

    if (search) {
      query += ' AND (l.nomor LIKE ? OR a.member_name LIKE ? OR p.member_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY l.nomor ASC';

    const [rows] = await db.query(query, params);

    return successResponse(res, rows, 'Daftar loker berhasil diambil');
  } catch (err) {
    next(err);
  }
}

async function getLokerById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        l.*,
        COALESCE(p.id, plost.id) AS peminjaman_aktif_id,
        COALESCE(p.member_id, plost.member_id) AS member_id,
        COALESCE(p.tanggal_pinjam, plost.tanggal_pinjam) AS tanggal_pinjam,
        COALESCE(p.batas_kembali, plost.batas_kembali) AS batas_kembali,
        COALESCE(a.member_name, alost.member_name, p.member_id, plost.member_id) AS member_name,
        COALESCE(a.member_instansi, alost.member_instansi, '-') AS member_instansi,
        COALESCE(a.inst_name, alost.inst_name, '-') AS inst_name,
        COALESCE(a.member_type_id, alost.member_type_id) AS member_type_id,
        CASE WHEN p.id IS NOT NULL THEN 'aktif' WHEN plost.id IS NOT NULL THEN 'kunci_hilang' ELSE NULL END AS loan_status
      FROM lokers l
      LEFT JOIN peminjaman p ON p.loker_id = l.id AND p.status = 'aktif'
      LEFT JOIN v_anggota a ON a.member_id = p.member_id
      LEFT JOIN peminjaman plost ON plost.loker_id = l.id AND plost.status = 'kunci_hilang' AND plost.id = (
        SELECT MAX(id) FROM peminjaman WHERE loker_id = l.id AND status = 'kunci_hilang'
      )
      LEFT JOIN v_anggota alost ON alost.member_id = plost.member_id
      WHERE l.id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return errorResponse(res, 'Loker tidak ditemukan', 404);
    }

    return successResponse(res, rows[0], 'Detail loker berhasil diambil');
  } catch (err) {
    next(err);
  }
}

async function createLoker(req, res, next) {
  try {
    const { nomor, lokasi, ukuran = 'sedang', catatan = '' } = req.body;

    if (!nomor) {
      return errorResponse(res, 'Nomor loker wajib diisi.', 400);
    }

    const [exists] = await db.query('SELECT id FROM lokers WHERE nomor = ?', [nomor.trim()]);
    if (exists.length > 0) {
      return errorResponse(res, `Nomor loker "${nomor}" sudah digunakan.`, 409);
    }

    const [result] = await db.query(
      'INSERT INTO lokers (nomor, lokasi, ukuran, status, catatan) VALUES (?, ?, ?, "kosong", ?)',
      [nomor.trim(), lokasi ? lokasi.trim() : null, ukuran, catatan ? catatan.trim() : null]
    );

    return successResponse(res, { id: result.insertId, nomor, ukuran }, 'Loker berhasil ditambahkan', 201);
  } catch (err) {
    next(err);
  }
}

async function updateLoker(req, res, next) {
  try {
    const { id } = req.params;
    const { nomor, lokasi, ukuran, catatan } = req.body;

    const [loker] = await db.query('SELECT id FROM lokers WHERE id = ?', [id]);
    if (loker.length === 0) {
      return errorResponse(res, 'Loker tidak ditemukan', 404);
    }

    if (nomor) {
      const [duplicate] = await db.query('SELECT id FROM lokers WHERE nomor = ? AND id != ?', [nomor.trim(), id]);
      if (duplicate.length > 0) {
        return errorResponse(res, `Nomor loker "${nomor}" sudah dipakai oleh loker lain.`, 409);
      }
    }

    await db.query(
      'UPDATE lokers SET nomor = COALESCE(?, nomor), lokasi = COALESCE(?, lokasi), ukuran = COALESCE(?, ukuran), catatan = COALESCE(?, catatan) WHERE id = ?',
      [nomor ? nomor.trim() : null, lokasi !== undefined ? lokasi : null, ukuran || null, catatan !== undefined ? catatan : null, id]
    );

    return successResponse(res, null, 'Data loker berhasil diperbarui');
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, catatan } = req.body;

    if (!['kosong', 'rusak'].includes(status)) {
      return errorResponse(res, 'Status hanya boleh "kosong" atau "rusak" secara manual.', 400);
    }

    // Cek apakah loker sedang ada peminjaman aktif
    const [activeLoan] = await db.query('SELECT id FROM peminjaman WHERE loker_id = ? AND status = "aktif"', [id]);
    if (activeLoan.length > 0) {
      return errorResponse(res, 'Loker sedang dipinjam! Selesaikan peminjaman terlebih dahulu sebelum mengubah status.', 400);
    }

    const [currentLoker] = await db.query('SELECT status, catatan FROM lokers WHERE id = ?', [id]);
    let finalCatatan = catatan !== undefined ? catatan : null;
    if (status === 'kosong' && (!finalCatatan || finalCatatan.trim() === '')) {
      if (currentLoker.length > 0 && currentLoker[0].catatan && currentLoker[0].catatan.toLowerCase().includes('kunci')) {
        finalCatatan = 'Kondisi aman (kunci telah dikembalikan)';
      }
    }

    await db.query(
      'UPDATE lokers SET status = ?, catatan = COALESCE(?, catatan) WHERE id = ?',
      [status, finalCatatan, id]
    );

    // Jika diubah menjadi kosong, pulihkan juga peminjaman kunci_hilang (jika ada)
    if (status === 'kosong') {
      await db.query(
        `UPDATE peminjaman 
         SET status = 'selesai', 
             tanggal_kembali = NOW(), 
             denda = 0, 
             catatan = CONCAT(COALESCE(catatan, ''), ' | Kunci telah dipulihkan oleh petugas. Kondisi kunci aman.')
         WHERE loker_id = ? AND status = 'kunci_hilang'`,
        [id]
      );
    }

    return successResponse(res, null, `Status loker diubah menjadi ${status}`);
  } catch (err) {
    next(err);
  }
}

async function deleteLoker(req, res, next) {
  try {
    const { id } = req.params;

    const [activeLoan] = await db.query('SELECT id FROM peminjaman WHERE loker_id = ? AND status = "aktif"', [id]);
    if (activeLoan.length > 0) {
      return errorResponse(res, 'Tidak dapat menghapus loker yang sedang aktif dipinjam.', 400);
    }

    const [result] = await db.query('DELETE FROM lokers WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return errorResponse(res, 'Loker tidak ditemukan', 404);
    }

    return successResponse(res, null, 'Loker berhasil dihapus');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllLokers,
  getLokerById,
  createLoker,
  updateLoker,
  updateStatus,
  deleteLoker
};

