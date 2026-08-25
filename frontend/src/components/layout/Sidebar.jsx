import React from 'react';
import {
  LayoutGrid,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  BarChart3,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Boxes,
  BadgeDollarSign,
  FileX,
  Megaphone,
  Award,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { user, isAdmin, logout, switchRole } = useAuth();

  const navItems = [
    { id: 'customer-portal', label: 'Cổng Khách Hàng (Tự Gọi Món)', icon: Smartphone, adminOnly: false, highlight: true },
    { id: 'tables', label: 'Sơ đồ Bàn ăn', icon: LayoutGrid, adminOnly: false },
    { id: 'menu-pos', label: 'Gọi món / POS', icon: UtensilsCrossed, adminOnly: false },
    { id: 'kitchen', label: 'Màn hình Bếp (KDS)', icon: ChefHat, adminOnly: false },
    { id: 'invoices', label: 'Hóa đơn & Thu ngân', icon: Receipt, adminOnly: false },
    { id: 'promotions', label: 'Quảng Cáo & Khuyến Mãi', icon: Megaphone, adminOnly: true },
    { id: 'customers', label: 'Hội Viên & Đánh Giá', icon: Award, adminOnly: true },
    { id: 'dashboard', label: 'Báo cáo Doanh thu & Lãi Lỗ', icon: BarChart3, adminOnly: true },
    { id: 'inventory', label: 'Kho & Hạn Sử Dụng', icon: Boxes, adminOnly: true },
    { id: 'payroll', label: 'Bảng Lương & Chấm Công', icon: BadgeDollarSign, adminOnly: true },
    { id: 'cancellations', label: 'Kiểm Toán Món Hủy', icon: FileX, adminOnly: true },
    { id: 'menu-manage', label: 'Quản lý Món ăn', icon: BookOpen, adminOnly: true },
    { id: 'staff', label: 'Quản lý Nhân sự', icon: Users, adminOnly: true },
    { id: 'settings', label: 'Cài đặt Quán ăn', icon: Settings, adminOnly: true }
  ];

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-neutral-950/95 border-r border-neutral-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center gap-3.5 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-400 tracking-wide uppercase truncate">
                Hoàng Gia Quán
              </h1>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </div>
            <p className="text-xs text-neutral-400 truncate">Hệ thống Quản lý Ẩm thực</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-3.5 py-4 overflow-y-auto space-y-1.5 scrollbar-thin">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Menu Nghiệp Vụ
          </div>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/5'
                    : item.highlight
                    ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 border border-transparent'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full" />
                )}

                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400'
                      : item.highlight
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-neutral-400 group-hover:text-amber-400 group-hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Role Switch & User Profile */}
        <div className="p-3.5 border-t border-neutral-800 bg-neutral-900/60 space-y-3">
          {/* Quick Demo Switcher */}
          <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-medium">
              <span>Chuyển quyền thử nghiệm:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => switchRole('admin')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  isAdmin
                    ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
              <button
                onClick={() => switchRole('staff')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  !isAdmin
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Nhân viên
              </button>
            </div>
          </div>

          {/* User Card */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                }
                alt={user?.full_name}
                className="w-9 h-9 rounded-xl object-cover border border-amber-500/30 shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-neutral-100 truncate">{user?.full_name}</p>
                <RoleBadge role={user?.role} />
              </div>
            </div>

            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
