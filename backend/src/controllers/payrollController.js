const { getPool, isMySQL, getMemoryStore } = require('../config/database');

/**
 * Formula Rules:
 * Staff:
 *  - 20.000 VNĐ / giờ
 *  - Ngày lễ: x2 = 40.000 VNĐ / giờ
 *  - Ngày Tết: x3 = 60.000 VNĐ / giờ
 *  - Lương = (regular_hours * 20000) + (holiday_hours * 40000) + (tet_hours * 60000) + bonus - deductions
 *
 * Chef:
 *  - 12.000.000 VNĐ / tháng (chuẩn 26 ngày công)
 *  - Trừ ngày nghỉ: 12.000.000 - (12.000.000 / 26 * off_days)
 *  - Ngày lễ: + (12.000.000 / 26) * holiday_days
 *  - Ngày Tết: + (12.000.000 / 26 * 2) * tet_days
 *  - Lương = 12.000.000 - (12.000.000 / 26 * off_days) + (12.000.000 / 26 * holiday_days) + (12.000.000 / 26 * 2 * tet_days) + bonus - deductions
 */

function calculateSalaryAmount({
  role,
  base_salary_type,
  hourly_rate = 20000,
  monthly_base = 12000000,
  regular_hours = 0,
  holiday_hours = 0,
  tet_hours = 0,
  worked_days = 26,
  off_days = 0,
  holiday_days = 0,
  tet_days = 0,
  bonus = 0,
  deductions = 0
}) {
  let baseSalary = 0;
  const standardDays = 26;

  if (role === 'chef' || base_salary_type === 'monthly') {
    const dailyRate = (monthly_base || 12000000) / standardDays;
    const baseAfterOff = (monthly_base || 12000000) - (dailyRate * (parseFloat(off_days) || 0));
    const holidayPay = dailyRate * (parseFloat(holiday_days) || 0);
    const tetPay = dailyRate * 2 * (parseFloat(tet_days) || 0);

    baseSalary = baseAfterOff + holidayPay + tetPay;
  } else {
    // Staff hourly
    const rate = parseFloat(hourly_rate) || 20000;
    const regPay = (parseFloat(regular_hours) || 0) * rate;
    const holPay = (parseFloat(holiday_hours) || 0) * (rate * 2);
    const tetPay = (parseFloat(tet_hours) || 0) * (rate * 3);

    baseSalary = regPay + holPay + tetPay;
  }

  const finalSalary = Math.max(0, Math.round(baseSalary + (parseFloat(bonus) || 0) - (parseFloat(deductions) || 0)));
  return finalSalary;
}

