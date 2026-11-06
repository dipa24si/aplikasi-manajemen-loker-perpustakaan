const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Ambil semua daftar kiosk anjungan mandiri
 */
async function getAllKiosks(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT 
        k.*,
        (
          SELECT COUNT(*) 
          FROM lokers l 
          WHERE (l.lokasi = k.lokasi OR l.lokasi LIKE CONCAT('%', k.lokasi, '%'))
        ) AS total_lokers,
        (
          SELECT COUNT(*) 
          FROM lokers l 
          WHERE (l.lokasi = k.lokasi OR l.lokasi LIKE CONCAT('%', k.lokasi, '%'))
            AND l.status = 'kosong'
        ) AS available_lokers
      FROM kiosks k
      ORDER BY k.id ASC
    `);

    return successResponse(res, rows, 'Daftar anjungan kiosk berhasil diambil');
  } catch (err) {
    next(err);
  }
}

/**
 * Ambil detail satu anjungan kiosk berdasarkan slug (untuk verifikasi halaman anjungan kiosk)
 */
async function getKioskBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const cleanSlug = slug.toLowerCase().trim();

    const [rows] = await db.query(
      `SELECT 
        k.*,
        (
          SELECT COUNT(*) 
          FROM lokers l 
          WHERE (l.lokasi = k.lokasi OR l.lokasi LIKE CONCAT('%', k.lokasi, '%'))
        ) AS total_lokers,
        (
          SELECT COUNT(*) 
          FROM lokers l 
          WHERE (l.lokasi = k.lokasi OR l.lokasi LIKE CONCAT('%', k.lokasi, '%'))
            AND l.status = 'kosong'
        ) AS available_lokers
      FROM kiosks k
      WHERE k.slug = ? AND k.aktif = 1
      LIMIT 1`,
      [cleanSlug]
    );

    if (rows.length === 0) {
      return errorResponse(res, `Anjungan kiosk dengan URL /${cleanSlug} tidak ditemukan atau sudah dihapus.`, 404);
    }

    return successResponse(res, rows[0], 'Data anjungan kiosk berhasil diambil');
  } catch (err) {
    next(err);
  }
}

/**
 * Tambah anjungan kiosk baru
 */
async function createKiosk(req, res, next) {
  try {
    const { nama, slug, lokasi, keterangan } = req.body;

    if (!nama || !slug || !lokasi) {
      return errorResponse(res, 'Nama anjungan, URL slug, dan lokasi penempatan wajib diisi.', 400);
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');

    const [exists] = await db.query('SELECT id FROM kiosks WHERE slug = ?', [cleanSlug]);
    if (exists.length > 0) {
      return errorResponse(res, `URL /${cleanSlug} sudah digunakan oleh anjungan lain.`, 409);
    }

    const [lokasiExists] = await db.query(
      'SELECT id, nama FROM kiosks WHERE LOWER(TRIM(lokasi)) = LOWER(TRIM(?))',
      [lokasi.trim()]
    );
    if (lokasiExists.length > 0) {
      return errorResponse(
        res,
        `Lokasi "${lokasi}" sudah digunakan oleh anjungan "${lokasiExists[0].nama}". Setiap lokasi hanya boleh memiliki 1 anjungan.`,
        409
      );
    }

    const [result] = await db.query(
      'INSERT INTO kiosks (nama, slug, lokasi, keterangan, aktif) VALUES (?, ?, ?, ?, 1)',
      [nama.trim(), cleanSlug, lokasi.trim(), keterangan ? keterangan.trim() : null]
    );

    return successResponse(
      res,
      { id: result.insertId, nama, slug: cleanSlug, lokasi },
      'Anjungan kiosk berhasil ditambahkan',
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Update data kiosk
 */
async function updateKiosk(req, res, next) {
  try {
    const { id } = req.params;
    const { nama, slug, lokasi, keterangan, aktif } = req.body;

    const [kiosk] = await db.query('SELECT id FROM kiosks WHERE id = ?', [id]);
    if (kiosk.length === 0) {
      return errorResponse(res, 'Anjungan kiosk tidak ditemukan.', 404);
    }

    let cleanSlug = undefined;
    if (slug) {
      cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
      const [duplicate] = await db.query('SELECT id FROM kiosks WHERE slug = ? AND id != ?', [cleanSlug, id]);
      if (duplicate.length > 0) {
        return errorResponse(res, `URL /${cleanSlug} sudah digunakan oleh anjungan lain.`, 409);
      }
    }

    if (lokasi) {
      const [duplicateLokasi] = await db.query(
        'SELECT id, nama FROM kiosks WHERE LOWER(TRIM(lokasi)) = LOWER(TRIM(?)) AND id != ?',
        [lokasi.trim(), id]
      );
      if (duplicateLokasi.length > 0) {
        return errorResponse(
          res,
          `Lokasi "${lokasi}" sudah digunakan oleh anjungan "${duplicateLokasi[0].nama}".`,
          409
        );
      }
    }

    await db.query(
      `UPDATE kiosks 
       SET nama = COALESCE(?, nama),
           slug = COALESCE(?, slug),
           lokasi = COALESCE(?, lokasi),
           keterangan = COALESCE(?, keterangan),
           aktif = COALESCE(?, aktif)
       WHERE id = ?`,
      [
        nama ? nama.trim() : null,
        cleanSlug || null,
        lokasi ? lokasi.trim() : null,
        keterangan !== undefined ? (keterangan ? keterangan.trim() : null) : null,
        aktif !== undefined ? aktif : null,
        id
      ]
    );

    return successResponse(res, null, 'Data anjungan kiosk berhasil diperbarui');
  } catch (err) {
    next(err);
  }
}

/**
 * Hapus anjungan kiosk
 */
async function deleteKiosk(req, res, next) {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM kiosks WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return errorResponse(res, 'Anjungan kiosk tidak ditemukan.', 404);
    }

    return successResponse(res, null, 'Anjungan kiosk berhasil dihapus');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllKiosks,
  getKioskBySlug,
  createKiosk,
  updateKiosk,
  deleteKiosk
};

