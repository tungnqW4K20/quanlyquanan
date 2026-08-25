import React, { useState, useEffect } from 'react';
import {
  BadgeDollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Printer,
  Edit3,
  Flame,
  ChefHat,
  UserCheck,
  ShieldCheck,
  FileText,
  FileX,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import SearchableSelect from '../components/common/SearchableSelect';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const PayrollPage = () => {
  const now = new Date();
  const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear);
  const [payrollData, setPayrollData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [activeTab, setActiveTab] = useState('payroll'); // 'payroll' | 'performance'
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit / Calculate Modal
  const [editingUser, setEditingUser] = useState(null);
  const [regularHours, setRegularHours] = useState(160);
  const [holidayHours, setHolidayHours] = useState(0);
  const [tetHours, setTetHours] = useState(0);
  const [workedDays, setWorkedDays] = useState(26);
  const [offDays, setOffDays] = useState(0);
  const [holidayDays, setHolidayDays] = useState(0);
  const [tetDays, setTetDays] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Payslip Modal
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Incident detail modal for staff/chef
  const [selectedIncidentStaff, setSelectedIncidentStaff] = useState(null);

  const { addToast } = useToast();

  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    fetchPayrollForMonth(selectedMonth);
    fetchPerformanceForMonth(selectedMonth);
  }, [selectedMonth]);

  const fetchAvailableMonths = async () => {
    try {
      const res = await api.get('/payroll/available-months');
      if (res.success && res.data) {
        setAvailableMonths(res.data);
      }
    } catch (err) {
      // fallback
    }
  };

  const fetchPayrollForMonth = async (month) => {
    setLoading(true);
    try {
      const res = await api.get(`/payroll?month_year=${month}`);
      if (res.success && res.data) {
        setPayrollData(res.data);
      }
    } catch (err) {
      addToast('Không thể tải bảng lương tháng đã chọn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceForMonth = async (month) => {
    try {
      const res = await api.get(`/payroll/performance-summary?month_year=${month}`);
      if (res.success && res.data) {
        setPerformanceData(res.data.performance_list || []);
      }
    } catch (err) {
      // ignore
    }
  };

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prevMonthStr);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextMonthStr);
  };

  const handleInitializeMonth = async () => {
    try {
      const res = await api.post('/payroll/initialize-month', { month_year: selectedMonth });
      if (res.success) {
        addToast(res.message || 'Khởi tạo bảng lương tháng thành công!', 'success');
        fetchPayrollForMonth(selectedMonth);
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi khởi tạo tháng', 'error');
    }
  };

  const handleOpenEdit = (record) => {
    setEditingUser(record);
    setRegularHours(record.regular_hours || (record.role === 'chef' ? 208 : 160));
    setHolidayHours(record.holiday_hours || 0);
    setTetHours(record.tet_hours || 0);
    setWorkedDays(record.worked_days || (record.role === 'chef' ? 26 : 22));
    setOffDays(record.off_days || (record.role === 'chef' ? 0 : 4));
    setHolidayDays(record.holiday_days || 0);
    setTetDays(record.tet_days || 0);
    setBonus(record.bonus || 0);
    setDeductions(record.deductions || 0);
    setNotes(record.notes || '');
  };

  const handleSaveCalculate = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    try {
      const payload = {
        user_id: editingUser.user_id,
        month_year: selectedMonth,
        regular_hours: parseFloat(regularHours) || 0,
        holiday_hours: parseFloat(holidayHours) || 0,
        tet_hours: parseFloat(tetHours) || 0,
        worked_days: parseInt(workedDays) || 0,
        off_days: parseInt(offDays) || 0,
        holiday_days: parseInt(holidayDays) || 0,
        tet_days: parseInt(tetDays) || 0,
        bonus: parseFloat(bonus) || 0,
        deductions: parseFloat(deductions) || 0,
        status: editingUser.status || 'pending',
        notes
      };

      const res = await api.post('/payroll/calculate', payload);
      if (res.success) {
        addToast(res.message || 'Cập nhật và tính lương thành công!', 'success');
        setEditingUser(null);
        fetchPayrollForMonth(selectedMonth);
        fetchPerformanceForMonth(selectedMonth);
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi lưu lương', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (record) => {
    const newStatus = record.status === 'paid' ? 'pending' : 'paid';
    try {
      const res = await api.patch(`/payroll/${record.id}/status`, { status: newStatus });
      if (res.success) {
        addToast(res.message || 'Cập nhật trạng thái phiếu lương thành công!', 'success');
        fetchPayrollForMonth(selectedMonth);
      }
    } catch (err) {
      addToast(err.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  // Preview live math in modal
  const previewSalary = () => {
    if (!editingUser) return 0;
    if (editingUser.role === 'chef') {
      const base = 12000000;
      const dailyRate = base / 26;
      const afterOff = base - (dailyRate * (parseFloat(offDays) || 0));
      const holPay = dailyRate * (parseFloat(holidayDays) || 0);
      const tetPay = dailyRate * 2 * (parseFloat(tetDays) || 0);
      return Math.max(0, Math.round(afterOff + holPay + tetPay + (parseFloat(bonus) || 0) - (parseFloat(deductions) || 0)));
    } else {
      const rate = 20000;
      const reg = (parseFloat(regularHours) || 0) * rate;
      const hol = (parseFloat(holidayHours) || 0) * (rate * 2);
      const tet = (parseFloat(tetHours) || 0) * (rate * 3);
      return Math.max(0, Math.round(reg + hol + tet + (parseFloat(bonus) || 0) - (parseFloat(deductions) || 0)));
    }
  };

  const filteredPayrolls = (payrollData?.payrolls || []).filter((p) => {
    const matchRole = roleFilter === 'all' || p.role === roleFilter;
    const matchSearch = p.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

  const filteredPerformance = performanceData.filter((p) => {
    const matchRole = roleFilter === 'all' || p.role === roleFilter;
    const matchSearch = p.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

  const summary = payrollData?.summary;

  return (
    <div className="space-y-6">
      {/* 1. Header & Month Selector Toolbar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-dark-850 to-orange-500/15 border border-amber-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Quản Trị Nhân Sự & Lương Bổng
            </span>
            {selectedMonth === currentMonthYear && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Tháng Hiện Tại
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 mt-1">
            Bảng Lương Động & Thống Kê Đi Làm, Hủy Món
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Lương tính theo giờ (20k/h, Lễ x2, Tết x3) & Lương cứng đầu bếp (12tr/tháng - ngày nghỉ + Lễ/Tết)
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-dark-900 border border-dark-700 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              title="Tháng trước"
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-dark-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="w-48 px-1">
              <SearchableSelect
                options={availableMonths.map((m) => ({
                  value: m.month_year,
                  label: `${m.display_label}${m.is_current ? ' (Hiện tại)' : ''}`
                }))}
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(val)}
                placeholder="Chọn tháng..."
                className="text-xs"
              />
            </div>

            <button
              onClick={handleNextMonth}
              title="Tháng sau"
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-dark-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={PlusCircle}
            onClick={handleInitializeMonth}
            title="Khởi tạo hoặc cập nhật danh sách toàn bộ nhân sự vào tháng này"
          >
            Chốt Sổ Tháng Này
          </Button>
        </div>
      </div>

      {/* 2. Monthly Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-dark-850 border border-amber-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Tổng Quỹ Lương</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <BadgeDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-extrabold text-amber-400">
              {formatPrice(summary?.total_payroll_fund || 0)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{summary?.total_staff_count || 0} nhân sự</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-850 border border-emerald-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Đã Chi Trả</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-extrabold text-emerald-400">
              {formatPrice(summary?.paid_amount || 0)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Đã giải ngân</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-850 border border-orange-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Chờ Duyệt Chi</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-extrabold text-orange-400">
              {formatPrice(summary?.pending_amount || 0)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Cần thanh toán</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-850 border border-blue-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Tổng Giờ Công</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-extrabold text-blue-400">
              {summary?.total_hours || 0} giờ
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Toàn bộ ca làm</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-850 border border-rose-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Sự Cố Hủy/Đổi</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <FileX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-extrabold text-rose-400">
              {summary?.total_cancellations_count || 0} vụ
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Hủy hoặc đổi món</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-850 border border-red-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Thất Thoát Món</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-extrabold text-red-400">
              {formatPrice(summary?.total_cancelled_loss || 0)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Tổng giá trị món hủy</p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs & Filters */}
      <div className="p-4 rounded-2xl bg-dark-850 border border-dark-700/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Main Tab Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'payroll'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-dark-950 shadow-md shadow-amber-500/20'
                : 'bg-dark-900 text-slate-400 border border-dark-700 hover:border-amber-500/30'
            }`}
          >
            <BadgeDollarSign className="w-4 h-4" />
            <span>Bảng Tính Lương Tháng ({filteredPayrolls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'performance'
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-dark-900 text-slate-400 border border-dark-700 hover:border-orange-500/30'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Thống Kê Đi Làm & Hủy/Đổi Món Theo Nhân Sự</span>
          </button>
        </div>

        {/* Search & Role Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên nhân sự..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-dark-900 border border-dark-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 w-48"
            />
          </div>

          <div className="flex items-center bg-dark-900 border border-dark-700 rounded-xl p-1 text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                roleFilter === 'all' ? 'bg-dark-750 text-amber-400' : 'text-slate-400'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setRoleFilter('staff')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                roleFilter === 'staff' ? 'bg-dark-750 text-amber-400' : 'text-slate-400'
              }`}
            >
              Phục vụ
            </button>
            <button
              onClick={() => setRoleFilter('chef')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                roleFilter === 'chef' ? 'bg-dark-750 text-amber-400' : 'text-slate-400'
              }`}
            >
              Đầu bếp
            </button>
          </div>
        </div>
      </div>

      {/* 4. CONTENT TAB 1: PAYROLL LIST */}
      {activeTab === 'payroll' && (
        <div className="rounded-2xl bg-dark-850 border border-dark-700/80 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 animate-pulse">Đang tải bảng lương...</div>
          ) : filteredPayrolls.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <BadgeDollarSign className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-300">Không tìm thấy dữ liệu lương tháng này</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={handleInitializeMonth}>
                Khởi tạo bảng lương tháng {selectedMonth}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-900/80 border-b border-dark-700 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Nhân sự</th>
                    <th className="px-4 py-3.5">Vị trí / Cơ chế lương</th>
                    <th className="px-4 py-3.5 text-center">Giờ làm / Ngày công</th>
                    <th className="px-4 py-3.5 text-center">Nghỉ / Lễ / Tết</th>
                    <th className="px-4 py-3.5 text-right">Thưởng / Phạt</th>
                    <th className="px-4 py-3.5 text-right">Thực Lĩnh</th>
                    <th className="px-4 py-3.5 text-center">Trạng thái</th>
                    <th className="px-4 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/60">
                  {filteredPayrolls.map((p) => {
                    const isChef = p.role === 'chef';
                    const isPaid = p.status === 'paid';

                    return (
                      <tr key={p.id || p.user_id} className="hover:bg-dark-800/50 transition-colors">
                        {/* 1. Name & Avatar */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                p.avatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                              }
                              alt={p.user_name}
                              className="w-9 h-9 rounded-xl object-cover border border-dark-700 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-100">{p.user_name}</p>
                              <p className="text-[11px] text-slate-400">{p.phone || '0901.xxx.xxx'}</p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Role & Salary Mechanism */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isChef
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                              }`}
                            >
                              {isChef ? <ChefHat className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                              <span>{isChef ? 'Đầu Bếp' : 'Phục Vụ / Thu Ngân'}</span>
                            </span>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {isChef ? '12.000.000 đ/tháng (26 ngày)' : '20.000 đ/giờ'}
                            </p>
                          </div>
                        </td>

                        {/* 3. Hours / Work Days */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="font-bold text-slate-200">
                            {isChef ? `${p.worked_days} ngày làm` : `${p.regular_hours} giờ thường`}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {isChef ? 'Chuẩn: 26 ngày' : `~${(parseFloat(p.regular_hours || 0) / 8).toFixed(1)} ca`}
                          </div>
                        </td>

                        {/* 4. Off / Holiday / Tet */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {isChef ? (
                              <>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    p.off_days > 0 ? 'bg-red-500/20 text-red-400' : 'bg-dark-800 text-slate-400'
                                  }`}
                                >
                                  Nghỉ: {p.off_days} ngày
                                </span>
                                {p.holiday_days > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                                    Lễ x2: {p.holiday_days} ngày
                                  </span>
                                )}
                                {p.tet_days > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                                    Tết x3: {p.tet_days} ngày
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-dark-800 text-slate-400">
                                  Nghỉ: {p.off_days || 0} ngày
                                </span>
                                {p.holiday_hours > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                                    Lễ x2: {p.holiday_hours}h
                                  </span>
                                )}
                                {p.tet_hours > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                                    Tết x3: {p.tet_hours}h
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* 5. Bonus & Deductions */}
                        <td className="px-4 py-3.5 text-right font-mono text-[11px]">
                          {p.bonus > 0 && <div className="text-emerald-400 font-bold">+{formatPrice(p.bonus)}</div>}
                          {p.deductions > 0 && <div className="text-red-400">-{formatPrice(p.deductions)}</div>}
                          {(!p.bonus || p.bonus == 0) && (!p.deductions || p.deductions == 0) && (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* 6. Final Salary */}
                        <td className="px-4 py-3.5 text-right font-mono font-extrabold text-sm text-amber-400">
                          {formatPrice(p.final_salary)}
                        </td>

                        {/* 7. Status */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all ${
                              isPaid
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25'
                            }`}
                          >
                            {isPaid ? '✓ Đã Chi Lương' : '⏳ Chờ Duyệt Chi'}
                          </button>
                        </td>

                        {/* 8. Actions */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              title="Chấm công & Điều chỉnh giờ/ngày/thưởng phạt"
                              className="p-1.5 rounded-lg bg-dark-900 border border-dark-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedPayslip(p)}
                              title="Xem & In phiếu lương cá nhân"
                              className="p-1.5 rounded-lg bg-dark-900 border border-dark-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. CONTENT TAB 2: STAFF & CHEF INCIDENT & PERFORMANCE AUDIT */}
      {activeTab === 'performance' && (
        <div className="rounded-2xl bg-dark-850 border border-dark-700/80 overflow-hidden">
          <div className="p-4 bg-dark-900/60 border-b border-dark-700 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Thống Kê Đi Làm & Tình Trạng Báo Hủy / Đổi Món Tháng {selectedMonth}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bảng theo dõi số giờ công, sự cố hủy món, đổi món của từng đầu bếp và phục vụ
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchPerformanceForMonth(selectedMonth)}
            >
              Làm mới
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900/80 border-b border-dark-700 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Nhân sự</th>
                  <th className="px-4 py-3.5">Vai trò</th>
                  <th className="px-4 py-3.5 text-center">Chấm công tháng</th>
                  <th className="px-4 py-3.5 text-center">Tổng số vụ hủy/đổi</th>
                  <th className="px-4 py-3.5 text-center">Hủy món</th>
                  <th className="px-4 py-3.5 text-center">Đổi món</th>
                  <th className="px-4 py-3.5 text-right">Tổng giá trị thất thoát</th>
                  <th className="px-4 py-3.5 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/60">
                {filteredPerformance.map((item) => {
                  const isChef = item.role === 'chef';
                  const hasIncidents = item.total_incidents > 0;

                  return (
                    <tr key={item.user_id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              item.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                            }
                            alt={item.user_name}
                            className="w-9 h-9 rounded-xl object-cover border border-dark-700 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-100">{item.user_name}</p>
                            <p className="text-[11px] text-slate-400">{item.phone || '0901.xxx.xxx'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isChef
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                          }`}
                        >
                          {isChef ? <ChefHat className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          <span>{isChef ? 'Đầu Bếp' : 'Phục Vụ'}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="font-bold text-slate-200">
                          {isChef ? `${item.worked_days} ngày công` : `${item.regular_hours} giờ`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Nghỉ: {item.off_days || 0} ngày • Lễ: {item.holiday_hours ? `${item.holiday_hours}h` : '0'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-extrabold text-[11px] ${
                            hasIncidents ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {item.total_incidents} vụ
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-300">
                        {item.cancel_count} món
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-300">
                        {item.change_count} món
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-extrabold text-rose-400">
                        {formatPrice(item.total_incident_loss)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedIncidentStaff(item)}
                          disabled={!hasIncidents}
                        >
                          Xem sự cố ({item.total_incidents})
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MODAL: EDIT / CALCULATE PAYROLL */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Chấm Công & Tính Lương: ${editingUser.user_name} (Tháng ${selectedMonth})`}
          icon={SlidersHorizontal}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveCalculate} className="space-y-4">
            <div className="p-3 rounded-xl bg-dark-900 border border-dark-700 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Vị trí:</span>
                <span className="font-bold text-slate-200 ml-1.5">
                  {editingUser.role === 'chef' ? 'Đầu Bếp (Lương 12tr/tháng)' : 'Phục Vụ / Thu Ngân (20.000 đ/giờ)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Tháng:</span>
                <span className="font-bold text-amber-400 ml-1.5">{selectedMonth}</span>
              </div>
            </div>

            {editingUser.role === 'chef' ? (
              /* Chef calculation inputs */
              <div className="space-y-3 p-3.5 rounded-xl bg-dark-900/60 border border-dark-700">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Chấm công Đầu Bếp (Chuẩn 26 ngày công / tháng)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Số ngày làm</label>
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={workedDays}
                      onChange={(e) => setWorkedDays(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-red-400 font-medium mb-1">Số ngày nghỉ (trừ lương)</label>
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={offDays}
                      onChange={(e) => setOffDays(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-900 border border-red-500/40 rounded-xl text-red-400 font-bold focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-amber-400 font-medium mb-1">Ngày Lễ (x2 lương)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={holidayDays}
                      onChange={(e) => setHolidayDays(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-rose-400 font-medium mb-1">Ngày Tết (x3 lương)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={tetDays}
                      onChange={(e) => setTetDays(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Staff calculation inputs */
              <div className="space-y-3 p-3.5 rounded-xl bg-dark-900/60 border border-dark-700">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Chấm giờ làm việc (Đơn giá 20.000 đ/h)
                </h4>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Giờ ngày thường (20k/h)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={regularHours}
                      onChange={(e) => setRegularHours(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-amber-400 font-medium mb-1">Giờ ngày Lễ (x2 = 40k/h)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={holidayHours}
                      onChange={(e) => setHolidayHours(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-900 border border-amber-500/40 rounded-xl text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-rose-400 font-medium mb-1">Giờ ngày Tết (x3 = 60k/h)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={tetHours}
                      onChange={(e) => setTetHours(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-900 border border-rose-500/40 rounded-xl text-rose-300 font-bold focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bonus & Deductions */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-emerald-400 font-bold mb-1">Tiền thưởng thêm (VNĐ)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-900 border border-emerald-500/30 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-red-400 font-bold mb-1">Khoản trừ phạt (VNĐ)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-900 border border-red-500/30 rounded-xl text-red-400 font-mono font-bold focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold text-xs mb-1">Ghi chú bảng lương</label>
              <input
                type="text"
                placeholder="Lý do thưởng/phạt hoặc tăng ca..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Live Result Preview */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300">Tổng Lương Dự Kiến Thực Lĩnh:</span>
                <p className="text-[11px] text-amber-400 mt-0.5">Tự động áp dụng công thức theo quy định</p>
              </div>
              <span className="text-xl font-extrabold text-amber-400 font-mono">
                {formatPrice(previewSalary())}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-dark-700">
              <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)} disabled={saving}>
                Đóng
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={saving}>
                Lưu & Chốt Lương
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. MODAL: INDIVIDUAL PAYSLIP PRINT PREVIEW */}
      {selectedPayslip && (
        <Modal
          isOpen={!!selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
          title={`Phiếu Lương Cá Nhân - ${selectedPayslip.user_name}`}
          icon={FileText}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            {/* Printable Receipt Layout */}
            <div
              id="printable-payslip"
              className="p-5 rounded-2xl bg-white text-slate-900 font-sans shadow-xl border border-slate-200 text-xs space-y-3.5"
            >
              {/* Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
                  HOÀNG GIA QUÁN
                </h3>
                <p className="text-[11px] text-slate-600 font-medium">HỆ THỐNG QUẢN LÝ ẨM THỰC</p>
                <div className="inline-block mt-2 px-3 py-1 bg-slate-100 rounded-full font-bold text-xs uppercase tracking-wide text-slate-800">
                  PHIẾU LƯƠNG THÁNG {selectedPayslip.month_year}
                </div>
              </div>

              {/* Employee Info */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Họ và tên:</span>
                  <span className="font-extrabold text-slate-900">{selectedPayslip.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vị trí:</span>
                  <span className="font-bold text-slate-800">
                    {selectedPayslip.role === 'chef' ? 'Đầu Bếp' : 'Nhân Viên Phục Vụ / Thu Ngân'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kỳ trả lương:</span>
                  <span className="font-medium text-slate-700">Tháng {selectedPayslip.month_year}</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="border-t border-b border-dashed border-slate-300 py-2.5 space-y-1.5 text-[11px]">
                {selectedPayslip.role === 'chef' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Lương cơ bản (26 ngày):</span>
                      <span className="font-semibold text-slate-900">12.000.000 đ</span>
                    </div>
                    {selectedPayslip.off_days > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Trừ ngày nghỉ ({selectedPayslip.off_days} ngày):</span>
                        <span>
                          -{formatPrice((12000000 / 26) * selectedPayslip.off_days)}
                        </span>
                      </div>
                    )}
                    {selectedPayslip.holiday_days > 0 && (
                      <div className="flex justify-between text-amber-700 font-semibold">
                        <span>Phụ cấp Ngày Lễ (x2, {selectedPayslip.holiday_days} ngày):</span>
                        <span>
                          +{formatPrice((12000000 / 26) * selectedPayslip.holiday_days)}
                        </span>
                      </div>
                    )}
                    {selectedPayslip.tet_days > 0 && (
                      <div className="flex justify-between text-rose-700 font-semibold">
                        <span>Phụ cấp Ngày Tết (x3, {selectedPayslip.tet_days} ngày):</span>
                        <span>
                          +{formatPrice((12000000 / 26) * 2 * selectedPayslip.tet_days)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Giờ thường ({selectedPayslip.regular_hours}h x 20.000đ):</span>
                      <span className="font-semibold text-slate-900">
                        {formatPrice((selectedPayslip.regular_hours || 0) * 20000)}
                      </span>
                    </div>
                    {selectedPayslip.holiday_hours > 0 && (
                      <div className="flex justify-between text-amber-700 font-semibold">
                        <span>Giờ Ngày Lễ ({selectedPayslip.holiday_hours}h x 40.000đ):</span>
                        <span>
                          +{formatPrice((selectedPayslip.holiday_hours || 0) * 40000)}
                        </span>
                      </div>
                    )}
                    {selectedPayslip.tet_hours > 0 && (
                      <div className="flex justify-between text-rose-700 font-semibold">
                        <span>Giờ Ngày Tết ({selectedPayslip.tet_hours}h x 60.000đ):</span>
                        <span>
                          +{formatPrice((selectedPayslip.tet_hours || 0) * 60000)}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {selectedPayslip.bonus > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Thưởng thành tích / Tăng ca:</span>
                    <span>+{formatPrice(selectedPayslip.bonus)}</span>
                  </div>
                )}

                {selectedPayslip.deductions > 0 && (
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>Khoản khấu trừ / Phạt:</span>
                    <span>-{formatPrice(selectedPayslip.deductions)}</span>
                  </div>
                )}
              </div>

              {/* Total Final */}
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-extrabold text-sm text-slate-900">THỰC LĨNH:</span>
                <span className="text-base font-extrabold text-amber-600 font-mono">
                  {formatPrice(selectedPayslip.final_salary)}
                </span>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 text-center text-[10px] text-slate-600">
                <div>
                  <p className="font-bold text-slate-800">Người lập phiếu</p>
                  <p className="mt-8 italic text-slate-400">(Ký & ghi rõ họ tên)</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800">Người nhận lương</p>
                  <p className="mt-8 italic text-slate-400">{selectedPayslip.user_name}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-dark-700">
              <Button variant="ghost" size="sm" onClick={() => setSelectedPayslip(null)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={() => {
                  window.print();
                }}
              >
                In Phiếu Lương
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 8. MODAL: STAFF/CHEF INCIDENT DETAILS */}
      {selectedIncidentStaff && (
        <Modal
          isOpen={!!selectedIncidentStaff}
          onClose={() => setSelectedIncidentStaff(null)}
          title={`Hồ Sơ Sự Cố Hủy / Đổi Món: ${selectedIncidentStaff.user_name}`}
          icon={AlertTriangle}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-dark-900 border border-dark-700 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Nhân sự:</span>
                <span className="font-bold text-slate-200 ml-1.5">{selectedIncidentStaff.user_name}</span>
              </div>
              <div>
                <span className="text-slate-400">Tổng thất thoát:</span>
                <span className="font-extrabold text-rose-400 ml-1.5 font-mono">
                  {formatPrice(selectedIncidentStaff.total_incident_loss)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Danh sách {selectedIncidentStaff.incidents?.length || 0} món bị hủy / đổi trong tháng {selectedMonth}:
              </h4>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {selectedIncidentStaff.incidents?.map((inc, idx) => (
                  <div
                    key={inc.id || idx}
                    className="p-3 rounded-xl bg-dark-900 border border-dark-700/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            inc.action_type === 'change_dish'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {inc.action_type === 'change_dish' ? 'Đổi món' : 'Hủy món'}
                        </span>
                        <span className="font-bold text-slate-100">{inc.dish_name}</span>
                        <span className="text-slate-400 font-mono">x{inc.quantity}</span>
                      </div>
                      <span className="font-bold text-orange-400 font-mono">{formatPrice(inc.total_amount)}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Vị trí: <strong className="text-slate-300">{inc.table_name || 'Bàn ăn'}</strong></span>
                      <span className="font-mono">{new Date(inc.cancelled_at || Date.now()).toLocaleTimeString('vi-VN')}</span>
                    </div>

                    <p className="text-[11px] text-amber-300/90 italic bg-dark-950 p-1.5 rounded-lg border border-dark-800">
                      Lý do: {inc.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-dark-700">
              <Button variant="ghost" size="sm" onClick={() => setSelectedIncidentStaff(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
