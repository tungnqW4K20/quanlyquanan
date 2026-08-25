// Default mock data for rich restaurant management experience
const defaultCategories = [
  { id: 1, name: 'Món Khai Vị', icon: 'Soup', display_order: 1, is_active: true },
  { id: 2, name: 'Món Chính - Thịt & Hải Sản', icon: 'Flame', display_order: 2, is_active: true },
  { id: 3, name: 'Lẩu Đặc Biệt', icon: 'CookingPot', display_order: 3, is_active: true },
  { id: 4, name: 'Rau Củ & Cơm Mì', icon: 'Salad', display_order: 4, is_active: true },
  { id: 5, name: 'Đồ Uống & Tráng Miệng', icon: 'Coffee', display_order: 5, is_active: true }
];

const defaultMenuItems = [
  {
    id: 1,
    category_id: 1,
    name: 'Gỏi Cuốn Tôm Thịt Hoàng Kim',
    description: 'Tôm tươi, thịt ba chỉ, bún, rau thơm cuộn bánh tráng chấm tương đậu phộng béo bùi',
    price: 65000,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    unit: 'Đĩa (4 cuốn)',
    is_available: true,
    is_featured: true
  },
  {
    id: 2,
    category_id: 1,
    name: 'Nem Nướng Nha Trang Sốt Cam',
    description: 'Nem nướng than hoa thơm lừng, cuốn bánh tráng kèm rau sống tươi sạch',
    price: 85000,
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
    unit: 'Phần',
    is_available: true,
    is_featured: false
  },
  {
    id: 3,
    category_id: 1,
    name: 'Khoai Tây Chiên Lắc Phô Mai Trứng Muối',
    description: 'Khoai tây giòn rụm phủ lớp bột phô mai béo ngậy kèm sốt trứng muối',
    price: 55000,
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    unit: 'Đĩa',
    is_available: true,
    is_featured: false
  },
  {
    id: 4,
    category_id: 2,
    name: 'Bò Wagyu Nướng Đá Sốt Tiêu Đen',
    description: 'Thịt bò Wagyu mềm tan mọng nước, nướng trên đá núi lửa thơm phức',
    price: 289000,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    unit: 'Phần (250g)',
    is_available: true,
    is_featured: true
  },
  {
    id: 5,
    category_id: 2,
    name: 'Sườn Cây Nướng Mật Ong Hoa Rừng',
    description: 'Sườn cây chọn lọc tẩm ướp mật ong rừng nguyên chất nướng than hồng',
    price: 195000,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    unit: 'Phần',
    is_available: true,
    is_featured: true
  },
  {
    id: 6,
    category_id: 2,
    name: 'Tôm Càng Xanh Cháy Tỏi Ớt Xiêm',
    description: 'Tôm càng săn chắc, xào tỏi giòn và ớt xiêm xanh cay nồng đậm đà',
    price: 245000,
    image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
    unit: 'Phần (4 con)',
    is_available: true,
    is_featured: true
  },
  {
    id: 7,
    category_id: 2,
    name: 'Mực Trứng Hấp Gừng Hành',
    description: 'Mực trứng tươi rói nguyên con hấp cùng gừng tươi và đầu hành lá thanh ngọt',
    price: 185000,
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
    unit: 'Đĩa',
    is_available: true,
    is_featured: false
  },
  {
    id: 8,
    category_id: 3,
    name: 'Lẩu Thái Hải Sản Tomyum Cay Nồng',
    description: 'Nước lẩu Tomyum chua cay chuẩn vị Thái, ngập tràn tôm sú, mực, nghêu, nấm và rau',
    price: 349000,
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    unit: 'Nồi lớn',
    is_available: true,
    is_featured: true
  },
  {
    id: 9,
    category_id: 3,
    name: 'Lẩu Nấm Chim Câu Bổ Dưỡng',
    description: 'Thịt chim câu tiềm cùng các loại nấm quý và thảo mộc thanh mát ngọt lành',
    price: 389000,
    image_url: 'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=600&q=80',
    unit: 'Nồi lớn',
    is_available: true,
    is_featured: false
  },
  {
    id: 10,
    category_id: 4,
    name: 'Cơm Chiên Hải Sản Hoàng Bào',
    description: 'Hạt cơm vàng óng tơi xốp, chiên cùng tôm, mực, trứng gà và đậu Hà Lan',
    price: 115000,
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
    unit: 'Thố',
    is_available: true,
    is_featured: false
  },
  {
    id: 11,
    category_id: 4,
    name: 'Rau Rừng Gia Lai Xào Tỏi',
    description: 'Rau rừng tươi non giòn ngọt xào tỏi thơm phức',
    price: 75000,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    unit: 'Đĩa',
    is_available: true,
    is_featured: false
  },
  {
    id: 12,
    category_id: 5,
    name: 'Trà Đào Cam Sả Mật Ong Hổ Phách',
    description: 'Trà đào thanh mát kết hợp lát cam vàng và sả tươi thơm nồng',
    price: 45000,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    unit: 'Ly',
    is_available: true,
    is_featured: true
  },
  {
    id: 13,
    category_id: 5,
    name: 'Nước Ép Cam Tươi Vàng Óng',
    description: '100% cam tươi nguyên chất không thêm đường hoá học',
    price: 49000,
    image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    unit: 'Ly',
    is_available: true,
    is_featured: false
  },
  {
    id: 14,
    category_id: 5,
    name: 'Chè Khúc Bạch Hạnh Nhân Hoàng Gia',
    description: 'Khúc bạch béo mịn mềm tan, long nhãn mọng nước và hạnh nhân lát sấy giòn',
    price: 45000,
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    unit: 'Chén',
    is_available: true,
    is_featured: false
  },
  {
    id: 15,
    category_id: 2,
    name: 'Combo Nướng Hoàng Gia Thượng Hạng (3-4 Người)',
    description: 'Set nướng đỉnh cao gồm Bò Wagyu A5, Sườn Cây Mật Ong, Khoai Tây Phô Mai & 3 Ly Trà Đào (Tiết kiệm 141.000đ)',
    price: 699000,
    original_price: 840000,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    unit: 'Set lớn',
    item_type: 'combo',
    combo_items: [
      { name: 'Bò Wagyu Nướng Đá (250g)', price: 289000, quantity: 1 },
      { name: 'Sườn Cây Nướng Mật Ong', price: 195000, quantity: 1 },
      { name: 'Khoai Tây Chiên Lắc Phô Mai', price: 55000, quantity: 1 },
      { name: '3x Trà Đào Cam Sả', price: 135000, quantity: 3 }
    ],
    is_available: true,
    is_featured: true,
    is_sold_out_today: false
  },
  {
    id: 16,
    category_id: 3,
    name: 'Combo Lẩu Hải Sản Sum Vầy (3-4 Người)',
    description: 'Đại tiệc Lẩu Tomyum ngập tràn Tôm Sú, Mực, Nghêu kèm Gỏi Cuốn Tôm Thịt & Rau Rừng Xào Tỏi (Tiết kiệm 111.000đ)',
    price: 549000,
    original_price: 660000,
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    unit: 'Set lẩu lớn',
    item_type: 'combo',
    combo_items: [
      { name: 'Lẩu Thái Hải Sản Tomyum Cay Nồng', price: 349000, quantity: 1 },
      { name: 'Gỏi Cuốn Tôm Thịt Hoàng Kim', price: 65000, quantity: 1 },
      { name: 'Rau Rừng Gia Lai Xào Tỏi', price: 75000, quantity: 1 },
      { name: '3x Nước Ép Cam Tươi', price: 147000, quantity: 3 }
    ],
    is_available: true,
    is_featured: true,
    is_sold_out_today: false
  },
  {
    id: 17,
    category_id: 3,
    name: 'Gói Buffet Lẩu Hải Sản Thượng Hạng (Ăn Thả Ga 2H)',
    description: 'Ăn thỏa thích không giới hạn tôm sú, mực tươi, bò Mỹ, nấm tươi, viên thả lẩu và rau sạch trong 120 phút',
    price: 299000,
    original_price: 299000,
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    unit: 'Người / 2h',
    item_type: 'buffet',
    buffet_type: 'hotpot',
    buffet_price_per_pax: 299000,
    buffet_duration_minutes: 120,
    is_available: true,
    is_featured: true,
    is_sold_out_today: false
  },
  {
    id: 18,
    category_id: 2,
    name: 'Gói Buffet Nướng & Lẩu Wagyu Hoàng Gia (Ăn Thả Ga 2H)',
    description: 'Đại tiệc nướng than hoa & lẩu Wagyu cao cấp không giới hạn, tặng kèm tráng miệng và nước ngọt trong 120 phút',
    price: 399000,
    original_price: 399000,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    unit: 'Người / 2h',
    item_type: 'buffet',
    buffet_type: 'hotpot_bbq',
    buffet_price_per_pax: 399000,
    buffet_duration_minutes: 120,
    is_available: true,
    is_featured: true,
    is_sold_out_today: false
  }
];

