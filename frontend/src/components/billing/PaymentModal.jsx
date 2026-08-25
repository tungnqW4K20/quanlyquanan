import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Receipt,
  Percent,
  Sparkles,
  Calculator,
  Search,
  User,
  Star,
  Gift,
  Coins,
  Tag,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { BillReceipt } from './BillReceipt';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const PaymentModal = ({ isOpen, onClose, table, order, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, transfer_qr, card
  const [discountPercent, setDiscountPercent] = useState(0);
  const [vatPercent, setVatPercent] = useState(8);
  const [customerPaid, setCustomerPaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [settings, setSettings] = useState(null);

  // Customer Loyalty & Voucher states
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [availableRewards, setAvailableRewards] = useState([]);

  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      if (order) {
        setDiscountPercent(parseFloat(order.discount_percent) || 0);
        setVatPercent(parseFloat(order.vat_percent) || 8);
      }
      setCustomerPhone('');
      setCustomerName('');
      setCustomerData(null);
      setPointsToRedeem(0);
      setVoucherCode('');
      setAvailableRewards([]);
      setCreatedInvoice(null);
      setShowReceipt(false);
    }
  }, [isOpen, order]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      // Use fallback defaults
    }
  };

  // Lookup Customer by Phone
  const handleLookupCustomer = async () => {
    if (!customerPhone || customerPhone.trim().length < 9) {
      addToast('Vui lòng nhập số điện thoại hợp lệ để tra cứu hội viên', 'warning');
      return;
    }

    setIsSearchingCustomer(true);
    try {
      const res = await api.post('/customers/lookup', {
        phone: customerPhone,
        full_name: customerName
      });

      if (res.success && res.data) {
        setCustomerData(res.data);
        setCustomerName(res.data.full_name || '');
        setAvailableRewards(res.data.available_rewards || []);
        addToast(`Tìm thấy hội viên: ${res.data.full_name} (${res.data.points} điểm)`, 'success');
      }
    } catch (err) {
      addToast(err.message || 'Không thể tra cứu khách hàng', 'error');
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  // Apply Voucher code
  const handleApplyVoucher = (code, discountPct) => {
    setVoucherCode(code);
    if (discountPct) {
      setDiscountPercent(discountPct);
      addToast(`Đã áp dụng mã "${code}" giảm ${discountPct}%!`, 'success');
    } else {
      addToast(`Đã áp dụng mã ưu đãi "${code}"!`, 'success');
    }
  };

  // Quick redeem points
  const handleRedeemMaxPoints = () => {
    if (!customerData || customerData.points <= 0) return;
    const maxRedeemablePoints = Math.min(
      customerData.points,
      Math.floor(rawTotal / 100) // Cannot discount more than total bill
    );
    setPointsToRedeem(maxRedeemablePoints);
    addToast(`Đã chọn dùng ${maxRedeemablePoints} điểm (giảm ${(maxRedeemablePoints * 100).toLocaleString('vi-VN')} đ)`, 'info');
  };

  // Calculations
  const rawTotal = Math.round(order?.total_amount || 0);
  const percentDiscountAmount = Math.round((rawTotal * (discountPercent || 0)) / 100);
  const pointsDiscountAmount = Math.round((parseInt(pointsToRedeem) || 0) * 100);
  const totalDiscount = Math.min(rawTotal, percentDiscountAmount + pointsDiscountAmount);

  const afterDiscount = Math.max(0, rawTotal - totalDiscount);
  const vatAmount = Math.round((afterDiscount * (vatPercent || 0)) / 100);
  const finalTotal = afterDiscount + vatAmount;
  const estimatedPointsEarned = Math.floor(finalTotal / 10000);

  const changeAmount = Math.max(0, (customerPaid || 0) - finalTotal);

  // Auto initialize customerPaid to exact amount when method is transfer_qr or card
  useEffect(() => {
    if (paymentMethod === 'transfer_qr' || paymentMethod === 'card') {
      setCustomerPaid(finalTotal);
    }
  }, [paymentMethod, finalTotal]);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const handleQuickCash = (amount) => {
    setCustomerPaid(amount);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleCheckout = async () => {
    if (paymentMethod === 'cash' && customerPaid < finalTotal) {
      addToast('Số tiền khách đưa chưa đủ để thanh toán', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/invoices/checkout', {
        order_id: order?.id || table?.current_order_id,
        payment_method: paymentMethod,
        discount_percent: discountPercent,
        vat_percent: vatPercent,
        customer_paid: customerPaid || finalTotal,
        customer_phone: customerPhone,
        customer_name: customerName,
        points_used: pointsToRedeem,
        voucher_code: voucherCode
      });

      if (res.success && res.data) {
        triggerConfetti();
        addToast(res.message || 'Thanh toán hóa đơn thành công!', 'success');
        setCreatedInvoice(res.data);
        onPaymentSuccess();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi trong quá trình thanh toán', 'error');
    } finally {
      setLoading(false);
    }
  };

  // VietQR Image URL
  const bankCode = settings?.bank_code || 'MB';
  const bankAccount = settings?.bank_account || '0988888999';
  const bankOwner = encodeURIComponent(settings?.bank_owner || 'HOANG GIA RESTAURANT');
  const qrDescription = encodeURIComponent(`Thanh toan ${table?.table_name || 'Ban an'}`);
  const vietQrUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${finalTotal}&addInfo=${qrDescription}&accountName=${bankOwner}`;

  const getTierLabel = (tier) => {
    switch (tier) {
      case 'diamond':
        return '💎 Hội Viên Kim Cương';
      case 'gold':
        return '🥇 Hội Viên Vàng';
      case 'silver':
        return '🥈 Hội Viên Bạc';
      default:
        return '🥉 Hội Viên Đồng';
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showReceipt}
        onClose={onClose}
        title={`Thanh Toán Hóa Đơn - ${table?.table_name || ''}`}
        icon={CreditCard}
        maxWidth="max-w-4xl"
      >
        {createdInvoice ? (
          /* Payment Success State */
          <div className="py-6 text-center space-y-5 animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-100">Thanh Toán Hoàn Tất!</h3>
              <p className="text-sm text-slate-400 mt-1">
                Mã hóa đơn: <span className="font-mono font-bold text-amber-400">{createdInvoice.invoice_code}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Bàn <span className="font-semibold text-slate-200">{createdInvoice.table_name}</span> đã được giải phóng để đón khách mới.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 max-w-md mx-auto space-y-2.5 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-neutral-400">Tổng thanh toán:</span>
                <span className="font-extrabold text-sm text-amber-400">{formatPrice(createdInvoice.final_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Phương thức:</span>
                <span className="font-bold text-slate-200 uppercase">
                  {createdInvoice.payment_method === 'transfer_qr'
                    ? 'Chuyển khoản VietQR'
                    : createdInvoice.payment_method === 'card'
                    ? 'Thẻ POS'
                    : 'Tiền mặt'}
                </span>
              </div>
              {createdInvoice.customer && (
                <div className="pt-2 border-t border-neutral-800 space-y-1 text-[11px]">
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span>Hội viên:</span>
                    <span>{createdInvoice.customer.full_name} ({getTierLabel(createdInvoice.customer.tier)})</span>
                  </div>
                  {createdInvoice.points_used > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Điểm đã đổi trừ tiền:</span>
                      <span>-{createdInvoice.points_used} điểm (-{formatPrice(createdInvoice.points_discount)})</span>
                    </div>
                  )}
                  <div className="flex justify-between text-cyan-400 font-bold">
                    <span>Điểm tích lũy mới nhận được:</span>
                    <span>+{createdInvoice.points_earned} điểm ⭐</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Số dư điểm hiện tại:</span>
                    <span>{createdInvoice.customer.points} điểm</span>
                  </div>
                </div>
              )}
              {createdInvoice.payment_method === 'cash' && (
                <>
                  <div className="flex justify-between pt-1 border-t border-neutral-800">
                    <span className="text-neutral-400">Tiền khách đưa:</span>
                    <span className="font-medium text-slate-200">{formatPrice(createdInvoice.customer_paid)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Tiền thối lại:</span>
                    <span>{formatPrice(createdInvoice.change_amount)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setCreatedInvoice(null);
                  onClose();
                }}
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={Receipt}
                onClick={() => setShowReceipt(true)}
              >
                Xem & In Hóa Đơn
              </Button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Col: Order Summary & Customer Loyalty Lookup */}
            <div className="lg:col-span-6 space-y-4">
              {/* Customer Loyalty Search Box */}
              <div className="p-4 rounded-2xl bg-neutral-900 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Award className="w-4 h-4" />
                    <span>HỘI VIÊN & TÍCH ĐIỂM / VOUCHER</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">10k = 1 điểm • 100đ = 10k</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Nhập SĐT khách hàng..."
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLookupCustomer}
                    loading={isSearchingCustomer}
                    className="text-xs"
                  >
                    Tra Cứu
                  </Button>
                </div>

                {customerData && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs animate-slide-up">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">{customerData.full_name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {getTierLabel(customerData.tier)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-300">
                      <span>Điểm tích lũy khả dụng:</span>
                      <span className="font-extrabold text-amber-400">{customerData.points} điểm ⭐</span>
                    </div>

                    {/* Points Redeem input */}
                    {customerData.points > 0 && (
                      <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1">
                          <label className="text-[11px] text-neutral-300 shrink-0">Dùng điểm:</label>
                          <input
                            type="number"
                            min="0"
                            max={customerData.points}
                            value={pointsToRedeem || ''}
                            placeholder="0"
                            onChange={(e) =>
                              setPointsToRedeem(
                                Math.min(customerData.points, Math.max(0, parseInt(e.target.value) || 0))
                              )
                            }
                            className="w-20 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded-lg text-xs font-bold text-amber-400 outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRedeemMaxPoints}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[10px] font-bold text-amber-300 border border-amber-500/40"
                        >
                          Dùng Tối Đa
                        </button>
                      </div>
                    )}

                    {/* Available minigame rewards */}
                    {availableRewards.length > 0 && (
                      <div className="pt-2 border-t border-amber-500/20 space-y-1">
                        <span className="text-[10px] text-neutral-400 block font-bold">Voucher may mắn trúng từ Mini Game:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {availableRewards.map((rw) => (
                            <button
                              key={rw.id}
                              type="button"
                              onClick={() => handleApplyVoucher(rw.reward_code, rw.reward_value.includes('20%') ? 20 : rw.reward_value.includes('10%') ? 10 : 0)}
                              className="px-2 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-[10px] text-orange-300 font-bold flex items-center gap-1 transition"
                            >
                              <Gift className="w-3 h-3 text-orange-400" />
                              <span>{rw.reward_value} ({rw.reward_code})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Order Items Summary */}
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Món ăn bàn {table?.table_name || ''}
                </h4>

                <div className="max-h-36 overflow-y-auto divide-y divide-neutral-800 text-xs">
                  {order?.items?.map((it, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between">
                      <div>
                        <span className="font-bold text-slate-200">{it.name}</span>
                        <span className="text-neutral-400 ml-1.5 font-semibold">x{it.quantity}</span>
                      </div>
                      <span className="font-mono font-medium text-neutral-300">
                        {formatPrice(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calculations */}
                <div className="space-y-1.5 pt-3 border-t border-neutral-800 text-xs text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Tiền món:</span>
                    <span className="font-semibold text-slate-200">{formatPrice(rawTotal)}</span>
                  </div>

                  {/* Voucher code & Discount % */}
                  <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Mã Voucher</label>
                      <input
                        type="text"
                        value={voucherCode}
                        placeholder="VD: WAGYU20"
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-amber-300 text-xs focus:outline-none focus:border-amber-500 font-mono font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Giảm giá (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) =>
                          setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
                        }
                        className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Chiết khấu ({discountPercent}%):</span>
                      <span>-{formatPrice(percentDiscountAmount)}</span>
                    </div>
                  )}

                  {pointsDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Trừ điểm ({pointsToRedeem} ⭐):</span>
                      <span>-{formatPrice(pointsDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-400">
                    <span>Thuế VAT ({vatPercent}%):</span>
                    <span>+{formatPrice(vatAmount)}</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-neutral-800">
                    <span className="font-bold text-sm text-slate-100">Cần thanh toán:</span>
                    <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-cyan-400 pt-0.5">
                    <span>Điểm tích lũy cho hóa đơn này:</span>
                    <span className="font-bold">+{estimatedPointsEarned} điểm ⭐</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Payment Method & Execution */}
            <div className="lg:col-span-6 space-y-4">
              {/* Method Selector Tabs */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Phương thức thanh toán:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Banknote className="w-5 h-5 mb-1 text-amber-400" />
                    Tiền Mặt
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer_qr')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                      paymentMethod === 'transfer_qr'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/10'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mb-1 text-orange-400" />
                    Quét VietQR
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mb-1 text-amber-400" />
                    Thẻ POS
                  </button>
                </div>
              </div>

              {/* Cash Mode Details */}
              {paymentMethod === 'cash' && (
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Tiền khách đưa (VNĐ):
                    </label>
                    <input
                      type="number"
                      value={customerPaid || ''}
                      placeholder="0"
                      onChange={(e) => setCustomerPaid(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-lg font-bold font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Preset Money Quick Buttons */}
                  <div>
                    <span className="text-[11px] text-neutral-400 block mb-1.5">Gợi ý mệnh giá:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickCash(finalTotal)}
                        className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-semibold text-slate-200"
                      >
                        Đúng tiền
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(200000)}
                        className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-semibold text-slate-200"
                      >
                        200.000 đ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(500000)}
                        className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-semibold text-slate-200"
                      >
                        500.000 đ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(1000000)}
                        className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-semibold text-slate-200"
                      >
                        1.000.000 đ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(2000000)}
                        className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-semibold text-slate-200"
                      >
                        2.000.000 đ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(5000000)}
                        className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs font-semibold text-slate-200"
                      >
                        5.000.000 đ
                      </button>
                    </div>
                  </div>

                  {/* Change calculation */}
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                    <span className="text-xs text-neutral-400 font-medium">Tiền thối lại khách:</span>
                    <span
                      className={`text-base font-extrabold font-mono ${
                        customerPaid < finalTotal ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {customerPaid < finalTotal ? 'Chưa đủ tiền' : formatPrice(changeAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* VietQR Mode Details */}
              {paymentMethod === 'transfer_qr' && (
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center text-center space-y-3">
                  <div className="p-2 rounded-2xl bg-white shadow-xl">
                    <img
                      src={vietQrUrl}
                      alt="VietQR Payment"
                      className="w-40 h-40 object-contain"
                    />
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="text-neutral-400">
                      Ngân hàng: <span className="font-bold text-amber-400">{settings?.bank_name || 'MB Bank'}</span>
                    </p>
                    <p className="text-neutral-400">
                      Số TK: <span className="font-mono font-bold text-slate-200">{settings?.bank_account || '0988888999'}</span>
                    </p>
                    <p className="text-neutral-400">
                      Chủ TK: <span className="font-bold text-slate-200">{settings?.bank_owner || 'HOANG GIA RESTAURANT'}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Card Mode Details */}
              {paymentMethod === 'card' && (
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-2">
                  <CreditCard className="w-10 h-10 text-amber-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-200">Quẹt thẻ qua máy POS</p>
                  <p className="text-xs text-neutral-400">
                    Vui lòng đưa thẻ của khách hàng vào máy POS và bấm xác nhận khi hoàn tất giao dịch.
                  </p>
                </div>
              )}

              {/* Submit Checkout Button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  icon={CheckCircle2}
                  onClick={handleCheckout}
                  loading={loading}
                  className="w-full shadow-xl shadow-amber-500/20 font-bold"
                >
                  Xác Nhận & Hoàn Tất Thanh Toán
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Bill Receipt Preview */}
      {showReceipt && createdInvoice && (
        <BillReceipt
          invoice={createdInvoice}
          settings={settings}
          onClose={() => {
            setShowReceipt(false);
            setCreatedInvoice(null);
            onClose();
          }}
        />
      )}
    </>
  );
};
