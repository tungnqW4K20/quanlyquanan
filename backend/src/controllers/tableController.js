const { getPool, isMySQL, getMemoryStore } = require('../config/database');

exports.getTables = async (req, res, next) => {
  try {
    const { area, status } = req.query;

    if (isMySQL()) {
      const pool = getPool();
      let query = `
        SELECT 
          t.*, 
          o.id as order_id, 
          o.status as order_status, 
          o.total_amount, 
          o.final_amount, 
          o.created_at as order_time,
          COALESCE(SUM(CASE WHEN oi.status != 'cancelled' THEN oi.quantity ELSE 0 END), 0) as item_count,
          COALESCE(SUM(CASE WHEN oi.status = 'served' THEN oi.quantity ELSE 0 END), 0) as served_count,
          COALESCE(SUM(CASE WHEN oi.status = 'pending' THEN oi.quantity ELSE 0 END), 0) as pending_count,
          COALESCE(SUM(CASE WHEN oi.status = 'cooking' THEN oi.quantity ELSE 0 END), 0) as cooking_count,
          COALESCE(SUM(CASE WHEN oi.status = 'ready' THEN oi.quantity ELSE 0 END), 0) as ready_count
        FROM dining_tables t
        LEFT JOIN orders o ON t.current_order_id = o.id AND o.status != 'paid' AND o.status != 'cancelled'
        LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.status != 'cancelled'
        WHERE 1=1
      `;
      const params = [];
      if (area && area !== 'all' && area !== 'Tất cả') {
        query += ' AND t.area = ?';
        params.push(area);
      }
      if (status && status !== 'all') {
        query += ' AND t.status = ?';
        params.push(status);
      }
      query += ' GROUP BY t.id, o.id ORDER BY t.area ASC, t.id ASC';

      const [rows] = await pool.query(query, params);

      // Also get confirmed reservations for these tables
      const [resvRows] = await pool.query(
        "SELECT * FROM table_reservations WHERE status = 'confirmed' ORDER BY reservation_time ASC"
      );

      const enhancedRows = rows.map((table) => {
        const matchingResv = resvRows.find((r) => r.table_id === table.id);
        let parsedResvInfo = null;

        if (matchingResv) {
          let preordered = [];
          try {
            preordered = typeof matchingResv.preordered_items === 'string' ? JSON.parse(matchingResv.preordered_items) : matchingResv.preordered_items || [];
          } catch (e) {
            preordered = [];
          }
          parsedResvInfo = {
            ...matchingResv,
            preordered_items: preordered
          };
        } else if (table.reservation_info) {
          try {
            parsedResvInfo = typeof table.reservation_info === 'string' ? JSON.parse(table.reservation_info) : table.reservation_info;
          } catch (e) {
            parsedResvInfo = null;
          }
        }

        // Accurately compute table status if active order exists
        let currentStatus = table.status;
        if (table.order_id && table.item_count > 0) {
          if (parseInt(table.served_count) === parseInt(table.item_count)) {
            currentStatus = 'occupied'; // Đã nhận đủ tất cả món -> Đang dùng bữa
          } else {
            currentStatus = 'waiting_food'; // Còn món đang nấu/chờ
          }
        }

        return {
          ...table,
          status: currentStatus,
          item_count: parseInt(table.item_count) || 0,
          served_count: parseInt(table.served_count) || 0,
          pending_count: parseInt(table.pending_count) || 0,
          cooking_count: parseInt(table.cooking_count) || 0,
          ready_count: parseInt(table.ready_count) || 0,
          has_reservation: Boolean(matchingResv || table.has_reservation),
          reservation_info: parsedResvInfo
        };
      });

      return res.json({ success: true, data: enhancedRows });
    }

    const memory = getMemoryStore();
    let tables = [...memory.tables];

    if (area && area !== 'all') {
      tables = tables.filter((t) => t.area === area);
    }
    if (status && status !== 'all') {
      tables = tables.filter((t) => t.status === status);
    }

    // Attach order summary
    const enhancedTables = tables.map((t) => {
      let orderInfo = null;
      if (t.current_order_id) {
        const order = memory.orders.find((o) => o.id === t.current_order_id && o.status !== 'paid' && o.status !== 'cancelled');
        if (order) {
          const activeItems = (order.items || []).filter((i) => i.status !== 'cancelled');
          const totalDishes = activeItems.reduce((acc, item) => acc + item.quantity, 0);
          const servedDishes = activeItems.filter((i) => i.status === 'served').reduce((acc, item) => acc + item.quantity, 0);

          orderInfo = {
            order_id: order.id,
            order_status: order.status,
            total_amount: order.total_amount,
            final_amount: order.final_amount,
            order_time: order.created_at,
            item_count: totalDishes,
            served_count: servedDishes
          };

          if (totalDishes > 0 && servedDishes === totalDishes) {
            t.status = 'occupied';
          } else if (totalDishes > 0) {
            t.status = 'waiting_food';
          }
        }
      }
      return {
        ...t,
        ...(orderInfo || {})
      };
    });

    res.json({ success: true, data: enhancedTables });
  } catch (error) {
    next(error);
  }
};

