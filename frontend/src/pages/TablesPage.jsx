import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Users,
  Utensils,
  Search,
  Sparkles,
  RefreshCw,
  Layers,
  CalendarCheck
} from 'lucide-react';
import { TableCard } from '../components/pos/TableCard';
import { CartDrawer } from '../components/pos/CartDrawer';
import { MenuPicker } from '../components/pos/MenuPicker';
import { SwitchTableModal } from '../components/pos/SwitchTableModal';
import { TableDetailModal } from '../components/pos/TableDetailModal';
import { PaymentModal } from '../components/billing/PaymentModal';
import ReservationModal from '../components/pos/ReservationModal';
import StaffRulesBanner from '../components/pos/StaffRulesBanner';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [areas, setAreas] = useState(['Tất cả']);
  const [selectedArea, setSelectedArea] = useState('Tất cả');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTable, setSearchTable] = useState('');
  const [loading, setLoading] = useState(true);

  // Active modals
  const [orderingTable, setOrderingTable] = useState(null);
  const [checkingOutTarget, setCheckingOutTarget] = useState(null);
  const [switchingSourceTable, setSwitchingSourceTable] = useState(null);
  const [viewingDetailTable, setViewingDetailTable] = useState(null);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  // New Table Form (Admin)
  const [newTableName, setNewTableName] = useState('');
  const [newTableArea, setNewTableArea] = useState('Tầng 1');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [tableSubmitting, setTableSubmitting] = useState(false);

  const {
    orderCart,
    addToCart,
    updateCartQuantity,
    updateCartItemNotes,
    removeFromCart,
    clearCart,
    tableRefreshKey,
    triggerTableRefresh
  } = useOrder();

  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    fetchTables();
    fetchMenuItems();
  }, [tableRefreshKey]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tables');
      if (res.success && res.data) {
        setTables(res.data);
        const uniqueAreas = ['Tất cả', ...new Set(res.data.map((t) => t.area))];
        setAreas(uniqueAreas);
      }
    } catch (err) {
      addToast('Không thể tải sơ đồ bàn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await api.get('/menu/items');
      if (res.success && res.data) {
        setMenuItems(res.data);
      }
    } catch (err) {
      console.error('Fetch menu items error:', err);
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableName) {
      addToast('Vui lòng nhập tên bàn', 'warning');
      return;
    }

    setTableSubmitting(true);
    try {
      const res = await api.post('/tables', {
        table_name: newTableName,
        area: newTableArea,
        capacity: newTableCapacity
      });

      if (res.success) {
        addToast(`Thêm ${newTableName} thành công!`, 'success');
        setNewTableName('');
        setIsAddTableOpen(false);
        fetchTables();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi thêm bàn', 'error');
    } finally {
      setTableSubmitting(false);
    }
  };

  const filteredTables = tables.filter((table) => {
    const matchArea = selectedArea === 'Tất cả' || table.area === selectedArea;
    const matchStatus =
      selectedStatus === 'all'
        ? true
        : selectedStatus === 'reserved'
        ? table.has_reservation
        : selectedStatus === 'buffet'
        ? table.is_buffet
        : table.status === selectedStatus;
    const matchSearch = table.table_name.toLowerCase().includes(searchTable.toLowerCase());
    return matchArea && matchStatus && matchSearch;
  });

  // Table summary counts
  const totalCount = tables.length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const waitingCount = tables.filter((t) => t.status === 'waiting_food').length;
  const emptyCount = tables.filter((t) => t.status === 'empty').length;
  const reservedCount = tables.filter((t) => t.has_reservation).length;

  return (
    <div className="space-y-6">
      {/* 🌟 5-Star Staff Code of Conduct & Rules Banner */}
      <StaffRulesBanner />

      {/* 1. Top Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-dark-850 border border-dark-700/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Tổng số bàn</span>
            <h4 className="text-xl font-extrabold text-slate-100">{totalCount} bàn</h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-slate-300">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 font-medium">Bàn trống</span>
            <h4 className="text-xl font-extrabold text-emerald-400">{emptyCount} bàn</h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
            {Math.round((emptyCount / (totalCount || 1)) * 100)}%
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-orange-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-orange-400 font-medium">Đang ăn</span>
            <h4 className="text-xl font-extrabold text-orange-400">{occupiedCount} bàn</h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center font-bold">
            {Math.round((occupiedCount / (totalCount || 1)) * 100)}%
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-400 font-medium">Đang chờ món</span>
            <h4 className="text-xl font-extrabold text-amber-400">{waitingCount} bàn</h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
            {waitingCount}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-indigo-500/30 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-xs text-indigo-400 font-medium">Đặt trước</span>
            <h4 className="text-xl font-extrabold text-indigo-400">{reservedCount} bàn</h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold">
            {reservedCount}
          </div>
        </div>
      </div>

      {/* 2. Filter Bar & Search */}
      <div className="p-4 rounded-2xl bg-dark-850 border border-dark-700/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Area filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedArea === area
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-dark-950 shadow-md shadow-amber-500/20'
                  : 'bg-dark-900 text-slate-400 hover:text-slate-200 border border-dark-700 hover:border-amber-500/30'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        {/* Right: Status filter, search and Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-bold"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="empty">Bàn trống</option>
            <option value="occupied">Đang có khách</option>
            <option value="waiting_food">Chờ món bếp</option>
            <option value="reserved">Đã đặt trước ({reservedCount})</option>
            <option value="buffet">Bàn ăn Buffet</option>
          </select>

          {/* Search input */}
          <div className="relative flex-1 sm:w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên bàn..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-dark-900 border border-dark-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Reservation Management Button */}
          <button
            onClick={() => setIsReservationModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-[0.98]"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Đặt Bàn Trước ({reservedCount})</span>
          </button>

          {/* Add Table Button (Admin) */}
          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddTableOpen(true)}
            >
              Thêm Bàn
            </Button>
          )}
        </div>
      </div>

      {/* 3. Tables Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-dark-850/60 border border-dark-700 animate-pulse" />
          ))}
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <Utensils className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-300">Không tìm thấy bàn ăn phù hợp</p>
          <p className="text-xs text-slate-400 mt-1">Hãy thử thay đổi bộ lọc khu vực hoặc trạng thái bàn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onOpenOrder={(t) => setOrderingTable(t)}
              onOpenCheckout={(t, ord) => setCheckingOutTarget({ table: t, order: ord })}
              onOpenSwitch={(t) => setSwitchingSourceTable(t)}
              onOpenDetails={(t) => setViewingDetailTable(t)}
              onOpenReservation={(t) => setIsReservationModalOpen(true)}
            />
          ))}
        </div>
      )}

      {/* Reservation Management Modal */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        tables={tables}
        menuItems={menuItems}
        onRefresh={fetchTables}
      />

      {/* 4. Order Full Modal / Drawer */}
      {orderingTable && (
        <Modal
          isOpen={!!orderingTable}
          onClose={() => {
            setOrderingTable(null);
            clearCart();
          }}
          title={`Đặt Món Cho: ${orderingTable.table_name}`}
          icon={Utensils}
          maxWidth="max-w-6xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[72vh]">
            {/* Left: Menu Picker (8 cols) */}
            <div className="lg:col-span-8 overflow-hidden h-full">
              <MenuPicker onSelectItem={(item) => addToCart(item)} />
            </div>

            {/* Right: Cart Drawer (4 cols) */}
            <div className="lg:col-span-4 h-full rounded-2xl overflow-hidden">
              <CartDrawer
                table={orderingTable}
                cart={orderCart}
                onUpdateQuantity={updateCartQuantity}
                onUpdateNotes={updateCartItemNotes}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                onOrderSuccess={() => {
                  fetchTables();
                  setOrderingTable(null);
                }}
                onClose={() => {
                  setOrderingTable(null);
                  clearCart();
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Payment Modal */}
      {checkingOutTarget && (
        <PaymentModal
          isOpen={!!checkingOutTarget}
          onClose={() => setCheckingOutTarget(null)}
          table={checkingOutTarget.table}
          order={checkingOutTarget.order}
          onPaymentSuccess={() => {
            fetchTables();
            setCheckingOutTarget(null);
          }}
        />
      )}

      {/* 6. Switch Table Modal */}
      {switchingSourceTable && (
        <SwitchTableModal
          isOpen={!!switchingSourceTable}
          onClose={() => setSwitchingSourceTable(null)}
          sourceTable={switchingSourceTable}
          allTables={tables}
          onSwitchSuccess={fetchTables}
        />
      )}

      {/* 7. Table Detail Modal */}
      {viewingDetailTable && (
        <TableDetailModal
          isOpen={!!viewingDetailTable}
          onClose={() => setViewingDetailTable(null)}
          table={viewingDetailTable}
          onOpenCheckout={(t, o) => setCheckingOutTarget({ table: t, order: o })}
          onOpenAddDishes={(t) => setOrderingTable(t)}
        />
      )}

      {/* 8. Add Table Modal (Admin) */}
      {isAddTableOpen && (
        <Modal
          isOpen={isAddTableOpen}
          onClose={() => setIsAddTableOpen(false)}
          title="Thêm Bàn Ăn Mới"
          icon={Plus}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAddTable} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Tên bàn ăn *</label>
              <input
                type="text"
                placeholder="Ví dụ: Bàn T1-07, Bàn VIP-03"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Khu vực / Tầng</label>
              <input
                type="text"
                placeholder="Ví dụ: Tầng 1, Tầng 2, Phòng VIP, Ngoài trời"
                value={newTableArea}
                onChange={(e) => setNewTableArea(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Sức chứa (số ghế)</label>
              <input
                type="number"
                min="1"
                max="50"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-700">
              <Button variant="ghost" onClick={() => setIsAddTableOpen(false)} disabled={tableSubmitting}>
                Hủy
              </Button>
              <Button variant="primary" type="submit" loading={tableSubmitting}>
                Lưu Bàn Ăn
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
