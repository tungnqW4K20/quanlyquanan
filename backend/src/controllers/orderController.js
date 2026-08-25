const { getPool, isMySQL, getMemoryStore } = require('../config/database');

exports.getOrders = async (req, res, next) => {
  try {
    const { status, table_id } = req.query;

    if (isMySQL()) {
      const pool = getPool();
      let query = `
        SELECT o.*, t.table_name, t.area, u.full_name as staff_name 
        FROM orders o
        JOIN dining_tables t ON o.table_id = t.id
        LEFT JOIN users u ON o.staff_id = u.id
        WHERE 1=1
      `;
      const params = [];
      if (status && status !== 'all') {
        query += ' AND o.status = ?';
        params.push(status);
      }
      if (table_id) {
        query += ' AND o.table_id = ?';
        params.push(table_id);
      }
      query += ' ORDER BY o.id DESC';
      const [rows] = await pool.query(query, params);

      // Fetch items for each order
      for (const order of rows) {
        const [items] = await pool.query(
          `SELECT oi.*, mi.name, mi.image_url, mi.unit 
           FROM order_items oi 
           JOIN menu_items mi ON oi.menu_item_id = mi.id 
           WHERE oi.order_id = ?`,
          [order.id]
        );
        order.items = items;
      }
      return res.json({ success: true, data: rows });
    }

    const memory = getMemoryStore();
    let orders = [...memory.orders];
    if (status && status !== 'all') {
      orders = orders.filter((o) => o.status === status);
    }
    if (table_id) {
      orders = orders.filter((o) => o.table_id === parseInt(table_id));
    }
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      const [orderRows] = await pool.query(
        `SELECT o.*, t.table_name, t.area, u.full_name as staff_name 
         FROM orders o
         JOIN dining_tables t ON o.table_id = t.id
         LEFT JOIN users u ON o.staff_id = u.id
         WHERE o.id = ?`,
        [id]
      );
      if (orderRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }
      const order = orderRows[0];
      const [items] = await pool.query(
        `SELECT oi.*, mi.name, mi.image_url, mi.unit 
         FROM order_items oi 
         JOIN menu_items mi ON oi.menu_item_id = mi.id 
         WHERE oi.order_id = ?`,
        [id]
      );
      order.items = items;
      return res.json({ success: true, data: order });
    }

    const memory = getMemoryStore();
    const order = memory.orders.find((o) => o.id === parseInt(id));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const {
      table_id,
      items,
      notes,
      customer_name,
      discount_percent = 0,
      vat_percent = 8,
      is_buffet = false,
      buffet_package_name = null,
      buffet_pax_count = 0
    } = req.body;
    const staff_id = req.user ? req.user.id : null;
    const staff_name = req.user ? req.user.full_name : 'Nhân Viên';

    if (!table_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn bàn và ít nhất một món ăn' });
    }

    // Check if any item is a buffet item
    const hasBuffetItem = is_buffet || items.some((it) => it.item_type === 'buffet' || (it.name && it.name.toLowerCase().includes('buffet')));
    const buffetName = buffet_package_name || (hasBuffetItem ? items.find((i) => i.name.toLowerCase().includes('buffet'))?.name : null);
    const buffetPax = buffet_pax_count || (hasBuffetItem ? items.reduce((s, i) => s + (i.quantity || 1), 0) : 0);

    // Calculate totals
    let total_amount = 0;
    const processedItems = items.map((it, idx) => {
      const price = parseFloat(it.price) || 0;
      const quantity = parseInt(it.quantity) || 1;
      total_amount += price * quantity;
      return {
        id: it.id || idx + 1,
        menu_item_id: it.menu_item_id || it.id,
        name: it.name,
        price,
        quantity,
        status: 'pending',
        notes: it.notes || '',
        assigned_chef_name: it.assigned_chef_name || null
      };
    });

    const discountAmount = (total_amount * parseFloat(discount_percent)) / 100;
    const amountAfterDiscount = total_amount - discountAmount;
    const vatAmount = (amountAfterDiscount * parseFloat(vat_percent)) / 100;
    const final_amount = amountAfterDiscount + vatAmount;

    if (isMySQL()) {
      const pool = getPool();
      const [orderResult] = await pool.query(
        `INSERT INTO orders (
          table_id, staff_id, status, total_amount, discount_percent, vat_percent, final_amount, notes, customer_name,
          is_buffet, buffet_package_name, buffet_pax_count, buffet_started_at, buffet_expires_at
        ) VALUES (
          ?, ?, 'pending', ?, ?, ?, ?, ?, ?,
          ?, ?, ?, 
          ${hasBuffetItem ? 'CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 120 MINUTE)' : 'NULL, NULL'}
        )`,
        [
          table_id, staff_id, total_amount, discount_percent, vat_percent, final_amount, notes || '', customer_name || '',
          hasBuffetItem ? 1 : 0, buffetName, buffetPax
        ]
      );

      const orderId = orderResult.insertId;

      for (const item of processedItems) {
        await pool.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, price, status, notes, assigned_chef_name)
           VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
          [orderId, item.menu_item_id, item.quantity, item.price, item.notes || '', item.assigned_chef_name || null]
        );

        // Deduct recipe ingredients from stock
        const [recipes] = await pool.query('SELECT * FROM dish_recipes WHERE menu_item_id = ?', [item.menu_item_id]);
        for (const rec of recipes) {
          const consumeQty = parseFloat(rec.quantity_needed) * item.quantity;
          await pool.query('UPDATE ingredients SET current_stock = GREATEST(0, current_stock - ?) WHERE id = ?', [
            consumeQty,
            rec.ingredient_id
          ]);
        }
      }

      // Update table status and buffet timer
      await pool.query(
        `UPDATE dining_tables 
         SET status = "waiting_food", current_order_id = ?, is_buffet = ?,
             buffet_started_at = ${hasBuffetItem ? 'CURRENT_TIMESTAMP' : 'NULL'},
             buffet_expires_at = ${hasBuffetItem ? 'DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 120 MINUTE)' : 'NULL'}
         WHERE id = ?`,
        [orderId, hasBuffetItem ? 1 : 0, table_id]
      );

      return res.status(201).json({
        success: true,
        message: hasBuffetItem
          ? `Tạo đơn bàn ${table_id} với gói ${buffetName || 'Buffet'} (${buffetPax} người) - Bắt đầu đếm ngược 120 phút!`
          : 'Tạo đơn gọi món và gửi bếp thành công!',
        data: {
          id: orderId,
          table_id,
          status: 'pending',
          is_buffet: hasBuffetItem,
          buffet_package_name: buffetName,
          buffet_pax_count: buffetPax,
          total_amount,
          final_amount,
          items: processedItems
        }
      });
    }

    const memory = getMemoryStore();
    const table = memory.tables.find((t) => t.id === parseInt(table_id));
    if (!table) {
      return res.status(404).json({ success: false, message: 'Bàn không tồn tại' });
    }

    const newOrderId = memory.orders.length > 0 ? Math.max(...memory.orders.map((o) => o.id)) + 1 : 1;
    const newOrder = {
      id: newOrderId,
      table_id: parseInt(table_id),
      table_name: table.table_name,
      staff_id,
      staff_name,
      status: 'pending',
      total_amount,
      discount_percent: parseFloat(discount_percent),
      vat_percent: parseFloat(vat_percent),
      final_amount,
      notes: notes || '',
      customer_name: customer_name || '',
      created_at: new Date().toISOString(),
      items: processedItems.map((p, idx) => ({ ...p, id: idx + 1, order_id: newOrderId }))
    };

    memory.orders.push(newOrder);

    // Deduct memory stock
    for (const item of processedItems) {
      const recipes = memory.recipes.filter((r) => r.menu_item_id === item.menu_item_id);
      for (const rec of recipes) {
        const ing = memory.ingredients.find((i) => i.id === rec.ingredient_id);
        if (ing) {
          ing.current_stock = Math.max(0, ing.current_stock - (rec.quantity_needed || 0) * item.quantity);
        }
      }
    }

    table.status = 'waiting_food';
    table.current_order_id = newOrderId;

    res.status(201).json({
      success: true,
      message: `Đã tạo đơn cho ${table.table_name} và gửi yêu cầu vào bếp!`,
      data: newOrder
    });
  } catch (error) {
    next(error);
  }
};

