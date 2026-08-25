const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Categories
router.get('/categories', verifyToken, menuController.getCategories);
router.post('/categories', verifyToken, requireRole(['admin']), menuController.createCategory);
router.put('/categories/:id', verifyToken, requireRole(['admin']), menuController.updateCategory);
router.delete('/categories/:id', verifyToken, requireRole(['admin']), menuController.deleteCategory);

// Menu items
router.get('/items', verifyToken, menuController.getMenuItems);
router.get('/items/:id', verifyToken, menuController.getMenuItemById);
router.post('/items', verifyToken, requireRole(['admin']), menuController.createMenuItem);
router.put('/items/:id', verifyToken, requireRole(['admin', 'staff']), menuController.updateMenuItem);
router.patch('/items/:id/toggle-availability', verifyToken, menuController.toggleAvailability);
router.patch('/items/:id/toggle-sold-out', verifyToken, menuController.toggleSoldOutToday);
router.delete('/items/:id', verifyToken, requireRole(['admin']), menuController.deleteMenuItem);

module.exports = router;
