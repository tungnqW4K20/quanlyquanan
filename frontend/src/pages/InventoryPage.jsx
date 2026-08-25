import React, { useState, useEffect } from 'react';
import {
  Boxes,
  PackagePlus,
  History,
  AlertTriangle,
  Search,
  Plus,
  Filter,
  DollarSign,
  TrendingDown,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  Truck,
  Calendar,
  User,
  FileSpreadsheet,
  Download,
  ShieldAlert,
  Sparkles,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flame,
  HelpCircle,
  TrendingUp,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import SearchableSelect from '../components/common/SearchableSelect';
import DisposeModal from '../components/inventory/DisposeModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const InventoryPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Current month state
  const currentDate = new Date();
  const defaultMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  // Data states
  const [reportData, setReportData] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [disposalHistory, setDisposalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Tabs: 'report' | 'near_expiry' | 'history' | 'disposals'
  const [activeTab, setActiveTab] = useState('report');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFreshness, setSelectedFreshness] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false);
  const [disposeTargetId, setDisposeTargetId] = useState(null);
  const [editingIngredient, setEditingIngredient] = useState(null);

  // Import form state
  const [importForm, setImportForm] = useState({
    ingredient_id: '',
    quantity: '',
    import_price: '',
    supplier_name: 'Vựa Nông Sản / Thực Phẩm Tươi',
    expiry_date: '',
    batch_number: '',
    notes: ''
  });

  // Ingredient form state
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    unit: 'kg',
    min_stock_alert: 5,
    cost_price: '',
    category: 'Thịt tươi',
    shelf_life_days: 7,
    expiry_date: '',
    storage_condition: 'Ngăn mát 2-4°C'
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch all monthly inventory data
  const fetchMonthlyData = async (month) => {
    setLoading(true);
    try {
      const [reportRes, impRes, dispRes] = await Promise.all([
        api.get(`/inventory/monthly-report?month_year=${month}`),
        api.get('/inventory/import-history'),
        api.get('/inventory/disposals')
      ]);

      if (reportRes.success) {
        setReportData(reportRes.data);
      }
      if (impRes.success) {
        setImportHistory(impRes.data || []);
      }
      if (dispRes.success) {
        setDisposalHistory(dispRes.data || []);
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi tải dữ liệu kho', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData(selectedMonth);
  }, [selectedMonth]);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const availableMonths = [
    { value: '2026-06', label: 'Tháng 06/2026 (Mùa hè)' },
    { value: '2026-07', label: 'Tháng 07/2026 (Cao điểm)' },
    { value: '2026-08', label: 'Tháng 08/2026 (Hiện tại)' },
    { value: '2026-09', label: 'Tháng 09/2026 (Kế hoạch)' },
    { value: '2026-10', label: 'Tháng 10/2026' }
  ];

  const reportItems = reportData?.report_items || [];
  const summary = reportData?.summary || {
    total_import_expense: 0,
    total_consumed_value: 0,
    total_inventory_valuation: 0,
    total_disposed_loss: 0,
    near_expiry_count: 0,
    expired_count: 0
  };

  // Categories list
  const categories = ['all', ...new Set(reportItems.map((i) => i.category).filter(Boolean))];
  const categoryOptions = [
    { value: 'all', label: 'Tất cả nhóm hàng' },
    ...categories.filter((c) => c !== 'all').map((c) => ({ value: c, label: c }))
  ];

  const freshnessOptions = [
    { value: 'all', label: 'Tất cả trạng thái phẩm chất' },
    { value: 'fresh', label: '🟢 Tươi mới / Đạt chuẩn' },
    { value: 'near_expiry', label: '🟡 Sắp hết hạn (≤ 2 ngày - Cần ưu tiên dùng)' },
    { value: 'expired', label: '🔴 Đã quá hạn (Cần tiêu hủy)' }
  ];

  // Filtered ingredients
  const filteredItems = reportItems.filter((ing) => {
    const matchCat = selectedCategory === 'all' || ing.category === selectedCategory;
    const matchFresh = selectedFreshness === 'all' || ing.freshness_status === selectedFreshness;
    const matchSearch = (ing.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ing.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchFresh && matchSearch;
  });

  const nearExpiryItems = reportItems.filter(
    (i) => i.freshness_status === 'near_expiry' || i.freshness_status === 'expired'
  );

  // Ingredient select options for Import modal
  const ingredientSelectOptions = reportItems.map((ing) => ({
    value: ing.id,
    label: `${ing.name} (${ing.unit})`,
    subLabel: `Tồn kho: ${ing.surplus_stock} ${ing.unit} • Giá vốn: ${formatPrice(ing.cost_price)}/${ing.unit}`,
    cost_price: ing.cost_price,
    unit: ing.unit,
    expiry_date: ing.expiry_date
  }));

  // Handle Export Excel (.xlsx)
  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const response = await fetch(`http://localhost:5000/api/inventory/export-excel?month_year=${selectedMonth}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Không thể tải file Excel');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao-Cao-Kho-Hoang-Gia-Quan-Thang-${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      addToast('Xuất báo cáo Excel thành công!', 'success');
    } catch (err) {
      addToast(err.message || 'Lỗi khi xuất file Excel', 'error');
    } finally {
      setExportingExcel(false);
    }
  };

  // Handle Goods Receipt (Import)
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importForm.ingredient_id || !importForm.quantity || parseFloat(importForm.quantity) <= 0) {
      addToast('Vui lòng chọn nguyên liệu và số lượng nhập hợp lệ', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/inventory/import', {
        ...importForm,
        quantity: parseFloat(importForm.quantity),
        import_price: parseFloat(importForm.import_price) || 0
      });

      if (res.success) {
        addToast(res.message || 'Nhập kho thành công!', 'success');
        setIsImportModalOpen(false);
        setImportForm({
          ingredient_id: '',
          quantity: '',
          import_price: '',
          supplier_name: 'Vựa Nông Sản / Thực Phẩm Tươi',
          expiry_date: '',
          batch_number: '',
          notes: ''
        });
        fetchMonthlyData(selectedMonth);
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi nhập kho', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Create or Update Ingredient
  const handleIngredientSubmit = async (e) => {
    e.preventDefault();
    if (!ingredientForm.name.trim() || !ingredientForm.unit.trim()) {
      addToast('Tên nguyên liệu và đơn vị tính là bắt buộc', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingIngredient) {
        const res = await api.put(`/inventory/ingredients/${editingIngredient.id}`, ingredientForm);
        if (res.success) {
          addToast('Cập nhật nguyên liệu thành công!', 'success');
          setIsIngredientModalOpen(false);
          setEditingIngredient(null);
          fetchMonthlyData(selectedMonth);
        }
      } else {
        const res = await api.post('/inventory/ingredients', ingredientForm);
        if (res.success) {
          addToast('Thêm nguyên liệu mới thành công!', 'success');
          setIsIngredientModalOpen(false);
          setIngredientForm({
            name: '',
            unit: 'kg',
            min_stock_alert: 5,
            cost_price: '',
            category: 'Thịt tươi',
            shelf_life_days: 7,
            expiry_date: '',
            storage_condition: 'Ngăn mát 2-4°C'
          });
          fetchMonthlyData(selectedMonth);
        }
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi lưu nguyên liệu', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Disposal Submit
  const handleDisposeSubmit = async (payload) => {
    try {
      const res = await api.post('/inventory/dispose', payload);
      if (res.success) {
        addToast(res.message || 'Đã lập biên bản tiêu hủy!', 'success');
        fetchMonthlyData(selectedMonth);
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi lập biên bản tiêu hủy', 'error');
      throw err;
    }
  };

  const openEditIngredient = (ing) => {
    setEditingIngredient(ing);
    setIngredientForm({
      name: ing.name,
      unit: ing.unit,
      min_stock_alert: ing.min_stock_alert,
      cost_price: ing.cost_price,
      category: ing.category,
      shelf_life_days: ing.shelf_life_days || 7,
      expiry_date: ing.expiry_date ? ing.expiry_date.split('T')[0] : '',
      storage_condition: ing.storage_condition || 'Ngăn mát 2-4°C'
    });
    setIsIngredientModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header with Month Selector & Export Excel */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-5 rounded-3xl border border-amber-500/20 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-neutral-950 shadow-lg shadow-amber-500/20">
            <Boxes className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Quản Lý Kho & Báo Cáo Nguyên Liệu
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Tháng {selectedMonth}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Thống kê Nhập - Xuất - Tồn theo tháng, theo dõi hạn lưu trữ, lập biên bản tiêu hủy & xuất Excel
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center bg-neutral-950/90 border border-neutral-700/80 rounded-2xl p-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="w-48 px-1">
              <SearchableSelect
                options={availableMonths}
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(val)}
                placeholder="Chọn tháng..."
                className="text-xs"
              />
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exportingExcel ? 'Đang xuất Excel...' : 'Xuất File Excel (.xlsx)'}
          </button>

          {/* Add Ingredient Button */}
          <Button
            variant="secondary"
            size="md"
            icon={Plus}
            onClick={() => {
              setEditingIngredient(null);
              setIngredientForm({
                name: '',
                unit: 'kg',
                min_stock_alert: 5,
                cost_price: '',
                category: 'Thịt tươi',
                shelf_life_days: 7,
                expiry_date: '',
                storage_condition: 'Ngăn mát 2-4°C'
              });
              setIsIngredientModalOpen(true);
            }}
          >
            Thêm Nguyên Liệu
          </Button>

          {/* Import Goods Button */}
          <Button
            variant="primary"
            size="md"
            icon={PackagePlus}
            onClick={() => setIsImportModalOpen(true)}
          >
            Nhập Kho Hàng
          </Button>
        </div>
      </div>

      {/* 6 Monthly KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Import Expense */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800/90 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Tổng Mua Trong Tháng</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-amber-400 mt-2 truncate">
            {formatPrice(summary.total_import_expense)}
          </p>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">Chi phí nhập hàng tháng {selectedMonth}</span>
        </div>

        {/* 2. Kitchen Consumed */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800/90 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Đã Nấu Phục Vụ</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-blue-400 mt-2 truncate">
            {formatPrice(summary.total_consumed_value)}
          </p>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">Giá vốn món ăn đã bán ra</span>
        </div>

        {/* 3. Surplus Inventory Valuation */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800/90 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Tồn Thừa Hiện Tại</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-emerald-400 mt-2 truncate">
            {formatPrice(summary.total_inventory_valuation)}
          </p>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">Giá trị tồn kho còn lại</span>
        </div>

        {/* 4. Disposal Financial Loss */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800/90 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Thiệt Hại Tiêu Hủy</span>
            <div className={`p-2 rounded-xl ${summary.total_disposed_loss > 0 ? 'bg-rose-500/15 text-rose-400' : 'bg-neutral-800 text-neutral-500'}`}>
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-lg font-black mt-2 truncate ${summary.total_disposed_loss > 0 ? 'text-rose-400' : 'text-neutral-300'}`}>
            {formatPrice(summary.total_disposed_loss)}
          </p>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">Tổn thất hàng hỏng/quá date</span>
        </div>

        {/* 5. Near Expiry Alert */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800/90 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Sắp Hết Hạn (≤ 2 ngày)</span>
            <div className={`p-2 rounded-xl ${summary.near_expiry_count > 0 ? 'bg-amber-500/20 text-amber-400 animate-bounce' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-lg font-black mt-2 truncate ${summary.near_expiry_count > 0 ? 'text-amber-400' : 'text-neutral-300'}`}>
            {summary.near_expiry_count} mặt hàng
          </p>
          <span className="text-[10px] text-amber-300/80 mt-0.5 block">Cần ưu tiên dùng gấp!</span>
        </div>

        {/* 6. Expired Items (Must Dispose) */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800/90 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Đã Hết Hạn Dùng</span>
            <div className={`p-2 rounded-xl ${summary.expired_count > 0 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-lg font-black mt-2 truncate ${summary.expired_count > 0 ? 'text-rose-400' : 'text-neutral-300'}`}>
            {summary.expired_count} mặt hàng
          </p>
          <span className="text-[10px] text-rose-400/80 mt-0.5 block">Cần lập biên bản tiêu hủy</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'report'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Boxes className="w-4 h-4" /> Báo Cáo Nhập - Xuất - Tồn Tháng ({filteredItems.length})
        </button>

        <button
          onClick={() => setActiveTab('near_expiry')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition relative ${
            activeTab === 'near_expiry'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" /> Cảnh Báo Hạn Dùng & Kế Hoạch Tiêu Hủy
          {nearExpiryItems.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
              {nearExpiryItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'history'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <History className="w-4 h-4" /> Lịch Sử Nhập Hàng ({importHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('disposals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'disposals'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Trash2 className="w-4 h-4 text-rose-400" /> Nhật Ký Tiêu Hủy Hàng Hỏng ({disposalHistory.length})
        </button>
      </div>

      {/* TAB 1: MONTHLY INVENTORY REPORT */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          {/* Filters Bar with SearchableSelect */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-neutral-900 p-3.5 rounded-2xl border border-neutral-800">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Tìm theo tên nguyên liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700/80 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Category Dropdown with SearchableSelect */}
            <div>
              <SearchableSelect
                options={categoryOptions}
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                placeholder="Chọn nhóm hàng..."
                searchPlaceholder="Tìm nhóm hàng..."
              />
            </div>

            {/* Freshness Status Dropdown */}
            <div>
              <SearchableSelect
                options={freshnessOptions}
                value={selectedFreshness}
                onChange={(val) => setSelectedFreshness(val)}
                placeholder="Chọn trạng thái hạn dùng..."
                searchPlaceholder="Lọc theo hạn dùng..."
              />
            </div>

            {/* Total Results */}
            <div className="flex items-center justify-end text-xs text-neutral-400 pr-2">
              Hiển thị <span className="text-amber-400 font-bold mx-1">{filteredItems.length}</span> / {reportItems.length} loại nguyên liệu
            </div>
          </div>

          {/* Detailed Monthly Inventory Table */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-950 text-neutral-400 font-bold uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3.5">Nguyên Liệu</th>
                  <th className="p-3.5">Nhóm Hàng</th>
                  <th className="p-3.5 text-right">Đơn Giá Vốn</th>
                  <th className="p-3.5 text-center bg-amber-500/5 text-amber-300">Nhập Tháng {selectedMonth}</th>
                  <th className="p-3.5 text-center bg-blue-500/5 text-blue-300">Đã Chế Biến</th>
                  <th className="p-3.5 text-center bg-rose-500/5 text-rose-300">Đã Tiêu Hủy</th>
                  <th className="p-3.5 text-center bg-emerald-500/5 text-emerald-300 font-extrabold">Tồn Thừa Hiện Tại</th>
                  <th className="p-3.5 text-right">Giá Trị Tồn</th>
                  <th className="p-3.5 text-center">Hạn Sử Dụng (HSD)</th>
                  <th className="p-3.5 text-center">Bảo Quản & Phẩm Chất</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-neutral-500">
                      Đang tải báo cáo kho nguyên liệu tháng {selectedMonth}...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-neutral-500">
                      Không tìm thấy nguyên liệu nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((ing) => {
                    const isLow = ing.is_low_stock;

                    return (
                      <tr key={ing.id} className="hover:bg-neutral-800/40 transition">
                        {/* Name */}
                        <td className="p-3.5 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span>{ing.name}</span>
                            {isLow && (
                              <span className="p-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px]" title="Dưới mức tồn tối thiểu">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-500 font-normal">
                            Định mức tối thiểu: {ing.min_stock_alert} {ing.unit}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px]">
                            {ing.category}
                          </span>
                        </td>

                        {/* Cost Price */}
                        <td className="p-3.5 text-right text-neutral-300 font-medium">
                          {formatPrice(ing.cost_price)} / {ing.unit}
                        </td>

                        {/* Imported this month */}
                        <td className="p-3.5 text-center bg-amber-500/5 font-bold text-amber-400">
                          {ing.imported_quantity > 0 ? (
                            <div>
                              <span>+{ing.imported_quantity} {ing.unit}</span>
                              <div className="text-[10px] text-neutral-500 font-normal">{formatPrice(ing.imported_cost)}</div>
                            </div>
                          ) : (
                            <span className="text-neutral-600">-</span>
                          )}
                        </td>

                        {/* Kitchen Consumed */}
                        <td className="p-3.5 text-center bg-blue-500/5 font-bold text-blue-400">
                          {ing.consumed_quantity > 0 ? (
                            <div>
                              <span>-{ing.consumed_quantity} {ing.unit}</span>
                              <div className="text-[10px] text-neutral-500 font-normal">{formatPrice(ing.consumed_cost)}</div>
                            </div>
                          ) : (
                            <span className="text-neutral-600">-</span>
                          )}
                        </td>

                        {/* Disposed */}
                        <td className="p-3.5 text-center bg-rose-500/5 font-bold text-rose-400">
                          {ing.disposed_quantity > 0 ? (
                            <div>
                              <span>-{ing.disposed_quantity} {ing.unit}</span>
                              <div className="text-[10px] text-rose-500 font-normal">{formatPrice(ing.disposed_cost)}</div>
                            </div>
                          ) : (
                            <span className="text-neutral-600">-</span>
                          )}
                        </td>

                        {/* Surplus Stock */}
                        <td className="p-3.5 text-center bg-emerald-500/5 font-extrabold text-sm text-emerald-300">
                          {ing.surplus_stock} <span className="text-xs text-neutral-400 font-normal">{ing.unit}</span>
                        </td>

                        {/* Valuation */}
                        <td className="p-3.5 text-right font-black text-amber-300">
                          {formatPrice(ing.current_valuation)}
                        </td>

                        {/* Expiry Date */}
                        <td className="p-3.5 text-center">
                          <div className="font-semibold text-xs">
                            {ing.expiry_date ? new Date(ing.expiry_date).toLocaleDateString('vi-VN') : 'Theo lô'}
                          </div>
                          <div className={`text-[10px] font-medium ${
                            ing.freshness_status === 'expired'
                              ? 'text-rose-400 font-bold'
                              : ing.freshness_status === 'near_expiry'
                              ? 'text-amber-400 font-bold'
                              : 'text-neutral-500'
                          }`}>
                            {ing.days_until_expiry < 0
                              ? `Đã quá hạn ${Math.abs(ing.days_until_expiry)} ngày`
                              : ing.days_until_expiry <= 2
                              ? `Còn ${ing.days_until_expiry} ngày nữa`
                              : `Hạn dùng ${ing.shelf_life_days} ngày`}
                          </div>
                        </td>

                        {/* Freshness Badge & Storage */}
                        <td className="p-3.5 text-center">
                          {ing.freshness_status === 'expired' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              <AlertOctagon className="w-3 h-3" /> Đã Hết Hạn
                            </span>
                          ) : ing.freshness_status === 'near_expiry' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3" /> Sắp Hết Date
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Tươi Mới
                            </span>
                          )}
                          <div className="text-[10px] text-neutral-500 mt-1">
                            {ing.storage_condition}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Import more */}
                            <button
                              onClick={() => {
                                setImportForm({
                                  ingredient_id: ing.id,
                                  quantity: '',
                                  import_price: ing.cost_price,
                                  supplier_name: 'Vựa Nông Sản / Thực Phẩm Tươi',
                                  expiry_date: '',
                                  batch_number: '',
                                  notes: ''
                                });
                                setIsImportModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition"
                              title="Nhập thêm hàng vào kho"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>

                            {/* Dispose button */}
                            <button
                              onClick={() => {
                                setDisposeTargetId(ing.id);
                                setIsDisposeModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                              title="Lập biên bản tiêu hủy hàng hỏng/hết date"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditIngredient(ing)}
                              className="p-1.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition"
                              title="Sửa thông tin nguyên liệu"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EXPIRY & DISPOSAL PLAN */}
      {activeTab === 'near_expiry' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-rose-950/40 p-5 rounded-3xl border border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Phương Án & Kế Hoạch Xử Lý Nguyên Liệu Sắp Hết Hạn / Quá Date
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Tự động gợi ý giải pháp: Đẩy mạnh combo xả hàng, ưu tiên nấu trước, hoặc lập biên bản tiêu hủy an toàn.
                </p>
              </div>
            </div>
          </div>

          {nearExpiryItems.length === 0 ? (
            <div className="p-12 text-center bg-neutral-900 rounded-3xl border border-neutral-800 text-neutral-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">Tất Cả Nguyên Liệu Đều Trong Hạn Sử Dụng An Toàn!</h4>
              <p className="text-xs text-neutral-500 mt-1">
                Không có nguyên liệu nào bị quá hạn hoặc sắp hết hạn trong 48 giờ tới.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearExpiryItems.map((ing) => {
                const isExpired = ing.freshness_status === 'expired';

                return (
                  <div
                    key={ing.id}
                    className={`p-5 rounded-3xl border shadow-xl flex flex-col justify-between ${
                      isExpired
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : 'bg-amber-950/20 border-amber-500/40'
                    }`}
                  >
                    <div>
                      {/* Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isExpired
                              ? 'bg-rose-500 text-white'
                              : 'bg-amber-500 text-neutral-950'
                          }`}
                        >
                          {isExpired ? 'Đã Quá Hạn - Cần Tiêu Hủy' : 'Sắp Hết Hạn (≤ 2 ngày)'}
                        </span>
                        <span className="text-xs font-bold text-neutral-400">
                          {ing.category}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white">{ing.name}</h4>
                      <p className="text-xs text-neutral-400 mt-1">
                        Tồn kho: <strong className="text-amber-300 font-bold">{ing.surplus_stock} {ing.unit}</strong> • Giá vốn: {formatPrice(ing.cost_price)}/{ing.unit}
                      </p>

                      <div className="mt-3 p-3 bg-neutral-950/70 rounded-2xl border border-neutral-800 space-y-1 text-xs">
                        <div className="flex justify-between text-neutral-400">
                          <span>Hạn dùng (HSD):</span>
                          <span className={isExpired ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold'}>
                            {ing.expiry_date ? new Date(ing.expiry_date).toLocaleDateString('vi-VN') : 'Không rõ'}
                          </span>
                        </div>
                        <div className="flex justify-between text-neutral-400">
                          <span>Bảo quản:</span>
                          <span className="text-neutral-300">{ing.storage_condition}</span>
                        </div>
                        <div className="flex justify-between text-neutral-400">
                          <span>Giá trị tồn kho:</span>
                          <span className="text-amber-400 font-bold">{formatPrice(ing.current_valuation)}</span>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className="mt-3 text-xs">
                        <div className="font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Đề xuất xử lý:
                        </div>
                        <p className="text-neutral-400 text-[11px]">
                          {isExpired
                            ? 'Nguyên liệu đã hết date, cần lập biên bản tiêu hủy ngay để đảm bảo vệ sinh ATTP và cập nhật sổ sách.'
                            : 'Ưu tiên thông báo cho Bếp Trưởng đẩy mạnh chế biến trong ca hôm nay, hoặc tạo khuyến mại giảm giá combo để xả hàng.'}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setDisposeTargetId(ing.id);
                          setIsDisposeModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Lập Biên Bản Tiêu Hủy
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IMPORT HISTORY */}
      {activeTab === 'history' && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-950 text-neutral-400 font-bold uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-3.5">Mã Phiếu</th>
                <th className="p-3.5">Nguyên Liệu</th>
                <th className="p-3.5 text-center">Số Lượng Nhập</th>
                <th className="p-3.5 text-right">Đơn Giá Nhập</th>
                <th className="p-3.5 text-right">Tổng Tiền Nhập</th>
                <th className="p-3.5">Hạn Sử Dụng (HSD)</th>
                <th className="p-3.5">Nhà Cung Cấp</th>
                <th className="p-3.5">Người Nhập</th>
                <th className="p-3.5">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {importHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-500">
                    Chưa có phiếu nhập hàng nào.
                  </td>
                </tr>
              ) : (
                importHistory.map((imp) => (
                  <tr key={imp.id} className="hover:bg-neutral-800/40 transition">
                    <td className="p-3.5 font-mono text-amber-400 font-bold">
                      #NK-{imp.id.toString().padStart(4, '0')}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      {imp.ingredient_name}
                      {imp.batch_number && (
                        <span className="block text-[10px] text-neutral-500 font-normal font-mono">
                          Lô: {imp.batch_number}
                        </span>
                      )}
                      {imp.notes && (
                        <span className="block text-[10px] text-neutral-400 font-normal italic">
                          {imp.notes}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-extrabold text-emerald-400">
                      +{imp.quantity_imported} {imp.unit}
                    </td>
                    <td className="p-3.5 text-right text-neutral-300">
                      {formatPrice(imp.import_price)}
                    </td>
                    <td className="p-3.5 text-right font-black text-amber-300">
                      {formatPrice(imp.total_amount)}
                    </td>
                    <td className="p-3.5 text-neutral-300">
                      {imp.expiry_date ? new Date(imp.expiry_date).toLocaleDateString('vi-VN') : 'Theo lô'}
                    </td>
                    <td className="p-3.5 text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-neutral-500" />
                        {imp.supplier_name}
                      </div>
                    </td>
                    <td className="p-3.5 text-neutral-400">{imp.staff_name || 'Admin'}</td>
                    <td className="p-3.5 text-neutral-400">
                      {new Date(imp.import_date).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: DISPOSAL AUDIT LOGS */}
      {activeTab === 'disposals' && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-950 text-neutral-400 font-bold uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-3.5">Mã Biên Bản</th>
                <th className="p-3.5">Nguyên Liệu Tiêu Hủy</th>
                <th className="p-3.5 text-center">Số Lượng Hủy</th>
                <th className="p-3.5 text-right">Thiệt Hại Tài Chính</th>
                <th className="p-3.5">Lý Do Tiêu Hủy</th>
                <th className="p-3.5">Người Lập Biên Bản</th>
                <th className="p-3.5">Thời Gian Hủy</th>
                <th className="p-3.5">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {disposalHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500">
                    Chưa có biên bản tiêu hủy nào. Kho hàng đang được quản lý rất tốt!
                  </td>
                </tr>
              ) : (
                disposalHistory.map((disp) => (
                  <tr key={disp.id} className="hover:bg-neutral-800/40 transition">
                    <td className="p-3.5 font-mono text-rose-400 font-bold">
                      #BB-TH-{disp.id.toString().padStart(4, '0')}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      {disp.ingredient_name}
                    </td>
                    <td className="p-3.5 text-center font-extrabold text-rose-400">
                      -{disp.quantity} {disp.unit}
                    </td>
                    <td className="p-3.5 text-right font-black text-rose-400">
                      {formatPrice(disp.cost_loss)}
                    </td>
                    <td className="p-3.5 text-neutral-300">
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                        {disp.reason}
                      </span>
                    </td>
                    <td className="p-3.5 text-neutral-300 font-medium">
                      {disp.disposed_by}
                    </td>
                    <td className="p-3.5 text-neutral-400">
                      {new Date(disp.disposal_date).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-3.5 text-neutral-400 italic">
                      {disp.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: IMPORT GOODS MODAL */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Tạo Phiếu Nhập Kho Nguyên Liệu"
        size="lg"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Chọn Nguyên Liệu Nhập <span className="text-rose-400">*</span>:
            </label>
            <SearchableSelect
              options={ingredientSelectOptions}
              value={importForm.ingredient_id}
              onChange={(val, opt) => {
                setImportForm({
                  ...importForm,
                  ingredient_id: val,
                  import_price: opt ? opt.cost_price : '',
                  expiry_date: opt?.expiry_date ? opt.expiry_date.split('T')[0] : ''
                });
              }}
              placeholder="Gõ tên hoặc chọn nguyên liệu trong kho..."
              searchPlaceholder="Tìm kiếm nguyên liệu..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Số Lượng Nhập <span className="text-rose-400">*</span>:
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ví dụ: 15"
                value={importForm.quantity}
                onChange={(e) => setImportForm({ ...importForm, quantity: e.target.value })}
                required
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Đơn Giá Nhập (VNĐ):
              </label>
              <input
                type="number"
                placeholder="Ví dụ: 250000"
                value={importForm.import_price}
                onChange={(e) => setImportForm({ ...importForm, import_price: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Hạn Sử Dụng (HSD) của Lô Hàng:
              </label>
              <input
                type="date"
                value={importForm.expiry_date}
                onChange={(e) => setImportForm({ ...importForm, expiry_date: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Mã Lô Hàng (Batch / Lot):
              </label>
              <input
                type="text"
                placeholder="Ví dụ: LOT-20260819"
                value={importForm.batch_number}
                onChange={(e) => setImportForm({ ...importForm, batch_number: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Nhà Cung Cấp:</label>
            <input
              type="text"
              placeholder="Tên nhà cung cấp / Nguồn nhập nông sản"
              value={importForm.supplier_name}
              onChange={(e) => setImportForm({ ...importForm, supplier_name: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Ghi Chú Nhập Kho:</label>
            <input
              type="text"
              placeholder="Ghi chú về chất lượng hàng, số hóa đơn VAT..."
              value={importForm.notes}
              onChange={(e) => setImportForm({ ...importForm, notes: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
            />
          </div>

          {importForm.quantity && importForm.import_price && (
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex justify-between items-center text-xs">
              <span className="text-neutral-400">Tổng tiền thanh toán nhập hàng:</span>
              <span className="text-sm font-black text-amber-400">
                {formatPrice(parseFloat(importForm.quantity) * parseFloat(importForm.import_price))}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
            <Button variant="ghost" size="sm" onClick={() => setIsImportModalOpen(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" icon={PackagePlus} type="submit" loading={submitting}>
              Xác Nhận Nhập Kho
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: INGREDIENT MODAL (ADD / EDIT) */}
      <Modal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        title={editingIngredient ? `Sửa Nguyên Liệu: ${editingIngredient.name}` : 'Thêm Nguyên Liệu Mới'}
        size="md"
      >
        <form onSubmit={handleIngredientSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Tên Nguyên Liệu <span className="text-rose-400">*</span>:
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Thịt Bò Wagyu A5"
              value={ingredientForm.name}
              onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
              required
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Đơn Vị Tính <span className="text-rose-400">*</span>:
              </label>
              <select
                value={ingredientForm.unit}
                onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
              >
                <option value="kg">kg (Kilogram)</option>
                <option value="g">g (Gram)</option>
                <option value="lít">lít (Litre)</option>
                <option value="ml">ml (Millilitre)</option>
                <option value="quả">quả / trái</option>
                <option value="hộp">hộp</option>
                <option value="gói">gói</option>
                <option value="lon">lon</option>
                <option value="chai">chai</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Nhóm Hàng:</label>
              <select
                value={ingredientForm.category}
                onChange={(e) => setIngredientForm({ ...ingredientForm, category: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
              >
                <option value="Thịt tươi">Thịt tươi</option>
                <option value="Hải sản">Hải sản</option>
                <option value="Rau củ">Rau củ</option>
                <option value="Rau nấm">Rau nấm</option>
                <option value="Gia vị & Bơ sốt">Gia vị & Bơ sốt</option>
                <option value="Gia vị & Nước cốt">Gia vị & Nước cốt</option>
                <option value="Lương thực">Lương thực</option>
                <option value="Đồ uống">Đồ uống</option>
                <option value="Trái cây">Trái cây</option>
                <option value="Tráng miệng">Tráng miệng</option>
                <option value="Đồ khô">Đồ khô</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Thời Hạn Lưu Trữ (Số ngày an toàn):
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ví dụ: 7"
                value={ingredientForm.shelf_life_days}
                onChange={(e) => setIngredientForm({ ...ingredientForm, shelf_life_days: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Hạn Sử Dụng (HSD Mặc Định):
              </label>
              <input
                type="date"
                value={ingredientForm.expiry_date}
                onChange={(e) => setIngredientForm({ ...ingredientForm, expiry_date: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Điều Kiện Bảo Quản:</label>
              <select
                value={ingredientForm.storage_condition}
                onChange={(e) => setIngredientForm({ ...ingredientForm, storage_condition: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
              >
                <option value="Đông lạnh sâu -18°C">Đông lạnh sâu -18°C</option>
                <option value="Ngăn mát 2-4°C">Ngăn mát 2-4°C</option>
                <option value="Ngăn mát 4°C">Ngăn mát 4°C</option>
                <option value="Bể sủi oxy sống">Bể sủi oxy sống</option>
                <option value="Nhiệt độ phòng thoáng mát">Nhiệt độ phòng thoáng mát</option>
                <option value="Nơi khô ráo">Nơi khô ráo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Đơn Giá Vốn Ước Tính (VNĐ):</label>
              <input
                type="number"
                value={ingredientForm.cost_price}
                onChange={(e) => setIngredientForm({ ...ingredientForm, cost_price: e.target.value })}
                placeholder="VNĐ"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
            <Button variant="ghost" size="sm" onClick={() => setIsIngredientModalOpen(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submitting}>
              {editingIngredient ? 'Cập Nhật' : 'Tạo Nguyên Liệu'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: DISPOSAL / SPOILAGE MODAL */}
      <DisposeModal
        isOpen={isDisposeModalOpen}
        onClose={() => {
          setIsDisposeModalOpen(false);
          setDisposeTargetId(null);
        }}
        onSubmit={handleDisposeSubmit}
        ingredients={reportItems}
        initialIngredientId={disposeTargetId}
        user={user}
      />
    </div>
  );
};
