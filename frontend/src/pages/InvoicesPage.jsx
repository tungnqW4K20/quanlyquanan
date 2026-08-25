import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  Eye,
  DollarSign
} from 'lucide-react';
import { BillReceipt } from '../components/billing/BillReceipt';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchInvoices();
    fetchSettings();
  }, [paymentMethod, selectedDate]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = '/invoices?';
      if (paymentMethod !== 'all') url += `payment_method=${paymentMethod}&`;
      if (selectedDate) url += `date=${selectedDate}&`;
      if (search) url += `search=${search}&`;

      const res = await api.get(url);
      if (res.success && res.data) {
        setInvoices(res.data);
      }
    } catch (err) {
      addToast('Không thể tải lịch sử hóa đơn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.success && res.data) setSettings(res.data);
    } catch (e) {}
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const totalFilteredRevenue = invoices.reduce((sum, i) => sum + (parseFloat(i.final_amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Top Summary Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-dark-850 to-orange-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-dark-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100">Quản Lý & Tra Cứu Hóa Đơn</h3>
            <p className="text-xs text-slate-400">Tổng cộng {invoices.length} hóa đơn đã thanh toán</p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-400 font-medium">Tổng doanh số bộ lọc:</span>
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
            {formatPrice(totalFilteredRevenue)}
          </h2>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="p-4 rounded-2xl bg-dark-850 border border-dark-700/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã hóa đơn, tên bàn, thu ngân..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-amber-500 text-dark-950 rounded-lg text-xs font-bold hover:bg-amber-400"
          >
            Tìm
          </button>
        </form>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Method Filter */}
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tất cả hình thức</option>
            <option value="cash">Tiền mặt</option>
            <option value="transfer_qr">Chuyển khoản VietQR</option>
            <option value="card">Thẻ POS</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          />

          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-slate-400 hover:text-amber-400 underline"
            >
              Xóa ngày
            </button>
          )}
        </div>
      </div>

      {/* 3. Invoices Table */}
      <div className="rounded-2xl bg-dark-850 border border-dark-700/80 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Đang tải lịch sử hóa đơn...</div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Receipt className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-300">Không tìm thấy hóa đơn nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900/80 border-b border-dark-700 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Mã HĐ</th>
                  <th className="px-5 py-3.5">Bàn</th>
                  <th className="px-5 py-3.5">Phương thức</th>
                  <th className="px-5 py-3.5">Thời gian</th>
                  <th className="px-5 py-3.5">Thu ngân</th>
                  <th className="px-5 py-3.5 text-right">Tổng tiền</th>
                  <th className="px-5 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/60">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-400">
                      {inv.invoice_code}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-200">
                      {inv.table_name || `Bàn ${inv.table_id}`}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-dark-900 border border-dark-700 text-slate-300">
                        {inv.payment_method === 'transfer_qr' ? (
                          <>
                            <QrCode className="w-3.5 h-3.5 text-orange-400" />
                            VietQR
                          </>
                        ) : inv.payment_method === 'card' ? (
                          <>
                            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                            Thẻ POS
                          </>
                        ) : (
                          <>
                            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                            Tiền mặt
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono">
                      {new Date(inv.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {inv.staff_name || 'Thu ngân'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-extrabold text-slate-100 text-sm">
                      {formatPrice(inv.final_amount)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Printer}
                        onClick={() => setViewingInvoice(inv)}
                      >
                        In lại
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Bill Receipt Modal */}
      {viewingInvoice && (
        <BillReceipt
          invoice={viewingInvoice}
          settings={settings}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
};
