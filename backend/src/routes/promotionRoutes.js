const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Public route for customers & staff
router.get('/', promotionController.getPromotions);

// Admin-only management routes
router.post('/', verifyToken, requireRole(['admin']), promotionController.createPromotion);
router.put('/:id', verifyToken, requireRole(['admin']), promotionController.updatePromotion);
router.delete('/:id', verifyToken, requireRole(['admin']), promotionController.deletePromotion);

module.exports = router;
