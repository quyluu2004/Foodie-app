import { useState, useEffect } from 'react';
import { Search, Trash2, MessageSquare } from 'lucide-react';
import api from '../utils/api';

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRecipe, setFilterRecipe] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [commentsRes, recipesRes] = await Promise.all([
        api.get('/comment'),
        api.get('/recipes'),
      ]);
      setComments(commentsRes.data?.comments || []);
      setRecipes(recipesRes.data?.recipes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (comment) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    
    setDeletingId(comment._id);
    
    try {
      // Xóa comment từ Recipe hoặc Post tùy theo source
      if (comment.source === 'recipe') {
        await api.delete(`/comment/${comment._id}`);
      } else if (comment.source === 'post') {
        // Cần postId để xóa comment từ Post
        await api.delete(`/posts/${comment.postId}/comments/${comment._id}`);
      } else {
        // Fallback: thử xóa từ Recipe
        await api.delete(`/comment/${comment._id}`);
      }
      
      // Delay để animation hoàn thành
      setTimeout(() => {
        setComments(comments.filter((c) => c._id !== comment._id));
        setDeletingId(null);
        alert('Đã xóa bình luận thành công!');
      }, 300);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setDeletingId(null);
      alert('Có lỗi xảy ra khi xóa bình luận');
    }
  };

  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      comment.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter theo loại
    if (filterRecipe === 'all') {
      return matchesSearch;
    } else if (filterRecipe === 'posts') {
      return matchesSearch && comment.source === 'post';
    } else if (filterRecipe === 'recipes') {
      return matchesSearch && comment.source === 'recipe';
    } else {
      // Filter theo recipe cụ thể
      if (comment.source === 'recipe') {
        const recipeId = typeof comment.recipe === 'object' ? comment.recipe?._id : comment.recipe;
        return matchesSearch && recipeId?.toString() === filterRecipe;
      }
      return false; // Không hiển thị post comments khi filter theo recipe cụ thể
    }
  });

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
    <div className="p-4 lg:p-6 animate__animated animate__fadeInUp page-transition w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 header-gradient inline-block">
          💬 Quản lý bình luận
        </h1>
        <p className="text-gray-600 mt-2">
          Quản lý tất cả bình luận trong hệ thống (từ Công thức và Bài đăng)
        </p>
        {comments.length > 0 && (
          <p className="text-sm text-gray-500 mt-2 animate__animated animate__fadeIn">
            Tổng: <strong className="text-primary">{comments.length}</strong> bình luận
            {comments.filter(c => c.source === 'recipe').length > 0 && (
              <span> • <strong>{comments.filter(c => c.source === 'recipe').length}</strong> từ Công thức</span>
            )}
            {comments.filter(c => c.source === 'post').length > 0 && (
              <span> • <strong>{comments.filter(c => c.source === 'post').length}</strong> từ Bài đăng</span>
            )}
          </p>
        )}
      </div>

      <div className="card animate__animated animate__fadeInUp animate-delay-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm bình luận..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white text-gray-900"
              />
            </div>
            <select
              value={filterRecipe}
              onChange={(e) => setFilterRecipe(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
            >
              <option value="all">Tất cả (Recipe + Post)</option>
              <option value="posts">Chỉ bài đăng (Post)</option>
              <option value="recipes">Chỉ công thức (Recipe)</option>
              {recipes.map((recipe) => (
                <option key={recipe._id} value={recipe._id.toString()}>
                  📝 {recipe.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredComments.length === 0 ? (
            <div className="p-12 text-center text-gray-500 animate__animated animate__fadeIn">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Không có bình luận nào</p>
            </div>
          ) : (
            filteredComments.map((comment, index) => (
              <div
                key={comment._id}
                className={`
                  p-6 table-row animate__animated animate__fadeInUp
                  ${deletingId === comment._id ? 'animate__zoomOut' : ''}
                  card-hover
                `}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                        {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{comment.user?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">
                          {comment.createdAt
                            ? new Date(comment.createdAt).toLocaleString('vi-VN')
                            : '-'}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3 leading-relaxed">{comment.text}</p>
                    <div className="mt-3 space-y-1.5">
                      {comment.source === 'recipe' && comment.recipe && (
                        <p className="text-sm text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                          📝 Công thức: <strong>{typeof comment.recipe === 'object' ? comment.recipe?.title : recipes.find((r) => r._id === comment.recipe)?.title || 'N/A'}</strong>
                        </p>
                      )}
                      {comment.source === 'post' && (
                        <p className="text-sm text-gray-600 bg-purple-50 px-3 py-1.5 rounded-lg inline-block">
                          📮 Bài đăng: <strong>{comment.postCaption || 'N/A'}</strong>
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Nguồn: <span className="font-medium">{comment.source === 'recipe' ? 'Công thức' : 'Bài đăng'}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(comment)}
                    className="ml-4 p-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                    title="Xóa bình luận"
                    disabled={deletingId === comment._id}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

