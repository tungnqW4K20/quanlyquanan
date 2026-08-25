const { getPool, isMySQL, getMemoryStore } = require('../config/database');

exports.getKitchenTickets = async (req, res, next) => {
  try {
    if (isMySQL()) {
      const pool = getPool();

      // 1. Auto-assign any pending tickets unassigned after 5 minutes (300 seconds) to Head Chef 'Trần Bếp Trưởng'
      await pool.query(`
        UPDATE order_items 
        SET assigned_chef_name = 'Trần Bếp Trưởng'
        WHERE (assigned_chef_name IS NULL OR assigned_chef_name = '' OR assigned_chef_name = 'Chưa phân công')
          AND status = 'pending'
          AND TIMESTAMPDIFF(SECOND, created_at, CURRENT_TIMESTAMP) >= 300
      `);

      const query = `
        SELECT 
          oi.id as item_id,
          oi.order_id,
          oi.quantity,
          oi.price,
          oi.status as item_status,
          oi.notes as item_notes,
          oi.assigned_chef_id,
          oi.assigned_chef_name,
          oi.cooking_started_at,
          oi.cooking_finished_at,
          oi.quality_rating,
          oi.is_returned,
          oi.return_reason,
          oi.created_at as item_time,
          TIMESTAMPDIFF(SECOND, oi.created_at, CURRENT_TIMESTAMP) as elapsed_seconds,
          mi.id as menu_item_id,
          COALESCE(mi.name, oi.notes, 'Món ăn') as dish_name,
          mi.image_url,
          COALESCE(mi.unit, 'Phần') as unit,
          COALESCE(c.name, 'Món chính') as category_name,
          t.id as table_id,
          t.table_name,
          t.area,
          o.created_at as order_time,
          o.notes as order_notes,
          o.is_buffet,
          o.buffet_package_name
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN dining_tables t ON o.table_id = t.id
        LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
        LEFT JOIN categories c ON mi.category_id = c.id
        WHERE o.status != 'paid' AND o.status != 'cancelled' AND oi.status != 'cancelled'
        ORDER BY 
          CASE oi.status 
            WHEN 'pending' THEN 1 
            WHEN 'cooking' THEN 2 
            WHEN 'ready' THEN 3 
            WHEN 'served' THEN 4 
            ELSE 5
          END ASC, 
          oi.created_at ASC
      `;
      const [rows] = await pool.query(query);

      const enhancedRows = rows.map((ticket) => {
        const elapsedSec = parseInt(ticket.elapsed_seconds) || 0;
        const isAutoAssigned = (!ticket.assigned_chef_name && elapsedSec >= 300) || (ticket.assigned_chef_name === 'Trần Bếp Trưởng' && elapsedSec >= 300 && ticket.item_status === 'pending');
        const finalChef = ticket.assigned_chef_name || (elapsedSec >= 300 ? 'Trần Bếp Trưởng' : null);

        return {
          ...ticket,
          assigned_chef_name: finalChef,
          is_auto_assigned: Boolean(isAutoAssigned),
          elapsed_seconds: elapsedSec,
          countdown_seconds: Math.max(0, 300 - elapsedSec)
        };
      });

      return res.json({ success: true, data: enhancedRows });
    }

    const memory = getMemoryStore();
    const tickets = [];

    for (const order of memory.orders) {
      if (order.status === 'paid' || order.status === 'cancelled') continue;

      const table = memory.tables.find((t) => t.id === order.table_id);
      for (const item of order.items || []) {
        if (item.status === 'cancelled') continue;
        const menuItem = memory.menuItems.find((m) => m.id === item.menu_item_id);
        const category = menuItem ? memory.categories.find((c) => c.id === menuItem.category_id) : null;

        const itemTime = new Date(item.created_at || order.created_at).getTime();
        const elapsedSec = Math.floor((Date.now() - itemTime) / 1000);

        if (!item.assigned_chef_name && elapsedSec >= 300) {
          item.assigned_chef_name = 'Trần Bếp Trưởng';
        }

        tickets.push({
          item_id: item.id,
          order_id: order.id,
          quantity: item.quantity,
          price: item.price,
          item_status: item.status,
          item_notes: item.notes,
          assigned_chef_id: item.assigned_chef_id || null,
          assigned_chef_name: item.assigned_chef_name || null,
          is_auto_assigned: item.assigned_chef_name === 'Trần Bếp Trưởng' && elapsedSec >= 300,
          elapsed_seconds: elapsedSec,
          countdown_seconds: Math.max(0, 300 - elapsedSec),
          cooking_started_at: item.cooking_started_at || null,
          cooking_finished_at: item.cooking_finished_at || null,
          quality_rating: item.quality_rating || 5,
          is_returned: item.is_returned || false,
          return_reason: item.return_reason || null,
          item_time: item.created_at || order.created_at,
          menu_item_id: item.menu_item_id,
          dish_name: item.name || (menuItem ? menuItem.name : 'Món ăn'),
          image_url: menuItem ? menuItem.image_url : '',
          unit: menuItem ? menuItem.unit : 'Phần',
          category_name: category ? category.name : 'Món chính',
          table_id: order.table_id,
          table_name: table ? table.table_name : `Bàn ${order.table_id}`,
          area: table ? table.area : 'Tầng 1',
          order_time: order.created_at,
          order_notes: order.notes,
          is_buffet: Boolean(order.is_buffet),
          buffet_package_name: order.buffet_package_name
        });
      }
    }

    const priority = { pending: 1, cooking: 2, ready: 3, served: 4 };
    tickets.sort((a, b) => {
      const pDiff = (priority[a.item_status] || 99) - (priority[b.item_status] || 99);
      if (pDiff !== 0) return pDiff;
      return new Date(a.item_time) - new Date(b.item_time);
    });

    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
};

exports.updateTicketStatus = async (req, res, next) => {
  try {
    const { item_id } = req.params;
    const { status, chef_name, chef_id } = req.body; // pending, cooking, ready, served

    if (!status) {
      return res.status(400).json({ success: false, message: 'Trạng thái là bắt buộc' });
    }

    if (isMySQL()) {
      const pool = getPool();

      // 1. Get the order item & order details
      const [itemRows] = await pool.query('SELECT * FROM order_items WHERE id = ?', [item_id]);
      if (itemRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn trong đơn' });
      }
      const item = itemRows[0];
      const orderId = item.order_id;
      const assignedChef = chef_name || item.assigned_chef_name || 'Trần Bếp Trưởng';

      // 2. Build update query for order_item
      let query = 'UPDATE order_items SET status = ?, assigned_chef_name = COALESCE(assigned_chef_name, ?)';
      const params = [status, assignedChef];

      if (chef_name) {
        query += ', assigned_chef_id = ?';
        params.push(chef_id || null);
      }

      if (status === 'cooking') {
        query += ', cooking_started_at = COALESCE(cooking_started_at, CURRENT_TIMESTAMP)';
      } else if (status === 'ready' || status === 'served') {
        query += ', cooking_finished_at = CURRENT_TIMESTAMP';
      }

      query += ' WHERE id = ?';
      params.push(item_id);

      await pool.query(query, params);

      // 3. Synchronize parent Order & Dining Table Status based on all order items!
      const [allItemRows] = await pool.query(
        'SELECT oi.status, o.table_id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.order_id = ? AND oi.status != "cancelled"',
        [orderId]
      );

      if (allItemRows.length > 0) {
        const tableId = allItemRows[0].table_id;
        const allServed = allItemRows.every((i) => i.status === 'served');
        const anyCooking = allItemRows.some((i) => i.status === 'cooking');
        const anyReady = allItemRows.some((i) => i.status === 'ready');
        const anyPending = allItemRows.some((i) => i.status === 'pending');

        let newOrderStatus = 'pending';
        let newTableStatus = 'waiting_food';

        if (allServed) {
          newOrderStatus = 'served';
          newTableStatus = 'occupied'; // Đã lên đủ món -> Khách đang dùng bữa
        } else if (anyCooking) {
          newOrderStatus = 'cooking';
          newTableStatus = 'waiting_food'; // Bếp đang nấu -> Bàn chờ món
        } else if (anyReady) {
          newOrderStatus = 'ready';
          newTableStatus = 'waiting_food'; // Món đã nấu xong chờ phục vụ bê lên bàn
        } else if (anyPending) {
          newOrderStatus = 'pending';
          newTableStatus = 'waiting_food';
        }

        await pool.query('UPDATE orders SET status = ? WHERE id = ?', [newOrderStatus, orderId]);
        await pool.query('UPDATE dining_tables SET status = ? WHERE id = ?', [newTableStatus, tableId]);
      }

      return res.json({
        success: true,
        message: status === 'served' ? 'Món đã được mang lên bàn phục vụ khách!' : `Đã chuyển trạng thái món sang: ${status}`
      });
    }

    const memory = getMemoryStore();
    for (const order of memory.orders) {
      const item = order.items.find((i) => i.id === parseInt(item_id));
      if (item) {
        const assignedChef = chef_name || item.assigned_chef_name || 'Trần Bếp Trưởng';
        item.status = status;
        item.assigned_chef_name = item.assigned_chef_name || assignedChef;
        if (chef_name) {
          item.assigned_chef_id = chef_id || null;
        }
        if (status === 'cooking') item.cooking_started_at = item.cooking_started_at || new Date().toISOString();
        if (status === 'ready' || status === 'served') item.cooking_finished_at = new Date().toISOString();

        // Sync table & order status in memory
        const activeItems = order.items.filter((i) => i.status !== 'cancelled');
        const allServed = activeItems.every((i) => i.status === 'served');
        const table = memory.tables.find((t) => t.id === order.table_id);

        if (allServed) {
          order.status = 'served';
          if (table) table.status = 'occupied';
        } else {
          order.status = 'cooking';
          if (table) table.status = 'waiting_food';
        }

        return res.json({ success: true, message: 'Cập nhật tiến độ món thành công', data: item });
      }
    }

    res.status(404).json({ success: false, message: 'Không tìm thấy món ăn trong đơn' });
  } catch (error) {
    next(error);
  }
};

exports.assignChef = async (req, res, next) => {
  try {
    const { item_id } = req.params;
    const { chef_id, chef_name, start_cooking = false } = req.body;

    const assignedChef = chef_name || 'Trần Bếp Trưởng';

    if (isMySQL()) {
      const pool = getPool();
      const [itemRows] = await pool.query('SELECT order_id FROM order_items WHERE id = ?', [item_id]);
      if (itemRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn trong đơn' });
      }
      const orderId = itemRows[0].order_id;

      if (start_cooking) {
        await pool.query(
          'UPDATE order_items SET assigned_chef_id = ?, assigned_chef_name = ?, status = "cooking", cooking_started_at = CURRENT_TIMESTAMP WHERE id = ?',
          [chef_id || null, assignedChef, item_id]
        );
        const [orderRows] = await pool.query('SELECT table_id FROM orders WHERE id = ?', [orderId]);
        if (orderRows.length > 0) {
          await pool.query('UPDATE orders SET status = "cooking" WHERE id = ?', [orderId]);
          await pool.query('UPDATE dining_tables SET status = "waiting_food" WHERE id = ?', [orderRows[0].table_id]);
        }
      } else {
        await pool.query(
          'UPDATE order_items SET assigned_chef_id = ?, assigned_chef_name = ? WHERE id = ?',
          [chef_id || null, assignedChef, item_id]
        );
      }

      return res.json({
        success: true,
        message: start_cooking
          ? `Đã phân công ${assignedChef} và bắt đầu chế biến!`
          : `Đã phân công ${assignedChef} phụ trách món này!`
      });
    }

    const memory = getMemoryStore();
    for (const order of memory.orders) {
      const item = order.items.find((i) => i.id === parseInt(item_id));
      if (item) {
        item.assigned_chef_id = chef_id || null;
        item.assigned_chef_name = assignedChef;
        if (start_cooking) {
          item.status = 'cooking';
          item.cooking_started_at = new Date().toISOString();
          order.status = 'cooking';
          const table = memory.tables.find((t) => t.id === order.table_id);
          if (table) table.status = 'waiting_food';
        }

        return res.json({
          success: true,
          message: start_cooking
            ? `Đã phân công ${assignedChef} và bắt đầu chế biến!`
            : `Đã phân công ${assignedChef} phụ trách món này!`,
          data: item
        });
      }
    }

    res.status(404).json({ success: false, message: 'Không tìm thấy món ăn trong đơn' });
  } catch (error) {
    next(error);
  }
};

// 4. Detailed Chef Cooking & Return History Dossier
exports.getChefCookingHistory = async (req, res, next) => {
  try {
    const { chef_name, date, is_returned } = req.query;

    if (isMySQL()) {
      const pool = getPool();
      let query = `
        SELECT 
          oi.id as item_id,
          oi.order_id,
          oi.quantity,
          oi.price,
          (oi.quantity * oi.price) as total_price,
          oi.status as item_status,
          COALESCE(oi.assigned_chef_name, 'Trần Bếp Trưởng') as assigned_chef_name,
          oi.assigned_chef_id,
          oi.cooking_started_at,
          oi.cooking_finished_at,
          oi.quality_rating,
          oi.quality_feedback,
          oi.is_returned,
          oi.return_reason,
          oi.penalty_deduction,
          oi.created_at as item_time,
          mi.name as dish_name,
          mi.image_url,
          mi.unit,
          t.table_name,
          t.area
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN dining_tables t ON o.table_id = t.id
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE 1=1
      `;
      const params = [];

      if (chef_name && chef_name !== 'all') {
        query += ' AND (oi.assigned_chef_name LIKE ? OR oi.assigned_chef_name IS NULL)';
        params.push(`%${chef_name}%`);
      }
      if (date) {
        query += ' AND DATE(oi.created_at) = ?';
        params.push(date);
      }
      if (is_returned === 'true') {
        query += ' AND oi.is_returned = TRUE';
      }

      query += ' ORDER BY oi.id DESC LIMIT 100';
      const [rows] = await pool.query(query, params);

      // Summary statistics
      const totalDishes = rows.length;
      const returnedCount = rows.filter((r) => r.is_returned).length;
      const totalPenalty = rows.reduce((sum, r) => sum + parseFloat(r.penalty_deduction || 0), 0);
      const avgRating = totalDishes > 0 ? (rows.reduce((sum, r) => sum + (r.quality_rating || 5), 0) / totalDishes).toFixed(1) : 5.0;

      return res.json({
        success: true,
        data: {
          summary: {
            total_dishes_cooked: totalDishes,
            returned_count: returnedCount,
            success_rate: totalDishes > 0 ? Math.round(((totalDishes - returnedCount) / totalDishes) * 100) : 100,
            total_penalty_deduction: totalPenalty,
            average_quality_rating: parseFloat(avgRating)
          },
          history: rows
        }
      });
    }

    return res.json({
      success: true,
      data: {
        summary: { total_dishes_cooked: 0, returned_count: 0, success_rate: 100, total_penalty_deduction: 0, average_quality_rating: 5 },
        history: []
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Record Dish Return & Penalty
exports.recordDishReturn = async (req, res, next) => {
  try {
    const { item_id } = req.params;
    const { return_reason, penalty_deduction = 0, quality_feedback = '', quality_rating = 1 } = req.body;

    if (!return_reason) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do khách trả lại món!' });
    }

    if (isMySQL()) {
      const pool = getPool();

      // Get item details
      const [rows] = await pool.query(
        `SELECT oi.*, mi.name as dish_name, t.table_name 
         FROM order_items oi 
         JOIN menu_items mi ON oi.menu_item_id = mi.id 
         JOIN orders o ON oi.order_id = o.id 
         JOIN dining_tables t ON o.table_id = t.id 
         WHERE oi.id = ?`,
        [item_id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn' });
      }

      const item = rows[0];
      const chefName = item.assigned_chef_name || 'Trần Bếp Trưởng';
      const penaltyAmount = parseFloat(penalty_deduction) || 0;

      // Update order item
      await pool.query(
        `UPDATE order_items 
         SET is_returned = TRUE, return_reason = ?, penalty_deduction = ?, quality_feedback = ?, quality_rating = ? 
         WHERE id = ?`,
        [return_reason, penaltyAmount, quality_feedback, quality_rating, item_id]
      );

      // Log into cancelled_order_items for financial and payroll audit
      await pool.query(
        `INSERT INTO cancelled_order_items (order_id, menu_item_id, dish_name, table_name, quantity, price, total_amount, reason, action_type, responsible_role, responsible_user_name, cancelled_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cancel', 'chef', ?, 'Thu Ngân/Phục Vụ')`,
        [
          item.order_id,
          item.menu_item_id,
          item.dish_name,
          item.table_name,
          item.quantity,
          item.price,
          item.quantity * item.price,
          `Đầu bếp làm lỗi trả món: ${return_reason}`,
          chefName
        ]
      );

      return res.json({
        success: true,
        message: `Đã ghi nhận trả món ${item.dish_name}. Lý do: ${return_reason}. Phạt trừ trách nhiệm: ${penaltyAmount.toLocaleString('vi-VN')} đ`
      });
    }

    return res.json({ success: true, message: 'Đã ghi nhận trả món thành công' });
  } catch (error) {
    next(error);
  }
};

