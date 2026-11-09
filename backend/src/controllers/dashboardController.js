const db = require('../config/db');
const { successResponse } = require('../utils/response');

async function getStats(req, res, next) {
  try {
    // Sinkronisasi otomatis: pulihkan loker 'terpakai' yang tidak memiliki peminjaman aktif
    await db.query(
      'UPDATE lokers l SET l.status = ? WHERE l.status = ? AND NOT EXISTS (SELECT 1 FROM peminjaman p WHERE p.loker_id = l.id AND p.status = ?)',
      ['kosong', 'terpakai', 'aktif']
    );

    // 1. Hitung statistik Loker
    const [lokerStats] = await db.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'kosong' THEN 1 ELSE 0 END) AS kosong,
        SUM(CASE WHEN status = 'terpakai' THEN 1 ELSE 0 END) AS terpakai,
        SUM(CASE WHEN status = 'rusak' THEN 1 ELSE 0 END) AS rusak
      FROM lokers
    `);

    // 2. Hitung statistik Peminjaman (Aktif, Kunci Hilang, Selesai Hari Ini)
    const [pinjamStats] = await db.query(`
      SELECT
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) AS aktif,
        0 AS terlambat,
        SUM(CASE WHEN status = 'selesai' AND DATE(tanggal_kembali) = CURDATE() THEN 1 ELSE 0 END) AS selesai_hari_ini,
        SUM(CASE WHEN status = 'kunci_hilang' THEN 1 ELSE 0 END) AS kunci_hilang
      FROM peminjaman
    `);

    // 3. Aktivitas Terbaru (8 transaksi terakhir)
    const [recentActivities] = await db.query(`
      SELECT 
        p.id,
        p.tanggal_pinjam,
        p.tanggal_kembali,
        p.batas_kembali,
        p.status,
        p.denda,
        l.nomor AS nomor_loker,
        l.ukuran AS ukuran_loker,
        COALESCE(a.member_name, p.member_id) AS nama_anggota,
        p.member_id,
        COALESCE(a.member_instansi, '-') AS member_instansi,
        COALESCE(a.inst_name, '-') AS inst_name,
        pt_pinjam.nama AS nama_petugas_pinjam,
        pt_kembali.nama AS nama_petugas_kembali
      FROM peminjaman p
      JOIN lokers l ON l.id = p.loker_id
      LEFT JOIN v_anggota a ON a.member_id = p.member_id
      LEFT JOIN petugas pt_pinjam ON pt_pinjam.id = p.petugas_pinjam_id
      LEFT JOIN petugas pt_kembali ON pt_kembali.id = p.petugas_kembali_id
      ORDER BY p.tanggal_pinjam DESC
      LIMIT 8
    `);

    return successResponse(res, {
      lokers: {
        total: Number(lokerStats[0].total) || 0,
        kosong: Number(lokerStats[0].kosong) || 0,
        terpakai: Number(lokerStats[0].terpakai) || 0,
        rusak: Number(lokerStats[0].rusak) || 0
      },
      peminjaman: {
        aktif: Number(pinjamStats[0].aktif) || 0,
        terlambat: Number(pinjamStats[0].terlambat) || 0,
        selesai_hari_ini: Number(pinjamStats[0].selesai_hari_ini) || 0,
        kunci_hilang: Number(pinjamStats[0].kunci_hilang) || 0
      },
      recentActivities
    }, 'Statistik dashboard berhasil diambil');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats
};