const defaultDiningTables = [
  { id: 1, table_name: 'Bàn T1-01', area: 'Tầng 1', capacity: 4, status: 'empty', current_order_id: null },
  { id: 2, table_name: 'Bàn T1-02', area: 'Tầng 1', capacity: 4, status: 'occupied', current_order_id: 1 },
  { id: 3, table_name: 'Bàn T1-03', area: 'Tầng 1', capacity: 2, status: 'waiting_food', current_order_id: 2 },
  { id: 4, table_name: 'Bàn T1-04', area: 'Tầng 1', capacity: 6, status: 'empty', current_order_id: null },
  { id: 5, table_name: 'Bàn T1-05', area: 'Tầng 1', capacity: 4, status: 'reserved', current_order_id: null },
  { id: 6, table_name: 'Bàn T1-06', area: 'Tầng 1', capacity: 8, status: 'empty', current_order_id: null },
  { id: 7, table_name: 'Bàn T2-01', area: 'Tầng 2', capacity: 4, status: 'empty', current_order_id: null },
  { id: 8, table_name: 'Bàn T2-02', area: 'Tầng 2', capacity: 6, status: 'occupied', current_order_id: 3 },
  { id: 9, table_name: 'Bàn T2-03', area: 'Tầng 2', capacity: 4, status: 'empty', current_order_id: null },
  { id: 10, table_name: 'Bàn VIP-01', area: 'Phòng VIP', capacity: 10, status: 'empty', current_order_id: null },
  { id: 11, table_name: 'Bàn VIP-02', area: 'Phòng VIP', capacity: 12, status: 'empty', current_order_id: null },
  { id: 12, table_name: 'Bàn Sân Vườn 01', area: 'Ngoài Trời', capacity: 6, status: 'empty', current_order_id: null },
  { id: 13, table_name: 'Bàn Sân Vườn 02', area: 'Ngoài Trời', capacity: 4, status: 'empty', current_order_id: null }
];

const defaultUsers = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$wN9aEa8G12kZqWqW7xM9Oe6C71a0Y2j.7sUvN9jLq2YkY8e6D2fKu',
    raw_password: '123',
    full_name: 'Trần Hoàng Quản Lý (Admin)',
    role: 'admin',
    phone: '0909.888.999',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    base_salary_type: 'monthly',
    hourly_rate: 0,
    monthly_salary: 20000000,
    standard_work_days: 26
  },
  {
    id: 2,
    username: 'staff',
    password: '$2a$10$wN9aEa8G12kZqWqW7xM9Oe6C71a0Y2j.7sUvN9jLq2YkY8e6D2fKu',
    raw_password: '123',
    full_name: 'Nguyễn Văn Phục Vụ',
    role: 'staff',
    phone: '0912.345.678',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    base_salary_type: 'hourly',
    hourly_rate: 20000,
    monthly_salary: 0,
    standard_work_days: 26
  },
  {
    id: 3,
    username: 'thu_ngan',
    password: '$2a$10$wN9aEa8G12kZqWqW7xM9Oe6C71a0Y2j.7sUvN9jLq2YkY8e6D2fKu',
    raw_password: '123',
    full_name: 'Lê Thị Thu Ngân',
    role: 'staff',
    phone: '0933.222.111',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    base_salary_type: 'hourly',
    hourly_rate: 20000,
    monthly_salary: 0,
    standard_work_days: 26
  },
  {
    id: 4,
    username: 'bep_truong',
    password: '$2a$10$wN9aEa8G12kZqWqW7xM9Oe6C71a0Y2j.7sUvN9jLq2YkY8e6D2fKu',
    raw_password: '123',
    full_name: 'Phạm Hải Đăng (Bếp Trưởng)',
    role: 'chef',
    phone: '0977.555.333',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
    base_salary_type: 'monthly',
    hourly_rate: 0,
    monthly_salary: 12000000,
    standard_work_days: 26
  },
  {
    id: 5,
    username: 'bep_pho',
    password: '$2a$10$wN9aEa8G12kZqWqW7xM9Oe6C71a0Y2j.7sUvN9jLq2YkY8e6D2fKu',
    raw_password: '123',
    full_name: 'Võ Minh Quân (Bếp Phó)',
    role: 'chef',
    phone: '0966.444.222',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80',
    base_salary_type: 'monthly',
    hourly_rate: 0,
    monthly_salary: 12000000,
    standard_work_days: 26
  }
];

