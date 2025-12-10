import { useState, useEffect } from 'react';
import TableRatings from '../components/TableRatings';
import api from '../utils/api';
import { X } from 'lucide-react';

export default function Ratings() {
  const [ratings, setRatings] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Lấy tất cả ratings và recipes
      const [ratingsRes, recipesRes] = await Promise.all([
        api.get('/rating', {
          params: {
            page: 1,
            limit: 100, // Lấy nhiều ratings cho admin
          }
        }),
        api.get('/recipes', {
          params: {
            page: 1,
            limit: 100,
            status: 'all'
          }
        }),
      ]);
      
      const ratingsData = ratingsRes.data?.ratings || [];
      const recipesData = recipesRes.data?.recipes || [];
      
      console.log('📋 Total ratings:', ratingsData.length);
      console.log('📋 Total recipes:', recipesData.length);
      
      setRatings(ratingsData);
      setRecipes(recipesData);
    } catch (error) {
      console.error('Error fetching ratings:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (rating) => {
    setSelectedRating(rating);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRating) {
      alert('Không tìm thấy đánh giá để xóa');
      return;
    }

    try {
      const ratingId = selectedRating._id;
      const recipeId = selectedRating.recipe?._id || selectedRating.recipe;
      
      if (!recipeId) {
        alert('Không tìm thấy công thức liên quan');
        return;
      }

      console.log('🗑️ Deleting rating:', ratingId);
      console.log('📝 Recipe ID:', recipeId);
      console.log('📝 Reason:', deleteReason.trim());
      
      // Gửi ratingId trong body để backend có thể xác định rating cụ thể
      await api.delete(`/rating/${recipeId}`, {
        data: {
          ratingId: ratingId,
          reason: deleteReason.trim()
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Rating deleted successfully');
      
      setRatings(ratings.filter((r) => r._id !== selectedRating._id));
      setShowDeleteModal(false);
      setSelectedRating(null);
      setDeleteReason('');
      alert('Đã xóa đánh giá thành công!');
    } catch (error) {
      console.error('❌ Error deleting rating:', error);
      console.error('❌ Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa đánh giá';
      alert(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá</h1>
          <p className="text-gray-500 mt-1">Quản lý tất cả đánh giá của người dùng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng số đánh giá</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{ratings.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đánh giá trung bình</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {ratings.length > 0
                  ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(1)
                  : '0.0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Công thức được đánh giá</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Set(ratings.map(r => r.recipe?._id || r.recipe)).size}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <TableRatings
        ratings={ratings}
        recipes={recipes}
        loading={loading}
        onDelete={handleDeleteClick}
      />

      {/* Delete Modal */}
      {showDeleteModal && selectedRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Xóa đánh giá</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRating(null);
                  setDeleteReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Bạn có chắc muốn xóa đánh giá này?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Người đánh giá:</strong> {selectedRating.user?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Công thức:</strong> {selectedRating.recipe?.title || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Đánh giá:</strong> {selectedRating.rating || 0}/5 ⭐
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do xóa (tùy chọn)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Nhập lý do xóa đánh giá..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows="3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRating(null);
                  setDeleteReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

