import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, ShieldAlert, Sparkles, Tag, DollarSign, Calendar } from 'lucide-react';
import SearchableSelect from '../common/SearchableSelect';

const COMMON_REASONS = [
  'Quá hạn sử dụng (Hết date)',
  'Hư hỏng / Dập úa trong quá trình bảo quản',
  'Mất phẩm chất / Biến đổi mùi vị hoặc màu sắc',
  'Rã đông sai kỹ thuật / Mất độ tươi giòn',
  'Bao bì bị rách / Nhiễm khuẩn từ môi trường'
];

export default function DisposeModal({
  isOpen,
  onClose,
  onSubmit,
  ingredients = [],
  initialIngredientId = null,
  user
}) {
  const [selectedIngredientId, setSelectedIngredientId] = useState(initialIngredientId || '');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [strategy, setStrategy] = useState('dispose'); // 'dispose' | 'discount_dish'
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentIngredient = ingredients.find((i) => String(i.id) === String(selectedIngredientId));
  const currentStock = currentIngredient ? parseFloat(currentIngredient.current_stock || 0) : 0;
  const costPrice = currentIngredient ? parseFloat(currentIngredient.cost_price || 0) : 0;
  const unit = currentIngredient ? currentIngredient.unit : 'kg';

  const numQty = parseFloat(quantity) || 0;
  const estimatedCostLoss = numQty * costPrice;

  const ingredientOptions = ingredients.map((ing) => ({
    value: ing.id,
    label: `${ing.name} (Tồn: ${ing.current_stock} ${ing.unit} - HSD: ${ing.expiry_date ? new Date(ing.expiry_date).toLocaleDateString('vi-VN') : 'Không rõ'})`,
    subLabel: `Đơn giá: ${new Intl.NumberFormat('vi-VN').format(ing.cost_price)} đ/${ing.unit} • ${ing.storage_condition || 'Bảo quản mát'}`,
    name: ing.name,
    category: ing.category,
    unit: ing.unit,
    stock: ing.current_stock
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIngredientId) {
      alert('Vui lòng chọn nguyên liệu cần tiêu hủy!');
      return;
    }
    if (numQty <= 0) {
      alert('Vui lòng nhập số lượng hợp lệ lớn hơn 0!');
      return;
    }
    if (numQty > currentStock) {
      alert(`Số lượng tiêu hủy (${numQty} ${unit}) vượt quá tồn kho thực tế (${currentStock} ${unit})!`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ingredient_id: parseInt(selectedIngredientId),
        quantity: numQty,
        reason,
        notes: strategy === 'discount_dish' ? `[Chiến lược xả hàng]: ${notes}` : notes
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-rose-500/40 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-500/20 bg-gradient-to-r from-rose-950/60 via-neutral-900 to-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Biên Bản Tiêu Hủy Nguyên Liệu
              </h2>
              <p className="text-xs text-rose-300/80">
                Xử lý nguyên liệu quá hạn / hư hỏng & giảm thiểu thiệt hại tài chính
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm custom-scrollbar">
          {/* Strategy Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Phương án xử lý nguyên liệu:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStrategy('dispose')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  strategy === 'dispose'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-300'
                    : 'bg-neutral-800/40 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs mb-1">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Tiêu Hủy An Toàn
                </div>
                <div className="text-[11px] text-neutral-400">
                  Hủy bỏ hoàn toàn nguyên liệu đã hỏng/quá date, bảo đảm ATVSTP 100%.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('discount_dish')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  strategy === 'discount_dish'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                    : 'bg-neutral-800/40 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Khuyến Mãi Xả Hàng
                </div>
                <div className="text-[11px] text-neutral-400">
                  Ưu tiên chế biến gấp cho các món combo khuyến mãi trước khi hết hạn.
                </div>
              </button>
            </div>
          </div>

          {/* Select Ingredient with SearchableSelect */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Nguyên liệu cần xử lý <span className="text-rose-400">*</span>:
            </label>
            <SearchableSelect
              options={ingredientOptions}
              value={selectedIngredientId}
              onChange={(val) => setSelectedIngredientId(val)}
              placeholder="Gõ tên hoặc chọn nguyên liệu trong kho..."
              searchPlaceholder="Tìm theo tên nguyên liệu, danh mục..."
            />
          </div>

          {/* Current Stock & Details Preview */}
          {currentIngredient && (
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-neutral-500 text-[11px]">Tồn kho hiện tại:</div>
                <div className="font-semibold text-amber-300 text-sm">
                  {currentStock} {unit}
                </div>
              </div>
              <div>
                <div className="text-neutral-500 text-[11px]">Giá vốn nhập:</div>
                <div className="font-semibold text-white">
                  {new Intl.NumberFormat('vi-VN').format(costPrice)} đ/{unit}
                </div>
              </div>
              <div>
                <div className="text-neutral-500 text-[11px]">Hạn sử dụng (HSD):</div>
                <div className={`font-semibold ${currentIngredient.days_until_expiry <= 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {currentIngredient.expiry_date
                    ? new Date(currentIngredient.expiry_date).toLocaleDateString('vi-VN')
                    : 'Chưa có ngày'}
                </div>
              </div>
            </div>
          )}

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Số lượng hủy ({unit}) <span className="text-rose-400">*</span>:
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={currentStock || 9999}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ví dụ: 1.5"
                  required
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(currentStock.toString())}
                  className="absolute right-2 top-2 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] rounded-lg transition"
                >
                  Hủy hết
                </button>
              </div>
            </div>

            {/* Estimated Financial Loss */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Thiệt hại tài chính ước tính:
              </label>
              <div className="w-full bg-neutral-950 border border-rose-500/30 rounded-xl px-3.5 py-2.5 text-sm font-bold text-rose-400 flex items-center justify-between">
                <span>{new Intl.NumberFormat('vi-VN').format(estimatedCostLoss)} đ</span>
                <DollarSign className="w-4 h-4 text-rose-500" />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Lý do tiêu hủy:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 outline-none transition"
            >
              {COMMON_REASONS.map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Ghi chú thêm & Người lập biên bản:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Chi tiết tình trạng lúc kiểm tra, khu vực kho lưu trữ..."
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-neutral-200 outline-none transition resize-none"
            />
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý quan trọng:</strong> Khi xác nhận, số lượng này sẽ được trừ trực tiếp khỏi tồn kho hiện tại và hệ thống sẽ tự động hạch toán khoản thiệt hại vào báo cáo tài chính kho hàng tháng.
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-xs font-medium transition"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={loading || numQty <= 0 || !selectedIngredientId}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? 'Đang xử lý...' : 'Xác Nhận Tiêu Hủy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
