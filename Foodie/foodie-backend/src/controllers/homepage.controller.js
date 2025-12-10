import HomepageSection from '../models/HomepageSection.js';
import Recipe from '../models/Recipe.js';

// Get all homepage sections
export const getHomepageSections = async (req, res) => {
  try {
    const sections = await HomepageSection.find()
      .populate('recipes', 'title description imageUrl videoThumbnail mediaType videoUrl averageRating ratingCount')
      .populate('subCategories.recipes', 'title description imageUrl videoThumbnail mediaType videoUrl averageRating ratingCount')
      .sort({ order: 1 });
    
    res.json({
      success: true,
      sections: sections,
    });
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sections',
      error: error.message,
    });
  }
};

// Create or update homepage sections (Admin only)
export const saveHomepageSections = async (req, res) => {
  try {
    const { sections } = req.body;
    
    if (!Array.isArray(sections)) {
      return res.status(400).json({
        success: false,
        message: 'Sections phải là một mảng',
      });
    }

    // Xóa tất cả sections cũ
    await HomepageSection.deleteMany({});

    // Tạo sections mới
    const savedSections = await Promise.all(
      sections.map(async (section) => {
        const newSection = new HomepageSection({
          title: section.title,
          subtitle: section.subtitle || '',
          icon: section.icon || '🍽️',
          color: section.color || '#FF8C42',
          type: section.type || 'category',
          recipes: section.recipes?.map(r => r._id || r) || [],
          subCategories: section.subCategories?.map(subCat => ({
            title: subCat.title,
            description: subCat.description || '',
            icon: subCat.icon || '🍽️',
            color: subCat.color || '#FF8C42',
            style: subCat.style || {
              borderStyle: 'solid',
              borderWidth: 2,
              borderColor: subCat.color || '#FF8C42',
              borderRadius: 16,
              shadow: {
                enabled: true,
                color: '#000000',
                opacity: 0.1,
                blur: 8,
              },
              backgroundGradient: {
                enabled: false,
                startColor: subCat.color || '#FF8C42',
                endColor: subCat.color || '#FFA94D',
              },
              backgroundLayer: {
                enabled: true,
                color: '#FFE66D',
                offset: 8,
                borderRadius: 20,
              },
            },
            recipes: subCat.recipes?.map(r => r._id || r) || [],
            order: subCat.order || 0,
          })) || [],
          order: section.order || 0,
        });
        return await newSection.save();
      })
    );

    // Populate recipes
    const populatedSections = await HomepageSection.find()
      .populate('recipes', 'title description imageUrl videoThumbnail mediaType videoUrl averageRating ratingCount')
      .populate('subCategories.recipes', 'title description imageUrl videoThumbnail mediaType videoUrl averageRating ratingCount')
      .sort({ order: 1 });

    res.json({
      success: true,
      message: 'Đã lưu cấu hình trang chủ thành công',
      sections: populatedSections,
    });
  } catch (error) {
    console.error('Error saving homepage sections:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu cấu hình trang chủ',
      error: error.message,
    });
  }
};

// Get single section
export const getHomepageSection = async (req, res) => {
  try {
    const section = await HomepageSection.findById(req.params.id)
      .populate('recipes', 'title description imageUrl videoThumbnail averageRating ratingCount difficulty cookTime servings')
      .populate('subCategories.recipes', 'title description imageUrl videoThumbnail averageRating ratingCount difficulty cookTime servings');
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy section',
      });
    }

    res.json({
      success: true,
      section: section,
    });
  } catch (error) {
    console.error('Error fetching homepage section:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy section',
      error: error.message,
    });
  }
};