// 1. Get Monthly Payroll list with summary metrics
const getMonthlyPayroll = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthYear = req.query.month_year || currentMonthYear;

    if (isMySQL()) {
      const pool = getPool();

      // Get all active staff and chefs
      const [users] = await pool.query(
        "SELECT id, username, full_name, role, phone, avatar, base_salary_type, hourly_rate, monthly_salary, standard_work_days FROM users WHERE role IN ('staff', 'chef') AND status = 'active'"
      );

      // Get existing payroll records for requested month
      const [records] = await pool.query(
        'SELECT * FROM payroll_records WHERE month_year = ? ORDER BY role DESC, id ASC',
        [monthYear]
      );

      // Get cancellation incidents for this month
      const [cancellations] = await pool.query(
        "SELECT * FROM cancelled_order_items WHERE DATE_FORMAT(cancelled_at, '%Y-%m') = ?",
        [monthYear]
      );

      // Combine user list with payroll records so uninitialized users are visible
      const mergedList = users.map((u) => {
        const found = records.find((r) => r.user_id === u.id);
        if (found) {
          return {
            ...found,
            avatar: u.avatar,
            phone: u.phone,
            is_initialized: true
          };
        }

        // Default initial calculation
        const isChef = u.role === 'chef';
        const defaultFinal = calculateSalaryAmount({
          role: u.role,
          base_salary_type: u.base_salary_type,
          hourly_rate: u.hourly_rate || 20000,
          monthly_base: u.monthly_salary || 12000000,
          regular_hours: isChef ? 208 : 160,
          holiday_hours: 0,
          tet_hours: 0,
          worked_days: isChef ? 26 : 20,
          off_days: 0,
          holiday_days: 0,
          tet_days: 0,
          bonus: 0,
          deductions: 0
        });

        return {
          id: `temp-${u.id}`,
          user_id: u.id,
          user_name: u.full_name,
          role: u.role,
          avatar: u.avatar,
          phone: u.phone,
          month_year: monthYear,
          base_salary_type: u.base_salary_type,
          regular_hours: isChef ? 208 : 160,
          holiday_hours: 0,
          tet_hours: 0,
          worked_days: isChef ? 26 : 20,
          off_days: 0,
          holiday_days: 0,
          tet_days: 0,
          hourly_rate: u.hourly_rate || 20000,
          monthly_base: u.monthly_salary || 12000000,
          bonus: 0,
          deductions: 0,
          final_salary: defaultFinal,
          status: 'pending',
          notes: 'Chưa chốt sổ tháng',
          is_initialized: false
        };
      });

      // Calculate summary for this month
      const totalPayrollFund = mergedList.reduce((sum, item) => sum + parseFloat(item.final_salary || 0), 0);
      const paidAmount = mergedList.filter((item) => item.status === 'paid').reduce((sum, item) => sum + parseFloat(item.final_salary || 0), 0);
      const pendingAmount = totalPayrollFund - paidAmount;
      const totalHours = mergedList.reduce((sum, item) => sum + (parseFloat(item.regular_hours || 0) + parseFloat(item.holiday_hours || 0) + parseFloat(item.tet_hours || 0)), 0);
      const totalCancelledLoss = cancellations.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0);

      return res.json({
        success: true,
        data: {
          month_year: monthYear,
          is_current_month: monthYear === currentMonthYear,
          summary: {
            total_staff_count: users.length,
            total_payroll_fund: totalPayrollFund,
            paid_amount: paidAmount,
            pending_amount: pendingAmount,
            total_hours: totalHours,
            total_cancellations_count: cancellations.length,
            total_cancelled_loss: totalCancelledLoss
          },
          payrolls: mergedList
        }
      });
    }

    // In-memory fallback
    const store = getMemoryStore();
    const users = (store.users || []).filter((u) => ['staff', 'chef'].includes(u.role) && u.status === 'active');
    const records = (store.payrolls || []).filter((p) => p.month_year === monthYear);
    const cancellations = (store.cancelledItems || []).filter((c) => (c.cancelled_at || '').startsWith(monthYear));

    const mergedList = users.map((u) => {
      const found = records.find((r) => r.user_id === u.id);
      if (found) {
        return { ...found, avatar: u.avatar, phone: u.phone, is_initialized: true };
      }

      const isChef = u.role === 'chef';
      const defaultFinal = calculateSalaryAmount({
        role: u.role,
        base_salary_type: u.base_salary_type,
        hourly_rate: u.hourly_rate || 20000,
        monthly_base: u.monthly_salary || 12000000,
        regular_hours: isChef ? 208 : 160,
        holiday_hours: 0,
        tet_hours: 0,
        worked_days: isChef ? 26 : 20,
        off_days: 0,
        holiday_days: 0,
        tet_days: 0,
        bonus: 0,
        deductions: 0
      });

      return {
        id: `temp-${u.id}`,
        user_id: u.id,
        user_name: u.full_name,
        role: u.role,
        avatar: u.avatar,
        phone: u.phone,
        month_year: monthYear,
        base_salary_type: u.base_salary_type,
        regular_hours: isChef ? 208 : 160,
        holiday_hours: 0,
        tet_hours: 0,
        worked_days: isChef ? 26 : 20,
        off_days: 0,
        holiday_days: 0,
        tet_days: 0,
        hourly_rate: u.hourly_rate || 20000,
        monthly_base: u.monthly_salary || 12000000,
        bonus: 0,
        deductions: 0,
        final_salary: defaultFinal,
        status: 'pending',
        notes: 'Chưa chốt sổ tháng',
        is_initialized: false
      };
    });

    const totalPayrollFund = mergedList.reduce((sum, item) => sum + parseFloat(item.final_salary || 0), 0);
    const paidAmount = mergedList.filter((item) => item.status === 'paid').reduce((sum, item) => sum + parseFloat(item.final_salary || 0), 0);

    return res.json({
      success: true,
      data: {
        month_year: monthYear,
        is_current_month: monthYear === currentMonthYear,
        summary: {
          total_staff_count: users.length,
          total_payroll_fund: totalPayrollFund,
          paid_amount: paidAmount,
          pending_amount: totalPayrollFund - paidAmount,
          total_hours: 0,
          total_cancellations_count: cancellations.length,
          total_cancelled_loss: 0
        },
        payrolls: mergedList
      }
    });
  } catch (err) {
    next(err);
  }
};

