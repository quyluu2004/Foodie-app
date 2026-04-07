import { Bell, Search, Moon, Sun, MessageSquare, Menu, User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Navbar({ onToggleSidebar, isSidebarCollapsed }) {
  const [userInfo, setUserInfo] = useState(null);
  const { isDark, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem('adminUser');
    if (userStr) {
      try { setUserInfo(JSON.parse(userStr)); } catch (e) { /* ignore */ }
    }
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadMessages = async () => {
    try {
      const response = await api.get('/messages?status=pending');
      setUnreadMessages(response.data?.unreadCount || 0);
    } catch (error) {
      // silent fail
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  const handleProfile = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  const userName = userInfo?.name || 'Admin';
  const userEmail = userInfo?.email || 'admin@foodie.com';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <nav className="bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-[#404040] px-4 lg:px-6 py-3 flex items-center justify-between shadow-sm dark:shadow-lg">
      <div className="flex items-center gap-4 flex-1">
        {/* Hamburger */}
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-[#333333] rounded-lg transition-all duration-200"
          title={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          <Menu className="w-5 h-5 text-orange-500" />
        </button>

        {/* Search bar */}
        <div className="relative flex-1 max-w-md hidden md:block ml-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm công thức, người dùng..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-[#404040] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-gray-50 dark:bg-[#333333] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Messages */}
        <button
          onClick={() => navigate('/messages')}
          className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all"
          title="Tin nhắn"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessages > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all"
          title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Avatar + Dropdown */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2A2A2A] border border-transparent hover:border-gray-200 dark:hover:border-[#3A3A3A] transition-all"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
              {userInitial}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{userName}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight truncate max-w-[120px]">{userEmail}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#2A2A2A] rounded-2xl shadow-xl border border-gray-100 dark:border-[#3A3A3A] overflow-hidden z-50 animate__animated animate__fadeIn" style={{ animationDuration: '0.15s' }}>
              {/* User info header */}
              <div className="px-4 py-3 border-b border-gray-50 dark:border-[#333333]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-1.5">
                <button
                  onClick={handleProfile}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-left"
                >
                  <User className="w-4 h-4 flex-shrink-0" />
                  Hồ sơ cá nhân
                </button>
              </div>

              <div className="p-1.5 border-t border-gray-50 dark:border-[#333333]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
