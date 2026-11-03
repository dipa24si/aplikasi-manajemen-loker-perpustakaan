const express = require('express');
const router = express.Router();
const lokerController = require('../controllers/lokerController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', lokerController.getAllLokers);
router.get('/:id', lokerController.getLokerById);
router.post('/', requireAdmin, lokerController.createLoker);
router.put('/:id', requireAdmin, lokerController.updateLoker);
router.patch('/:id/status', lokerController.updateStatus);
router.put('/:id/status', lokerController.updateStatus);
router.delete('/:id', requireAdmin, lokerController.deleteLoker);

module.exports = router;

