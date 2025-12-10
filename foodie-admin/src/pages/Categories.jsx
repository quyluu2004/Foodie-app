import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, X, Eye, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRecipesModal, setShowRecipesModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryRecipes, setCategoryRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [showRecipeDetailModal, setShowRecipeDetailModal] = useState(false);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState(null);
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data?.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryRecipes = async (categoryId, categoryName) => {
    try {
      setLoadingRecipes(true);
      setSelectedCategory({ _id: categoryId, name: categoryName });
      setShowRecipesModal(true);
      
      // Fetch recipes by category
      const response = await api.get(`/recipes?category=${categoryName}&limit=100`);
      const recipes = response.data?.recipes || response.data || [];
      setCategoryRecipes(recipes);
    } catch (error) {
      console.error('Error fetching category recipes:', error);
      alert('Có lỗi xảy ra khi tải danh sách món ăn');
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleApproveRecipe = async (recipeId) => {
    try {
      await api.put(`/recipes/${recipeId}/approve`);
      // Refresh recipes list
      if (selectedCategory) {
        await fetchCategoryRecipes(selectedCategory._id, selectedCategory.name);
      }
      alert('Đã duyệt công thức thành công!');
    } catch (error) {
      console.error('Error approving recipe:', error);
      alert('Có lỗi xảy ra khi duyệt công thức');
    }
  };

  const handleRejectRecipe = async (recipeId) => {
    const reason = prompt('Nhập lý do từ chối công thức (tùy chọn):');
    if (reason === null) return; // User cancelled
    
    if (!confirm('Bạn có chắc muốn từ chối công thức này?')) return;
    
    try {
      await api.put(`/recipes/${recipeId}/reject`, { reason: reason || '' });
      // Refresh recipes list
      if (selectedCategory) {
        await fetchCategoryRecipes(selectedCategory._id, selectedCategory.name);
      }
      alert('Đã từ chối công thức!');
    } catch (error) {
      console.error('Error rejecting recipe:', error);
      alert('Có lỗi xảy ra khi từ chối công thức');
    }
  };

  const handleEditRecipe = (recipe) => {
    // Close current modal
    setShowRecipesModal(false);
    setSelectedCategory(null);
    setCategoryRecipes([]);
    
    // Navigate to recipes page and trigger edit
    window.location.href = `/recipes?edit=${recipe._id}`;
  };

  const handleDeleteRecipeClick = (recipe) => {
    setSelectedRecipe(recipe);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleDeleteRecipeConfirm = async () => {
    if (!selectedRecipe || !selectedRecipe._id) {
      alert('Không tìm thấy công thức để xóa');
      return;
    }
    
    try {
      await api.delete(`/recipes/${selectedRecipe._id}`, {
        data: { reason: deleteReason.trim() },
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Refresh recipes list
      if (selectedCategory) {
        await fetchCategoryRecipes(selectedCategory._id, selectedCategory.name);
      }
      
      setShowDeleteModal(false);
      setSelectedRecipe(null);
      setDeleteReason('');
      alert('Đã xóa công thức thành công!');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa công thức';
      alert(errorMessage);
    }
  };

  const handleViewRecipeDetail = async (recipe) => {
    try {
      const response = await api.get(`/recipes/${recipe._id}`);
      setSelectedRecipeDetail(response.data?.recipe || response.data);
      setShowRecipeDetailModal(true);
    } catch (error) {
      console.error('Error fetching recipe detail:', error);
      alert('Có lỗi xảy ra khi tải chi tiết công thức');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description || '');
      
      // Xử lý xóa ảnh - ưu tiên xóa ảnh nếu có yêu cầu
      if (deleteImage && editingCategory) {
        formDataToSend.append('deleteImage', 'true');
        console.log('🗑️ Gửi yêu cầu xóa ảnh');
      } 
      // Chỉ upload ảnh mới nếu không có yêu cầu xóa
      else if (formData.image) {
        formDataToSend.append('image', formData.image);
        console.log('📤 Gửi ảnh mới');
      }

      if (editingCategory) {
        console.log('📝 Cập nhật danh mục:', {
          id: editingCategory._id,
          name: formData.name,
          deleteImage: deleteImage,
          hasNewImage: !!formData.image
        });
        
        await api.put(`/categories/${editingCategory._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Đã cập nhật danh mục thành công!');
      } else {
        await api.post('/categories', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Đã thêm danh mục thành công!');
      }
      
      setShowModal(false);
      setFormData({ name: '', description: '', image: null });
      setEditingCategory(null);
      setImagePreview(null);
      setDeleteImage(false);
      setHasChanges(false);
      setOriginalFormData(null);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      console.error('Error response:', error.response?.data);
      alert(`Có lỗi xảy ra khi lưu danh mục: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    const initialData = {
      name: category.name || '',
      description: category.description || '',
      image: null,
    };
    setFormData(initialData);
    setOriginalFormData(initialData);
    setDeleteImage(false);
    setHasChanges(false);
    
    // Set image preview
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
    
    const imageUrl = normalizeImageUrl(category.imageUrl);
    setImagePreview(imageUrl);
    setOriginalFormData({ ...initialData, imageUrl: imageUrl });
    setShowModal(true);
  };

  // Check for changes
  useEffect(() => {
    if (editingCategory && originalFormData) {
      const nameChanged = formData.name !== originalFormData.name;
      const descChanged = formData.description !== originalFormData.description;
      const imageChanged = formData.image !== null || deleteImage;
      setHasChanges(nameChanged || descChanged || imageChanged);
    } else {
      setHasChanges(false);
    }
  }, [formData, deleteImage, editingCategory, originalFormData]);

  const handleDelete = async (categoryId) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    
    try {
      await api.delete(`/categories/${categoryId}`);
      setCategories(categories.filter((c) => c._id !== categoryId));
      alert('Đã xóa danh mục thành công!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Có lỗi xảy ra khi xóa danh mục');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setDeleteImage(false);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImageClick = () => {
    setShowDeleteImageConfirm(true);
  };

  const handleConfirmDeleteImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
    setDeleteImage(true);
    setShowDeleteImageConfirm(false);
  };

  const handleCancelDeleteImage = () => {
    setShowDeleteImageConfirm(false);
  };

  const normalizeImageUrl = (url) => {
    if (!url) return null;
    
    // Kiểm tra nếu URL là placeholder không hợp lệ (Unsplash, placeholder services)
    if (url.includes('800x600') || 
        url.includes('800x800') || 
        url.includes('vietnamese-') || 
        url.includes('placeholder') ||
        url.includes('unsplash.com') ||
        url.includes('source.unsplash')) {
      return null;
    }
    
    // Kiểm tra nếu URL không phải là URL hợp lệ
    if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:')) {
      return null;
    }
    
    return url
      .replace(/192\.168\.1\.50/g, '192.168.2.229')
      .replace(/192\.168\.1\.52/g, '192.168.2.229')
      .replace(/192\.168\.1\.197/g, '192.168.2.229')
      .replace(/192\.168\.1\.30/g, '192.168.2.229')
      .replace(/192\.168\.2\.39/g, '192.168.2.229')
      .replace(/10\.12\.117\.94/g, '192.168.2.229')
      .replace(/172\.16\.1\.238/g, '192.168.2.229')
      .replace(/localhost/g, '192.168.2.229');
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
      <div className="mb-6 flex items-center justify-between animate__animated animate__fadeInDown">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[#FFFFFF] mb-2 header-gradient inline-block">
            📁 Quản lý danh mục
          </h1>
          <p className="text-gray-600 dark:text-[#E5E5E5] mt-2">Quản lý các danh mục món ăn</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', description: '', image: null });
            setImagePreview(null);
            setDeleteImage(false);
            setHasChanges(false);
            setOriginalFormData(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm danh mục
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const imageUrl = normalizeImageUrl(category.imageUrl);
          const hasImage = imageUrl && 
                          imageUrl.trim() !== '' && 
                          imageUrl !== 'null' && 
                          imageUrl !== 'undefined' &&
                          !imageUrl.includes('placeholder') &&
                          !imageUrl.includes('800x600') &&
                          !imageUrl.includes('800x800') &&
                          !imageUrl.includes('vietnamese-') &&
                          !imageUrl.includes('unsplash.com') &&
                          (imageUrl.startsWith('http') || imageUrl.startsWith('/') || imageUrl.startsWith('data:'));

          return (
            <div key={category._id} className="bg-white dark:bg-[#333333] rounded-card p-6 shadow-sm border border-gray-100 dark:border-[#404040] hover:shadow-md transition-shadow cursor-pointer dark:text-[#FFFFFF]" onClick={() => fetchCategoryRecipes(category._id, category.name)}>
              {hasImage ? (
                <img
                  src={imageUrl}
                  alt={category.name}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-full h-40 rounded-lg mb-4 flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100 ${hasImage ? 'hidden' : ''}`}
              >
                <span className="text-4xl">🍽️</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-[#FFFFFF]">{category.name}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchCategoryRecipes(category._id, category.name);
                  }}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Xem danh sách món ăn"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-[#E5E5E5] mb-4">{category.description || 'Chưa có mô tả'}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(category);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Sửa
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(category._id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Category */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#333333] rounded-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto dark:text-[#FFFFFF]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#FFFFFF]">
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
              {hasChanges && editingCategory && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Có thay đổi
                </span>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E5E5] mb-2">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  placeholder="Nhập tên danh mục"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E5E5] mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows="3"
                  placeholder="Nhập mô tả danh mục"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E5E5] mb-2">Ảnh danh mục</label>
                
                {/* Image Preview */}
                {imagePreview && !deleteImage && (
                  <div className="relative mb-3 group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImageClick}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                      title="Xóa ảnh"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    {editingCategory && (
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        Ảnh hiện tại
                      </div>
                    )}
                  </div>
                )}
                
                {/* Upload new image */}
                {(!imagePreview || deleteImage) && (
                  <div className="mb-3">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400 dark:text-[#CCCCCC]" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-[#E5E5E5]">
                          <span className="font-semibold">Click để upload</span> hoặc kéo thả
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#E5E5E5]">PNG, JPG, GIF (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                
                {/* Change image option */}
                {imagePreview && !deleteImage && editingCategory && (
                  <div className="mb-3">
                    <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                      <Upload className="w-4 h-4 mr-2 text-gray-400 dark:text-[#CCCCCC]" />
                      <span className="text-sm text-gray-600 dark:text-[#E5E5E5]">Thay đổi ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Changes summary */}
              {hasChanges && editingCategory && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium mb-1">Thay đổi đã thực hiện:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    {formData.name !== originalFormData?.name && (
                      <li>• Tên danh mục đã thay đổi</li>
                    )}
                    {formData.description !== originalFormData?.description && (
                      <li>• Mô tả đã thay đổi</li>
                    )}
                    {(deleteImage || formData.image) && (
                      <li>• Ảnh đã thay đổi</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    if (hasChanges && !confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy?')) {
                      return;
                    }
                    setShowModal(false);
                    setEditingCategory(null);
                    setFormData({ name: '', description: '', image: null });
                    setImagePreview(null);
                    setDeleteImage(false);
                    setHasChanges(false);
                    setOriginalFormData(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !formData.name.trim()
                      ? 'bg-gray-300 dark:bg-[#404040] text-gray-500 dark:text-[#CCCCCC] cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {editingCategory ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {hasChanges ? 'Lưu thay đổi' : 'Cập nhật'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      Thêm danh mục
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Image Modal */}
      {showDeleteImageConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[55]">
          <div className="bg-white dark:bg-[#333333] rounded-card p-6 w-full max-w-sm dark:text-[#FFFFFF]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#FFFFFF] mb-2">Xác nhận xóa ảnh</h3>
            <p className="text-gray-600 dark:text-[#E5E5E5] mb-4">
              Bạn có chắc muốn xóa ảnh này? Ảnh sẽ bị xóa vĩnh viễn sau khi bạn lưu thay đổi.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelDeleteImage}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDeleteImage}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa ảnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Recipes in Category */}
      {showRecipesModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#333333] rounded-card p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto dark:text-[#FFFFFF]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setShowRecipesModal(false);
                    setSelectedCategory(null);
                    setCategoryRecipes([]);
                  }}
                  className="text-gray-600 dark:text-[#E5E5E5] hover:text-gray-900 dark:hover:text-[#FFFFFF] transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Danh sách món ăn: {selectedCategory.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Tổng số: {categoryRecipes.length} món ăn
                  </p>
                </div>
              </div>
            </div>

            {loadingRecipes ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-[#E5E5E5]">Đang tải danh sách món ăn...</p>
                </div>
              </div>
            ) : categoryRecipes.length === 0 ? (
              <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-[#E5E5E5]">Chưa có món ăn nào trong danh mục này</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#1A1A1A]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#E5E5E5] uppercase tracking-wider">
                        Ảnh
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#E5E5E5] uppercase tracking-wider">
                        Tên món ăn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#E5E5E5] uppercase tracking-wider">
                        Người đăng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#E5E5E5] uppercase tracking-wider">
                        Đánh giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#E5E5E5] uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-[#404040]">
                    {categoryRecipes.map((recipe) => {
                      const recipeImageUrl = normalizeImageUrl(recipe.imageUrl);
                      const hasRecipeImage = recipeImageUrl && 
                                            recipeImageUrl.trim() !== '' && 
                                            recipeImageUrl !== 'null' && 
                                            recipeImageUrl !== 'undefined' &&
                                            !recipeImageUrl.includes('placeholder') &&
                                            !recipeImageUrl.includes('800x600') &&
                                            !recipeImageUrl.includes('800x800') &&
                                            !recipeImageUrl.includes('vietnamese-') &&
                                            !recipeImageUrl.includes('unsplash.com') &&
                                            (recipeImageUrl.startsWith('http') || recipeImageUrl.startsWith('/') || recipeImageUrl.startsWith('data:'));
                      
                      // Get author info
                      const authorName = (() => {
                        const author = recipe.author;
                        if (typeof author === 'object' && author !== null) {
                          return author.name || author.email || 'N/A';
                        }
                        if (typeof author === 'string') {
                          return author;
                        }
                        return 'N/A';
                      })();

                      const authorEmail = (() => {
                        const author = recipe.author;
                        if (typeof author === 'object' && author !== null) {
                          return author.email || '';
                        }
                        return '';
                      })();

                      return (
                        <tr key={recipe._id} className="hover:bg-gray-50 dark:hover:bg-[#404040]">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {hasRecipeImage ? (
                              <img
                                src={recipeImageUrl}
                                alt={recipe.title}
                                className="w-16 h-16 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100 ${hasRecipeImage ? 'hidden' : ''}`}>
                              <span className="text-2xl">🍽️</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-[#FFFFFF]">
                              {recipe.title?.replace(/\s+\d+$/, '').replace(/\d+$/, '') || recipe.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-[#E5E5E5] line-clamp-2">{recipe.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-[#FFFFFF]">{authorName}</div>
                            {authorEmail && (
                              <div className="text-xs text-gray-500 dark:text-[#E5E5E5]">{authorEmail}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">⭐</span>
                              <span className="text-sm text-gray-900 dark:text-[#FFFFFF]">
                                {recipe.averageRating?.toFixed(1) || '0.0'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-[#E5E5E5]">
                                ({recipe.ratingCount || 0})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              recipe.status === 'approved' ? 'bg-green-100 text-green-800' :
                              recipe.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {recipe.status === 'approved' ? 'Đã duyệt' :
                               recipe.status === 'pending' ? 'Chờ duyệt' :
                               'Từ chối'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewRecipeDetail(recipe)}
                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-all duration-200 hover:scale-105 active:scale-95"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {recipe.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveRecipe(recipe._id)}
                                    className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-all duration-200 hover:scale-105 active:scale-95"
                                    title="Duyệt"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectRecipe(recipe._id)}
                                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-all duration-200 hover:scale-105 active:scale-95"
                                    title="Từ chối"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleEditRecipe(recipe)}
                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-all duration-200 hover:scale-105 active:scale-95"
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecipeClick(recipe)}
                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-all duration-200 hover:scale-105 active:scale-95"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Recipe Modal */}
      {showDeleteModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-[#333333] rounded-card p-6 w-full max-w-md dark:text-[#FFFFFF]">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Xóa công thức</h2>
            <p className="text-gray-600 mb-4">
              Bạn có chắc muốn xóa công thức <strong>"{selectedRecipe.title}"</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do xóa (tùy chọn)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows="3"
                placeholder="Nhập lý do xóa công thức..."
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRecipe(null);
                  setDeleteReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteRecipeConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {showRecipeDetailModal && selectedRecipeDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-[#333333] rounded-card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto dark:text-[#FFFFFF]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Chi tiết công thức</h2>
              <button
                onClick={() => {
                  setShowRecipeDetailModal(false);
                  setSelectedRecipeDetail(null);
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              <div>
                {(() => {
                  const detailImageUrl = normalizeImageUrl(selectedRecipeDetail.imageUrl);
                  const hasDetailImage = detailImageUrl && 
                                        detailImageUrl.trim() !== '' && 
                                        detailImageUrl !== 'null' && 
                                        detailImageUrl !== 'undefined' &&
                                        !detailImageUrl.includes('placeholder') &&
                                        !detailImageUrl.includes('800x600') &&
                                        !detailImageUrl.includes('800x800') &&
                                        !detailImageUrl.includes('vietnamese-') &&
                                        !detailImageUrl.includes('unsplash.com') &&
                                        (detailImageUrl.startsWith('http') || detailImageUrl.startsWith('/') || detailImageUrl.startsWith('data:'));
                  
                  return hasDetailImage ? (
                    <img
                      src={detailImageUrl}
                      alt={selectedRecipeDetail.title}
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null;
                })()}
                <div className={`w-full h-64 rounded-lg flex items-center justify-center bg-gray-100 ${(() => {
                  const detailImageUrl = normalizeImageUrl(selectedRecipeDetail.imageUrl);
                  return detailImageUrl && 
                         detailImageUrl.trim() !== '' && 
                         detailImageUrl !== 'null' && 
                         detailImageUrl !== 'undefined' &&
                         !detailImageUrl.includes('placeholder') &&
                         !detailImageUrl.includes('800x600') &&
                         !detailImageUrl.includes('800x800') &&
                         !detailImageUrl.includes('vietnamese-') &&
                         !detailImageUrl.includes('unsplash.com') &&
                         (detailImageUrl.startsWith('http') || detailImageUrl.startsWith('/') || detailImageUrl.startsWith('data:'));
                })() ? 'hidden' : ''}`}>
                  <span className="text-6xl">🍽️</span>
                </div>
              </div>

              {/* Info */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedRecipeDetail.title?.replace(/\s+\d+$/, '').replace(/\d+$/, '') || selectedRecipeDetail.title}
                </h3>
                <p className="text-gray-600 mb-4">{selectedRecipeDetail.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Danh mục:</span>
                    <span className="text-gray-600">
                      {selectedRecipeDetail.categoryName || 
                       (selectedRecipeDetail.category?.name) || 
                       'Chưa phân loại'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Người đăng:</span>
                    <span className="text-gray-600">
                      {selectedRecipeDetail.author?.name || selectedRecipeDetail.author?.email || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Thời gian nấu:</span>
                    <span className="text-gray-600">
                      {selectedRecipeDetail.cookTimeMinutes || selectedRecipeDetail.time || 'N/A'} phút
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Số người:</span>
                    <span className="text-gray-600">
                      {selectedRecipeDetail.servings || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Độ khó:</span>
                    <span className="text-gray-600">
                      {selectedRecipeDetail.difficulty || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Đánh giá:</span>
                    <span className="text-gray-600">
                      ⭐ {selectedRecipeDetail.averageRating?.toFixed(1) || '0.0'} 
                      ({selectedRecipeDetail.ratingCount || 0} đánh giá)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Trạng thái:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedRecipeDetail.status === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedRecipeDetail.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedRecipeDetail.status === 'approved' ? 'Đã duyệt' :
                       selectedRecipeDetail.status === 'pending' ? 'Chờ duyệt' :
                       'Từ chối'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            {selectedRecipeDetail.ingredients && selectedRecipeDetail.ingredients.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-3">Nguyên liệu</h4>
                <ul className="list-disc list-inside space-y-1">
                  {Array.isArray(selectedRecipeDetail.ingredients) ? (
                    selectedRecipeDetail.ingredients.map((ingredient, index) => (
                      <li key={index} className="text-gray-600">
                        {typeof ingredient === 'string' ? ingredient : ingredient.name || ingredient}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-600">{selectedRecipeDetail.ingredients}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Steps */}
            {selectedRecipeDetail.steps && selectedRecipeDetail.steps.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-3">Các bước thực hiện</h4>
                <ol className="list-decimal list-inside space-y-2">
                  {Array.isArray(selectedRecipeDetail.steps) ? (
                    selectedRecipeDetail.steps.map((step, index) => (
                      <li key={index} className="text-gray-600">
                        {typeof step === 'string' ? step : step.description || step}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-600">{selectedRecipeDetail.steps}</li>
                  )}
                </ol>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
              {selectedRecipeDetail.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleApproveRecipe(selectedRecipeDetail._id);
                      setShowRecipeDetailModal(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Duyệt
                  </button>
                  <button
                    onClick={() => {
                      handleRejectRecipe(selectedRecipeDetail._id);
                      setShowRecipeDetailModal(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Từ chối
                  </button>
                </>
              )}
              <button
                onClick={() => handleEditRecipe(selectedRecipeDetail)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </button>
              <button
                onClick={() => {
                  setShowRecipeDetailModal(false);
                  handleDeleteRecipeClick(selectedRecipeDetail);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
