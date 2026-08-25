import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { Modal, Button } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const SwitchTableModal = ({ isOpen, onClose, sourceTable, allTables, onSwitchSuccess }) => {
  const [targetTableId, setTargetTableId] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const emptyTables = allTables.filter(
    (t) => t.id !== sourceTable?.id && (t.status === 'empty' || !t.current_order_id)
  );

  const handleSwitch = async () => {
    if (!targetTableId) {
      addToast('Vui lòng chọn bàn đích để chuyển', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/tables/switch', {
        from_table_id: sourceTable.id,
        to_table_id: parseInt(targetTableId)
      });

      if (res.success) {
        addToast(res.message || 'Chuyển bàn thành công!', 'success');
        onSwitchSuccess();
        onClose();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi chuyển bàn', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chuyển Bàn / Đổi Bàn Ăn"
      icon={ArrowRightLeft}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Source Table Info */}
        <div className="p-3.5 rounded-xl bg-dark-900 border border-dark-700">
          <div className="text-xs text-slate-400">Bàn hiện tại (Nguồn):</div>
          <div className="text-base font-bold text-amber-400 mt-0.5">
            {sourceTable?.table_name} ({sourceTable?.area})
          </div>
        </div>

        {/* Target Table Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Chọn bàn trống cần chuyển sang:
          </label>
          <select
            value={targetTableId}
            onChange={(e) => setTargetTableId(e.target.value)}
            className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
          >
            <option value="">-- Chọn bàn đích --</option>
            {emptyTables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.table_name} - {t.area} (Sức chứa: {t.capacity} khách)
              </option>
            ))}
          </select>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Hủy Bỏ
          </Button>
          <Button
            variant="primary"
            icon={ArrowRightLeft}
            onClick={handleSwitch}
            loading={loading}
            disabled={!targetTableId}
          >
            Xác Nhận Chuyển Bàn
          </Button>
        </div>
      </div>
    </Modal>
  );
};
