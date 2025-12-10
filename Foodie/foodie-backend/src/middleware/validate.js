import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware để xử lý validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log validation errors để debug
    console.error('❌ Validation errors:', errors.array());
    console.error('❌ Request body:', req.body);
    
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

/**
 * Validation rules cho đăng ký
 */
export const validateRegister = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Mật khẩu là bắt buộc')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .optional()
    .withMessage('Mật khẩu nên có chữ hoa, chữ thường và số (khuyến nghị)'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên là bắt buộc')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên phải có từ 2 đến 50 ký tự'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại không hợp lệ (10-11 chữ số)'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio không được quá 500 ký tự'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Giới tính không hợp lệ'),
  
  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày sinh không hợp lệ (định dạng ISO 8601)')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        throw new Error('Tuổi phải từ 13 đến 120');
      }
      return true;
    }),
  
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Avatar URL không hợp lệ'),
  
  handleValidationErrors,
];

/**
 * Validation rules cho đăng nhập
 */
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .custom((value, { req }) => {
      const emailLower = value.toLowerCase();
      // Cho phép email admin đặc biệt: admin@123
      if (emailLower === 'admin@123') {
        req.body.email = 'admin@123'; // Giữ nguyên format
        return true;
      }
      // Kiểm tra format email chuẩn cho các email khác
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error('Email không hợp lệ');
      }
      // Normalize và lowercase cho email thường
      req.body.email = emailLower;
      return true;
    }),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Mật khẩu là bắt buộc'),
  
  handleValidationErrors,
];

/**
 * Validation rules cho cập nhật profile
 */
export const validateUpdateProfile = [
  body('name')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null) return true;
      const trimmed = String(value).trim();
      if (trimmed.length === 0) return true; // Cho phép empty string
      if (trimmed.length < 2 || trimmed.length > 50) {
        throw new Error('Tên phải có từ 2 đến 50 ký tự');
      }
      return true;
    }),
  
  body('phone')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const trimmed = String(value).trim();
      if (trimmed.length === 0) return true; // Cho phép empty string
      // Cho phép 8-11 chữ số (hỗ trợ cả số điện thoại ngắn và dài)
      if (!/^[0-9]{8,11}$/.test(trimmed)) {
        throw new Error('Số điện thoại không hợp lệ (8-11 chữ số)');
      }
      return true;
    }),
  
  body('bio')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null) return true;
      const trimmed = String(value).trim();
      if (trimmed.length > 500) {
        throw new Error('Bio không được quá 500 ký tự');
      }
      return true;
    }),
  
  body('gender')
    .optional()
    .custom((value, { req }) => {
      if (value === undefined || value === null || value === '') return true;
      const trimmed = String(value).trim();
      if (trimmed.length === 0) return true; // Cho phép empty string
      
      // Map từ tiếng Việt sang tiếng Anh
      const genderMap = {
        'Nam': 'male',
        'Nữ': 'female',
        'Khác': 'other',
        'male': 'male',
        'female': 'female',
        'other': 'other',
      };
      
      const mappedGender = genderMap[trimmed];
      if (!mappedGender) {
        throw new Error('Giới tính không hợp lệ (phải là: Nam, Nữ, Khác, male, female, hoặc other)');
      }
      
      // Lưu giá trị đã map vào req.body
      req.body.gender = mappedGender;
      return true;
    }),
  
  body('birthDate')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      // Kiểm tra ISO8601 format
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      if (!iso8601Regex.test(value) && !(value instanceof Date)) {
        // Thử parse nếu không phải ISO8601
        const parsed = new Date(value);
        if (isNaN(parsed.getTime())) {
          throw new Error('Ngày sinh không hợp lệ (định dạng ISO 8601)');
        }
      }
      return true;
    }),
  
  body('socialLinks')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null) return true;
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Social links phải là object');
      }
      return true;
    }),
  
  body('avatarUrl')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      // Cho phép URL hoặc empty string
      return true;
    }),
  
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate phải là boolean'),
  
  handleValidationErrors,
];

/**
 * Validation rules cho đổi mật khẩu
 */
export const validateChangePassword = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Mật khẩu hiện tại là bắt buộc'),
  
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('Mật khẩu mới là bắt buộc')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
  
  handleValidationErrors,
];

/**
 * Validation rules cho tạo recipe
 */