// 2. Initialize Payroll for a whole month
const initializeMonthPayroll = async (req, res, next) => {
  try {
    const { month_year } = req.body;
    if (!month_year) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tháng cần khởi tạo (YYYY-MM)' });
    }

    if (isMySQL()) {
      const pool = getPool();
      const [users] = await pool.query(
        "SELECT id, full_name, role, base_salary_type, hourly_rate, monthly_salary, standard_work_days FROM users WHERE role IN ('staff', 'chef') AND status = 'active'"
      );

      for (const u of users) {
        const isChef = u.role === 'chef';
        const regularHours = isChef ? 208 : 160;
        const workedDays = isChef ? 26 : 22;
        const offDays = isChef ? 0 : 4;

        const finalSalary = calculateSalaryAmount({
          role: u.role,
          base_salary_type: u.base_salary_type,
          hourly_rate: u.hourly_rate || 20000,
          monthly_base: u.monthly_salary || 12000000,
          regular_hours: regularHours,
          holiday_hours: 0,
          tet_hours: 0,
          worked_days: workedDays,
          off_days: offDays,
          holiday_days: 0,
          tet_days: 0,
          bonus: 0,
          deductions: 0
        });

        await pool.query(
          `INSERT INTO payroll_records (
            user_id, user_name, role, month_year, base_salary_type,
            regular_hours, holiday_hours, tet_hours, worked_days, off_days, holiday_days, tet_days,
            hourly_rate, monthly_base, bonus, deductions, final_salary, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'Khởi tạo đầu tháng')
          ON DUPLICATE KEY UPDATE
            final_salary = VALUES(final_salary),
            regular_hours = VALUES(regular_hours),
            worked_days = VALUES(worked_days),
            off_days = VALUES(off_days),
            hourly_rate = VALUES(hourly_rate),
            monthly_base = VALUES(monthly_base),
            notes = VALUES(notes)`,
          [
            u.id, u.full_name, u.role, month_year, u.base_salary_type,
            regularHours, 0, 0, workedDays, offDays, 0, 0,
            u.hourly_rate || 20000, u.monthly_salary || 12000000, 0, 0, finalSalary
          ]
        );
      }

      return res.json({
        success: true,
        message: `Đã khởi tạo bảng chấm công & lương tháng ${month_year} thành công cho ${users.length} nhân sự!`
      });
    }

    return res.json({ success: true, message: `Đã khởi tạo bảng lương tháng ${month_year}!` });
  } catch (err) {
    next(err);
  }
};

