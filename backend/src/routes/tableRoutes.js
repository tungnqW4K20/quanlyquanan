const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.get('/', verifyToken, tableController.getTables);
router.get('/:id', verifyToken, tableController.getTableById);
router.post('/switch', verifyToken, tableController.switchTable);
router.post('/', verifyToken, requireRole(['admin']), tableController.createTable);
router.put('/:id', verifyToken, tableController.updateTable);
router.delete('/:id', verifyToken, requireRole(['admin']), tableController.deleteTable);

module.exports = router;
