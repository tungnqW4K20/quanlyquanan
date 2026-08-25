const express = require('express');
const router = express.Router();
const kitchenController = require('../controllers/kitchenController');
const { verifyToken } = require('../middlewares/auth');

router.get('/tickets', verifyToken, kitchenController.getKitchenTickets);
router.patch('/tickets/:item_id/status', verifyToken, kitchenController.updateTicketStatus);
router.put('/tickets/:item_id/status', verifyToken, kitchenController.updateTicketStatus);
router.post('/tickets/:item_id/assign-chef', verifyToken, kitchenController.assignChef);
router.get('/history', verifyToken, kitchenController.getChefCookingHistory);
router.post('/return/:item_id', verifyToken, kitchenController.recordDishReturn);

module.exports = router;
