const express = require('express');
const router = express.Router();
const kioskController = require('../controllers/kioskController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

// Publik boleh membaca daftar kiosk, detail kiosk, dan ketersediaan loker anjungan
router.get('/', kioskController.getAllKiosks);
router.get('/slug/:slug', kioskController.getKioskBySlug);
router.get('/slug/:slug/lokers', kioskController.getKioskLokers);

// Admin untuk kelola kiosk
router.post('/', verifyToken, requireAdmin, kioskController.createKiosk);
router.post('/:id/generate-lokers', verifyToken, requireAdmin, kioskController.generateLokersForKiosk);
router.post('/:id/reduce-lokers', verifyToken, requireAdmin, kioskController.reduceLokersForKiosk);
router.put('/:id', verifyToken, requireAdmin, kioskController.updateKiosk);
router.delete('/:id', verifyToken, requireAdmin, kioskController.deleteKiosk);

module.exports = router;