export const validateCreateRecipe = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Tiêu đề công thức là bắt buộc')
    .isLength({ min: 3, max: 200 })
    .withMessage('Tiêu đề phải có từ 3 đến 200 ký tự'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Mô tả không được quá 2000 ký tự'),
  
  body('ingredients')
    .notEmpty()
    .withMessage('Nguyên liệu là bắt buộc')
    .custom((value, { req }) => {
      // Có thể là string (JSON) hoặc array
      let ingredients;
      if (typeof value === 'string') {
        try {
          ingredients = JSON.parse(value);
        } catch (e) {
          // Nếu không parse được JSON, thử parse như array string
          ingredients = [value];
        }
      } else if (Array.isArray(value)) {
        ingredients = value;
      } else {
        ingredients = [value];
      }
      
      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        throw new Error('Nguyên liệu phải là mảng và có ít nhất 1 phần tử');
      }
      
      if (ingredients.length > 100) {
        throw new Error('Không được quá 100 nguyên liệu');
      }
      
      // Lưu parsed ingredients vào req.body để controller sử dụng
      req.body.ingredients = ingredients;
      return true;
    }),
  
  body('steps')
    .notEmpty()
    .withMessage('Các bước thực hiện là bắt buộc')
    .custom((value, { req }) => {
      // Có thể là string (JSON) hoặc array
      let steps;
      if (typeof value === 'string') {
        try {
          steps = JSON.parse(value);
        } catch (e) {
          // Nếu không parse được JSON, thử parse như array string
          steps = [value];
        }
      } else if (Array.isArray(value)) {
        steps = value;
      } else {
        steps = [value];
      }
      
      if (!Array.isArray(steps) || steps.length === 0) {
        throw new Error('Các bước thực hiện phải là mảng và có ít nhất 1 phần tử');
      }
      
      if (steps.length > 50) {
        throw new Error('Không được quá 50 bước thực hiện');
      }
      
      // Lưu parsed steps vào req.body để controller sử dụng
      req.body.steps = steps;
      return true;
    }),
  
  body('servings')
    .optional()
    .custom((value) => {
      // Hỗ trợ cả string và number
      const servingsNum = typeof value === 'string' ? parseInt(value) : value;
      if (isNaN(servingsNum) || servingsNum < 1 || servingsNum > 100) {
        throw new Error('Số phần ăn phải là số nguyên từ 1 đến 100');
      }
      return true;
    }),
  
  body('cookingTime')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Thời gian nấu phải là số nguyên từ 1 đến 1440 phút'),
  
  body('cookTime')
    .optional()
    .custom((value) => {
      // Hỗ trợ cả string và number
      const cookTimeNum = typeof value === 'string' ? parseInt(value) : value;
      if (cookTimeNum && (isNaN(cookTimeNum) || cookTimeNum < 1 || cookTimeNum > 1440)) {
        throw new Error('Thời gian nấu phải là số nguyên từ 1 đến 1440 phút');
      }
      return true;
    }),
  
  body('cookTimeMinutes')
    .optional()
    .custom((value) => {
      // Hỗ trợ cả string và number
      const cookTimeNum = typeof value === 'string' ? parseInt(value) : value;
      if (cookTimeNum && (isNaN(cookTimeNum) || cookTimeNum < 1 || cookTimeNum > 1440)) {
        throw new Error('Thời gian nấu phải là số nguyên từ 1 đến 1440 phút');
      }
      return true;
    }),
  
  body('difficulty')
    .optional()
    .custom((value) => {
      // Hỗ trợ cả tiếng Việt và tiếng Anh
      const validDifficulties = ['easy', 'medium', 'hard', 'Dễ', 'Trung bình', 'Khó'];
      if (!validDifficulties.includes(value)) {
        throw new Error('Độ khó phải là: easy/medium/hard hoặc Dễ/Trung bình/Khó');
      }
      return true;
    }),
  
  body('category')
    .optional()
    .trim(),
  
  body('categoryName')
    .optional()
    .trim(),
  
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = [value];
        }
      }
      
      if (value && !Array.isArray(value)) {
        throw new Error('Tags phải là mảng');
      }
      
      if (value && value.length > 20) {
        throw new Error('Không được quá 20 tags');
      }
      
      return true;
    }),
  
  handleValidationErrors,
];

/**
 * Validation rules cho cập nhật recipe
 */
export const validateUpdateRecipe = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Tiêu đề phải có từ 3 đến 200 ký tự'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Mô tả không được quá 2000 ký tự'),
  
  body('ingredients')
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      let ingredients;
      if (typeof value === 'string') {
        try {
          ingredients = JSON.parse(value);
        } catch (e) {
          ingredients = [value];
        }
      } else {
        ingredients = value;
      }
      
      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        throw new Error('Nguyên liệu phải là mảng và có ít nhất 1 phần tử');
      }
      
      if (ingredients.length > 100) {
        throw new Error('Không được quá 100 nguyên liệu');
      }
      
      return true;
    }),
  
  body('steps')
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      let steps;
      if (typeof value === 'string') {
        try {
          steps = JSON.parse(value);
        } catch (e) {
          steps = [value];
        }
      } else {
        steps = value;
      }
      
      if (!Array.isArray(steps) || steps.length === 0) {
        throw new Error('Các bước thực hiện phải là mảng và có ít nhất 1 phần tử');
      }
      
      if (steps.length > 50) {
        throw new Error('Không được quá 50 bước thực hiện');
      }
      
      return true;
    }),
  
  body('servings')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Số phần ăn phải là số nguyên từ 1 đến 100'),
  
  body('cookingTime')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Thời gian nấu phải là số nguyên từ 1 đến 1440 phút'),
  
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Độ khó phải là: easy, medium, hoặc hard'),
  
  handleValidationErrors,
];

/**
 * Validation rules cho AI chat
 * Message là optional nếu có image, nhưng nếu có message thì phải từ 1-500 ký tự
 */
export const validateAIChat = [
  body('message')
    .optional({ values: 'falsy' }) // Cho phép empty string, null, undefined
    .custom((value, { req }) => {
      // Nếu có file (image), message có thể rỗng
      if (req.file) {
        return true; // Có image thì message optional
      }
      // Nếu không có file, message phải có và không rỗng
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Câu hỏi là bắt buộc khi không có hình ảnh');
      }
      return true;
    })
    .custom((value) => {
      // Nếu có message, kiểm tra độ dài
      if (value && typeof value === 'string' && value.trim().length > 0) {
        if (value.trim().length > 500) {
          throw new Error('Câu hỏi không được quá 500 ký tự');
        }
      }
      return true;
    }),
  
  handleValidationErrors,
];

/**
 * Validation rules cho MongoDB ObjectId params
 */
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} không hợp lệ (phải là MongoDB ObjectId)`),
  
  handleValidationErrors,
];

/**
 * Validation rules cho pagination query params
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit phải là số nguyên từ 1 đến 100'),
  
  handleValidationErrors,
];

