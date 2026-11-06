const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const lokerRoutes = require('./lokerRoutes');
const peminjamanRoutes = require('./peminjamanRoutes');
const historyRoutes = require('./historyRoutes');
const anggotaRoutes = require('./anggotaRoutes');
const petugasRoutes = require('./petugasRoutes');
const kioskRoutes = require('./kioskRoutes');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/lokers', lokerRoutes);
router.use('/peminjaman', peminjamanRoutes);
router.use('/history', historyRoutes);
router.use('/anggota', anggotaRoutes);
router.use('/petugas', petugasRoutes);
router.use('/kiosks', kioskRoutes);

module.exports = router;

