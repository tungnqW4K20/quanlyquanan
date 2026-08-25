const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);

// View recipes can be accessed by admin and staff/chef
router.get('/dish/:dish_id', recipeController.getDishRecipes);

// Modifying recipes is admin only
router.post('/dish/:dish_id', requireRole(['admin']), recipeController.saveDishRecipe);
router.delete('/:recipe_id', requireRole(['admin']), recipeController.deleteDishRecipe);

module.exports = router;
