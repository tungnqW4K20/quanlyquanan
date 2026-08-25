const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.get('/', verifyToken, settingsController.getSettings);
router.put('/', verifyToken, requireRole(['admin']), settingsController.updateSettings);

module.exports = router;