exports.getTableById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      const [tableRows] = await pool.query('SELECT * FROM dining_tables WHERE id = ?', [id]);
      if (tableRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bàn ăn' });
      }
      const table = tableRows[0];
      let currentOrder = null;

      if (table.current_order_id) {
        const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [table.current_order_id]);
        if (orderRows.length > 0) {
          currentOrder = orderRows[0];
          const [items] = await pool.query(
            `SELECT oi.*, COALESCE(mi.name, oi.notes, 'Món ăn') as name, mi.image_url, COALESCE(mi.unit, 'Phần') as unit 
             FROM order_items oi 
             LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id 
             WHERE oi.order_id = ?`,
            [currentOrder.id]
          );
          currentOrder.items = items;
        }
      }

      return res.json({ success: true, data: { ...table, current_order: currentOrder } });
    }

    const memory = getMemoryStore();
    const table = memory.tables.find((t) => t.id === parseInt(id));
    if (!table) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bàn ăn' });
    }

    let currentOrder = null;
    if (table.current_order_id) {
      currentOrder = memory.orders.find((o) => o.id === table.current_order_id && o.status !== 'paid');
    }

    res.json({ success: true, data: { ...table, current_order: currentOrder } });
  } catch (error) {
    next(error);
  }
};

exports.createTable = async (req, res, next) => {
  try {
    const { table_name, area, capacity } = req.body;

    if (!table_name) {
      return res.status(400).json({ success: false, message: 'Tên bàn là bắt buộc' });
    }

    if (isMySQL()) {
      const pool = getPool();
      const [result] = await pool.query(
        'INSERT INTO dining_tables (table_name, area, capacity, status) VALUES (?, ?, ?, ?)',
        [table_name, area || 'Tầng 1', capacity || 4, 'empty']
      );
      return res.status(201).json({
        success: true,
        message: 'Thêm bàn ăn thành công',
        data: { id: result.insertId, table_name, area: area || 'Tầng 1', capacity: capacity || 4, status: 'empty' }
      });
    }

    const memory = getMemoryStore();
    const existing = memory.tables.find((t) => t.table_name.toLowerCase() === table_name.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên bàn đã tồn tại' });
    }

    const newId = memory.tables.length > 0 ? Math.max(...memory.tables.map((t) => t.id)) + 1 : 1;
    const newTable = {
      id: newId,
      table_name,
      area: area || 'Tầng 1',
      capacity: parseInt(capacity) || 4,
      status: 'empty',
      current_order_id: null
    };

    memory.tables.push(newTable);
    res.status(201).json({ success: true, message: 'Thêm bàn ăn thành công', data: newTable });
  } catch (error) {
    next(error);
  }
};

