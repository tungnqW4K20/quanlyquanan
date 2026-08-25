const { getPool, isMySQL, getMemoryStore } = require('../config/database');

// 1. Get all reservations
exports.getReservations = async (req, res, next) => {
  try {
    const { status, date, table_id } = req.query;

    if (isMySQL()) {
      const pool = getPool();
      let query = `
        SELECT r.*, t.table_name, t.area, t.capacity 
        FROM table_reservations r
        JOIN dining_tables t ON r.table_id = t.id
        WHERE 1=1
      `;
      const params = [];

      if (status && status !== 'all') {
        query += ' AND r.status = ?';
        params.push(status);
      }
      if (date) {
        query += ' AND DATE(r.reservation_time) = ?';
        params.push(date);
      }
      if (table_id) {
        query += ' AND r.table_id = ?';
        params.push(table_id);
      }

      query += ' ORDER BY r.reservation_time ASC';
      const [rows] = await pool.query(query, params);

      const parsedRows = rows.map((r) => {
        let preordered = [];
        try {
          preordered = typeof r.preordered_items === 'string' ? JSON.parse(r.preordered_items) : r.preordered_items || [];
        } catch (e) {
          preordered = [];
        }
        return {
          ...r,
          preordered_items: preordered
        };
      });

      return res.json({ success: true, data: parsedRows });
    }

    // In-memory fallback
    const memory = getMemoryStore();
    let reservations = [...(memory.reservations || [])];

    if (status && status !== 'all') {
      reservations = reservations.filter((r) => r.status === status);
    }
    if (table_id) {
      reservations = reservations.filter((r) => r.table_id === parseInt(table_id));
    }
    if (date) {
      reservations = reservations.filter((r) => (r.reservation_time || '').startsWith(date));
    }

    reservations.sort((a, b) => new Date(a.reservation_time) - new Date(b.reservation_time));
    return res.json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

// 2. Create Reservation
exports.createReservation = async (req, res, next) => {
  try {
    const {
      table_id,
      customer_name,
      customer_phone,
      guest_count = 2,
      reservation_time,
      special_notes = '',
      deposit_amount = 0,
      preordered_items = []
    } = req.body;

    if (!table_id || !customer_name || !customer_phone || !reservation_time) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ bàn, tên khách, số điện thoại và thời gian đặt bàn!'
      });
    }

    if (isMySQL()) {
      const pool = getPool();

      // Get table details
      const [tableRows] = await pool.query('SELECT table_name FROM dining_tables WHERE id = ?', [table_id]);
      const tableName = tableRows.length > 0 ? tableRows[0].table_name : `Bàn #${table_id}`;

      const [result] = await pool.query(
        `INSERT INTO table_reservations (table_id, table_name, customer_name, customer_phone, guest_count, reservation_time, status, preordered_items, special_notes, deposit_amount)
         VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)`,
        [
          table_id,
          tableName,
          customer_name,
          customer_phone,
          parseInt(guest_count),
          reservation_time,
          JSON.stringify(preordered_items),
          special_notes,
          parseFloat(deposit_amount)
        ]
      );

      // Update table reservation status
      await pool.query(
        'UPDATE dining_tables SET has_reservation = TRUE, reservation_info = ? WHERE id = ?',
        [
          JSON.stringify({
            reservation_id: result.insertId,
            customer_name,
            customer_phone,
            guest_count,
            reservation_time,
            special_notes,
            preordered_items_count: preordered_items.length
          }),
          table_id
        ]
      );

      return res.status(201).json({
        success: true,
        message: `Đặt trước thành công ${tableName} cho khách ${customer_name} lúc ${reservation_time}!`,
        data: {
          id: result.insertId,
          table_id,
          table_name: tableName,
          customer_name,
          customer_phone,
          guest_count,
          reservation_time,
          status: 'confirmed',
          preordered_items,
          special_notes,
          deposit_amount
        }
      });
    }

    // In-memory fallback
    const memory = getMemoryStore();
    const table = memory.tables.find((t) => t.id === parseInt(table_id));
    const newReservation = {
      id: (memory.reservations?.length || 0) + 1,
      table_id: parseInt(table_id),
      table_name: table ? table.table_name : `Bàn #${table_id}`,
      customer_name,
      customer_phone,
      guest_count: parseInt(guest_count),
      reservation_time,
      status: 'confirmed',
      preordered_items,
      special_notes,
      deposit_amount: parseFloat(deposit_amount),
      created_at: new Date().toISOString()
    };

    if (!memory.reservations) memory.reservations = [];
    memory.reservations.push(newReservation);

    if (table) {
      table.has_reservation = true;
      table.reservation_info = newReservation;
    }

    return res.status(201).json({
      success: true,
      message: `Đặt trước thành công cho khách ${customer_name}!`,
      data: newReservation
    });
  } catch (error) {
    next(error);
  }
};

