const express = require('express');
const router = express.Router();
const anggotaController = require('../controllers/anggotaController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/search', anggotaController.searchAnggota);
router.get('/:id', anggotaController.getAnggotaById);
router.post('/', anggotaController.createAnggota);

module.exports = router;

