import { useState, useEffect } from 'react';
import TablePosts from '../components/TablePosts';
import PostDetailModal from '../components/PostDetailModal';
import api from '../utils/api';
import { X } from 'lucide-react';

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // API endpoint: GET /api/posts (cần auth token)
      const response = await api.get('/posts', {
        params: {
          page: 1,
          limit: 100 // Lấy nhiều posts cho admin
        }
      });
      
      // Backend trả về { posts: [], total, page, totalPages }
      const posts = response.data?.posts || [];
      
      // Debug: Log để kiểm tra dữ liệu
      if (posts.length > 0) {
        console.log('📋 Total posts:', posts.length);
        console.log('👤 First post:', {
          id: posts[0]._id,
          caption: posts[0].caption,
          user: posts[0].user,
          imageUrl: posts[0].imageUrl
        });
      }
      
      setPosts(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    setSelectedPost(post);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPost(null);
  };

  const handleDeleteComment = (comment) => {
    // Refresh posts list after deleting comment
    fetchData();
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleDeleteClick = (post) => {
    setSelectedPost(post);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPost) return;
    
    try {
      console.log('🗑️ Deleting post:', selectedPost._id);
      console.log('📝 Reason:', deleteReason.trim());
      
      // Axios DELETE với body - sử dụng config.data
      const response = await api.delete(`/posts/${selectedPost._id}`, {
        data: {
          reason: deleteReason.trim()
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Delete response:', response.data);
      
      setPosts(posts.filter((p) => p._id !== selectedPost._id));
      setShowDeleteModal(false);
      setSelectedPost(null);
      setDeleteReason('');
      alert('Đã xóa bài đăng thành công! User sẽ nhận được thông báo.');
    } catch (error) {
      console.error('❌ Error deleting post:', error);
      console.error('❌ Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa bài đăng';
      const debugInfo = error.response?.data?.debug;
      if (debugInfo) {
        console.error('🔍 Debug info:', debugInfo);
        alert(`${errorMessage}\n\nDebug: ${JSON.stringify(debugInfo)}`);
      } else {
        alert(errorMessage);
      }
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedPost(null);
    setDeleteReason('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen animate__animated animate__fadeIn">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto pulse-loading"></div>
          <p className="mt-4 text-gray-600 animate__animated animate__pulse">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📮 Quản lý bài đăng
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Quản lý tất cả bài đăng từ Feed trong hệ thống</p>
        {posts.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Tổng: <strong className="text-primary">{posts.length}</strong> bài đăng
          </p>
        )}
      </div>
      <div className="animate__animated animate__fadeInUp animate-delay-200">
        <TablePosts
          posts={posts}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </div>

      {/* Modal xóa bài đăng */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate__animated animate__fadeIn">
          <div className="bg-white dark:bg-[#333333] rounded-lg shadow-xl dark:shadow-2xl dark:border dark:border-[#404040] max-w-md w-full mx-4 animate__animated animate__zoomIn dark:text-[#FFFFFF]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-[#FFFFFF]">Xóa bài đăng</h3>
                <button
                  onClick={handleDeleteCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700 dark:text-[#E5E5E5] mb-2">
                  Bạn có chắc muốn xóa bài đăng này? User sẽ nhận được thông báo "Admin đã gỡ bài đăng của bạn".
                </p>
                {selectedPost && (
                  <div className="bg-gray-50 dark:bg-[#404040] p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 dark:text-[#E5E5E5] line-clamp-2">
                      <strong>Nội dung:</strong> {selectedPost.caption || 'Không có nội dung'}
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="deleteReason" className="block text-sm font-medium text-gray-700 dark:text-[#E5E5E5] mb-2">
                  Lý do gỡ bài đăng <span className="text-gray-400 dark:text-[#CCCCCC]">(tùy chọn)</span>
                </label>
                <textarea
                  id="deleteReason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Nhập lý do tại sao gỡ bài đăng này (ví dụ: Vi phạm nội dung, Spam, ...)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none dark:bg-[#333333] dark:text-[#FFFFFF]"
                  rows="3"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Xóa bài đăng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết bài đăng */}
      <PostDetailModal
        post={selectedPost}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        onDeleteComment={handleDeleteComment}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

