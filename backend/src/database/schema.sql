-- ==========================================================
-- DATABASE SCHEMA: QUẢN LÝ QUÁN ĂN (RESTAURANT MANAGEMENT)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `quanlyquanan` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `quanlyquanan`;

-- 1. BẢNG USERS (Tài khoản người dùng, nhân viên & đầu bếp)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'staff', 'chef') NOT NULL DEFAULT 'staff',
  `phone` VARCHAR(20) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `avatar` VARCHAR(255) NULL,
  `base_salary_type` ENUM('hourly', 'monthly') DEFAULT 'hourly',
  `hourly_rate` DECIMAL(12, 2) DEFAULT 20000.00,
  `monthly_salary` DECIMAL(12, 2) DEFAULT 12000000.00,
  `standard_work_days` INT DEFAULT 26,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG CATEGORIES (Danh mục món ăn)
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(50) DEFAULT 'Utensils',
  `display_order` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG MENU_ITEMS (Món ăn / Đồ uống)
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `image_url` TEXT NULL,
  `unit` VARCHAR(20) DEFAULT 'Phần',
  `is_available` BOOLEAN DEFAULT TRUE,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG DINING_TABLES (Sơ đồ bàn ăn)
CREATE TABLE IF NOT EXISTS `dining_tables` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `table_name` VARCHAR(50) NOT NULL UNIQUE,
  `area` VARCHAR(50) NOT NULL DEFAULT 'Tầng 1',
  `capacity` INT DEFAULT 4,
  `status` ENUM('empty', 'occupied', 'waiting_food', 'reserved') NOT NULL DEFAULT 'empty',
  `current_order_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG ORDERS (Đơn hàng / Gọi món tại bàn)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `table_id` INT NOT NULL,
  `staff_id` INT NULL,
  `status` ENUM('pending', 'cooking', 'served', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
  `total_amount` DECIMAL(12, 2) DEFAULT 0,
  `discount_percent` DECIMAL(5, 2) DEFAULT 0,
  `vat_percent` DECIMAL(5, 2) DEFAULT 0,
  `final_amount` DECIMAL(12, 2) DEFAULT 0,
  `notes` TEXT NULL,
  `customer_name` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`table_id`) REFERENCES `dining_tables`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG ORDER_ITEMS (Chi tiết món trong đơn hàng & đầu bếp thực hiện)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `menu_item_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('pending', 'cooking', 'ready', 'served', 'cancelled') NOT NULL DEFAULT 'pending',
  `notes` VARCHAR(255) NULL,
  `assigned_chef_id` INT NULL,
  `assigned_chef_name` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG INVOICES (Hóa đơn thanh toán)
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `invoice_code` VARCHAR(50) NOT NULL UNIQUE,
  `payment_method` ENUM('cash', 'transfer_qr', 'card') NOT NULL DEFAULT 'cash',
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `discount_amount` DECIMAL(12, 2) DEFAULT 0,
  `vat_amount` DECIMAL(12, 2) DEFAULT 0,
  `final_amount` DECIMAL(12, 2) NOT NULL,
  `customer_paid` DECIMAL(12, 2) NOT NULL,
  `change_amount` DECIMAL(12, 2) DEFAULT 0,
  `staff_name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. BẢNG SETTINGS (Cài đặt quán ăn)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `restaurant_name` VARCHAR(150) NOT NULL DEFAULT 'HOÀNG GIA QUÁN',
  `slogan` VARCHAR(255) DEFAULT 'Ẩm Thực Tinh Hoa Việt',
  `address` VARCHAR(255) DEFAULT '128 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh',
  `phone` VARCHAR(20) DEFAULT '0988.123.456',
  `bank_name` VARCHAR(100) DEFAULT 'MB Bank',
  `bank_code` VARCHAR(20) DEFAULT 'MB',
  `bank_account` VARCHAR(50) DEFAULT '0988123456',
  `bank_owner` VARCHAR(100) DEFAULT 'HOANG GIA RESTAURANT',
  `vat_default` DECIMAL(5,2) DEFAULT 8.0,
  `currency_symbol` VARCHAR(10) DEFAULT 'đ'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. BẢNG INGREDIENTS (Quản lý Nguyên Phụ Liệu, Hạn sử dụng & Tồn kho)
CREATE TABLE IF NOT EXISTS `ingredients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'kg',
  `current_stock` DECIMAL(12, 3) NOT NULL DEFAULT 0,
  `min_stock_alert` DECIMAL(12, 3) NOT NULL DEFAULT 5,
  `cost_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `category` VARCHAR(50) DEFAULT 'Thịt & Hải sản',
  `shelf_life_days` INT DEFAULT 7,
  `expiry_date` DATE NULL,
  `storage_condition` VARCHAR(100) DEFAULT 'Ngăn mát 2-4°C',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. BẢNG DISH_RECIPES (Công thức chế biến từng món ăn - BOM)
CREATE TABLE IF NOT EXISTS `dish_recipes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `menu_item_id` INT NOT NULL,
  `ingredient_id` INT NOT NULL,
  `quantity_needed` DECIMAL(12, 3) NOT NULL DEFAULT 0.1,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. BẢNG INVENTORY_IMPORTS (Lịch sử Nhập kho nguyên liệu)
