import React from 'react';
import { Printer, X, CheckCircle2, QrCode, Phone, MapPin, Wifi, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

export const BillReceipt = ({ invoice, settings, onClose }) => {
  const { addToast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      `=== ${settings?.restaurant_name || 'HOÀNG GIA QUÁN'} ===`,
      `Mã HĐ: ${invoice.invoice_code}`,
      `Bàn: ${invoice.table_name} | Thu ngân: ${invoice.staff_name || 'Thu ngân'}`,
      `Thời gian: ${new Date(invoice.created_at || Date.now()).toLocaleString('vi-VN')}`,
      '--------------------------------',
      ...(invoice.items || []).map((it) => `${it.name} x${it.quantity} = ${formatPrice(it.price * it.quantity)}`),
      '--------------------------------',
      `Tổng tiền món: ${formatPrice(invoice.total_amount)}`,
      invoice.discount_amount > 0 ? `Chiết khấu: -${formatPrice(invoice.discount_amount)}` : null,
      invoice.vat_amount > 0 ? `VAT (8%): +${formatPrice(invoice.vat_amount)}` : null,
      `TỔNG CỘNG: ${formatPrice(invoice.final_amount)}`,
      `Hình thức: ${invoice.payment_method === 'transfer_qr' ? 'Chuyển khoản VietQR' : invoice.payment_method === 'card' ? 'Thẻ POS' : 'Tiền mặt'}`,
      '================================',
      'CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!'
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    addToast('Đã sao chép nội dung hóa đơn vào Clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-stone-50 text-slate-900 rounded-2xl shadow-2xl overflow-hidden p-6 my-8 border border-stone-200 animate-slide-up">
        {/* Printable Area - Formatted as Authentic Thermal Receipt (80mm) */}
        <div id="printable-receipt" className="space-y-3.5 font-mono text-xs text-slate-800 bg-white p-4 rounded-xl border border-dashed border-stone-300 shadow-inner">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-stone-300 pb-3 space-y-1">
            <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-amber-50 text-amber-700 mb-1">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold uppercase text-slate-950 tracking-wider">
              {settings?.restaurant_name || 'HOÀNG GIA QUÁN'}
            </h2>
            <p className="text-[11px] text-slate-600 italic font-sans font-medium">{settings?.slogan || 'Ẩm Thực Tinh Hoa Việt'}</p>
            <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" /> {settings?.address || '128 Đường Ẩm Thực, Quận 1, TP.HCM'}
            </p>
            <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" /> Hotline: {settings?.phone || '0988.123.456'}
            </p>
            
            <div className="pt-2">
              <span className="inline-block px-3 py-0.5 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wide">
                PHIẾU THANH TOÁN
              </span>
              <p className="text-[11px] text-slate-600 font-bold mt-1">Số: {invoice.invoice_code}</p>
            </div>
          </div>

          {/* Info Block */}
          <div className="flex justify-between text-[11px] text-slate-700 py-1.5 border-b border-dashed border-stone-300">
            <div>
              <p>Bàn: <span className="font-bold text-slate-950 text-xs">{invoice.table_name}</span></p>
              <p>Thu ngân: <span className="font-medium text-slate-900">{invoice.staff_name || 'Thu ngân'}</span></p>
            </div>
            <div className="text-right">
              <p>Ngày: {new Date(invoice.created_at || Date.now()).toLocaleDateString('vi-VN')}</p>
              <p>Giờ: {new Date(invoice.created_at || Date.now()).toLocaleTimeString('vi-VN')}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-1">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-900 text-[11px] font-extrabold text-slate-950">
                  <th className="pb-1 text-left">Món ăn / Đồ uống</th>
                  <th className="pb-1 text-center w-8">SL</th>
                  <th className="pb-1 text-right">Đơn giá</th>
                  <th className="pb-1 text-right">T.Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {invoice.items?.map((item, idx) => (
                  <tr key={idx} className="text-[11px] hover:bg-stone-50">
                    <td className="py-1.5 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-1.5 text-center font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-1.5 text-right text-slate-600">{formatPrice(item.price)}</td>
                    <td className="py-1.5 text-right font-bold text-slate-950">
                      {formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Calculation */}
          <div className="border-t-2 border-slate-900 pt-2 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-700">
              <span>Tổng tiền món:</span>
              <span className="font-semibold">{formatPrice(invoice.total_amount)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-red-600 font-semibold">
                <span>Chiết khấu ({invoice.discount_percent || 0}%):</span>
                <span>-{formatPrice(invoice.discount_amount)}</span>
              </div>
            )}
            {invoice.vat_amount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Thuế VAT ({invoice.vat_percent || 8}%):</span>
                <span>+{formatPrice(invoice.vat_amount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline text-sm font-black border-t-2 border-dashed border-slate-900 pt-2 text-slate-950">
              <span className="uppercase">TỔNG THANH TOÁN:</span>
              <span className="text-base text-amber-700">{formatPrice(invoice.final_amount)}</span>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-stone-200">
              <span className="text-slate-600">Hình thức:</span>
              <span className="font-bold uppercase text-xs px-2 py-0.5 rounded bg-stone-100 text-slate-900">
                {invoice.payment_method === 'transfer_qr'
                  ? 'Chuyển khoản VietQR'
                  : invoice.payment_method === 'card'
                  ? 'Thẻ POS'
                  : 'Tiền mặt'}
              </span>
            </div>

            {invoice.payment_method === 'cash' && (
              <div className="space-y-1 pt-1 bg-stone-50 p-2 rounded border border-stone-200">
                <div className="flex justify-between text-slate-700">
                  <span>Tiền khách đưa:</span>
                  <span className="font-bold">{formatPrice(invoice.customer_paid)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-extrabold">
                  <span>Tiền thối lại:</span>
                  <span>{formatPrice(invoice.change_amount)}</span>
                </div>
              </div>
            )}
            {invoice.customer_phone && (
              <div className="pt-1 text-[10px] text-slate-700 space-y-0.5 border-t border-dashed border-stone-300">
                <div className="flex justify-between">
                  <span>Hội viên:</span>
                  <span className="font-bold">{invoice.customer_name || invoice.customer_phone}</span>
                </div>
                {invoice.points_used > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Điểm đã dùng:</span>
                    <span>-{invoice.points_used} điểm (-{formatPrice(invoice.points_discount || invoice.points_used * 100)})</span>
                  </div>
                )}
                {invoice.points_earned > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Điểm tích lũy mới:</span>
                    <span>+{invoice.points_earned} điểm ⭐</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 border-t-2 border-dashed border-stone-300 text-[10px] text-slate-600 space-y-1">
            <p className="font-extrabold text-slate-900 text-xs tracking-wider">CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!</p>
            <p className="flex items-center justify-center gap-1 font-sans text-slate-500">
              <Wifi className="w-3 h-3 text-amber-600" /> Wifi: <span className="font-semibold text-slate-700">hoanggiaguan2026</span>
            </p>
            <p className="text-[9px] text-slate-400 italic">Hóa đơn điện tử khởi tạo từ hệ thống POS Hoàng Gia</p>
          </div>
        </div>

        {/* Action Buttons (Hidden during printing) */}
        <div className="mt-5 pt-3 border-t border-stone-200 flex items-center justify-between gap-2 no-print">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? Check : Copy}
              onClick={handleCopyText}
            >
              {copied ? 'Đã chép' : 'Sao chép bill'}
            </Button>
            <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
              In Hóa Đơn (Print)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