const defaultSettings = {
  id: 1,
  restaurant_name: 'HOÀNG GIA QUÁN',
  slogan: 'Ẩm Thực Tinh Hoa - Đậm Đà Bản Sắc',
  address: '128 Đường Ẩm Thực, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  phone: '0988.888.999',
  bank_name: 'MB Bank (Quân Đội)',
  bank_code: 'MB',
  bank_account: '0988888999',
  bank_owner: 'HOANG GIA RESTAURANT',
  vat_default: 8.0,
  currency_symbol: 'đ'
};

// 9. Default Ingredients, Shelf-life & Expiry Dates
const defaultIngredients = [
  { id: 1, name: 'Thịt Bò Wagyu A5', unit: 'kg', current_stock: 18.5, min_stock_alert: 5.0, cost_price: 650000, category: 'Thịt tươi', shelf_life_days: 7, expiry_date: '2026-08-25', storage_condition: 'Đông lạnh sâu -18°C' },
  { id: 2, name: 'Sườn Cây Heo Tươi', unit: 'kg', current_stock: 24.0, min_stock_alert: 8.0, cost_price: 120000, category: 'Thịt tươi', shelf_life_days: 5, expiry_date: '2026-08-23', storage_condition: 'Ngăn mát 2-4°C' },
  { id: 3, name: 'Tôm Càng Xanh Loại 1', unit: 'kg', current_stock: 12.0, min_stock_alert: 4.0, cost_price: 280000, category: 'Hải sản', shelf_life_days: 3, expiry_date: '2026-08-21', storage_condition: 'Bể sủi oxy sống' },
  { id: 4, name: 'Mực Trứng Tươi Rói', unit: 'kg', current_stock: 15.0, min_stock_alert: 5.0, cost_price: 210000, category: 'Hải sản', shelf_life_days: 4, expiry_date: '2026-08-20', storage_condition: 'Cấp đông -18°C' },
  { id: 5, name: 'Cốt Lẩu Thái Tomyum', unit: 'lít', current_stock: 30.0, min_stock_alert: 10.0, cost_price: 65000, category: 'Gia vị & Nước cốt', shelf_life_days: 30, expiry_date: '2026-09-18', storage_condition: 'Ngăn mát 2-4°C' },
  { id: 6, name: 'Nấm Quý & Thảo Mộc', unit: 'kg', current_stock: 8.5, min_stock_alert: 3.0, cost_price: 180000, category: 'Rau nấm', shelf_life_days: 4, expiry_date: '2026-08-21', storage_condition: 'Ngăn mát 2-4°C' },
  { id: 7, name: 'Gạo Thơm Hoàng Bào', unit: 'kg', current_stock: 50.0, min_stock_alert: 15.0, cost_price: 25000, category: 'Lương thực', shelf_life_days: 180, expiry_date: '2027-02-15', storage_condition: 'Nhiệt độ phòng thoáng mát' },
  { id: 8, name: 'Rau Rừng Gia Lai', unit: 'kg', current_stock: 6.2, min_stock_alert: 3.0, cost_price: 45000, category: 'Rau củ', shelf_life_days: 3, expiry_date: '2026-08-20', storage_condition: 'Ngăn mát 4°C' },
  { id: 9, name: 'Đào Ngâm & Nước Cốt Trà', unit: 'hộp', current_stock: 45.0, min_stock_alert: 10.0, cost_price: 32000, category: 'Đồ uống', shelf_life_days: 90, expiry_date: '2026-11-15', storage_condition: 'Nhiệt độ phòng' },
  { id: 10, name: 'Cam Sành Tươi Mọng', unit: 'kg', current_stock: 35.0, min_stock_alert: 10.0, cost_price: 22000, category: 'Trái cây', shelf_life_days: 7, expiry_date: '2026-08-24', storage_condition: 'Thoáng mát 10-15°C' },
  { id: 11, name: 'Khúc Bạch Hạnh Nhân', unit: 'hộp', current_stock: 25.0, min_stock_alert: 8.0, cost_price: 20000, category: 'Tráng miệng', shelf_life_days: 5, expiry_date: '2026-08-23', storage_condition: 'Ngăn mát 2-4°C' },
  { id: 12, name: 'Bơ Lạt & Sốt Tiêu Đen', unit: 'kg', current_stock: 4.5, min_stock_alert: 2.0, cost_price: 150000, category: 'Gia vị & Bơ sốt', shelf_life_days: 60, expiry_date: '2026-10-18', storage_condition: 'Ngăn mát 2-4°C' },
  { id: 13, name: 'Mật Ong Hoa Rừng Tự Nhiên', unit: 'lít', current_stock: 8.0, min_stock_alert: 2.0, cost_price: 190000, category: 'Gia vị & Mật', shelf_life_days: 365, expiry_date: '2027-08-15', storage_condition: 'Nhiệt độ phòng' },
  { id: 14, name: 'Tỏi & Ớt Xiêm Xanh', unit: 'kg', current_stock: 9.0, min_stock_alert: 3.0, cost_price: 55000, category: 'Gia vị tươi', shelf_life_days: 15, expiry_date: '2026-08-30', storage_condition: 'Khô ráo thoáng mát' },
  { id: 15, name: 'Bánh Tráng & Rau Thơm Cuốn', unit: 'gói', current_stock: 40.0, min_stock_alert: 10.0, cost_price: 15000, category: 'Đồ khô', shelf_life_days: 120, expiry_date: '2026-12-15', storage_condition: 'Nơi khô ráo' }
];

