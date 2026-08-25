import React, { useState, useEffect } from 'react';
import { Utensils, Clock, User, CheckCircle2, CreditCard, Trash2, Printer, XCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DishStatusBadge } from '../common/Badge';
import { CancelItemModal } from './CancelItemModal';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const TableDetailModal = ({ isOpen, onClose, table, onOpenCheckout, onOpenAddDishes }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cancellingItem, setCancellingItem] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && table?.id) {
      fetchOrder();
    }
  }, [isOpen, table]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tables/${table.id}`);
      if (res.success && res.data) {
        setOrderDetails(res.data.current_order);
      }
    } catch (err) {
      addToast('Không thể tải chi tiết đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderDetails) return;
    if (!window.confirm(`Bạn có chắc chắn muốn hủy toàn bộ đơn hàng của ${table.table_name}?`)) return;

    try {
      const res = await api.delete(`/orders/${orderDetails.id}`);
      if (res.success) {
        addToast(`Đã hủy đơn hàng của ${table.table_name}`, 'success');
        onClose();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi hủy đơn', 'error');
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Chi Tiết Đơn Hàng - ${table?.table_name || ''}`}
        icon={Utensils}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          {loading ? (
            <div className="py-8 text-center text-slate-400">Đang tải chi tiết đơn...</div>
          ) : !orderDetails ? (
            <div className="py-8 text-center text-slate-400">Bàn hiện không có đơn hàng hoạt động.</div>
          ) : (
            <>
              {/* Header info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-dark-900 border border-dark-700 text-xs">
                <div>
                  <span className="text-slate-400">Khu vực:</span>
                  <span className="font-bold text-slate-200 ml-1.5">{table.area}</span>
                </div>
                <div>
                  <span className="text-slate-400">Nhân viên:</span>
                  <span className="font-bold text-amber-400 ml-1.5">{orderDetails.staff_name || 'Nhân viên'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Thời gian tạo:</span>
                  <span className="font-medium text-slate-200 ml-1.5 font-mono">
                    {new Date(orderDetails.created_at).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Khách hàng:</span>
                  <span className="font-medium text-slate-200 ml-1.5">{orderDetails.customer_name || 'Khách vãng lai'}</span>
                </div>
              </div>

              {/* Dishes list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Danh sách món ăn ({orderDetails.items?.filter((i) => i.status !== 'cancelled').length || 0} món)
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {orderDetails.items?.map((item, idx) => {
                    const isCancelled = item.status === 'cancelled';

                    return (
                      <div
                        key={item.id || idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          isCancelled
                            ? 'bg-dark-950/60 border-red-900/30 opacity-60'
                            : 'bg-dark-900 border-dark-700/80'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-400 w-5">{item.quantity}x</span>
                            <span className={`font-bold truncate ${isCancelled ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                              {item.name}
                            </span>
                            {item.assigned_chef_name && (
                              <span className="text-[10px] text-orange-400 font-normal">
                                (Đầu bếp: {item.assigned_chef_name})
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-amber-300/80 pl-7 italic">Ghi chú: {item.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <DishStatusBadge status={item.status} />
                          <span className="font-bold text-slate-200 font-mono">
                            {formatPrice(item.price * item.quantity)}
                          </span>

                          {!isCancelled && (
                            <button
                              onClick={() => setCancellingItem(item)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Hủy món này (có lưu lý do)"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="p-3.5 rounded-xl bg-dark-900 border border-dark-700 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tiền món:</span>
                  <span className="font-semibold text-slate-200">{formatPrice(orderDetails.total_amount)}</span>
                </div>
                {orderDetails.discount_percent > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Chiết khấu ({orderDetails.discount_percent}%):</span>
                    <span>
                      -{formatPrice((orderDetails.total_amount * orderDetails.discount_percent) / 100)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Thuế VAT ({orderDetails.vat_percent || 8}%):</span>
                  <span>
                    +
                    {formatPrice(
                      ((orderDetails.total_amount -
                        (orderDetails.total_amount * (orderDetails.discount_percent || 0)) / 100) *
                        (orderDetails.vat_percent || 8)) /
                        100
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-dark-700">
                  <span className="font-bold text-sm text-slate-100">Tổng thanh toán:</span>
                  <span className="text-base font-extrabold text-amber-400">
                    {formatPrice(orderDetails.final_amount || orderDetails.total_amount)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-dark-700">
                <Button variant="danger" size="sm" icon={Trash2} onClick={handleCancelOrder}>
                  Hủy Cả Bàn
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Utensils}
                    onClick={() => {
                      onClose();
                      onOpenAddDishes(table);
                    }}
                  >
                    Thêm Món
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CreditCard}
                    onClick={() => {
                      onClose();
                      onOpenCheckout(table, orderDetails);
                    }}
                  >
                    Thanh Toán
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Item cancellation reason modal */}
      {cancellingItem && (
        <CancelItemModal
          isOpen={!!cancellingItem}
          onClose={() => setCancellingItem(null)}
          item={cancellingItem}
          tableName={table?.table_name}
          onCancelSuccess={() => {
            fetchOrder();
          }}
        />
      )}
    </>
  );
};
