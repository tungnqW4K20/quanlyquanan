const { getPool, isMySQL, getMemoryStore } = require('../config/database');

// 1. Get Promotions (Active or All for Admin)
exports.getPromotions = async (req, res, next) => {
  try {
    const { active_only } = req.query;

    if (isMySQL()) {
      const pool = getPool();
      let query = 'SELECT * FROM promotions WHERE 1=1';
      const params = [];

      if (active_only === 'true') {
        query += ' AND is_active = TRUE';
      }
      query += ' ORDER BY id DESC';

      const [rows] = await pool.query(query, params);
      return res.json({ success: true, data: rows });
    }

    const memory = getMemoryStore();
    let list = [...(memory.promotions || [])];
    if (active_only === 'true') {
      list = list.filter((p) => p.is_active);
    }
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

// 2. Create Promotion Campaign / Advertising Banner
exports.createPromotion = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      badge_text = 'HOT DEAL',
      discount_percent = 10,
      discount_code = '',
      banner_url = '',
      theme_gradient = 'from-amber-600 to-orange-700',
      accent_color = '#F59E0B',
      is_active = true,
      start_date,
      end_date,
      description = ''
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Tiêu đề chương trình quảng cáo là bắt buộc' });
    }

    if (isMySQL()) {
      const pool = getPool();
      const [result] = await pool.query(
        `INSERT INTO promotions (title, subtitle, badge_text, discount_percent, discount_code, banner_url, theme_gradient, accent_color, is_active, start_date, end_date, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, subtitle, badge_text, discount_percent, discount_code, banner_url, theme_gradient, accent_color, is_active, start_date || null, end_date || null, description]
      );

      const newPromo = {
        id: result.insertId,
        title,
        subtitle,
        badge_text,
        discount_percent,
        discount_code,
        banner_url,
        theme_gradient,
        accent_color,
        is_active,
        start_date,
        end_date,
        description
      };

      return res.status(201).json({
        success: true,
        message: 'Tạo chiến dịch quảng cáo và banner thành công!',
        data: newPromo
      });
    }

    const memory = getMemoryStore();
    if (!memory.promotions) memory.promotions = [];
    const newId = memory.promotions.length > 0 ? Math.max(...memory.promotions.map((p) => p.id)) + 1 : 1;
    const newPromo = {
      id: newId,
      title,
      subtitle,
      badge_text,
      discount_percent,
      discount_code,
      banner_url,
      theme_gradient,
      accent_color,
      is_active,
      start_date,
      end_date,
      description
    };
    memory.promotions.unshift(newPromo);

    res.status(201).json({
      success: true,
      message: 'Tạo chiến dịch quảng cáo thành công!',
      data: newPromo
    });
  } catch (error) {
    next(error);
  }
};

// 3. Update Promotion
exports.updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      badge_text,
      discount_percent,
      discount_code,
      banner_url,
      theme_gradient,
      accent_color,
      is_active,
      start_date,
      end_date,
      description
    } = req.body;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query(
        `UPDATE promotions SET
          title = ?, subtitle = ?, badge_text = ?, discount_percent = ?,
          discount_code = ?, banner_url = ?, theme_gradient = ?, accent_color = ?,
          is_active = ?, start_date = ?, end_date = ?, description = ?
         WHERE id = ?`,
        [title, subtitle, badge_text, discount_percent, discount_code, banner_url, theme_gradient, accent_color, is_active, start_date || null, end_date || null, description, id]
      );

      return res.json({ success: true, message: 'Cập nhật chiến dịch quảng cáo thành công!' });
    }

    const memory = getMemoryStore();
    const promo = memory.promotions.find((p) => p.id === parseInt(id));
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chiến dịch' });
    }

    Object.assign(promo, {
      title,
      subtitle,
      badge_text,
      discount_percent,
      discount_code,
      banner_url,
      theme_gradient,
      accent_color,
      is_active,
      start_date,
      end_date,
      description
    });

    res.json({ success: true, message: 'Cập nhật chiến dịch thành công!', data: promo });
  } catch (error) {
    next(error);
  }
};

// 4. Delete Promotion
exports.deletePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query('DELETE FROM promotions WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Đã xóa chiến dịch quảng cáo' });
    }

    const memory = getMemoryStore();
    memory.promotions = memory.promotions.filter((p) => p.id !== parseInt(id));
    res.json({ success: true, message: 'Đã xóa chiến dịch quảng cáo' });
  } catch (error) {
    next(error);
  }
};
