import React from 'react';

export const TableStatusBadge = ({ status }) => {
  switch (status) {
    case 'empty':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Bàn Trống
        </span>
      );
    case 'occupied':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
          Đang Có Khách
        </span>
      );
    case 'waiting_food':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
          Chờ Món Bếp
        </span>
      );
    case 'reserved':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          Đã Đặt Trước
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
          {status}
        </span>
      );
  }
};

export const DishStatusBadge = ({ status }) => {
  switch (status) {
    case 'pending':
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30">
          Chờ nấu
        </span>
      );
    case 'cooking':
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
          Đang nấu
        </span>
      );
    case 'ready':
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
          Sẵn sàng
        </span>
      );
    case 'served':
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          Đã lên món
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400">
          {status}
        </span>
      );
  }
};

export const RoleBadge = ({ role }) => {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
        ADMIN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30">
      NHÂN VIÊN
    </span>
  );
};