// 3. Calculate and Save/Update single payroll record
const calculatePayroll = async (req, res, next) => {
  try {
    const {
      user_id,
      month_year,
      regular_hours = 0,
      holiday_hours = 0,
      tet_hours = 0,
      worked_days = 0,
      off_days = 0,
      holiday_days = 0,
      tet_days = 0,
      bonus = 0,
      deductions = 0,
      status = 'pending',
      notes = ''
    } = req.body;

    if (!user_id || !month_year) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin nhân viên hoặc tháng tính lương' });
    }

    if (isMySQL()) {
      const pool = getPool();
      const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);
      if (userRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin nhân viên' });
      }

      const user = userRows[0];
      const finalSalary = calculateSalaryAmount({
        role: user.role,
        base_salary_type: user.base_salary_type,
        hourly_rate: user.hourly_rate,
        monthly_base: user.monthly_salary,
        regular_hours,
        holiday_hours,
        tet_hours,
        worked_days,
        off_days,
        holiday_days,
        tet_days,
        bonus,
        deductions
      });

      await pool.query(
        `INSERT INTO payroll_records (
          user_id, user_name, role, month_year, base_salary_type,
          regular_hours, holiday_hours, tet_hours, worked_days, off_days, holiday_days, tet_days,
          hourly_rate, monthly_base, bonus, deductions, final_salary, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          regular_hours = VALUES(regular_hours),
          holiday_hours = VALUES(holiday_hours),
          tet_hours = VALUES(tet_hours),
          worked_days = VALUES(worked_days),
          off_days = VALUES(off_days),
          holiday_days = VALUES(holiday_days),
          tet_days = VALUES(tet_days),
          bonus = VALUES(bonus),
          deductions = VALUES(deductions),
          final_salary = VALUES(final_salary),
          status = VALUES(status),
          notes = VALUES(notes)`,
        [
          user.id, user.full_name, user.role, month_year, user.base_salary_type,
          regular_hours, holiday_hours, tet_hours, worked_days, off_days, holiday_days, tet_days,
          user.hourly_rate, user.monthly_salary, bonus, deductions, finalSalary, status, notes
        ]
      );

      return res.json({
        success: true,
        message: `Đã tính lại lương tháng ${month_year} cho ${user.full_name}: ${new Intl.NumberFormat('vi-VN').format(finalSalary)} đ`,
        data: {
          user_id,
          user_name: user.full_name,
          month_year,
          final_salary: finalSalary,
          status
        }
      });
    }

    // In-memory fallback
    const store = getMemoryStore();
    const user = store.users.find((u) => u.id === parseInt(user_id));
    if (!user) return res.status(404).json({ success: false, message: 'Nhân viên không tồn tại' });

    const finalSalary = calculateSalaryAmount({
      role: user.role,
      base_salary_type: user.base_salary_type,
      hourly_rate: user.hourly_rate,
      monthly_base: user.monthly_salary,
      regular_hours,
      holiday_hours,
      tet_hours,
      worked_days,
      off_days,
      holiday_days,
      tet_days,
      bonus,
      deductions
    });

    const existingIdx = store.payrolls.findIndex((p) => p.user_id === parseInt(user_id) && p.month_year === month_year);
    const newRecord = {
      id: existingIdx >= 0 ? store.payrolls[existingIdx].id : store.payrolls.length + 1,
      user_id: user.id,
      user_name: user.full_name,
      role: user.role,
      month_year,
      base_salary_type: user.base_salary_type,
      regular_hours: parseFloat(regular_hours),
      holiday_hours: parseFloat(holiday_hours),
      tet_hours: parseFloat(tet_hours),
      worked_days: parseInt(worked_days),
      off_days: parseInt(off_days),
      holiday_days: parseInt(holiday_days),
      tet_days: parseInt(tet_days),
      hourly_rate: user.hourly_rate,
      monthly_base: user.monthly_salary,
      bonus: parseFloat(bonus),
      deductions: parseFloat(deductions),
      final_salary: finalSalary,
      status,
      notes
    };

    if (existingIdx >= 0) {
      store.payrolls[existingIdx] = newRecord;
    } else {
      store.payrolls.push(newRecord);
    }

    return res.json({
      success: true,
      message: `Đã tính lương tháng ${month_year} cho ${user.full_name}: ${finalSalary.toLocaleString('vi-VN')} đ`,
      data: newRecord
    });
  } catch (err) {
    next(err);
  }
};

// 4. Update Status (paid / pending)
const updatePayrollStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (isMySQL()) {
      const pool = getPool();
      await pool.query('UPDATE payroll_records SET status = ? WHERE id = ?', [status, id]);
      return res.json({ success: true, message: `Đã đổi trạng thái phiếu lương thành ${status === 'paid' ? 'Đã chi' : 'Chờ duyệt chi'}` });
    }

    const store = getMemoryStore();
    const p = store.payrolls.find((r) => r.id === parseInt(id));
    if (p) p.status = status;

    return res.json({ success: true, message: 'Đã cập nhật trạng thái phiếu lương' });
  } catch (err) {
    next(err);
  }
};

