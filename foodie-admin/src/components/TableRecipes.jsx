import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Video, X, Clock, Users, ChefHat, TrendingUp } from 'lucide-react';

export default function TableRecipes({ recipes = [], categories = [], onApprove, onReject, onEdit, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState(null);

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const recipeCategoryName = recipe.categoryName ||
      (recipe.category && typeof recipe.category === 'object' && recipe.category.name) ||
      (typeof recipe.category === 'string' && recipe.category) ||
      '';
    const matchesCategory = filterCategory === 'all' || recipeCategoryName === filterCategory;
    const matchesStatus = filterStatus === 'all' || recipe.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalApproved = recipes.filter(r => r.status === 'approved').length;
  const totalPending = recipes.filter(r => r.status === 'pending').length;
  const totalRejected = recipes.filter(r => r.status === 'rejected').length;

  const normalizeUrl = (url) => {
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

  const isValidImage = (url) =>
    url &&
    url.trim() !== '' &&
    url !== 'null' &&
    url !== 'undefined' &&
    !url.includes('placeholder') &&
    !url.includes('default') &&
    !url.includes('800x600') &&
    !url.includes('800x800') &&
    !url.includes('vietnamese-') &&
    !url.includes('unsplash.com') &&
    (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:'));

  const getDifficultyStyle = (difficulty) => {
    switch (difficulty) {
      case 'Dễ': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Trung bình': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Khó': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  const getCategoryStyle = (name) => {
    const map = {
      'Món chính': 'bg-blue-100 text-blue-700',
      'Món khai vị': 'bg-purple-100 text-purple-700',
      'Món nước': 'bg-cyan-100 text-cyan-700',
      'Món chiên': 'bg-orange-100 text-orange-700',
      'Món xào': 'bg-yellow-100 text-yellow-700',
      'Món nướng': 'bg-red-100 text-red-700',
      'Món hấp': 'bg-green-100 text-green-700',
      'Món chay': 'bg-emerald-100 text-emerald-700',
      'Món tráng miệng': 'bg-pink-100 text-pink-700',
      'Món ăn vặt': 'bg-indigo-100 text-indigo-700',
    };
    return map[name] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl shadow-sm border border-gray-100 dark:border-[#3A3A3A] overflow-hidden">

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-[#3A3A3A] border-b border-gray-100 dark:border-[#3A3A3A]">
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Đã duyệt</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{totalApproved}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Chờ duyệt</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{totalPending}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Từ chối</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{totalRejected}</p>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3A] bg-gray-50/50 dark:bg-[#252525]">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#333333] border border-gray-200 dark:border-[#404040] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#333333] border border-gray-200 dark:border-[#404040] rounded-xl">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm bg-transparent focus:outline-none text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id || cat.name} value={cat.name || cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#333333] border border-gray-200 dark:border-[#404040] rounded-xl">
            <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm bg-transparent focus:outline-none text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
          {(searchTerm || filterCategory !== 'all' || filterStatus !== 'all') && (
            <span className="text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-2.5 py-1.5 rounded-lg border border-orange-100 dark:border-orange-900/30">
              {filteredRecipes.length} kết quả
            </span>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#252525]">
              {['Công thức', 'Danh mục', 'Thông tin', 'Người tạo', 'Trạng thái', 'Hành động'].map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-[#333333]">
            {filteredRecipes.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                    <ChefHat className="w-12 h-12 opacity-30" />
                    <p className="text-sm font-medium">Không tìm thấy công thức nào</p>
                    {(searchTerm || filterCategory !== 'all' || filterStatus !== 'all') && (
                      <button
                        onClick={() => { setSearchTerm(''); setFilterCategory('all'); setFilterStatus('all'); }}
                        className="text-xs text-orange-500 hover:text-orange-600 underline"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecipes.map((recipe) => {
                const author = recipe.author || recipe.createdBy || recipe.user;
                const authorName = typeof author === 'object' && author !== null
                  ? author.name || author.email || 'N/A'
                  : typeof author === 'string' ? author : 'N/A';
                const authorEmail = typeof author === 'object' && author !== null ? author.email || '' : '';

                const isVideo = recipe.mediaType === 'video' || recipe.videoUrl;
                const rawImage = isVideo && recipe.videoThumbnail ? recipe.videoThumbnail : recipe.imageUrl;
                const imageUrl = normalizeUrl(rawImage);
                const hasImage = isValidImage(imageUrl);

                const categoryName = recipe.categoryName ||
                  (recipe.category && typeof recipe.category === 'object' && recipe.category.name) ||
                  (typeof recipe.category === 'string' && recipe.category) ||
                  'Chưa phân loại';

                const cookTime = recipe.cookTimeMinutes || recipe.time;
                const servings = recipe.servings;
                const difficulty = recipe.difficulty;

                return (
                  <tr key={recipe._id} className="hover:bg-orange-50/30 dark:hover:bg-[#2E2E2E] transition-colors group">
                    {/* Thumbnail + Title */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          {hasImage ? (
                            <>
                              <img
                                src={imageUrl}
                                alt={recipe.title}
                                className="w-14 h-14 object-cover rounded-xl border border-gray-100 dark:border-[#404040] shadow-sm group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-[#3A3A3A] dark:to-[#333333] rounded-xl items-center justify-center border border-gray-100 dark:border-[#404040]">
                                <ChefHat className="w-6 h-6 text-orange-300" />
                              </div>
                            </>
                          ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-[#3A3A3A] dark:to-[#333333] rounded-xl flex items-center justify-center border border-gray-100 dark:border-[#404040]">
                              <ChefHat className="w-6 h-6 text-orange-300" />
                            </div>
                          )}
                          {isVideo && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-md shadow">
                              VID
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 leading-snug">
                            {recipe.title?.replace(/\s+\d+$/, '').replace(/\d+$/, '') || recipe.title}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5 max-w-[200px]">
                            {recipe.description || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getCategoryStyle(categoryName)}`}>
                        {categoryName}
                      </span>
                    </td>

                    {/* Meta: time, servings, difficulty */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        {cookTime && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3.5 h-3.5 text-orange-400" />
                            <span>{cookTime} phút</span>
                          </div>
                        )}
                        {servings && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            <span>{servings} người</span>
                          </div>
                        )}
                        {difficulty && (
                          <span className={`inline-flex self-start items-center px-2 py-0.5 text-[11px] font-medium rounded-md ${getDifficultyStyle(difficulty)}`}>
                            {difficulty}
                          </span>
                        )}
                        {!cookTime && !servings && !difficulty && (
                          <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                          {authorName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{authorName}</p>
                          {authorEmail && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">{authorEmail}</p>
                          )}
                          {recipe.createdAt && (
                            <p className="text-[11px] text-gray-300 dark:text-gray-600 leading-tight mt-0.5">
                              {new Date(recipe.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {recipe.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full border border-green-100 dark:border-green-900/30">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          Đã duyệt
                        </span>
                      ) : recipe.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full border border-red-100 dark:border-red-900/30">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          Từ chối
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-100 dark:border-amber-900/30">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                          Chờ duyệt
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {isVideo && recipe.videoUrl && (
                          <button
                            onClick={() => setSelectedVideo({ url: normalizeUrl(recipe.videoUrl), title: recipe.title, description: recipe.description })}
                            className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all"
                            title="Xem video"
                          >
                            <Video className="w-4 h-4" />
                          </button>
                        )}
                        {recipe.status === 'pending' && (
                          <>
                            <button
                              onClick={() => onApprove?.(recipe._id)}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                              title="Duyệt"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onReject?.(recipe._id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              title="Từ chối"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onEdit?.(recipe)}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete?.(recipe)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
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

      {/* ── Footer ── */}
      {filteredRecipes.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-50 dark:border-[#333333] bg-gray-50/50 dark:bg-[#252525]">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Hiển thị <span className="font-semibold text-gray-600 dark:text-gray-300">{filteredRecipes.length}</span> / <span className="font-semibold text-gray-600 dark:text-gray-300">{recipes.length}</span> công thức
          </p>
        </div>
      )}

      {/* ── Video Modal ── */}
      {selectedVideo &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate__animated animate__zoomIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{selectedVideo.title}</h3>
                  {selectedVideo.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{selectedVideo.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <div className="relative w-full bg-black rounded-xl overflow-hidden aspect-video">
                  <video src={selectedVideo.url} controls className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain' }}>
                    Trình duyệt không hỗ trợ video.
                  </video>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