// 10. Default Recipes (BOM)
const defaultRecipes = [
  { id: 1, menu_item_id: 1, ingredient_id: 3, quantity_needed: 0.1, notes: '100g tôm tươi' },
  { id: 2, menu_item_id: 1, ingredient_id: 15, quantity_needed: 1.0, notes: '1 gói bánh tráng rau cuốn' },
  { id: 3, menu_item_id: 4, ingredient_id: 1, quantity_needed: 0.25, notes: '250g bò Wagyu cao cấp' },
  { id: 4, menu_item_id: 4, ingredient_id: 12, quantity_needed: 0.05, notes: '50g sốt tiêu & bơ' },
  { id: 5, menu_item_id: 5, ingredient_id: 2, quantity_needed: 0.4, notes: '400g sườn cây' },
  { id: 6, menu_item_id: 5, ingredient_id: 13, quantity_needed: 0.05, notes: '50ml mật ong rừng' },
  { id: 7, menu_item_id: 6, ingredient_id: 3, quantity_needed: 0.35, notes: '350g tôm càng' },
  { id: 8, menu_item_id: 6, ingredient_id: 14, quantity_needed: 0.08, notes: 'Tỏi và ớt xiêm' },
  { id: 9, menu_item_id: 7, ingredient_id: 4, quantity_needed: 0.3, notes: '300g mực trứng' },
  { id: 10, menu_item_id: 8, ingredient_id: 5, quantity_needed: 1.5, notes: '1.5 lít nước cốt lẩu' },
  { id: 11, menu_item_id: 8, ingredient_id: 3, quantity_needed: 0.2, notes: '200g tôm sú' },
  { id: 12, menu_item_id: 8, ingredient_id: 4, quantity_needed: 0.2, notes: '200g mực tươi' },
  { id: 13, menu_item_id: 10, ingredient_id: 7, quantity_needed: 0.25, notes: '250g gạo thơm' },
  { id: 14, menu_item_id: 10, ingredient_id: 3, quantity_needed: 0.08, notes: '80g tôm xắt hạt lựu' },
  { id: 15, menu_item_id: 11, ingredient_id: 8, quantity_needed: 0.3, notes: '300g rau rừng' },
  { id: 16, menu_item_id: 11, ingredient_id: 14, quantity_needed: 0.05, notes: 'Tỏi băm' },
  { id: 17, menu_item_id: 12, ingredient_id: 9, quantity_needed: 0.5, notes: 'Nửa hộp đào & cốt trà' },
  { id: 18, menu_item_id: 12, ingredient_id: 10, quantity_needed: 0.1, notes: '1 lát cam tươi' },
  { id: 19, menu_item_id: 13, ingredient_id: 10, quantity_needed: 0.4, notes: '400g cam tươi vắt' }
];

// 11. Sample Inventory Imports
const defaultImports = [
  {
    id: 1,
    ingredient_id: 1,
    ingredient_name: 'Thịt Bò Wagyu A5',
    supplier_name: 'Công ty Thực Phẩm Cao Cấp Nippon',
    quantity_imported: 20.0,
    unit: 'kg',
    import_price: 650000,
    total_amount: 13000000,
    expiry_date: '2026-08-25',
    batch_number: 'LOT-WAGYU-20260815',
    import_date: '2026-08-15 08:30:00',
    staff_name: 'Trần Hoàng Quản Lý',
    notes: 'Nhập lô hàng tươi mới chuẩn vân mỡ A5'
  },
  {
    id: 2,
    ingredient_id: 2,
    ingredient_name: 'Sườn Cây Heo Tươi',
    supplier_name: 'Trang Trại Heo Sạch Đồng Nai',
    quantity_imported: 30.0,
    unit: 'kg',
    import_price: 120000,
    total_amount: 3600000,
    expiry_date: '2026-08-23',
    batch_number: 'LOT-SUON-20260816',
    import_date: '2026-08-16 09:15:00',
    staff_name: 'Trần Hoàng Quản Lý',
    notes: 'Sườn cây tươi trong ngày'
  },
  {
    id: 3,
    ingredient_id: 3,
    ingredient_name: 'Tôm Càng Xanh Loại 1',
    supplier_name: 'Vựa Hải Sản Tươi Sống Cần Giờ',
    quantity_imported: 15.0,
    unit: 'kg',
    import_price: 280000,
    total_amount: 4200000,
    expiry_date: '2026-08-21',
    batch_number: 'LOT-TOM-20260817',
    import_date: '2026-08-17 07:45:00',
    staff_name: 'Trần Hoàng Quản Lý',
    notes: 'Tôm còn bơi khỏe'
  },
  {
    id: 4,
    ingredient_id: 10,
    ingredient_name: 'Cam Sành Tươi Mọng',
    supplier_name: 'Nông Sản Miền Tây Tiền Giang',
    quantity_imported: 50.0,
    unit: 'kg',
    import_price: 22000,
    total_amount: 1100000,
    expiry_date: '2026-08-24',
    batch_number: 'LOT-CAM-20260818',
    import_date: '2026-08-18 10:00:00',
    staff_name: 'Trần Hoàng Quản Lý',
    notes: 'Cam sành ngọt mọng nước'
  }
];

// 12. Sample Inventory Disposals (Biên bản tiêu hủy hàng hỏng / quá hạn)
const defaultDisposals = [
  {
    id: 1,
    ingredient_id: 4,
    ingredient_name: 'Mực Trứng Tươi Rói',
    quantity: 1.0,
    unit: 'kg',
    cost_loss: 210000,
    reason: 'Rã đông quá nhiệt độ khiến mực mất độ tươi giòn, lập biên bản hủy bỏ',
    disposed_by: 'Phạm Hải Đăng (Bếp Trưởng)',
    disposal_date: '2026-08-18 16:30:00',
    notes: 'Tiêu hủy theo quy chuẩn an toàn vệ sinh thực phẩm'
  },
  {
    id: 2,
    ingredient_id: 8,
    ingredient_name: 'Rau Rừng Gia Lai',
    quantity: 1.2,
    unit: 'kg',
    cost_loss: 54000,
    reason: 'Hàng tồn cuối tuần bị úa vàng và dập lá, không đảm bảo chất lượng phục vụ',
    disposed_by: 'Võ Minh Quân (Bếp Phó)',
    disposal_date: '2026-08-17 11:20:00',
    notes: 'Đã hủy và dọn dẹp khay bảo quản'
  }
];

