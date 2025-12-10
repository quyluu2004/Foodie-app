import { useState, useEffect } from 'react';
import { X, Trash2, MessageSquare, Heart, User, Calendar } from 'lucide-react';
import api from '../utils/api';

export default function PostDetailModal({ post, isOpen, onClose, onDeleteComment, onRefresh }) {
  const [postDetail, setPostDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    if (isOpen && post?._id) {
      loadPostDetail();
    }
  }, [isOpen, post?._id]);

  const loadPostDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/posts/${post._id}`);
      setPostDetail(response.data);
    } catch (error) {
      console.error('Error loading post detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommentClick = (comment) => {
    setSelectedComment(comment);
    setDeleteReason('');
    setShowDeleteCommentModal(true);
  };

  const handleDeleteCommentConfirm = async () => {
    if (!selectedComment || !postDetail) return;

    try {
      await api.delete(`/posts/${postDetail._id}/comments/${selectedComment._id}`, {
        data: {
          reason: deleteReason.trim()
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Refresh post detail
      await loadPostDetail();
      
      // Call parent callback
      if (onDeleteComment) {
        onDeleteComment(selectedComment);
      }
      if (onRefresh) {
        onRefresh();
      }

      setShowDeleteCommentModal(false);
      setSelectedComment(null);
      setDeleteReason('');
      alert('Đã xóa bình luận thành công! User sẽ nhận được thông báo.');
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Có lỗi xảy ra khi xóa bình luận');
    }
  };

  const handleDeleteCommentCancel = () => {
    setShowDeleteCommentModal(false);
    setSelectedComment(null);
    setDeleteReason('');
  };

  const normalizeImageUrl = (url) => {
    if (!url) return null;
    return url
      .replace(/192\.168\.1\.50/g, '192.168.2.229')
      .replace(/192\.168\.1\.52/g, '192.168.2.229')
      .replace(/192\.168\.1\.197/g, '192.168.2.229')
      .replace(/192\.168\.2\.39/g, '192.168.2.229')
      .replace(/10\.12\.117\.94/g, '192.168.2.229')
      .replace(/172\.16\.1\.238/g, '192.168.2.229')
      .replace(/localhost/g, '192.168.2.229');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserName = (user) => {
    if (typeof user === 'object' && user !== null) {
      return user.name || user.email || 'N/A';
    }
    if (typeof user === 'string') {
      return user;
    }
    return 'N/A';
  };

  if (!isOpen) return null;

  const displayPost = postDetail || post;
  const normalizedImageUrl = normalizeImageUrl(displayPost?.imageUrl);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate__animated animate__fadeIn p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate__animated animate__zoomIn flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Chi tiết bài đăng</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Post Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-4 mb-4">
                    {normalizedImageUrl ? (
                      <img
                        src={normalizedImageUrl}
                        alt={displayPost?.caption || 'Post'}
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No Image</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">
                          {getUserName(displayPost?.user)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {formatDate(displayPost?.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-red-600">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {displayPost?.likes?.length || 0}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-blue-600">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {displayPost?.comments?.length || 0}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {displayPost?.caption || 'Không có nội dung'}
                    </p>
                  </div>
                </div>

                {/* Comments Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Bình luận ({displayPost?.comments?.length || 0})
                  </h3>
                  
                  {displayPost?.comments && displayPost.comments.length > 0 ? (
                    <div className="space-y-4">
                      {displayPost.comments.map((comment) => (
                        <div
                          key={comment._id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-semibold text-gray-900">
                                  {getUserName(comment.user)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2 whitespace-pre-wrap">
                                {comment.text}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
                                  {comment.likes?.length || 0}
                                </span>
                                {comment.replies && comment.replies.length > 0 && (
                                  <span>{comment.replies.length} phản hồi</span>
                                )}
                              </div>
                              
                              {/* Replies */}
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-3 ml-6 pl-4 border-l-2 border-gray-200 space-y-3">
                                  {comment.replies.map((reply) => (
                                    <div key={reply._id} className="bg-gray-50 rounded p-3">
                                      <div className="flex items-center gap-2 mb-1">
                                        <User className="w-3 h-3 text-gray-500" />
                                        <span className="font-semibold text-sm text-gray-900">
                                          {getUserName(reply.user)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatDate(reply.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700">{reply.text}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteCommentClick(comment)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-all duration-200 hover:scale-105 active:scale-95"
                              title="Xóa bình luận"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Chưa có bình luận nào</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal xóa bình luận */}
      {showDeleteCommentModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center animate__animated animate__fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate__animated animate__zoomIn">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Xóa bình luận</h3>
                <button
                  onClick={handleDeleteCommentCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Bạn có chắc muốn xóa bình luận này? User sẽ nhận được thông báo "Admin đã xóa bình luận của bạn".
                </p>
                {selectedComment && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Người bình luận:</strong> {getUserName(selectedComment.user)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      <strong>Nội dung:</strong> {selectedComment.text}
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="deleteCommentReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do xóa bình luận <span className="text-gray-400">(tùy chọn)</span>
                </label>
                <textarea
                  id="deleteCommentReason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Nhập lý do tại sao xóa bình luận này (ví dụ: Vi phạm nội dung, Spam, ...)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                  rows="3"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleDeleteCommentCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteCommentConfirm}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Xóa bình luận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

