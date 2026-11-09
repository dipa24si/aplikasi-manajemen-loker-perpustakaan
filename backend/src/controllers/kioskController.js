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
    const { nama, slug, lokasi, keterangan, init_lokers = true, jumlah_loker = 50, prefix_loker } = req.body;

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

    let generatedCount = 0;
    let assignedPrefix = null;

    // Jika diminta buat loker otomatis (atau jika lokasi baru belum punya loker sama sekali)
    if (init_lokers) {
      // Cek apakah lokasi ini sudah punya loker
      const [existingLokers] = await db.query(
        'SELECT COUNT(*) as c FROM lokers WHERE LOWER(TRIM(lokasi)) = LOWER(TRIM(?))',
        [lokasi.trim()]
      );

      if (existingLokers[0].c === 0) {
        // Tentukan prefix huruf yang belum dipakai (A, B, C, D sudah dipakai -> E, F, dst.)
        let chosenPrefix = prefix_loker ? prefix_loker.trim().toUpperCase() : null;
        if (!chosenPrefix) {
          const [usedRows] = await db.query(
            "SELECT DISTINCT UPPER(SUBSTRING_INDEX(nomor, '-', 1)) as prefix FROM lokers WHERE nomor LIKE '%-%'"
          );
          const usedSet = new Set(usedRows.map(r => r.prefix));
          const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          for (const char of alphabet) {
            if (!usedSet.has(char)) {
              chosenPrefix = char;
              break;
            }
          }
          if (!chosenPrefix) chosenPrefix = 'K' + result.insertId;
        }

        assignedPrefix = chosenPrefix;
        const totalToMake = Math.min(Math.max(parseInt(jumlah_loker, 10) || 50, 1), 200);
        const lockerValues = [];

        for (let i = 1; i <= totalToMake; i++) {
          const numPad = totalToMake >= 100 ? String(i).padStart(3, '0') : String(i).padStart(2, '0');
          const lockerNomor = `${chosenPrefix}-${numPad}`;
          const lockerUkuran = i <= 10 ? 'besar' : 'sedang';
          lockerValues.push([lockerNomor, lokasi.trim(), lockerUkuran, 'kosong', 'Kondisi baik']);
        }

        if (lockerValues.length > 0) {
          await db.query(
            'INSERT INTO lokers (nomor, lokasi, ukuran, status, catatan) VALUES ?',
            [lockerValues]
          );
          generatedCount = lockerValues.length;
        }
      }
    }

    return successResponse(
      res,
      {
        id: result.insertId,
        nama,
        slug: cleanSlug,
        lokasi,
        generated_lokers: generatedCount,
        prefix_loker: assignedPrefix
      },
      generatedCount > 0
        ? `Anjungan kiosk berhasil dibuat dan otomatis terhubung dengan ${generatedCount} loker (${assignedPrefix}-01 s/d ${assignedPrefix}-${String(generatedCount).padStart(2, '0')})`
        : 'Anjungan kiosk berhasil ditambahkan',
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

/**
 * Generate loker otomatis untuk anjungan kiosk yang belum memiliki loker
 */
async function generateLokersForKiosk(req, res, next) {
  try {
    const { id } = req.params;
    const { jumlah_loker = 50, prefix_loker } = req.body;

    const [kioskRows] = await db.query('SELECT * FROM kiosks WHERE id = ?', [id]);
    if (kioskRows.length === 0) {
      return errorResponse(res, 'Anjungan kiosk tidak ditemukan.', 404);
    }
    const kiosk = kioskRows[0];

    // Tentukan prefix huruf yang belum terpakai
    let chosenPrefix = prefix_loker ? prefix_loker.trim().toUpperCase() : null;
    if (!chosenPrefix) {
      const [usedRows] = await db.query(
        "SELECT DISTINCT UPPER(SUBSTRING_INDEX(nomor, '-', 1)) as prefix FROM lokers WHERE nomor LIKE '%-%'"
      );
      const usedSet = new Set(usedRows.map(r => r.prefix));
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (const char of alphabet) {
        if (!usedSet.has(char)) {
          chosenPrefix = char;
          break;
        }
      }
      if (!chosenPrefix) chosenPrefix = 'K' + kiosk.id;
    }

    const totalToMake = Math.min(Math.max(parseInt(jumlah_loker, 10) || 50, 1), 200);
    const lockerValues = [];

    for (let i = 1; i <= totalToMake; i++) {
      const numPad = totalToMake >= 100 ? String(i).padStart(3, '0') : String(i).padStart(2, '0');
      const lockerNomor = `${chosenPrefix}-${numPad}`;
      const lockerUkuran = i <= 10 ? 'besar' : 'sedang';
      lockerValues.push([lockerNomor, kiosk.lokasi, lockerUkuran, 'kosong', 'Kondisi baik']);
    }

    if (lockerValues.length > 0) {
      await db.query(
        'INSERT INTO lokers (nomor, lokasi, ukuran, status, catatan) VALUES ?',
        [lockerValues]
      );
    }

    return successResponse(
      res,
      {
        count: lockerValues.length,
        prefix: chosenPrefix,
        lokasi: kiosk.lokasi
      },
      `Berhasil membuat ${lockerValues.length} loker (${chosenPrefix}-01 s/d ${chosenPrefix}-${String(lockerValues.length).padStart(2, '0')}) untuk ${kiosk.nama}`,
      201
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllKiosks,
  getKioskBySlug,
  createKiosk,
  updateKiosk,
  deleteKiosk,
  generateLokersForKiosk
};