// 13. Sample Cancelled Order Items
const defaultCancelledItems = [
  {
    id: 1,
    order_id: 1,
    menu_item_id: 7,
    dish_name: 'Mực Trứng Hấp Gừng Hành',
    table_name: 'Bàn T1-02',
    quantity: 1,
    price: 185000,
    total_amount: 185000,
    reason: 'Khách đổi ý muốn đổi sang món nướng (Phục vụ tư vấn lại)',
    action_type: 'change_dish',
    responsible_role: 'staff',
    responsible_user_id: 2,
    responsible_user_name: 'Nguyễn Văn Phục Vụ',
    cancelled_by: 'Nguyễn Văn Phục Vụ',
    cancelled_at: '2026-08-19 12:30:00'
  },
  {
    id: 2,
    order_id: 2,
    menu_item_id: 14,
    dish_name: 'Chè Khúc Bạch Hạnh Nhân',
    table_name: 'Bàn T1-03',
    quantity: 2,
    price: 45000,
    total_amount: 90000,
    reason: 'Bếp báo hết nguyên liệu khúc bạch trong ngày',
    action_type: 'cancel',
    responsible_role: 'chef',
    responsible_user_id: 4,
    responsible_user_name: 'Phạm Hải Đăng (Bếp Trưởng)',
    cancelled_by: 'Phạm Hải Đăng (Bếp Trưởng)',
    cancelled_at: '2026-08-19 13:10:00'
  },
  {
    id: 3,
    order_id: 3,
    menu_item_id: 5,
    dish_name: 'Sườn Cây Nướng Mật Ong Hoa Rừng',
    table_name: 'Bàn T2-02',
    quantity: 1,
    price: 195000,
    total_amount: 195000,
    reason: 'Bếp nướng quá tay bị xém cạnh nhiều, khách yêu cầu làm lại',
    action_type: 'cancel',
    responsible_role: 'chef',
    responsible_user_id: 5,
    responsible_user_name: 'Võ Minh Quân (Bếp Phó)',
    cancelled_by: 'Nguyễn Văn Phục Vụ',
    cancelled_at: '2026-08-18 19:40:00'
  },
  {
    id: 4,
    order_id: 1,
    menu_item_id: 12,
    dish_name: 'Trà Đào Cam Sả Mật Ong Hổ Phách',
    table_name: 'Bàn T1-02',
    quantity: 1,
    price: 45000,
    total_amount: 45000,
    reason: 'Phục vụ ghi nhầm bàn sang bàn khác, khách bàn này từ chối nhận',
    action_type: 'cancel',
    responsible_role: 'staff',
    responsible_user_id: 2,
    responsible_user_name: 'Nguyễn Văn Phục Vụ',
    cancelled_by: 'Nguyễn Văn Phục Vụ',
    cancelled_at: '2026-08-17 18:20:00'
  }
];

// 14. Multi-Month Payroll Records
const defaultPayrollRecords = [
  // --- THÁNG 06/2026 ---
  {
    id: 1,
    user_id: 2,
    user_name: 'Nguyễn Văn Phục Vụ',
    role: 'staff',
    month_year: '2026-06',
    base_salary_type: 'hourly',
    regular_hours: 155.0,
    holiday_hours: 0,
    tet_hours: 0,
    worked_days: 20,
    off_days: 6,
    holiday_days: 0,
    tet_days: 0,
    hourly_rate: 20000,
    monthly_base: 0,
    bonus: 100000,
    deductions: 0,
    final_salary: 3200000,
    status: 'paid',
    notes: 'Tháng 6 làm tròn 20 ca',
    created_at: '2026-06-30 23:59:00'
  },
  {
    id: 2,
    user_id: 3,
    user_name: 'Lê Thị Thu Ngân',
    role: 'staff',
    month_year: '2026-06',
    base_salary_type: 'hourly',
    regular_hours: 160.0,
    holiday_hours: 0,
    tet_hours: 0,
    worked_days: 22,
    off_days: 4,
    holiday_days: 0,
    tet_days: 0,
    hourly_rate: 20000,
    monthly_base: 0,
    bonus: 200000,
    deductions: 0,
    final_salary: 3400000,
    status: 'paid',
    notes: 'Thưởng quản lý thu ngân đối soát khớp 100%',
    created_at: '2026-06-30 23:59:00'
  },
  {
    id: 3,
    user_id: 4,
    user_name: 'Phạm Hải Đăng (Bếp Trưởng)',
    role: 'chef',
    month_year: '2026-06',
    base_salary_type: 'monthly',
    regular_hours: 208.0,
    holiday_hours: 0,
    tet_hours: 0,
    worked_days: 26,
    off_days: 0,
    holiday_days: 0,
    tet_days: 0,
    hourly_rate: 0,
    monthly_base: 12000000,
    bonus: 500000,
    deductions: 0,
    final_salary: 12500000,
    status: 'paid',
    notes: 'Đạt chuyên cần xuất sắc tháng 6',
    created_at: '2026-06-30 23:59:00'
  },
  {
    id: 4,
    user_id: 5,
    user_name: 'Võ Minh Quân (Bếp Phó)',
    role: 'chef',
    month_year: '2026-06',
    base_salary_type: 'monthly',
    regular_hours: 200.0,
    holiday_hours: 0,
    tet_hours: 0,
    worked_days: 25,
    off_days: 1,
    holiday_days: 0,
    tet_days: 0,
    hourly_rate: 0,
    monthly_base: 12000000,
    bonus: 0,
    deductions: 0,
    final_salary: 11538462,
    status: 'paid',
    notes: 'Nghỉ phép 1 ngày có báo trước',
    created_at: '2026-06-30 23:59:00'
  },

  // --- THÁNG 07/2026 ---
  {
    id: 5,
    user_id: 2,
    user_name: 'Nguyễn Văn Phục Vụ',
    role: 'staff',
    month_year: '2026-07',
    base_salary_type: 'hourly',
    regular_hours: 170.0,
    holiday_hours: 16.0,
    tet_hours: 0,
    worked_days: 24,
    off_days: 2,
    holiday_days: 2,
    tet_days: 0,
    hourly_rate: 20000,
    monthly_base: 0,
    bonus: 300000,
    deductions: 0,
    final_salary: 4340000,
    status: 'paid',
    notes: 'Tăng ca nhiệt tình đợt lễ cao điểm hè',
    created_at: '2026-07-31 23:59:00'
  },
  {
    id: 6,
    user_id: 3,
    user_name: 'Lê Thị Thu Ngân',
    role: 'staff',
    month_year: '2026-07',
    base_salary_type: 'hourly',
    regular_hours: 165.0,
    holiday_hours: 12.0,
    tet_hours: 0,
    worked_days: 23,
    off_days: 3,
    holiday_days: 1,
    tet_days: 0,
    hourly_rate: 20000,
    monthly_base: 0,
    bonus: 250000,
    deductions: 0,
    final_salary: 4030000,
    status: 'paid',
    notes: 'Hoàn thành xuất sắc nhiệm vụ thu ngân',
    created_at: '2026-07-31 23:59:00'
  },
  {
    id: 7,
    user_id: 4,
    user_name: 'Phạm Hải Đăng (Bếp Trưởng)',
    role: 'chef',
    month_year: '2026-07',
    base_salary_type: 'monthly',
    regular_hours: 200.0,
    holiday_hours: 0,
    tet_hours: 0,
    worked_days: 24,
    off_days: 2,
    holiday_days: 1,
    tet_days: 0,
    hourly_rate: 0,
    monthly_base: 12000000,
    bonus: 1000000,
    deductions: 0,
    final_salary: 12538462,
    status: 'paid',
    notes: 'Thưởng quản lý bếp doanh thu hè vượt kế hoạch',
    created_at: '2026-07-31 23:59:00'
  },
  {
    id: 8,
    user_id: 5,
    user_name: 'Võ Minh Quân (Bếp Phó)',
    role: 'chef',
    month_year: '2026-07',
    base_salary_type: 'monthly',
    regular_hours: 216.0,
    holiday_hours: 0,
    tet_hours: 0,
    worked_days: 26,
    off_days: 0,
    holiday_days: 2,
    tet_days: 0,
    hourly_rate: 0,
    monthly_base: 12000000,
    bonus: 500000,
    deductions: 0,
    final_salary: 13423077,
    status: 'paid',
    notes: 'Trực bếp xuyên lễ tháng 7',
    created_at: '2026-07-31 23:59:00'
  },

  // --- THÁNG 08/2026 ---
  {
    id: 9,
    user_id: 2,
    user_name: 'Nguyễn Văn Phục Vụ',
    role: 'staff',
    month_year: '2026-08',
    base_salary_type: 'hourly',
    regular_hours: 160.0,
    holiday_hours: 10.0,
    tet_hours: 5.0,
    worked_days: 22,
    off_days: 4,
    holiday_days: 1,
    tet_days: 1,
    hourly_rate: 20000,
    monthly_base: 0,
    bonus: 100000,
    deductions: 0,
    final_salary: 4000000,
    status: 'pending',
    notes: 'Có 10h làm lễ (x2) và 5h làm tết (x3)',
    created_at: '2026-08-19 12:00:00'
  },
  {
    id: 10,
    user_id: 3,
    user_name: 'Lê Thị Thu Ngân',
    role: 'staff',
    month_year: '2026-08',
    base_salary_type: 'hourly',
    regular_hours: 155.0,
    holiday_hours: 8.0,
    tet_hours: 0,
    worked_days: 21,
    off_days: 3,
    holiday_days: 1,
    tet_days: 0,
    hourly_rate: 20000,
    monthly_base: 0,
    bonus: 200000,
    deductions: 50000,
    final_salary: 3570000,
    status: 'pending',
    notes: 'Trừ 50.000 đ đi muộn 1 lần ngày 05/08',
    created_at: '2026-08-19 12:00:00'
  },
  {
    id: 11,
    user_id: 4,
    user_name: 'Phạm Hải Đăng (Bếp Trưởng)',
    role: 'chef',
    month_year: '2026-08',
    base_salary_type: 'monthly',
    regular_hours: 192.0,
    holiday_hours: 0,
    tet_hours: 0,
    worked_days: 24,
    off_days: 2,
    holiday_days: 1,
    tet_days: 0,
    hourly_rate: 0,
    monthly_base: 12000000,
    bonus: 0,
    deductions: 0,
    final_salary: 11538462,
    status: 'pending',
    notes: 'Nghỉ phép 2 ngày cá nhân',
    created_at: '2026-08-19 12:00:00'
  },
  {
    id: 12,
    user_id: 5,
    user_name: 'Võ Minh Quân (Bếp Phó)',
    role: 'chef',
    month_year: '2026-08',
    base_salary_type: 'monthly',
    regular_hours: 208.0,
    holiday_hours: 0,
    tet_hours: 0,
    worked_days: 26,
    off_days: 0,
    holiday_days: 1,
    tet_days: 0,
    hourly_rate: 0,
    monthly_base: 12000000,
    bonus: 500000,
    deductions: 0,
    final_salary: 12961538,
    status: 'pending',
    notes: 'Trực thay ca bếp trưởng và làm ngày lễ',
    created_at: '2026-08-19 12:00:00'
  }
];

