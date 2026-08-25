import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Award, Flame } from 'lucide-react';

export const Charts = ({ revenueByDay, revenueByCategory, topSellingDishes }) => {
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-dark-900 border border-amber-500/30 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-slate-200">{label}</p>
          <p className="text-amber-400 font-extrabold mt-1">
            Doanh thu: {formatPrice(payload[0].value)}
          </p>
          {payload[0].payload.orders && (
            <p className="text-slate-400 text-[11px] mt-0.5">
              Đơn hàng: {payload[0].payload.orders} đơn
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Area Chart: 7 Days Revenue Trend */}
      <div className="lg:col-span-8 p-5 rounded-2xl bg-dark-850 border border-dark-700/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Doanh Thu 7 Ngày Gần Nhất</span>
            </h4>
            <p className="text-xs text-slate-400">Xu hướng doanh số theo từng ngày trong tuần</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
            Đơn vị: VNĐ
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueByDay || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#F59E0B"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Pie Chart: Revenue by Category */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-dark-850 border border-dark-700/80 flex flex-col justify-between space-y-4">
        <div>
          <h4 className="text-base font-bold text-slate-100">Cơ Cấu Danh Mục</h4>
          <p className="text-xs text-slate-400">Tỷ lệ đóng góp doanh thu</p>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={revenueByCategory || []}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {(revenueByCategory || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#F59E0B'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value}%`, name]}
                contentStyle={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#F59E0B',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 text-xs">
          {(revenueByCategory || []).map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="truncate max-w-[150px]">{cat.name}</span>
              </div>
              <span className="font-bold text-slate-100">{cat.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Top Selling Dishes */}
      <div className="lg:col-span-12 p-5 rounded-2xl bg-dark-850 border border-dark-700/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Top 5 Món Ăn Bán Chạy Nhất (Best Sellers)</span>
            </h4>
            <p className="text-xs text-slate-400">Dẫn đầu doanh số và lượt gọi món</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {(topSellingDishes || []).map((dish, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-dark-900 border border-dark-700/80 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-500/30">
                  #{idx + 1}
                </span>
                <span className="text-xs font-bold text-orange-400 font-mono">
                  {dish.count} lượt gọi
                </span>
              </div>

              <div>
                <h5 className="text-sm font-bold text-slate-100 line-clamp-2">{dish.name}</h5>
                <p className="text-xs text-amber-400 font-extrabold mt-1 font-mono">
                  {formatPrice(dish.revenue)}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-dark-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                  style={{ width: `${dish.percentage * 3}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