exports.updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { table_name, area, capacity, status } = req.body;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query(
        'UPDATE dining_tables SET table_name = COALESCE(?, table_name), area = COALESCE(?, area), capacity = COALESCE(?, capacity), status = COALESCE(?, status) WHERE id = ?',
        [table_name, area, capacity, status, id]
      );
      return res.json({ success: true, message: 'Cập nhật thông tin bàn thành công' });
    }

    const memory = getMemoryStore();
    const table = memory.tables.find((t) => t.id === parseInt(id));
    if (!table) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bàn ăn' });
    }

    if (table_name) table.table_name = table_name;
    if (area) table.area = area;
    if (capacity) table.capacity = parseInt(capacity);
    if (status) table.status = status;

    res.json({ success: true, message: 'Cập nhật thông tin bàn thành công', data: table });
  } catch (error) {
    next(error);
  }
};

exports.deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query('DELETE FROM dining_tables WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Xóa bàn thành công' });
    }

    const memory = getMemoryStore();
    const index = memory.tables.findIndex((t) => t.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bàn ăn' });
    }

    const table = memory.tables[index];
    if (table.status !== 'empty') {
      return res.status(400).json({ success: false, message: 'Không thể xóa bàn đang có khách hoặc đang được sử dụng' });
    }

    memory.tables.splice(index, 1);
    res.json({ success: true, message: 'Xóa bàn thành công' });
  } catch (error) {
    next(error);
  }
};

exports.switchTable = async (req, res, next) => {
  try {
    const { from_table_id, to_table_id } = req.body;

    if (!from_table_id || !to_table_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin bàn chuyển' });
    }

    if (from_table_id === to_table_id) {
      return res.status(400).json({ success: false, message: 'Bàn chuyển và bàn đích phải khác nhau' });
    }

    if (isMySQL()) {
      const pool = getPool();
      const [fromRows] = await pool.query('SELECT * FROM dining_tables WHERE id = ?', [from_table_id]);
      const [toRows] = await pool.query('SELECT * FROM dining_tables WHERE id = ?', [to_table_id]);

      if (fromRows.length === 0 || toRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Bàn không tồn tại' });
      }

      const fromTable = fromRows[0];
      const toTable = toRows[0];

      if (!fromTable.current_order_id) {
        return res.status(400).json({ success: false, message: 'Bàn nguồn hiện đang trống, không có đơn hàng để chuyển' });
      }

      if (toTable.status !== 'empty' && toTable.current_order_id) {
        return res.status(400).json({ success: false, message: 'Bàn đích hiện đang có khách' });
      }

      // Update order table_id
      await pool.query('UPDATE orders SET table_id = ? WHERE id = ?', [to_table_id, fromTable.current_order_id]);
      // Update tables
      await pool.query('UPDATE dining_tables SET status = ?, current_order_id = ? WHERE id = ?', [fromTable.status, fromTable.current_order_id, to_table_id]);
      await pool.query('UPDATE dining_tables SET status = "empty", current_order_id = NULL WHERE id = ?', [from_table_id]);

      return res.json({ success: true, message: `Đã chuyển đơn từ ${fromTable.table_name} sang ${toTable.table_name}` });
    }

    const memory = getMemoryStore();
    const fromTable = memory.tables.find((t) => t.id === parseInt(from_table_id));
    const toTable = memory.tables.find((t) => t.id === parseInt(to_table_id));

    if (!fromTable || !toTable) {
      return res.status(404).json({ success: false, message: 'Bàn không tồn tại' });
    }

    if (!fromTable.current_order_id) {
      return res.status(400).json({ success: false, message: 'Bàn nguồn hiện đang trống' });
    }

    if (toTable.status !== 'empty' && toTable.current_order_id) {
      return res.status(400).json({ success: false, message: 'Bàn đích hiện đang có khách' });
    }

    const order = memory.orders.find((o) => o.id === fromTable.current_order_id);
    if (order) {
      order.table_id = toTable.id;
      order.table_name = toTable.table_name;
    }

    toTable.status = fromTable.status;
    toTable.current_order_id = fromTable.current_order_id;

    fromTable.status = 'empty';
    fromTable.current_order_id = null;

    res.json({
      success: true,
      message: `Đã chuyển từ ${fromTable.table_name} sang ${toTable.table_name} thành công!`
    });
  } catch (error) {
    next(error);
  }
};