exports.addItemsToOrder = async (req, res, next) => {
  try {
    let order_id = parseInt(req.params.order_id);
    const { items, table_id } = req.body;
    const staff_id = req.user ? req.user.id : null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách món thêm không được rỗng' });
    }

    if (isMySQL()) {
      const pool = getPool();

      // Check if order exists
      let [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [order_id]);

      if (orderRows.length === 0) {
        let targetTableId = table_id;
        if (!targetTableId) {
          const [tableRows] = await pool.query('SELECT id FROM dining_tables WHERE current_order_id = ?', [order_id]);
          if (tableRows.length > 0) {
            targetTableId = tableRows[0].id;
          }
        }

        if (!targetTableId) {
          return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng hoặc bàn tương ứng' });
        }

        const [newOrderResult] = await pool.query(
          `INSERT INTO orders (table_id, staff_id, status, total_amount, discount_percent, vat_percent, final_amount, notes)
           VALUES (?, ?, 'cooking', 0, 0, 8, 0, 'Đơn mới')`,
          [targetTableId, staff_id]
        );
        order_id = newOrderResult.insertId;
        await pool.query('UPDATE dining_tables SET status = "waiting_food", current_order_id = ? WHERE id = ?', [order_id, targetTableId]);
        [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [order_id]);
      }

      for (const item of items) {
        await pool.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, price, status, notes)
           VALUES (?, ?, ?, ?, 'pending', ?)`,
          [order_id, item.menu_item_id || item.id, item.quantity || 1, item.price, item.notes || '']
        );

        // Deduct ingredients stock
        const [recipes] = await pool.query('SELECT * FROM dish_recipes WHERE menu_item_id = ?', [item.menu_item_id || item.id]);
        for (const rec of recipes) {
          const consumeQty = parseFloat(rec.quantity_needed) * (item.quantity || 1);
          await pool.query('UPDATE ingredients SET current_stock = GREATEST(0, current_stock - ?) WHERE id = ?', [
            consumeQty,
            rec.ingredient_id
          ]);
        }
      }

      // Recalculate order totals
      const [itemRows] = await pool.query('SELECT * FROM order_items WHERE order_id = ? AND status != "cancelled"', [order_id]);
      const newTotal = itemRows.reduce((acc, it) => acc + parseFloat(it.price) * it.quantity, 0);

      const discount = parseFloat(orderRows[0].discount_percent || 0);
      const vat = parseFloat(orderRows[0].vat_percent || 8);
      const afterDiscount = newTotal - (newTotal * discount) / 100;
      const finalAmount = afterDiscount + (afterDiscount * vat) / 100;

      await pool.query('UPDATE orders SET total_amount = ?, final_amount = ?, status = "cooking" WHERE id = ?', [newTotal, finalAmount, order_id]);
      await pool.query('UPDATE dining_tables SET status = "waiting_food" WHERE id = ?', [orderRows[0].table_id]);

      return res.json({ success: true, message: 'Đã thêm món vào đơn và gửi bếp thành công' });
    }

    const memory = getMemoryStore();
    const order = memory.orders.find((o) => o.id === parseInt(order_id));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    let nextItemId = order.items.length > 0 ? Math.max(...order.items.map((i) => i.id)) + 1 : 1;
    for (const it of items) {
      order.items.push({
        id: nextItemId++,
        order_id: order.id,
        menu_item_id: it.menu_item_id || it.id,
        name: it.name,
        price: parseFloat(it.price),
        quantity: parseInt(it.quantity) || 1,
        status: 'pending',
        notes: it.notes || ''
      });

      // Deduct memory stock
      const recipes = memory.recipes.filter((r) => r.menu_item_id === (it.menu_item_id || it.id));
      for (const rec of recipes) {
        const ing = memory.ingredients.find((i) => i.id === rec.ingredient_id);
        if (ing) {
          ing.current_stock = Math.max(0, ing.current_stock - (rec.quantity_needed || 0) * (it.quantity || 1));
        }
      }
    }

    // Recalculate
    order.total_amount = order.items
      .filter((i) => i.status !== 'cancelled')
      .reduce((acc, i) => acc + i.price * i.quantity, 0);
    const afterDisc = order.total_amount - (order.total_amount * (order.discount_percent || 0)) / 100;
    order.final_amount = afterDisc + (afterDisc * (order.vat_percent || 8)) / 100;
    order.status = 'cooking';

    const table = memory.tables.find((t) => t.id === order.table_id);
    if (table) table.status = 'waiting_food';

    res.json({ success: true, message: 'Đã thêm món vào đơn và gửi bếp thành công!', data: order });
  } catch (error) {
    next(error);
  }
};

// 3. Cancel or Change a single dish from an active order WITH REASON, RESPONSIBILITY, and audit trail
exports.cancelOrderItemWithReason = async (req, res, next) => {
  try {
    const { item_id } = req.params;
    const {
      reason = 'Khách đổi ý',
      action_type = 'cancel',
      responsible_role = 'customer',
      responsible_user_id = null,
      responsible_user_name = null
    } = req.body;
    const staff_name = req.user ? req.user.full_name : 'Nhân Viên';

    if (isMySQL()) {
      const pool = getPool();
      // Fetch order item details
      const [itemRows] = await pool.query(
        `SELECT oi.*, mi.name as dish_name, o.table_id, t.table_name, o.discount_percent, o.vat_percent
         FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         JOIN orders o ON oi.order_id = o.id
         JOIN dining_tables t ON o.table_id = t.id
         WHERE oi.id = ?`,
        [item_id]
      );

      if (itemRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn trong đơn' });
      }

      const item = itemRows[0];
      const itemTotal = parseFloat(item.price) * item.quantity;

      // 1. Mark item as cancelled
      await pool.query('UPDATE order_items SET status = "cancelled" WHERE id = ?', [item_id]);

      // 2. Insert into cancelled_order_items audit table
      await pool.query(
        `INSERT INTO cancelled_order_items (
          order_id, menu_item_id, dish_name, table_name, quantity, price, total_amount,
          reason, action_type, responsible_role, responsible_user_id, responsible_user_name, cancelled_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.order_id,
          item.menu_item_id,
          item.dish_name,
          item.table_name,
          item.quantity,
          item.price,
          itemTotal,
          reason,
          action_type || 'cancel',
          responsible_role || 'customer',
          responsible_user_id || (responsible_role === 'chef' ? item.assigned_chef_id : (req.user ? req.user.id : null)),
          responsible_user_name || (responsible_role === 'chef' ? item.assigned_chef_name : (req.user ? req.user.full_name : null)),
          staff_name
        ]
      );

      // 3. Restore inventory if dish was pending / not yet cooked
      if (item.status === 'pending') {
        const [recipes] = await pool.query('SELECT * FROM dish_recipes WHERE menu_item_id = ?', [item.menu_item_id]);
        for (const rec of recipes) {
          const restoreQty = parseFloat(rec.quantity_needed) * item.quantity;
          await pool.query('UPDATE ingredients SET current_stock = current_stock + ? WHERE id = ?', [
            restoreQty,
            rec.ingredient_id
          ]);
        }
      }

      // 4. Recalculate order totals
      const [activeItems] = await pool.query('SELECT * FROM order_items WHERE order_id = ? AND status != "cancelled"', [item.order_id]);
      const newTotal = activeItems.reduce((acc, it) => acc + parseFloat(it.price) * it.quantity, 0);
      const discount = parseFloat(item.discount_percent || 0);
      const vat = parseFloat(item.vat_percent || 8);
      const afterDiscount = newTotal - (newTotal * discount) / 100;
      const finalAmount = afterDiscount + (afterDiscount * vat) / 100;

      await pool.query('UPDATE orders SET total_amount = ?, final_amount = ? WHERE id = ?', [newTotal, finalAmount, item.order_id]);

      return res.json({
        success: true,
        message: `Đã xử lý ${action_type === 'change_dish' ? 'đổi món' : 'hủy món'} "${item.dish_name}" (${reason}) thành công.`,
        data: {
          item_id,
          dish_name: item.dish_name,
          reason,
          action_type,
          new_final_amount: finalAmount
        }
      });
    }

    const memory = getMemoryStore();
    for (const o of memory.orders) {
      const it = o.items.find((i) => i.id === parseInt(item_id));
      if (it) {
        it.status = 'cancelled';
        const itemTotal = it.price * it.quantity;

        // Add to cancelled items
        const newCancelId = memory.cancelledItems.length > 0 ? Math.max(...memory.cancelledItems.map((c) => c.id)) + 1 : 1;
        memory.cancelledItems.unshift({
          id: newCancelId,
          order_id: o.id,
          menu_item_id: it.menu_item_id,
          dish_name: it.name,
          table_name: o.table_name || `Bàn #${o.table_id}`,
          quantity: it.quantity,
          price: it.price,
          total_amount: itemTotal,
          reason,
          action_type: action_type || 'cancel',
          responsible_role: responsible_role || 'customer',
          responsible_user_id,
          responsible_user_name,
          cancelled_by: staff_name,
          cancelled_at: new Date().toISOString()
        });

        // Recalculate order totals
        o.total_amount = o.items
          .filter((i) => i.status !== 'cancelled')
          .reduce((acc, i) => acc + i.price * i.quantity, 0);
        const afterDisc = o.total_amount - (o.total_amount * (o.discount_percent || 0)) / 100;
        o.final_amount = afterDisc + (afterDisc * (o.vat_percent || 8)) / 100;

        return res.json({
          success: true,
          message: `Đã xử lý ${action_type === 'change_dish' ? 'đổi món' : 'hủy món'} "${it.name}" (${reason}) thành công.`,
          data: it
        });
      }
    }

    res.status(404).json({ success: false, message: 'Không tìm thấy món ăn trong đơn' });
  } catch (error) {
    next(error);
  }
};

