import { useState } from 'react';
import { Star, Trash2, Search, User, ChefHat, Calendar } from 'lucide-react';

export default function TableRatings({ ratings, loading, onDelete, recipes = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRecipe, setFilterRecipe] = useState('all');

  // Normalize image URL
  const normalizeImageUrl = (url) => {
    if (!url) return '';
    return url
      .replace(/192\.168\.1\.50/g, '192.168.2.229')
      .replace(/192\.168\.1\.52/g, '192.168.2.229')
      .replace(/192\.168\.1\.197/g, '192.168.2.229')
      .replace(/192\.168\.2\.39/g, '192.168.2.229')
      .replace(/10\.12\.117\.94/g, '192.168.2.229')
      .replace(/172\.16\.1\.238/g, '192.168.2.229')
      .replace(/localhost/g, '192.168.2.229');
  };

  // Filter ratings
  const filteredRatings = ratings.filter((rating) => {
    const matchesSearch =
      rating.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.recipe?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recipeId = rating.recipe?._id || rating.recipe;
    const matchesRecipe = filterRecipe === 'all' || recipeId === filterRecipe;
    
    return matchesSearch && matchesRecipe;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Search and Filter */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, công thức..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-all w-full bg-white text-gray-900"
            />
          </div>

          {/* Filter by Recipe */}
          <div className="md:w-64">
            <select
              value={filterRecipe}
              onChange={(e) => setFilterRecipe(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-all"
            >
              <option value="all">Tất cả công thức</option>
              {recipes.map((recipe) => (
                <option key={recipe._id} value={recipe._id}>
                  {recipe.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Tổng số: <strong>{filteredRatings.length}</strong> đánh giá</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người đánh giá
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Công thức
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Đánh giá
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ghi chú
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày đánh giá
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRatings.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Star className="w-12 h-12 text-gray-300" />
                    <p>Chưa có đánh giá nào</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRatings.map((rating) => (
                <tr key={rating._id} className="hover:bg-gray-50 transition-colors">
                  {/* User */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {rating.user?.avatarUrl ? (
                        <img
                          src={normalizeImageUrl(rating.user.avatarUrl)}
                          alt={rating.user.name || 'User'}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ${
                          rating.user?.avatarUrl ? 'hidden' : 'flex'
                        }`}
                      >
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {rating.user?.name || 'Người dùng'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {rating.user?.email || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Recipe */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {rating.recipe?.imageUrl ? (
                        <img
                          src={normalizeImageUrl(rating.recipe.imageUrl)}
                          alt={rating.recipe.title || 'Recipe'}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center ${
                          rating.recipe?.imageUrl ? 'hidden' : 'flex'
                        }`}
                      >
                        <ChefHat className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {rating.recipe?.title || 'Công thức không tồn tại'}
                        </div>
                        {rating.recipe?.categoryName && (
                          <div className="text-xs text-gray-500">
                            {rating.recipe.categoryName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Rating */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {renderStars(rating.rating || 0)}
                      <span className="text-sm font-medium text-gray-900">
                        {rating.rating || 0}/5
                      </span>
                    </div>
                  </td>

                  {/* Notes */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={rating.notes || ''}>
                      {rating.notes || <span className="text-gray-400">Không có ghi chú</span>}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(rating.createdAt)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => onDelete?.(rating)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-all duration-200 hover:scale-105 active:scale-95"
                      title="Xóa đánh giá"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

