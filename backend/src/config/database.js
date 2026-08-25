const mysql = require('mysql2/promise');
const {
  defaultCategories,
  defaultMenuItems,
  defaultDiningTables,
  defaultUsers,
  defaultSettings,
  defaultOrders,
  defaultInvoices,
  defaultIngredients,
  defaultRecipes,
  defaultImports,
  defaultDisposals,
  defaultCancelledItems,
  defaultPayrollRecords,
  defaultDailyAttendance,
  defaultPromotions,
  defaultCustomers,
  defaultFeedbacks,
  defaultMinigameRewards,
  defaultReservations
} = require('../database/seedData');

let pool = null;
let isUsingMySQL = false;

// In-memory data store as seamless fallback
const memoryStore = {
  categories: JSON.parse(JSON.stringify(defaultCategories)),
  menuItems: JSON.parse(JSON.stringify(defaultMenuItems)),
  tables: JSON.parse(JSON.stringify(defaultDiningTables)),
  users: JSON.parse(JSON.stringify(defaultUsers)),
  settings: JSON.parse(JSON.stringify(defaultSettings)),
  orders: JSON.parse(JSON.stringify(defaultOrders)),
  invoices: JSON.parse(JSON.stringify(defaultInvoices)),
  ingredients: JSON.parse(JSON.stringify(defaultIngredients)),
  recipes: JSON.parse(JSON.stringify(defaultRecipes)),
  imports: JSON.parse(JSON.stringify(defaultImports)),
  disposals: JSON.parse(JSON.stringify(defaultDisposals)),
  cancelledItems: JSON.parse(JSON.stringify(defaultCancelledItems)),
  payrolls: JSON.parse(JSON.stringify(defaultPayrollRecords)),
  dailyAttendance: JSON.parse(JSON.stringify(defaultDailyAttendance)),
  promotions: JSON.parse(JSON.stringify(defaultPromotions)),
  customers: JSON.parse(JSON.stringify(defaultCustomers)),
  feedbacks: JSON.parse(JSON.stringify(defaultFeedbacks)),
  minigameRewards: JSON.parse(JSON.stringify(defaultMinigameRewards)),
  reservations: JSON.parse(JSON.stringify(defaultReservations))
};

async function initDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'quanlyquanan';
  const port = process.env.DB_PORT || 3306;

  try {
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      port
    });

    console.log('✅ Connected to MySQL server.');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.end();

    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    isUsingMySQL = true;
    console.log(`✅ Using MySQL database: "${database}".`);
    await createTablesAndSeed(pool);
  } catch (err) {
    console.warn(`⚠️ MySQL is not reachable (${err.message}).`);
    console.log('💡 Starting with built-in in-memory data store.');
    isUsingMySQL = false;
  }
}

