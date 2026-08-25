const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, reservationController.getReservations);
router.post('/', verifyToken, reservationController.createReservation);
router.post('/:id/checkin', verifyToken, reservationController.checkinReservation);
router.post('/:id/cancel', verifyToken, reservationController.cancelReservation);

module.exports = router;
