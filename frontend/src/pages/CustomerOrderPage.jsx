import React, { useState, useEffect } from 'react';
import {
  Utensils,
  ShoppingBag,
  Sparkles,
  Search,
  Flame,
  Star,
  Gift,
  Trophy,
  Phone,
  User,
  Heart,
  ChevronLeft,
  ChevronRight,
  MessageSquareHeart,
  Tag,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Award,
  Crown,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { LuckyWheelModal } from '../components/customer/LuckyWheelModal';
import { CardMatchingModal } from '../components/customer/CardMatchingModal';
import { FeedbackModal } from '../components/customer/FeedbackModal';
import { CustomerCartDrawer } from '../components/customer/CustomerCartDrawer';
import SearchableSelect from '../components/common/SearchableSelect';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const CustomerOrderPage = ({ onSwitchToAdmin }) => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItemType, setSelectedItemType] = useState('all'); // 'all' | 'a_la_carte' | 'combo' | 'buffet'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  // Customer Loyalty State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Mini Game & Feedback Modals
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Auto carousel slide
  useEffect(() => {
    if (promotions.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promotions.length]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [catRes, menuRes, promoRes, tableRes] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/menu/items'),
        api.get('/promotions?active_only=true'),
        api.get('/tables')
      ]);

      if (catRes.success) setCategories(catRes.data || []);
      if (menuRes.success) setMenuItems(menuRes.data || []);
      if (promoRes.success) setPromotions(promoRes.data || []);
      if (tableRes.success) {
        setTables(tableRes.data || []);
        if (tableRes.data && tableRes.data.length > 0) {
          setSelectedTableId(String(tableRes.data[0].id));
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Không thể tải danh sách thực đơn món ăn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLookupMember = async (e) => {
    if (e) e.preventDefault();
    if (!customerPhone || customerPhone.trim().length < 9) {
      addToast('Vui lòng nhập số điện thoại hợp lệ', 'warning');
      return;
    }

    try {
      const res = await api.post('/customers/lookup', { phone: customerPhone });
      if (res.success && res.data) {
        setCustomerData(res.data);
        setShowMemberModal(false);
        addToast(`Xin chào ${res.data.full_name}! Bạn đang có ${res.data.points} Điểm Thưởng.`, 'success');
      }
    } catch (err) {
      addToast(err.message || 'Lỗi tra cứu thông tin hội viên', 'error');
    }
  };

  const handleAddToCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
    addToast(`Đã thêm "${item.name}" vào giỏ gọi món!`, 'info');
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCartItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
  };

  const handleUpdateNotes = (itemId, notes) => {
    setCartItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, notes } : i)));
  };

  const handleRemoveItem = (itemId) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const currentTable = tables.find((t) => String(t.id) === String(selectedTableId)) || tables[0];

  const tableOptions = tables.map((t) => ({
    value: String(t.id),
    label: `${t.table_name} (${t.area} - ${t.capacity} chỗ)`
  }));

  const filteredItems = menuItems.filter((item) => {
    const matchCategory = selectedCategory === 'all' || String(item.category_id) === String(selectedCategory);
    const matchType =
      selectedItemType === 'all'
        ? true
        : selectedItemType === 'a_la_carte'
        ? !item.item_type || item.item_type === 'a_la_carte'
        : item.item_type === selectedItemType;
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchType && matchSearch;
  });

  const cartTotalCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'diamond':
        return { label: 'Hội Viên Kim Cương', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'gold':
        return { label: 'Hội Viên Vàng', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'silver':
        return { label: 'Hội Viên Bạc', color: 'bg-slate-300/20 text-slate-200 border-slate-300/40' };
      default:
        return { label: 'Hội Viên Đồng', color: 'bg-orange-800/30 text-orange-300 border-orange-700/40' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-6 space-y-6 animate-pulse">
        <div className="h-20 bg-neutral-900 rounded-3xl" />
        <div className="h-64 bg-neutral-900 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-64 bg-neutral-900 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const activePromo = promotions[activeBannerIdx] || promotions[0];

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 pb-24 font-sans selection:bg-amber-500 selection:text-black">
      {/* 1. Luxurious Top Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-amber-500/20 shadow-2xl px-3 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black font-black text-sm sm:text-lg shadow-lg shadow-amber-500/20 shrink-0">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-950" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base md:text-lg font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                <span className="truncate">HOÀNG GIA QUÁN</span>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase shrink-0 hidden xs:inline">
                  Menu Bàn
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 hidden lg:block truncate">
                Ẩm Thực Tinh Hoa Việt • Tự Chọn Món Tại Bàn
              </p>
            </div>
          </div>

          {/* Right Actions: Table Selector, Member Points, Cart, Admin Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Table Selector */}
            <div className="w-24 sm:w-36 md:w-44">
              <SearchableSelect
                options={tableOptions}
                value={selectedTableId}
                onChange={(val) => setSelectedTableId(val)}
                placeholder="Bàn..."
                className="text-xs"
              />
            </div>

            {/* Member Profile Button */}
            {customerData ? (
              <button
                onClick={() => setShowMemberModal(true)}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-900 border border-amber-500/30 hover:border-amber-500 flex items-center gap-1.5 transition text-xs"
                title="Xem thông tin tích điểm"
              >
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-extrabold text-amber-400 hidden sm:inline">{customerData.points}đ</span>
              </button>
            ) : (
              <button
                onClick={() => setShowMemberModal(true)}
                className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition"
                title="Tích Điểm VIP"
              >
                <Award className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Tích Điểm</span>
              </button>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black shadow-lg shadow-amber-500/25 flex items-center gap-1.5 transition transform active:scale-95"
              title="Xem Giỏ Hàng"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="text-xs hidden md:inline">Giỏ Hàng</span>
              {cartTotalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-600 text-white text-[10px] sm:text-[11px] font-black flex items-center justify-center border-2 border-neutral-950 shadow">
                  {cartTotalCount}
                </span>
              )}
            </button>

            {/* Admin/POS Toggle */}
            {onSwitchToAdmin && (
              <button
                onClick={onSwitchToAdmin}
                className="p-2 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-md flex items-center gap-1.5 transition"
                title="Quay lại Chế Độ Quản Trị / Thu Ngân POS"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden xl:inline">Quản Trị POS</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Creative Live Ticker */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-neutral-950 py-1.5 px-4 text-xs font-black flex items-center justify-center gap-2 overflow-hidden shadow-inner">
        <Flame className="w-4 h-4 animate-bounce shrink-0" />
        <span className="truncate">
          🔥 ĐẠI TIỆC HOÀNG GIA: Giảm 20% Bò Wagyu Nướng Đá • Chơi Vòng Quay May Mắn trúng 100% quà tặng & Tích điểm đổi tiền mặt ngay tại bàn!
        </span>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-8">
        {/* 3. Creative Promotions & Advertising Banner Carousel */}
        {promotions.length > 0 && activePromo && (
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 bg-neutral-900 group">
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              <img
                src={activePromo.banner_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'}
                alt={activePromo.title}
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition duration-700 filter brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

              {/* Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-neutral-950 shadow-md">
                    {activePromo.badge_text || 'HOT DEAL'}
                  </span>
                  {activePromo.discount_percent > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500 text-white shadow">
                      GIẢM {activePromo.discount_percent}%
                    </span>
                  )}
                  {activePromo.discount_code && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neutral-900/80 text-amber-300 border border-amber-500/40">
                      Mã: {activePromo.discount_code}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                  {activePromo.title}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl line-clamp-2 drop-shadow">
                  {activePromo.subtitle || activePromo.description}
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (activePromo.discount_code) {
                        navigator.clipboard.writeText(activePromo.discount_code);
                        addToast(`Đã sao chép mã ưu đãi "${activePromo.discount_code}"!`, 'success');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow-lg transition flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5" /> Lấy Mã Giảm Giá
                  </button>
                  <button
                    onClick={() => setShowWheelModal(true)}
                    className="px-4 py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 border border-amber-500/40 font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <Gift className="w-3.5 h-3.5" /> Thử Vận May
                  </button>
                </div>
              </div>
            </div>

            {/* Carousel Indicators & Arrows */}
            {promotions.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveBannerIdx((prev) => (prev === 0 ? promotions.length - 1 : prev - 1))
                  }
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-neutral-950/60 hover:bg-neutral-900 text-white border border-neutral-700 backdrop-blur-sm transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveBannerIdx((prev) => (prev + 1) % promotions.length)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-neutral-950/60 hover:bg-neutral-900 text-white border border-neutral-700 backdrop-blur-sm transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-neutral-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-800">
                  {promotions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveBannerIdx(idx)}
                      className={`h-2 rounded-full transition-all ${
                        activeBannerIdx === idx ? 'w-6 bg-amber-400' : 'w-2 bg-neutral-600'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 4. Interactive Customer Experience & Mini Game Hub */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Game 1: Lucky Wheel */}
          <div
            onClick={() => setShowWheelModal(true)}
            className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-neutral-900 to-neutral-900 border border-amber-500/30 hover:border-amber-500/80 transition-all transform hover:-translate-y-1 cursor-pointer shadow-xl relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                100% Trúng Thưởng
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:rotate-45 transition duration-500">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-base font-black text-white group-hover:text-amber-400 transition">
                Vòng Quay May Mắn Hoàng Gia
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Quay ngay để nhận Voucher 20%, Free trà đào cam sả & điểm thưởng tích lũy!
              </p>
            </div>
          </div>

          {/* Game 2: Card Matching */}
          <div
            onClick={() => setShowCardsModal(true)}
            className="p-5 rounded-3xl bg-gradient-to-br from-orange-500/15 via-neutral-900 to-neutral-900 border border-orange-500/30 hover:border-orange-500/80 transition-all transform hover:-translate-y-1 cursor-pointer shadow-xl relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                Game Trí Nhớ +300 Điểm
              </span>
              <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-base font-black text-white group-hover:text-orange-400 transition">
                Lật Thẻ Bài Tìm Món Ăn
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Tìm các cặp món ăn đặc sản của quán nhanh nhất để nhận ngay +300 điểm hội viên.
              </p>
            </div>
          </div>

          {/* Action 3: Feedback & Review */}
          <div
            onClick={() => setShowFeedbackModal(true)}
            className="p-5 rounded-3xl bg-gradient-to-br from-yellow-500/15 via-neutral-900 to-neutral-900 border border-yellow-500/30 hover:border-yellow-500/80 transition-all transform hover:-translate-y-1 cursor-pointer shadow-xl relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                Tặng +30 Điểm Tri Ân
              </span>
              <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-base font-black text-white group-hover:text-yellow-400 transition">
                Đánh Giá Trải Nghiệm Món Ăn
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Góp ý và chấm sao cho quán để giúp chúng tôi hoàn thiện chất lượng phục vụ tốt nhất.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Menu Search & Category Tabs */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Utensils className="w-6 h-6 text-amber-400" />
                Thực Đơn Món Ăn Thượng Hạng
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Bàn đang chọn: <span className="text-amber-300 font-bold">{currentTable?.table_name}</span> ({currentTable?.area})
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món ngon (Wagyu, Lẩu...)"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-amber-500 outline-none shadow-inner"
              />
            </div>
          </div>

          {/* Type Filters (Món Lẻ / Combo / Buffet) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedItemType('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all shadow-md ${
                selectedItemType === 'all'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 shadow-amber-500/20'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              🍽️ Tất Cả Món ({menuItems.length})
            </button>

            <button
              onClick={() => setSelectedItemType('a_la_carte')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-md ${
                selectedItemType === 'a_la_carte'
                  ? 'bg-amber-500 text-neutral-950 shadow-amber-500/20'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              🍲 Gọi Món Lẻ
            </button>

            <button
              onClick={() => setSelectedItemType('combo')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-md ${
                selectedItemType === 'combo'
                  ? 'bg-indigo-600 text-white shadow-indigo-500/30'
                  : 'bg-neutral-900 text-indigo-400 hover:text-white border border-neutral-800'
              }`}
            >
              🍱 Combo Tiết Kiệm (Hot)
            </button>

            <button
              onClick={() => setSelectedItemType('buffet')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-md ${
                selectedItemType === 'buffet'
                  ? 'bg-rose-600 text-white shadow-rose-500/30'
                  : 'bg-neutral-900 text-rose-400 hover:text-white border border-neutral-800'
              }`}
            >
              🥩 Buffet Thả Ga 2 Giờ
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-neutral-700 text-white'
                  : 'bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              Tất Cả Danh Mục
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
                  String(selectedCategory) === String(cat.id)
                    ? 'bg-neutral-700 text-white'
                    : 'bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Food Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const inCart = cartItems.find((i) => i.id === item.id);
            const isSoldOut = Boolean(item.is_sold_out_today);
            const isCombo = item.item_type === 'combo';
            const isBuffet = item.item_type === 'buffet';

            return (
              <div
                key={item.id}
                className={`rounded-3xl bg-neutral-900 border transition-all duration-300 overflow-hidden flex flex-col justify-between group shadow-xl ${
                  isSoldOut
                    ? 'border-rose-500/40 opacity-90'
                    : isCombo
                    ? 'border-indigo-500/40 hover:border-indigo-500 shadow-indigo-500/5'
                    : isBuffet
                    ? 'border-amber-500/50 hover:border-amber-500 shadow-amber-500/10'
                    : 'border-neutral-800/80 hover:border-amber-500/40 hover:shadow-amber-500/10'
                }`}
              >
                {/* Image & Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-neutral-950">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'}
                    alt={item.name}
                    className={`w-full h-full object-cover transform transition duration-500 ${
                      isSoldOut ? 'grayscale-[40%]' : 'group-hover:scale-105'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />

                  {/* Hot Sold-Out Today Banner */}
                  {isSoldOut && (
                    <div className="absolute top-2 left-2 right-2 p-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-orange-600 to-rose-600 text-white text-center font-black text-[11px] shadow-lg animate-pulse border border-rose-400/50 flex items-center justify-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>HÔM NAY ĐÃ HẾT MÓN - MÓN CỰC HOT</span>
                    </div>
                  )}

                  {/* Type Badges if not sold out */}
                  {!isSoldOut && (
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {item.is_featured && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-neutral-950 shadow flex items-center gap-1 w-fit">
                          <Flame className="w-3 h-3" /> BEST SELLER
                        </span>
                      )}
                      {isCombo && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white shadow w-fit">
                          🍱 COMBO TIẾT KIỆM
                        </span>
                      )}
                      {isBuffet && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow w-fit">
                          🥩 BUFFET 2 GIỜ
                        </span>
                      )}
                    </div>
                  )}

                  <span className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-950/80 text-neutral-300 border border-neutral-700">
                    {isBuffet ? '120 Phút' : item.unit || 'Phần'}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description || 'Hương vị thơm ngon đậm đà, chế biến từ nguyên liệu tươi sạch thượng hạng.'}
                    </p>

                    {/* Combo Item Breakdown List */}
                    {isCombo && item.combo_items && Array.isArray(item.combo_items) && (
                      <div className="mt-2.5 p-2 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[10px] text-indigo-200 space-y-1">
                        <span className="font-bold text-indigo-300 block">Bao gồm các món:</span>
                        <div className="flex flex-wrap gap-1">
                          {item.combo_items.map((ci, idx) => {
                            const dishName = typeof ci === 'string' ? ci : (ci?.name || ci?.dish_name || 'Món');
                            const qty = typeof ci === 'object' && ci?.quantity ? `(x${ci.quantity})` : '';
                            return (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-indigo-900/50 border border-indigo-700/50 text-indigo-200 font-medium">
                                • {dishName} {qty}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Buffet Notice */}
                    {isBuffet && (
                      <div className="mt-2.5 p-2 rounded-xl bg-rose-950/30 border border-rose-500/20 text-[10px] text-rose-200">
                        <span className="font-bold text-rose-300">Quy định Buffet:</span> Áp dụng cho cả bàn, thời gian thưởng thức tối đa 2 giờ (120 phút).
                      </div>
                    )}
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                    <div>
                      {isCombo && item.original_price ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-neutral-500 line-through">
                              {formatPrice(item.original_price)}
                            </span>
                            <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400 font-black">
                              Tiết kiệm {formatPrice(item.original_price - item.price)}
                            </span>
                          </div>
                          <span className="text-base font-black text-amber-400">{formatPrice(item.price)}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] text-neutral-500 block">
                            {isBuffet ? 'Đơn giá / người' : 'Đơn giá'}
                          </span>
                          <span className="text-base font-black text-amber-400">{formatPrice(item.price)}</span>
                        </div>
                      )}
                    </div>

                    {isSoldOut ? (
                      <span className="px-3 py-1.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[11px] cursor-not-allowed">
                        Đã hết hôm nay
                      </span>
                    ) : inCart ? (
                      <div className="flex items-center gap-1.5 bg-neutral-950 border border-amber-500/40 rounded-2xl p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, inCart.quantity - 1)}
                          className="w-7 h-7 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black text-amber-400 w-5 text-center">{inCart.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, inCart.quantity + 1)}
                          className="w-7 h-7 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="px-3 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 text-amber-300 hover:text-neutral-950 font-black text-xs transition flex items-center gap-1 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm Món
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Cart Bar for Mobile */}
      {cartTotalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full p-3.5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-neutral-950 font-black shadow-2xl shadow-amber-500/40 flex items-center justify-between px-6 transform active:scale-98 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-950 text-white font-black text-xs flex items-center justify-center">
                {cartTotalCount}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Xem Danh Sách Gọi Món</div>
                <div className="text-[11px] opacity-80">{currentTable?.table_name}</div>
              </div>
            </div>

            <div className="text-base font-black">
              {formatPrice(cartItems.reduce((s, i) => s + i.price * i.quantity, 0))} ➔
            </div>
          </button>
        </div>
      )}

      {/* Member Profile Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 text-white shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white">Chương Trình Hội Viên Hoàng Gia</h3>
              </div>
              <button onClick={() => setShowMemberModal(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            {customerData ? (
              <div className="space-y-3 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-neutral-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg">
                  {customerData.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-base text-white">{customerData.full_name}</h4>
                  <p className="text-xs text-neutral-400">{customerData.phone}</p>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Hạng thành viên</span>
                    <span className="font-bold text-amber-400 capitalize">{customerData.tier || 'Đồng'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Điểm tích lũy</span>
                    <span className="font-black text-emerald-400 text-sm">{customerData.points} ⭐</span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400">
                  Tích 10.000đ = 1 điểm. Đổi 100 điểm = giảm 10.000đ trực tiếp vào hóa đơn của bạn.
                </p>

                <Button variant="secondary" onClick={() => setCustomerData(null)} className="w-full text-xs">
                  Đổi Số Điện Thoại Khác
                </Button>
              </div>
            ) : (
              <form onSubmit={handleLookupMember} className="space-y-3">
                <p className="text-xs text-neutral-400">
                  Nhập số điện thoại để tích điểm tự động khi gọi món & nhận ngay{' '}
                  <span className="text-amber-400 font-bold">+50 Điểm Chào Mừng</span>!
                </p>

                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0988xxxxxx"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <Button variant="primary" type="submit" className="w-full font-black text-xs py-2.5">
                  Tra Cứu & Đăng Ký Hội Viên
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Mini Game Modals */}
      <LuckyWheelModal
        isOpen={showWheelModal}
        onClose={() => setShowWheelModal(false)}
        initialPhone={customerData?.phone || customerPhone}
        initialName={customerData?.full_name || ''}
        onRewardClaimed={(data) => {
          if (data?.updated_customer) setCustomerData(data.updated_customer);
        }}
      />

      <CardMatchingModal
        isOpen={showCardsModal}
        onClose={() => setShowCardsModal(false)}
        initialPhone={customerData?.phone || customerPhone}
        initialName={customerData?.full_name || ''}
        onRewardClaimed={(data) => {
          if (data?.updated_customer) setCustomerData(data.updated_customer);
        }}
      />

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        initialPhone={customerData?.phone || customerPhone}
        initialName={customerData?.full_name || ''}
        tableName={currentTable?.table_name}
      />

      {/* Cart Drawer */}
      <CustomerCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdateNotes={handleUpdateNotes}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        table={currentTable}
        customerInfo={customerData}
        onOrderSuccess={() => {
          fetchInitialData();
        }}
      />

      {/* Floating Bottom Cart Bar for Mobile & Quick Order */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 max-w-xl mx-auto z-40 animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-neutral-950 font-black shadow-2xl shadow-amber-500/30 flex items-center justify-between transition transform active:scale-[0.98] border-2 border-neutral-950"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-950 text-amber-400 flex items-center justify-center font-black text-xs shadow">
                {cartItems.reduce((s, i) => s + i.quantity, 0)}
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm leading-tight font-extrabold">
                  Đã Chọn ({currentTable?.table_name || 'Bàn'})
                </div>
                <div className="text-[10px] sm:text-[11px] opacity-80 font-bold">Chạm xem giỏ & gửi vào bếp</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black">
                {formatPrice(cartItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0))}
              </span>
              <ShoppingBag className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
