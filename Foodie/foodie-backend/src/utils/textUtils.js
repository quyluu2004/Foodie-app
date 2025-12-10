/**
 * Utility functions để normalize và tìm kiếm text tiếng Việt
 */

// Vietnamese diacritics mapping
const VIETNAMESE_MAP = {
  'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
  'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
  'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
  'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
  'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
  'đ': 'd',
  'À': 'a', 'Á': 'a', 'Ạ': 'a', 'Ả': 'a', 'Ã': 'a',
  'Â': 'a', 'Ầ': 'a', 'Ấ': 'a', 'Ậ': 'a', 'Ẩ': 'a', 'Ẫ': 'a',
  'Ă': 'a', 'Ằ': 'a', 'Ắ': 'a', 'Ặ': 'a', 'Ẳ': 'a', 'Ẵ': 'a',
  'È': 'e', 'É': 'e', 'Ẹ': 'e', 'Ẻ': 'e', 'Ẽ': 'e',
  'Ê': 'e', 'Ề': 'e', 'Ế': 'e', 'Ệ': 'e', 'Ể': 'e', 'Ễ': 'e',
  'Ì': 'i', 'Í': 'i', 'Ị': 'i', 'Ỉ': 'i', 'Ĩ': 'i',
  'Ò': 'o', 'Ó': 'o', 'Ọ': 'o', 'Ỏ': 'o', 'Õ': 'o',
  'Ô': 'o', 'Ồ': 'o', 'Ố': 'o', 'Ộ': 'o', 'Ổ': 'o', 'Ỗ': 'o',
  'Ơ': 'o', 'Ờ': 'o', 'Ớ': 'o', 'Ợ': 'o', 'Ở': 'o', 'Ỡ': 'o',
  'Ù': 'u', 'Ú': 'u', 'Ụ': 'u', 'Ủ': 'u', 'Ũ': 'u',
  'Ư': 'u', 'Ừ': 'u', 'Ứ': 'u', 'Ự': 'u', 'Ử': 'u', 'Ữ': 'u',
  'Ỳ': 'y', 'Ý': 'y', 'Ỵ': 'y', 'Ỷ': 'y', 'Ỹ': 'y',
  'Đ': 'd',
};

/**
 * Normalize Vietnamese text - remove diacritics và chuyển về lowercase
 * @param {string} text - Text cần normalize
 * @returns {string} - Text đã normalize
 */
export const normalizeVietnameseText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  // Chuyển về lowercase
  let normalized = text.toLowerCase().trim();
  
  // Replace Vietnamese characters
  normalized = normalized.replace(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, (char) => {
    return VIETNAMESE_MAP[char] || char;
  });
  
  // Remove remaining diacritics (fallback)
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
};

/**
 * Tạo regex pattern để tìm kiếm với hỗ trợ không dấu
 * Hỗ trợ tìm kiếm theo từng ký tự (ví dụ: "P" sẽ tìm tất cả công thức có chữ P)
 * @param {string} searchQuery - Query tìm kiếm
 * @returns {RegExp} - Regex pattern
 */
export const createVietnameseSearchRegex = (searchQuery) => {
  if (!searchQuery || typeof searchQuery !== 'string') return null;
  
  const normalizedQuery = normalizeVietnameseText(searchQuery);
  if (!normalizedQuery) return null;
  
  // Escape special regex characters nhưng giữ lại các ký tự cần thiết
  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Tạo pattern: mỗi ký tự trong query có thể match với ký tự có dấu hoặc không dấu
  // Ví dụ: "pho" sẽ match "phở", "pho", "Phở", etc.
  const pattern = escapedQuery
    .split('')
    .map(char => {
      // Tìm các ký tự Vietnamese có thể match với char này
      const possibleChars = [char];
      
      // Thêm các biến thể có dấu
      Object.keys(VIETNAMESE_MAP).forEach(vietChar => {
        if (VIETNAMESE_MAP[vietChar] === char) {
          possibleChars.push(vietChar, vietChar.toUpperCase());
        }
      });
      
      // Tạo character class cho regex
      if (possibleChars.length > 1) {
        return `[${possibleChars.join('')}]`;
      }
      return char;
    })
    .join('');
  
  // Case-insensitive regex
  return new RegExp(pattern, 'i');
};

/**
 * Tạo MongoDB query để tìm kiếm với hỗ trợ không dấu
 * Sử dụng aggregation pipeline để normalize và so sánh
 * @param {string} searchQuery - Query tìm kiếm
 * @param {string} field - Field cần tìm kiếm (default: 'title')
 * @returns {Object} - MongoDB query object
 */
export const createVietnameseSearchQuery = (searchQuery, field = 'title') => {
  if (!searchQuery || typeof searchQuery !== 'string') return {};
  
  const normalizedQuery = normalizeVietnameseText(searchQuery);
  if (!normalizedQuery) return {};
  
  // Sử dụng regex với pattern đã normalize
  // MongoDB sẽ tự động normalize khi so sánh với regex
  const regexPattern = normalizedQuery
    .split('')
    .map(char => {
      // Escape special characters
      const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Tạo pattern match cả có dấu và không dấu
      return `[${char}${getVietnameseVariants(char)}]`;
    })
    .join('');
  
  return {
    [field]: {
      $regex: regexPattern,
      $options: 'i'
    }
  };
};

/**
 * Lấy các biến thể Vietnamese của một ký tự
 * @param {string} char - Ký tự cần tìm biến thể
 * @returns {string[]} - Mảng các biến thể có thể có
 */
export const getVietnameseCharVariants = (char) => {
  const variants = new Set([char.toLowerCase(), char.toUpperCase()]);
  
  // Tìm tất cả ký tự Vietnamese có thể normalize về char này
  Object.keys(VIETNAMESE_MAP).forEach(vietChar => {
    if (VIETNAMESE_MAP[vietChar] === char.toLowerCase()) {
      variants.add(vietChar);
      variants.add(vietChar.toUpperCase());
    }
  });
  
  return Array.from(variants);
};

/**
 * Lấy các biến thể Vietnamese của một ký tự (private, dùng cho internal)
 * @param {string} char - Ký tự cần tìm biến thể
 * @returns {string} - Các biến thể có thể có (string)
 */
const getVietnameseVariants = (char) => {
  return getVietnameseCharVariants(char).join('');
};

