const { getPool, isMySQL, getMemoryStore } = require('../config/database');

exports.getSettings = async (req, res, next) => {
  try {
    if (isMySQL()) {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM settings LIMIT 1');
      if (rows.length > 0) {
        return res.json({ success: true, data: rows[0] });
      }
    }

    const memory = getMemoryStore();
    res.json({ success: true, data: memory.settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const {
      restaurant_name,
      slogan,
      address,
      phone,
      bank_name,
      bank_code,
      bank_account,
      bank_owner,
      vat_default,
      currency_symbol
    } = req.body;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query(
        `UPDATE settings SET 
          restaurant_name = COALESCE(?, restaurant_name),
          slogan = COALESCE(?, slogan),
          address = COALESCE(?, address),
          phone = COALESCE(?, phone),
          bank_name = COALESCE(?, bank_name),
          bank_code = COALESCE(?, bank_code),
          bank_account = COALESCE(?, bank_account),
          bank_owner = COALESCE(?, bank_owner),
          vat_default = COALESCE(?, vat_default),
          currency_symbol = COALESCE(?, currency_symbol)
        WHERE id = 1`,
        [
          restaurant_name,
          slogan,
          address,
          phone,
          bank_name,
          bank_code,
          bank_account,
          bank_owner,
          vat_default,
          currency_symbol
        ]
      );
      return res.json({ success: true, message: 'Cập nhật thông tin quán thành công' });
    }

    const memory = getMemoryStore();
    if (restaurant_name) memory.settings.restaurant_name = restaurant_name;
    if (slogan !== undefined) memory.settings.slogan = slogan;
    if (address !== undefined) memory.settings.address = address;
    if (phone !== undefined) memory.settings.phone = phone;
    if (bank_name !== undefined) memory.settings.bank_name = bank_name;
    if (bank_code !== undefined) memory.settings.bank_code = bank_code;
    if (bank_account !== undefined) memory.settings.bank_account = bank_account;
    if (bank_owner !== undefined) memory.settings.bank_owner = bank_owner;
    if (vat_default !== undefined) memory.settings.vat_default = parseFloat(vat_default);
    if (currency_symbol !== undefined) memory.settings.currency_symbol = currency_symbol;

    res.json({ success: true, message: 'Cập nhật thông tin quán thành công', data: memory.settings });
  } catch (error) {
    next(error);
  }
};
