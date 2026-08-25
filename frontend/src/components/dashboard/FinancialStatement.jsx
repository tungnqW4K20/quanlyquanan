import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
  Users,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flame,
  ArrowRight
} from 'lucide-react';
import SearchableSelect from '../common/SearchableSelect';
import api from '../../services/api';

export const FinancialStatement = ({ initialMonth }) => {
  const currentDate = new Date();
  const defaultMonth = initialMonth || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFinancialReport = async (month) => {
    setLoading(true);
    try {
      const res = await api.get(`/stats/financial-report?month_year=${month}`);
      if (res.success && res.data) {
        setFinancialData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialReport(selectedMonth);
  }, [selectedMonth]);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const availableMonths = [
    { value: '2026-06', label: 'Tháng 06/2026' },
    { value: '2026-07', label: 'Tháng 07/2026' },
    { value: '2026-08', label: 'Tháng 08/2026' },
    { value: '2026-09', label: 'Tháng 09/2026' },
    { value: '2026-10', label: 'Tháng 10/2026' }
  ];

  const rev = financialData?.revenue || { gross_sales: 0, total_discounts: 0, total_vat_collected: 0, net_revenue: 0 };
  const costs = financialData?.costs || { cogs: 0, gross_profit: 0, payroll_expense: 0, disposal_loss: 0, total_expenses: 0 };
  const pnl = financialData?.profit_and_loss || { net_profit_or_loss: 0, net_margin_percentage: 0 };
  const status = financialData?.status || 'PROFIT';
  const isProfit = status === 'PROFIT';

  return (
    <div className="bg-neutral-900 border border-amber-500/20 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Kiểm Toán Tài Chính & Báo Cáo Lãi Lỗ (P&L)
            </span>
            {isProfit ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> KẾT QUẢ: CÓ LÃI
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" /> KẾT QUẢ: LỖ THÂM HỤT
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white mt-1">
            Bảng Cân Đối Thu - Chi & Lợi Nhuận Ròng Tháng {selectedMonth}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Tính toán logic đa chiều: Doanh thu thực thu, Giá vốn (COGS), Quỹ lương nhân sự & Thất thoát hủy hàng
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center bg-neutral-950 border border-neutral-700/80 rounded-2xl p-1 shadow-inner">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="w-44 px-1">
            <SearchableSelect
              options={availableMonths}
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(val)}
              placeholder="Chọn tháng..."
              className="text-xs"
            />
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Tháng sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Net Revenue */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-amber-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase">1. Doanh Thu Thuần (Net Sales)</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-amber-400">{formatPrice(rev.net_revenue)}</div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Doanh số gộp: {formatPrice(rev.gross_sales)} • {rev.invoice_count || 0} hóa đơn
            </div>
          </div>
        </div>

        {/* 2. COGS */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-blue-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase">2. Giá Vốn Món Ăn (COGS)</span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-blue-400">{formatPrice(costs.cogs)}</div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Lãi gộp: <span className="text-emerald-400 font-bold">{formatPrice(costs.gross_profit)}</span> ({costs.gross_margin_percentage || 0}%)
            </div>
          </div>
        </div>

        {/* 3. Payroll & Labor */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-orange-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase">3. Quỹ Lương & Nhân Sự</span>
            <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-orange-400">{formatPrice(costs.payroll_expense)}</div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Chi trả {pnl.employee_count || 0} nhân sự (Phục vụ, Thu ngân, Đầu bếp)
            </div>
          </div>
        </div>

        {/* 4. NET PROFIT / LOSS */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isProfit
              ? 'bg-gradient-to-br from-emerald-950/40 via-neutral-950 to-neutral-950 border-emerald-500/40'
              : 'bg-gradient-to-br from-rose-950/40 via-neutral-950 to-neutral-950 border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-neutral-300">
              4. {isProfit ? 'LỢI NHUẬN RÒNG (LÃI)' : 'LỢI NHUẬN RÒNG (LỖ)'}
            </span>
            <div className={`p-2 rounded-xl ${isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPrice(pnl.net_profit_or_loss)}
            </div>
            <div className="text-[11px] font-bold text-neutral-400 mt-1">
              Tỷ suất sinh lời ròng: <span className={isProfit ? 'text-emerald-300' : 'text-rose-300'}>{pnl.net_margin_percentage || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Balance Breakdown Table */}
      <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4 overflow-x-auto">
        <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3">
          Diễn Giải Dòng Tiền & Công Thức Xác Thực (Audit Equation)
        </h4>

        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-neutral-800/80">
            <tr className="hover:bg-neutral-900/40 transition">
              <td className="py-2.5 font-bold text-white">(+) Tổng Doanh Thu Bán Hàng (Gross Sales)</td>
              <td className="py-2.5 text-right font-black text-amber-400">{formatPrice(rev.gross_sales)}</td>
              <td className="py-2.5 text-neutral-500 pl-4">Tổng tiền theo giá niêm yết của các món đã bán</td>
            </tr>
            <tr className="hover:bg-neutral-900/40 transition">
              <td className="py-2.5 text-neutral-300">(-) Giảm Giá / Chiết Khấu Khuyến Mãi</td>
              <td className="py-2.5 text-right font-bold text-rose-400">-{formatPrice(rev.total_discounts)}</td>
              <td className="py-2.5 text-neutral-500 pl-4">Khấu trừ khuyến mãi cho khách hàng</td>
            </tr>
            <tr className="hover:bg-neutral-900/40 transition">
              <td className="py-2.5 text-neutral-300">(+) Thuế GTGT Thu Hộ (VAT 8%)</td>
              <td className="py-2.5 text-right font-bold text-blue-400">+{formatPrice(rev.total_vat_collected)}</td>
              <td className="py-2.5 text-neutral-500 pl-4">Tiền thuế thu theo quy định</td>
            </tr>
            <tr className="hover:bg-neutral-900/40 transition bg-neutral-900/60 font-bold">
              <td className="py-2.5 text-amber-300">(=) DOANH THU THỰC THU (NET REVENUE)</td>
              <td className="py-2.5 text-right font-black text-amber-300">{formatPrice(rev.net_revenue)}</td>
              <td className="py-2.5 text-neutral-400 pl-4">Tổng tiền thực tế đã thu vào tài khoản / tiền mặt</td>
            </tr>

            <tr className="hover:bg-neutral-900/40 transition">
              <td className="py-2.5 text-neutral-300">(-) Giá Vốn Nguyên Liệu Chế Biến (COGS)</td>
              <td className="py-2.5 text-right font-bold text-orange-400">-{formatPrice(costs.cogs)}</td>
              <td className="py-2.5 text-neutral-500 pl-4">Chi phí nguyên phụ liệu tiêu hao trực tiếp vào món ăn</td>
            </tr>
            <tr className="hover:bg-neutral-900/40 transition">
              <td className="py-2.5 text-neutral-300">(-) Quỹ Lương & Phụ Cấp Nhân Sự (Payroll)</td>
              <td className="py-2.5 text-right font-bold text-orange-400">-{formatPrice(costs.payroll_expense)}</td>
              <td className="py-2.5 text-neutral-500 pl-4">Lương phục vụ (20k/h, Lễ x2, Tết x3) + Lương bếp (12tr/tháng)</td>
            </tr>
            <tr className="hover:bg-neutral-900/40 transition">
              <td className="py-2.5 text-neutral-300">(-) Tổn Thất Tiêu Hủy Hàng Quá Date / Hỏng Kho</td>
              <td className="py-2.5 text-right font-bold text-rose-400">-{formatPrice(costs.disposal_loss)}</td>
              <td className="py-2.5 text-neutral-500 pl-4">Giá trị nguyên liệu hết hạn, dập úa buộc phải hủy</td>
            </tr>

            <tr className="hover:bg-neutral-900/40 transition bg-neutral-900 font-extrabold border-t-2 border-neutral-700">
              <td className={`py-3 text-sm ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                (=) KẾT QUẢ KINH DOANH CUỐI CÙNG (NET PROFIT / LOSS)
              </td>
              <td className={`py-3 text-right text-base font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPrice(pnl.net_profit_or_loss)}
              </td>
              <td className="py-3 text-xs text-neutral-300 pl-4 font-normal">
                {financialData?.evaluation_note || 'Đang phân tích số liệu...'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
