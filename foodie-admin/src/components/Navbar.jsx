import { Bell, Search, User, Moon, Sun, MessageSquare, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Navbar({ onToggleSidebar, isSidebarCollapsed }) {
  const [userInfo, setUserInfo] = useState(null);
  const { isDark, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const userStr = localStorage.getItem('adminUser');
    if (userStr) {
      try {
        setUserInfo(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }
    fetchUnreadMessages();
    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadMessages = async () => {
    try {
      const response = await api.get('/messages?status=pending');
      setUnreadMessages(response.data?.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  const userName = userInfo?.name || 'Admin';
  const userEmail = userInfo?.email || 'admin@foodie.com';

  return (
    <nav className="bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-[#404040] px-4 lg:px-6 py-3 flex items-center justify-between shadow-sm dark:shadow-lg animate__animated animate__fadeInDown">
      <div className="flex items-center gap-4 flex-1">
        {/* Hamburger Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-[#333333] rounded-lg transition-all duration-200"
          title={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          style={{ color: '#FF8C42' }}
        >
          <Menu className="w-5 h-5" style={{ color: '#FF8C42' }} />
        </button>
        
        <div className="relative flex-1 max-w-md hidden md:block ml-4">
          <input
            type="text"
            placeholder="Tìm kiếm công thức, người dùng..."
            className="w-full pl-4 pr-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white dark:bg-[#333333] text-gray-900 placeholder-gray-400 dark:placeholder-[#CCCCCC]"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/messages')}
          className="relative p-2 text-gray-600 dark:text-[#E5E5E5] hover:text-primary dark:hover:text-[#FF8C42] hover:bg-gray-100 dark:hover:bg-[#333333] rounded-lg transition-all duration-200"
          title="Tin nhắn"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessages > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-[#FF8C42] text-white rounded-full text-xs font-medium flex items-center justify-center animate__animated animate__pulse shadow-lg">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </button>
        <button
          onClick={toggleDarkMode}
          className="p-2 text-gray-600 dark:text-[#E5E5E5] hover:text-primary dark:hover:text-[#FF8C42] hover:bg-gray-100 dark:hover:bg-[#333333] rounded-lg transition-all duration-200"
          title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-[#404040] ml-2">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-semibold shadow-md">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block ml-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-[#FFFFFF]">{userName}</p>
            <p className="text-xs text-gray-500 dark:text-[#E5E5E5]">{userEmail}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}

