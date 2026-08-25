import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

const DEMO_USERS = {
  admin: {
    id: 1,
    username: 'admin',
    full_name: 'Trần Hoàng Quản Lý (Admin)',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    phone: '0909.888.999'
  },
  staff: {
    id: 2,
    username: 'staff',
    full_name: 'Nguyễn Văn Phục Vụ (Nhân Viên)',
    role: 'staff',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    phone: '0912.345.678'
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Verify with backend
          try {
            const res = await api.get('/auth/me');
            if (res.success && res.data) {
              setUser(res.data);
              localStorage.setItem('user', JSON.stringify(res.data));
            }
          } catch (err) {
            // Keep local stored user for resilient experience
          }
        } catch (e) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        // Default to Admin login on first visit for rich discovery
        const defaultAdmin = DEMO_USERS.admin;
        const demoToken = 'demo-admin-token-2026';
        setUser(defaultAdmin);
        setToken(demoToken);
        localStorage.setItem('token', demoToken);
        localStorage.setItem('user', JSON.stringify(defaultAdmin));
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.success && res.data) {
        const { token: newToken, user: userData } = res.data;
        setUser(userData);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        addToast(`Chào mừng ${userData.full_name} đã quay trở lại!`, 'success');
        return { success: true };
      }
    } catch (err) {
      // Local fallback for offline mode
      const match = Object.values(DEMO_USERS).find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (match) {
        const mockToken = `mock-token-${match.role}`;
        setUser(match);
        setToken(mockToken);
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(match));
        addToast(`Đăng nhập thành công với vai trò ${match.role.toUpperCase()}`, 'success');
        return { success: true };
      }
      addToast(err.message || 'Đăng nhập thất bại', 'error');
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    addToast('Đã đăng xuất khỏi hệ thống', 'info');
  };

  // Quick switch role for easy pairing & evaluation
  const switchRole = (roleTarget) => {
    const targetUser = DEMO_USERS[roleTarget] || DEMO_USERS.admin;
    setUser(targetUser);
    const mockToken = `mock-token-${targetUser.role}`;
    setToken(mockToken);
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(targetUser));
    addToast(`Đã chuyển sang vai trò: ${roleTarget === 'admin' ? 'Quản lý (Admin)' : 'Nhân viên (Staff)'}`, 'info');
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isStaff,
        login,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
