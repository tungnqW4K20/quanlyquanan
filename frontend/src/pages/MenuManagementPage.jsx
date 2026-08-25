import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Utensils,
  Eye,
  EyeOff,
  FolderPlus,
  CheckCircle2,
  Tag,
  ChefHat,
  Scale
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import SearchableSelect from '../components/common/SearchableSelect';
import { RecipeModal } from '../components/menu/RecipeModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const MenuManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedRecipeDish, setSelectedRecipeDish] = useState(null);

  // Form states - Dish
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [unit, setUnit] = useState('Phần');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states - Category
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Utensils');

  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/menu/items')
      ]);

      if (catsRes.success) {
        setCategories(catsRes.data);
        if (catsRes.data.length > 0 && !categoryId) {
          setCategoryId(catsRes.data[0].id.toString());
        }
      }
      if (itemsRes.success) setMenuItems(itemsRes.data);
    } catch (err) {
      addToast('Không thể tải dữ liệu thực đơn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setPrice('');
    setDescription('');
    setImageUrl('');
    setUnit('Phần');
    setIsAvailable(true);
    setIsFeatured(false);
    if (categories.length > 0) setCategoryId(categories[0].id.toString());
    setIsItemModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setCategoryId(item.category_id.toString());
    setName(item.name);
    setPrice(item.price.toString());
    setDescription(item.description || '');
    setImageUrl(item.image_url || '');
    setUnit(item.unit || 'Phần');
    setIsAvailable(item.is_available);
    setIsFeatured(item.is_featured);
    setIsItemModalOpen(true);
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    if (!name || !price || !categoryId) {
      addToast('Vui lòng điền đủ tên món, giá và danh mục', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        category_id: parseInt(categoryId),
        name,
        price: parseFloat(price),
        description,
        image_url: imageUrl,
        unit,
        is_available: isAvailable,
        is_featured: isFeatured
      };

      if (editingItem) {
        const res = await api.put(`/menu/items/${editingItem.id}`, payload);
        if (res.success) {
          addToast(`Cập nhật món "${name}" thành công!`, 'success');
          setIsItemModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/menu/items', payload);
        if (res.success) {
          addToast(`Thêm món "${name}" thành công!`, 'success');
          setIsItemModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi lưu món ăn', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSoldOutToday = async (item) => {
    try {
      const res = await api.patch(`/menu/items/${item.id}/toggle-sold-out`);
      if (res.success) {
        addToast(res.message || 'Cập nhật trạng thái hết món hôm nay thành công', 'success');
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi đổi trạng thái', 'error');
    }
  };

  const handleToggleAvailable = async (item) => {
    try {
      const res = await api.patch(`/menu/items/${item.id}/toggle-availability`);
      if (res.success) {
        addToast(res.message || 'Cập nhật trạng thái món thành công', 'success');
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi đổi trạng thái', 'error');
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa món "${item.name}"?`)) return;

    try {
      const res = await api.delete(`/menu/items/${item.id}`);
      if (res.success) {
        addToast(`Đã xóa món "${item.name}"`, 'success');
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi xóa món ăn', 'error');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catName) {
      addToast('Vui lòng nhập tên danh mục', 'warning');
      return;
    }

    try {
      const res = await api.post('/menu/categories', {
        name: catName,
        icon: catIcon
      });
      if (res.success) {
        addToast(`Thêm danh mục "${catName}" thành công!`, 'success');
        setCatName('');
        setIsCategoryModalOpen(false);
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi thêm danh mục', 'error');
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category_id === parseInt(selectedCategory);
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Actions */}
      <div className="p-4 rounded-2xl bg-dark-850 border border-dark-700/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên món, mô tả món ăn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Buttons */}
        {isAdmin && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={FolderPlus}
              onClick={() => setIsCategoryModalOpen(true)}
            >
              Thêm Danh Mục
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenAdd}
            >
              Thêm Món Mới
            </Button>
          </div>
        )}
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-dark-950 shadow-md shadow-amber-500/20'
              : 'bg-dark-850 text-slate-300 hover:bg-dark-800 border border-dark-700 hover:border-amber-500/30'
          }`}
        >
          Tất cả món ({menuItems.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id.toString())}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id.toString()
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-dark-950 shadow-md shadow-amber-500/20'
                : 'bg-dark-850 text-slate-300 hover:bg-dark-800 border border-dark-700 hover:border-amber-500/30'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 3. Items List / Table */}
      <div className="rounded-2xl bg-dark-850 border border-dark-700/80 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Đang tải danh sách món ăn...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Utensils className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-300">Chưa có món ăn nào trong danh mục này</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900/80 border-b border-dark-700 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Món ăn</th>
                  <th className="px-5 py-3.5">Loại & Danh mục</th>
                  <th className="px-5 py-3.5">Đơn giá bán</th>
                  <th className="px-5 py-3.5">Hết món hôm nay (Hot)</th>
                  <th className="px-5 py-3.5">Trạng thái chung</th>
                  <th className="px-5 py-3.5 text-center">Thao tác & Công thức</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/60">
                {filteredItems.map((item) => {
                  const cat = categories.find((c) => c.id === item.category_id);
                  const isSoldOut = Boolean(item.is_sold_out_today);
                  const isCombo = item.item_type === 'combo';
                  const isBuffet = item.item_type === 'buffet';
                  
                  return (
                    <tr key={item.id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.image_url ||
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'
                            }
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover border border-dark-700 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-100 text-sm">{item.name}</span>
                              {item.is_featured && (
                                <span className="p-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  <Sparkles className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                              {item.description || 'Chưa có mô tả'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-300">
                        <div className="flex flex-col gap-1">
                          <span>{cat?.name || 'Khác'}</span>
                          {isCombo && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 w-fit font-bold">
                              🍱 Combo
                            </span>
                          )}
                          {isBuffet && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 w-fit font-bold">
                              🥩 Buffet 2h
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-extrabold text-amber-400 text-sm">
                        {formatPrice(item.price)}
                        <span className="block text-[10px] text-slate-400 font-normal">/{item.unit || 'Phần'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleToggleSoldOutToday(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                            isSoldOut
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-md shadow-rose-500/20 animate-pulse'
                              : 'bg-dark-900 text-slate-400 border-dark-700 hover:border-amber-500/40 hover:text-slate-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSoldOut ? 'bg-rose-400' : 'bg-slate-600'
                            }`}
                          />
                          {isSoldOut ? '🔴 HẾT HÔM NAY (HOT)' : 'Còn nguyên liệu'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleToggleAvailable(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                            item.is_available
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.is_available ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                          />
                          {item.is_available ? 'Kinh doanh' : 'Ngừng bán'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Recipe BOM Button */}
                          <button
                            onClick={() => setSelectedRecipeDish(item)}
                            title="Công thức định mức nguyên liệu & giá vốn"
                            className="px-2 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex items-center gap-1 font-bold text-[11px]"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>Định Mức</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Sửa món"
                            className="p-1.5 rounded-lg bg-dark-900 border border-dark-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteItem(item)}
                              title="Xóa món"
                              className="p-1.5 rounded-lg bg-dark-900 border border-dark-700 text-slate-300 hover:text-red-400 hover:border-red-500/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recipe Management Modal */}
      {selectedRecipeDish && (
        <RecipeModal
          isOpen={!!selectedRecipeDish}
          onClose={() => setSelectedRecipeDish(null)}
          dish={selectedRecipeDish}
        />
      )}

      {/* 4. Add/Edit Dish Modal */}
      {isItemModalOpen && (
        <Modal
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          title={editingItem ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
          icon={Utensils}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSubmitItem} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Danh mục *</label>
                <SearchableSelect
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  placeholder="-- Chọn danh mục món --"
                  searchPlaceholder="Tìm kiếm danh mục..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Tên món ăn *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bò Wagyu Nướng Đá"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Giá bán (VNĐ) *</label>
                <input
                  type="number"
                  placeholder="Ví dụ: 120000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Đơn vị tính</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đĩa, Nồi, Phần, Ly, Lon"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Link ảnh món ăn (URL)</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Mô tả món ăn</label>
              <textarea
                rows={2}
                placeholder="Nguyên liệu, cách chế biến, hương vị..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>Còn hàng (Sẵn sàng phục vụ)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-400">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>Món Đặc Sản / Nổi Bật (Featured)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-700">
              <Button variant="ghost" onClick={() => setIsItemModalOpen(false)} disabled={submitting}>
                Hủy
              </Button>
              <Button variant="primary" type="submit" loading={submitting}>
                {editingItem ? 'Lưu Thay Đổi' : 'Thêm Món Ăn'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. Add Category Modal */}
      {isCategoryModalOpen && (
        <Modal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          title="Thêm Danh Mục Thực Đơn"
          icon={FolderPlus}
          maxWidth="max-w-sm"
        >
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Tên danh mục *</label>
              <input
                type="text"
                placeholder="Ví dụ: Món Nướng, Trà & Cà Phê..."
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Biểu tượng</label>
              <select
                value={catIcon}
                onChange={(e) => setCatIcon(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Utensils">Utensils (Đồ ăn chung)</option>
                <option value="Soup">Soup (Khai vị / Súp)</option>
                <option value="Flame">Flame (Món nướng / Lửa)</option>
                <option value="CookingPot">CookingPot (Lẩu)</option>
                <option value="Salad">Salad (Rau củ)</option>
                <option value="Coffee">Coffee (Đồ uống)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-700">
              <Button variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                Thêm Danh Mục
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
