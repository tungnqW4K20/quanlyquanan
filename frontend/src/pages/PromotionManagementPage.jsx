import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Tag,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Image as ImageIcon,
  Flame,
  Palette,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const BANNER_PRESETS = [
  {
    name: 'Bò Wagyu Nướng',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Lẩu Tomyum Hải Sản',
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Hải Sản Tươi Sống',
    url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Bữa Tiệc Sang Trọng',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
  }
];

export const PromotionManagementPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge_text: 'HOT DEAL',
    discount_percent: 20,
    discount_code: '',
    banner_url: BANNER_PRESETS[0].url,
    theme_gradient: 'from-amber-600 via-orange-600 to-red-700',
    accent_color: '#F59E0B',
    is_active: true,
    start_date: '2026-08-01',
    end_date: '2026-08-31',
    description: ''
  });

  const { addToast } = useToast();

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/promotions');
      if (res.success && res.data) {
        setPromotions(res.data);
      }
    } catch (err) {
      addToast('Không thể tải danh sách khuyến mãi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData({
      title: '',
      subtitle: '',
      badge_text: 'HOT DEAL',
      discount_percent: 20,
      discount_code: '',
      banner_url: BANNER_PRESETS[0].url,
      theme_gradient: 'from-amber-600 via-orange-600 to-red-700',
      accent_color: '#F59E0B',
      is_active: true,
      start_date: '2026-08-01',
      end_date: '2026-08-31',
      description: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      title: promo.title,
      subtitle: promo.subtitle || '',
      badge_text: promo.badge_text || 'HOT DEAL',
      discount_percent: parseFloat(promo.discount_percent) || 0,
      discount_code: promo.discount_code || '',
      banner_url: promo.banner_url || BANNER_PRESETS[0].url,
      theme_gradient: promo.theme_gradient || 'from-amber-600 via-orange-600 to-red-700',
      accent_color: promo.accent_color || '#F59E0B',
      is_active: !!promo.is_active,
      start_date: promo.start_date ? promo.start_date.slice(0, 10) : '',
      end_date: promo.end_date ? promo.end_date.slice(0, 10) : '',
      description: promo.description || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      addToast('Vui lòng nhập tiêu đề chiến dịch', 'warning');
      return;
    }

    try {
      if (editingPromo) {
        const res = await api.put(`/promotions/${editingPromo.id}`, formData);
        if (res.success) {
          addToast('Cập nhật chiến dịch quảng cáo thành công!', 'success');
        }
      } else {
        const res = await api.post('/promotions', formData);
        if (res.success) {
          addToast('Tạo chiến dịch quảng cáo mới thành công!', 'success');
        }
      }
      setModalOpen(false);
      fetchPromotions();
    } catch (err) {
      addToast(err.message || 'Lỗi khi lưu chiến dịch', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chiến dịch quảng cáo này?')) return;
    try {
      const res = await api.delete(`/promotions/${id}`);
      if (res.success) {
        addToast('Đã xóa chiến dịch quảng cáo', 'success');
        fetchPromotions();
      }
    } catch (err) {
      addToast('Không thể xóa chiến dịch', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-orange-500/15 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Quản Trị Marketing & Banner
            </span>
            <Megaphone className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Chiến Dịch Quảng Cáo & Thông Báo Giảm Giá
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Tự do thiết kế banner quảng cáo, thông điệp ưu đãi, mã voucher và kỳ giảm giá theo chủ đề
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={handleOpenCreate}
          className="font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
        >
          Lên Chiến Dịch Mới
        </Button>
      </div>

      {/* 2. Promotions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className={`rounded-3xl border transition-all overflow-hidden flex flex-col justify-between shadow-xl ${
              promo.is_active
                ? 'bg-neutral-900 border-amber-500/30 hover:border-amber-500/70'
                : 'bg-neutral-950 border-neutral-800 opacity-60'
            }`}
          >
            {/* Banner Preview Image */}
            <div className="relative h-44 w-full overflow-hidden bg-neutral-950">
              <img
                src={promo.banner_url || BANNER_PRESETS[0].url}
                alt={promo.title}
                className="w-full h-full object-cover filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-neutral-950 shadow">
                  {promo.badge_text || 'HOT DEAL'}
                </span>
                {promo.is_active ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Đang chạy
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                    Tạm dừng
                  </span>
                )}
              </div>

              {promo.discount_code && (
                <span className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-neutral-900/90 text-amber-300 border border-amber-500/40 shadow">
                  Mã: {promo.discount_code}
                </span>
              )}
            </div>

            {/* Promo Info */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-extrabold text-base text-white">{promo.title}</h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{promo.subtitle || promo.description}</p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 block">Mức giảm giá</span>
                  <span className="font-black text-amber-400 text-sm">
                    {promo.discount_percent > 0 ? `Giảm ${promo.discount_percent}%` : 'Quà tặng'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 block">Thời hạn áp dụng</span>
                  <span className="font-medium text-neutral-300 text-[11px]">
                    {promo.start_date ? promo.start_date.slice(0, 10) : 'Từ hôm nay'} ➔{' '}
                    {promo.end_date ? promo.end_date.slice(0, 10) : 'Vô thời hạn'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <Button variant="secondary" size="sm" icon={Edit2} onClick={() => handleOpenEdit(promo)}>
                  Chỉnh Sửa
                </Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(promo.id)}>
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Create / Edit Promotion Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPromo ? 'Chỉnh Sửa Chiến Dịch Quảng Cáo' : 'Tạo Chiến Dịch Quảng Cáo Mới'}
        icon={Megaphone}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">Tiêu đề chiến dịch (*)</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: ĐẠI TIỆC WAGYU - GIẢM 20%"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">Nhãn nổi bật</label>
              <input
                type="text"
                value={formData.badge_text}
                onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                placeholder="VD: HOT DEAL, HAPPY HOUR"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Subtitle / Slogan */}
          <div>
            <label className="text-[11px] font-bold text-neutral-300 block mb-1">Khẩu hiệu / Slogan ngắn</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="VD: Bò Wagyu vân mỡ cẩm thạch mềm tan nướng đá núi lửa độc quyền..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Discount & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">% Giảm giá (0 - 100%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">Mã Voucher áp dụng</label>
              <input
                type="text"
                value={formData.discount_code}
                onChange={(e) => setFormData({ ...formData, discount_code: e.target.value.toUpperCase() })}
                placeholder="VD: WAGYU20, HAPPYHOUR"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-xs text-white uppercase font-mono font-bold focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Banner URL & Presets */}
          <div>
            <label className="text-[11px] font-bold text-neutral-300 block mb-1">Ảnh Banner quảng cáo (URL)</label>
            <input
              type="text"
              value={formData.banner_url}
              onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
              placeholder="https://..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none mb-2"
            />

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[10px] text-neutral-500 shrink-0">Gợi ý ảnh HD:</span>
              {BANNER_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => setFormData({ ...formData, banner_url: preset.url })}
                  className="px-2 py-1 rounded-lg text-[10px] bg-neutral-800 hover:bg-amber-500/20 text-neutral-300 hover:text-amber-300 border border-neutral-700 whitespace-nowrap transition"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dates & Active */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">Ngày kết thúc</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-neutral-900 border-neutral-700"
                />
                <span className="text-xs font-bold text-white">Kích hoạt hiển thị</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-neutral-300 block mb-1">Nội dung chi tiết chương trình</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Chi tiết áp dụng, khung giờ, điều kiện áp dụng..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 outline-none resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2 border-t border-neutral-800">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Hủy
            </Button>
            <Button variant="primary" type="submit" className="flex-1 font-black">
              {editingPromo ? 'Lưu Thay Đổi' : 'Tạo Chiến Dịch Quảng Cáo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
