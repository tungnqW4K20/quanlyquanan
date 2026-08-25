import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  MessageSquareHeart,
  Star,
  Search,
  Crown,
  Phone,
  Calendar,
  Gift,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const CustomerManagementPage = () => {
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'feedbacks'
  const [customers, setCustomers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, feedRes] = await Promise.all([
        api.get('/customers'),
        api.get('/customers/feedbacks')
      ]);

      if (custRes.success) setCustomers(custRes.data || []);
      if (feedRes.success) setFeedbacks(feedRes.data || []);
    } catch (err) {
      addToast('Không thể tải dữ liệu hội viên và phản hồi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'diamond':
        return { label: 'Hội Viên Kim Cương 💎', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'gold':
        return { label: 'Hội Viên Vàng 🥇', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'silver':
        return { label: 'Hội Viên Bạc 🥈', color: 'bg-slate-300/20 text-slate-200 border-slate-300/40' };
      default:
        return { label: 'Hội Viên Đồng 🥉', color: 'bg-orange-800/30 text-orange-300 border-orange-700/40' };
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      !searchQuery ||
      c.phone.includes(searchQuery) ||
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTier = tierFilter === 'all' || c.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const avgFood =
    feedbacks.length > 0
      ? (feedbacks.reduce((s, f) => s + (f.food_rating || 5), 0) / feedbacks.length).toFixed(1)
      : '5.0';
  const avgService =
    feedbacks.length > 0
      ? (feedbacks.reduce((s, f) => s + (f.service_rating || 5), 0) / feedbacks.length).toFixed(1)
      : '5.0';
  const avgOverall =
    feedbacks.length > 0
      ? (feedbacks.reduce((s, f) => s + (f.overall_rating || 5), 0) / feedbacks.length).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-orange-500/15 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Quản Trị Quan Hệ Khách Hàng (CRM)
            </span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Hội Viên Tích Điểm & Đánh Giá Trải Nghiệm
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Theo dõi khách hàng thân thiết, điểm thưởng tích lũy và lắng nghe ý kiến đánh giá trực tiếp tại bàn
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 shrink-0">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-amber-500 text-neutral-950 shadow-lg'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" /> Danh Sách Hội Viên ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('feedbacks')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'feedbacks'
                ? 'bg-amber-500 text-neutral-950 shadow-lg'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <MessageSquareHeart className="w-4 h-4" /> Đánh Giá & Review ({feedbacks.length})
          </button>
        </div>
      </div>

      {/* 2. TAB 1: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Filter & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo SĐT hoặc Tên hội viên..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
              {['all', 'diamond', 'gold', 'silver', 'bronze'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                    tierFilter === tier
                      ? 'bg-amber-500 text-neutral-950'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                  }`}
                >
                  {tier === 'all' ? 'Tất cả hạng' : tier}
                </button>
              ))}
            </div>
          </div>

          {/* Members Table */}
          <div className="rounded-3xl bg-neutral-900 border border-neutral-800/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 font-bold border-b border-neutral-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Hội Viên</th>
                    <th className="py-3.5 px-4">Số Điện Thoại</th>
                    <th className="py-3.5 px-4">Hạng Thành Viên</th>
                    <th className="py-3.5 px-4 text-right">Điểm Tích Lũy</th>
                    <th className="py-3.5 px-4 text-right">Tổng Chi Tiêu</th>
                    <th className="py-3.5 px-4 text-center">Số Lần Đến</th>
                    <th className="py-3.5 px-4">Ghi Chú Sở Thích</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-500">
                        Không tìm thấy hội viên phù hợp
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const tier = getTierBadge(cust.tier);
                      return (
                        <tr key={cust.id} className="hover:bg-neutral-950/40 transition">
                          <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-neutral-950 font-black flex items-center justify-center text-xs shrink-0">
                              {cust.full_name.charAt(0)}
                            </div>
                            <span>{cust.full_name}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-neutral-300">{cust.phone}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${tier.color}`}>
                              {tier.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-amber-400 text-sm">
                            {cust.points} ⭐
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                            {formatPrice(cust.total_spent)}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-neutral-300">
                            {cust.visits_count || 1} lần
                          </td>
                          <td className="py-3.5 px-4 text-neutral-400 text-[11px] max-w-xs truncate">
                            {cust.notes || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 2: FEEDBACKS & REVIEWS */}
      {activeTab === 'feedbacks' && (
        <div className="space-y-6">
          {/* Rating KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-neutral-900 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-400 uppercase">Hương Vị Món Ăn</span>
                <div className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-1.5">
                  {avgFood} <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <span className="text-[10px] text-neutral-500">Dựa trên {feedbacks.length} lượt đánh giá</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 font-black text-lg">98%</div>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900 border border-orange-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-400 uppercase">Thái Độ Phục Vụ</span>
                <div className="text-2xl font-black text-orange-400 mt-1 flex items-center gap-1.5">
                  {avgService} <Star className="w-5 h-5 fill-orange-400" />
                </div>
                <span className="text-[10px] text-neutral-500">Nhanh nhẹn, chu đáo</span>
              </div>
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 font-black text-lg">99%</div>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-400 uppercase">Độ Hài Lòng Chung</span>
                <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-1.5">
                  {avgOverall} <Star className="w-5 h-5 fill-emerald-400" />
                </div>
                <span className="text-[10px] text-neutral-500">Tuyệt vời thượng hạng</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 font-black text-lg">100%</div>
            </div>
          </div>

          {/* Feedbacks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 text-amber-400 font-bold flex items-center justify-center text-xs">
                      {fb.customer_name ? fb.customer_name.charAt(0) : 'K'}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-white">{fb.customer_name || 'Khách Ẩn Danh'}</h4>
                      <p className="text-[10px] text-neutral-500">{fb.table_name || 'Tại bàn'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(fb.overall_rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed italic bg-neutral-950 p-3 rounded-2xl border border-neutral-800/80">
                  "{fb.comment || 'Món ăn rất ngon, phục vụ tận tình chu đáo!'}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-2 border-t border-neutral-800">
                  <span>Món: {fb.food_rating}⭐ • Phục vụ: {fb.service_rating}⭐</span>
                  <span>{fb.created_at ? fb.created_at.slice(0, 10) : 'Hôm nay'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
