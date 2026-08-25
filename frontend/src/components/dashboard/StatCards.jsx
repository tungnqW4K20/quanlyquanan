import React from 'react';
import { DollarSign, Receipt, Users, Utensils, TrendingUp, Sparkles, Boxes, AlertTriangle, FileX } from 'lucide-react';

export const StatCards = ({ summary }) => {
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const cards = [
    {
      title: 'Doanh Thu Hôm Nay',
      value: formatPrice(summary?.total_revenue_today || 0),
      subtitle: '+18.4% so với hôm qua',
      icon: DollarSign,
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30'
    },
    {
      title: 'Hóa Đơn Hoàn Tất',
      value: `${summary?.total_invoices_today || 0} đơn`,
      subtitle: 'Giao dịch hôm nay',
      icon: Receipt,
      color: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500/30'
    },
    {
      title: 'Tỷ Lệ Lấp Đầy Bàn',
      value: `${summary?.table_occupancy_rate || 0}%`,
      subtitle: `${summary?.occupied_tables || 0}/${summary?.total_tables || 0} bàn đang phục vụ`,
      icon: Users,
      color: 'from-amber-400 to-yellow-500',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30'
    },
    {
      title: 'Giá Trị Kho Nguyên Liệu',
      value: formatPrice(summary?.inventory_valuation || 0),
      subtitle: 'Tổng giá trị hàng tồn',
      icon: Boxes,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Cảnh Báo Sắp Hết Hàng',
      value: `${summary?.low_stock_count || 0} món`,
      subtitle: 'Cần nhập thêm vào kho',
      icon: AlertTriangle,
      color: summary?.low_stock_count > 0 ? 'from-red-500 to-rose-600' : 'from-emerald-500 to-teal-600',
      textColor: summary?.low_stock_count > 0 ? 'text-red-400' : 'text-emerald-400',
      borderColor: summary?.low_stock_count > 0 ? 'border-red-500/30' : 'border-emerald-500/30'
    },
    {
      title: 'Thất Thoát Do Món Hủy',
      value: formatPrice(summary?.total_cancelled_loss || 0),
      subtitle: `${summary?.total_cancelled_count || 0} suất món bị hủy`,
      icon: FileX,
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl bg-dark-850 border ${card.borderColor} glass-card-hover relative overflow-hidden flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                {card.title}
              </span>
              <div
                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} text-dark-950 flex items-center justify-center shadow-lg font-bold shrink-0 ml-1`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2.5">
              <h3 className={`text-lg font-extrabold tracking-tight truncate ${card.textColor}`}>
                {card.value}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 truncate">
                <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{card.subtitle}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
