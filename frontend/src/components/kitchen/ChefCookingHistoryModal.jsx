import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  History,
  AlertTriangle,
  Star,
  CheckCircle2,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Flame,
  Clock,
  ShieldAlert,
  ThumbsDown,
  XCircle
} from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ChefCookingHistoryModal({ isOpen, onClose, chefs = [] }) {
  const [historyData, setHistoryData] = useState([]);
  const [summary, setSummary] = useState({
    total_dishes_cooked: 0,
    returned_count: 0,
    success_rate: 100,
    total_penalty_deduction: 0,
    average_quality_rating: 5
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChef, setSelectedChef] = useState('all');
  const [onlyReturned, setOnlyReturned] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const { addToast } = useToast();

  // Return dish penalty form
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedItemForReturn, setSelectedItemForReturn] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState(50000);
  const [qualityFeedback, setQualityFeedback] = useState('');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      let url = '/kitchen/history?';
      if (selectedChef && selectedChef !== 'all') url += `chef_name=${encodeURIComponent(selectedChef)}&`;
      if (selectedDate) url += `date=${selectedDate}&`;
      if (onlyReturned) url += `is_returned=true&`;

      const res = await api.get(url);
      if (res.success && res.data) {
        setHistoryData(res.data.history || []);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      console.error('Fetch chef history error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, selectedChef, selectedDate, onlyReturned]);

  const handleOpenReturnModal = (item) => {
    setSelectedItemForReturn(item);
    setReturnReason('');
    setPenaltyAmount(Math.round((item.price || 50000) * 0.5)); // Default 50% dish price penalty
    setQualityFeedback('');
    setIsReturnModalOpen(true);
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!selectedItemForReturn || !returnReason.trim()) {
      addToast('Vui lòng nhập lý do trả món!', 'warning');
      return;
    }

    try {
      const res = await api.post(`/kitchen/return/${selectedItemForReturn.item_id}`, {
        return_reason: returnReason.trim(),
        penalty_deduction: parseFloat(penaltyAmount) || 0,
        quality_feedback: qualityFeedback.trim(),
        quality_rating: 1
      });

      if (res.success) {
        addToast(res.message || 'Đã ghi nhận trả món và trừ phạt thành công!', 'success');
        setIsReturnModalOpen(false);
        fetchHistory();
      }
    } catch (err) {
      addToast(err.message || 'Có lỗi khi ghi nhận trả món!', 'error');
    }
  };

  const formatPrice = (val) => new Intl.NumberFormat('vi-VN').format(val || 0) + ' đ';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-neutral-100 flex items-center gap-2">
              Hồ Sơ Nấu Nướng & Đánh Giá Trả Món Của Đầu Bếp
            </div>
            <p className="text-xs text-neutral-400">Kiểm toán món ăn từng đầu bếp nấu, ngày giờ, bàn phục vụ, tình trạng trả món và trừ lương</p>
          </div>
        </div>
      }
      size="xl"
    >
      <div className="space-y-4">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
            <div className="text-[11px] font-bold text-neutral-400 uppercase">Món Đã Nấu</div>
            <div className="text-xl font-black text-neutral-100 mt-0.5">{summary.total_dishes_cooked}</div>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
            <div className="text-[11px] font-bold text-neutral-400 uppercase">Đạt Chuẩn</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{summary.success_rate}%</div>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
            <div className="text-[11px] font-bold text-neutral-400 uppercase">Bị Trả Lại</div>
            <div className={`text-xl font-black mt-0.5 ${summary.returned_count > 0 ? 'text-rose-400' : 'text-neutral-400'}`}>
              {summary.returned_count}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
            <div className="text-[11px] font-bold text-neutral-400 uppercase">Đánh Giá TB</div>
            <div className="text-xl font-black text-amber-400 mt-0.5 flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {summary.average_quality_rating}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-neutral-400 uppercase">Phạt Trừ Lương</div>
            <div className="text-sm font-black text-rose-400 mt-1">{formatPrice(summary.total_penalty_deduction)}</div>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Chef Selector */}
            <select
              value={selectedChef}
              onChange={(e) => setSelectedChef(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-neutral-100 font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tất cả Đầu Bếp</option>
              <option value="Trần Bếp Trưởng">Trần Bếp Trưởng (Head Chef)</option>
              {chefs.map((c) => (
                <option key={c.id} value={c.full_name}>
                  {c.full_name}
                </option>
              ))}
            </select>

            {/* Date filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
            />

            {/* Only returned checkbox */}
            <button
              onClick={() => setOnlyReturned(!onlyReturned)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                onlyReturned
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Chỉ Món Bị Trả Lại ({summary.returned_count})
            </button>
          </div>

          <button
            onClick={fetchHistory}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition"
          >
            Làm mới
          </button>
        </div>

        {/* History List */}
        <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-neutral-400 text-sm">Đang tải lịch sử nấu nướng...</div>
          ) : historyData.length === 0 ? (
            <div className="py-12 text-center bg-neutral-900/40 rounded-2xl border border-neutral-800">
              <History className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-neutral-300">Không tìm thấy bản ghi nấu nướng nào</div>
            </div>
          ) : (
            historyData.map((item) => {
              const isReturned = item.is_returned;

              return (
                <div
                  key={item.item_id}
                  className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isReturned
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                      : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'}
                      alt={item.dish_name}
                      className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-neutral-100">{item.dish_name}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300">
                          {item.quantity}x {item.unit || 'Phần'}
                        </span>
                        <span className="text-xs font-mono font-bold text-neutral-400">{formatPrice(item.total_price)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400 mt-1">
                        <span className="flex items-center gap-1 font-bold text-indigo-400">
                          📍 {item.table_name || 'Bàn'} ({item.area || 'Tầng 1'})
                        </span>
                        <span className="flex items-center gap-1 font-bold text-amber-300">
                          <ChefHat className="w-3.5 h-3.5" />
                          Đầu bếp: {item.assigned_chef_name || 'Trần Bếp Trưởng'}
                        </span>
                        <span className="flex items-center gap-1 text-neutral-500">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(item.item_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                          {new Date(item.item_time).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      {/* Return reason & feedback */}
                      {isReturned && (
                        <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                          <div className="font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            Lý do trả món: {item.return_reason}
                          </div>
                          {item.penalty_deduction > 0 && (
                            <div className="text-[11px] text-rose-400 mt-0.5 font-bold">
                              Trừ phạt trách nhiệm: {formatPrice(item.penalty_deduction)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status Badge */}
                  <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-800">
                    {isReturned ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <ThumbsDown className="w-3.5 h-3.5" />
                        Bị Trả Lại
                      </span>
                    ) : (
                      <>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đạt Chuẩn (5⭐)
                        </span>
                        <button
                          onClick={() => handleOpenReturnModal(item)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-rose-900/40 text-neutral-400 hover:text-rose-300 text-xs font-bold transition flex items-center gap-1"
                          title="Báo trả món nếu khách phàn nàn"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Báo trả món
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sub-modal: Ghi nhận trả món & Trừ phạt */}
      {isReturnModalOpen && selectedItemForReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border-2 border-rose-500/50 rounded-2xl p-5 max-w-md w-full shadow-2xl shadow-rose-500/10 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-black text-base">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                Ghi Nhận Trả Món & Phạt Trách Nhiệm
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs space-y-1">
              <div>
                Món ăn: <strong className="text-neutral-100">{selectedItemForReturn.dish_name}</strong> ({selectedItemForReturn.table_name})
              </div>
              <div>
                Đầu bếp phụ trách: <strong className="text-amber-400">{selectedItemForReturn.assigned_chef_name || 'Trần Bếp Trưởng'}</strong>
              </div>
              <div>
                Giá trị món: <strong className="text-neutral-200">{formatPrice(selectedItemForReturn.total_price)}</strong>
              </div>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Lý Do Khách Trả Món *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  required
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-100 font-bold focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Chọn lý do chất lượng --</option>
                  <option value="Món bị cháy khét / quá lửa">Món bị cháy khét / quá lửa</option>
                  <option value="Nêm nếm quá mặn / cay sai khẩu vị yêu cầu">Nêm nếm quá mặn / cay sai khẩu vị yêu cầu</option>
                  <option value="Món bị nguội lạnh, ra món quá lâu">Món bị nguội lạnh, ra món quá lâu</option>
                  <option value="Nguyên liệu không tươi / có mùi lạ">Nguyên liệu không tươi / có mùi lạ</option>
                  <option value="Nấu sai món / làm nhầm yêu cầu của khách">Nấu sai món / làm nhầm yêu cầu của khách</option>
                  <option value="Khách không hài lòng chất lượng món ăn">Khách không hài lòng chất lượng món ăn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Mức Tiền Phạt Trừ Trách Nhiệm (VNĐ)</label>
                <input
                  type="number"
                  step="10000"
                  min="0"
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-100 font-bold focus:outline-none focus:border-rose-500"
                />
                <p className="text-[10px] text-neutral-500 mt-1">Số tiền này sẽ được hạch toán vào khấu trừ lương tháng của đầu bếp.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/20"
                >
                  Xác Nhận Trừ Phạt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
}
