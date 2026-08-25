import React, { useState, useEffect } from 'react';
import { ChefHat, Plus, Trash2, Scale, DollarSign, Percent, Sparkles, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import SearchableSelect from '../common/SearchableSelect';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const RecipeModal = ({ isOpen, onClose, dish }) => {
  const [recipeData, setRecipeData] = useState(null);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const fetchDishRecipe = async () => {
    if (!dish) return;
    setLoading(true);
    try {
      const [recRes, ingRes] = await Promise.all([
        api.get(`/recipes/dish/${dish.id}`),
        api.get('/inventory/ingredients')
      ]);

      if (recRes.success) {
        setRecipeData(recRes.data);
      }
      if (ingRes.success) {
        setIngredientsList(ingRes.data);
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi tải công thức món', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && dish) {
      fetchDishRecipe();
      setSelectedIngredientId('');
      setQuantityNeeded('');
      setNotes('');
    }
  }, [isOpen, dish]);

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    if (!selectedIngredientId || !quantityNeeded || parseFloat(quantityNeeded) <= 0) {
      addToast('Vui lòng chọn nguyên liệu và nhập định lượng hợp lệ', 'warning');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post(`/recipes/dish/${dish.id}`, {
        ingredient_id: selectedIngredientId,
        quantity_needed: parseFloat(quantityNeeded),
        notes
      });

      if (res.success) {
        addToast('Đã lưu nguyên liệu vào công thức!', 'success');
        setSelectedIngredientId('');
        setQuantityNeeded('');
        setNotes('');
        fetchDishRecipe();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi lưu công thức', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecipeItem = async (recipeId) => {
    try {
      const res = await api.delete(`/recipes/${recipeId}`);
      if (res.success) {
        addToast('Đã xóa nguyên liệu khỏi công thức', 'success');
        fetchDishRecipe();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi xóa', 'error');
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  if (!dish) return null;

  const sellingPrice = parseFloat(dish.price || 0);
  const estimatedCost = recipeData?.estimated_food_cost || 0;
  const foodCostPercent = recipeData?.food_cost_percentage || 0;
  const grossProfit = Math.max(0, sellingPrice - estimatedCost);

  const ingredientOptions = ingredientsList.map((ing) => ({
    value: ing.id,
    label: `${ing.name} (${ing.unit})`,
    subLabel: `Tồn kho: ${ing.current_stock} ${ing.unit} • Giá vốn: ${formatPrice(ing.cost_price)}/${ing.unit}`,
    unit: ing.unit
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Công Thức & Định Mức: ${dish.name}`}
      size="xl"
    >
      <div className="space-y-5">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-dark-900 border border-dark-700">
            <span className="text-[11px] text-slate-400 font-medium">Giá bán niêm yết</span>
            <p className="text-base font-extrabold text-amber-400 mt-1">{formatPrice(sellingPrice)}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-900 border border-dark-700">
            <span className="text-[11px] text-slate-400 font-medium">Giá vốn nguyên liệu (Cost)</span>
            <p className="text-base font-extrabold text-orange-400 mt-1">{formatPrice(estimatedCost)}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-900 border border-dark-700">
            <span className="text-[11px] text-slate-400 font-medium">Tỷ lệ giá vốn (Food Cost)</span>
            <p className={`text-base font-extrabold mt-1 ${foodCostPercent > 40 ? 'text-red-400' : 'text-emerald-400'}`}>
              {foodCostPercent}%
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-900 border border-dark-700">
            <span className="text-[11px] text-slate-400 font-medium">Lợi nhuận gộp ước tính</span>
            <p className="text-base font-extrabold text-emerald-400 mt-1">{formatPrice(grossProfit)}</p>
          </div>
        </div>

        {/* Add ingredient form with SearchableSelect */}
        <form onSubmit={handleAddIngredient} className="p-4 rounded-xl bg-dark-900/80 border border-dark-700 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-amber-400" /> Thêm / Cập nhật nguyên liệu định mức cho món
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
            <div className="sm:col-span-5">
              <SearchableSelect
                options={ingredientOptions}
                value={selectedIngredientId}
                onChange={(val) => setSelectedIngredientId(val)}
                placeholder="-- Chọn nguyên liệu trong kho --"
                searchPlaceholder="Tìm kiếm nguyên liệu..."
              />
            </div>

            <div className="sm:col-span-3">
              <input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="Định lượng (kg/lít/...)"
                value={quantityNeeded}
                onChange={(e) => setQuantityNeeded(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-dark-850 border border-dark-700 rounded-xl text-slate-100 outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Ghi chú (vd: 200g bò)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-dark-850 border border-dark-700 rounded-xl text-slate-100 outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2 flex">
              <Button variant="primary" size="md" type="submit" loading={saving} className="w-full">
                Lưu vào món
              </Button>
            </div>
          </div>
        </form>

        {/* Current Recipes Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300">
            Danh sách nguyên liệu cấu thành ({recipeData?.recipes?.length || 0} thành phần):
          </h4>

          {loading ? (
            <div className="text-center py-6 text-slate-500 text-xs">Đang tải công thức...</div>
          ) : recipeData?.recipes?.length === 0 ? (
            <div className="text-center py-8 bg-dark-900/40 rounded-xl border border-dark-700/60 text-slate-500 text-xs">
              <ChefHat className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              Món ăn này chưa được cấu hình công thức nguyên liệu.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-dark-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-900 text-slate-400 border-b border-dark-700 font-semibold">
                  <tr>
                    <th className="p-3">Nguyên liệu</th>
                    <th className="p-3 text-center">Định lượng / Phần</th>
                    <th className="p-3 text-right">Đơn giá vốn</th>
                    <th className="p-3 text-right">Thành tiền vốn</th>
                    <th className="p-3 text-center">Tồn kho hiện tại</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/60 bg-dark-850">
                  {recipeData?.recipes?.map((item) => (
                    <tr key={item.id} className="hover:bg-dark-800/60 transition-colors">
                      <td className="p-3 font-semibold text-slate-200">
                        {item.ingredient_name}
                        {item.notes && <span className="block text-[10px] text-slate-400 font-normal">{item.notes}</span>}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-400">
                        {item.quantity_needed} {item.unit}
                      </td>
                      <td className="p-3 text-right text-slate-400">{formatPrice(item.cost_price)} / {item.unit}</td>
                      <td className="p-3 text-right font-bold text-orange-400">{formatPrice(item.item_cost)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          parseFloat(item.current_stock) < 5 ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          {item.current_stock} {item.unit}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteRecipeItem(item.id)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Xóa nguyên liệu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-dark-700">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
