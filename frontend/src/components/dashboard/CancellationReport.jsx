import React, { useState, useEffect } from 'react';
import {
  FileX,
  AlertOctagon,
  Search,
  Calendar,
  DollarSign,
  TrendingDown,
  User,
  Clock,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const CancellationReport = () => {
  const [cancelledItems, setCancelledItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const { addToast } = useToast();

  const fetchCancelledItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/cancellations');
      if (res.success) {
        setCancelledItems(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi tải báo cáo món hủy', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelledItems();
  }, []);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const totalLoss = cancelledItems.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
  const totalDishes = cancelledItems.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0);

  // Filter reasons
  const uniqueReasons = ['all', ...new Set(cancelledItems.map((i) => i.reason).filter(Boolean))];

  const filteredItems = cancelledItems.filter((item) => {
    const matchSearch =
      item.dish_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.table_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cancelled_by?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchReason = reasonFilter === 'all' || item.reason === reasonFilter;
    return matchSearch && matchReason;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <FileX className="w-6 h-6" />
            </div>
            Báo Cáo Kiểm Toán Món Hủy & Thất Thoát
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Theo dõi chi tiết mọi món ăn khách gọi sau đó bị hủy, nguyên nhân hủy và người thực hiện
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-dark-850 border border-dark-700/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Tổng Giá Trị Thất Thoát</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-red-400 mt-2">
            {formatPrice(totalLoss)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Doanh thu món bị hủy bỏ
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-dark-850 border border-dark-700/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Tổng Số Suất Món Bị Hủy</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-100 mt-2">
            {totalDishes} phần
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Trên {cancelledItems.length} lượt yêu cầu hủy
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-dark-850 border border-dark-700/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Lý Do Phổ Biến Nhất</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-extrabold text-amber-300 mt-2 truncate">
            {cancelledItems[0]?.reason || 'Khách đổi ý'}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Cần lưu ý tối ưu tốc độ ra món & tồn kho
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-dark-850 p-3.5 rounded-2xl border border-dark-700/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên món, bàn, nhân viên hủy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-dark-900 border border-dark-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tất cả lý do hủy</option>
            {uniqueReasons.filter((r) => r !== 'all').map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="overflow-x-auto rounded-2xl border border-dark-700 bg-dark-850 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-dark-900/90 text-slate-400 border-b border-dark-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Mã / Món Ăn Bị Hủy</th>
              <th className="p-3.5">Bàn Gọi</th>
              <th className="p-3.5 text-center">SL Hủy</th>
              <th className="p-3.5 text-right">Đơn Giá</th>
              <th className="p-3.5 text-right">Giá Trị Thất Thoát</th>
              <th className="p-3.5">Lý Do Hủy Món</th>
              <th className="p-3.5">Nhân Viên Thực Hiện</th>
              <th className="p-3.5">Thời Gian Hủy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/60 text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  Đang tải dữ liệu kiểm toán...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  Không có lịch sử món bị hủy nào.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-dark-800/50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-100">
                    <span className="font-mono text-slate-400 mr-1.5">#HM-{item.id}</span>
                    {item.dish_name}
                  </td>
                  <td className="p-3.5 font-semibold text-amber-400">
                    {item.table_name}
                  </td>
                  <td className="p-3.5 text-center font-bold text-red-400">
                    {item.quantity}
                  </td>
                  <td className="p-3.5 text-right text-slate-300">
                    {formatPrice(item.price)}
                  </td>
                  <td className="p-3.5 text-right font-black text-red-400">
                    {formatPrice(item.total_amount)}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 text-[11px] font-medium inline-block">
                      {item.reason}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-300 flex items-center gap-1.5 mt-2">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    {item.cancelled_by}
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {new Date(item.cancelled_at).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
