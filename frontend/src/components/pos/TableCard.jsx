import React, { useState, useEffect } from 'react';
import { Users, Clock, Utensils, CreditCard, ArrowRightLeft, Eye, CalendarCheck, Flame, AlertCircle } from 'lucide-react';
import { TableStatusBadge } from '../common/Badge';
import { Button } from '../common/Button';

export const TableCard = ({ table, onOpenOrder, onOpenCheckout, onOpenSwitch, onOpenDetails, onOpenReservation }) => {
  const isOccupied = table.status === 'occupied' || table.status === 'waiting_food';
  const hasReservation = Boolean(table.has_reservation || table.reservation_info);
  const isBuffet = Boolean(table.is_buffet);

  // Buffet Timer Countdown Calculation
  const [timeLeft, setTimeLeft] = useState('');
  const [isNearExpiry, setIsNearExpiry] = useState(false);

  useEffect(() => {
    if (!isBuffet || !table.buffet_expires_at) return;

    const calculateTimeLeft = () => {
      const expiry = new Date(table.buffet_expires_at).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('ĐÃ HẾT 2 GIỜ');
        setIsNearExpiry(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (diff <= 20 * 60 * 1000) {
        setIsNearExpiry(true);
      } else {
        setIsNearExpiry(false);
      }

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [isBuffet, table.buffet_expires_at]);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const getCardBorder = (status) => {
    if (isBuffet && isNearExpiry) {
      return 'border-rose-500/80 shadow-lg shadow-rose-500/20 bg-gradient-to-b from-dark-850 to-rose-950/30 animate-pulse';
    }
    if (isBuffet) {
      return 'border-amber-500/60 shadow-lg shadow-amber-500/10 bg-gradient-to-b from-dark-850 to-amber-950/20';
    }
    if (hasReservation && !isOccupied) {
      return 'border-indigo-500/60 shadow-lg shadow-indigo-500/10 bg-gradient-to-b from-dark-850 to-indigo-950/20';
    }

    switch (status) {
      case 'occupied':
        return 'border-orange-500/30 hover:border-orange-500/60 bg-dark-850';
      case 'waiting_food':
        return 'border-amber-500/40 hover:border-amber-500/70 bg-gradient-to-b from-dark-850 to-amber-950/20';
      case 'reserved':
        return 'border-purple-500/30 hover:border-purple-500/60 bg-dark-850';
      case 'empty':
      default:
        return 'border-dark-700 hover:border-amber-500/30 bg-dark-850/60';
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 glass-card-hover ${getCardBorder(
        table.status
      )} relative overflow-hidden`}
    >
      {/* Top row: Table name & Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h4 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>{table.table_name}</span>
            </h4>
            <span className="text-xs text-slate-400 font-medium">{table.area}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <TableStatusBadge status={table.status} />
            {isBuffet && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                Gói Buffet
              </span>
            )}
          </div>
        </div>

        {/* Live 2-Hour Buffet Countdown Timer */}
        {isBuffet && timeLeft && (
          <div
            className={`mb-2 p-2 rounded-xl border text-xs flex items-center justify-between transition ${
              isNearExpiry
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <span className="flex items-center gap-1.5 font-bold">
              <Clock className="w-4 h-4 text-amber-400" />
              Thời gian Buffet 2h:
            </span>
            <span className="font-mono font-black text-sm">{timeLeft}</span>
          </div>
        )}

        {/* Near expiry delicate notice for staff */}
        {isBuffet && isNearExpiry && (
          <div className="mb-2 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 leading-tight flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <span>Sắp hết 2h: Nhân viên đến hỏi thăm món tráng miệng & thông báo khéo léo.</span>
          </div>
        )}

        {/* Has Reservation Badge */}
        {hasReservation && !isOccupied && (
          <button
            onClick={() => onOpenReservation && onOpenReservation(table)}
            className="w-full mb-2 p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-xs text-indigo-200 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-1.5 font-bold">
              <CalendarCheck className="w-4 h-4 text-indigo-400" />
              <span>ĐÃ ĐẶT TRƯỚC</span>
            </div>
            <span className="text-[11px] text-indigo-300 font-extrabold group-hover:underline">
              {table.reservation_info?.customer_name || 'Xem chi tiết'} →
            </span>
          </button>
        )}

        {/* Middle info: Capacity & Order summary if active */}
        <div className="space-y-2 py-2 border-y border-dark-700/60 my-2 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Sức chứa:
            </span>
            <span className="font-semibold text-slate-200">{table.capacity} khách</span>
          </div>

          {isOccupied && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tiến độ món:</span>
                <span className="font-bold text-amber-400">
                  {table.item_count || 0} món
                  {table.item_count > 0 && (
                    <span className={`ml-1 text-[10px] font-bold ${table.served_count === table.item_count ? 'text-emerald-400' : 'text-amber-300'}`}>
                      (Đã lên: {table.served_count || 0}/{table.item_count})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">Tạm tính:</span>
                <span className="font-extrabold text-sm text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                  {formatPrice(table.final_amount || table.total_amount)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col gap-2">
        {isOccupied ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Utensils}
              onClick={() => onOpenOrder(table)}
            >
              Thêm món
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CreditCard}
              onClick={() => onOpenCheckout(table)}
            >
              Thanh toán
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowRightLeft}
              onClick={() => onOpenSwitch(table)}
            >
              Đổi bàn
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Eye}
              onClick={() => onOpenDetails(table)}
            >
              Xem bill
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            icon={Utensils}
            onClick={() => onOpenOrder(table)}
            className="w-full"
          >
            Mở Bàn & Gọi Món
          </Button>
        )}
      </div>
    </div>
  );
};
