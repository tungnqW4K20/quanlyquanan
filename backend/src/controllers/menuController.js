const { getPool, isMySQL, getMemoryStore } = require('../config/database');

// --- CATEGORIES ---
exports.getCategories = async (req, res, next) => {
  try {
    if (isMySQL()) {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM categories ORDER BY display_order ASC, id ASC');
      return res.json({ success: true, data: rows });
    }

    const memory = getMemoryStore();
    const categories = [...memory.categories].sort((a, b) => a.display_order - b.display_order);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, icon, display_order } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
    }

    if (isMySQL()) {
      const pool = getPool();
      const [result] = await pool.query(
        'INSERT INTO categories (name, icon, display_order) VALUES (?, ?, ?)',
        [name, icon || 'Utensils', display_order || 0]
      );
      return res.status(201).json({
        success: true,
        message: 'Thêm danh mục thành công',
        data: { id: result.insertId, name, icon: icon || 'Utensils', display_order: display_order || 0, is_active: true }
      });
    }

    const memory = getMemoryStore();
    const newId = memory.categories.length > 0 ? Math.max(...memory.categories.map((c) => c.id)) + 1 : 1;
    const newCategory = {
      id: newId,
      name,
      icon: icon || 'Utensils',
      display_order: parseInt(display_order) || memory.categories.length + 1,
      is_active: true
    };
    memory.categories.push(newCategory);
    res.status(201).json({ success: true, message: 'Thêm danh mục thành công', data: newCategory });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon, display_order, is_active } = req.body;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query(
        'UPDATE categories SET name = COALESCE(?, name), icon = COALESCE(?, icon), display_order = COALESCE(?, display_order), is_active = COALESCE(?, is_active) WHERE id = ?',
        [name, icon, display_order, is_active, id]
      );
      return res.json({ success: true, message: 'Cập nhật danh mục thành công' });
    }

    const memory = getMemoryStore();
    const category = memory.categories.find((c) => c.id === parseInt(id));
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    if (name !== undefined) category.name = name;
    if (icon !== undefined) category.icon = icon;
    if (display_order !== undefined) category.display_order = parseInt(display_order);
    if (is_active !== undefined) category.is_active = is_active;

    res.json({ success: true, message: 'Cập nhật danh mục thành công', data: category });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query('DELETE FROM categories WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Xóa danh mục thành công' });
    }

    const memory = getMemoryStore();
    const idx = memory.categories.findIndex((c) => c.id === parseInt(id));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    memory.categories.splice(idx, 1);
    res.json({ success: true, message: 'Xóa danh mục thành công' });
  } catch (error) {
    next(error);
  }
};

// --- MENU ITEMS ---
exports.getMenuItems = async (req, res, next) => {
  try {
    const { category_id, search, available_only, item_type } = req.query;

    if (isMySQL()) {
      const pool = getPool();
      let query = `
        SELECT m.*, c.name as category_name, c.icon as category_icon 
        FROM menu_items m 
        JOIN categories c ON m.category_id = c.id 
        WHERE 1=1
      `;
      const params = [];

      if (category_id && category_id !== 'all') {
        query += ' AND m.category_id = ?';
        params.push(category_id);
      }
      if (item_type && item_type !== 'all') {
        query += ' AND m.item_type = ?';
        params.push(item_type);
      }
      if (search) {
        query += ' AND (m.name LIKE ? OR m.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      if (available_only === 'true') {
        query += ' AND m.is_available = TRUE';
      }

      query += ' ORDER BY m.is_featured DESC, m.id DESC';
      const [rows] = await pool.query(query, params);

      const parsedRows = rows.map((item) => {
        let comboItems = [];
        try {
          comboItems = typeof item.combo_items === 'string' ? JSON.parse(item.combo_items) : item.combo_items || [];
        } catch (e) {
          comboItems = [];
        }
        return {
          ...item,
          combo_items: comboItems,
          is_sold_out_today: Boolean(item.is_sold_out_today)
        };
      });

      return res.json({ success: true, data: parsedRows });
    }

    const memory = getMemoryStore();
    let items = memory.menuItems.map((item) => {
      const cat = memory.categories.find((c) => c.id === item.category_id);
      return {
        ...item,
        category_name: cat ? cat.name : 'Khác',
        category_icon: cat ? cat.icon : 'Utensils'
      };
    });

    if (category_id && category_id !== 'all') {
      items = items.filter((i) => i.category_id === parseInt(category_id));
    }
    if (item_type && item_type !== 'all') {
      items = items.filter((i) => i.item_type === item_type);
    }
    if (search) {
      const term = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(term) || (i.description && i.description.toLowerCase().includes(term)));
    }
    if (available_only === 'true') {
      items = items.filter((i) => i.is_available);
    }

    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

exports.getMenuItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      const [rows] = await pool.query(
        `SELECT m.*, c.name as category_name 
         FROM menu_items m 
         JOIN categories c ON m.category_id = c.id 
         WHERE m.id = ?`,
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn' });
      }

      const item = rows[0];
      let comboItems = [];
      try {
        comboItems = typeof item.combo_items === 'string' ? JSON.parse(item.combo_items) : item.combo_items || [];
      } catch (e) {
        comboItems = [];
      }

      return res.json({
        success: true,
        data: {
          ...item,
          combo_items: comboItems,
          is_sold_out_today: Boolean(item.is_sold_out_today)
        }
      });
    }

    const memory = getMemoryStore();
    const item = memory.menuItems.find((i) => i.id === parseInt(id));
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn' });
    }

    const cat = memory.categories.find((c) => c.id === item.category_id);
    res.json({ success: true, data: { ...item, category_name: cat ? cat.name : 'Khác' } });
  } catch (error) {
    next(error);
  }
};

