import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Gift, Trophy, CheckCircle2, Phone, User, X, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const SEGMENTS = [
  { label: 'Giảm 20% Hóa Đơn', type: 'voucher', value: '20%', color: '#DC2626', textColor: '#FFFFFF' },
  { label: '+100 Điểm Thưởng', type: 'points', value: '100', color: '#D97706', textColor: '#FFFFFF' },
  { label: 'Tặng Trà Đào Cam Sả', type: 'drink', value: 'Trà Đào Cam Sả', color: '#EA580C', textColor: '#FFFFFF' },
  { label: '+200 Điểm Thưởng', type: 'points', value: '200', color: '#CA8A04', textColor: '#FFFFFF' },
  { label: 'Giảm 10% Hóa Đơn', type: 'voucher', value: '10%', color: '#E11D48', textColor: '#FFFFFF' },
  { label: '+500 Điểm VIP', type: 'points', value: '500', color: '#B45309', textColor: '#FFFFFF' },
  { label: 'Tặng Khoai Tây Phô Mai', type: 'appetizer', value: 'Khoai Tây Phô Mai', color: '#F59E0B', textColor: '#1F2937' },
  { label: '+50 Điểm May Mắn', type: 'points', value: '50', color: '#D97706', textColor: '#FFFFFF' }
];

export const LuckyWheelModal = ({ isOpen, onClose, initialPhone = '', initialName = '', onRewardClaimed }) => {
  const [phone, setPhone] = useState(initialPhone);
  const [fullName, setFullName] = useState(initialName);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reward, setReward] = useState(null);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (initialPhone) setPhone(initialPhone);
    if (initialName) setFullName(initialName);
  }, [initialPhone, initialName]);

  // Draw the Lucky Wheel
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const numSegments = SEGMENTS.length;
    const arcSize = (2 * Math.PI) / numSegments;
    const radius = canvas.width / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    SEGMENTS.forEach((seg, i) => {
      const angle = i * arcSize;

      // Draw segment arc
      ctx.beginPath();
      ctx.fillStyle = seg.color;
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius - 8, angle, angle + arcSize);
      ctx.lineTo(radius, radius);
      ctx.fill();

      // Border highlight
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = seg.textColor;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(seg.label, radius - 20, 4);
      ctx.restore();
    });

    // Center Golden Circle
    ctx.beginPath();
    ctx.arc(radius, radius, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#18181B';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();

    // Center star / icon text
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOÀNG GIA', radius, radius + 4);
  }, [isOpen]);

  const handleSpin = async () => {
    if (!phone || phone.trim().length < 9) {
      addToast('Vui lòng nhập số điện thoại để nhận thưởng', 'warning');
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setReward(null);

    // Pick random segment
    const targetIndex = Math.floor(Math.random() * SEGMENTS.length);
    const selectedSegment = SEGMENTS[targetIndex];

    const segmentAngle = 360 / SEGMENTS.length;
    // Calculate rotation to land pointer (at top: 270 deg) on selected segment
    const targetAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2);
    const totalSpins = 5 * 360; // 5 full rounds
    const finalRotation = rotation + totalSpins + (targetAngle - (rotation % 360));

    setRotation(finalRotation);

    // Animation duration 4.5s
    setTimeout(async () => {
      setIsSpinning(false);
      setReward(selectedSegment);

      // Trigger Confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Send to Backend
      try {
        const res = await api.post('/customers/play-game', {
          customer_phone: phone,
          customer_name: fullName,
          game_type: 'lucky_wheel',
          reward_type: selectedSegment.type,
          reward_value: selectedSegment.value,
          reward_label: selectedSegment.label
        });

        if (res.success && res.data) {
          addToast(`Chúc mừng bạn đã trúng: ${selectedSegment.label}!`, 'success');
          if (onRewardClaimed) onRewardClaimed(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    }, 4500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vòng Quay May Mắn Hoàng Gia"
      icon={Sparkles}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center space-y-5 text-center">
        <p className="text-xs text-neutral-400">
          Quay thưởng 100% trúng quà: Voucher giảm giá 20%, Tặng món khai vị, Nước uống & Hàng trăm điểm VIP!
        </p>

        {/* Phone & Name inputs */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
          <div>
            <label className="text-[11px] font-bold text-neutral-300 block mb-1">Số điện thoại (*)</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0988xxxxxx"
                disabled={isSpinning}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-300 block mb-1">Tên của bạn</label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                disabled={isSpinning}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Wheel Canvas Container */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 flex items-center justify-center max-w-full">
          {/* Outer Ring Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 blur-md pointer-events-none" />

          {/* Pointer Marker at Top */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
            <div className="w-5 h-7 sm:w-6 sm:h-8 bg-gradient-to-b from-yellow-400 to-amber-500 clip-pointer shadow-lg border-2 border-white" />
          </div>

          {/* Canvas Wheel */}
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none'
            }}
            className="w-[230px] h-[230px] sm:w-[280px] sm:h-[280px] rounded-full shadow-2xl border-4 border-amber-500/80 bg-neutral-950"
          />
        </div>

        {/* Reward Announce Banner */}
        {reward && (
          <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-500/40 animate-slide-up flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-sm">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>CHÚC MỪNG BẠN ĐÃ TRÚNG THƯỞNG!</span>
            </div>
            <div className="text-base font-black text-white mt-1">{reward.label}</div>
            <p className="text-[11px] text-neutral-300 mt-1">
              Mã quà tặng đã được lưu vào số điện thoại <span className="text-amber-300 font-bold">{phone}</span> và sẵn sàng áp dụng khi thanh toán.
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="w-full flex gap-3 pt-2 border-t border-neutral-800">
          <Button variant="secondary" onClick={onClose} disabled={isSpinning} className="flex-1">
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handleSpin}
            disabled={isSpinning || !phone}
            icon={Sparkles}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 font-black"
          >
            {isSpinning ? 'Đang Quay...' : 'QUAY NGAY!'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
