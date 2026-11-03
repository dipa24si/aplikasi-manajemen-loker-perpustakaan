const express = require('express');
const router = express.Router();
const peminjamanController = require('../controllers/peminjamanController');
const { verifyToken } = require('../middlewares/auth');

// Endpoint Mandiri Mahasiswa (Bisa diakses dari Kiosk Anjungan Mandiri)
router.post('/mandiri', peminjamanController.mandiriPinjam);

// Endpoint operasional petugas (Perlu Login)
router.post('/pinjam', verifyToken, peminjamanController.pinjam);
router.post('/kembali', verifyToken, peminjamanController.kembali);
router.get('/active', verifyToken, peminjamanController.getActiveLoan);

module.exports = router;