// 5. Staff & Chef Detailed Performance & Incident Dossier
const getStaffPerformanceSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthYear = req.query.month_year || currentMonthYear;

    if (isMySQL()) {
      const pool = getPool();

      // Get all staff and chefs
      const [users] = await pool.query(
        "SELECT id, username, full_name, role, phone, avatar, base_salary_type, hourly_rate, monthly_salary FROM users WHERE role IN ('staff', 'chef') AND status = 'active'"
      );

      // Get payroll for this month
      const [payrolls] = await pool.query(
        'SELECT * FROM payroll_records WHERE month_year = ?',
        [monthYear]
      );

      // Get cancellations for this month
      const [cancellations] = await pool.query(
        "SELECT * FROM cancelled_order_items WHERE DATE_FORMAT(cancelled_at, '%Y-%m') = ?",
        [monthYear]
      );

      // Build performance summary per user
      const performanceList = users.map((u) => {
        const pr = payrolls.find((p) => p.user_id === u.id);

        // Find incidents responsible by or cancelled by this user
        const userIncidents = cancellations.filter(
          (c) => c.responsible_user_id === u.id || (c.responsible_user_name && c.responsible_user_name.includes(u.full_name)) || c.cancelled_by === u.full_name
        );

        const totalIncidentLoss = userIncidents.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);
        const cancelCount = userIncidents.filter((i) => i.action_type === 'cancel' || !i.action_type).length;
        const changeCount = userIncidents.filter((i) => i.action_type === 'change_dish').length;

        return {
          user_id: u.id,
          user_name: u.full_name,
          role: u.role,
          avatar: u.avatar,
          phone: u.phone,
          month_year: monthYear,
          // Attendance summary
          regular_hours: pr ? pr.regular_hours : (u.role === 'chef' ? 208 : 160),
          holiday_hours: pr ? pr.holiday_hours : 0,
          tet_hours: pr ? pr.tet_hours : 0,
          worked_days: pr ? pr.worked_days : (u.role === 'chef' ? 26 : 22),
          off_days: pr ? pr.off_days : (u.role === 'chef' ? 0 : 4),
          final_salary: pr ? pr.final_salary : 0,
          salary_status: pr ? pr.status : 'pending',
          // Incident tracking
          total_incidents: userIncidents.length,
          cancel_count: cancelCount,
          change_count: changeCount,
          total_incident_loss: totalIncidentLoss,
          incidents: userIncidents
        };
      });

      return res.json({
        success: true,
        data: {
          month_year: monthYear,
          performance_list: performanceList
        }
      });
    }

    // In-memory fallback
    const store = getMemoryStore();
    const users = (store.users || []).filter((u) => ['staff', 'chef'].includes(u.role) && u.status === 'active');
    const payrolls = (store.payrolls || []).filter((p) => p.month_year === monthYear);
    const cancellations = (store.cancelledItems || []).filter((c) => (c.cancelled_at || '').startsWith(monthYear));

    const performanceList = users.map((u) => {
      const pr = payrolls.find((p) => p.user_id === u.id);
      const userIncidents = cancellations.filter((c) => c.responsible_user_id === u.id || c.cancelled_by === u.full_name);
      const totalIncidentLoss = userIncidents.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);

      return {
        user_id: u.id,
        user_name: u.full_name,
        role: u.role,
        avatar: u.avatar,
        phone: u.phone,
        month_year: monthYear,
        regular_hours: pr ? pr.regular_hours : 160,
        holiday_hours: pr ? pr.holiday_hours : 0,
        tet_hours: pr ? pr.tet_hours : 0,
        worked_days: pr ? pr.worked_days : 22,
        off_days: pr ? pr.off_days : 4,
        final_salary: pr ? pr.final_salary : 0,
        salary_status: pr ? pr.status : 'pending',
        total_incidents: userIncidents.length,
        cancel_count: userIncidents.length,
        change_count: 0,
        total_incident_loss: totalIncidentLoss,
        incidents: userIncidents
      };
    });

    return res.json({
      success: true,
      data: {
        month_year: monthYear,
        performance_list: performanceList
      }
    });
  } catch (err) {
    next(err);
  }
};

// 6. Get Available Historical Payroll Months
const getAvailablePayrollMonths = async (req, res, next) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Generate array of 12 recent months
    const availableMonths = [];
    for (let i = 0; i < 8; i++) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      availableMonths.push({
        month_year: ym,
        display_label: `Tháng ${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
        is_current: i === 0
      });
    }

    return res.json({
      success: true,
      data: availableMonths
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMonthlyPayroll,
  initializeMonthPayroll,
  calculatePayroll,
  updatePayrollStatus,
  getStaffPerformanceSummary,
  getAvailablePayrollMonths
};
