import { useState, useEffect } from 'react';
import api from '../utils/api';
import { MessageSquare, CheckCircle, XCircle, Clock, Send, Eye, EyeOff, Trash2 } from 'lucide-react';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, read, replied, resolved

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/messages${params}`);
      setMessages(response.data?.data || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
      alert('Có lỗi xảy ra khi tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await api.put(`/messages/${messageId}/read`);
      fetchMessages();
    } catch (error) {
      console.error('Error marking as read:', error);
      alert('Có lỗi xảy ra khi đánh dấu đã đọc');
    }
  };

  const handleMarkAsResolved = async (messageId) => {
    if (!confirm('Bạn có chắc muốn đánh dấu tin nhắn này đã được giải quyết?')) return;
    
    try {
      await api.put(`/messages/${messageId}/resolve`);
      fetchMessages();
      alert('Đã đánh dấu đã giải quyết thành công!');
    } catch (error) {
      console.error('Error marking as resolved:', error);
      alert('Có lỗi xảy ra khi đánh dấu đã giải quyết');
    }
  };

  const handleDeleteClick = (message) => {
    setSelectedMessage(message);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMessage || !selectedMessage._id) {
      alert('Không tìm thấy tin nhắn để xóa');
      return;
    }
    
    try {
      setDeleting(true);
      await api.delete(`/messages/${selectedMessage._id}`, {
        data: { reason: deleteReason.trim() },
        headers: { 'Content-Type': 'application/json' }
      });
      
      setMessages(messages.filter((m) => m._id !== selectedMessage._id));
      setShowDeleteModal(false);
      setSelectedMessage(null);
      setDeleteReason('');
      alert('Đã xóa tin nhắn thành công!');
    } catch (error) {
      console.error('Error deleting message:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa tin nhắn';
      alert(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      alert('Vui lòng nhập nội dung trả lời');
      return;
    }

    try {
      setReplying(true);
      await api.post(`/messages/${selectedMessage._id}/reply`, { reply: replyText });
      alert('Trả lời tin nhắn thành công!');
      setReplyText('');
      setShowReplyModal(false);
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Error replying:', error);
      alert('Có lỗi xảy ra khi trả lời tin nhắn');
    } finally {
      setReplying(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        bg: 'bg-amber-100 dark:bg-amber-900/40', 
        text: 'text-amber-800 dark:text-amber-200', 
        icon: Clock, 
        label: 'Chờ xử lý',
        border: 'border-amber-300 dark:border-amber-700'
      },
      read: { 
        bg: 'bg-cyan-100 dark:bg-cyan-900/40', 
        text: 'text-cyan-800 dark:text-cyan-200', 
        icon: Eye, 
        label: 'Đã đọc',
        border: 'border-cyan-300 dark:border-cyan-700'
      },
      replied: { 
        bg: 'bg-emerald-100 dark:bg-emerald-900/40', 
        text: 'text-emerald-800 dark:text-emerald-200', 
        icon: Send, 
        label: 'Đã trả lời',
        border: 'border-emerald-300 dark:border-emerald-700'
      },
      resolved: { 
        bg: 'bg-slate-100 dark:bg-slate-700', 
        text: 'text-slate-800 dark:text-slate-200', 
        icon: CheckCircle, 
        label: 'Đã giải quyết',
        border: 'border-slate-300 dark:border-slate-600'
      },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${badge.bg} ${badge.text} ${badge.border} border-2 shadow-sm`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const types = {
      general: { 
        bg: 'bg-indigo-50 dark:bg-indigo-900/40', 
        text: 'text-indigo-700 dark:text-indigo-200', 
        label: 'Hỗ trợ',
        border: 'border-indigo-300 dark:border-indigo-700'
      },
      password_reset: { 
        bg: 'bg-rose-50 dark:bg-rose-900/40', 
        text: 'text-rose-700 dark:text-rose-200', 
        label: 'Đặt lại mật khẩu',
        border: 'border-rose-300 dark:border-rose-700'
      },
      support: { 
        bg: 'bg-purple-50 dark:bg-purple-900/40', 
        text: 'text-purple-700 dark:text-purple-200', 
        label: 'Hỗ trợ',
        border: 'border-purple-300 dark:border-purple-700'
      },
      report: { 
        bg: 'bg-orange-50 dark:bg-orange-900/40', 
        text: 'text-orange-700 dark:text-orange-200', 
        label: 'Báo cáo',
        border: 'border-orange-300 dark:border-orange-700'
      },
    };
    const typeInfo = types[type] || types.general;
    return (
      <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${typeInfo.bg} ${typeInfo.text} ${typeInfo.border} border-2 shadow-sm`}>
        {typeInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen animate__animated animate__fadeIn">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto pulse-loading"></div>
          <p className="mt-4 text-gray-600 dark:text-[#E5E5E5] animate__animated animate__pulse">Đang tải tin nhắn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 animate__animated animate__fadeInUp page-transition w-full">
      <div className="mb-6 animate__animated animate__fadeInDown">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3 header-gradient inline-block tracking-tight">
              💬 Tin nhắn người dùng
            </h1>
            <p className="text-gray-600 dark:text-[#E5E5E5] mt-1 text-lg font-medium">
              Quản lý tin nhắn và yêu cầu từ người dùng
              {unreadCount > 0 && (
                <span className="ml-3 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-bold shadow-lg animate-pulse border-2 border-red-300">
                  {unreadCount} tin nhắn mới
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-3 flex-wrap">
        {['all', 'pending', 'read', 'replied', 'resolved'].map((status) => {
          // Định nghĩa màu cho từng button - màu sắc dễ nhìn hơn
          const getButtonColors = (status) => {
            const colors = {
              all: {
                bg: filter === status ? 'bg-indigo-600' : 'bg-indigo-50',
                text: filter === status ? 'text-white' : 'text-indigo-700',
                border: 'border-indigo-200'
              },
              pending: {
                bg: filter === status ? 'bg-amber-500' : 'bg-amber-50',
                text: filter === status ? 'text-white' : 'text-amber-700',
                border: 'border-amber-200'
              },
              read: {
                bg: filter === status ? 'bg-cyan-600' : 'bg-cyan-50',
                text: filter === status ? 'text-white' : 'text-cyan-700',
                border: 'border-cyan-200'
              },
              replied: {
                bg: filter === status ? 'bg-emerald-600' : 'bg-emerald-50',
                text: filter === status ? 'text-white' : 'text-emerald-700',
                border: 'border-emerald-200'
              },
              resolved: {
                bg: filter === status ? 'bg-slate-600' : 'bg-slate-50',
                text: filter === status ? 'text-white' : 'text-slate-700',
                border: 'border-slate-200'
              }
            };
            return colors[status] || colors.all;
          };

          const colors = getButtonColors(status);

          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-5 py-2.5 rounded-lg font-semibold border shadow-sm ${colors.bg} ${colors.text} ${colors.border} hover:scale-105 active:scale-95`}
              style={{ 
                backgroundColor: filter === status 
                  ? (status === 'all' ? '#4F46E5' : 
                     status === 'pending' ? '#F59E0B' : 
                     status === 'read' ? '#0891B2' : 
                     status === 'replied' ? '#059669' : '#475569')
                  : (status === 'all' ? '#EEF2FF' : 
                     status === 'pending' ? '#FFFBEB' : 
                     status === 'read' ? '#ECFEFF' : 
                     status === 'replied' ? '#ECFDF5' : '#F8FAFC'),
                transition: 'transform 0.2s ease',
                willChange: 'transform'
              }}
              onMouseEnter={(e) => {
                // Giữ nguyên màu nền khi hover
                const currentBg = e.currentTarget.style.backgroundColor;
                e.currentTarget.setAttribute('data-original-bg', currentBg);
              }}
              onMouseLeave={(e) => {
                // Khôi phục màu nền gốc
                const originalBg = e.currentTarget.getAttribute('data-original-bg');
                if (originalBg) {
                  e.currentTarget.style.backgroundColor = originalBg;
                }
              }}
            >
              {status === 'all' ? 'Tất cả' : 
               status === 'pending' ? 'Chờ xử lý' :
               status === 'read' ? 'Đã đọc' :
               status === 'replied' ? 'Đã trả lời' : 'Đã giải quyết'}
            </button>
          );
        })}
      </div>

      {/* Messages List */}
      <div className="bg-white dark:bg-[#2D2D2D] rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-[#404040] overflow-hidden animate__animated animate__fadeInUp">
        {messages.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare className="w-20 h-20 text-gray-300 dark:text-[#666666] mx-auto mb-4" />
            <p className="text-gray-500 dark:text-[#E5E5E5] text-xl font-medium">Không có tin nhắn nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-[#404040]">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`p-6 hover:bg-gray-50/50 dark:hover:bg-[#353535] transition-all duration-200 ${
                  message.status === 'pending' ? 'bg-amber-50/30 dark:bg-[rgba(251,191,36,0.08)] border-l-4 border-l-amber-500' : 'bg-white dark:bg-[#2D2D2D]'
                }`}
              >
                {/* Header Section */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{message.subject}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(message.status)}
                        {getTypeBadge(message.type)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm mb-4">
                      <span className="font-bold text-gray-900 dark:text-white">{message.user?.name || 'N/A'}</span>
                      <span className="text-gray-400 dark:text-[#888888]">•</span>
                      <span className="text-gray-600 dark:text-[#CCCCCC] font-medium">{message.user?.email || 'N/A'}</span>
                      <span className="text-gray-400 dark:text-[#888888]">•</span>
                      <span className="text-gray-500 dark:text-[#AAAAAA]">{new Date(message.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {message.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessage(message);
                          setShowReplyModal(true);
                        }}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                        title="Trả lời tin nhắn"
                      >
                        <Send className="w-4 h-4" />
                        <span>Trả lời</span>
                      </button>
                    )}
                    {message.status !== 'resolved' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsResolved(message._id);
                        }}
                        className="px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                        title="Đánh dấu đã giải quyết"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Đã giải quyết</span>
                      </button>
                    )}
                    {message.status === 'resolved' && (
                      <span className="px-4 py-2 bg-slate-100 dark:bg-[#404040] text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold flex items-center gap-2 border border-slate-200 dark:border-[#505050]">
                        <CheckCircle className="w-4 h-4" />
                        <span>Đã giải quyết</span>
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(message);
                      }}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                      title="Xóa tin nhắn"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                {/* User Message Section */}
                <div className="mb-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-white font-bold text-base">
                        {message.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-sm font-bold text-gray-700 dark:text-[#E5E5E5]">Tin nhắn từ người dùng</span>
                        <span className="text-xs text-gray-400 dark:text-[#888888]">•</span>
                        <span className="text-xs text-gray-500 dark:text-[#AAAAAA] font-medium">{new Date(message.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="ml-0 p-4 bg-transparent border border-gray-300 dark:border-[#505050] rounded-xl">
                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed text-base font-medium">{message.message || 'Không có nội dung'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Reply Section */}
                {message.adminReply && (
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700 flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-white font-bold text-base">A</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Phản hồi của admin</span>
                          <span className="text-xs text-gray-400 dark:text-[#888888]">•</span>
                          <span className="text-xs text-gray-500 dark:text-[#AAAAAA] font-medium">{new Date(message.repliedAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="ml-0 p-4 bg-transparent border-l-4 border-l-emerald-500 dark:border-l-emerald-400 border border-gray-300 dark:border-[#505050] rounded-xl">
                          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed font-medium">{message.adminReply || 'Không có nội dung'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#333333] rounded-lg shadow-xl dark:shadow-2xl border dark:border-[#404040] max-w-2xl w-full max-h-[90vh] flex flex-col animate__animated animate__zoomIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#404040]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#FFFFFF]">Trả lời tin nhắn</h2>
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setSelectedMessage(null);
                  setReplyText('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-[#FFFFFF] mb-2">{selectedMessage.subject}</h3>
                <div className="text-sm text-gray-600 dark:text-[#E5E5E5] mb-3">
                  <span className="font-medium">{selectedMessage.user?.name}</span>
                  <span className="mx-2">•</span>
                  <span>{selectedMessage.user?.email}</span>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#2A2A2A] rounded-lg border dark:border-[#404040]">
                  <p className="text-gray-900 dark:text-[#FFFFFF] whitespace-pre-wrap font-medium leading-relaxed">{selectedMessage.message || 'Không có nội dung'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-[#FFFFFF] mb-2">
                  Nội dung trả lời *
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-[#333333] dark:text-[#FFFFFF] min-h-[150px]"
                  placeholder="Nhập nội dung trả lời..."
                />
              </div>
            </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-[#404040]">
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setSelectedMessage(null);
                  setReplyText('');
                }}
                className="px-6 py-2.5 border border-gray-300 dark:border-[#404040] rounded-lg text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  replying || !replyText.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {replying ? 'Đang gửi...' : 'Gửi trả lời'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#333333] rounded-lg shadow-xl dark:shadow-2xl border dark:border-[#404040] max-w-md w-full animate__animated animate__zoomIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#404040]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#FFFFFF]">Xóa tin nhắn</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedMessage(null);
                  setDeleteReason('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-[#FFFFFF] transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 dark:text-[#E5E5E5] mb-4">
                Bạn có chắc muốn xóa tin nhắn này? Hành động này không thể hoàn tác.
              </p>
              
              <div className="mb-4 p-3 bg-gray-50 dark:bg-[#2A2A2A] rounded-lg border dark:border-[#404040]">
                <p className="text-sm font-semibold text-gray-900 dark:text-[#FFFFFF] mb-1">{selectedMessage.subject}</p>
                <p className="text-xs text-gray-500 dark:text-[#AAAAAA]">
                  {selectedMessage.user?.name} • {selectedMessage.user?.email}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E5E5] mb-2">
                  Lý do xóa (tùy chọn)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none dark:bg-[#2A2A2A] dark:text-[#FFFFFF]"
                  rows="3"
                  placeholder="Nhập lý do xóa tin nhắn..."
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedMessage(null);
                    setDeleteReason('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-[#404040] rounded-lg text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    deleting
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {deleting ? 'Đang xóa...' : 'Xóa tin nhắn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

