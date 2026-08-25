import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, RotateCcw, CheckCircle2, Phone, User, Flame, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const CARD_ITEMS = [
  { id: 'wagyu', name: 'Bò Wagyu Nướng', icon: '🥩', bg: 'bg-red-500/20 text-red-400 border-red-500/40' },
  { id: 'tomyum', name: 'Lẩu Tomyum', icon: '🍲', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  { id: 'shrimp', name: 'Tôm Càng Xanh', icon: '🦐', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  { id: 'ribs', name: 'Sườn Mật Ong', icon: '🍖', bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
  { id: 'peach_tea', name: 'Trà Đào Cam Sả', icon: '🍹', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { id: 'spring_roll', name: 'Gỏi Cuốn Tôm', icon: '🥗', bg: 'bg-teal-500/20 text-teal-400 border-teal-500/40' }
];

export const CardMatchingModal = ({ isOpen, onClose, initialPhone = '', initialName = '', onRewardClaimed }) => {
  const [phone, setPhone] = useState(initialPhone);
  const [fullName, setFullName] = useState(initialName);
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isGameWon, setIsGameWon] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (initialPhone) setPhone(initialPhone);
    if (initialName) setFullName(initialName);
  }, [initialPhone, initialName]);

  // Setup game on open
  useEffect(() => {
    if (isOpen) {
      resetGame();
    }
  }, [isOpen]);

  // Timer loop
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && !isGameWon) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isGameWon]);

  const resetGame = () => {
    const deck = [...CARD_ITEMS, ...CARD_ITEMS]
      .map((item, index) => ({ ...item, uniqueKey: `${item.id}-${index}` }))
      .sort(() => Math.random() - 0.5);

    setCards(deck);
    setFlippedIndices([]);
    setMatchedIds([]);
    setMoves(0);
    setIsGameWon(false);
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  const handleCardClick = (index) => {
    if (!phone || phone.trim().length < 9) {
      addToast('Vui lòng nhập số điện thoại trước khi chơi', 'warning');
      return;
    }

    if (!isTimerRunning && matchedIds.length < 6) {
      setIsTimerRunning(true);
    }

    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedIds.includes(cards[index].id)) {
      return;
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [idx1, idx2] = newFlipped;
      if (cards[idx1].id === cards[idx2].id) {
        // Matched!
        const newMatched = [...matchedIds, cards[idx1].id];
        setMatchedIds(newMatched);
        setFlippedIndices([]);

        if (newMatched.length === CARD_ITEMS.length) {
          handleWin();
        }
      } else {
        // Not matched -> unflip after 900ms
        setTimeout(() => {
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const handleWin = async () => {
    setIsGameWon(true);
    setIsTimerRunning(false);

    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 }
    });

    try {
      const res = await api.post('/customers/play-game', {
        customer_phone: phone,
        customer_name: fullName,
        game_type: 'card_matching',
        reward_type: 'points',
        reward_value: '300',
        reward_label: '+300 Điểm Thưởng Trí Nhớ'
      });

      if (res.success && res.data) {
        addToast('Chúc mừng bạn đã hoàn thành game và nhận ngay +300 Điểm Thưởng!', 'success');
        if (onRewardClaimed) onRewardClaimed(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mini Game: Lật Thẻ Bài Ẩm Thực Hoàng Gia"
      icon={Sparkles}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-center">
        <p className="text-xs text-neutral-400">
          Tìm đúng 6 cặp món ăn đặc sản của quán nhanh nhất để nhận ngay <span className="text-amber-400 font-bold">+300 Điểm Hội Viên</span>!
        </p>

        {/* Player details */}
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
                disabled={isTimerRunning}
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
                disabled={isTimerRunning}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Clock className="w-4 h-4" />
            <span>{timerSeconds}s</span>
          </div>
          <div className="text-neutral-400">
            Lượt lật: <span className="text-white font-bold">{moves}</span>
          </div>
          <div className="text-neutral-400">
            Đã ghép: <span className="text-emerald-400 font-bold">{matchedIds.length}/6</span>
          </div>
        </div>

        {/* 4x3 Cards Grid */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 my-2">
          {cards.map((card, idx) => {
            const isFlipped = flippedIndices.includes(idx) || matchedIds.includes(card.id);
            const isMatched = matchedIds.includes(card.id);

            return (
              <button
                key={card.uniqueKey}
                onClick={() => handleCardClick(idx)}
                disabled={isMatched || flippedIndices.length === 2}
                className={`h-16 sm:h-20 rounded-xl sm:rounded-2xl border transition-all duration-300 transform perspective-1000 flex flex-col items-center justify-center p-0.5 sm:p-1 relative shadow-lg ${
                  isMatched
                    ? `${card.bg} opacity-90 scale-95`
                    : isFlipped
                    ? `${card.bg} scale-100`
                    : 'bg-neutral-950 border-amber-500/30 hover:border-amber-500/70 hover:scale-105'
                }`}
              >
                {isFlipped ? (
                  <div className="flex flex-col items-center animate-flip">
                    <span className="text-xl sm:text-2xl">{card.icon}</span>
                    <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 text-white truncate max-w-[55px] sm:max-w-[70px]">{card.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-[11px] sm:text-xs">
                      HG
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Winning Screen */}
        {isGameWon && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-neutral-950 to-teal-500/20 border border-emerald-500/40 animate-slide-up flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>XUẤT SẮC! BẠN ĐÃ THẮNG TRONG {timerSeconds} GIÂY!</span>
            </div>
            <div className="text-base font-black text-amber-400 mt-1">+300 ĐIỂM HỘI VIÊN</div>
            <p className="text-[11px] text-neutral-300 mt-1">
              Điểm thưởng đã được tích vào tài khoản SĐT <span className="text-white font-bold">{phone}</span>!
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 pt-2 border-t border-neutral-800">
          <Button variant="secondary" onClick={resetGame} icon={RotateCcw} className="flex-1">
            Chơi Lại
          </Button>
          <Button variant="primary" onClick={onClose} className="flex-1">
            Xong
          </Button>
        </div>
      </div>
    </Modal>
  );
};
