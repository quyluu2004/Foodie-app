import { useState, useEffect } from 'react';
import TableRecipes from '../components/TableRecipes';
import api from '../utils/api';
import { X, Plus, Trash2, ChefHat, Clock, Users, BookOpen } from 'lucide-react';

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    cookTimeMinutes: '',
    servings: '',
    difficulty: 'Dễ',
    ingredients: [],
    steps: [],
  });
  const [ingredientInput, setIngredientInput] = useState('');
  const [stepInput, setStepInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    title: '',
    description: '',
    category: '',
    cookTimeMinutes: '',
    servings: '',
    difficulty: 'Dễ',
    ingredients: [],
    steps: [],
  });
  const [addIngredientInput, setAddIngredientInput] = useState('');
  const [addStepInput, setAddStepInput] = useState('');
  const [addImageFile, setAddImageFile] = useState(null);
  const [addImagePreview, setAddImagePreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Check for edit recipe ID in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editRecipeId = urlParams.get('edit');
    if (editRecipeId && recipes.length > 0) {
      const recipeToEdit = recipes.find(r => r._id === editRecipeId);
      if (recipeToEdit) {
        handleEdit(recipeToEdit);
        // Clean up URL
        window.history.replaceState({}, '', '/recipes');
      }
    }
  }, [recipes.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recipesRes, categoriesRes] = await Promise.all([
        api.get('/recipes', {
          params: {
            page: 1,
            limit: 100,
            status: 'all'
          }
        }),
        api.get('/categories'),
      ]);
      
      const recipes = recipesRes.data?.recipes || [];
      
      if (recipes.length > 0) {
        console.log('📋 Total recipes:', recipes.length);
      }
      
      setRecipes(recipes);
      setCategories(categoriesRes.data?.categories || categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recipeId) => {
    try {
      await api.put(`/recipes/${recipeId}/approve`);
      fetchData();
      alert('Đã duyệt công thức thành công! User sẽ nhận được thông báo và công thức sẽ hiển thị trên ứng dụng.');
    } catch (error) {
      console.error('Error approving recipe:', error);
      alert('Có lỗi xảy ra khi duyệt công thức');
    }
  };

  const handleReject = async (recipeId) => {
    const reason = prompt('Nhập lý do từ chối công thức (tùy chọn):');
    if (reason === null) return;
    
    if (!confirm('Bạn có chắc muốn từ chối công thức này?')) return;
    
    try {
      await api.put(`/recipes/${recipeId}/reject`, { reason: reason || '' });
      fetchData();
      alert('Đã từ chối công thức! User sẽ nhận được thông báo.');
    } catch (error) {
      console.error('Error rejecting recipe:', error);
      alert('Có lỗi xảy ra khi từ chối công thức');
    }
  };

  const handleEdit = async (recipe) => {
    try {
      // Fetch full recipe details
      const response = await api.get(`/recipes/${recipe._id}`);
      const fullRecipe = response.data?.recipe || recipe;
      
      setEditingRecipe(fullRecipe);
      setFormData({
        title: fullRecipe.title || '',
        description: fullRecipe.description || '',
        category: fullRecipe.category?._id || fullRecipe.category || '',
        cookTimeMinutes: fullRecipe.cookTimeMinutes || fullRecipe.time || '',
        servings: fullRecipe.servings || '',
        difficulty: fullRecipe.difficulty || 'Dễ',
        ingredients: Array.isArray(fullRecipe.ingredients) ? fullRecipe.ingredients : [],
        steps: Array.isArray(fullRecipe.steps) ? fullRecipe.steps : [],
      });
      
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
      
      setImagePreview(normalizeImageUrl(fullRecipe.imageUrl));
      setImageFile(null);
      setDeleteImage(false);
      setShowDeleteImageConfirm(false);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error loading recipe details:', error);
      alert('Có lỗi xảy ra khi tải chi tiết công thức');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên công thức');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description || '');
      // Chỉ gửi category nếu có giá trị hợp lệ
      if (formData.category && formData.category.trim() !== '') {
        formDataToSend.append('category', formData.category);
      }
      formDataToSend.append('cookTimeMinutes', formData.cookTimeMinutes || '0');
      formDataToSend.append('servings', formData.servings || '1');
      formDataToSend.append('difficulty', formData.difficulty);
      formDataToSend.append('ingredients', JSON.stringify(formData.ingredients));
      formDataToSend.append('steps', JSON.stringify(formData.steps));
      
      // Xử lý xóa ảnh
      if (deleteImage) {
        formDataToSend.append('deleteImage', 'true');
      }
      
      // Xử lý upload ảnh mới (ưu tiên hơn xóa)
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      console.log('📝 Updating recipe:', editingRecipe._id);
      console.log('📸 Image file:', imageFile ? { name: imageFile.name, size: imageFile.size, type: imageFile.type } : 'none');
      console.log('🗑️ Delete image:', deleteImage);
      
      await api.put(`/recipes/${editingRecipe._id}`, formDataToSend, {
        headers: {
          // Không set Content-Type, để axios tự động set với boundary
        },
      });
      
      alert('Đã cập nhật công thức thành công!');
      setShowEditModal(false);
      setEditingRecipe(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        cookTimeMinutes: '',
        servings: '',
        difficulty: 'Dễ',
        ingredients: [],
        steps: [],
      });
      setImagePreview(null);
      setImageFile(null);
      setDeleteImage(false);
      setShowDeleteImageConfirm(false);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Error updating recipe:', error);
      console.error('Error response:', error.response?.data);
      alert(`Có lỗi xảy ra khi cập nhật công thức: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    
    if (!addFormData.title.trim()) {
      alert('Vui lòng nhập tên công thức');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', addFormData.title);
      formDataToSend.append('description', addFormData.description || '');
      if (addFormData.category && addFormData.category.trim() !== '') {
        formDataToSend.append('category', addFormData.category);
      }
      formDataToSend.append('cookTimeMinutes', addFormData.cookTimeMinutes || '0');
      formDataToSend.append('servings', addFormData.servings || '1');
      formDataToSend.append('difficulty', addFormData.difficulty);
      formDataToSend.append('ingredients', JSON.stringify(addFormData.ingredients));
      formDataToSend.append('steps', JSON.stringify(addFormData.steps));
      formDataToSend.append('status', 'approved'); // Admin tạo thì tự động approved
      
      if (addImageFile) {
        formDataToSend.append('image', addImageFile);
      }

      console.log('📝 Creating new recipe...');
      
      await api.post('/recipes', formDataToSend, {
        headers: {
          // Không set Content-Type, để axios tự động set với boundary
        },
      });
      
      alert('Đã tạo công thức thành công!');
      setShowAddModal(false);
      setAddFormData({
        title: '',
        description: '',
        category: '',
        cookTimeMinutes: '',
        servings: '',
        difficulty: 'Dễ',
        ingredients: [],
        steps: [],
      });
      setAddImagePreview(null);
      setAddImageFile(null);
      setAddIngredientInput('');
      setAddStepInput('');
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Error creating recipe:', error);
      console.error('Error response:', error.response?.data);
      alert(`Có lỗi xảy ra khi tạo công thức: ${error.response?.data?.message || error.message}`);
    }
  };

  const addAddIngredient = () => {
    if (addIngredientInput.trim()) {
      setAddFormData({
        ...addFormData,
        ingredients: [...addFormData.ingredients, addIngredientInput.trim()],
      });
      setAddIngredientInput('');
    }
  };

  const removeAddIngredient = (index) => {
    setAddFormData({
      ...addFormData,
      ingredients: addFormData.ingredients.filter((_, i) => i !== index),
    });
  };

  const addAddStep = () => {
    if (addStepInput.trim()) {
      setAddFormData({
        ...addFormData,
        steps: [...addFormData.steps, addStepInput.trim()],
      });
      setAddStepInput('');
    }
  };

  const removeAddStep = (index) => {
    setAddFormData({
      ...addFormData,
      steps: addFormData.steps.filter((_, i) => i !== index),
    });
  };

  const handleAddImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAddImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAddImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, ingredientInput.trim()],
      });
      setIngredientInput('');
    }
  };

  const removeIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const addStep = () => {
    if (stepInput.trim()) {
      setFormData({
        ...formData,
        steps: [...formData.steps, stepInput.trim()],
      });
      setStepInput('');
    }
  };

  const removeStep = (index) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index),
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const handleDeleteClick = (recipe) => {
    setSelectedRecipe(recipe);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRecipe || !selectedRecipe._id) {
      alert('Không tìm thấy công thức để xóa');
      return;
    }
    
    try {
      console.log('🗑️ Deleting recipe:', selectedRecipe._id);
      
      const response = await api.delete(`/recipes/${selectedRecipe._id}`, {
        data: {
          reason: deleteReason.trim()
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Delete response:', response.data);
      
      setRecipes(recipes.filter((r) => r._id !== selectedRecipe._id));
      setShowDeleteModal(false);
      setSelectedRecipe(null);
      setDeleteReason('');
      alert('Đã xóa công thức thành công! User sẽ nhận được thông báo.');
    } catch (error) {
      console.error('❌ Error deleting recipe:', error);
      console.error('❌ Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa công thức';
      alert(errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedRecipe(null);
    setDeleteReason('');
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

  const totalApproved = recipes.filter(r => r.status === 'approved').length;
  const totalPending = recipes.filter(r => r.status === 'pending').length;

  return (
    <div className="p-4 lg:p-6 w-full animate__animated animate__fadeInUp page-transition space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200 dark:shadow-orange-900/30">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Quản lý công thức
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-[52px]">
            Duyệt, chỉnh sửa và quản lý toàn bộ công thức nấu ăn trong hệ thống
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold shadow-md shadow-orange-200 dark:shadow-orange-900/30 hover:shadow-lg transition-all duration-200 active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Thêm công thức
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tổng công thức</p>
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{recipes.length}</p>
          {categories.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{categories.length} danh mục</p>
          )}
        </div>
        <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Đã duyệt</p>
            <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{totalApproved}</p>
          {recipes.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{Math.round(totalApproved / recipes.length * 100)}% tổng số</p>
          )}
        </div>
        <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Chờ duyệt</p>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{totalPending}</p>
          {totalPending > 0 && (
            <p className="text-xs text-amber-500 dark:text-amber-400 mt-1 font-medium">Cần xem xét</p>
          )}
        </div>
        <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Danh mục</p>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{categories.length}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">loại món ăn</p>
        </div>
      </div>

      {/* ── Table ── */}
      <div>
        <TableRecipes
          recipes={recipes}
          categories={categories}
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </div>

      {/* Modal chỉnh sửa công thức — luôn nền sáng, đồng bộ dashboard (cam) */}
      {showEditModal && editingRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate__animated animate__zoomIn my-auto border border-gray-200 text-gray-900 [color-scheme:light]"
            role="dialog"
            aria-labelledby="edit-recipe-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white rounded-t-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <h2 id="edit-recipe-title" className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  Chỉnh sửa công thức
                </h2>
              </div>
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditingRecipe(null); setImagePreview(null); setImageFile(null); }}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors shrink-0"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content — nền xám nhạt, từng khối trắng */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-gray-50">
              <form onSubmit={handleSubmit} id="edit-recipe-form" className="space-y-5">
                {/* Title */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Tên công thức <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title?.replace(/\s+\d+$/, '').replace(/\d+$/, '') || formData.title}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\s+\d+$/, '').replace(/\d+$/, '');
                      setFormData({ ...formData, title: cleaned });
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/35 focus:border-orange-400 transition-shadow"
                    required
                  />
                </div>

                {/* Description */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/35 focus:border-orange-400 resize-y min-h-[100px]"
                    rows={4}
                  />
                </div>

                {/* Meta grid */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Danh mục</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/35 focus:border-orange-400"
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Thời gian nấu (phút)</label>
                      <input
                        type="number"
                        value={formData.cookTimeMinutes}
                        onChange={(e) => setFormData({ ...formData, cookTimeMinutes: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/35 focus:border-orange-400"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Số người</label>
                      <input
                        type="number"
                        value={formData.servings}
                        onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/35 focus:border-orange-400"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Độ khó</label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/35 focus:border-orange-400"
                      >
                        <option value="Dễ">Dễ</option>
                        <option value="Trung bình">Trung bình</option>
                        <option value="Khó">Khó</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Image */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Ảnh công thức</label>
                  {imagePreview && !deleteImage && (
                    <div className="relative mb-4 overflow-hidden rounded-xl border-2 border-orange-100 bg-gray-100">
                      <img
                        src={imagePreview}
                        alt="Ảnh công thức"
                        className="w-full aspect-[4/3] max-h-80 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeleteImageConfirm(true)}
                        className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                        title="Xóa ảnh"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 left-3 bg-black/55 text-white text-xs font-medium px-2.5 py-1 rounded-lg backdrop-blur-sm">
                        Ảnh hiện tại
                      </div>
                    </div>
                  )}
                  {!deleteImage && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-800 file:font-medium hover:file:bg-orange-100 cursor-pointer"
                    />
                  )}
                  {deleteImage && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-900 font-medium">
                        Ảnh sẽ bị gỡ sau khi bạn nhấn &quot;Lưu thay đổi&quot;.
                      </p>
                    </div>
                  )}
                </div>

                {/* Ingredients */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Nguyên liệu</label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      value={ingredientInput}
                      onChange={(e) => setIngredientInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                      placeholder="Nhập nguyên liệu và nhấn Enter"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/35 focus:border-orange-400"
                    />
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md shadow-orange-200 hover:from-orange-600 hover:to-amber-600 transition-all sm:self-stretch"
                    >
                      <Plus className="w-5 h-5" />
                      Thêm
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {formData.ingredients.map((ingredient, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100"
                      >
                        <span className="text-gray-800 text-sm sm:text-base leading-snug">{ingredient}</span>
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0"
                          aria-label="Xóa nguyên liệu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Các bước thực hiện</label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <textarea
                      value={stepInput}
                      onChange={(e) => setStepInput(e.target.value)}
                      placeholder="Nhập bước thực hiện"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/35 focus:border-orange-400 resize-y min-h-[80px]"
                      rows={2}
                    />
                    <button
                      type="button"
                      onClick={addStep}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md shadow-orange-200 hover:from-orange-600 hover:to-amber-600 transition-all self-start sm:self-stretch sm:min-w-[120px]"
                    >
                      <Plus className="w-5 h-5" />
                      Thêm bước
                    </button>
                  </div>
                  <ol className="space-y-2 list-decimal list-inside marker:text-orange-600 marker:font-semibold">
                    {formData.steps.map((step, index) => (
                      <li
                        key={index}
                        className="flex items-start justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100"
                      >
                        <span className="flex-1 text-gray-800 text-sm sm:text-base leading-relaxed pl-1">{step}</span>
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors ml-1 shrink-0"
                          aria-label="Xóa bước"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl flex-shrink-0">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditingRecipe(null); setImagePreview(null); setImageFile(null); setDeleteImage(false); setShowDeleteImageConfirm(false); }}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="edit-recipe-form"
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Image Modal */}
      {showDeleteImageConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[105]">
          <div className="bg-white dark:bg-[#333333] rounded-lg shadow-xl dark:shadow-2xl border dark:border-[#404040] max-w-sm w-full mx-4 animate__animated animate__zoomIn">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-[#FFFFFF] mb-2">Xác nhận xóa ảnh</h3>
              <p className="text-gray-600 dark:text-[#E5E5E5] mb-4">
                Bạn có chắc muốn xóa ảnh này? Ảnh sẽ bị xóa vĩnh viễn sau khi bạn lưu thay đổi.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteImageConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    setDeleteImage(true);
                    setImagePreview(null);
                    setImageFile(null);
                    setShowDeleteImageConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Xóa ảnh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xóa công thức */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate__animated animate__fadeIn">
          <div className="bg-white dark:bg-[#333333] rounded-lg shadow-xl dark:shadow-2xl dark:border dark:border-[#404040] max-w-md w-full mx-4 animate__animated animate__zoomIn dark:text-[#FFFFFF]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-[#FFFFFF]">Xóa công thức</h3>
                <button
                  onClick={handleDeleteCancel}
                  className="text-gray-400 dark:text-[#CCCCCC] hover:text-gray-600 dark:hover:text-[#FFFFFF] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Bạn có chắc muốn xóa công thức này? User sẽ nhận được thông báo "Admin đã xóa công thức của bạn".
                </p>
                {selectedRecipe && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      <strong>Công thức:</strong> {selectedRecipe.title || 'Không có tiêu đề'}
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="deleteReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do xóa công thức <span className="text-gray-400">(tùy chọn)</span>
                </label>
                <textarea
                  id="deleteReason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Nhập lý do tại sao xóa công thức này (ví dụ: Vi phạm nội dung, Spam, ...)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
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
                  Xóa công thức
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm công thức mới */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl shadow-2xl dark:border dark:border-[#3A3A3A] max-w-4xl w-full max-h-[90vh] flex flex-col animate__animated animate__zoomIn my-auto dark:text-[#FFFFFF]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#3A3A3A] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-sm">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thêm công thức mới</h2>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddFormData({ title: '', description: '', category: '', cookTimeMinutes: '', servings: '', difficulty: 'Dễ', ingredients: [], steps: [] });
                  setAddImagePreview(null); setAddImageFile(null); setAddIngredientInput(''); setAddStepInput('');
                }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3A3A3A] text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6 bg-gray-50 dark:bg-[#2A2A2A]">
              <form onSubmit={handleAddRecipe} id="add-recipe-form" className="space-y-6">
                {/* Title */}
                  <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">
                    Tên công thức <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.title}
                    onChange={(e) => setAddFormData({ ...addFormData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                    required
                    placeholder="Nhập tên công thức..."
                  />
                </div>

                {/* Description */}
                  <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Mô tả</label>
                  <textarea
                    value={addFormData.description}
                    onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                    rows="3"
                    placeholder="Nhập mô tả công thức..."
                  />
                </div>

                {/* Category, Time, Servings, Difficulty */}
                  <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Danh mục</label>
                      <select
                        value={addFormData.category}
                        onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Thời gian nấu (phút)</label>
                      <input
                        type="number"
                        value={addFormData.cookTimeMinutes}
                        onChange={(e) => setAddFormData({ ...addFormData, cookTimeMinutes: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                        min="1"
                        placeholder="Ví dụ: 30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Số người</label>
                      <input
                        type="number"
                        value={addFormData.servings}
                        onChange={(e) => setAddFormData({ ...addFormData, servings: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                        min="1"
                        placeholder="Ví dụ: 4"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Độ khó</label>
                      <select
                        value={addFormData.difficulty}
                        onChange={(e) => setAddFormData({ ...addFormData, difficulty: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                      >
                        <option value="Dễ">Dễ</option>
                        <option value="Trung bình">Trung bình</option>
                        <option value="Khó">Khó</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Image */}
                  <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Ảnh công thức</label>
                  {addImagePreview && (
                    <div className="relative mb-4">
                      <img
                        src={addImagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border-2 border-orange-300 dark:border-orange-600 shadow-md"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddImageChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-[#2A2A2A] dark:text-[#FFFFFF] text-gray-900 font-medium cursor-pointer"
                  />
                </div>

                {/* Ingredients */}
                  <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Nguyên liệu</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={addIngredientInput}
                      onChange={(e) => setAddIngredientInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAddIngredient())}
                      placeholder="Nhập nguyên liệu và nhấn Enter"
                      className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                    />
                    <button
                      type="button"
                      onClick={addAddIngredient}
                      className="px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold shadow-md"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {addFormData.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-100 p-3 rounded-lg border border-gray-200 dark:border-gray-300">
                        <span className="dark:text-[#FFFFFF] text-gray-800 font-medium">{ingredient}</span>
                        <button
                          type="button"
                          onClick={() => removeAddIngredient(index)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                  <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Các bước thực hiện</label>
                  <div className="flex gap-2 mb-3">
                    <textarea
                      value={addStepInput}
                      onChange={(e) => setAddStepInput(e.target.value)}
                      placeholder="Nhập bước thực hiện"
                      className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                      rows="2"
                    />
                    <button
                      type="button"
                      onClick={addAddStep}
                      className="px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors self-start font-semibold shadow-md"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <ol className="space-y-2 list-decimal list-inside">
                    {addFormData.steps.map((step, index) => (
                      <li key={index} className="flex items-start justify-between bg-gray-100 dark:bg-gray-100 p-3 rounded-lg border border-gray-200 dark:border-gray-300">
                        <span className="flex-1 dark:text-[#FFFFFF] text-gray-800 font-medium">{step}</span>
                        <button
                          type="button"
                          onClick={() => removeAddStep(index)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors ml-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-[#3A3A3A] bg-gray-50/50 dark:bg-[#252525] rounded-b-2xl flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddFormData({ title: '', description: '', category: '', cookTimeMinutes: '', servings: '', difficulty: 'Dễ', ingredients: [], steps: [] });
                  setAddImagePreview(null); setAddImageFile(null); setAddIngredientInput(''); setAddStepInput('');
                }}
                className="px-5 py-2.5 border border-gray-200 dark:border-[#404040] rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3A3A] transition-colors font-medium text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="add-recipe-form"
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Lưu công thức
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
