import React, { useState } from 'react';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Utensils,
  Sparkles,
  Send,
  Ticket,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const CustomerCartDrawer = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onUpdateNotes,
  onRemoveItem,
  onClearCart,
  table,
  customerInfo,
  onOrderSuccess
}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const rawTotal = cartItems.reduce((sum, it) => sum + (it.price || 0) * it.quantity, 0);
  const discountAmount = Math.round((rawTotal * appliedDiscount) / 100);
  const afterDiscount = Math.max(0, rawTotal - discountAmount);
  const vatAmount = Math.round((afterDiscount * 8) / 100);
  const finalTotal = afterDiscount + vatAmount;

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) return;
    const code = voucherCode.trim().toUpperCase();

    if (code === 'WAGYU20' || code.includes('20')) {
      setAppliedDiscount(20);
      addToast('Áp dụng mã Voucher giảm 20% thành công!', 'success');
    } else if (code === 'HAPPYHOUR' || code.includes('25')) {
      setAppliedDiscount(25);
      addToast('Áp dụng mã Giờ Vàng giảm 25% thành công!', 'success');
    } else if (code.includes('10')) {
      setAppliedDiscount(10);
      addToast('Áp dụng mã Voucher giảm 10% thành công!', 'success');
    } else if (code.includes('15') || code === 'SEAFOOD15') {
      setAppliedDiscount(15);
      addToast('Áp dụng mã Lễ Hội Hải Sản giảm 15% thành công!', 'success');
    } else {
      addToast('Mã khuyến mãi không hợp lệ hoặc đã hết hạn', 'warning');
    }
  };

  const handleSendOrder = async () => {
    if (cartItems.length === 0) {
      addToast('Giỏ hàng đang trống, vui lòng chọn món ăn', 'warning');
      return;
    }

    if (!table || !table.id) {
      addToast('Vui lòng chọn bàn ăn của bạn trước khi gọi món', 'warning');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (table.current_order_id) {
        // Table already has active order -> Add items to order
        res = await api.post(`/orders/${table.current_order_id}/items`, {
          table_id: table.id,
          items: cartItems.map((item) => ({
            id: item.id,
            menu_item_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || ''
          }))
        });
      } else {
        // New order
        res = await api.post('/orders', {
          table_id: table.id,
          customer_name: customerInfo?.full_name || 'Khách Gọi Món',
          notes: `Khách tự gọi tại bàn (${customerInfo?.phone || 'Khách mới'})`,
          discount_percent: appliedDiscount,
          vat_percent: 8,
          items: cartItems.map((item) => ({
            id: item.id,
            menu_item_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || ''
          }))
        });
      }

      if (res.success) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        addToast(`Gửi yêu cầu gọi món cho ${table.table_name} thành công! Bếp đang chuẩn bị món.`, 'success');
        onClearCart();
        if (onOrderSuccess) onOrderSuccess(res.data);
        onClose();
      }
    } catch (err) {
      addToast(err.message || 'Không thể gửi đơn hàng, vui lòng nhờ nhân viên hỗ trợ', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-neutral-900 border-l border-amber-500/30 text-white shadow-2xl flex flex-col justify-between h-full">
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-1.5">
                  Món Đã Chọn ({table?.table_name || 'Chưa chọn bàn'})
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {cartItems.length} món trong danh sách gọi
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 text-neutral-500 space-y-3">
                <Utensils className="w-12 h-12 mx-auto text-neutral-700 stroke-1" />
                <p className="text-sm font-medium">Bạn chưa chọn món ăn nào</p>
                <p className="text-xs text-neutral-600">Vui lòng duyệt qua thực đơn và nhấn "Thêm Món"</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/30 transition space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=150&q=80'}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-800"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                      <div className="text-amber-400 font-extrabold text-xs mt-0.5">
                        {formatPrice(item.price)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700/80 rounded-xl p-1 shrink-0">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-white w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 transition"
                      title="Xóa món"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Note input */}
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                    placeholder="Ghi chú khẩu vị (ít cay, không hành, nhiều đá...)"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-[11px] text-neutral-300 placeholder:text-neutral-600 focus:border-amber-500 outline-none"
                  />
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout button */}
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-neutral-800 bg-neutral-950/90 space-y-3">
              {/* Voucher input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Nhập mã ưu đãi (WAGYU20...)"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-2.5 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none uppercase font-mono font-bold"
                  />
                </div>
                <Button variant="secondary" size="sm" onClick={handleApplyVoucher} className="shrink-0">
                  Áp Dụng
                </Button>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-neutral-400">
                <div className="flex justify-between">
                  <span>Tiền món ({cartItems.reduce((s, i) => s + i.quantity, 0)} suất):</span>
                  <span className="text-white font-bold">{formatPrice(rawTotal)}</span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-rose-400 font-bold">
                    <span>Ưu đãi giảm ({appliedDiscount}%):</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Thuế VAT (8%):</span>
                  <span className="text-neutral-300">{formatPrice(vatAmount)}</span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-neutral-800 text-sm">
                  <span className="font-extrabold text-white">TỔNG TẠM TÍNH:</span>
                  <span className="text-lg font-black text-amber-400">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <Button variant="danger" size="sm" onClick={onClearCart} disabled={loading} className="shrink-0">
                  Xóa Hết
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSendOrder}
                  disabled={loading}
                  icon={Send}
                  className="flex-1 font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs py-3"
                >
                  {loading ? 'Đang Gửi Bếp...' : 'GỬI ĐƠN VÀO BẾP CHẾ BIẾN'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
