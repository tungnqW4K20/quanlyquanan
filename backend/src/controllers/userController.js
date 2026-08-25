const bcrypt = require('bcryptjs');
const { getPool, isMySQL, getMemoryStore } = require('../config/database');

exports.getUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;

    if (isMySQL()) {
      const pool = getPool();
      let query = 'SELECT id, username, full_name, role, phone, status, avatar, created_at FROM users WHERE 1=1';
      const params = [];
      if (role && role !== 'all') {
        query += ' AND role = ?';
        params.push(role);
      }
      if (status && status !== 'all') {
        query += ' AND status = ?';
        params.push(status);
      }
      if (search) {
        query += ' AND (username LIKE ? OR full_name LIKE ? OR phone LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      query += ' ORDER BY id ASC';

      const [rows] = await pool.query(query, params);
      return res.json({ success: true, data: rows });
    }

    const memory = getMemoryStore();
    let users = memory.users.map((u) => {
      const { password, raw_password, ...safeUser } = u;
      return safeUser;
    });

    if (role && role !== 'all') {
      users = users.filter((u) => u.role === role);
    }
    if (status && status !== 'all') {
      users = users.filter((u) => u.status === status);
    }
    if (search) {
      const term = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.username.toLowerCase().includes(term) ||
          u.full_name.toLowerCase().includes(term) ||
          (u.phone && u.phone.includes(term))
      );
    }

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { username, password, full_name, role, phone, avatar } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập, mật khẩu và họ tên' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'staff';
    const userAvatar =
      avatar ||
      (userRole === 'admin'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80');

    if (isMySQL()) {
      const pool = getPool();
      const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
      }

      const [result] = await pool.query(
        'INSERT INTO users (username, password, full_name, role, phone, status, avatar) VALUES (?, ?, ?, ?, ?, "active", ?)',
        [username, hashedPassword, full_name, userRole, phone || '', userAvatar]
      );

      return res.status(201).json({
        success: true,
        message: 'Thêm tài khoản nhân viên thành công',
        data: {
          id: result.insertId,
          username,
          full_name,
          role: userRole,
          phone: phone || '',
          status: 'active',
          avatar: userAvatar
        }
      });
    }

    const memory = getMemoryStore();
    const existing = memory.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
    }

    const newId = memory.users.length > 0 ? Math.max(...memory.users.map((u) => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      username,
      password: hashedPassword,
      raw_password: password,
      full_name,
      role: userRole,
      phone: phone || '',
      status: 'active',
      avatar: userAvatar,
      created_at: new Date().toISOString()
    };

    memory.users.push(newUser);
    const { password: p, raw_password: rp, ...safeUser } = newUser;

    res.status(201).json({
      success: true,
      message: 'Thêm tài khoản nhân viên thành công',
      data: safeUser
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, role, phone, status, password, avatar } = req.body;

    if (isMySQL()) {
      const pool = getPool();
      let query = 'UPDATE users SET full_name = COALESCE(?, full_name), role = COALESCE(?, role), phone = COALESCE(?, phone), status = COALESCE(?, status), avatar = COALESCE(?, avatar)';
      const params = [full_name, role, phone, status, avatar];

      if (password) {
        const hashed = await bcrypt.hash(password, 10);
        query += ', password = ?';
        params.push(hashed);
      }

      query += ' WHERE id = ?';
      params.push(id);

      await pool.query(query, params);
      return res.json({ success: true, message: 'Cập nhật tài khoản thành công' });
    }

    const memory = getMemoryStore();
    const user = memory.users.find((u) => u.id === parseInt(id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (full_name) user.full_name = full_name;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (status) user.status = status;
    if (avatar) user.avatar = avatar;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
      user.raw_password = password;
    }

    const { password: p, raw_password: rp, ...safeUser } = user;
    res.json({ success: true, message: 'Cập nhật tài khoản thành công', data: safeUser });
  } catch (error) {
    next(error);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query('UPDATE users SET status = IF(status = "active", "inactive", "active") WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Đổi trạng thái tài khoản thành công' });
    }

    const memory = getMemoryStore();
    const user = memory.users.find((u) => u.id === parseInt(id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    user.status = user.status === 'active' ? 'inactive' : 'active';
    res.json({ success: true, message: `Đã đổi trạng thái tài khoản sang "${user.status}"`, data: { status: user.status } });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Không thể tự xóa tài khoản của chính mình' });
    }

    if (isMySQL()) {
      const pool = getPool();
      await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Xóa tài khoản thành công' });
    }

    const memory = getMemoryStore();
    const idx = memory.users.findIndex((u) => u.id === parseInt(id));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    memory.users.splice(idx, 1);
    res.json({ success: true, message: 'Xóa tài khoản thành công' });
  } catch (error) {
    next(error);
  }
};