// 15. Sample Daily Attendance Records
const defaultDailyAttendance = [
  { user_id: 2, user_name: 'Nguyễn Văn Phục Vụ', role: 'staff', work_date: '2026-08-01', month_year: '2026-08', shift_name: 'full_day', hours_worked: 8.0, day_type: 'normal', attendance_status: 'present', notes: 'Ca chuẩn 8 tiếng' },
  { user_id: 2, user_name: 'Nguyễn Văn Phục Vụ', role: 'staff', work_date: '2026-08-02', month_year: '2026-08', shift_name: 'full_day', hours_worked: 10.0, day_type: 'holiday', attendance_status: 'present', notes: 'Ngày Lễ (Lương x2)' },
  { user_id: 2, user_name: 'Nguyễn Văn Phục Vụ', role: 'staff', work_date: '2026-08-03', month_year: '2026-08', shift_name: 'morning', hours_worked: 5.0, day_type: 'tet', attendance_status: 'present', notes: 'Ca Tết (Lương x3)' },
  { user_id: 2, user_name: 'Nguyễn Văn Phục Vụ', role: 'staff', work_date: '2026-08-04', month_year: '2026-08', shift_name: 'full_day', hours_worked: 0, day_type: 'off', attendance_status: 'absent_excused', notes: 'Nghỉ phép thường' },
  { user_id: 4, user_name: 'Phạm Hải Đăng (Bếp Trưởng)', role: 'chef', work_date: '2026-08-01', month_year: '2026-08', shift_name: 'full_day', hours_worked: 8.0, day_type: 'normal', attendance_status: 'present', notes: 'Chỉ đạo bếp' },
  { user_id: 4, user_name: 'Phạm Hải Đăng (Bếp Trưởng)', role: 'chef', work_date: '2026-08-02', month_year: '2026-08', shift_name: 'full_day', hours_worked: 8.0, day_type: 'holiday', attendance_status: 'present', notes: 'Làm ngày lễ (Lương x2)' },
  { user_id: 4, user_name: 'Phạm Hải Đăng (Bếp Trưởng)', role: 'chef', work_date: '2026-08-03', month_year: '2026-08', shift_name: 'full_day', hours_worked: 0, day_type: 'off', attendance_status: 'absent_excused', notes: 'Nghỉ phép 1 ngày' },
  { user_id: 4, user_name: 'Phạm Hải Đăng (Bếp Trưởng)', role: 'chef', work_date: '2026-08-04', month_year: '2026-08', shift_name: 'full_day', hours_worked: 0, day_type: 'off', attendance_status: 'absent_excused', notes: 'Nghỉ phép ngày thứ 2' }
];

