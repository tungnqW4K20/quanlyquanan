const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);
// Payroll calculation is admin only
router.use(requireRole(['admin']));

router.get('/available-months', payrollController.getAvailablePayrollMonths);
router.get('/performance-summary', payrollController.getStaffPerformanceSummary);
router.get('/', payrollController.getMonthlyPayroll);
router.post('/initialize-month', payrollController.initializeMonthPayroll);
router.post('/calculate', payrollController.calculatePayroll);
router.patch('/:id/status', payrollController.updatePayrollStatus);
router.put('/:id', payrollController.updatePayrollStatus);

module.exports = router;
