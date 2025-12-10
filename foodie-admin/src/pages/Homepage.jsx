import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, ArrowUp, ArrowDown, Search } from 'lucide-react';
import api from '../utils/api';

// Helper function để convert hex to rgb
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
};

export default function Homepage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    subtitle: '', 
    icon: '🍽️',
    color: '#FF8C42',
    type: 'category' // 'category' hoặc 'recipe-list'
  });
  const [showRecipesModal, setShowRecipesModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null); // Mục con được chọn
  const [availableRecipes, setAvailableRecipes] = useState([]);
  const [sectionRecipes, setSectionRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [subCategoryFormData, setSubCategoryFormData] = useState({
    title: '',
    icon: '🍽️',
    color: '#FF8C42',
    style: {
      borderStyle: 'solid',
      borderWidth: 2,
      borderColor: '#FF8C42',
      borderRadius: 16,
      shadow: {
        enabled: true,
        color: '#000000',
        opacity: 0.1,
        blur: 8,
      },
      backgroundGradient: {
        enabled: false,
        startColor: '#FF8C42',
        endColor: '#FFA94D',
      },
      backgroundLayer: {
        enabled: true,
        color: '#FFE66D',
        offset: 8,
        borderRadius: 20,
      },
    },
  });

  useEffect(() => {
    fetchSections();
  }, []);

  // Load sections từ API
  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/homepage/sections');
      const sectionsData = response.data?.sections || [];
      
      if (sectionsData.length > 0) {
        setSections(sectionsData);
      } else {
        // Default sections nếu chưa có
        const defaultSections = [
          {
            _id: '1',
            title: 'Món ăn ấm cúng cho đêm lạnh',
            subtitle: '',
            icon: '🌙',
            color: '#FFB6C1',
            type: 'category',
            recipes: [],
            order: 0
          },
          {
            _id: '2',
            title: 'Công thức đang hot',
            subtitle: '',
            icon: '🔥',
            color: '#FF8C42',
            type: 'recipe-list',
            recipes: [],
            order: 1
          }
        ];
        setSections(defaultSections);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      // Fallback to localStorage nếu API fail
      const savedSections = localStorage.getItem('homepageSections');
      if (savedSections) {
        setSections(JSON.parse(savedSections));
      }
    } finally {
      setLoading(false);
    }
  };

  // Save sections
  const saveSections = async (sectionsToSave) => {
    try {
      // Chuẩn bị data để gửi (chỉ gửi _id của recipes)
      const sectionsToSend = sectionsToSave.map(section => ({
        _id: section._id,
        title: section.title,
        subtitle: section.subtitle || '',
        icon: section.icon || '🍽️',
        color: section.color || '#FF8C42',
        type: section.type || 'category',
        recipes: section.recipes?.map(r => r._id || r) || [],
        subCategories: section.subCategories?.map(subCat => ({
          _id: subCat._id,
          title: subCat.title,
          icon: subCat.icon || '🍽️',
          color: subCat.color || '#FF8C42',
          style: subCat.style || {
            borderStyle: 'solid',
            borderWidth: 2,
            borderColor: subCat.color || '#FF8C42',
            borderRadius: 16,
            shadow: { enabled: true, color: '#000000', opacity: 0.1, blur: 8 },
            backgroundGradient: { enabled: false, startColor: subCat.color || '#FF8C42', endColor: '#FFA94D' },
            backgroundLayer: { enabled: true, color: '#FFE66D', offset: 8, borderRadius: 20 },
          },
          recipes: subCat.recipes?.map(r => r._id || r) || [],
          order: subCat.order || 0,
        })) || [],
        order: section.order || 0,
      }));
      
      const response = await api.post('/homepage/sections', { sections: sectionsToSend });
      
      if (response.data?.success) {
        // Cập nhật sections với data từ server (có populate recipes)
        setSections(response.data.sections || sectionsToSave);
        // Không hiển thị alert nếu đang trong modal (sẽ hiển thị trong modal)
        if (!showSubCategoryModal && !showModal) {
          alert('Đã lưu cấu hình trang chủ thành công!');
        }
        return true; // Trả về true để biết lưu thành công
      } else {
        throw new Error(response.data?.message || 'Lỗi khi lưu');
      }
    } catch (error) {
      console.error('Error saving sections:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu cấu hình';
      alert(errorMessage);
      throw error; // Throw lại để caller có thể handle
    }
  };

  // Load available recipes
  const loadAvailableRecipes = async () => {
    try {
      const response = await api.get('/recipes?limit=100');
      const recipes = response.data?.recipes || response.data || [];
      setAvailableRecipes(recipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
      alert('Có lỗi xảy ra khi tải danh sách công thức');
    }
  };

  // Mở modal để thêm công thức vào section hoặc sub-category
  const handleAddRecipes = async (section, subCategory = null) => {
    setSelectedSection(section);
    setSelectedSubCategory(subCategory);
    await loadAvailableRecipes();
    
    if (subCategory) {
      // Nếu là sub-category, load recipes của sub-category
      setSectionRecipes(subCategory.recipes || []);
    } else {
      // Nếu là section, load recipes của section
      setSectionRecipes(section.recipes || []);
    }
    setShowRecipesModal(true);
  };

  // Thêm công thức vào section
  const handleAddRecipeToSection = (recipe) => {
    if (!sectionRecipes.find(r => r._id === recipe._id)) {
      setSectionRecipes([...sectionRecipes, recipe]);
    }
  };

  // Xóa công thức khỏi section
  const handleRemoveRecipeFromSection = (recipeId) => {
    setSectionRecipes(sectionRecipes.filter(r => r._id !== recipeId));
  };

  // Lưu công thức vào section hoặc sub-category
  const handleSaveRecipesToSection = () => {
    const updatedSections = sections.map(section => {
      if (section._id === selectedSection._id) {
        if (selectedSubCategory) {
          // Cập nhật recipes của sub-category
          const updatedSubCategories = section.subCategories?.map(subCat =>
            subCat._id === selectedSubCategory._id
              ? { ...subCat, recipes: sectionRecipes }
              : subCat
          ) || [];
          return { ...section, subCategories: updatedSubCategories };
        } else {
          // Cập nhật recipes của section
          return { ...section, recipes: sectionRecipes };
        }
      }
      return section;
    });
    saveSections(updatedSections);
    setShowRecipesModal(false);
    setSelectedSection(null);
    setSelectedSubCategory(null);
    setSectionRecipes([]);
  };

  // Submit form (tạo/sửa section)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingSection) {
      // Cập nhật section
      const updatedSections = sections.map(section =>
        section._id === editingSection._id
          ? { ...section, ...formData }
          : section
      );
      saveSections(updatedSections);
    } else {
      // Tạo section mới
      const newSection = {
        _id: Date.now().toString(),
        ...formData,
        recipes: [],
        order: sections.length
      };
      saveSections([...sections, newSection]);
    }
    
    setShowModal(false);
    setEditingSection(null);
    setFormData({ title: '', subtitle: '', icon: '🍽️', color: '#FF8C42', type: 'category' });
  };

  // Edit section
  const handleEdit = (section) => {
    setEditingSection(section);
    setFormData({
      title: section.title || '',
      subtitle: section.subtitle || '',
      icon: section.icon || '🍽️',
      color: section.color || '#FF8C42',
      type: section.type || 'category'
    });
    setShowModal(true);
  };

  // Delete section
  const handleDelete = (sectionId) => {
    if (!confirm('Bạn có chắc muốn xóa section này?')) return;
    
    const updatedSections = sections.filter(s => s._id !== sectionId);
    saveSections(updatedSections);
  };

  // Move section up/down
  const handleMoveSection = (sectionId, direction) => {
    const index = sections.findIndex(s => s._id === sectionId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    const updatedSections = [...sections];
    [updatedSections[index], updatedSections[newIndex]] = [updatedSections[newIndex], updatedSections[index]];
    
    // Update order
    updatedSections.forEach((section, idx) => {
      section.order = idx;
    });
    
    saveSections(updatedSections);
  };

  // Filter recipes by search
  const filteredRecipes = availableRecipes.filter(recipe => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      recipe.title?.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full animate__animated animate__fadeInUp page-transition">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 header-gradient inline-block">
            🏠 Quản lý trang chủ
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý các section và nội dung hiển thị trên trang chủ mobile app
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSection(null);
            setFormData({ title: '', subtitle: '', icon: '🍽️', color: '#FF8C42', type: 'category' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm section
        </button>
      </div>

      <div className="space-y-4">
        {sections.sort((a, b) => (a.order || 0) - (b.order || 0)).map((section, index) => (
          <div
            key={section._id}
            className="bg-white rounded-lg p-6 shadow-md border-2 border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
                  style={{ backgroundColor: section.color + '20' }}
                >
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </h3>
                  {section.subtitle && (
                    <p className="text-sm text-gray-600 mt-1">
                      {section.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {section.type === 'category' ? 'Danh mục' : 'Danh sách công thức'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {section.recipes?.length || 0} công thức
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMoveSection(section._id, 'up')}
                  disabled={index === 0}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Di chuyển lên"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleMoveSection(section._id, 'down')}
                  disabled={index === sections.length - 1}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Di chuyển xuống"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleAddRecipes(section)}
                  className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                >
                  Quản lý công thức
                </button>
                <button
                  onClick={() => handleEdit(section)}
                  className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(section._id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Xóa
                </button>
              </div>
            </div>

            {/* Hiển thị sub-categories */}
            {section.subCategories && section.subCategories.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#404040]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-[#E5E5E5]">
                    Mục con ({section.subCategories.length}):
                  </p>
                  <button
                    onClick={() => {
                    setSelectedSection(section);
                    setEditingSubCategory(null);
                    setSubCategoryFormData({
                      title: '',
                      icon: '🍽️',
                      color: '#FF8C42',
                      style: {
                        borderStyle: 'solid',
                        borderWidth: 2,
                        borderColor: '#FF8C42',
                        borderRadius: 16,
                        shadow: { enabled: true, color: '#000000', opacity: 0.1, blur: 8 },
                        backgroundGradient: { enabled: false, startColor: '#FF8C42', endColor: '#FFA94D' },
                        backgroundLayer: { enabled: true, color: '#FFE66D', offset: 8, borderRadius: 20 },
                      },
                    });
                    setShowSubCategoryModal(true);
                    }}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    Thêm mục con
                  </button>
                </div>
                <div className="space-y-2">
                  {section.subCategories.sort((a, b) => (a.order || 0) - (b.order || 0)).map((subCat, subIndex) => (
                    <div
                      key={subCat._id || subIndex}
                      className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: subCat.color + '20' }}
                          >
                            {subCat.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {subCat.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {subCat.recipes?.length || 0} công thức
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddRecipes(section, subCat)}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                            title="Thêm công thức"
                          >
                            Quản lý công thức
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSection(section);
                            setEditingSubCategory(subCat);
                            setSubCategoryFormData({
                              title: subCat.title || '',
                              icon: subCat.icon || '🍽️',
                              color: subCat.color || '#FF8C42',
                              style: subCat.style || {
                                borderStyle: 'solid',
                                borderWidth: 2,
                                borderColor: subCat.color || '#FF8C42',
                                borderRadius: 16,
                                shadow: { enabled: true, color: '#000000', opacity: 0.1, blur: 8 },
                                backgroundGradient: { enabled: false, startColor: subCat.color || '#FF8C42', endColor: '#FFA94D' },
                                backgroundLayer: { enabled: true, color: '#FFE66D', offset: 8, borderRadius: 20 },
                              },
                            });
                            setShowSubCategoryModal(true);
                            }}
                            className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                            title="Sửa mục con"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc muốn xóa mục con này?')) {
                                const updatedSections = sections.map(s =>
                                  s._id === section._id
                                    ? {
                                        ...s,
                                        subCategories: s.subCategories?.filter(sc => sc._id !== subCat._id) || [],
                                      }
                                    : s
                                );
                                saveSections(updatedSections);
                              }
                            }}
                            className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                            title="Xóa mục con"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {/* Hiển thị recipes trong sub-category */}
                      {subCat.recipes && subCat.recipes.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex flex-wrap gap-1">
                            {subCat.recipes.slice(0, 3).map((recipe) => (
                              <span
                                key={recipe._id}
                                className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border border-gray-200"
                              >
                                {recipe.title || 'N/A'}
                              </span>
                            ))}
                            {subCat.recipes.length > 3 && (
                              <span className="px-2 py-0.5 bg-white rounded text-xs text-gray-400 border border-gray-200">
                                +{subCat.recipes.length - 3} công thức khác
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nút thêm mục con nếu chưa có */}
            {(!section.subCategories || section.subCategories.length === 0) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#404040]">
                <button
                  onClick={() => {
                    setSelectedSection(section);
                    setEditingSubCategory(null);
                    setSubCategoryFormData({
                      title: '',
                      icon: '🍽️',
                      color: '#FF8C42',
                      style: {
                        borderStyle: 'solid',
                        borderWidth: 2,
                        borderColor: '#FF8C42',
                        borderRadius: 16,
                        shadow: { enabled: true, color: '#000000', opacity: 0.1, blur: 8 },
                        backgroundGradient: { enabled: false, startColor: '#FF8C42', endColor: '#FFA94D' },
                        backgroundLayer: { enabled: true, color: '#FFE66D', offset: 8, borderRadius: 20 },
                      },
                    });
                    setShowSubCategoryModal(true);
                  }}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-900 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Thêm mục con vào section này
                </button>
              </div>
            )}

            {/* Hiển thị danh sách công thức trong section (nếu không có sub-categories) */}
            {(!section.subCategories || section.subCategories.length === 0) && section.recipes && section.recipes.length > 0 && (
              <div className="mt-4 pt-4 border-t-2 border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Công thức trong section này:
                </p>
                <div className="flex flex-wrap gap-2">
                  {section.recipes.slice(0, 5).map((recipe) => (
                    <span
                      key={recipe._id}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-900 border border-gray-200"
                    >
                      {recipe.title || 'N/A'}
                    </span>
                  ))}
                  {section.recipes.length > 5 && (
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-500 border border-gray-200">
                      +{section.recipes.length - 5} công thức khác
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Add/Edit Section */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSection ? 'Chỉnh sửa section' : 'Thêm section mới'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSection(null);
                  setFormData({ title: '', subtitle: '', icon: '🍽️', color: '#FF8C42', type: 'category' });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tên section <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 placeholder-gray-400 transition-colors"
                  required
                  placeholder="Ví dụ: Món ăn tết"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 placeholder-gray-400 transition-colors"
                  placeholder="Mô tả ngắn về section"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Icon (emoji)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 placeholder-gray-400 transition-colors"
                  placeholder="🍽️"
                  maxLength={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Màu sắc
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Loại section
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 transition-colors"
                >
                  <option value="category">Danh mục (Category)</option>
                  <option value="recipe-list">Danh sách công thức (Recipe List)</option>
                </select>
              </div>
              
              <div className="flex items-center gap-4 pt-6 mt-6 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSection(null);
                    setFormData({ title: '', subtitle: '', icon: '🍽️', color: '#FF8C42', type: 'category' });
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-md"
                >
                  <Save className="w-4 h-4" />
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Sub-Category */}
      {showSubCategoryModal && selectedSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSubCategory ? 'Chỉnh sửa mục con' : 'Thêm mục con mới'}
              </h2>
              <button
                onClick={() => {
                  setShowSubCategoryModal(false);
                  setEditingSubCategory(null);
                  setSelectedSection(null);
                  setSubCategoryFormData({
                    title: '',
                    icon: '🍽️',
                    color: '#FF8C42',
                    style: {
                      borderStyle: 'solid',
                      borderWidth: 2,
                      borderColor: '#FF8C42',
                      borderRadius: 16,
                      shadow: { enabled: true, color: '#000000', opacity: 0.1, blur: 8 },
                      backgroundGradient: { enabled: false, startColor: '#FF8C42', endColor: '#FFA94D' },
                      backgroundLayer: { enabled: true, color: '#FFE66D', offset: 8, borderRadius: 20 },
                    },
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const updatedSections = sections.map(section => {
                    if (section._id === selectedSection._id) {
                      if (editingSubCategory) {
                        // Cập nhật sub-category
                        const updatedSubCategories = section.subCategories?.map(subCat =>
                          subCat._id === editingSubCategory._id
                            ? { ...subCat, ...subCategoryFormData }
                            : subCat
                        ) || [];
                        return { ...section, subCategories: updatedSubCategories };
                      } else {
                        // Thêm sub-category mới
                        const newSubCategory = {
                          _id: Date.now().toString(),
                          ...subCategoryFormData,
                          recipes: [],
                          order: (section.subCategories?.length || 0),
                        };
                        return {
                          ...section,
                          subCategories: [...(section.subCategories || []), newSubCategory],
                        };
                      }
                    }
                    return section;
                  });
                  await saveSections(updatedSections);
                  // Chỉ đóng modal khi lưu thành công
                  setShowSubCategoryModal(false);
                  setEditingSubCategory(null);
                  setSelectedSection(null);
                  setSubCategoryFormData({
                    title: '',
                    icon: '🍽️',
                    color: '#FF8C42',
                    style: {
                      borderStyle: 'solid',
                      borderWidth: 2,
                      borderColor: '#FF8C42',
                      borderRadius: 16,
                      shadow: { enabled: true, color: '#000000', opacity: 0.1, blur: 8 },
                      backgroundGradient: { enabled: false, startColor: '#FF8C42', endColor: '#FFA94D' },
                      backgroundLayer: { enabled: true, color: '#FFE66D', offset: 8, borderRadius: 20 },
                    },
                  });
                } catch (error) {
                  console.error('Error saving sub-category:', error);
                  // Không đóng modal nếu có lỗi
                }
              }}
              className="flex-1 overflow-y-auto pr-2 space-y-6"
            >
              {/* Thông tin cơ bản */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Tên mục con <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subCategoryFormData.title}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 placeholder-gray-400 transition-colors"
                      required
                      placeholder="Ví dụ: Món xẽ"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Icon (emoji)
                    </label>
                    <input
                      type="text"
                      value={subCategoryFormData.icon}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, icon: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 placeholder-gray-400 transition-colors"
                      placeholder="🌙"
                      maxLength={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Màu sắc chủ đạo
                    </label>
                    <input
                      type="color"
                      value={subCategoryFormData.color}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setSubCategoryFormData({
                          ...subCategoryFormData,
                          color: newColor,
                          style: {
                            ...subCategoryFormData.style,
                            borderColor: subCategoryFormData.style.borderColor === subCategoryFormData.color ? newColor : subCategoryFormData.style.borderColor,
                          },
                        });
                      }}
                      className="w-full h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Tùy chỉnh khung */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Tùy chỉnh khung</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Kiểu viền
                    </label>
                    <select
                      value={subCategoryFormData.style.borderStyle}
                      onChange={(e) => setSubCategoryFormData({
                        ...subCategoryFormData,
                        style: { ...subCategoryFormData.style, borderStyle: e.target.value },
                      })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 transition-colors"
                    >
                      <option value="solid">Solid (Nét liền)</option>
                      <option value="dashed">Dashed (Nét đứt)</option>
                      <option value="dotted">Dotted (Chấm chấm)</option>
                      <option value="none">None (Không viền)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Độ dày viền
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={subCategoryFormData.style.borderWidth}
                        onChange={(e) => setSubCategoryFormData({
                          ...subCategoryFormData,
                          style: { ...subCategoryFormData.style, borderWidth: parseInt(e.target.value) || 0 },
                        })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Bo góc
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={subCategoryFormData.style.borderRadius}
                        onChange={(e) => setSubCategoryFormData({
                          ...subCategoryFormData,
                          style: { ...subCategoryFormData.style, borderRadius: parseInt(e.target.value) || 0 },
                        })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Màu viền
                    </label>
                    <input
                      type="color"
                      value={subCategoryFormData.style.borderColor}
                      onChange={(e) => setSubCategoryFormData({
                        ...subCategoryFormData,
                        style: { ...subCategoryFormData.style, borderColor: e.target.value },
                      })}
                      className="w-full h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Hiệu ứng đổ bóng */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">✨ Hiệu ứng đổ bóng</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-900">
                      Bật đổ bóng
                    </label>
                    <input
                      type="checkbox"
                      checked={subCategoryFormData.style.shadow.enabled}
                      onChange={(e) => setSubCategoryFormData({
                        ...subCategoryFormData,
                        style: {
                          ...subCategoryFormData.style,
                          shadow: { ...subCategoryFormData.style.shadow, enabled: e.target.checked },
                        },
                      })}
                      className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary cursor-pointer"
                    />
                  </div>

                  {subCategoryFormData.style.shadow.enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Màu bóng
                        </label>
                        <input
                          type="color"
                          value={subCategoryFormData.style.shadow.color}
                          onChange={(e) => setSubCategoryFormData({
                            ...subCategoryFormData,
                            style: {
                              ...subCategoryFormData.style,
                              shadow: { ...subCategoryFormData.style.shadow, color: e.target.value },
                            },
                          })}
                          className="w-full h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Độ mờ (0-1)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={subCategoryFormData.style.shadow.opacity}
                            onChange={(e) => setSubCategoryFormData({
                              ...subCategoryFormData,
                              style: {
                                ...subCategoryFormData.style,
                                shadow: { ...subCategoryFormData.style.shadow, opacity: parseFloat(e.target.value) || 0 },
                              },
                            })}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Độ mờ (blur)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={subCategoryFormData.style.shadow.blur}
                            onChange={(e) => setSubCategoryFormData({
                              ...subCategoryFormData,
                              style: {
                                ...subCategoryFormData.style,
                                shadow: { ...subCategoryFormData.style.shadow, blur: parseInt(e.target.value) || 0 },
                              },
                            })}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Gradient nền */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🌈 Gradient nền</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-900">
                      Bật gradient
                    </label>
                    <input
                      type="checkbox"
                      checked={subCategoryFormData.style.backgroundGradient.enabled}
                      onChange={(e) => setSubCategoryFormData({
                        ...subCategoryFormData,
                        style: {
                          ...subCategoryFormData.style,
                          backgroundGradient: {
                            ...subCategoryFormData.style.backgroundGradient,
                            enabled: e.target.checked,
                          },
                        },
                      })}
                      className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary cursor-pointer"
                    />
                  </div>

                  {subCategoryFormData.style.backgroundGradient.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Màu bắt đầu
                        </label>
                        <input
                          type="color"
                          value={subCategoryFormData.style.backgroundGradient.startColor}
                          onChange={(e) => setSubCategoryFormData({
                            ...subCategoryFormData,
                            style: {
                              ...subCategoryFormData.style,
                              backgroundGradient: {
                                ...subCategoryFormData.style.backgroundGradient,
                                startColor: e.target.value,
                              },
                            },
                          })}
                          className="w-full h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Màu kết thúc
                        </label>
                        <input
                          type="color"
                          value={subCategoryFormData.style.backgroundGradient.endColor}
                          onChange={(e) => setSubCategoryFormData({
                            ...subCategoryFormData,
                            style: {
                              ...subCategoryFormData.style,
                              backgroundGradient: {
                                ...subCategoryFormData.style.backgroundGradient,
                                endColor: e.target.value,
                              },
                            },
                          })}
                          className="w-full h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Background Layer (Lớp nền phía sau - hiệu ứng layered) */}
              <div className="pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Lớp nền phía sau (Layered Effect)</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-900">
                      Bật lớp nền phía sau
                    </label>
                    <input
                      type="checkbox"
                      checked={subCategoryFormData.style.backgroundLayer.enabled}
                      onChange={(e) => setSubCategoryFormData({
                        ...subCategoryFormData,
                        style: {
                          ...subCategoryFormData.style,
                          backgroundLayer: {
                            ...subCategoryFormData.style.backgroundLayer,
                            enabled: e.target.checked,
                          },
                        },
                      })}
                      className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary cursor-pointer"
                    />
                  </div>

                  {subCategoryFormData.style.backgroundLayer.enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Màu lớp nền
                        </label>
                        <input
                          type="color"
                          value={subCategoryFormData.style.backgroundLayer.color}
                          onChange={(e) => setSubCategoryFormData({
                            ...subCategoryFormData,
                            style: {
                              ...subCategoryFormData.style,
                              backgroundLayer: {
                                ...subCategoryFormData.style.backgroundLayer,
                                color: e.target.value,
                              },
                            },
                          })}
                          className="w-full h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Khoảng cách (offset)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={subCategoryFormData.style.backgroundLayer.offset}
                            onChange={(e) => setSubCategoryFormData({
                              ...subCategoryFormData,
                              style: {
                                ...subCategoryFormData.style,
                                backgroundLayer: {
                                  ...subCategoryFormData.style.backgroundLayer,
                                  offset: parseInt(e.target.value) || 0,
                                },
                              },
                            })}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Bo góc layer
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={subCategoryFormData.style.backgroundLayer.borderRadius}
                            onChange={(e) => setSubCategoryFormData({
                              ...subCategoryFormData,
                              style: {
                                ...subCategoryFormData.style,
                                backgroundLayer: {
                                  ...subCategoryFormData.style.backgroundLayer,
                                  borderRadius: parseInt(e.target.value) || 0,
                                },
                              },
                            })}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-4">Xem trước:</p>
                <div className="relative" style={{ padding: subCategoryFormData.style.backgroundLayer.enabled ? `${subCategoryFormData.style.backgroundLayer.offset}px` : '0' }}>
                  {/* Background Layer */}
                  {subCategoryFormData.style.backgroundLayer.enabled && (
                    <div
                      className="absolute"
                      style={{
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: subCategoryFormData.style.backgroundLayer.color,
                        borderRadius: `${subCategoryFormData.style.backgroundLayer.borderRadius}px`,
                        zIndex: 0,
                      }}
                    />
                  )}
                  {/* Card */}
                  <div
                    className="relative p-4 rounded-lg"
                    style={{
                      borderStyle: subCategoryFormData.style.borderStyle,
                      borderWidth: `${subCategoryFormData.style.borderWidth}px`,
                      borderColor: subCategoryFormData.style.borderColor,
                      borderRadius: `${subCategoryFormData.style.borderRadius}px`,
                      boxShadow: subCategoryFormData.style.shadow.enabled
                        ? `0 4px ${subCategoryFormData.style.shadow.blur}px rgba(${hexToRgb(subCategoryFormData.style.shadow.color)}, ${subCategoryFormData.style.shadow.opacity})`
                        : 'none',
                      background: subCategoryFormData.style.backgroundGradient.enabled
                        ? `linear-gradient(135deg, ${subCategoryFormData.style.backgroundGradient.startColor}, ${subCategoryFormData.style.backgroundGradient.endColor})`
                        : `${subCategoryFormData.color}20`,
                      zIndex: 1,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: subCategoryFormData.color }}
                      >
                        {subCategoryFormData.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{subCategoryFormData.title || 'Tên mục con'}</p>
                        <p className="text-xs text-gray-500">Xem trước khung</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
            
            {/* Footer buttons */}
            <div className="flex items-center gap-4 pt-6 mt-6 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowSubCategoryModal(false);
                  setEditingSubCategory(null);
                  setSelectedSection(null);
                  setSubCategoryFormData({
                    title: '',
                    icon: '🍽️',
                    color: '#FF8C42',
                    style: {
                      borderStyle: 'solid',
                      borderWidth: 2,
                      borderColor: '#FF8C42',
                      borderRadius: 16,
                      shadow: { enabled: true, color: '#000000', opacity: 0.1, blur: 8 },
                      backgroundGradient: { enabled: false, startColor: '#FF8C42', endColor: '#FFA94D' },
                      backgroundLayer: { enabled: true, color: '#FFE66D', offset: 8, borderRadius: 20 },
                    },
                  });
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-md"
              >
                <Save className="w-4 h-4" />
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quản lý công thức trong section hoặc sub-category */}
      {showRecipesModal && selectedSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Quản lý công thức: {selectedSubCategory ? selectedSubCategory.title : selectedSection.title}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedSubCategory ? `Mục con trong "${selectedSection.title}"` : `Section: ${selectedSection.title}`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Đã chọn: {sectionRecipes.length} công thức
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRecipesModal(false);
                  setSelectedSection(null);
                  setSelectedSubCategory(null);
                  setSectionRecipes([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm công thức..."
                  className="w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 placeholder-gray-400 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Available Recipes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Công thức có sẵn</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredRecipes.map((recipe) => {
                      const isAdded = sectionRecipes.find(r => r._id === recipe._id);
                      return (
                        <div
                          key={recipe._id}
                          className={`p-4 border-2 rounded-lg ${
                            isAdded
                              ? 'bg-green-50 border-green-300'
                              : 'bg-white border-gray-300 hover:border-gray-400'
                          } transition-colors`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{recipe.title || 'N/A'}</p>
                              <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                                {recipe.description || 'Không có mô tả'}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                if (isAdded) {
                                  handleRemoveRecipeFromSection(recipe._id);
                                } else {
                                  handleAddRecipeToSection(recipe);
                                }
                              }}
                              className={`ml-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isAdded
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {isAdded ? 'Xóa' : 'Thêm'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Recipes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Công thức đã chọn</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {sectionRecipes.length === 0 ? (
                      <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                        Chưa có công thức nào
                      </p>
                    ) : (
                      sectionRecipes.map((recipe) => (
                        <div
                          key={recipe._id}
                          className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{recipe.title || 'N/A'}</p>
                              <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                                {recipe.description || 'Không có mô tả'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveRecipeFromSection(recipe._id)}
                              className="ml-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-6 mt-6 border-t-2 border-gray-200">
              <button
                onClick={() => {
                  setShowRecipesModal(false);
                  setSelectedSection(null);
                  setSelectedSubCategory(null);
                  setSectionRecipes([]);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveRecipesToSection}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-md"
              >
                <Save className="w-4 h-4" />
                Lưu công thức
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