const defaultOrders = [
  {
    id: 1,
    table_id: 2,
    table_name: 'Bàn T1-02',
    staff_id: 2,
    staff_name: 'Nguyễn Văn Phục Vụ',
    status: 'served',
    total_amount: 549000,
    discount_percent: 0,
    vat_percent: 8,
    final_amount: 592920,
    notes: 'Khách yêu cầu ít đá cho nước ép',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    items: [
      { id: 1, menu_item_id: 4, name: 'Bò Wagyu Nướng Đá Sốt Tiêu Đen', quantity: 1, price: 289000, status: 'served', notes: 'Chín vừa', assigned_chef_name: 'Phạm Hải Đăng (Bếp Trưởng)' },
      { id: 2, menu_item_id: 1, name: 'Gỏi Cuốn Tôm Thịt Hoàng Kim', quantity: 2, price: 65000, status: 'served', notes: '', assigned_chef_name: 'Võ Minh Quân (Bếp Phó)' },
      { id: 3, menu_item_id: 12, name: 'Trà Đào Cam Sả Mật Ong Hổ Phách', quantity: 2, price: 45000, status: 'served', notes: 'Ít đá', assigned_chef_name: null },
      { id: 4, menu_item_id: 13, name: 'Nước Ép Cam Tươi Vàng Óng', quantity: 1, price: 49000, status: 'served', notes: '', assigned_chef_name: null }
    ]
  },
  {
    id: 2,
    table_id: 3,
    table_name: 'Bàn T1-03',
    staff_id: 2,
    staff_name: 'Nguyễn Văn Phục Vụ',
    status: 'cooking',
    total_amount: 404000,
    discount_percent: 5,
    vat_percent: 8,
    final_amount: 414504,
    notes: 'Không hành lá cho lẩu',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    items: [
      { id: 5, menu_item_id: 8, name: 'Lẩu Thái Hải Sản Tomyum Cay Nồng', quantity: 1, price: 349000, status: 'cooking', notes: 'Không hành lá, cay vừa', assigned_chef_name: 'Phạm Hải Đăng (Bếp Trưởng)' },
      { id: 6, menu_item_id: 3, name: 'Khoai Tây Chiên Lắc Phô Mai Trứng Muối', quantity: 1, price: 55000, status: 'ready', notes: '', assigned_chef_name: 'Võ Minh Quân (Bếp Phó)' }
    ]
  },
  {
    id: 3,
    table_id: 8,
    table_name: 'Bàn T2-02',
    staff_id: 3,
    staff_name: 'Lê Thị Thu Ngân',
    status: 'cooking',
    total_amount: 635000,
    discount_percent: 0,
    vat_percent: 8,
    final_amount: 685800,
    notes: 'Đang chuẩn bị lên món',
    created_at: new Date(Date.now() - 10 * 60000).toISOString(),
    items: [
      { id: 7, menu_item_id: 5, name: 'Sườn Cây Nướng Mật Ong Hoa Rừng', quantity: 2, price: 195000, status: 'cooking', notes: 'Nướng kỹ xém cạnh', assigned_chef_name: 'Phạm Hải Đăng (Bếp Trưởng)' },
      { id: 8, menu_item_id: 6, name: 'Tôm Càng Xanh Cháy Tỏi Ớt Xiêm', quantity: 1, price: 245000, status: 'pending', notes: '', assigned_chef_name: null }
    ]
  }
];

const defaultInvoices = [
  {
    id: 1,
    order_id: 1,
    invoice_code: 'HD-20260819-001',
    table_name: 'Bàn T1-01',
    payment_method: 'transfer_qr',
    total_amount: 850000,
    discount_amount: 50000,
    vat_amount: 64000,
    final_amount: 864000,
    customer_paid: 864000,
    change_amount: 0,
    staff_name: 'Trần Hoàng Quản Lý',
    items: [
      { name: 'Lẩu Nấm Chim Câu Bổ Dưỡng', quantity: 1, price: 389000 },
      { name: 'Sườn Cây Nướng Mật Ong Hoa Rừng', quantity: 2, price: 195000 },
      { name: 'Trà Đào Cam Sả Mật Ong Hổ Phách', quantity: 2, price: 45000 }
    ],
    created_at: new Date(Date.now() - 3 * 3600000).toISOString()
  },
  {
    id: 2,
    order_id: 2,
    invoice_code: 'HD-20260819-002',
    table_name: 'Bàn VIP-01',
    payment_method: 'cash',
    total_amount: 1450000,
    discount_amount: 145000,
    vat_amount: 104400,
    final_amount: 1409400,
    customer_paid: 1500000,
    change_amount: 90600,
    staff_name: 'Lê Thị Thu Ngân',
    items: [
      { name: 'Bò Wagyu Nướng Đá Sốt Tiêu Đen', quantity: 3, price: 289000 },
      { name: 'Tôm Càng Xanh Cháy Tỏi Ớt Xiêm', quantity: 2, price: 245000 },
      { name: 'Nước Ép Cam Tươi Vàng Óng', quantity: 4, price: 49000 }
    ],
    created_at: new Date(Date.now() - 1 * 3600000).toISOString()
  }
];

