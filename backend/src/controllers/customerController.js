const { getPool, isMySQL, getMemoryStore } = require('../config/database');

// 1. Lookup Customer by Phone Number or Register New Loyalty Profile
exports.lookupCustomer = async (req, res, next) => {
  try {
    const { phone, full_name } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Số điện thoại là bắt buộc' });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');

    if (isMySQL()) {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM customers WHERE phone = ?', [cleanPhone]);

      if (rows.length > 0) {
        const customer = rows[0];
        // Fetch active rewards
        const [rewards] = await pool.query(
          'SELECT * FROM minigame_rewards WHERE customer_phone = ? AND is_used = FALSE ORDER BY id DESC',
          [cleanPhone]
        );
        return res.json({
          success: true,
          message: `Chào mừng ${customer.full_name} trở lại Hoàng Gia Quán!`,
          data: {
            ...customer,
            available_rewards: rewards
          }
        });
      }

      // If new, create customer with 50 bonus welcoming points
      const custName = full_name || `Khách hàng ${cleanPhone.slice(-4)}`;
      const [insertResult] = await pool.query(
        `INSERT INTO customers (phone, full_name, points, tier, total_spent, visits_count, notes)
         VALUES (?, ?, 50, 'bronze', 0, 1, 'Hội viên mới đăng ký tại bàn')`,
        [cleanPhone, custName]
      );

      const newCustomer = {
        id: insertResult.insertId,
        phone: cleanPhone,
        full_name: custName,
        points: 50,
        tier: 'bronze',
        total_spent: 0,
        visits_count: 1,
        notes: 'Hội viên mới đăng ký tại bàn',
        available_rewards: []
      };

      return res.status(201).json({
        success: true,
        message: 'Đăng ký hội viên thành công! Bạn được tặng ngay 50 điểm thưởng.',
        data: newCustomer
      });
    }

    const memory = getMemoryStore();
    if (!memory.customers) memory.customers = [];
    let customer = memory.customers.find((c) => c.phone === cleanPhone);

    if (customer) {
      const rewards = (memory.minigameRewards || []).filter((r) => r.customer_phone === cleanPhone && !r.is_used);
      return res.json({
        success: true,
        message: `Chào mừng ${customer.full_name} trở lại!`,
        data: { ...customer, available_rewards: rewards }
      });
    }

    const newId = memory.customers.length > 0 ? Math.max(...memory.customers.map((c) => c.id)) + 1 : 1;
    const custName = full_name || `Khách hàng ${cleanPhone.slice(-4)}`;
    customer = {
      id: newId,
      phone: cleanPhone,
      full_name: custName,
      points: 50,
      tier: 'bronze',
      total_spent: 0,
      visits_count: 1,
      notes: 'Hội viên mới'
    };
    memory.customers.push(customer);

    res.status(201).json({
      success: true,
      message: 'Đăng ký hội viên thành công! Bạn được tặng ngay 50 điểm thưởng.',
      data: { ...customer, available_rewards: [] }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Play Mini Game & Claim Rewards (Lucky Wheel & Card Matching)
exports.playMinigame = async (req, res, next) => {
  try {
    const {
      customer_phone,
      customer_name,
      game_type = 'lucky_wheel',
      reward_type = 'points', // 'points', 'voucher', 'drink', 'appetizer'
      reward_value = '100',
      reward_label = '+100 Điểm Thưởng'
    } = req.body;

    if (!customer_phone) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số điện thoại nhận thưởng' });
    }

    const cleanPhone = customer_phone.trim().replace(/\s+/g, '');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const reward_code = `HG-${game_type === 'lucky_wheel' ? 'WHEEL' : 'MATCH'}-${cleanPhone.slice(-4)}-${randomCode}`;

    let addedPoints = 0;
    if (reward_type === 'points') {
      addedPoints = parseInt(reward_value) || 100;
    }

    if (isMySQL()) {
      const pool = getPool();

      // Check / create customer
      const [custRows] = await pool.query('SELECT * FROM customers WHERE phone = ?', [cleanPhone]);
      let customer = custRows[0];

      if (!customer) {
        const custName = customer_name || `Khách ${cleanPhone.slice(-4)}`;
        const [createResult] = await pool.query(
          'INSERT INTO customers (phone, full_name, points, tier, total_spent, visits_count) VALUES (?, ?, ?, "bronze", 0, 1)',
          [cleanPhone, custName, 50 + addedPoints]
        );
        customer = {
          id: createResult.insertId,
          phone: cleanPhone,
          full_name: custName,
          points: 50 + addedPoints,
          tier: 'bronze'
        };
      } else if (addedPoints > 0) {
        const newPoints = customer.points + addedPoints;
        // Update tier based on points
        let newTier = customer.tier;
        if (newPoints >= 3500) newTier = 'diamond';
        else if (newPoints >= 1500) newTier = 'gold';
        else if (newPoints >= 500) newTier = 'silver';

        await pool.query('UPDATE customers SET points = ?, tier = ? WHERE id = ?', [newPoints, newTier, customer.id]);
        customer.points = newPoints;
        customer.tier = newTier;
      }

      // Record reward log
      await pool.query(
        `INSERT INTO minigame_rewards (customer_phone, game_type, reward_type, reward_value, reward_code, is_used)
         VALUES (?, ?, ?, ?, ?, FALSE)`,
        [cleanPhone, game_type, reward_type, reward_label, reward_code]
      );

      return res.json({
        success: true,
        message: `Chúc mừng bạn đã trúng "${reward_label}"!`,
        data: {
          reward_code,
          reward_label,
          reward_type,
          reward_value,
          updated_customer: customer
        }
      });
    }

    // In-memory fallback
    const memory = getMemoryStore();
    if (!memory.minigameRewards) memory.minigameRewards = [];
    if (!memory.customers) memory.customers = [];

    let customer = memory.customers.find((c) => c.phone === cleanPhone);
    if (!customer) {
      customer = {
        id: memory.customers.length + 1,
        phone: cleanPhone,
        full_name: customer_name || `Khách ${cleanPhone.slice(-4)}`,
        points: 50 + addedPoints,
        tier: 'bronze',
        total_spent: 0,
        visits_count: 1
      };
      memory.customers.push(customer);
    } else if (addedPoints > 0) {
      customer.points += addedPoints;
    }

    const rewardEntry = {
      id: memory.minigameRewards.length + 1,
      customer_phone: cleanPhone,
      game_type,
      reward_type,
      reward_value: reward_label,
      reward_code,
      is_used: false,
      created_at: new Date().toISOString()
    };
    memory.minigameRewards.push(rewardEntry);

    res.json({
      success: true,
      message: `Chúc mừng bạn đã trúng "${reward_label}"!`,
      data: {
        reward_code,
        reward_label,
        reward_type,
        reward_value,
        updated_customer: customer
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Submit Customer Feedback & Experience Review
exports.submitFeedback = async (req, res, next) => {
  try {
    const {
      customer_phone = '',
      customer_name = 'Khách Ẩn Danh',
      table_name = 'Tại bàn',
      food_rating = 5,
      service_rating = 5,
      overall_rating = 5,
      comment = ''
    } = req.body;

    const numFood = Math.max(1, Math.min(5, parseInt(food_rating) || 5));
    const numService = Math.max(1, Math.min(5, parseInt(service_rating) || 5));
    const numOverall = Math.max(1, Math.min(5, parseInt(overall_rating) || 5));

    if (isMySQL()) {
      const pool = getPool();
      const [result] = await pool.query(
        `INSERT INTO customer_feedbacks (customer_phone, customer_name, table_name, food_rating, service_rating, overall_rating, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [customer_phone, customer_name, table_name, numFood, numService, numOverall, comment]
      );

      // Reward 30 gratitude points if phone provided
      if (customer_phone) {
        await pool.query('UPDATE customers SET points = points + 30 WHERE phone = ?', [customer_phone]);
      }

      return res.status(201).json({
        success: true,
        message: 'Cảm ơn quý khách đã gửi ý kiến đóng góp quý báu!',
        data: {
          id: result.insertId,
          customer_phone,
          customer_name,
          table_name,
          food_rating: numFood,
          service_rating: numService,
          overall_rating: numOverall,
          comment
        }
      });
    }

    const memory = getMemoryStore();
    if (!memory.feedbacks) memory.feedbacks = [];
    const newFeedback = {
      id: memory.feedbacks.length + 1,
      customer_phone,
      customer_name,
      table_name,
      food_rating: numFood,
      service_rating: numService,
      overall_rating: numOverall,
      comment,
      created_at: new Date().toISOString()
    };
    memory.feedbacks.unshift(newFeedback);

    res.status(201).json({
      success: true,
      message: 'Cảm ơn quý khách đã gửi ý kiến đóng góp quý báu!',
      data: newFeedback
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get All Loyalty Customers (Admin View)
exports.getCustomers = async (req, res, next) => {
  try {
    const { search, tier } = req.query;

    if (isMySQL()) {
      const pool = getPool();
      let query = 'SELECT * FROM customers WHERE 1=1';
      const params = [];

      if (search) {
        query += ' AND (phone LIKE ? OR full_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      if (tier && tier !== 'all') {
        query += ' AND tier = ?';
        params.push(tier);
      }
      query += ' ORDER BY points DESC, id DESC';

      const [rows] = await pool.query(query, params);
      return res.json({ success: true, data: rows });
    }

    const memory = getMemoryStore();
    let list = [...(memory.customers || [])];

    if (search) {
      const term = search.toLowerCase();
      list = list.filter((c) => c.phone.includes(term) || c.full_name.toLowerCase().includes(term));
    }
    if (tier && tier !== 'all') {
      list = list.filter((c) => c.tier === tier);
    }
    list.sort((a, b) => (b.points || 0) - (a.points || 0));

    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

// 5. Get All Feedbacks & Reviews (Admin View)
exports.getFeedbacks = async (req, res, next) => {
  try {
    if (isMySQL()) {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM customer_feedbacks ORDER BY id DESC LIMIT 100');
      return res.json({ success: true, data: rows });
    }

    const memory = getMemoryStore();
    res.json({ success: true, data: memory.feedbacks || [] });
  } catch (error) {
    next(error);
  }
};
