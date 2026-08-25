const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.get('/', verifyToken, orderController.getOrders);
router.get('/cancellations', verifyToken, requireRole(['admin']), orderController.getCancelledOrderItems);
router.get('/:id', verifyToken, orderController.getOrderById);
router.post('/', verifyToken, orderController.createOrder);
router.post('/:order_id/items', verifyToken, orderController.addItemsToOrder);
router.post('/items/:item_id/cancel', verifyToken, orderController.cancelOrderItemWithReason);
router.patch('/items/:item_id/status', verifyToken, orderController.updateOrderItemStatus);
router.delete('/:id', verifyToken, orderController.cancelOrder);

module.exports = router;
