const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, invoiceController.getInvoices);
router.get('/vietqr', verifyToken, invoiceController.getVietQRUrl);
router.get('/:id', verifyToken, invoiceController.getInvoiceById);
router.post('/checkout', verifyToken, invoiceController.checkout);

module.exports = router;
