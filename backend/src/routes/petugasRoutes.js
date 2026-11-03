const express = require('express');
const router = express.Router();
const petugasController = require('../controllers/petugasController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', petugasController.getAllPetugas);
router.post('/', requireAdmin, petugasController.createPetugas);
router.put('/:id', requireAdmin, petugasController.updatePetugas);
router.delete('/:id', requireAdmin, petugasController.deletePetugas);

module.exports = router;

