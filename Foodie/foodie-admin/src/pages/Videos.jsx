import { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, Play, Trash2, Eye, Download, Search, Filter } from 'lucide-react';

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      // Lấy tất cả recipes có video
      const response = await api.get('/recipes', {
        params: {
          page: 1,
          limit: 1000,
          status: 'all'
        }
      });
      
      const allRecipes = response.data?.recipes || response.data || [];
      // Lọc chỉ lấy recipes có video
      const videosList = allRecipes.filter(recipe => 
        recipe.mediaType === 'video' || recipe.videoUrl || recipe.videoThumbnail
      );
      
      setVideos(videosList);
      console.log('📹 Total videos:', videosList.length);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
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

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || video.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewVideo = (video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const handleDeleteClick = (video) => {
    setSelectedVideo(video);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVideo || !selectedVideo._id) {
      alert('Không tìm thấy video để xóa');
      return;
    }
    
    try {
      await api.delete(`/recipes/${selectedVideo._id}`, {
        data: { reason: deleteReason.trim() },
        headers: { 'Content-Type': 'application/json' }
      });
      
      setVideos(videos.filter((v) => v._id !== selectedVideo._id));
      setShowDeleteModal(false);
      setSelectedVideo(null);
      setDeleteReason('');
      alert('Đã xóa video thành công! User sẽ nhận được thông báo.');
    } catch (error) {
      console.error('Error deleting video:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa video';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen animate__animated animate__fadeIn">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto pulse-loading"></div>
          <p className="mt-4 text-gray-600 dark:text-[#E5E5E5] animate__animated animate__pulse">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full animate__animated animate__fadeInUp page-transition">
      <div className="mb-6 animate__animated animate__fadeInDown">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-[#FFFFFF] mb-2 header-gradient inline-block">
              🎥 Quản lý Video
            </h1>
            <p className="text-gray-600 dark:text-[#E5E5E5] mt-2">Quản lý tất cả video công thức do người dùng tải lên</p>
            {videos.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-[#E5E5E5] mt-2">
                Tổng: <strong className="text-primary">{videos.length}</strong> video
              </p>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm video..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-[#333333] text-gray-900"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVideos.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 dark:text-[#E5E5E5]">Không có video nào</p>
          </div>
        ) : (
          filteredVideos.map((video) => {
            const thumbnailUrl = normalizeImageUrl(video.videoThumbnail || video.imageUrl);
            const videoUrl = normalizeImageUrl(video.videoUrl);
            const hasThumbnail = thumbnailUrl && 
                                thumbnailUrl.trim() !== '' && 
                                thumbnailUrl !== 'null' && 
                                thumbnailUrl !== 'undefined' &&
                                !thumbnailUrl.includes('placeholder') &&
                                (thumbnailUrl.startsWith('http') || thumbnailUrl.startsWith('/') || thumbnailUrl.startsWith('data:'));

            const authorName = (() => {
              const author = video.author || video.createdBy || video.user;
              if (typeof author === 'object' && author !== null) {
                return author.name || author.email || 'N/A';
              }
              if (typeof author === 'string') {
                return author;
              }
              return 'N/A';
            })();

            return (
              <div
                key={video._id}
                className="bg-white dark:bg-[#333333] rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200 dark:border-[#404040]"
              >
                {/* Thumbnail */}
                <div className="relative w-full h-48 bg-gray-100 dark:bg-[#404040]">
                  {hasThumbnail ? (
                    <>
                      <img
                        src={thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden absolute inset-0 bg-gray-200 dark:bg-[#404040] items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-gray-400 dark:text-[#CCCCCC]" />
                    </div>
                  )}
                  {/* Play button overlay */}
                  <div className="absolute inset-0 bg-black/30 hover:bg-black/20 transition-colors flex items-center justify-center cursor-pointer"
                       onClick={() => handleViewVideo(video)}>
                    <div className="bg-white/90 rounded-full p-4 hover:bg-white transition-colors">
                      <Play className="w-8 h-8 text-primary fill-primary" />
                    </div>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      video.status === 'approved'
                        ? 'bg-green-500 text-white'
                        : video.status === 'rejected'
                        ? 'bg-red-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {video.status === 'approved' ? 'Đã duyệt' : video.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-[#FFFFFF] line-clamp-2 mb-2">
                    {video.title?.replace(/\s+\d+$/, '').replace(/\d+$/, '') || video.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-[#E5E5E5] line-clamp-2 mb-3">
                    {video.description || 'Không có mô tả'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-[#CCCCCC] mb-3">
                    <span>{authorName}</span>
                    {video.createdAt && (
                      <span>{new Date(video.createdAt).toLocaleDateString('vi-VN')}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewVideo(video)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Xem
                    </button>
                    <button
                      onClick={() => handleDeleteClick(video)}
                      className="px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#333333] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#404040]">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-[#FFFFFF]">
                {selectedVideo.title}
              </h2>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setSelectedVideo(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-[#FFFFFF] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Video Player */}
              {selectedVideo.videoUrl && (
                <div className="mb-6">
                  <video
                    src={normalizeImageUrl(selectedVideo.videoUrl)}
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: '500px' }}
                  >
                    Trình duyệt của bạn không hỗ trợ video.
                  </video>
                </div>
              )}

              {/* Video Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-[#FFFFFF] mb-2">Mô tả</h3>
                  <p className="text-gray-600 dark:text-[#E5E5E5]">{selectedVideo.description || 'Không có mô tả'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-[#E5E5E5] mb-1">Người tạo</h4>
                    <p className="text-sm text-gray-600 dark:text-[#CCCCCC]">
                      {(() => {
                        const author = selectedVideo.author || selectedVideo.createdBy || selectedVideo.user;
                        if (typeof author === 'object' && author !== null) {
                          return author.name || author.email || 'N/A';
                        }
                        return 'N/A';
                      })()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-[#E5E5E5] mb-1">Ngày tạo</h4>
                    <p className="text-sm text-gray-600 dark:text-[#CCCCCC]">
                      {selectedVideo.createdAt 
                        ? new Date(selectedVideo.createdAt).toLocaleString('vi-VN')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-[#E5E5E5] mb-1">Trạng thái</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedVideo.status === 'approved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : selectedVideo.status === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {selectedVideo.status === 'approved' ? 'Đã duyệt' : selectedVideo.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#333333] rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-[#FFFFFF] mb-4">Xóa video</h3>
              <p className="text-gray-600 dark:text-[#E5E5E5] mb-4">
                Bạn có chắc muốn xóa video này? User sẽ nhận được thông báo "Admin đã xóa video của bạn".
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E5E5] mb-2">
                  Lý do xóa (tùy chọn)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none dark:bg-[#2A2A2A] dark:text-[#FFFFFF]"
                  rows="3"
                  placeholder="Nhập lý do xóa video..."
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedVideo(null);
                    setDeleteReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Xóa video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

