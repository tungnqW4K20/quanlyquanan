const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.get('/', verifyToken, requireRole(['admin']), userController.getUsers);
router.post('/', verifyToken, requireRole(['admin']), userController.createUser);
router.put('/:id', verifyToken, requireRole(['admin']), userController.updateUser);
router.patch('/:id/toggle-status', verifyToken, requireRole(['admin']), userController.toggleUserStatus);
router.delete('/:id', verifyToken, requireRole(['admin']), userController.deleteUser);

module.exports = router;
