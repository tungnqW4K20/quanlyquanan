# 👑 HOÀNG GIA QUÁN - HỆ THỐNG QUẢN LÝ QUÁN ĂN CAO CẤP

Hệ thống website quản lý quán ăn / nhà hàng toàn diện được phát triển theo tiêu chuẩn hiện đại:
- **Giao diện & Theme**: Thiết kế phong cách **Vàng (Gold) + Cam (Orange) + Đen Huyền Bí (Dark Luxe)**, 100% sử dụng icon vector thư viện **Lucide-react**, bố cục Sidebar trái, nội dung phải và hệ thống **Toast Message** thông minh.
- **Frontend**: React 18 + Vite + Tailwind CSS + Lucide Icons + Recharts + Canvas Confetti.
- **Backend**: Node.js (Express) + MySQL (`mysql2/promise`) + JWT Authentication + Role-Based Access Control.

---

## 👥 Phân quyền 2 Roles

| Tài khoản | Mật khẩu | Vai trò | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **admin** | `123456` | **Quản Lý (Admin)** | Xem toàn bộ Dashboard doanh thu & biểu đồ, quản lý thực đơn, bàn ăn, quản lý nhân viên, cài đặt VietQR |
| **staff** | `123456` | **Nhân Viên (Staff)** | Sơ đồ bàn, POS gọi món tại bàn, màn hình Bếp KDS, thanh toán hóa đơn & in bill/quét mã VietQR |

*Hệ thống có tích hợp nút chuyển đổi nhanh vai trò (**Quick Role Switcher**) ở góc dưới Sidebar để thuận tiện trải nghiệm.*

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Khởi động Backend API (Port 5000):
```bash
cd backend
npm install
npm run dev
```
*Backend tự động tạo database & nạp dữ liệu mẫu vào MySQL (nếu có MySQL chạy ở `localhost:3306`), đồng thời có cơ chế fallback in-memory store hoạt động ngay lập tức kể cả khi chưa mở MySQL.*

### 2. Khởi động Frontend (Port 5173):
```bash
cd frontend
npm install
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:5173`

---

## 🗄️ Cấu trúc Cơ sở dữ liệu MySQL

File script tạo bảng chuẩn: `backend/src/database/schema.sql`
- `users`: Tài khoản quản trị và nhân viên
- `categories`: Danh mục món ăn
- `menu_items`: Chi tiết món ăn, giá tiền, ảnh, đơn vị tính, trạng thái còn/hết
- `dining_tables`: Sơ đồ bàn theo khu vực (Tầng 1, Tầng 2, VIP, Ngoài trời)
- `orders` & `order_items`: Đơn gọi món tại bàn, chi tiết món & trạng thái chế biến
- `invoices`: Lịch sử hóa đơn thanh toán (Tiền mặt, VietQR, POS)
- `settings`: Cấu hình quán ăn & số tài khoản nhận tiền VietQR

---

## 🌟 Các Tính Năng Chính
1. **Sơ đồ bàn ăn (Table POS)**: Trực quan theo khu vực, hiển thị bàn trống, đang ăn, chờ món, đổi bàn linh hoạt.
2. **Gọi món tại bàn (POS)**: Tìm kiếm món, chọn danh mục, ghi chú đặc biệt cho đầu bếp (ít cay, không hành,...), tính tạm tính & VAT.
3. **Màn hình Bếp (Kitchen Display System - KDS)**: Nhận order tức thì, đếm thời gian chờ, chuyển trạng thái chế biến (*Chờ nấu -> Đang nấu -> Sẵn sàng*).
4. **Thanh toán & Hóa đơn**: Máy tính tiền thối thông minh, sinh mã động **VietQR** chuẩn ngân hàng để khách quét QR, in phiếu thanh toán chuẩn.
5. **Dashboard Thống kê (Admin)**: Biểu đồ doanh thu 7 ngày qua, tỷ lệ đóng góp danh mục, top 5 món bán chạy nhất.
6. **Quản lý Thực đơn & Nhân sự (Admin)**: Thêm/sửa/xóa món ăn, đổi trạng thái hết món tức thì, cấp tài khoản nhân viên.
