import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, RefreshCw, X, User, ChefHat } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import SearchableSelect from '../common/SearchableSelect';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const CANCELLATION_REASONS = [
  'Khách đổi ý / Muốn đổi sang món khác',
  'Bếp hết nguyên liệu chế biến món này',
  'Nấu sai yêu cầu / Làm cháy khét / Lỗi kỹ thuật',
  'Khách đợi quá lâu không kịp dùng',
  'Nhân viên ghi nhầm order / Nhầm bàn',
  'Lý do khác'
];

export const CancelItemModal = ({ isOpen, onClose, item, tableName, onCancelSuccess }) => {
  const [actionType, setActionType] = useState('cancel'); // 'cancel' | 'change_dish'
  const [responsibleRole, setResponsibleRole] = useState('customer'); // 'customer' | 'staff' | 'chef'
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [responsibleUserName, setResponsibleUserName] = useState('');
  const [reason, setReason] = useState(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchStaffList();
    }
  }, [isOpen]);

  const fetchStaffList = async () => {
    try {
      const res = await api.get('/users');
      if (res.success && res.data) {
        setUsersList(res.data.filter((u) => ['staff', 'chef'].includes(u.role)));
      }
    } catch (err) {
      // ignore
    }
  };

  if (!item) return null;

  const handleConfirm = async () => {
    const finalReason = reason === 'Lý do khác' && customReason.trim() ? customReason.trim() : reason;

    setLoading(true);
    try {
      const res = await api.post(`/orders/items/${item.id}/cancel`, {
        reason: finalReason,
        action_type: actionType,
        responsible_role: responsibleRole,
        responsible_user_id: responsibleUserId ? parseInt(responsibleUserId) : null,
        responsible_user_name: responsibleUserName || null
      });

      if (res.success) {
        addToast(
          `Đã ghi nhận ${actionType === 'change_dish' ? 'đổi món' : 'hủy món'} "${item.name || item.dish_name}" thành công!`,
          'success'
        );
        onCancelSuccess();
        onClose();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi xử lý thao tác', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const userOptions = usersList
    .filter((u) => (responsibleRole === 'chef' ? u.role === 'chef' : u.role === 'staff'))
    .map((u) => ({
      value: u.id,
      label: u.full_name,
      subLabel: `${u.role === 'chef' ? 'Đầu bếp' : 'Phục vụ / Thu ngân'} • SĐT: ${u.phone || 'N/A'}`
    }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={actionType === 'change_dish' ? 'Xác Nhận Đổi Món' : 'Xác Nhận Hủy Món'}
      size="md"
    >
      <div className="space-y-4">
        {/* Type Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-dark-900 border border-dark-700">
          <button
            type="button"
            onClick={() => setActionType('cancel')}
            className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              actionType === 'cancel'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hủy Món Này</span>
          </button>
          <button
            type="button"
            onClick={() => setActionType('change_dish')}
            className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              actionType === 'change_dish'
                ? 'bg-amber-500 text-dark-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Đổi Sang Món Khác</span>
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Mọi thao tác hủy / đổi món đều được lưu vết kiểm toán chi tiết của Admin để đánh giá tỷ lệ phục vụ và kiểm soát lãng phí.
          </p>
        </div>

        {/* Dish Info */}
        <div className="p-3.5 rounded-xl bg-dark-900 border border-dark-700 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-100 text-sm">{item.name || item.dish_name}</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {tableName} • SL: <span className="font-bold text-amber-400">{item.quantity}</span>
            </p>
          </div>
          <span className="font-extrabold text-sm text-orange-400">
            {formatPrice(parseFloat(item.price) * (item.quantity || 1))}
          </span>
        </div>

        {/* Responsible Group */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">
            Nguyên nhân phát sinh từ <span className="text-amber-400">*</span>:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setResponsibleRole('customer');
                setResponsibleUserId('');
                setResponsibleUserName('');
              }}
              className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                responsibleRole === 'customer'
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                  : 'bg-dark-900 border-dark-700 text-slate-400 hover:border-dark-600'
              }`}
            >
              Khách hàng
            </button>
            <button
              type="button"
              onClick={() => {
                setResponsibleRole('staff');
                setResponsibleUserId('');
                setResponsibleUserName('');
              }}
              className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                responsibleRole === 'staff'
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                  : 'bg-dark-900 border-dark-700 text-slate-400 hover:border-dark-600'
              }`}
            >
              Phục vụ / Thu ngân
            </button>
            <button
              type="button"
              onClick={() => {
                setResponsibleRole('chef');
                setResponsibleUserId('');
                setResponsibleUserName('');
              }}
              className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                responsibleRole === 'chef'
                  ? 'bg-red-500/15 border-red-500/40 text-red-300'
                  : 'bg-dark-900 border-dark-700 text-slate-400 hover:border-dark-600'
              }`}
            >
              Đầu bếp / Quầy bar
            </button>
          </div>
        </div>

        {/* Select Responsible User with SearchableSelect */}
        {responsibleRole !== 'customer' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Nhân sự chịu trách nhiệm trực tiếp:
            </label>
            <SearchableSelect
              options={userOptions}
              value={responsibleUserId}
              onChange={(val, opt) => {
                setResponsibleUserId(val);
                setResponsibleUserName(opt ? opt.label : '');
              }}
              placeholder={`-- Chọn ${responsibleRole === 'chef' ? 'đầu bếp' : 'nhân viên phục vụ'} --`}
              searchPlaceholder="Tìm theo tên nhân viên..."
            />
          </div>
        )}

        {/* Reason Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">
            Lý do cụ thể <span className="text-red-400">*</span>:
          </label>
          <div className="space-y-1.5">
            {CANCELLATION_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                  reason === r
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-medium'
                    : 'bg-dark-900 border-dark-700 text-slate-400 hover:border-dark-600'
                }`}
              >
                <input
                  type="radio"
                  name="cancellationReason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 bg-dark-800 border-dark-700"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          {reason === 'Lý do khác' && (
            <textarea
              placeholder="Nhập lý do chi tiết..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={2}
              className="w-full mt-2 px-3 py-2 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-dark-700">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Đóng
          </Button>
          <Button
            variant={actionType === 'cancel' ? 'danger' : 'primary'}
            size="sm"
            icon={actionType === 'cancel' ? Trash2 : RefreshCw}
            onClick={handleConfirm}
            loading={loading}
          >
            {actionType === 'cancel' ? 'Xác Nhận Hủy Món' : 'Xác Nhận Đổi Món'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
