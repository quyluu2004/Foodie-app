import Category from "../models/Category.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lấy tất cả categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({
      message: "Lấy danh sách categories thành công",
      categories: categories,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách categories:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách categories", error: error.message });
  }
};

// Lấy category theo ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }
    res.status(200).json({
      message: "Lấy category thành công",
      category: category,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy category:", error);
    res.status(500).json({ message: "Lỗi lấy category", error: error.message });
  }
};

// Tạo category mới
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên category là bắt buộc" });
    }

    // Kiểm tra category đã tồn tại chưa
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: "Category đã tồn tại" });
    }

    const categoryData = {
      name: name.trim(),
      description: description?.trim() || "",
    };

    // Xử lý ảnh nếu có
    if (req.file) {
      if (req.file.path.startsWith('http')) {
        categoryData.imageUrl = req.file.path;
      } else {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const filename = req.file.filename || req.file.path.split(/[/\\]/).pop();
        categoryData.imageUrl = `${baseUrl}/uploads/${filename}`;
      }
    }

    const newCategory = await Category.create(categoryData);
    res.status(201).json({
      message: "Tạo category thành công",
      category: newCategory,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo category:", error);
    res.status(500).json({ message: "Lỗi tạo category", error: error.message });
  }
};

// Cập nhật category
export const updateCategory = async (req, res) => {
  try {
    const { name, description, deleteImage } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }

    if (name && name.trim()) {
      // Kiểm tra tên mới có trùng không
      const existingCategory = await Category.findOne({ 
        name: name.trim(),
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({ message: "Tên category đã tồn tại" });
      }
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description?.trim() || "";
    }

    // Xử lý xóa ảnh nếu có yêu cầu
    if (deleteImage === 'true' || deleteImage === true) {
      console.log('🗑️ Xóa ảnh category:', category.imageUrl);
      // Xóa file ảnh cũ nếu có
      if (category.imageUrl) {
        try {
          // Lấy đường dẫn file từ URL
          let imagePath = null;
          if (category.imageUrl.includes('uploads/')) {
            // Extract filename from URL
            const filename = category.imageUrl.split('uploads/').pop();
            imagePath = path.join(process.cwd(), 'uploads', filename);
          } else if (category.imageUrl.includes('/uploads/')) {
            const filename = category.imageUrl.split('/uploads/').pop();
            imagePath = path.join(process.cwd(), 'uploads', filename);
          }
          
          if (imagePath && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('✅ Đã xóa file ảnh cũ:', imagePath);
          } else {
            console.log('⚠️ Không tìm thấy file ảnh tại:', imagePath);
          }
        } catch (fileError) {
          console.warn('⚠️ Không thể xóa file ảnh cũ:', fileError.message);
          // Không throw error, chỉ log warning
        }
      }
      category.imageUrl = null;
    }
    // Xử lý upload ảnh mới nếu có (ưu tiên hơn xóa)
    else if (req.file) {
      // Xóa file ảnh cũ trước khi lưu ảnh mới
      if (category.imageUrl) {
        try {
          let imagePath = null;
          if (category.imageUrl.includes('uploads/')) {
            const filename = category.imageUrl.split('uploads/').pop();
            imagePath = path.join(process.cwd(), 'uploads', filename);
          } else if (category.imageUrl.includes('/uploads/')) {
            const filename = category.imageUrl.split('/uploads/').pop();
            imagePath = path.join(process.cwd(), 'uploads', filename);
          }
          
          if (imagePath && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('✅ Đã xóa file ảnh cũ trước khi upload ảnh mới:', imagePath);
          }
        } catch (fileError) {
          console.warn('⚠️ Không thể xóa file ảnh cũ:', fileError.message);
        }
      }

      if (req.file.path.startsWith('http')) {
        category.imageUrl = req.file.path;
      } else {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const filename = req.file.filename || req.file.path.split(/[/\\]/).pop();
        category.imageUrl = `${baseUrl}/uploads/${filename}`;
      }
    }

    await category.save();
    res.status(200).json({
      message: "Cập nhật category thành công",
      category: category,
    });
  } catch (error) {
    console.error("❌ Lỗi cập nhật category:", error);
    res.status(500).json({ message: "Lỗi cập nhật category", error: error.message });
  }
};

// Xóa category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }
    res.status(200).json({ message: "Xóa category thành công" });
  } catch (error) {
    console.error("❌ Lỗi xóa category:", error);
    res.status(500).json({ message: "Lỗi xóa category", error: error.message });
  }
};