exports.createMenuItem = async (req, res, next) => {
  try {
    const {
      category_id,
      name,
      description,
      price,
      original_price,
      image_url,
      unit,
      item_type = 'a_la_carte',
      combo_items = [],
      buffet_type = 'none',
      buffet_price_per_pax = 0,
      buffet_duration_minutes = 120,
      is_available = true,
      is_featured = false,
      is_sold_out_today = false
    } = req.body;

    if (!category_id || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ danh mục, tên món và giá' });
    }

    const defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

    if (isMySQL()) {
      const pool = getPool();
      const [result] = await pool.query(
        `INSERT INTO menu_items (
          category_id, name, description, price, original_price, image_url, unit,
          item_type, combo_items, buffet_type, buffet_price_per_pax, buffet_duration_minutes,
          is_available, is_featured, is_sold_out_today
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category_id,
          name,
          description || '',
          price,
          original_price || price,
          image_url || defaultImage,
          unit || 'Phần',
          item_type,
          JSON.stringify(combo_items),
          buffet_type,
          buffet_price_per_pax,
          buffet_duration_minutes,
          is_available ? 1 : 0,
          is_featured ? 1 : 0,
          is_sold_out_today ? 1 : 0
        ]
      );
      return res.status(201).json({
        success: true,
        message: 'Thêm món ăn thành công',
        data: {
          id: result.insertId,
          category_id,
          name,
          description,
          price,
          original_price: original_price || price,
          image_url: image_url || defaultImage,
          unit: unit || 'Phần',
          item_type,
          combo_items,
          buffet_type,
          buffet_price_per_pax,
          buffet_duration_minutes,
          is_available,
          is_featured,
          is_sold_out_today
        }
      });
    }

    const memory = getMemoryStore();
    const newId = memory.menuItems.length > 0 ? Math.max(...memory.menuItems.map((m) => m.id)) + 1 : 1;
    const newItem = {
      id: newId,
      category_id: parseInt(category_id),
      name,
      description: description || '',
      price: parseFloat(price),
      original_price: parseFloat(original_price || price),
      image_url: image_url || defaultImage,
      unit: unit || 'Phần',
      item_type,
      combo_items,
      buffet_type,
      buffet_price_per_pax,
      buffet_duration_minutes,
      is_available,
      is_featured,
      is_sold_out_today
    };

    memory.menuItems.push(newItem);
    res.status(201).json({ success: true, message: 'Thêm món ăn thành công', data: newItem });
  } catch (error) {
    next(error);
  }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      name,
      description,
      price,
      original_price,
      image_url,
      unit,
      item_type,
      combo_items,
      buffet_type,
      buffet_price_per_pax,
      buffet_duration_minutes,
      is_available,
      is_featured,
      is_sold_out_today
    } = req.body;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query(
        `UPDATE menu_items SET 
          category_id = COALESCE(?, category_id),
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          original_price = COALESCE(?, original_price),
          image_url = COALESCE(?, image_url),
          unit = COALESCE(?, unit),
          item_type = COALESCE(?, item_type),
          combo_items = COALESCE(?, combo_items),
          buffet_type = COALESCE(?, buffet_type),
          buffet_price_per_pax = COALESCE(?, buffet_price_per_pax),
          buffet_duration_minutes = COALESCE(?, buffet_duration_minutes),
          is_available = COALESCE(?, is_available),
          is_featured = COALESCE(?, is_featured),
          is_sold_out_today = COALESCE(?, is_sold_out_today)
        WHERE id = ?`,
        [
          category_id,
          name,
          description,
          price,
          original_price,
          image_url,
          unit,
          item_type,
          combo_items ? JSON.stringify(combo_items) : null,
          buffet_type,
          buffet_price_per_pax,
          buffet_duration_minutes,
          is_available,
          is_featured,
          is_sold_out_today,
          id
        ]
      );
      return res.json({ success: true, message: 'Cập nhật món ăn thành công' });
    }

    const memory = getMemoryStore();
    const item = memory.menuItems.find((m) => m.id === parseInt(id));
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn' });
    }

    Object.assign(item, {
      ...(category_id && { category_id: parseInt(category_id) }),
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(original_price !== undefined && { original_price: parseFloat(original_price) }),
      ...(image_url && { image_url }),
      ...(unit && { unit }),
      ...(item_type && { item_type }),
      ...(combo_items && { combo_items }),
      ...(buffet_type && { buffet_type }),
      ...(buffet_price_per_pax !== undefined && { buffet_price_per_pax: parseFloat(buffet_price_per_pax) }),
      ...(buffet_duration_minutes !== undefined && { buffet_duration_minutes: parseInt(buffet_duration_minutes) }),
      ...(is_available !== undefined && { is_available }),
      ...(is_featured !== undefined && { is_featured }),
      ...(is_sold_out_today !== undefined && { is_sold_out_today })
    });

    return res.json({ success: true, message: 'Cập nhật món ăn thành công', data: item });
  } catch (error) {
    next(error);
  }
};

// Quick toggle: Hôm nay đã hết món / Món cực hot
exports.toggleSoldOutToday = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      const [rows] = await pool.query('SELECT is_sold_out_today, name FROM menu_items WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn' });
      }

      const newStatus = !rows[0].is_sold_out_today;
      await pool.query('UPDATE menu_items SET is_sold_out_today = ? WHERE id = ?', [newStatus, id]);

      return res.json({
        success: true,
        message: newStatus
          ? `Đã bật trạng thái "HÔM NAY ĐÃ HẾT MÓN (Món Cực Hot)" cho ${rows[0].name}!`
          : `Đã mở lại phục vụ món ${rows[0].name}!`,
        is_sold_out_today: newStatus
      });
    }

    const memory = getMemoryStore();
    const item = memory.menuItems.find((m) => m.id === parseInt(id));
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn' });
    }

    item.is_sold_out_today = !item.is_sold_out_today;
    return res.json({
      success: true,
      message: item.is_sold_out_today ? 'Đã bật trạng thái hết món hôm nay' : 'Đã mở lại phục vụ món',
      is_sold_out_today: item.is_sold_out_today
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query('UPDATE menu_items SET is_available = NOT is_available WHERE id = ?', [id]);
      const [rows] = await pool.query('SELECT is_available FROM menu_items WHERE id = ?', [id]);
      return res.json({
        success: true,
        message: rows[0].is_available ? 'Món đã sẵn sàng phục vụ' : 'Đã báo hết món',
        data: { is_available: rows[0].is_available }
      });
    }

    const memory = getMemoryStore();
    const item = memory.menuItems.find((m) => m.id === parseInt(id));
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn' });
    }

    item.is_available = !item.is_available;
    res.json({
      success: true,
      message: item.is_available ? 'Món đã sẵn sàng phục vụ' : 'Đã báo hết món',
      data: { is_available: item.is_available }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query('DELETE FROM menu_items WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Xóa món ăn thành công' });
    }

    const memory = getMemoryStore();
    const idx = memory.menuItems.findIndex((m) => m.id === parseInt(id));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn' });
    }

    memory.menuItems.splice(idx, 1);
    res.json({ success: true, message: 'Xóa món ăn thành công' });
  } catch (error) {
    next(error);
  }
};
