import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, ShoppingCart, Layers, Check } from 'lucide-react';
import { MenuPicker } from '../components/pos/MenuPicker';
import { CartDrawer } from '../components/pos/CartDrawer';
import { useOrder } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const MenuPosPage = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    orderCart,
    addToCart,
    updateCartQuantity,
    updateCartItemNotes,
    removeFromCart,
    clearCart
  } = useOrder();

  const { addToast } = useToast();

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tables');
      if (res.success && res.data) {
        setTables(res.data);
        if (res.data.length > 0 && !selectedTable) {
          setSelectedTable(res.data[0]);
        }
      }
    } catch (err) {
      addToast('Không thể tải danh sách bàn', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Selector Strip */}
      <div className="p-3.5 rounded-2xl bg-dark-850 border border-dark-700/80 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-300">Chọn Bàn Đang Phục Vụ:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {tables.map((t) => {
            const isSelected = selectedTable?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTable(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-dark-950 shadow-md shadow-amber-500/20'
                    : t.status === 'occupied'
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                    : 'bg-dark-900 text-slate-400 border border-dark-700 hover:border-amber-500/30'
                }`}
              >
                <span>{t.table_name}</span>
                {t.status === 'occupied' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* POS Screen Layout: MenuPicker (Left) & CartDrawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-210px)]">
        {/* Left Col: Menu Picker */}
        <div className="lg:col-span-8 p-4 rounded-2xl bg-dark-850 border border-dark-700/80 overflow-hidden h-full">
          <MenuPicker onSelectItem={(item) => addToCart(item)} />
        </div>

        {/* Right Col: Cart Drawer */}
        <div className="lg:col-span-4 rounded-2xl overflow-hidden h-full shadow-2xl border border-dark-700/80">
          {selectedTable ? (
            <CartDrawer
              table={selectedTable}
              cart={orderCart}
              onUpdateQuantity={updateCartQuantity}
              onUpdateNotes={updateCartItemNotes}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              onOrderSuccess={() => {
                fetchTables();
              }}
              onClose={() => {}}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-6 text-center text-slate-400 bg-dark-850">
              Vui lòng chọn một bàn ăn ở thanh phía trên để tiếp tục gọi món.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
