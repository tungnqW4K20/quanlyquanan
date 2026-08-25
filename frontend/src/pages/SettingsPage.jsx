import React, { useState, useEffect } from 'react';
import { Settings, Store, QrCode, Percent, Save, CheckCircle2, Building, Phone, MapPin } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const SettingsPage = () => {
  const [restaurantName, setRestaurantName] = useState('HOÀNG GIA QUÁN');
  const [slogan, setSlogan] = useState('Ẩm Thực Tinh Hoa Việt');
  const [address, setAddress] = useState('128 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh');
  const [phone, setPhone] = useState('0988.888.999');
  const [bankName, setBankName] = useState('MB Bank (Quân Đội)');
  const [bankCode, setBankCode] = useState('MB');
  const [bankAccount, setBankAccount] = useState('0988888999');
  const [bankOwner, setBankOwner] = useState('HOANG GIA RESTAURANT');
  const [vatDefault, setVatDefault] = useState(8.0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.success && res.data) {
        const d = res.data;
        setRestaurantName(d.restaurant_name || '');
        setSlogan(d.slogan || '');
        setAddress(d.address || '');
        setPhone(d.phone || '');
        setBankName(d.bank_name || '');
        setBankCode(d.bank_code || 'MB');
        setBankAccount(d.bank_account || '');
        setBankOwner(d.bank_owner || '');
        setVatDefault(d.vat_default || 8.0);
      }
    } catch (err) {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', {
        restaurant_name: restaurantName,
        slogan,
        address,
        phone,
        bank_name: bankName,
        bank_code: bankCode,
        bank_account: bankAccount,
        bank_owner: bankOwner,
        vat_default: parseFloat(vatDefault) || 8.0
      });

      if (res.success) {
        addToast('Cập nhật cài đặt quán ăn thành công!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi lưu cài đặt', 'error');
    } finally {
      setSaving(false);
    }
  };

  const vietQrPreview = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=100000&addInfo=Demo%20Thanh%20Toan&accountName=${encodeURIComponent(
    bankOwner || 'HOANG GIA'
  )}`;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Store Profile Settings */}
        <div className="p-6 rounded-2xl bg-dark-850 border border-dark-700/80 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-dark-700">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Thông Tin Thương Hiệu Quán Ăn</h3>
              <p className="text-xs text-slate-400">Hiển thị trên hóa đơn in ấn và tiêu đề hệ thống</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Tên quán ăn / Nhà hàng *</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Khẩu hiệu / Slogan</label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Địa chỉ quán ăn</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Hotline / Số điện thoại</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Thuế VAT mặc định (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={vatDefault}
                  onChange={(e) => setVatDefault(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. VietQR Banking Settings */}
        <div className="p-6 rounded-2xl bg-dark-850 border border-dark-700/80 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-dark-700">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Cấu Hình Tài Khoản Nhận Tiền VietQR</h3>
              <p className="text-xs text-slate-400">Tự động sinh mã QR ngân hàng chính xác khi khách thanh toán</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Mã ngân hàng (VietQR Bank Code) *</label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="MB">MB Bank (Quân Đội)</option>
                  <option value="VCB">Vietcombank (Ngoại Thương)</option>
                  <option value="TCB">Techcombank (Kỹ Thương)</option>
                  <option value="ACB">ACB (Á Châu)</option>
                  <option value="VPB">VPBank (Việt Nam Thịnh Vượng)</option>
                  <option value="BIDV">BIDV (Đầu Tư & Phát Triển)</option>
                  <option value="ICB">VietinBank (Công Thương)</option>
                  <option value="TPB">TPBank (Tiên Phong)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Tên hiển thị ngân hàng</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Số tài khoản ngân hàng *</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-mono font-bold text-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Tên chủ tài khoản (In hoa không dấu) *</label>
                <input
                  type="text"
                  value={bankOwner}
                  onChange={(e) => setBankOwner(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-bold"
                  required
                />
              </div>
            </div>

            {/* QR Code Demo Preview */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-dark-900 border border-dark-700 text-center">
              <span className="text-[11px] font-bold text-slate-400 mb-2">Xem trước mã VietQR</span>
              <div className="p-2 rounded-xl bg-white shadow-lg">
                <img
                  src={vietQrPreview}
                  alt="QR Preview"
                  className="w-32 h-32 object-contain"
                />
              </div>
              <span className="text-[10px] text-amber-400 mt-2 font-mono">{bankCode} - {bankAccount}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            loading={saving}
            className="shadow-xl shadow-amber-500/20"
          >
            Lưu Cài Đặt Hệ Thống
          </Button>
        </div>
      </form>
    </div>
  );
};
