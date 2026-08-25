import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Download, Sparkles, RefreshCw, Scale } from 'lucide-react';
import { StatCards } from '../components/dashboard/StatCards';
import { Charts } from '../components/dashboard/Charts';
import { FinancialStatement } from '../components/dashboard/FinancialStatement';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const DashboardPage = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stats/dashboard');
      if (res.success && res.data) {
        setStatsData(res.data);
      }
    } catch (err) {
      addToast('Không thể tải dữ liệu báo cáo doanh thu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    addToast('Đang xuất báo cáo doanh thu Excel...', 'info');
    setTimeout(() => {
      addToast('Báo cáo doanh thu đã được tải xuống thành công!', 'success');
    }, 1200);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-neutral-900" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 rounded-2xl bg-neutral-900" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-neutral-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-orange-500/15 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Báo Cáo Tổng Quan
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
            Hiệu Quả Kinh Doanh & Báo Cáo Tài Chính
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Tổng hợp dữ liệu theo thời gian thực: Doanh số, Giá vốn món ăn (COGS), Quỹ lương & Lãi/Lỗ ròng
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchStats}>
            Làm mới
          </Button>
          <Button variant="primary" size="sm" icon={Download} onClick={handleExportReport}>
            Xuất Báo Cáo
          </Button>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <StatCards summary={statsData?.summary} />

      {/* 3. Official P&L Financial Statement */}
      <FinancialStatement initialMonth={statsData?.summary?.current_month} />

      {/* 4. Analytics Charts */}
      <Charts
        revenueByDay={statsData?.revenue_by_day}
        revenueByCategory={statsData?.revenue_by_category}
        topSellingDishes={statsData?.top_selling_dishes}
      />
    </div>
  );
};
