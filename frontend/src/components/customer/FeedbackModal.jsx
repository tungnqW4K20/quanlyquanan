import React, { useState } from 'react';
import { Star, MessageSquareHeart, CheckCircle2, Phone, User, Send, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const RATING_LABELS = {
  1: 'Rất không hài lòng',
  2: 'Chưa đạt kỳ vọng',
  3: 'Tạm ổn / Bình thường',
  4: 'Hài lòng & Ngon miệng',
  5: 'Tuyệt vời thượng hạng! ⭐'
};

export const FeedbackModal = ({ isOpen, onClose, initialPhone = '', initialName = '', tableName = 'Bàn ăn' }) => {
  const [phone, setPhone] = useState(initialPhone);
  const [fullName, setFullName] = useState(initialName);
  const [foodRating, setFoodRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/customers/feedback', {
        customer_phone: phone,
        customer_name: fullName || 'Khách Ẩn Danh',
        table_name: tableName,
        food_rating: foodRating,
        service_rating: serviceRating,
        overall_rating: overallRating,
        comment
      });

      if (res.success) {
        setIsSubmitted(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        addToast('Cảm ơn bạn đã gửi đánh giá! Bạn được tặng +30 Điểm Tri Ân.', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Không thể gửi đánh giá, vui lòng thử lại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (currentRating, setRating) => {
    return (
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => setRating(star)}
            className="p-1 transition-transform hover:scale-125 focus:outline-none"
          >
            <Star
              className={`w-6 h-6 ${
                star <= currentRating ? 'text-amber-400 fill-amber-400' : 'text-neutral-600 hover:text-amber-500/50'
              }`}
            />
          </button>
        ))}
        <span className="text-xs font-bold text-amber-300 ml-2">{RATING_LABELS[currentRating]}</span>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đánh Giá Trải Nghiệm & Nhận Điểm Thưởng"
      icon={MessageSquareHeart}
      maxWidth="max-w-lg"
    >
      {isSubmitted ? (
        <div className="text-center py-6 space-y-4 animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">Hoàng Gia Quán Xin Chân Thành Cảm Ơn!</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Ý kiến đánh giá quý giá của bạn giúp chúng tôi không ngừng nâng cao chất lượng món ăn và dịch vụ mỗi ngày.
          </p>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Đã cộng +30 Điểm Hội Viên Tri Ân vào số điện thoại của bạn
          </div>
          <div className="pt-4">
            <Button variant="primary" onClick={onClose} className="w-full">
              Hoàn Tất
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-neutral-400">
            Mỗi đóng góp của bạn là động lực để Hoàng Gia Quán phục vụ hoàn hảo hơn. Tặng ngay{' '}
            <span className="text-amber-400 font-bold">+30 Điểm Hội Viên</span> sau khi gửi review!
          </p>

          {/* User info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">Số điện thoại (để nhận điểm)</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0988xxxxxx"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">Họ tên của bạn</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Anh / Chị..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Ratings list */}
          <div className="space-y-3 p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div>
              <span className="text-xs font-bold text-neutral-300 block mb-1.5">1. Hương vị & Chất lượng món ăn:</span>
              {renderStars(foodRating, setFoodRating)}
            </div>

            <div className="pt-3 border-t border-neutral-800">
              <span className="text-xs font-bold text-neutral-300 block mb-1.5">2. Thái độ & Tốc độ phục vụ:</span>
              {renderStars(serviceRating, setServiceRating)}
            </div>

            <div className="pt-3 border-t border-neutral-800">
              <span className="text-xs font-bold text-neutral-300 block mb-1.5">3. Trải nghiệm không gian & Cảm nhận chung:</span>
              {renderStars(overallRating, setOverallRating)}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-[11px] font-bold text-neutral-300 block mb-1">Ý kiến đóng góp hoặc lời khen dành cho quán:</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Món ăn rất ngon, không gian ấm cúng... / Cần cải thiện..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2 border-t border-neutral-800">
            <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={loading} icon={Send} className="flex-1 font-black">
              {loading ? 'Đang Gửi...' : 'Gửi Đánh Giá & Nhận Điểm'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
