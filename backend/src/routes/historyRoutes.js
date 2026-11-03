const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', historyController.getHistory);

module.exports = router;

