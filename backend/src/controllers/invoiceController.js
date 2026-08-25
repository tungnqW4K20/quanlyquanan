const { getPool, isMySQL, getMemoryStore } = require('../config/database');

// 1. Get all invoices with filtering & search
exports.getInvoices = async (req, res, next) => {
  try {
    const { search, payment_method, date, month_year } = req.query;

    if (isMySQL()) {
      const pool = getPool();
      let query = `
        SELECT i.*, o.table_id, t.table_name
        FROM invoices i
        JOIN orders o ON i.order_id = o.id
        JOIN dining_tables t ON o.table_id = t.id
        WHERE 1=1
      `;
      const params = [];
      if (search) {
        query += ' AND (i.invoice_code LIKE ? OR t.table_name LIKE ? OR i.staff_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (payment_method && payment_method !== 'all') {
        query += ' AND i.payment_method = ?';
        params.push(payment_method);
      }
      if (date) {
        query += ' AND DATE(i.created_at) = ?';
        params.push(date);
      }
      if (month_year) {
        query += " AND DATE_FORMAT(i.created_at, '%Y-%m') = ?";
        params.push(month_year);
      }
      query += ' ORDER BY i.id DESC';

      const [rows] = await pool.query(query, params);

      const parsedRows = rows.map((r) => ({
        ...r,
        total_amount: Math.round(parseFloat(r.total_amount || 0)),
        discount_amount: Math.round(parseFloat(r.discount_amount || 0)),
        vat_amount: Math.round(parseFloat(r.vat_amount || 0)),
        final_amount: Math.round(parseFloat(r.final_amount || 0)),
        customer_paid: Math.round(parseFloat(r.customer_paid || 0)),
        change_amount: Math.round(parseFloat(r.change_amount || 0))
      }));

      return res.json({ success: true, data: parsedRows });
    }

    const memory = getMemoryStore();
    let invoices = [...memory.invoices];

    if (search) {
      const term = search.toLowerCase();
      invoices = invoices.filter(
        (i) =>
          i.invoice_code.toLowerCase().includes(term) ||
          i.table_name.toLowerCase().includes(term) ||
          (i.staff_name && i.staff_name.toLowerCase().includes(term))
      );
    }
    if (payment_method && payment_method !== 'all') {
      invoices = invoices.filter((i) => i.payment_method === payment_method);
    }
    if (date) {
      invoices = invoices.filter((i) => i.created_at.startsWith(date));
    }
    if (month_year) {
      invoices = invoices.filter((i) => i.created_at.startsWith(month_year));
    }

    invoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Invoice by ID or Code
exports.getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      const [rows] = await pool.query(
        `SELECT i.*, o.table_id, t.table_name 
         FROM invoices i 
         JOIN orders o ON i.order_id = o.id 
         JOIN dining_tables t ON o.table_id = t.id 
         WHERE i.id = ? OR i.invoice_code = ?`,
        [id, id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
      }
      const invoice = rows[0];
      const [items] = await pool.query(
        `SELECT oi.*, mi.name, mi.unit 
         FROM order_items oi 
         JOIN menu_items mi ON oi.menu_item_id = mi.id 
         WHERE oi.order_id = ? AND oi.status != 'cancelled'`,
        [invoice.order_id]
      );

      invoice.total_amount = Math.round(parseFloat(invoice.total_amount || 0));
      invoice.discount_amount = Math.round(parseFloat(invoice.discount_amount || 0));
      invoice.vat_amount = Math.round(parseFloat(invoice.vat_amount || 0));
      invoice.final_amount = Math.round(parseFloat(invoice.final_amount || 0));
      invoice.customer_paid = Math.round(parseFloat(invoice.customer_paid || 0));
      invoice.change_amount = Math.round(parseFloat(invoice.change_amount || 0));
      invoice.items = items;

      return res.json({ success: true, data: invoice });
    }

    const memory = getMemoryStore();
    const invoice = memory.invoices.find((i) => i.id === parseInt(id) || i.invoice_code === id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// 3. Checkout Order & Create Official Financial Invoice
exports.checkout = async (req, res, next) => {
  try {
    const {
      order_id,
      payment_method = 'cash',
      discount_percent = 0,
      vat_percent = 8,
      customer_paid = 0,
      customer_phone = '',
      customer_name = '',
      points_used = 0,
      voucher_code = ''
    } = req.body;

    const staff_name = req.user ? req.user.full_name : 'Thu Ngân';

    if (!order_id) {
      return res.status(400).json({ success: false, message: 'ID đơn hàng là bắt buộc' });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const invoice_code = `HD-${dateStr}-${randomCode}`;

    if (isMySQL()) {
      const pool = getPool();
      const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [order_id]);
      if (orderRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }
      const order = orderRows[0];
      if (order.status === 'paid') {
        return res.status(400).json({ success: false, message: 'Đơn hàng này đã được thanh toán hoàn tất trước đó' });
      }

      // Fetch active non-cancelled items
      const [items] = await pool.query(
        `SELECT oi.*, mi.name, mi.unit 
         FROM order_items oi 
         JOIN menu_items mi ON oi.menu_item_id = mi.id 
         WHERE oi.order_id = ? AND oi.status != 'cancelled'`,
        [order_id]
      );

      if (items.length === 0) {
        return res.status(400).json({ success: false, message: 'Đơn hàng không có món ăn hợp lệ để thanh toán' });
      }

      // Exact Financial Calculations (Zero cents error, strictly rounded to nearest integer VND)
      const numDiscountPct = Math.max(0, Math.min(100, parseFloat(discount_percent) || 0));
      const numVatPct = Math.max(0, Math.min(100, parseFloat(vat_percent) || 0));

      const total_amount = Math.round(items.reduce((sum, it) => sum + parseFloat(it.price) * it.quantity, 0));
      const percent_discount = Math.round((total_amount * numDiscountPct) / 100);
      
      const numPointsUsed = Math.max(0, parseInt(points_used) || 0);
      const points_discount = numPointsUsed * 100; // 1 point = 100 VND
      const discount_amount = Math.min(total_amount, percent_discount + points_discount);

      const afterDiscount = Math.max(0, total_amount - discount_amount);
      const vat_amount = Math.round((afterDiscount * numVatPct) / 100);
      const final_amount = afterDiscount + vat_amount;

      // Loyalty points earned: 1 point per 10,000 VND spent
      const points_earned = Math.floor(final_amount / 10000);

      // Validate customer paid for cash
      let finalCustomerPaid = 0;
      if (payment_method === 'transfer_qr' || payment_method === 'card') {
        finalCustomerPaid = final_amount;
      } else {
        const paidGiven = Math.round(parseFloat(customer_paid) || 0);
        if (paidGiven < final_amount && paidGiven > 0) {
          return res.status(400).json({
            success: false,
            message: `Tiền khách đưa (${paidGiven.toLocaleString('vi-VN')} đ) không đủ thanh toán tổng tiền (${final_amount.toLocaleString('vi-VN')} đ)`
          });
        }
        finalCustomerPaid = paidGiven > 0 ? paidGiven : final_amount;
      }

      const change_amount = Math.max(0, finalCustomerPaid - final_amount);

      // Insert Invoice
      const [invResult] = await pool.query(
        `INSERT INTO invoices (
          order_id, invoice_code, payment_method, total_amount, discount_amount, vat_amount, 
          final_amount, customer_paid, change_amount, staff_name, customer_phone, customer_name,
          points_used, points_discount, points_earned, voucher_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order_id, invoice_code, payment_method, total_amount, discount_amount, vat_amount,
          final_amount, finalCustomerPaid, change_amount, staff_name,
          customer_phone || null, customer_name || null, numPointsUsed, points_discount, points_earned, voucher_code || null
        ]
      );

      // Update Order to paid
      await pool.query(
        'UPDATE orders SET status = "paid", discount_percent = ?, vat_percent = ?, total_amount = ?, final_amount = ? WHERE id = ?',
        [numDiscountPct, numVatPct, total_amount, final_amount, order_id]
      );

      // Free dining table
      await pool.query('UPDATE dining_tables SET status = "empty", current_order_id = NULL WHERE id = ?', [order.table_id]);

      // Process Customer Loyalty Points & Voucher Consumption
      let customerData = null;
      if (customer_phone) {
        const cleanPhone = customer_phone.trim().replace(/\s+/g, '');
        const [custRows] = await pool.query('SELECT * FROM customers WHERE phone = ?', [cleanPhone]);
        
        if (custRows.length > 0) {
          const cust = custRows[0];
          const newPoints = Math.max(0, cust.points - numPointsUsed + points_earned);
          const newSpent = Math.round(parseFloat(cust.total_spent || 0) + final_amount);
          const newVisits = (cust.visits_count || 0) + 1;

          let newTier = 'bronze';
          if (newPoints >= 3500) newTier = 'diamond';
          else if (newPoints >= 1500) newTier = 'gold';
          else if (newPoints >= 500) newTier = 'silver';

          await pool.query(
            'UPDATE customers SET points = ?, total_spent = ?, visits_count = ?, tier = ?, full_name = COALESCE(?, full_name) WHERE id = ?',
            [newPoints, newSpent, newVisits, newTier, customer_name || null, cust.id]
          );

          customerData = {
            id: cust.id,
            phone: cleanPhone,
            full_name: customer_name || cust.full_name,
            points: newPoints,
            tier: newTier,
            points_used: numPointsUsed,
            points_earned
          };
        } else {
          // Register new customer
          const initialPoints = Math.max(0, 50 - numPointsUsed + points_earned);
          const [newCustRes] = await pool.query(
            'INSERT INTO customers (phone, full_name, points, tier, total_spent, visits_count) VALUES (?, ?, ?, "bronze", ?, 1)',
            [cleanPhone, customer_name || `Khách ${cleanPhone.slice(-4)}`, initialPoints, final_amount]
          );
          customerData = {
            id: newCustRes.insertId,
            phone: cleanPhone,
            full_name: customer_name || `Khách ${cleanPhone.slice(-4)}`,
            points: initialPoints,
            tier: 'bronze',
            points_used: numPointsUsed,
            points_earned
          };
        }

        // If voucher code from minigame used, mark as redeemed
        if (voucher_code) {
          await pool.query('UPDATE minigame_rewards SET is_used = TRUE WHERE reward_code = ?', [voucher_code]);
        }
      }

      const [tableRow] = await pool.query('SELECT table_name FROM dining_tables WHERE id = ?', [order.table_id]);

      return res.status(201).json({
        success: true,
        message: 'Thanh toán hóa đơn thành công!',
        data: {
          id: invResult.insertId,
          invoice_code,
          order_id,
          table_name: tableRow[0] ? tableRow[0].table_name : `Bàn ${order.table_id}`,
          payment_method,
          total_amount,
          discount_amount,
          points_used: numPointsUsed,
          points_discount,
          points_earned,
          voucher_code,
          vat_amount,
          final_amount,
          customer_paid: finalCustomerPaid,
          change_amount,
          staff_name,
          customer: customerData,
          items,
          created_at: new Date().toISOString()
        }
      });
    }

    // In-memory fallback
    const memory = getMemoryStore();
    const order = memory.orders.find((o) => o.id === parseInt(order_id));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    if (order.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Đơn hàng này đã được thanh toán hoàn tất trước đó' });
    }

    const activeItems = order.items.filter((it) => it.status !== 'cancelled');
    if (activeItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng không có món ăn hợp lệ để thanh toán' });
    }

    const numDiscountPct = Math.max(0, Math.min(100, parseFloat(discount_percent) || 0));
    const numVatPct = Math.max(0, Math.min(100, parseFloat(vat_percent) || 0));

    const total_amount = Math.round(activeItems.reduce((sum, it) => sum + it.price * it.quantity, 0));
    const percent_discount = Math.round((total_amount * numDiscountPct) / 100);
    const numPointsUsed = Math.max(0, parseInt(points_used) || 0);
    const points_discount = numPointsUsed * 100;
    const discount_amount = Math.min(total_amount, percent_discount + points_discount);

    const afterDiscount = Math.max(0, total_amount - discount_amount);
    const vat_amount = Math.round((afterDiscount * numVatPct) / 100);
    const final_amount = afterDiscount + vat_amount;
    const points_earned = Math.floor(final_amount / 10000);

    let finalCustomerPaid = 0;
    if (payment_method === 'transfer_qr' || payment_method === 'card') {
      finalCustomerPaid = final_amount;
    } else {
      const paidGiven = Math.round(parseFloat(customer_paid) || 0);
      if (paidGiven < final_amount && paidGiven > 0) {
        return res.status(400).json({
          success: false,
          message: `Tiền khách đưa (${paidGiven.toLocaleString('vi-VN')} đ) không đủ thanh toán tổng tiền (${final_amount.toLocaleString('vi-VN')} đ)`
        });
      }
      finalCustomerPaid = paidGiven > 0 ? paidGiven : final_amount;
    }

    const change_amount = Math.max(0, finalCustomerPaid - final_amount);
    const newInvoiceId = memory.invoices.length > 0 ? Math.max(...memory.invoices.map((i) => i.id)) + 1 : 1;
    const table = memory.tables.find((t) => t.id === order.table_id);

    const newInvoice = {
      id: newInvoiceId,
      order_id: order.id,
      invoice_code,
      table_name: table ? table.table_name : `Bàn ${order.table_id}`,
      payment_method,
      total_amount,
      discount_amount,
      points_used: numPointsUsed,
      points_discount,
      points_earned,
      voucher_code,
      vat_amount,
      final_amount,
      customer_paid: finalCustomerPaid,
      change_amount,
      staff_name,
      customer_phone: customer_phone || null,
      customer_name: customer_name || null,
      items: activeItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      created_at: new Date().toISOString()
    };

    memory.invoices.push(newInvoice);
    order.status = 'paid';
    order.final_amount = final_amount;

    if (table) {
      table.status = 'empty';
      table.current_order_id = null;
    }

    res.status(201).json({
      success: true,
      message: `Thanh toán thành công hóa đơn ${invoice_code}! Bàn ${table ? table.table_name : ''} đã sẵn sàng đón khách mới.`,
      data: newInvoice
    });
  } catch (error) {
    next(error);
  }
};

// 4. Generate VietQR Payment Url
exports.getVietQRUrl = (req, res) => {
  try {
    const { amount, description, bank_code, bank_account } = req.query;
    const memory = getMemoryStore();
    const settings = memory.settings;

    const bank = bank_code || settings.bank_code || 'MB';
    const account = bank_account || settings.bank_account || '0988888999';
    const amountVal = Math.round(parseFloat(amount) || 0);
    const desc = encodeURIComponent(description || 'Thanh toan quan an');

    const qrUrl = `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${amountVal}&addInfo=${desc}&accountName=${encodeURIComponent(
      settings.bank_owner || 'QUAN AN'
    )}`;

    res.json({
      success: true,
      data: {
        qr_url: qrUrl,
        bank,
        account,
        amount: amountVal,
        description: description || 'Thanh toan quan an',
        account_name: settings.bank_owner
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