async function createTablesAndSeed(dbPool) {
  try {
    // 1. Users
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'staff', 'chef') NOT NULL DEFAULT 'staff',
        phone VARCHAR(20) NULL,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        avatar VARCHAR(255) NULL,
        base_salary_type ENUM('hourly', 'monthly') DEFAULT 'hourly',
        hourly_rate DECIMAL(12, 2) DEFAULT 20000.00,
        monthly_salary DECIMAL(12, 2) DEFAULT 12000000.00,
        standard_work_days INT DEFAULT 26,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Categories
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50) DEFAULT 'Utensils',
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Menu Items
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        description TEXT NULL,
        price DECIMAL(12, 2) NOT NULL,
        image_url TEXT NULL,
        unit VARCHAR(20) DEFAULT 'Phần',
        is_available BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Dining Tables
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS dining_tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_name VARCHAR(50) NOT NULL UNIQUE,
        area VARCHAR(50) NOT NULL DEFAULT 'Tầng 1',
        capacity INT DEFAULT 4,
        status ENUM('empty', 'occupied', 'waiting_food', 'reserved') NOT NULL DEFAULT 'empty',
        current_order_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Orders
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_id INT NOT NULL,
        staff_id INT NULL,
        status ENUM('pending', 'cooking', 'ready', 'served', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
        total_amount DECIMAL(12, 2) DEFAULT 0,
        discount_percent DECIMAL(5, 2) DEFAULT 0,
        vat_percent DECIMAL(5, 2) DEFAULT 0,
        final_amount DECIMAL(12, 2) DEFAULT 0,
        notes TEXT NULL,
        customer_name VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES dining_tables(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Order Items
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        menu_item_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(12, 2) NOT NULL,
        status ENUM('pending', 'cooking', 'ready', 'served', 'cancelled') NOT NULL DEFAULT 'pending',
        notes VARCHAR(255) NULL,
        assigned_chef_id INT NULL,
        assigned_chef_name VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Invoices
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        invoice_code VARCHAR(50) NOT NULL UNIQUE,
        payment_method ENUM('cash', 'transfer_qr', 'card') NOT NULL DEFAULT 'cash',
        total_amount DECIMAL(12, 2) NOT NULL,
        discount_amount DECIMAL(12, 2) DEFAULT 0,
        vat_amount DECIMAL(12, 2) DEFAULT 0,
        final_amount DECIMAL(12, 2) NOT NULL,
        customer_paid DECIMAL(12, 2) NOT NULL,
        change_amount DECIMAL(12, 2) DEFAULT 0,
        staff_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Alter invoices columns if not exist
    try { await dbPool.query('ALTER TABLE invoices ADD COLUMN customer_phone VARCHAR(20) NULL'); } catch (e) {}
    try { await dbPool.query('ALTER TABLE invoices ADD COLUMN customer_name VARCHAR(100) NULL'); } catch (e) {}
    try { await dbPool.query('ALTER TABLE invoices ADD COLUMN points_used INT DEFAULT 0'); } catch (e) {}
    try { await dbPool.query('ALTER TABLE invoices ADD COLUMN points_discount DECIMAL(12, 2) DEFAULT 0'); } catch (e) {}
    try { await dbPool.query('ALTER TABLE invoices ADD COLUMN points_earned INT DEFAULT 0'); } catch (e) {}
    try { await dbPool.query('ALTER TABLE invoices ADD COLUMN voucher_code VARCHAR(100) NULL'); } catch (e) {}

    // 8. Settings
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_name VARCHAR(150) NOT NULL,
        slogan VARCHAR(255) DEFAULT '',
        address VARCHAR(255) DEFAULT '',
        phone VARCHAR(20) DEFAULT '',
        bank_name VARCHAR(100) DEFAULT '',
        bank_code VARCHAR(20) DEFAULT '',
        bank_account VARCHAR(50) DEFAULT '',
        bank_owner VARCHAR(100) DEFAULT '',
        vat_default DECIMAL(5,2) DEFAULT 8.0,
        currency_symbol VARCHAR(10) DEFAULT 'đ'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. Ingredients
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        unit VARCHAR(20) NOT NULL DEFAULT 'kg',
        current_stock DECIMAL(12, 3) NOT NULL DEFAULT 0,
        min_stock_alert DECIMAL(12, 3) NOT NULL DEFAULT 5,
        cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
        category VARCHAR(50) DEFAULT 'Thịt & Hải sản',
        shelf_life_days INT DEFAULT 7,
        expiry_date DATE NULL,
        storage_condition VARCHAR(100) DEFAULT 'Ngăn mát 2-4°C',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Alter ingredients columns if not exist
    try {
      await dbPool.query('ALTER TABLE ingredients ADD COLUMN shelf_life_days INT DEFAULT 7');
    } catch (e) {}
    try {
      await dbPool.query('ALTER TABLE ingredients ADD COLUMN expiry_date DATE NULL');
    } catch (e) {}
    try {
      await dbPool.query('ALTER TABLE ingredients ADD COLUMN storage_condition VARCHAR(100) DEFAULT "Ngăn mát 2-4°C"');
    } catch (e) {}

    // Update ingredients with shelf life
    for (const ing of defaultIngredients) {
      await dbPool.query(
        `INSERT INTO ingredients (id, name, unit, current_stock, min_stock_alert, cost_price, category, shelf_life_days, expiry_date, storage_condition)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           shelf_life_days = VALUES(shelf_life_days),
           expiry_date = VALUES(expiry_date),
           storage_condition = VALUES(storage_condition)`,
        [ing.id, ing.name, ing.unit, ing.current_stock, ing.min_stock_alert, ing.cost_price, ing.category, ing.shelf_life_days, ing.expiry_date, ing.storage_condition]
      );
    }

    // 10. Dish Recipes
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS dish_recipes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menu_item_id INT NOT NULL,
        ingredient_id INT NOT NULL,
        quantity_needed DECIMAL(12, 3) NOT NULL DEFAULT 0.1,
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 11. Inventory Imports
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS inventory_imports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ingredient_id INT NOT NULL,
        ingredient_name VARCHAR(150) NOT NULL,
        supplier_name VARCHAR(150) DEFAULT 'Nhà cung cấp tươi sạch',
        quantity_imported DECIMAL(12, 3) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        import_price DECIMAL(12, 2) NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL,
        expiry_date DATE NULL,
        batch_number VARCHAR(50) NULL,
        import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        staff_name VARCHAR(100) DEFAULT 'Admin',
        notes VARCHAR(255) NULL,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      await dbPool.query('ALTER TABLE inventory_imports ADD COLUMN expiry_date DATE NULL');
    } catch (e) {}
    try {
      await dbPool.query('ALTER TABLE inventory_imports ADD COLUMN batch_number VARCHAR(50) NULL');
    } catch (e) {}

    // 12. Cancelled Order Items
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS cancelled_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        menu_item_id INT NOT NULL,
        dish_name VARCHAR(150) NOT NULL,
        table_name VARCHAR(50) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(12, 2) NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL,
        reason VARCHAR(255) NOT NULL DEFAULT 'Khách đổi ý',
        action_type ENUM('cancel', 'change_dish') DEFAULT 'cancel',
        responsible_role ENUM('staff', 'chef', 'customer') DEFAULT 'customer',
        responsible_user_id INT NULL,
        responsible_user_name VARCHAR(100) NULL,
        cancelled_by VARCHAR(100) NOT NULL DEFAULT 'Nhân viên',
        cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 13. Inventory Disposals
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS inventory_disposals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ingredient_id INT NOT NULL,
        ingredient_name VARCHAR(150) NOT NULL,
        quantity DECIMAL(12, 3) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        cost_loss DECIMAL(12, 2) NOT NULL,
        reason VARCHAR(255) NOT NULL DEFAULT 'Quá hạn sử dụng',
        disposed_by VARCHAR(100) NOT NULL DEFAULT 'Bếp Trưởng',
        disposal_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes VARCHAR(255) NULL,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed disposals
    for (const disp of defaultDisposals) {
      await dbPool.query(
        `INSERT IGNORE INTO inventory_disposals (id, ingredient_id, ingredient_name, quantity, unit, cost_loss, reason, disposed_by, disposal_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [disp.id, disp.ingredient_id, disp.ingredient_name, disp.quantity, disp.unit, disp.cost_loss, disp.reason, disp.disposed_by, disp.disposal_date, disp.notes]
      );
    }

    // 14. Payroll Records
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS payroll_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        month_year VARCHAR(10) NOT NULL,
        base_salary_type ENUM('hourly', 'monthly') NOT NULL DEFAULT 'hourly',
        regular_hours DECIMAL(8, 2) DEFAULT 0,
        holiday_hours DECIMAL(8, 2) DEFAULT 0,
        tet_hours DECIMAL(8, 2) DEFAULT 0,
        worked_days INT DEFAULT 0,
        off_days INT DEFAULT 0,
        holiday_days INT DEFAULT 0,
        tet_days INT DEFAULT 0,
        hourly_rate DECIMAL(12, 2) DEFAULT 20000.00,
        monthly_base DECIMAL(12, 2) DEFAULT 12000000.00,
        bonus DECIMAL(12, 2) DEFAULT 0,
        deductions DECIMAL(12, 2) DEFAULT 0,
        final_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
        status ENUM('pending', 'paid') DEFAULT 'pending',
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_month (user_id, month_year),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Alter payroll_records columns if not exist
    try { await dbPool.query('ALTER TABLE payroll_records ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'); } catch (e) {}

    // 15. Daily Attendance
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS daily_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        work_date DATE NOT NULL,
        month_year VARCHAR(10) NOT NULL,
        shift_name ENUM('morning', 'evening', 'full_day') DEFAULT 'full_day',
        hours_worked DECIMAL(5, 2) DEFAULT 8.0,
        day_type ENUM('normal', 'holiday', 'tet', 'off') DEFAULT 'normal',
        attendance_status ENUM('present', 'absent_excused', 'absent_unexcused', 'late') DEFAULT 'present',
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_work_date (user_id, work_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 16. Promotions & Creative Banners
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle TEXT NULL,
        badge_text VARCHAR(100) DEFAULT 'HOT DEAL',
        discount_percent DECIMAL(5, 2) DEFAULT 10.0,
        discount_code VARCHAR(50) NULL,
        banner_url TEXT NULL,
        theme_gradient VARCHAR(100) DEFAULT 'from-amber-600 to-orange-700',
        accent_color VARCHAR(20) DEFAULT '#F59E0B',
        is_active BOOLEAN DEFAULT TRUE,
        start_date DATE NULL,
        end_date DATE NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed promotions
    for (const promo of defaultPromotions) {
      await dbPool.query(
        `INSERT IGNORE INTO promotions (id, title, subtitle, badge_text, discount_percent, discount_code, banner_url, theme_gradient, accent_color, is_active, start_date, end_date, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [promo.id, promo.title, promo.subtitle, promo.badge_text, promo.discount_percent, promo.discount_code, promo.banner_url, promo.theme_gradient, promo.accent_color, promo.is_active, promo.start_date, promo.end_date, promo.description]
      );
    }

    // 17. Customers & Loyalty Program
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        points INT DEFAULT 0,
        tier ENUM('bronze', 'silver', 'gold', 'diamond') DEFAULT 'bronze',
        total_spent DECIMAL(12, 2) DEFAULT 0,
        visits_count INT DEFAULT 1,
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed customers
    for (const cust of defaultCustomers) {
      await dbPool.query(
        `INSERT IGNORE INTO customers (id, phone, full_name, points, tier, total_spent, visits_count, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [cust.id, cust.phone, cust.full_name, cust.points, cust.tier, cust.total_spent, cust.visits_count, cust.notes]
      );
    }

    // 18. Customer Feedbacks & Experience Reviews
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS customer_feedbacks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_phone VARCHAR(20) NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        table_name VARCHAR(50) DEFAULT 'Tại bàn',
        food_rating INT DEFAULT 5,
        service_rating INT DEFAULT 5,
        overall_rating INT DEFAULT 5,
        comment TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed feedbacks
    for (const fb of defaultFeedbacks) {
      await dbPool.query(
        `INSERT IGNORE INTO customer_feedbacks (id, customer_phone, customer_name, table_name, food_rating, service_rating, overall_rating, comment, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fb.id, fb.customer_phone, fb.customer_name, fb.table_name, fb.food_rating, fb.service_rating, fb.overall_rating, fb.comment, fb.created_at]
      );
    }

    // 19. Minigame Rewards History
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS minigame_rewards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_phone VARCHAR(20) NOT NULL,
        game_type VARCHAR(50) NOT NULL,
        reward_type VARCHAR(50) NOT NULL,
        reward_value VARCHAR(100) NOT NULL,
        reward_code VARCHAR(100) NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    for (const rew of defaultMinigameRewards) {
      await dbPool.query(
        `INSERT IGNORE INTO minigame_rewards (id, customer_phone, game_type, reward_type, reward_value, reward_code, is_used, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [rew.id, rew.customer_phone, rew.game_type, rew.reward_type, rew.reward_value, rew.reward_code, rew.is_used, rew.created_at]
      );
    }

    // 20. Table Reservations & Pre-orders
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS table_reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_id INT NOT NULL,
        table_name VARCHAR(50) NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        guest_count INT NOT NULL DEFAULT 2,
        reservation_time DATETIME NOT NULL,
        status ENUM('pending', 'confirmed', 'seated', 'cancelled') DEFAULT 'confirmed',
        preordered_items JSON NULL,
        special_notes VARCHAR(255) NULL,
        deposit_amount DECIMAL(12, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES dining_tables(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    for (const resv of defaultReservations) {
      await dbPool.query(
        `INSERT IGNORE INTO table_reservations (id, table_id, table_name, customer_name, customer_phone, guest_count, reservation_time, status, preordered_items, special_notes, deposit_amount, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          resv.id, resv.table_id, resv.table_name, resv.customer_name, resv.customer_phone,
          resv.guest_count, resv.reservation_time, resv.status, JSON.stringify(resv.preordered_items),
          resv.special_notes, resv.deposit_amount, resv.created_at
        ]
      );
    }

    // Safely apply alterations to existing tables
    const safeAlterQueries = [
      // menu_items
      "ALTER TABLE menu_items ADD COLUMN item_type ENUM('a_la_carte', 'combo', 'buffet') DEFAULT 'a_la_carte'",
      "ALTER TABLE menu_items ADD COLUMN is_sold_out_today BOOLEAN DEFAULT FALSE",
      "ALTER TABLE menu_items ADD COLUMN combo_items JSON NULL",
      "ALTER TABLE menu_items ADD COLUMN original_price DECIMAL(12, 2) NULL",
      "ALTER TABLE menu_items ADD COLUMN buffet_type ENUM('none', 'hotpot', 'bbq', 'hotpot_bbq') DEFAULT 'none'",
      "ALTER TABLE menu_items ADD COLUMN buffet_price_per_pax DECIMAL(12, 2) DEFAULT 0",
      "ALTER TABLE menu_items ADD COLUMN buffet_duration_minutes INT DEFAULT 120",

      // orders & dining_tables
      "ALTER TABLE orders ADD COLUMN is_buffet BOOLEAN DEFAULT FALSE",
      "ALTER TABLE orders ADD COLUMN buffet_package_name VARCHAR(100) NULL",
      "ALTER TABLE orders ADD COLUMN buffet_pax_count INT DEFAULT 0",
      "ALTER TABLE orders ADD COLUMN buffet_started_at TIMESTAMP NULL",
      "ALTER TABLE orders ADD COLUMN buffet_expires_at TIMESTAMP NULL",

      "ALTER TABLE dining_tables ADD COLUMN is_buffet BOOLEAN DEFAULT FALSE",
      "ALTER TABLE dining_tables ADD COLUMN buffet_started_at TIMESTAMP NULL",
      "ALTER TABLE dining_tables ADD COLUMN buffet_expires_at TIMESTAMP NULL",
      "ALTER TABLE dining_tables ADD COLUMN has_reservation BOOLEAN DEFAULT FALSE",
      "ALTER TABLE dining_tables ADD COLUMN reservation_info JSON NULL",

      // order_items (Chef cooking & quality audit)
      "ALTER TABLE order_items ADD COLUMN assigned_chef_id INT NULL",
      "ALTER TABLE order_items ADD COLUMN assigned_chef_name VARCHAR(100) DEFAULT 'Trần Bếp Trưởng'",
      "ALTER TABLE order_items ADD COLUMN cooking_started_at TIMESTAMP NULL",
      "ALTER TABLE order_items ADD COLUMN cooking_finished_at TIMESTAMP NULL",
      "ALTER TABLE order_items ADD COLUMN quality_rating INT DEFAULT 5",
      "ALTER TABLE order_items ADD COLUMN quality_feedback VARCHAR(255) NULL",
      "ALTER TABLE order_items ADD COLUMN is_returned BOOLEAN DEFAULT FALSE",
      "ALTER TABLE order_items ADD COLUMN return_reason VARCHAR(255) NULL",
      "ALTER TABLE order_items ADD COLUMN penalty_deduction DECIMAL(12, 2) DEFAULT 0"
    ];

    for (const q of safeAlterQueries) {
      try {
        await dbPool.query(q);
      } catch (err) {
        // Ignored if column already exists
      }
    }

    // Insert or update new Combos & Buffets in menu_items
    for (const item of defaultMenuItems.filter(m => m.id >= 15)) {
      try {
        await dbPool.query(
          `INSERT INTO menu_items (id, category_id, name, description, price, original_price, image_url, unit, item_type, combo_items, buffet_type, buffet_price_per_pax, buffet_duration_minutes, is_available, is_featured, is_sold_out_today)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             description = VALUES(description),
             price = VALUES(price),
             original_price = VALUES(original_price),
             item_type = VALUES(item_type),
             combo_items = VALUES(combo_items),
             buffet_type = VALUES(buffet_type),
             buffet_price_per_pax = VALUES(buffet_price_per_pax),
             buffet_duration_minutes = VALUES(buffet_duration_minutes),
             is_sold_out_today = VALUES(is_sold_out_today)`,
          [
            item.id, item.category_id, item.name, item.description, item.price, item.original_price || item.price,
            item.image_url, item.unit, item.item_type || 'a_la_carte', item.combo_items ? JSON.stringify(item.combo_items) : null,
            item.buffet_type || 'none', item.buffet_price_per_pax || 0, item.buffet_duration_minutes || 120,
            item.is_available, item.is_featured, item.is_sold_out_today ? 1 : 0
          ]
        );
      } catch (err) {
        // Ignored
      }
    }

    console.log('✅ MySQL tables, reservations, combos, buffets & chef audit initialized successfully.');
  } catch (seedErr) {
    console.error('Error during MySQL tables/seed setup:', seedErr);
  }
}

function getPool() {
  return pool;
}

function isMySQL() {
  return isUsingMySQL;
}

function getMemoryStore() {
  return memoryStore;
}

module.exports = {
  initDatabase,
  getPool,
  isMySQL,
  getMemoryStore
};
