import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Bell, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter,
  User,
  ChefHat,
  MessageSquare,
  Star,
  Flag,
  ThumbsUp,
  UserPlus,
  FileText,
  AlertCircle,
  Clock
} from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all'); // all, read, unread

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [filterType, filterRead]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '100');
      if (filterRead === 'unread') {
        params.append('unreadOnly', 'true');
      }
      
      const response = await api.get(`/notifications/all?${params.toString()}`);
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      alert('Có lỗi xảy ra khi tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
      alert('Có lỗi xảy ra khi đánh dấu đã đọc');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!confirm('Bạn có chắc muốn đánh dấu tất cả thông báo đã đọc?')) return;
    
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(n => api.put(`/notifications/${n._id}/read`))
      );
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      alert('Đã đánh dấu tất cả thông báo đã đọc');
    } catch (error) {
      console.error('Error marking all as read:', error);
      alert('Có lỗi xảy ra khi đánh dấu tất cả đã đọc');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    
    try {
      // Note: Admin can't delete user notifications via current API
      // This would need a separate admin delete endpoint
      alert('Chức năng xóa thông báo của user hiện chưa được hỗ trợ cho admin');
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Có lỗi xảy ra khi xóa thông báo');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'post_removed':
        return { icon: FileText, color: 'text-red-600', bg: 'bg-red-100' };
      case 'recipe_removed':
        return { icon: ChefHat, color: 'text-red-600', bg: 'bg-red-100' };
      case 'recipe_updated':
        return { icon: ChefHat, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'comment_removed':
        return { icon: MessageSquare, color: 'text-red-600', bg: 'bg-red-100' };
      case 'post_approved':
      case 'recipe_approved':
        return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' };
      case 'follow':
        return { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'like':
        return { icon: ThumbsUp, color: 'text-pink-600', bg: 'bg-pink-100' };
      case 'comment':
        return { icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'report_resolved':
        return { icon: Flag, color: 'text-green-600', bg: 'bg-green-100' };
      case 'admin_message':
        return { icon: AlertCircle, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'user_promoted':
        return { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'user_password_changed':
        return { icon: User, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'user_deleted':
        return { icon: User, color: 'text-red-600', bg: 'bg-red-100' };
      case 'rating_removed':
        return { icon: Star, color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getNotificationTypeLabel = (type) => {
    const labels = {
      'post_removed': 'Bài đăng bị xóa',
      'recipe_removed': 'Công thức bị xóa',
      'recipe_updated': 'Công thức được cập nhật',
      'comment_removed': 'Bình luận bị xóa',
      'post_approved': 'Bài đăng được duyệt',
      'recipe_approved': 'Công thức được duyệt',
      'follow': 'Người theo dõi',
      'like': 'Thích',
      'comment': 'Bình luận',
      'report_resolved': 'Báo cáo đã giải quyết',
      'admin_message': 'Tin nhắn từ admin',
      'user_promoted': 'Được nâng cấp',
      'user_password_changed': 'Mật khẩu đã đổi',
      'user_deleted': 'Tài khoản bị xóa',
      'rating_removed': 'Đánh giá bị xóa',
    };
    return labels[type] || type;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch = 
      notif.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || notif.type === filterType;
    const matchesRead = 
      filterRead === 'all' || 
      (filterRead === 'read' && notif.isRead) ||
      (filterRead === 'unread' && !notif.isRead);
    
    return matchesSearch && matchesType && matchesRead;
  });

  const uniqueTypes = [...new Set(notifications.map(n => n.type))];

  return (
    <div className="p-4 lg:p-6 animate__animated animate__fadeInUp page-transition w-full">
      <div className="mb-6 animate__animated animate__fadeInDown">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 header-gradient inline-block">
              🔔 Thông báo hệ thống
            </h1>
            <p className="text-gray-600 mt-1">
              Xem tất cả thông báo của người dùng để biết ai đã làm gì
              {unreadCount > 0 && (
                <span className="ml-3 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-bold shadow-lg animate-pulse border-2 border-red-300">
                  {unreadCount} thông báo chưa đọc
                </span>
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
        >
          <option value="all">Tất cả loại</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>{getNotificationTypeLabel(type)}</option>
          ))}
        </select>
        <select
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
        >
          <option value="all">Tất cả</option>
          <option value="unread">Chưa đọc</option>
          <option value="read">Đã đọc</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải thông báo...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Không có thông báo nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notif) => {
              const iconInfo = getNotificationIcon(notif.type);
              const IconComponent = iconInfo.icon;

              return (
                <div
                  key={notif._id}
                  className={`p-6 transition-colors ${
                    !notif.isRead 
                      ? 'bg-blue-50/50 border-l-4 border-l-blue-500' 
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full ${iconInfo.bg} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className={`w-6 h-6 ${iconInfo.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className={`text-lg font-bold ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notif.title}
                            </h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              {getNotificationTypeLabel(notif.type)}
                            </span>
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          
                          {/* User Info */}
                          <div className="flex items-center gap-2 mb-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-700">
                              {notif.user?.name || 'Người dùng'}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">
                              {notif.user?.email || 'N/A'}
                            </span>
                            {notif.user?.role && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  notif.user.role === 'admin' 
                                    ? 'bg-red-100 text-red-700'
                                    : notif.user.role === 'creator'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {notif.user.role === 'admin' ? 'Quản trị' : 
                                   notif.user.role === 'creator' ? 'Người tạo' : 'Người dùng'}
                                </span>
                              </>
                            )}
                          </div>

                          <p className="text-gray-700 mb-2 leading-relaxed">
                            {notif.message}
                          </p>

                          {notif.reason && (
                            <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-l-yellow-400 rounded">
                              <p className="text-sm">
                                <span className="font-semibold text-yellow-800">Lý do: </span>
                                <span className="text-yellow-700">{notif.reason}</span>
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(notif.createdAt)}</span>
                            </div>
                            {notif.relatedType && notif.relatedId && (
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                {notif.relatedType}: {notif.relatedId.toString().substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notif.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notif._id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Đánh dấu đã đọc"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