CREATE TABLE IF NOT EXISTS `inventory_imports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ingredient_id` INT NOT NULL,
  `ingredient_name` VARCHAR(150) NOT NULL,
  `supplier_name` VARCHAR(150) DEFAULT 'Nhà Cung Cấp Mặc Định',
  `quantity_imported` DECIMAL(12, 3) NOT NULL,
  `unit` VARCHAR(20) NOT NULL,
  `import_price` DECIMAL(12, 2) NOT NULL,
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `expiry_date` DATE NULL,
  `batch_number` VARCHAR(50) NULL,
  `import_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `staff_name` VARCHAR(100) DEFAULT 'Admin',
  `notes` VARCHAR(255) NULL,
  FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. BẢNG CANCELLED_ORDER_ITEMS (Lưu vết chi tiết món đã bị hủy & đổi món)
CREATE TABLE IF NOT EXISTS `cancelled_order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `menu_item_id` INT NOT NULL,
  `dish_name` VARCHAR(150) NOT NULL,
  `table_name` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(12, 2) NOT NULL,
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `reason` VARCHAR(255) NOT NULL DEFAULT 'Khách đổi ý',
  `action_type` ENUM('cancel', 'change_dish') DEFAULT 'cancel',
  `responsible_role` ENUM('staff', 'chef', 'customer') DEFAULT 'customer',
  `responsible_user_id` INT NULL,
  `responsible_user_name` VARCHAR(100) NULL,
  `cancelled_by` VARCHAR(100) NOT NULL DEFAULT 'Nhân viên',
  `cancelled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. BẢNG INVENTORY_DISPOSALS (Biên bản tiêu hủy nguyên liệu quá hạn / hỏng mốc)
CREATE TABLE IF NOT EXISTS `inventory_disposals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ingredient_id` INT NOT NULL,
  `ingredient_name` VARCHAR(150) NOT NULL,
  `quantity` DECIMAL(12, 3) NOT NULL,
  `unit` VARCHAR(20) NOT NULL,
  `cost_loss` DECIMAL(12, 2) NOT NULL,
  `reason` VARCHAR(255) NOT NULL DEFAULT 'Quá hạn sử dụng',
  `disposed_by` VARCHAR(100) NOT NULL DEFAULT 'Bếp Trưởng',
  `disposal_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `notes` VARCHAR(255) NULL,
  FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. BẢNG PAYROLL_RECORDS (Bảng chấm công & Tính lương tự động theo từng tháng)
CREATE TABLE IF NOT EXISTS `payroll_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `month_year` VARCHAR(10) NOT NULL, -- YYYY-MM
  `base_salary_type` ENUM('hourly', 'monthly') NOT NULL DEFAULT 'hourly',
  `regular_hours` DECIMAL(8, 2) DEFAULT 0,
  `holiday_hours` DECIMAL(8, 2) DEFAULT 0,
  `tet_hours` DECIMAL(8, 2) DEFAULT 0,
  `worked_days` INT DEFAULT 0,
  `off_days` INT DEFAULT 0,
  `holiday_days` INT DEFAULT 0,
  `tet_days` INT DEFAULT 0,
  `hourly_rate` DECIMAL(12, 2) DEFAULT 20000.00,
  `monthly_base` DECIMAL(12, 2) DEFAULT 12000000.00,
  `bonus` DECIMAL(12, 2) DEFAULT 0,
  `deductions` DECIMAL(12, 2) DEFAULT 0,
  `final_salary` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `status` ENUM('pending', 'paid') DEFAULT 'pending',
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_month` (`user_id`, `month_year`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. BẢNG DAILY_ATTENDANCE (Nhật ký chấm công chi tiết theo ngày)
CREATE TABLE IF NOT EXISTS `daily_attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `work_date` DATE NOT NULL,
  `month_year` VARCHAR(10) NOT NULL,
  `shift_name` ENUM('morning', 'evening', 'full_day') DEFAULT 'full_day',
  `hours_worked` DECIMAL(5, 2) DEFAULT 8.0,
  `day_type` ENUM('normal', 'holiday', 'tet', 'off') DEFAULT 'normal',
  `attendance_status` ENUM('present', 'absent_excused', 'absent_unexcused', 'late') DEFAULT 'present',
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_work_date` (`user_id`, `work_date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