// 3. Check-in Reservation (Khách đến nhận bàn & tự động tạo order nếu có pre-orders)
exports.checkinReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff_id = req.user ? req.user.id : null;

    if (isMySQL()) {
      const pool = getPool();
      const [resvRows] = await pool.query('SELECT * FROM table_reservations WHERE id = ?', [id]);
      if (resvRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin đặt bàn' });
      }

      const resv = resvRows[0];
      let preordered = [];
      try {
        preordered = typeof resv.preordered_items === 'string' ? JSON.parse(resv.preordered_items) : resv.preordered_items || [];
      } catch (e) {
        preordered = [];
      }

      // Mark reservation as seated
      await pool.query("UPDATE table_reservations SET status = 'seated' WHERE id = ?", [id]);

      // If table already has an active order, just attach info
      const [activeOrderRows] = await pool.query("SELECT id FROM orders WHERE table_id = ? AND status IN ('pending', 'processing')", [resv.table_id]);
      let orderId = null;

      if (activeOrderRows.length > 0) {
        orderId = activeOrderRows[0].id;
      } else {
        // Create new order
        let totalAmount = 0;
        preordered.forEach((it) => {
          totalAmount += (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 1);
        });

        const vatAmount = totalAmount * 0.08;
        const finalAmount = totalAmount + vatAmount;

        const [orderResult] = await pool.query(
          `INSERT INTO orders (table_id, staff_id, status, total_amount, vat_percent, final_amount, notes, customer_name)
           VALUES (?, ?, 'pending', ?, 8, ?, ?, ?)`,
          [
            resv.table_id,
            staff_id,
            totalAmount,
            finalAmount,
            `Khách nhận bàn đặt trước (Ghi chú: ${resv.special_notes || 'Không'})`,
            resv.customer_name
          ]
        );
        orderId = orderResult.insertId;

        // Insert pre-ordered items into order_items
        for (const item of preordered) {
          const [menuRows] = await pool.query('SELECT id, name, price FROM menu_items WHERE name LIKE ? LIMIT 1', [`%${item.name}%`]);
          const menuItemId = menuRows.length > 0 ? menuRows[0].id : 1;
          const itemPrice = menuRows.length > 0 ? menuRows[0].price : item.price;

          await pool.query(
            `INSERT INTO order_items (order_id, menu_item_id, quantity, price, status, notes, assigned_chef_name)
             VALUES (?, ?, ?, ?, 'pending', 'Món đặt trước', 'Trần Bếp Trưởng')`,
            [orderId, menuItemId, item.quantity || 1, itemPrice]
          );
        }
      }

      // Update dining table
      await pool.query(
        "UPDATE dining_tables SET status = 'occupied', current_order_id = ?, has_reservation = FALSE WHERE id = ?",
        [orderId, resv.table_id]
      );

      return res.json({
        success: true,
        message: `Đã nhận bàn ${resv.table_name} cho khách ${resv.customer_name} thành công! Đã nạp ${preordered.length} món đặt trước vào order.`,
        data: {
          reservation_id: resv.id,
          table_id: resv.table_id,
          order_id: orderId,
          customer_name: resv.customer_name
        }
      });
    }

    // In-memory fallback
    const memory = getMemoryStore();
    const resv = (memory.reservations || []).find((r) => r.id === parseInt(id));
    if (!resv) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin đặt bàn' });
    }

    resv.status = 'seated';
    const table = memory.tables.find((t) => t.id === resv.table_id);
    if (table) {
      table.status = 'occupied';
      table.has_reservation = false;
    }

    return res.json({
      success: true,
      message: `Đã nhận bàn thành công cho khách ${resv.customer_name}!`,
      data: resv
    });
  } catch (error) {
    next(error);
  }
};

// 4. Cancel Reservation
exports.cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Khách báo hủy' } = req.body;

    if (isMySQL()) {
      const pool = getPool();
      const [resvRows] = await pool.query('SELECT * FROM table_reservations WHERE id = ?', [id]);
      if (resvRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin đặt bàn' });
      }

      const resv = resvRows[0];
      await pool.query("UPDATE table_reservations SET status = 'cancelled', special_notes = CONCAT(COALESCE(special_notes, ''), ' [Hủy: ', ?, ']') WHERE id = ?", [reason, id]);
      await pool.query('UPDATE dining_tables SET has_reservation = FALSE, reservation_info = NULL WHERE id = ?', [resv.table_id]);

      return res.json({
        success: true,
        message: `Đã hủy lịch đặt trước của bàn ${resv.table_name}!`
      });
    }

    // In-memory fallback
    const memory = getMemoryStore();
    const resv = (memory.reservations || []).find((r) => r.id === parseInt(id));
    if (resv) {
      resv.status = 'cancelled';
      const table = memory.tables.find((t) => t.id === resv.table_id);
      if (table) {
        table.has_reservation = false;
        table.reservation_info = null;
      }
    }

    return res.json({ success: true, message: 'Đã hủy lịch đặt bàn thành công!' });
  } catch (error) {
    next(error);
  }
};
