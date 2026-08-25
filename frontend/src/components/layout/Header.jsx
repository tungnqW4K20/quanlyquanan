import React, { useState, useEffect } from 'react';
import { Menu, Clock, PlusCircle, RefreshCw, ChefHat, Sparkles, Smartphone } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';
import { Button } from '../common/Button';

export const Header = ({ activeTab, setIsSidebarOpen, setActiveTab }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { triggerTableRefresh } = useOrder();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'tables':
        return { title: 'Sơ Đồ Bàn Ăn & Gọi Món', subtitle: 'Theo dõi trạng thái phòng bàn theo thời gian thực' };
      case 'menu-pos':
        return { title: 'Thực Đơn & Đặt Món POS', subtitle: 'Chọn món ngon và tạo order nhanh cho thực khách' };
      case 'kitchen':
        return { title: 'Màn Hình Bếp (KDS)', subtitle: 'Điều phối và cập nhật tiến độ chế biến món ăn' };
      case 'invoices':
        return { title: 'Hóa Đơn & Thu Ngân', subtitle: 'Quản lý thanh toán, in hóa đơn và đối soát doanh thu' };
      case 'promotions':
        return { title: 'Quản Trị Quảng Cáo & Banner', subtitle: 'Thiết kế chiến dịch tiếp thị, khuyến mãi và mã voucher' };
      case 'customers':
        return { title: 'Hội Viên & Đánh Giá Khách Hàng', subtitle: 'Quản lý CRM, điểm thưởng thành viên và phản hồi review' };
      case 'dashboard':
        return { title: 'Báo Cáo Doanh Thu & Lãi Lỗ (P&L)', subtitle: 'Tổng hợp chỉ số tài chính, giá vốn COGS và kết quả kinh doanh' };
      case 'inventory':
        return { title: 'Kho & Quản Lý Hạn Sử Dụng', subtitle: 'Báo cáo nhập xuất tồn, cảnh báo hết hạn và tiêu hủy hàng hỏng' };
      case 'payroll':
        return { title: 'Bảng Lương & Chấm Công Tự Động', subtitle: 'Tính lương theo giờ phục vụ, lương cứng đầu bếp và lễ tết' };
      case 'cancellations':
        return { title: 'Kiểm Toán Sự Cố & Món Hủy', subtitle: 'Theo dõi trách nhiệm hủy/đổi món và thất thoát tài chính' };
      case 'menu-manage':
        return { title: 'Quản Lý Danh Mục & Món Ăn', subtitle: 'Thêm mới, định lượng công thức chế biến và cập nhật món' };
      case 'staff':
        return { title: 'Quản Lý Nhân Sự & Đầu Bếp', subtitle: 'Danh sách nhân viên, phân quyền truy cập hệ thống' };
      case 'settings':
        return { title: 'Cài Đặt Quán Ăn & VietQR', subtitle: 'Thông tin thương hiệu, thuế VAT và tài khoản ngân hàng' };
      default:
        return { title: 'Hệ Thống Quản Lý', subtitle: 'Hoàng Gia Quán' };
    }
  };

  const { title, subtitle } = getPageTitle();

  const formattedTime = currentTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-neutral-950/85 backdrop-blur-md border-b border-neutral-800 px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 lg:hidden shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-white tracking-tight flex items-center gap-2 truncate">
            <span className="truncate">{title}</span>
          </h2>
          <p className="text-[11px] text-neutral-400 hidden sm:block truncate">{subtitle}</p>
        </div>
      </div>

      {/* Right: Clock, Customer Portal, Refresh & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Real-time Clock */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-bold text-amber-400 font-mono">{formattedTime}</span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-300 capitalize">{formattedDate}</span>
        </div>

        {/* Customer Self-order switch */}
        <button
          onClick={() => setActiveTab('customer-portal')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition"
          title="Xem Cổng Khách Hàng Gọi Món & Mini Game"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Cổng Khách Hàng</span>
        </button>

        {/* Quick Refresh Button */}
        <button
          onClick={triggerTableRefresh}
          title="Làm mới dữ liệu"
          className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Quick Kitchen Button */}
        <Button
          variant="secondary"
          size="sm"
          icon={ChefHat}
          onClick={() => setActiveTab('kitchen')}
          className="hidden sm:inline-flex text-xs"
        >
          Bếp KDS
        </Button>

        {/* Quick Order POS Button */}
        <Button
          variant="primary"
          size="sm"
          icon={PlusCircle}
          onClick={() => setActiveTab('tables')}
          className="text-xs font-bold"
        >
          Gọi Món
        </Button>
      </div>
    </header>
  );
};
