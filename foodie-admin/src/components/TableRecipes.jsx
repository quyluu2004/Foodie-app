import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Video, X } from 'lucide-react';

export default function TableRecipes({ recipes = [], categories = [], onApprove, onReject, onEdit, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState(null);

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Xử lý category: filter theo categoryName (tên category)
    const recipeCategoryName = recipe.categoryName || 
      (recipe.category && typeof recipe.category === 'object' && recipe.category.name) ||
      (typeof recipe.category === 'string' && recipe.category) ||
      '';
    const matchesCategory = filterCategory === 'all' || 
      recipeCategoryName === filterCategory;
    
    const matchesStatus = filterStatus === 'all' || recipe.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Danh sách công thức</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-all bg-white dark:bg-gray-800 text-gray-900"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-all bg-white dark:bg-gray-800 text-gray-900"
              style={{ color: '#1F2937' }}
            >
              <option value="all" style={{ color: '#1F2937' }}>Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id || cat.name} value={cat.name || cat._id} style={{ color: '#1F2937' }}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-all bg-white dark:bg-gray-800 text-gray-900"
              style={{ color: '#1F2937' }}
            >
              <option value="all" style={{ color: '#1F2937' }}>Tất cả trạng thái</option>
              <option value="pending" style={{ color: '#1F2937' }}>Chờ duyệt</option>
              <option value="approved" style={{ color: '#1F2937' }}>Đã duyệt</option>
              <option value="rejected" style={{ color: '#1F2937' }}>Từ chối</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ảnh
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tiêu đề
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Người tạo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRecipes.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filteredRecipes.map((recipe) => {
                // Get author info
                const authorName = (() => {
                  const author = recipe.author || recipe.createdBy || recipe.user;
                  if (typeof author === 'object' && author !== null) {
                    return author.name || author.email || 'N/A';
                  }
                  if (typeof author === 'string') {
                    return author;
                  }
                  return 'N/A';
                })();

                const authorEmail = (() => {
                  const author = recipe.author || recipe.createdBy || recipe.user;
                  if (typeof author === 'object' && author !== null) {
                    return author.email || '';
                  }
                  return '';
                })();

                // Normalize image URL (replace old IP with new IP if needed)
                const normalizeImageUrl = (url) => {
                  if (!url) return null;
                  // Replace old IP addresses with new one
                  return url
                    .replace(/192\.168\.1\.50/g, '192.168.2.229')
                    .replace(/192\.168\.1\.52/g, '192.168.2.229')
                    .replace(/192\.168\.1\.197/g, '192.168.2.229')
                    .replace(/192\.168\.2\.39/g, '192.168.2.229')
                    .replace(/10\.12\.117\.94/g, '192.168.2.229')
                    .replace(/172\.16\.1\.238/g, '192.168.2.229')
                    .replace(/localhost/g, '192.168.2.229');
                };

                // Normalize video URL
                const normalizeVideoUrl = (url) => {
                  if (!url) return null;
                  return normalizeImageUrl(url);
                };

                // Kiểm tra nếu có video, ưu tiên videoThumbnail
                const isVideo = recipe.mediaType === 'video' || recipe.videoUrl;
                const imageUrlToUse = isVideo && recipe.videoThumbnail 
                  ? recipe.videoThumbnail 
                  : recipe.imageUrl;
                
                const normalizedImageUrl = normalizeImageUrl(imageUrlToUse);

                // Check if image exists and is valid
                // Chỉ hiển thị ảnh nếu có URL hợp lệ (không phải placeholder)
                const hasImage = normalizedImageUrl && 
                                 normalizedImageUrl.trim() !== '' && 
                                 normalizedImageUrl !== 'null' && 
                                 normalizedImageUrl !== 'undefined' &&
                                 !normalizedImageUrl.includes('placeholder') &&
                                 !normalizedImageUrl.includes('default') &&
                                 !normalizedImageUrl.includes('800x600') &&
                                 !normalizedImageUrl.includes('800x800') &&
                                 !normalizedImageUrl.includes('vietnamese-') &&
                                 !normalizedImageUrl.includes('unsplash.com') &&
                                 (normalizedImageUrl.startsWith('http') || normalizedImageUrl.startsWith('/') || normalizedImageUrl.startsWith('data:'));

                return (
                <tr key={recipe._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 table-row">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative w-16 h-16">
                      {hasImage ? (
                        <>
                          <img
                            src={normalizedImageUrl}
                            alt={recipe.title || 'Recipe'}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                          {isVideo && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-bl rounded-tr">
                              🎥
                            </div>
                          )}
                          <div 
                            className="image-placeholder w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 hidden"
                          >
                            <span className="text-gray-400 dark:text-gray-500 text-xs text-center px-1">No Image</span>
                          </div>
                        </>
                      ) : (
                        <div className="image-placeholder w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                          <span className="text-gray-400 dark:text-gray-500 text-xs text-center px-1">No Image</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {recipe.title?.replace(/\s+\d+$/, '').replace(/\d+$/, '') || recipe.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{recipe.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const categoryName = recipe.categoryName || 
                        (recipe.category && typeof recipe.category === 'object' && recipe.category.name) ||
                        (typeof recipe.category === 'string' && recipe.category) ||
                        'Chưa phân loại';
                      
                      // Màu sắc khác nhau cho từng loại category
                      const getCategoryColor = (name) => {
                        const colors = {
                          'Món chính': 'bg-blue-100 text-blue-800',
                          'Món khai vị': 'bg-purple-100 text-purple-800',
                          'Món nước': 'bg-cyan-100 text-cyan-800',
                          'Món chiên': 'bg-orange-100 text-orange-800',
                          'Món xào': 'bg-yellow-100 text-yellow-800',
                          'Món nướng': 'bg-red-100 text-red-800',
                          'Món hấp': 'bg-green-100 text-green-800',
                          'Món chay': 'bg-emerald-100 text-emerald-800',
                          'Món tráng miệng': 'bg-pink-100 text-pink-800',
                          'Món ăn vặt': 'bg-indigo-100 text-indigo-800',
                        };
                        return colors[name] || 'bg-gray-100 text-gray-800';
                      };
                      
                      return (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryColor(categoryName)}`}>
                          {categoryName}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{authorName}</div>
                    {authorEmail && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{authorEmail}</div>
                    )}
                    {recipe.createdAt && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(recipe.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        recipe.status === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : recipe.status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {recipe.status === 'approved'
                        ? 'Đã duyệt'
                        : recipe.status === 'rejected'
                        ? 'Từ chối'
                        : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {isVideo && recipe.videoUrl && (
                        <button
                          onClick={() => setSelectedVideo({
                            url: normalizeVideoUrl(recipe.videoUrl),
                            title: recipe.title,
                            description: recipe.description
                          })}
                          className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded transition-all duration-200"
                          title="Xem video"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      )}
                      {recipe.status === 'pending' && (
                        <>
                      <button
                        onClick={() => onApprove?.(recipe._id)}
                        className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-all duration-200"
                        title="Duyệt"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onReject?.(recipe._id)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-all duration-200"
                        title="Từ chối"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onEdit?.(recipe)}
                    className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-all duration-200"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete?.(recipe)}
                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all duration-200"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Video Modal */}
      {selectedVideo &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate__animated animate__zoomIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                    {selectedVideo.title}
                  </h3>
                  {selectedVideo.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {selectedVideo.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-5">
                <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    src={selectedVideo.url}
                    controls
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: 'contain' }}
                  >
                    Trình duyệt của bạn không hỗ trợ video.
                  </video>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