// 4. Get all cancelled items history (Admin audit)
exports.getCancelledOrderItems = async (req, res, next) => {
  try {
    if (isMySQL()) {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM cancelled_order_items ORDER BY id DESC LIMIT 100');
      return res.json({ success: true, data: rows });
    }

    const memory = getMemoryStore();
    res.json({ success: true, data: memory.cancelledItems });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderItemStatus = async (req, res, next) => {
  try {
    const { item_id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Trạng thái là bắt buộc' });
    }

    if (isMySQL()) {
      const pool = getPool();
      await pool.query('UPDATE order_items SET status = ? WHERE id = ?', [status, item_id]);
      return res.json({ success: true, message: 'Cập nhật trạng thái món thành công' });
    }

    const memory = getMemoryStore();
    for (const o of memory.orders) {
      const item = o.items.find((i) => i.id === parseInt(item_id));
      if (item) {
        item.status = status;
        const allServed = o.items.every((i) => i.status === 'served' || i.status === 'cancelled');
        if (allServed) {
          o.status = 'served';
          const table = memory.tables.find((t) => t.id === o.table_id);
          if (table) table.status = 'occupied';
        }
        return res.json({ success: true, message: 'Cập nhật trạng thái món thành công', data: item });
      }
    }

    res.status(404).json({ success: false, message: 'Không tìm thấy món ăn trong đơn' });
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      const [rows] = await pool.query('SELECT table_id FROM orders WHERE id = ?', [id]);
      if (rows.length > 0) {
        await pool.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [id]);
        await pool.query('UPDATE dining_tables SET status = "empty", current_order_id = NULL WHERE id = ?', [rows[0].table_id]);
      }
      return res.json({ success: true, message: 'Hủy đơn hàng thành công' });
    }

    const memory = getMemoryStore();
    const order = memory.orders.find((o) => o.id === parseInt(id));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    order.status = 'cancelled';
    const table = memory.tables.find((t) => t.id === order.table_id);
    if (table) {
      table.status = 'empty';
      table.current_order_id = null;
    }

    res.json({ success: true, message: 'Hủy đơn hàng thành công' });
  } catch (error) {
    next(error);
  }
};
