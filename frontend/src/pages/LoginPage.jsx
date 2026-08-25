import React, { useState } from 'react';
import { UtensilsCrossed, Lock, User, Sparkles, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      addToast('Vui lòng nhập đầy đủ tài khoản và mật khẩu', 'warning');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('123456');
      login('admin', '123456');
    } else {
      setUsername('staff');
      setPassword('123456');
      login('staff', '123456');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-dark-900 border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-0.5 shadow-xl shadow-amber-500/20 mx-auto flex items-center justify-center">
            <div className="w-full h-full bg-dark-950 rounded-[14px] flex items-center justify-center">
              <UtensilsCrossed className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-400 tracking-wide uppercase">
            Hoàng Gia Quán
          </h2>
          <p className="text-xs text-slate-400 font-medium">Hệ Thống Quản Lý Quán Ăn Chuyên Nghiệp</p>
        </div>

        {/* Quick Demo Login Pill */}
        <div className="p-3 rounded-2xl bg-dark-850 border border-dark-700/80 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Đăng nhập nhanh 1 chạm (Demo)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-dark-950 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Role: Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('staff')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500 hover:text-white transition-all"
            >
              <UserCheck className="w-4 h-4" />
              Role: Nhân Viên
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Tên đăng nhập</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin hoặc staff"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-850 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-850 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={ArrowRight}
            loading={loading}
            className="w-full mt-2 shadow-xl shadow-amber-500/20"
          >
            Đăng Nhập Hệ Thống
          </Button>
        </form>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400 border-t border-dark-700/60 pt-4">
          Tài khoản mẫu: <span className="text-amber-400 font-bold">admin / 123456</span> hoặc{' '}
          <span className="text-orange-400 font-bold">staff / 123456</span>
        </div>
      </div>
    </div>
  );
};
