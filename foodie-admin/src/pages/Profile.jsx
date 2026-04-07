import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, LogOut, ChefHat, AlertTriangle, X, Check } from 'lucide-react';

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#3A3A3A] max-w-sm w-full p-6 animate__animated animate__zoomIn">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Xác nhận đăng xuất</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bạn có chắc muốn đăng xuất khỏi hệ thống quản trị?
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-[#3A3A3A] rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors font-medium text-sm"
          >
            <X className="w-4 h-4" />
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-red-200 dark:shadow-red-900/30 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const userStr = localStorage.getItem('adminUser');
  const userInfo = (() => {
    try { return userStr ? JSON.parse(userStr) : null; } catch { return null; }
  })();

  const name = userInfo?.name || 'Admin';
  const email = userInfo?.email || '—';
  const role = userInfo?.role || 'admin';
  const joinedAt = userInfo?.createdAt
    ? new Date(userInfo.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      {showLogoutModal && (
        <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogoutModal(false)} />
      )}

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200 dark:shadow-orange-900/30">
            <User className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Hồ sơ cá nhân</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-[52px]">Thông tin tài khoản quản trị viên</p>
      </div>

      {/* ── Avatar Card ── */}
      <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] shadow-sm overflow-hidden">
        {/* Gradient banner */}
        <div className="h-24 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 relative">
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-xl border-4 border-white dark:border-[#2A2A2A]">
              <span className="text-3xl font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-14 pb-6 px-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-semibold rounded-full border border-orange-100 dark:border-orange-900/30 capitalize">
              <Shield className="w-3 h-3" />
              {role === 'admin' ? 'Quản trị viên' : role}
            </span>
          </div>
        </div>
      </div>

      {/* ── Info Fields ── */}
      <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] shadow-sm divide-y divide-gray-50 dark:divide-[#333333]">
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Tên hiển thị</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-4">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Email</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-4">
          <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Vai trò</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {role === 'admin' ? 'Quản trị viên' : role}
            </p>
          </div>
        </div>

        {joinedAt && (
          <div className="flex items-center gap-4 px-6 py-4">
            <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Ngày tham gia</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{joinedAt}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Logout Button ── */}
      <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Đăng xuất</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Kết thúc phiên làm việc và quay về trang đăng nhập.
        </p>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-red-200 dark:shadow-red-900/30 hover:shadow-lg active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất khỏi hệ thống
        </button>
      </div>
    </div>
  );
}
