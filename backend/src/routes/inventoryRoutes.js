const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// All inventory endpoints require admin or chef
router.use(verifyToken);
router.use(requireRole(['admin', 'chef']));

// Ingredients CRUD & stock
router.get('/ingredients', inventoryController.getIngredients);
router.post('/ingredients', inventoryController.saveIngredient);
router.put('/ingredients/:id', (req, res, next) => {
  req.body.id = req.params.id;
  inventoryController.saveIngredient(req, res, next);
});

// Monthly report & Excel export
router.get('/monthly-report', inventoryController.getMonthlyInventoryReport);
router.get('/export-excel', inventoryController.exportInventoryExcel);

// Import goods
router.post('/import', inventoryController.importGoods);
router.get('/import-history', inventoryController.getImportHistory);

// Disposal of spoilage / expired ingredients
router.post('/dispose', inventoryController.recordDisposal);
router.get('/disposals', inventoryController.getDisposalsHistory);

module.exports = router;
