const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.get('/dashboard', verifyToken, requireRole(['admin']), statsController.getDashboardStats);
router.get('/financial-report', verifyToken, requireRole(['admin']), statsController.getFinancialStatement);

module.exports = router;
