import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, Sparkles, RefreshCw, Flame, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { KitchenCard } from '../components/kitchen/KitchenCard';
import ChefCookingHistoryModal from '../components/kitchen/ChefCookingHistoryModal';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const KitchenPage = () => {
  const [tickets, setTickets] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const { addToast } = useToast();

  const fetchTicketsAndChefs = async () => {
    try {
      const [tRes, uRes] = await Promise.all([
        api.get('/kitchen/tickets'),
        api.get('/users')
      ]);

      if (tRes.success && tRes.data) {
        setTickets(tRes.data);
      }
      if (uRes.success && uRes.data) {
        setChefs(uRes.data.filter((u) => u.role === 'chef'));
      }
    } catch (err) {
      // ignore poll err
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsAndChefs();
    const interval = setInterval(fetchTicketsAndChefs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (itemId, newStatus, chefName) => {
    try {
      const payload = { status: newStatus };
      if (chefName) payload.chef_name = chefName;

      const res = await api.patch(`/kitchen/tickets/${itemId}/status`, payload);
      if (res.success) {
        addToast(res.message || 'Cập nhật tiến độ món thành công', 'success');
        fetchTicketsAndChefs();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const handleAssignChef = async (itemId, chefName, startCooking = false) => {
    try {
      const chefObj = chefs.find((c) => c.full_name === chefName);
      const res = await api.post(`/kitchen/tickets/${itemId}/assign-chef`, {
        chef_id: chefObj ? chefObj.id : null,
        chef_name: chefName,
        start_cooking: startCooking
      });
      if (res.success) {
        addToast(res.message || `Đã phân công ${chefName} nấu món này!`, 'success');
        fetchTicketsAndChefs();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi phân công đầu bếp', 'error');
    }
  };

  const pendingCount = tickets.filter((t) => t.item_status === 'pending').length;
  const cookingCount = tickets.filter((t) => t.item_status === 'cooking').length;
  const readyCount = tickets.filter((t) => t.item_status === 'ready').length;
  const servedCount = tickets.filter((t) => t.item_status === 'served').length;

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'all') return t.item_status !== 'served';
    if (filterStatus === 'all_incl_served') return true;
    return t.item_status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-dark-850 border border-dark-700 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Tổng món cần làm</span>
            <h3 className="text-2xl font-extrabold text-slate-100">
              {pendingCount + cookingCount + readyCount} món
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-amber-400">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-850 border border-red-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-red-400 font-medium">Chờ vào bếp</span>
            <h3 className="text-2xl font-extrabold text-red-400">{pendingCount} món</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-850 border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-400 font-medium">Đang chế biến</span>
            <h3 className="text-2xl font-extrabold text-amber-400">{cookingCount} món</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-850 border border-cyan-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-cyan-400 font-medium">Đã xong (Chờ bê món)</span>
            <h3 className="text-2xl font-extrabold text-cyan-400">{readyCount} món</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Manual Refresh */}
      <div className="p-4 rounded-2xl bg-dark-850 border border-dark-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-dark-950 shadow-md shadow-amber-500/20'
                : 'bg-dark-900 text-slate-400 border border-dark-700 hover:border-amber-500/30'
            }`}
          >
            Tất cả món đang chờ ({pendingCount + cookingCount + readyCount})
          </button>

          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'pending'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'bg-dark-900 text-slate-400 border border-dark-700 hover:border-red-500/30'
            }`}
          >
            Chờ nấu ({pendingCount})
          </button>

          <button
            onClick={() => setFilterStatus('cooking')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'cooking'
                ? 'bg-amber-500 text-dark-950 shadow-md shadow-amber-500/20'
                : 'bg-dark-900 text-slate-400 border border-dark-700 hover:border-amber-500/30'
            }`}
          >
            Đang nấu ({cookingCount})
          </button>

          <button
            onClick={() => setFilterStatus('ready')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'ready'
                ? 'bg-cyan-500 text-dark-950 shadow-md shadow-cyan-500/20'
                : 'bg-dark-900 text-slate-400 border border-dark-700 hover:border-cyan-500/30'
            }`}
          >
            Sẵn sàng lên bàn ({readyCount})
          </button>

          <button
            onClick={() => setFilterStatus('served')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'served'
                ? 'bg-emerald-500 text-dark-950 shadow-md shadow-emerald-500/20'
                : 'bg-dark-900 text-slate-400 border border-dark-700 hover:border-emerald-500/30'
            }`}
          >
            Đã lên bàn ({servedCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-neutral-950 font-black flex items-center gap-1.5 text-xs shadow-md shadow-amber-600/20 transition active:scale-[0.98]"
          >
            <History className="w-4 h-4 text-neutral-950" />
            <span className="hidden sm:inline">Hồ Sơ Nấu & Trả Món Đầu Bếp</span>
            <span className="sm:hidden">Lịch sử bếp</span>
          </button>

          <button
            onClick={fetchTicketsAndChefs}
            className="p-2 rounded-xl bg-dark-900 border border-dark-700 text-slate-400 hover:text-amber-400 flex items-center gap-1.5 text-xs font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Cập nhật</span>
          </button>
        </div>
      </div>

      {/* 3. Tickets Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-40 rounded-2xl bg-dark-850/60 border border-dark-700 animate-pulse" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <ChefHat className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nhà Bếp Hiện Đang Trống Vé</h3>
          <p className="text-xs text-slate-400 mt-1">Tất cả món ăn đã được phục vụ hoặc chưa có đơn hàng mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <KitchenCard
              key={ticket.item_id}
              ticket={ticket}
              chefsList={chefs}
              onUpdateStatus={handleUpdateStatus}
              onAssignChef={handleAssignChef}
            />
          ))}
        </div>
      )}

      {/* Chef Cooking History & Return Audit Modal */}
      <ChefCookingHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        chefs={chefs}
      />
    </div>
  );
};
