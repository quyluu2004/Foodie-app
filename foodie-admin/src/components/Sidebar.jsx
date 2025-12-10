import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  ChefHat,
  FolderTree,
  MessageSquare,
  MessageCircle,
  Bell,
  Flag,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Star,
  Home,
} from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'Người dùng' },
  { path: '/recipes', icon: ChefHat, label: 'Công thức' },
  { path: '/posts', icon: FileText, label: 'Quản lý bài đăng' },
  { path: '/homepage', icon: Home, label: 'Quản lý trang chủ' },
  { path: '/categories', icon: FolderTree, label: 'Danh mục' },
  { path: '/messages', icon: MessageSquare, label: 'Tin nhắn' },
  { path: '/chat', icon: MessageCircle, label: 'Chat trực tiếp' },
  { path: '/notifications', icon: Bell, label: 'Thông báo hệ thống' },
  { path: '/comments', icon: MessageSquare, label: 'Bình luận' },
  { path: '/ratings', icon: Star, label: 'Đánh giá' },
  { path: '/reports', icon: Flag, label: 'Báo cáo' },
  { path: '/analytics', icon: BarChart3, label: 'Thống kê' },
];

export default function Sidebar({ isCollapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isDark } = useDarkMode();

  const handleLogout = () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/login');
    }
  };

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate__animated animate__fadeIn"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: '#FF8C42' }}
        className={`
          ${isCollapsed ? 'w-20' : 'w-64'} h-screen fixed left-0 top-0 flex flex-col z-40
          transition-all duration-300
          ${isMobileOpen ? '' : 'hidden lg:flex'}
          shadow-lg
        `}
      >
        <div className={`p-4 ${isCollapsed ? 'px-3' : 'px-6'} border-b border-[#FF6B35]/30`}>
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex-1 flex justify-center">
                <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Dancing Script', cursive", color: '#FFFFFF' }}>Foodie</h1>
              </div>
            )}
            {isCollapsed && (
              <div className="w-full flex justify-center">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-sm text-white" style={{ fontFamily: "'Dancing Script', cursive", color: '#FFFFFF' }}>F</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 hover:bg-white/20 rounded"
              style={{ color: '#FFFFFF' }}
            >
              <X className="w-5 h-5" style={{ color: '#FFFFFF' }} />
            </button>
          </div>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul style={{ gap: '1.405rem' }} className="flex flex-col">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li
                  key={item.path}
                  className="animate__animated animate__fadeInLeft"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Link
                    to={item.path}
                    className={`
                      sidebar-item flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-all
                      ${isActive
                        ? 'active bg-white shadow-sm'
                        : 'hover:bg-white/10'
                      }
                    `}
                    style={isActive ? { 
                      color: '#FF8C42', 
                      marginLeft: '0.5rem',
                      marginRight: '0.5rem'
                    } : { 
                      color: '#FFFFFF'
                    }}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon 
                      className="w-5 h-5 flex-shrink-0" 
                      style={isActive ? { color: '#FF8C42' } : { color: '#FFFFFF' }} 
                    />
                    {!isCollapsed && (
                      <span 
                        className="font-medium whitespace-nowrap"
                        style={isActive ? { color: '#FF8C42' } : { color: '#FFFFFF' }}
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-3 border-t border-[#FF6B35]/30 space-y-2">
          <button 
            onClick={onToggle}
            className="hidden lg:flex items-center justify-center w-full p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
            style={{ color: '#FFFFFF' }}
            title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" style={{ color: '#FFFFFF' }} /> : <ChevronLeft className="w-5 h-5" style={{ color: '#FFFFFF' }} />}
          </button>
          <button 
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 w-full hover:bg-white/20 rounded-lg transition-all duration-200`}
            style={{ color: '#FFFFFF' }}
            title={isCollapsed ? 'Đăng xuất' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" style={{ color: '#FFFFFF' }} />
            {!isCollapsed && <span className="font-medium whitespace-nowrap" style={{ color: '#FFFFFF' }}>Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

