const { getPool, isMySQL, getMemoryStore } = require('../config/database');

// 1. Get recipes for a menu item with ingredient details and calculated food cost
exports.getDishRecipes = async (req, res, next) => {
  try {
    const { dish_id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      const [dishRows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [dish_id]);
      if (dishRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn' });
      }

      const [recipeRows] = await pool.query(
        `SELECT r.*, i.name as ingredient_name, i.unit, i.cost_price, i.current_stock
         FROM dish_recipes r
         JOIN ingredients i ON r.ingredient_id = i.id
         WHERE r.menu_item_id = ?`,
        [dish_id]
      );

      let estimatedFoodCost = 0;
      const recipesWithCost = recipeRows.map((r) => {
        const itemCost = parseFloat(r.quantity_needed) * parseFloat(r.cost_price);
        estimatedFoodCost += itemCost;
        return {
          ...r,
          item_cost: itemCost
        };
      });

      const sellingPrice = parseFloat(dishRows[0].price);
      const foodCostPercentage = sellingPrice > 0 ? ((estimatedFoodCost / sellingPrice) * 100).toFixed(1) : 0;

      return res.json({
        success: true,
        data: {
          dish: dishRows[0],
          recipes: recipesWithCost,
          estimated_food_cost: estimatedFoodCost,
          food_cost_percentage: parseFloat(foodCostPercentage)
        }
      });
    }

    const memory = getMemoryStore();
    const dish = memory.menuItems.find((m) => m.id === parseInt(dish_id));
    if (!dish) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn' });
    }

    const dishRecipes = memory.recipes.filter((r) => r.menu_item_id === parseInt(dish_id));
    let estimatedFoodCost = 0;

    const recipesWithDetails = dishRecipes.map((r) => {
      const ing = memory.ingredients.find((i) => i.id === r.ingredient_id) || {};
      const itemCost = (r.quantity_needed || 0) * (ing.cost_price || 0);
      estimatedFoodCost += itemCost;
      return {
        ...r,
        ingredient_name: ing.name || 'Nguyên liệu',
        unit: ing.unit || 'kg',
        cost_price: ing.cost_price || 0,
        current_stock: ing.current_stock || 0,
        item_cost: itemCost
      };
    });

    const sellingPrice = parseFloat(dish.price);
    const foodCostPercentage = sellingPrice > 0 ? ((estimatedFoodCost / sellingPrice) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        dish,
        recipes: recipesWithDetails,
        estimated_food_cost: estimatedFoodCost,
        food_cost_percentage: parseFloat(foodCostPercentage)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Add or update ingredient recipe for a dish
exports.saveDishRecipe = async (req, res, next) => {
  try {
    const { dish_id } = req.params;
    const { ingredient_id, quantity_needed, notes } = req.body;

    if (!ingredient_id || !quantity_needed || quantity_needed <= 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn nguyên liệu và định lượng hợp lệ' });
    }

    if (isMySQL()) {
      const pool = getPool();
      // Check if recipe already exists for this dish + ingredient
      const [existing] = await pool.query(
        'SELECT id FROM dish_recipes WHERE menu_item_id = ? AND ingredient_id = ?',
        [dish_id, ingredient_id]
      );

      if (existing.length > 0) {
        await pool.query(
          'UPDATE dish_recipes SET quantity_needed = ?, notes = ? WHERE id = ?',
          [quantity_needed, notes || '', existing[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO dish_recipes (menu_item_id, ingredient_id, quantity_needed, notes) VALUES (?, ?, ?, ?)',
          [dish_id, ingredient_id, quantity_needed, notes || '']
        );
      }

      return res.json({ success: true, message: 'Lưu công thức định lượng thành công' });
    }

    const memory = getMemoryStore();
    const existing = memory.recipes.find(
      (r) => r.menu_item_id === parseInt(dish_id) && r.ingredient_id === parseInt(ingredient_id)
    );

    if (existing) {
      existing.quantity_needed = parseFloat(quantity_needed);
      existing.notes = notes || '';
    } else {
      const newId = memory.recipes.length > 0 ? Math.max(...memory.recipes.map((r) => r.id)) + 1 : 1;
      memory.recipes.push({
        id: newId,
        menu_item_id: parseInt(dish_id),
        ingredient_id: parseInt(ingredient_id),
        quantity_needed: parseFloat(quantity_needed),
        notes: notes || ''
      });
    }

    res.json({ success: true, message: 'Lưu công thức định lượng thành công' });
  } catch (error) {
    next(error);
  }
};

// 3. Delete recipe item
exports.deleteDishRecipe = async (req, res, next) => {
  try {
    const { recipe_id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query('DELETE FROM dish_recipes WHERE id = ?', [recipe_id]);
      return res.json({ success: true, message: 'Xóa định mức nguyên liệu thành công' });
    }

    const memory = getMemoryStore();
    const idx = memory.recipes.findIndex((r) => r.id === parseInt(recipe_id));
    if (idx !== -1) {
      memory.recipes.splice(idx, 1);
    }

    res.json({ success: true, message: 'Xóa định mức nguyên liệu thành công' });
  } catch (error) {
    next(error);
  }
};
