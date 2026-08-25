const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const tableRoutes = require('./tableRoutes');
const menuRoutes = require('./menuRoutes');
const orderRoutes = require('./orderRoutes');
const kitchenRoutes = require('./kitchenRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const userRoutes = require('./userRoutes');
const statsRoutes = require('./statsRoutes');
const settingsRoutes = require('./settingsRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const recipeRoutes = require('./recipeRoutes');
const payrollRoutes = require('./payrollRoutes');
const promotionRoutes = require('./promotionRoutes');
const customerRoutes = require('./customerRoutes');
const reservationRoutes = require('./reservationRoutes');

router.use('/auth', authRoutes);
router.use('/tables', tableRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/kitchen', kitchenRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/users', userRoutes);
router.use('/stats', statsRoutes);
router.use('/settings', settingsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/recipes', recipeRoutes);
router.use('/payroll', payrollRoutes);
router.use('/promotions', promotionRoutes);
router.use('/customers', customerRoutes);
router.use('/reservations', reservationRoutes);

module.exports = router;
