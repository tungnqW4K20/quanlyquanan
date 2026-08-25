import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Send,
  Sparkles,
  FileText,
  User,
  Percent
} from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const CartDrawer = ({
  table,
  cart,
  onUpdateQuantity,
  onUpdateNotes,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
  onClose
}) => {
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [vatPercent, setVatPercent] = useState(8);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = (afterDiscount * vatPercent) / 100;
  const finalTotal = Math.round(afterDiscount + vatAmount);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const handleSendOrder = async () => {
    if (cart.length === 0) {
      addToast('Giỏ hàng trống, vui lòng chọn ít nhất 1 món ăn', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (table.current_order_id) {
        // Append items to existing order
        const res = await api.post(`/orders/${table.current_order_id}/items`, {
          items: cart.map((i) => ({
            id: i.id,
            menu_item_id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            notes: i.notes || ''
          }))
        });

        if (res.success) {
          addToast(`Đã thêm ${cart.length} món vào đơn ${table.table_name} và gửi bếp!`, 'success');
          onClearCart();
          onOrderSuccess();
          onClose();
        }
      } else {
        // Create new order
        const res = await api.post('/orders', {
          table_id: table.id,
          customer_name: customerName,
          notes: orderNotes,
          discount_percent: discountPercent,
          vat_percent: vatPercent,
          items: cart.map((i) => ({
            id: i.id,
            menu_item_id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            notes: i.notes || ''
          }))
        });

        if (res.success) {
          addToast(`Đã tạo đơn cho ${table.table_name} và gửi bếp thành công!`, 'success');
          onClearCart();
          onOrderSuccess();
          onClose();
        }
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi gửi order', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-850 border-l border-dark-700/80">
      {/* Header */}
      <div className="p-4 border-b border-dark-700 bg-dark-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Gọi Món: <span className="text-amber-400">{table.table_name}</span>
            </h3>
            <span className="text-xs text-slate-400">{table.area} • {table.capacity} khách</span>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            title="Xóa toàn bộ giỏ"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center mb-3">
              <ShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300">Chưa có món nào được chọn</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Nhấp vào món ăn từ thực đơn bên cạnh để thêm vào danh sách gọi món
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-dark-900 border border-dark-700 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-100 truncate">{item.name}</h4>
                  <span className="text-xs text-amber-400 font-semibold">
                    {formatPrice(item.price)} / {item.unit || 'Phần'}
                  </span>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-slate-400 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quantity Controls & Total */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 bg-dark-800 border border-dark-700 rounded-lg p-1">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-dark-700 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-slate-100 px-2 min-w-[24px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-dark-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-sm font-bold text-orange-400">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>

              {/* Item Note */}
              <div>
                <input
                  type="text"
                  placeholder="Ghi chú món (ví dụ: Không hành, ít cay...)"
                  value={item.notes || ''}
                  onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-dark-800 border border-dark-700/80 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Order Actions */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-dark-700 bg-dark-900/90 space-y-3">
          {/* Inputs for new order */}
          {!table.current_order_id && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 flex items-center gap-1 font-medium">
                  <User className="w-3 h-3 text-amber-400" /> Tên khách:
                </label>
                <input
                  type="text"
                  placeholder="Tên khách (tùy chọn)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-dark-850 border border-dark-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 flex items-center gap-1 font-medium">
                  <Percent className="w-3 h-3 text-orange-400" /> Giảm giá (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full px-2.5 py-1.5 bg-dark-850 border border-dark-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Pricing calculations */}
          <div className="space-y-1.5 text-xs text-slate-300 pt-1 border-t border-dark-700/60">
            <div className="flex justify-between">
              <span className="text-slate-400">Tiền món:</span>
              <span className="font-semibold text-slate-200">{formatPrice(subtotal)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Chiết khấu ({discountPercent}%):</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Thuế VAT ({vatPercent}%):</span>
              <span>+{formatPrice(vatAmount)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1.5 border-t border-dark-700">
              <span className="font-bold text-sm text-slate-100">Tổng cộng:</span>
              <span className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
                {formatPrice(finalTotal)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
              Đóng
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Send}
              onClick={handleSendOrder}
              loading={loading}
            >
              Gửi Bếp & Lưu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