// 16. Default Promotions & Creative Advertising Banners
const defaultPromotions = [
  {
    id: 1,
    title: 'ĐẠI TIỆC BÒ WAGYU NƯỚNG ĐÁ NÚI LỬA',
    subtitle: 'Thịt bò Wagyu A5 vân mỡ cẩm thạch thượng hạng mềm tan trong miệng',
    badge_text: 'HOT DEAL TUẦN NÀY',
    discount_percent: 20,
    discount_code: 'WAGYU20',
    banner_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    theme_gradient: 'from-amber-600 via-orange-600 to-red-700',
    accent_color: '#F59E0B',
    is_active: true,
    start_date: '2026-08-01',
    end_date: '2026-08-31',
    description: 'Giảm ngay 20% khi gọi Bò Wagyu Nướng Đá Sốt Tiêu Đen hoặc Combo Nướng Hoàng Gia. Áp dụng toàn bộ các khung giờ trong tuần!'
  },
  {
    id: 2,
    title: 'GIỜ VÀNG HOÀNG GIA: ĐI 4 TÍNH TIỀN 3',
    subtitle: 'Áp dụng cho toàn bộ Menu Lẩu Đặc Biệt & Tặng kèm Trà Đào Cam Sả Hổ Phách',
    badge_text: 'HAPPY HOUR 11H-13H30',
    discount_percent: 25,
    discount_code: 'HAPPYHOUR',
    banner_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
    theme_gradient: 'from-yellow-600 via-amber-600 to-orange-700',
    accent_color: '#EAB308',
    is_active: true,
    start_date: '2026-08-01',
    end_date: '2026-09-15',
    description: 'Ưu đãi trưa cực đã: Đi nhóm 4 người tặng ngay 01 suất Lẩu miễn phí + Free nước tráng miệng cao cấp.'
  },
  {
    id: 3,
    title: 'LỄ HỘI HẢI SẢN TƯƠI SỐNG CÔN ĐẢO',
    subtitle: 'Tôm Càng Xanh Cháy Tỏi & Mực Trứng Hấp Gừng - Đồng giá Nước Ép Cam 19k',
    badge_text: 'SEAFOOD SPECIAL',
    discount_percent: 15,
    discount_code: 'SEAFOOD15',
    banner_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=80',
    theme_gradient: 'from-orange-600 via-rose-600 to-purple-800',
    accent_color: '#FB923C',
    is_active: true,
    start_date: '2026-08-10',
    end_date: '2026-08-25',
    description: 'Thưởng thức trọn vẹn vị ngọt tinh túy từ biển khơi cùng công thức sốt ớt xiêm bí truyền trứ danh.'
  }
];

// 17. Default Customers & Loyalty Program
const defaultCustomers = [
  {
    id: 1,
    phone: '0901234567',
    full_name: 'Nguyễn Văn Hùng',
    points: 850,
    tier: 'silver',
    total_spent: 8500000,
    visits_count: 7,
    notes: 'Khách VIP thích ngồi bàn ngoài trời view thoáng, hay gọi lẩu Tomyum'
  },
  {
    id: 2,
    phone: '0988889999',
    full_name: 'Trần Thị Mai Phương',
    points: 2400,
    tier: 'gold',
    total_spent: 24000000,
    visits_count: 15,
    notes: 'Hội viên Vàng, thường tổ chức tiệc sinh nhật & gia đình tại phòng VIP'
  },
  {
    id: 3,
    phone: '0912345678',
    full_name: 'Phạm Quốc Bảo',
    points: 4200,
    tier: 'diamond',
    total_spent: 42000000,
    visits_count: 26,
    notes: 'Hội viên Kim Cương thân thiết, ưu tiên xếp bàn đẹp nhất'
  },
  {
    id: 4,
    phone: '0933456789',
    full_name: 'Lê Hoàng Yến',
    points: 250,
    tier: 'bronze',
    total_spent: 2500000,
    visits_count: 2,
    notes: 'Khách hàng mới tiềm năng'
  }
];

// 18. Default Customer Feedbacks
const defaultFeedbacks = [
  {
    id: 1,
    customer_phone: '0988889999',
    customer_name: 'Trần Thị Mai Phương',
    table_name: 'Bàn VIP-01',
    food_rating: 5,
    service_rating: 5,
    overall_rating: 5,
    comment: 'Thịt bò Wagyu nướng đá cực kỳ thơm ngon, sốt tiêu đen đậm đà. Nhân viên phục vụ rất chu đáo và nhanh nhẹn!',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString()
  },
  {
    id: 2,
    customer_phone: '0901234567',
    customer_name: 'Nguyễn Văn Hùng',
    table_name: 'Bàn T1-04',
    food_rating: 5,
    service_rating: 4,
    overall_rating: 5,
    comment: 'Lẩu Tomyum nước dùng chua cay rất vừa miệng, hải sản tươi rói. Game vòng quay may mắn trúng voucher 20% rất vui!',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString()
  },
  {
    id: 3,
    customer_phone: '0933456789',
    customer_name: 'Lê Hoàng Yến',
    table_name: 'Bàn T2-02',
    food_rating: 4,
    service_rating: 5,
    overall_rating: 4,
    comment: 'Không gian quán ấm cúng, sang trọng. Khách tự chọn món trên máy tính bảng rất tiện lợi và hiện đại.',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString()
  }
];

// 19. Default Minigame Rewards History
const defaultMinigameRewards = [
  {
    id: 1,
    customer_phone: '0988889999',
    game_type: 'lucky_wheel',
    reward_type: 'voucher',
    reward_value: '20%',
    reward_code: 'WHEEL-20-8899',
    is_used: true,
    created_at: new Date(Date.now() - 50 * 3600000).toISOString()
  },
  {
    id: 2,
    customer_phone: '0901234567',
    game_type: 'card_matching',
    reward_type: 'points',
    reward_value: '300',
    reward_code: 'POINTS-300',
    is_used: true,
    created_at: new Date(Date.now() - 26 * 3600000).toISOString()
  }
];

// 20. Default Table Reservations & Pre-orders
const defaultReservations = [
  {
    id: 1,
    table_id: 6,
    table_name: 'Bàn VIP-01',
    customer_name: 'Trần Hoàng Long',
    customer_phone: '0912334556',
    guest_count: 6,
    reservation_time: '2026-08-19 19:30:00',
    status: 'confirmed',
    special_notes: 'Tiệc sinh nhật gia đình, set up thêm bình hoa tươi và nến lung linh',
    deposit_amount: 500000,
    preordered_items: [
      { name: 'Bò Wagyu Nướng Đá (250g)', quantity: 2, price: 289000 },
      { name: 'Lẩu Thái Hải Sản Tomyum Cay Nồng', quantity: 1, price: 349000 },
      { name: '6x Trà Đào Cam Sả Mật Ong', quantity: 6, price: 45000 }
    ],
    created_at: new Date(Date.now() - 5 * 3600000).toISOString()
  },
  {
    id: 2,
    table_id: 4,
    table_name: 'Bàn T1-04',
    customer_name: 'Mai Phương Thảo',
    customer_phone: '0988776655',
    guest_count: 4,
    reservation_time: '2026-08-19 18:30:00',
    status: 'confirmed',
    special_notes: 'Khách ăn ít cay, sắp xếp bàn cạnh ban công thoáng mát',
    deposit_amount: 200000,
    preordered_items: [
      { name: 'Combo Nướng Hoàng Gia Thượng Hạng (3-4 Người)', quantity: 1, price: 699000 }
    ],
    created_at: new Date(Date.now() - 3 * 3600000).toISOString()
  }
];

module.exports = {
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
};

