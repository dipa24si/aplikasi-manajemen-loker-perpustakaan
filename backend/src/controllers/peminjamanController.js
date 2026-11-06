const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

const TARIF_DENDA_PER_HARI = parseInt(process.env.DENDA_PER_HARI || '5000', 10);

/**
 * Kebijakan Baru:
 * - Tidak ada batas waktu pinjam (bebas waktu).
 * - Denda keterlambatan ditiadakan (0).
 * - Denda HANYA dikenakan apabila kunci loker hilang (lapor ke petugas).
 */
function getBatasKembaliOtomatis() {
  return null;
}

function hitungDendaOtomatis(batasKembaliStr, tanggalKembali = new Date(), tarifPerHari = 0) {
  return {
    hariTerlambat: 0,
    denda: 0,
    tarifPerHari: 0
  };
}

/**
 * Peminjaman Mandiri oleh Mahasiswa (Self-Service Kiosk)
 * Mahasiswa tap kartu NIM -> otomatis pilih loker Available -> cetak struk tiket
 */
async function mandiriPinjam(req, res, next) {
  const connection = await db.getConnection();
  try {
    const { member_id, lokasi, loker_id } = req.body;

    if (!member_id || !member_id.trim()) {
      return errorResponse(res, 'Silakan tap Kartu Tanda Mahasiswa (NIM).', 400);
    }

    const cleanMemberId = member_id.trim();

    // 1. Validasi Anggota
    const [members] = await connection.query(
      'SELECT member_id, member_name, member_type_id, aktif, expire_date FROM v_anggota WHERE member_id = ?',
      [cleanMemberId]
    );

    if (members.length === 0) {
      return errorResponse(res, `NIM/ID "${cleanMemberId}" tidak terdaftar dalam sistem perpustakaan.`, 404);
    }

    const member = members[0];
    if (!member.aktif) {
      return errorResponse(res, `Status keanggotaan ${member.member_name} (${member.member_id}) tidak aktif. Hubungi petugas perpustakaan.`, 400);
    }

    // 2. Cek apakah mahasiswa masih punya loker yang belum dikembalikan
    const [activeLoan] = await connection.query(
      `SELECT p.id, l.nomor, l.lokasi, p.tanggal_pinjam, p.batas_kembali 
       FROM peminjaman p 
       JOIN lokers l ON l.id = p.loker_id 
       WHERE p.member_id = ? AND p.status = 'aktif'`,
      [cleanMemberId]
    );

    if (activeLoan.length > 0) {
      const loan = activeLoan[0];
      return errorResponse(
        res,
        `Anda saat ini masih meminjam Loker ${loan.nomor} (${loan.lokasi || 'Lokasi umum'}). Kembalikan anak kunci ke petugas terlebih dahulu sebelum meminjam loker lain.`,
        400
      );
    }

    await connection.beginTransaction();

    // 3. Tentukan Loker Available
    let targetLoker = null;

    if (loker_id) {
      const [lokerRows] = await connection.query(
        'SELECT id, nomor, lokasi, ukuran, status FROM lokers WHERE id = ? FOR UPDATE',
        [loker_id]
      );
      if (lokerRows.length > 0 && lokerRows[0].status === 'kosong') {
        targetLoker = lokerRows[0];
      }
    } else {
      let findLokerQuery = "SELECT id, nomor, lokasi, ukuran, status FROM lokers WHERE status = 'kosong'";
      const findParams = [];

      if (lokasi && lokasi !== 'semua') {
        const cleaned = lokasi.trim().replace(/-/g, ' ');
        findLokerQuery += ' AND (lokasi = ? OR lokasi LIKE ? OR lokasi LIKE ?)';
        findParams.push(lokasi.trim(), `%${cleaned}%`, `%${lokasi.trim()}%`);
      }

      findLokerQuery += ' ORDER BY nomor ASC LIMIT 1 FOR UPDATE';
      const [foundRows] = await connection.query(findLokerQuery, findParams);

      if (foundRows.length > 0) {
        targetLoker = foundRows[0];
      }
    }

    if (!targetLoker) {
      await connection.rollback();
      return errorResponse(
        res,
        lokasi && lokasi !== 'semua'
          ? `Maaf, loker di area "${lokasi}" sedang penuh (Not Available). Silakan pilih area lantai lain.`
          : 'Maaf, semua loker perpustakaan saat ini sedang penuh (Not Available).',
        400
      );
    }

    // 4. Tidak ada batas waktu pinjam (bebas waktu)
    const finalBatasKembali = null;

    // 5. Simpan peminjaman
    const [insertResult] = await connection.query(
      `INSERT INTO peminjaman (loker_id, member_id, tanggal_pinjam, batas_kembali, status, catatan)
       VALUES (?, ?, NOW(), ?, 'aktif', 'Peminjaman Mandiri Kiosk')`,
      [targetLoker.id, cleanMemberId, finalBatasKembali]
    );

    // 6. Update status loker menjadi terpakai
    await connection.query('UPDATE lokers SET status = "terpakai" WHERE id = ?', [targetLoker.id]);

    await connection.commit();

    return successResponse(res, {
      peminjaman_id: insertResult.insertId,
      nomor_loker: targetLoker.nomor,
      lokasi_loker: targetLoker.lokasi || 'Area Utama',
      ukuran_loker: targetLoker.ukuran,
      member_id: member.member_id,
      member_name: member.member_name,
      member_type: member.member_type_id,
      tanggal_pinjam: new Date().toISOString(),
      batas_kembali: null,
      qr_kunci: `LOKER:${targetLoker.nomor}`
    }, `Loker ${targetLoker.nomor} berhasil dialokasikan untuk ${member.member_name}. Silakan ambil struk dan tunjukkan ke petugas.`, 201);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Peminjaman oleh Petugas Meja Sirkulasi
 */
async function pinjam(req, res, next) {
  const connection = await db.getConnection();
  try {
    const { loker_id, member_id, catatan } = req.body;
    const petugas_pinjam_id = req.user ? req.user.id : null;

    if (!loker_id || !member_id) {
      return errorResponse(res, 'ID Loker dan ID Anggota wajib diisi.', 400);
    }

    const [members] = await connection.query(
      'SELECT member_id, member_name, aktif, expire_date FROM v_anggota WHERE member_id = ?',
      [member_id.trim()]
    );

    if (members.length === 0) {
      return errorResponse(res, `Anggota dengan ID "${member_id}" tidak ditemukan di database perpustakaan.`, 404);
    }

    const member = members[0];
    if (!member.aktif) {
      return errorResponse(res, `Keanggotaan ${member.member_name} (${member.member_id}) tidak aktif atau telah kedaluwarsa.`, 400);
    }

    const [memberActiveLoan] = await connection.query(
      'SELECT p.id, l.nomor FROM peminjaman p JOIN lokers l ON l.id = p.loker_id WHERE p.member_id = ? AND p.status = "aktif"',
      [member_id.trim()]
    );

    if (memberActiveLoan.length > 0) {
      return errorResponse(
        res,
        `Anggota ${member.member_name} masih memegang loker ${memberActiveLoan[0].nomor}. Kembalikan terlebih dahulu sebelum meminjam loker lain.`,
        400
      );
    }

    const [lokers] = await connection.query(
      'SELECT id, nomor, status FROM lokers WHERE id = ? FOR UPDATE',
      [loker_id]
    );

    if (lokers.length === 0) {
      return errorResponse(res, 'Loker tidak ditemukan.', 404);
    }

    const loker = lokers[0];
    if (loker.status !== 'kosong') {
      return errorResponse(res, `Loker ${loker.nomor} saat ini Not Available.`, 400);
    }

    // Tidak ada batas waktu pinjam (bebas waktu)
    const finalBatasKembali = null;

    await connection.beginTransaction();

    const [insertResult] = await connection.query(
      `INSERT INTO peminjaman (loker_id, member_id, tanggal_pinjam, batas_kembali, status, catatan, petugas_pinjam_id)
       VALUES (?, ?, NOW(), ?, 'aktif', ?, ?)`,
      [loker_id, member_id.trim(), finalBatasKembali, catatan || null, petugas_pinjam_id]
    );

    await connection.query('UPDATE lokers SET status = "terpakai" WHERE id = ?', [loker_id]);

    await connection.commit();

    return successResponse(res, {
      peminjaman_id: insertResult.insertId,
      nomor_loker: loker.nomor,
      member_name: member.member_name,
      batas_kembali: null
    }, `Loker ${loker.nomor} berhasil dipinjamkan kepada ${member.member_name}.`, 201);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Pengembalian Kunci oleh Petugas (Scan QR Code Kunci)
 * Menghitung denda otomatis jika lewat jam 16:00 hari pinjam / beberapa hari tidak kembali
 */
async function kembali(req, res, next) {
  const connection = await db.getConnection();
  try {
    let { peminjaman_id, loker_id, nomor_loker, member_id, qr_code, status = 'selesai', denda, catatan } = req.body;
    const petugas_kembali_id = req.user ? req.user.id : null;

    if (qr_code) {
      let cleaned = qr_code.trim();
      if (cleaned.startsWith('LOKER:')) {
        cleaned = cleaned.replace('LOKER:', '').trim();
      }
      nomor_loker = cleaned;
    }

    let targetLoanId = peminjaman_id;

    if (!targetLoanId) {
      let findQuery = `
        SELECT p.id, p.loker_id, p.member_id, l.nomor 
        FROM peminjaman p 
        JOIN lokers l ON l.id = p.loker_id
        WHERE p.status = 'aktif'
      `;
      const findParams = [];

      if (nomor_loker) {
        findQuery += ' AND (l.nomor = ? OR l.nomor = ?)';
        findParams.push(nomor_loker.trim(), nomor_loker.replace('LOKER:', '').trim());
      } else if (loker_id) {
        findQuery += ' AND p.loker_id = ?';
        findParams.push(loker_id);
      } else if (member_id) {
        findQuery += ' AND p.member_id = ?';
        findParams.push(member_id.trim());
      } else {
        return errorResponse(res, 'Silakan scan QR kunci loker atau masukkan nomor loker.', 400);
      }

      findQuery += ' LIMIT 1';
      const [foundLoans] = await connection.query(findQuery, findParams);

      if (foundLoans.length === 0) {
        return errorResponse(res, `Tidak ditemukan peminjaman aktif untuk kunci loker "${nomor_loker || loker_id || member_id}".`, 404);
      }
      targetLoanId = foundLoans[0].id;
    }

    const [loans] = await connection.query(
      `SELECT p.*, l.nomor AS nomor_loker, a.member_name 
       FROM peminjaman p
       JOIN lokers l ON l.id = p.loker_id
       LEFT JOIN v_anggota a ON a.member_id = p.member_id
       WHERE p.id = ? AND p.status = "aktif"
       FOR UPDATE`,
      [targetLoanId]
    );

    if (loans.length === 0) {
      return errorResponse(res, 'Peminjaman tidak ditemukan atau sudah selesai.', 404);
    }

    const loan = loans[0];
    const finalStatus = status === 'kunci_hilang' ? 'kunci_hilang' : 'selesai';
    const newLokerStatus = finalStatus === 'kunci_hilang' ? 'rusak' : 'kosong';

    // Denda HANYA berlaku jika kunci hilang (tidak ada denda keterlambatan)
    let totalDendaFinal = 0;
    if (finalStatus === 'kunci_hilang') {
      if (denda !== undefined && denda !== null && denda !== '') {
        totalDendaFinal = parseFloat(denda) || 0;
      } else {
        totalDendaFinal = 25000; // Biaya standar penggantian anak kunci hilang
      }
    } else {
      totalDendaFinal = 0; // Pengembalian normal selalu bebas denda
    }

    await connection.beginTransaction();

    await connection.query(
      `UPDATE peminjaman 
       SET status = ?, 
           tanggal_kembali = NOW(), 
           denda = ?, 
           catatan = COALESCE(?, catatan), 
           petugas_kembali_id = ?
       WHERE id = ?`,
      [finalStatus, totalDendaFinal, catatan || null, petugas_kembali_id, loan.id]
    );

    await connection.query(
      'UPDATE lokers SET status = ?, catatan = CASE WHEN ? = "kunci_hilang" THEN "Kunci hilang dilaporkan" ELSE NULL END WHERE id = ?',
      [newLokerStatus, finalStatus, loan.loker_id]
    );

    await connection.commit();

    const returnMsg = finalStatus === 'kunci_hilang'
      ? `Laporan kunci hilang untuk Loker ${loan.nomor_loker} (${loan.member_name}) berhasil dicatat. Denda penggantian kunci: Rp ${totalDendaFinal.toLocaleString('id-ID')}.`
      : `Kunci loker ${loan.nomor_loker} (${loan.member_name}) berhasil diterima. Loker sekarang AVAILABLE kembali (Bebas Denda).`;

    return successResponse(res, {
      peminjaman_id: loan.id,
      nomor_loker: loan.nomor_loker,
      member_name: loan.member_name,
      status: finalStatus,
      status_loker: newLokerStatus === 'kosong' ? 'available' : 'not_available',
      hari_terlambat: 0,
      denda: totalDendaFinal
    }, returnMsg);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Cek Peminjaman Aktif beserta perhitungan keterlambatan real-time
 */
async function getActiveLoan(req, res, next) {
  try {
    let { loker_id, member_id, nomor_loker, qr_code } = req.query;

    if (qr_code) {
      let cleaned = qr_code.trim();
      if (cleaned.startsWith('LOKER:')) {
        cleaned = cleaned.replace('LOKER:', '').trim();
      }
      nomor_loker = cleaned;
    }

    let query = `
      SELECT 
        p.*,
        l.nomor AS nomor_loker,
        l.lokasi,
        l.ukuran,
        a.member_name,
        COALESCE(a.fakultas, '-') AS fakultas,
        COALESCE(a.prodi, '-') AS prodi,
        a.member_type_id,
        a.member_phone,
        a.member_email,
        pt.nama AS nama_petugas_pinjam,
        0 AS is_overdue
      FROM peminjaman p
      JOIN lokers l ON l.id = p.loker_id
      LEFT JOIN v_anggota a ON a.member_id = p.member_id
      LEFT JOIN petugas pt ON pt.id = p.petugas_pinjam_id
      WHERE p.status = 'aktif'
    `;
    const params = [];

    if (loker_id) {
      query += ' AND p.loker_id = ?';
      params.push(loker_id);
    } else if (nomor_loker) {
      query += ' AND (l.nomor = ? OR l.nomor = ?)';
      params.push(nomor_loker.trim(), nomor_loker.replace('LOKER:', '').trim());
    } else if (member_id) {
      query += ' AND p.member_id = ?';
      params.push(member_id.trim());
    } else {
      return errorResponse(res, 'Sertakan nomor_loker, qr_code, atau member_id', 400);
    }

    query += ' LIMIT 1';

    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return successResponse(res, null, 'Tidak ada peminjaman aktif');
    }

    const loan = rows[0];
    const infoDenda = hitungDendaOtomatis(loan.batas_kembali, new Date(), TARIF_DENDA_PER_HARI);

    return successResponse(res, {
      ...loan,
      hari_terlambat: infoDenda.hariTerlambat,
      estimasi_denda: infoDenda.denda,
      tarif_per_hari: infoDenda.tarifPerHari
    }, 'Data peminjaman aktif ditemukan');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  mandiriPinjam,
  pinjam,
  kembali,
  getActiveLoan
};
