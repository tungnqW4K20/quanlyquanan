import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, CheckCircle2, AlertCircle, Sparkles, Utensils, UserCheck, ShieldAlert, ArrowRightLeft } from 'lucide-react';
import { DishStatusBadge } from '../common/Badge';
import { Button } from '../common/Button';

export const KitchenCard = ({ ticket, onUpdateStatus, onAssignChef, chefsList = [] }) => {
  const [selectedChef, setSelectedChef] = useState(ticket.assigned_chef_name || '');
  const [isChangingChef, setIsChangingChef] = useState(false);
  const [countdown, setCountdown] = useState(ticket.countdown_seconds ?? 300);

  const itemCreatedTime = new Date(ticket.item_time || ticket.order_time).getTime();
  const elapsedMinutes = Math.floor((Date.now() - itemCreatedTime) / 60000);

  // Live 5-minute Auto-Assign Countdown Timer
  useEffect(() => {
    if (ticket.assigned_chef_name && !ticket.is_auto_assigned) return;

    const updateTimer = () => {
      const elapsedSec = Math.floor((Date.now() - itemCreatedTime) / 1000);
      const remaining = Math.max(0, 300 - elapsedSec);
      setCountdown(remaining);

      if (remaining === 0 && !selectedChef) {
        setSelectedChef('Trần Bếp Trưởng');
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [ticket.assigned_chef_name, ticket.is_auto_assigned, itemCreatedTime]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getTimeColor = (mins) => {
    if (mins >= 15) return 'text-red-400 bg-red-500/10 border-red-500/30 animate-pulse';
    if (mins >= 8) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const handleStartCooking = () => {
    const chefName = selectedChef || ticket.assigned_chef_name || (countdown === 0 ? 'Trần Bếp Trưởng' : 'Trần Bếp Trưởng');
    onUpdateStatus(ticket.item_id, 'cooking', chefName);
  };

  const handleSaveAssignedChef = (chefName, startCooking = false) => {
    setSelectedChef(chefName);
    setIsChangingChef(false);
    if (onAssignChef && chefName) {
      onAssignChef(ticket.item_id, chefName, startCooking);
    }
  };

  const isAssigned = Boolean(ticket.assigned_chef_name || (countdown === 0));
  const displayChefName = ticket.assigned_chef_name || (countdown === 0 ? 'Trần Bếp Trưởng (Tự động)' : null);

  return (
    <div className={`rounded-2xl bg-dark-850 border p-4 flex flex-col justify-between glass-card-hover shadow-lg transition-all ${
      !isAssigned && countdown > 0 ? 'border-amber-500/40 bg-gradient-to-b from-dark-850 to-amber-950/20' : 'border-dark-700/80'
    }`}>
      <div>
        {/* Header: Table & Time */}
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-dark-700/60">
          <div>
            <h4 className="text-base font-bold text-amber-400 flex items-center gap-1.5">
              <span>{ticket.table_name}</span>
            </h4>
            <span className="text-xs text-slate-400 font-medium">{ticket.area}</span>
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getTimeColor(
              elapsedMinutes
            )}`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{elapsedMinutes} phút</span>
          </div>
        </div>

        {/* Dish Info */}
        <div className="py-3 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center font-extrabold text-lg text-amber-400 shrink-0">
            {ticket.quantity}x
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-slate-100 leading-snug">
              {ticket.dish_name}
            </h3>
            <span className="text-xs text-slate-400">{ticket.category_name} • {ticket.unit || 'Phần'}</span>

            {/* Special notes for chef */}
            {ticket.item_notes && (
              <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                <span>Ghi chú: {ticket.item_notes}</span>
              </div>
            )}

            {/* Chef Assignment & 5-Min Countdown Section */}
            <div className="mt-3 pt-2.5 border-t border-dark-700/60 space-y-2">
              {/* Case 1: Unassigned and within 5 minutes countdown */}
              {!isAssigned && countdown > 0 && (
                <div className="space-y-1.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                    <span className="flex items-center gap-1 font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                      Tự gán Bếp Trưởng sau:
                    </span>
                    <span className="font-mono font-black text-amber-300 bg-dark-950 px-2 py-0.5 rounded-lg border border-amber-500/40">
                      {formatCountdown(countdown)}
                    </span>
                  </div>

                  {/* Dropdown to pick Chef immediately */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedChef}
                      onChange={(e) => setSelectedChef(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Chọn đầu bếp nấu --</option>
                      <option value="Trần Bếp Trưởng">Trần Bếp Trưởng (Bếp trưởng)</option>
                      {chefsList.map((c) => (
                        <option key={c.id} value={c.full_name}>{c.full_name}</option>
                      ))}
                    </select>

                    {selectedChef && (
                      <button
                        onClick={() => handleSaveAssignedChef(selectedChef, false)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-dark-950 font-bold text-xs hover:bg-amber-400 transition"
                      >
                        Gán
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Case 2: Auto-assigned to Head Chef after 5 mins or manually assigned */}
              {(isAssigned || countdown === 0) && !isChangingChef && (
                <div className="flex items-center justify-between gap-1 text-xs bg-dark-900/90 px-3 py-2 rounded-xl border border-dark-700">
                  <div className="flex items-center gap-1.5">
                    <ChefHat className={`w-4 h-4 ${ticket.is_auto_assigned || countdown === 0 ? 'text-amber-400' : 'text-orange-400'}`} />
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-tight">Đầu bếp phụ trách:</span>
                      <span className="font-extrabold text-slate-200">
                        {displayChefName || selectedChef || 'Trần Bếp Trưởng'}
                      </span>
                      {(ticket.is_auto_assigned || (!ticket.assigned_chef_name && countdown === 0)) && (
                        <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          Tự gán sau 5p
                        </span>
                      )}
                    </div>
                  </div>

                  {ticket.item_status !== 'served' && (
                    <button
                      onClick={() => setIsChangingChef(true)}
                      className="text-[11px] text-slate-400 hover:text-amber-400 font-semibold p-1 hover:bg-dark-800 rounded-lg transition flex items-center gap-1"
                      title="Đổi đầu bếp khác"
                    >
                      <ArrowRightLeft className="w-3 h-3" /> Đổi
                    </button>
                  )}
                </div>
              )}

              {/* Case 3: Reassigning Chef Form */}
              {isChangingChef && (
                <div className="p-2 rounded-xl bg-dark-900 border border-amber-500/30 space-y-1.5">
                  <div className="text-[10px] text-amber-300 font-bold">Chọn lại đầu bếp phụ trách:</div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedChef || ticket.assigned_chef_name || ''}
                      onChange={(e) => setSelectedChef(e.target.value)}
                      className="flex-1 text-xs px-2 py-1 bg-dark-950 border border-dark-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Trần Bếp Trưởng">Trần Bếp Trưởng (Bếp trưởng)</option>
                      {chefsList.map((c) => (
                        <option key={c.id} value={c.full_name}>{c.full_name}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleSaveAssignedChef(selectedChef || 'Trần Bếp Trưởng', false)}
                      className="px-2 py-1 rounded-lg bg-emerald-500 text-dark-950 font-bold text-xs hover:bg-emerald-400 transition"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setIsChangingChef(false)}
                      className="px-2 py-1 rounded-lg bg-dark-800 text-slate-400 text-xs hover:text-white transition"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Button */}
      <div className="pt-3 border-t border-dark-700/60 flex items-center justify-between gap-2 flex-wrap">
        <DishStatusBadge status={ticket.item_status} />

        <div className="flex items-center gap-1.5">
          {ticket.item_status === 'pending' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={ChefHat}
                onClick={handleStartCooking}
              >
                Nhận nấu
              </Button>
              <button
                onClick={() => onUpdateStatus(ticket.item_id, 'served', selectedChef || ticket.assigned_chef_name || 'Trần Bếp Trưởng')}
                className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-dark-700 transition"
                title="Lên bàn ngay (đồ uống/tráng miệng sẵn có)"
              >
                Lên bàn ngay
              </button>
            </>
          )}

          {ticket.item_status === 'cooking' && (
            <>
              <button
                onClick={() => onUpdateStatus(ticket.item_id, 'pending')}
                className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-300 hover:bg-dark-800 transition"
                title="Quay lại trạng thái Chờ nấu"
              >
                Hoàn tác
              </button>
              <Button
                variant="orange"
                size="sm"
                icon={Sparkles}
                onClick={() => onUpdateStatus(ticket.item_id, 'ready')}
              >
                Nấu xong
              </Button>
            </>
          )}

          {ticket.item_status === 'ready' && (
            <>
              <button
                onClick={() => onUpdateStatus(ticket.item_id, 'cooking')}
                className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-300 hover:bg-dark-800 transition"
                title="Quay lại trạng thái Đang nấu"
              >
                Nấu lại
              </button>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => onUpdateStatus(ticket.item_id, 'served')}
              >
                Đã lên bàn
              </Button>
            </>
          )}

          {ticket.item_status === 'served' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Đã lên bàn
              </span>
              <button
                onClick={() => onUpdateStatus(ticket.item_id, 'ready')}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                title="Thu hồi về trạng thái Chưa lên bàn"
              >
                Hoàn tác
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

