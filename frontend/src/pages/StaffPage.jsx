import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, ShieldCheck, UserCheck, Edit2, Trash2, Phone, KeyRound, Power } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { RoleBadge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const StaffPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('staff');
  const [avatar, setAvatar] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user: currentUser } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = '/users?';
      if (roleFilter !== 'all') url += `role=${roleFilter}&`;
      if (search) url += `search=${search}&`;

      const res = await api.get(url);
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      addToast('Không thể tải danh sách nhân viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername('');
    setFullName('');
    setPassword('');
    setPhone('');
    setRole('staff');
    setAvatar('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setUsername(u.username);
    setFullName(u.full_name);
    setPassword('');
    setPhone(u.phone || '');
    setRole(u.role);
    setAvatar(u.avatar || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !fullName) {
      addToast('Vui lòng điền đủ tên đăng nhập và họ tên', 'warning');
      return;
    }
    if (!editingUser && !password) {
      addToast('Vui lòng nhập mật khẩu cho tài khoản mới', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        const payload = { full_name: fullName, role, phone, avatar };
        if (password) payload.password = password;
        const res = await api.put(`/users/${editingUser.id}`, payload);
        if (res.success) {
          addToast(`Cập nhật tài khoản "${fullName}" thành công!`, 'success');
          setIsModalOpen(false);
          fetchUsers();
        }
      } else {
        const res = await api.post('/users', {
          username,
          password,
          full_name: fullName,
          role,
          phone,
          avatar
        });
        if (res.success) {
          addToast(`Thêm tài khoản "${fullName}" thành công!`, 'success');
          setIsModalOpen(false);
          fetchUsers();
        }
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi lưu tài khoản', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u) => {
    try {
      const res = await api.patch(`/users/${u.id}/toggle-status`);
      if (res.success) {
        addToast(res.message || 'Cập nhật trạng thái thành công', 'success');
        fetchUsers();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi đổi trạng thái', 'error');
    }
  };

  const handleDelete = async (u) => {
    if (u.id === currentUser?.id) {
      addToast('Không thể tự xóa tài khoản của chính mình', 'warning');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${u.full_name}"?`)) return;

    try {
      const res = await api.delete(`/users/${u.id}`);
      if (res.success) {
        addToast(`Đã xóa nhân viên "${u.full_name}"`, 'success');
        fetchUsers();
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi xóa tài khoản', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(term) ||
      u.full_name.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="p-4 rounded-2xl bg-dark-850 border border-dark-700/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên đăng nhập, họ tên, số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Right filters & Add button */}
        <div className="flex items-center gap-2.5">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản lý (Admin)</option>
            <option value="staff">Nhân viên (Staff)</option>
          </select>

          <Button variant="primary" size="sm" icon={UserPlus} onClick={handleOpenAdd}>
            Thêm Nhân Viên
          </Button>
        </div>
      </div>

      {/* 2. Staff Table */}
      <div className="rounded-2xl bg-dark-850 border border-dark-700/80 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Đang tải danh sách nhân sự...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-300">Không tìm thấy nhân viên nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900/80 border-b border-dark-700 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Nhân viên</th>
                  <th className="px-5 py-3.5">Tên đăng nhập</th>
                  <th className="px-5 py-3.5">Vai trò</th>
                  <th className="px-5 py-3.5">Số điện thoại</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.avatar ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
                          }
                          alt={u.full_name}
                          className="w-10 h-10 rounded-xl object-cover border border-dark-700 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-100 text-sm block">
                            {u.full_name}
                          </span>
                          <span className="text-[11px] text-slate-400">ID: #{u.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-400">
                      @{u.username}
                    </td>
                    <td className="px-5 py-3.5">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-mono">
                      {u.phone || 'Chưa cập nhật'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                          u.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'
                          }`}
                        />
                        {u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Sửa nhân viên"
                          className="p-1.5 rounded-lg bg-dark-900 border border-dark-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(u)}
                            title="Xóa tài khoản"
                            className="p-1.5 rounded-lg bg-dark-900 border border-dark-700 text-slate-300 hover:text-red-400 hover:border-red-500/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Add/Edit Staff Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? 'Chỉnh Sửa Thông Tin Nhân Viên' : 'Thêm Nhân Viên Mới'}
          icon={UserPlus}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Tên đăng nhập *
              </label>
              <input
                type="text"
                placeholder="Ví dụ: phucvu_01"
                value={username}
                disabled={!!editingUser}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500 disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Họ và tên *</label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {editingUser ? 'Đổi mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu *'}
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                required={!editingUser}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Vai trò</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="staff">Nhân viên (Staff)</option>
                  <option value="admin">Quản lý (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="0912..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Link ảnh đại diện</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-700">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                Hủy
              </Button>
              <Button variant="primary" type="submit" loading={submitting}>
                {editingUser ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
