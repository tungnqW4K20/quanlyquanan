import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Flame,
  Soup,
  CookingPot,
  Salad,
  Coffee,
  Utensils,
  Sparkles,
  Check
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const MenuPicker = ({ onSelectItem }) => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItemType, setSelectedItemType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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

      if (catsRes.success) setCategories(catsRes.data);
      if (itemsRes.success) setMenuItems(itemsRes.data);
    } catch (err) {
      addToast('Không thể tải danh sách thực đơn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Soup':
        return <Soup className="w-4 h-4" />;
      case 'Flame':
        return <Flame className="w-4 h-4" />;
      case 'CookingPot':
        return <CookingPot className="w-4 h-4" />;
      case 'Salad':
        return <Salad className="w-4 h-4" />;
      case 'Coffee':
        return <Coffee className="w-4 h-4" />;
      default:
        return <Utensils className="w-4 h-4" />;
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category_id === parseInt(selectedCategory);
    const matchType =
      selectedItemType === 'all'
        ? true
        : selectedItemType === 'a_la_carte'
        ? !item.item_type || item.item_type === 'a_la_carte'
        : item.item_type === selectedItemType;
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchType && matchSearch;
  });

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm món ăn, đồ uống, combo, lẩu buffet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-dark-850 border border-dark-700 rounded-xl text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Mode Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedItemType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedItemType === 'all'
              ? 'bg-amber-500 text-dark-950 font-black shadow-md shadow-amber-500/20'
              : 'bg-dark-850 text-slate-300 border border-dark-700 hover:border-amber-500/30'
          }`}
        >
          Tất cả ({menuItems.length})
        </button>
        <button
          onClick={() => setSelectedItemType('a_la_carte')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedItemType === 'a_la_carte'
              ? 'bg-amber-500 text-dark-950 font-black shadow-md shadow-amber-500/20'
              : 'bg-dark-850 text-slate-300 border border-dark-700 hover:border-amber-500/30'
          }`}
        >
          🍲 Món Lẻ
        </button>
        <button
          onClick={() => setSelectedItemType('combo')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedItemType === 'combo'
              ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/30'
              : 'bg-dark-850 text-indigo-400 border border-dark-700 hover:border-indigo-500/30'
          }`}
        >
          🍱 Combo Tiết Kiệm
        </button>
        <button
          onClick={() => setSelectedItemType('buffet')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedItemType === 'buffet'
              ? 'bg-rose-600 text-white font-black shadow-md shadow-rose-600/30'
              : 'bg-dark-850 text-rose-400 border border-dark-700 hover:border-rose-500/30'
          }`}
        >
          🥩 Buffet 2h
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-dark-700 text-slate-100'
              : 'bg-dark-900/60 text-slate-400 hover:bg-dark-800 border border-dark-700/60'
          }`}
        >
          <Utensils className="w-3 h-3" />
          Tất cả danh mục
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id.toString())}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id.toString()
                ? 'bg-dark-700 text-slate-100'
                : 'bg-dark-900/60 text-slate-400 hover:bg-dark-800 border border-dark-700/60'
            }`}
          >
            {getCategoryIcon(cat.icon)}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Dishes Grid */}
      <div className="flex-1 overflow-y-auto pr-1 max-h-[60vh]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-32 rounded-2xl bg-dark-850/60 border border-dark-700 animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400">
            <Utensils className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-semibold">Không tìm thấy món ăn phù hợp</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const isSoldOut = Boolean(item.is_sold_out_today);
              const isCombo = item.item_type === 'combo';
              const isBuffet = item.item_type === 'buffet';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSoldOut) {
                      addToast(`Món "${item.name}" hôm nay đã hết món sớm do quá hot!`, 'warning');
                      return;
                    }
                    onSelectItem(item);
                  }}
                  className={`group p-3 rounded-2xl bg-dark-850 border transition-all duration-200 glass-card-hover flex flex-col justify-between relative overflow-hidden ${
                    isSoldOut
                      ? 'border-rose-500/40 opacity-80 cursor-not-allowed'
                      : isCombo
                      ? 'border-indigo-500/40 hover:border-indigo-500 cursor-pointer'
                      : isBuffet
                      ? 'border-amber-500/40 hover:border-amber-500 cursor-pointer'
                      : 'border-dark-700/80 hover:border-amber-500/40 cursor-pointer'
                  }`}
                >
                  {isSoldOut && (
                    <div className="absolute top-1 left-1 right-1 py-0.5 px-2 bg-gradient-to-r from-rose-600 via-orange-600 to-rose-600 text-white text-center font-black text-[10px] rounded-lg shadow-md animate-pulse z-10">
                      🔴 HÔM NAY ĐÃ HẾT MÓN (HOT)
                    </div>
                  )}

                  <div className={`flex gap-3 ${isSoldOut ? 'pt-5' : ''}`}>
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-dark-700">
                      <img
                        src={
                          item.image_url ||
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'
                        }
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isSoldOut ? 'grayscale-[50%]' : 'group-hover:scale-105'
                        }`}
                      />
                      {item.is_featured && !isSoldOut && (
                        <span className="absolute top-1 left-1 bg-amber-500 text-dark-950 p-0.5 rounded-md shadow-md">
                          <Sparkles className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-100 line-clamp-1 group-hover:text-amber-400 transition-colors">
                            {item.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                          {item.description || 'Hương vị thơm ngon đậm đà đặc sản.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex flex-col">
                          {isCombo && item.original_price && (
                            <span className="text-[9px] text-slate-500 line-through">
                              {formatPrice(item.original_price)}
                            </span>
                          )}
                          <span className="text-xs font-black text-amber-400 font-mono">
                            {formatPrice(item.price)}
                          </span>
                        </div>

                        <span className="text-[9px] text-slate-400 bg-dark-900 px-1.5 py-0.5 rounded border border-dark-700">
                          {isBuffet ? '120 Phút' : item.unit || 'Phần'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add button bar */}
                  <div className="mt-2 pt-1.5 border-t border-dark-700/60 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-amber-400">
                    <span>{isSoldOut ? 'Đã hết hôm nay' : isBuffet ? 'Chọn gói Buffet' : isCombo ? 'Chọn Combo' : 'Bấm để thêm món'}</span>
                    <div className={`p-1 rounded-lg transition-colors ${isSoldOut ? 'bg-dark-800 text-slate-600' : 'bg-dark-800 group-hover:bg-amber-500 group-hover:text-dark-950'}`}>
                      <Plus className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
