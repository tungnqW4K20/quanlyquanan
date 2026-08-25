import React, { useState } from 'react';
import { ShieldCheck, HeartHandshake, CalendarCheck, MessageSquareHeart, Clock, ChevronDown, ChevronUp, Sparkles, Award } from 'lucide-react';

export default function StaffRulesBanner() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/40 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl shadow-amber-500/5 mb-6 transition-all duration-300 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-500/20 font-black">
            <Award className="w-6 h-6 text-neutral-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                Nội Quy & Tiêu Chuẩn Phục Vụ 5 Sao Dành Cho Nhân Viên
              </h2>
              <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SOP CHUẨN HOÀNG GIA
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Kim chỉ nam nghiệp vụ: Tư vấn tận tâm, check kỹ bàn đặt trước, phục vụ chu đáo & nhắc giờ buffet tinh tế.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition shrink-0"
        >
          {isExpanded ? (
            <>
              <span className="hidden sm:inline">Thu gọn</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Xem chi tiết nội quy</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Expanded Rule Cards Grid */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4 pt-4 border-t border-neutral-800 relative z-10 animate-fade-in">
          {/* Rule 1 */}
          <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-amber-500/20 hover:border-amber-500/40 transition group hover:shadow-lg hover:shadow-amber-500/5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-amber-500 group-hover:text-neutral-950 transition">
                1
              </div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                Tư Vấn & Gợi Ý Bàn
              </h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Chủ động chào đón niềm nở, gợi ý bàn có sức chứa và vị trí đẹp nhất cho khách. Giới thiệu nhiệt tình các <strong className="text-amber-400">Combo ưu đãi</strong> và <strong className="text-amber-400">Gói Buffet 2h</strong> để khách tiết kiệm tối đa.
            </p>
          </div>

          {/* Rule 2 */}
          <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-amber-500/20 hover:border-amber-500/40 transition group hover:shadow-lg hover:shadow-amber-500/5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-blue-500 group-hover:text-neutral-950 transition">
                2
              </div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-blue-400" />
                Check Kỹ Bàn Đặt Trước
              </h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Trước khi xếp bàn cho khách mới vào, luôn <strong className="text-blue-400">kiểm tra kỹ trên hệ thống</strong> xem bàn đó có khách đặt trước không. Tuyệt đối không xếp nhầm bàn của khách đã đặt và pre-order món.
            </p>
          </div>

          {/* Rule 3 */}
          <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-amber-500/20 hover:border-amber-500/40 transition group hover:shadow-lg hover:shadow-amber-500/5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-emerald-500 group-hover:text-neutral-950 transition">
                3
              </div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                <MessageSquareHeart className="w-4 h-4 text-emerald-400" />
                Lắng Nghe & Trả Lời Ngay
              </h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Khách cần gì hay thắc mắc về thực đơn, nguyên liệu phải giải đáp <strong className="text-emerald-400">ngay lập tức với thái độ ân cần</strong>. Phối hợp nhịp nhàng với KDS Bếp để đảm bảo ra món nóng sốt, đúng yêu cầu.
            </p>
          </div>

          {/* Rule 4 */}
          <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-amber-500/20 hover:border-amber-500/40 transition group hover:shadow-lg hover:shadow-amber-500/5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-rose-500 group-hover:text-neutral-950 transition">
                4
              </div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-400" />
                Nhắc Giờ Buffet Nhẹ Nhàng
              </h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Bàn ăn Buffet có giới hạn 120 phút. Khi đồng hồ <strong className="text-rose-400">còn dưới 20 phút</strong>, nhân viên đến hỏi thăm độ hài lòng, châm thêm nước lẩu và mời món tráng miệng kèm nhắc giờ khéo léo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
