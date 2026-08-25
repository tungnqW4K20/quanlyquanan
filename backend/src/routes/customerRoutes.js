const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Public endpoints for customers at dining table
router.post('/lookup', customerController.lookupCustomer);
router.post('/play-game', customerController.playMinigame);
router.post('/feedback', customerController.submitFeedback);

// Admin-only management endpoints
router.get('/', verifyToken, requireRole(['admin']), customerController.getCustomers);
router.get('/feedbacks', verifyToken, requireRole(['admin']), customerController.getFeedbacks);

module.exports = router;
