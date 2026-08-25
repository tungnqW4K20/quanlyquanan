import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  Users,
  Phone,
  User,
  UtensilsCrossed,
  Sparkles,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  FileText,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ReservationModal({ isOpen, onClose, tables = [], menuItems = [], onRefresh }) {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'
  const [selectedResv, setSelectedResv] = useState(null);
  const { addToast } = useToast();

  // Create Form State
  const [tableId, setTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('19:00');
  const [specialNotes, setSpecialNotes] = useState('');
  const [depositAmount, setDepositAmount] = useState(0);
  const [preorderedItems, setPreorderedItems] = useState([]); // [{ name, price, quantity }]
  const [selectedDishId, setSelectedDishId] = useState('');
  const [selectedDishQty, setSelectedDishQty] = useState(1);

  // Set default reservation date to today (YYYY-MM-DD)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setReservationDate(today);
  }, []);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reservations');
      if (res.success) {
        setReservations(res.data || []);
      }
    } catch (err) {
      console.error('Fetch reservations error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReservations();
    }
  }, [isOpen]);

  const handleAddPreorderItem = () => {
    if (!selectedDishId) return;
    const dish = menuItems.find((m) => m.id === parseInt(selectedDishId));
    if (!dish) return;

    const existingIdx = preorderedItems.findIndex((it) => it.name === dish.name);
    if (existingIdx >= 0) {
      const updated = [...preorderedItems];
      updated[existingIdx].quantity += parseInt(selectedDishQty) || 1;
      setPreorderedItems(updated);
    } else {
      setPreorderedItems([
        ...preorderedItems,
        {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: parseInt(selectedDishQty) || 1
        }
      ]);
    }
    setSelectedDishId('');
    setSelectedDishQty(1);
  };

  const handleRemovePreorderItem = (idx) => {
    setPreorderedItems(preorderedItems.filter((_, i) => i !== idx));
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    if (!tableId || !customerName.trim() || !customerPhone.trim() || !reservationDate || !reservationTime) {
      addToast('Vui lòng điền đầy đủ bàn, họ tên, số điện thoại và thời gian đặt bàn!', 'warning');
      return;
    }

    const fullReservationTime = `${reservationDate} ${reservationTime}:00`;

    try {
      const res = await api.post('/reservations', {
        table_id: parseInt(tableId),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        guest_count: parseInt(guestCount) || 2,
        reservation_time: fullReservationTime,
        special_notes: specialNotes.trim(),
        deposit_amount: parseFloat(depositAmount) || 0,
        preordered_items: preorderedItems
      });

      if (res.success) {
        addToast(res.message || 'Đặt bàn trước thành công!', 'success');
        // Reset form
        setCustomerName('');
        setCustomerPhone('');
        setSpecialNotes('');
        setDepositAmount(0);
        setPreorderedItems([]);
        setActiveTab('list');
        fetchReservations();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      addToast(err.message || 'Có lỗi khi tạo đặt bàn!', 'error');
    }
  };

  const handleCheckin = async (resv) => {
    if (!window.confirm(`Xác nhận khách ${resv.customer_name} đã đến nhận ${resv.table_name}? Hệ thống sẽ tự động mở bàn và nạp các món đặt trước vào Bếp KDS.`)) {
      return;
    }

    try {
      const res = await api.post(`/reservations/${resv.id}/checkin`);
      if (res.success) {
        addToast(res.message || 'Khách nhận bàn thành công!', 'success');
        fetchReservations();
        if (onRefresh) onRefresh();
        onClose();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi nhận bàn!', 'error');
    }
  };

  const handleCancelReservation = async (resv) => {
    const reason = window.prompt('Nhập lý do hủy lịch đặt trước của khách:', 'Khách báo bận không đến được');
    if (reason === null) return;

    try {
      const res = await api.post(`/reservations/${resv.id}/cancel`, { reason });
      if (res.success) {
        addToast(res.message || 'Đã hủy đặt bàn!', 'success');
        fetchReservations();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi hủy đặt bàn!', 'error');
    }
  };

  const formatPrice = (val) => new Intl.NumberFormat('vi-VN').format(val || 0) + ' đ';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-neutral-100 flex items-center gap-2">
              Quản Lý Đặt Bàn Trước & Món Pre-Order
              <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/30">
                {reservations.filter((r) => r.status === 'confirmed').length} bàn sắp tới
              </span>
            </div>
            <p className="text-xs text-neutral-400">Xem chính xác thông tin khách đặt bàn nào, mấy người ăn, đặt trước món gì</p>
          </div>
        </div>
      }
      size="xl"
    >
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
              activeTab === 'list'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Danh Sách Đặt Trước ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
              activeTab === 'create'
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/30'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            Tạo Đặt Bàn Mới
          </button>
        </div>

        <button
          onClick={fetchReservations}
          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition"
        >
          Làm mới
        </button>
      </div>

      {/* Tab 1: Reservations List */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-neutral-400 text-sm">Đang tải danh sách đặt bàn...</div>
          ) : reservations.length === 0 ? (
            <div className="py-12 text-center bg-neutral-900/50 rounded-2xl border border-neutral-800">
              <CalendarCheck className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-neutral-300">Chưa có lịch đặt bàn trước nào</div>
              <p className="text-xs text-neutral-500 mt-1">Bấm "Tạo Đặt Bàn Mới" để ghi nhận thông tin khách đặt trước</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {reservations.map((resv) => {
                const isConfirmed = resv.status === 'confirmed';
                const isSeated = resv.status === 'seated';
                const isCancelled = resv.status === 'cancelled';

                return (
                  <div
                    key={resv.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isConfirmed
                        ? 'bg-gradient-to-br from-neutral-900 to-indigo-950/30 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                        : isSeated
                        ? 'bg-neutral-900/60 border-emerald-500/30 opacity-80'
                        : 'bg-neutral-900/40 border-neutral-800 opacity-60'
                    }`}
                  >
                    {/* Header: Table & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl text-sm font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {resv.table_name || `Bàn #${resv.table_id}`}
                        </span>
                        <span className="text-xs text-neutral-400 flex items-center gap-1 font-bold">
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          {resv.guest_count} khách
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          isConfirmed
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : isSeated
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isConfirmed ? '⏳ Chờ Nhận Bàn' : isSeated ? '✅ Đã Vào Bàn' : '❌ Đã Hủy'}
                      </span>
                    </div>

                    {/* Customer info */}
                    <div className="space-y-1.5 text-xs text-neutral-300 mb-3 bg-neutral-950/50 p-2.5 rounded-xl border border-neutral-800">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-neutral-400" />
                          Khách hàng:
                        </span>
                        <strong className="text-neutral-100 font-bold">{resv.customer_name}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                          Điện thoại:
                        </span>
                        <span className="font-mono text-amber-400 font-bold">{resv.customer_phone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          Giờ hẹn:
                        </span>
                        <strong className="text-indigo-300 font-bold">
                          {new Date(resv.reservation_time).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </strong>
                      </div>
                      {resv.deposit_amount > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
                          <span className="text-neutral-400">Tiền cọc trước:</span>
                          <span className="text-emerald-400 font-extrabold">{formatPrice(resv.deposit_amount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Special Notes */}
                    {resv.special_notes && (
                      <div className="mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Ghi chú đặc biệt: </span>
                          {resv.special_notes}
                        </div>
                      </div>
                    )}

                    {/* Pre-ordered Dishes */}
                    <div className="mb-3">
                      <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-indigo-400" />
                        Món đặt trước ({resv.preordered_items?.length || 0}):
                      </div>
                      {resv.preordered_items && resv.preordered_items.length > 0 ? (
                        <div className="space-y-1 bg-neutral-950/60 p-2 rounded-xl border border-neutral-800 max-h-28 overflow-y-auto">
                          {resv.preordered_items.map((dish, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                              <span className="text-neutral-200">
                                <span className="font-bold text-amber-400">{dish.quantity}x</span> {dish.name}
                              </span>
                              <span className="text-neutral-400 font-mono">{formatPrice(dish.price * dish.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-500 italic">Khách chưa chọn món trước (sẽ gọi tại bàn)</div>
                      )}
                    </div>

                    {/* Actions */}
                    {isConfirmed && (
                      <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                        <button
                          onClick={() => handleCheckin(resv)}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-[0.98]"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Nhận Bàn & Bắt Đầu Phục Vụ
                        </button>
                        <button
                          onClick={() => handleCancelReservation(resv)}
                          className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-rose-900/40 text-neutral-400 hover:text-rose-400 font-bold text-xs transition"
                          title="Hủy đặt bàn"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Create Reservation Form */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateReservation} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Table Selector */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                Chọn Bàn Đặt Trước *
              </label>
              <select
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 font-bold"
              >
                <option value="">-- Chọn bàn ăn --</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.table_name} ({t.area} - {t.capacity} người) {t.has_reservation ? ' [ĐÃ CÓ LỊCH]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Guest count */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                Số Lượng Khách (Mấy người ăn) *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                Tên Khách Hàng *
              </label>
              <input
                type="text"
                placeholder="VD: Anh Trần Hoàng Long"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                Số Điện Thoại Khách *
              </label>
              <input
                type="tel"
                placeholder="VD: 0912334556"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                Ngày Nhận Bàn *
              </label>
              <input
                type="date"
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                Giờ Nhận Bàn *
              </label>
              <input
                type="time"
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            {/* Deposit */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                Tiền Đặt Cọc (VNĐ)
              </label>
              <input
                type="number"
                step="10000"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
              Ghi Chú Yêu Cầu Đặc Biệt
            </label>
            <input
              type="text"
              placeholder="VD: Tổ chức sinh nhật gia đình, cắm hoa tươi, ghế trẻ em, ăn ít cay..."
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Pre-ordered Dishes Selector */}
          <div className="p-3.5 bg-neutral-950/60 rounded-2xl border border-neutral-800">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4" />
              Khách Đặt Trước Những Món Nào (Tùy chọn)
            </label>

            <div className="flex items-center gap-2 mb-3">
              <select
                value={selectedDishId}
                onChange={(e) => setSelectedDishId(e.target.value)}
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Chọn món thêm vào danh sách đặt trước --</option>
                {menuItems.map((dish) => (
                  <option key={dish.id} value={dish.id}>
                    {dish.name} - {formatPrice(dish.price)} {dish.item_type === 'combo' ? '[COMBO]' : ''}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                max="20"
                value={selectedDishQty}
                onChange={(e) => setSelectedDishQty(e.target.value)}
                className="w-16 bg-neutral-800 border border-neutral-700 rounded-xl px-2 py-2 text-xs text-center text-neutral-100 font-bold"
              />

              <button
                type="button"
                onClick={handleAddPreorderItem}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition"
              >
                Thêm món
              </button>
            </div>

            {/* Pre-ordered List Preview */}
            {preorderedItems.length > 0 && (
              <div className="space-y-1.5 border-t border-neutral-800 pt-2">
                {preorderedItems.map((dish, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                    <span className="text-neutral-200">
                      <strong className="text-amber-400">{dish.quantity}x</strong> {dish.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-neutral-300">{formatPrice(dish.price * dish.quantity)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePreorderItem(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <div className="text-right text-xs font-bold text-amber-400 pt-1">
                  Tổng tiền món đặt trước: {formatPrice(preorderedItems.reduce((s, i) => s + i.price * i.quantity, 0))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition"
            >
              Quay lại danh sách
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
            >
              Lưu Đặt Bàn Trước
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
