import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Unsplash Access Key from environment variable
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com';

// Validate API key
if (!UNSPLASH_ACCESS_KEY) {
  console.error('❌ UNSPLASH_ACCESS_KEY không được tìm thấy trong .env file');
  console.error('💡 Vui lòng thêm UNSPLASH_ACCESS_KEY vào file .env');
  console.error('💡 Ví dụ: UNSPLASH_ACCESS_KEY=your_access_key_here');
  process.exit(1);
}

// Hàm tìm kiếm hình ảnh từ Unsplash với một query cụ thể
const searchUnsplashImageWithQuery = async (query) => {
  try {
    if (!UNSPLASH_ACCESS_KEY) {
      throw new Error('UNSPLASH_ACCESS_KEY is not configured');
    }

    if (!query || query.trim() === '') {
      return null;
    }

    const url = new URL(`${UNSPLASH_API_URL}/search/photos`);
    url.searchParams.append('query', query.trim());
    url.searchParams.append('per_page', '3'); // Tăng lên 3 để có nhiều lựa chọn hơn
    url.searchParams.append('orientation', 'landscape');
    url.searchParams.append('order_by', 'relevance'); // Sắp xếp theo độ liên quan

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid API key. Please check UNSPLASH_ACCESS_KEY in .env');
      } else if (response.status === 403) {
        throw new Error('Forbidden: API key may have exceeded rate limit');
      } else {
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.errors?.[0] || response.statusText}`);
      }
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    // Chọn hình ảnh đầu tiên (đã được sắp xếp theo relevance)
    const image = data.results[0];
    if (!image.urls || !image.urls.raw) {
      return null;
    }

    // Trả về URL với kích thước phù hợp
    return `${image.urls.raw}&w=800&h=600&fit=crop&auto=format`;
  } catch (error) {
    if (error.message.includes('API key') || error.message.includes('Unauthorized')) {
      console.error('💡 Vui lòng kiểm tra UNSPLASH_ACCESS_KEY trong file .env');
      throw error;
    }
    return null;
  }
};

// Mapping tên món ăn Việt Nam sang tiếng Anh để tìm hình ảnh chính xác hơn
const vietnameseToEnglish = {
  'Phở Bò': 'pho beef noodle soup',
  'Bánh Mì Thịt Nướng': 'vietnamese banh mi grilled pork',
  'Gỏi Cuốn': 'vietnamese spring rolls fresh',
  'Gỏi Cuốn Tôm Thịt': 'vietnamese spring rolls shrimp pork',
  'Bún Chả': 'bun cha grilled pork',
  'Bánh Xèo': 'vietnamese pancake banh xeo',
  'Cơm Tấm Sườn Nướng': 'vietnamese broken rice grilled pork',
  'Bún Bò Huế': 'bun bo hue spicy beef noodle',
  'Chả Giò': 'vietnamese fried spring rolls',
  'Bánh Cuốn': 'vietnamese steamed rice rolls',
  'Canh Chua Cá': 'vietnamese sour fish soup',
  'Bánh Mì Pate': 'vietnamese banh mi pate',
  'Bún Riêu': 'bun rieu crab noodle soup',
  'Gỏi Đu Đủ': 'vietnamese papaya salad',
  'Cơm Gà': 'vietnamese chicken rice',
  'Chè Đậu Xanh': 'vietnamese mung bean dessert',
  'Bánh Bèo': 'vietnamese banh beo',
  'Bún Thịt Nướng': 'vietnamese grilled pork noodles',
  'Canh Khổ Qua': 'vietnamese bitter melon soup',
  'Bánh Flan': 'vietnamese flan caramel',
  'Nem Nướng': 'vietnamese grilled pork skewers',
  'Gà Xào Sả Ớt': 'vietnamese lemongrass chili chicken',
  'Thịt Kho Tiêu': 'vietnamese braised pork pepper',
  'Rau Muống Xào Tỏi': 'vietnamese water spinach garlic',
  'Cá Lóc Kho Tộ': 'vietnamese braised fish',
  'Bánh Bột Lọc': 'vietnamese tapioca dumplings',
  'Đậu Phụ Sốt Cà Chua': 'vietnamese tofu tomato sauce',
  'Cà Phê Trứng': 'vietnamese egg coffee',
  'Cà Phê Phin': 'vietnamese phin coffee',
  'Bò Lúc Lắc': 'vietnamese shaking beef',
  'Tôm Rang Muối': 'vietnamese salt pepper shrimp'
};

// Hàm tìm kiếm hình ảnh với nhiều query variations để tìm hình ảnh chính xác nhất
const searchUnsplashImage = async (title, description = '') => {
  // Tạo danh sách các query để thử
  const queries = [];
  
  // Chỉ dùng 1 query tốt nhất để giảm số lượng requests
  const englishName = vietnameseToEnglish[title];
  if (englishName) {
    // Ưu tiên query tiếng Anh có mapping
    queries.push(englishName);
  } else {
    // Nếu không có mapping, dùng query cơ bản
    queries.push(`${title} vietnamese food`);
  }

  // Thử từng query cho đến khi tìm thấy hình ảnh
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    try {
      const imageUrl = await searchUnsplashImageWithQuery(query);
      if (imageUrl) {
        if (i > 0) {
          console.log(`  💡 Tìm thấy với query: "${query}"`);
        }
        return imageUrl;
      }
    } catch (error) {
      // Nếu lỗi nghiêm trọng (như API key), throw ngay
      if (error.message.includes('API key') || error.message.includes('Unauthorized')) {
        throw error;
      }
      // Nếu không tìm thấy, thử query tiếp theo
      continue;
    }
    
    // Delay lớn giữa các query để tránh rate limit
    if (i < queries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay 2 giây giữa các query
    }
  }
  
  console.warn(`  ⚠️  Không tìm thấy hình ảnh sau ${queries.length} lần thử`);
  return null;
};

// Hàm cập nhật hình ảnh cho recipes
const updateRecipeImages = async (jsonFilePath) => {
  try {
    // Đọc file JSON
    const filePath = path.join(__dirname, '..', jsonFilePath);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Không tìm thấy file: ${filePath}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const recipes = JSON.parse(fileContent);

    if (!Array.isArray(recipes)) {
      console.error('❌ File JSON phải là một mảng');
      process.exit(1);
    }

    console.log(`📦 Tìm thấy ${recipes.length} công thức trong file`);
    console.log('🔄 Bắt đầu cập nhật hình ảnh từ Unsplash API...\n');

    // Cập nhật từng recipe
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const recipeTitle = recipe.title;
      const recipeDescription = recipe.description || '';
      
      // Kiểm tra xem hình ảnh hiện tại có phải là URL mới từ Unsplash không
      // URL mới thường có format: https://images.unsplash.com/photo-...
      const hasNewImage = recipe.imageUrl && recipe.imageUrl.includes('images.unsplash.com/photo-');
      
      // Nếu có tham số --force, cập nhật tất cả
      const forceUpdate = process.argv.includes('--force');
      
      if (hasNewImage && !forceUpdate) {
        console.log(`[${i + 1}/${recipes.length}] ⏭️  Bỏ qua "${recipeTitle}" (đã có hình ảnh mới)`);
        skippedCount++;
        continue;
      }
      
      console.log(`[${i + 1}/${recipes.length}] Đang tìm hình ảnh cho: ${recipeTitle}`);
      
      // Tìm kiếm hình ảnh từ Unsplash với nhiều query variations
      const imageUrl = await searchUnsplashImage(recipeTitle, recipeDescription);
      
      if (imageUrl) {
        recipe.imageUrl = imageUrl;
        console.log(`  ✅ Đã cập nhật: ${imageUrl.substring(0, 80)}...`);
        updatedCount++;
      } else {
        console.log(`  ⚠️  Không tìm thấy hình ảnh, giữ nguyên URL cũ`);
      }
      
      // Delay để tránh rate limit (50 requests/hour cho free tier)
      // Delay 30 giây giữa các recipe để đảm bảo không vượt quá rate limit
      if (i < recipes.length - 1) {
        console.log(`  ⏳ Đợi 30 giây trước khi tiếp tục (để tránh rate limit)...`);
        await new Promise(resolve => setTimeout(resolve, 30000)); // Delay 30 giây giữa các recipe
      }
    }
    
    console.log(`\n📊 Thống kê: ${updatedCount} món đã cập nhật, ${skippedCount} món đã bỏ qua`);

    // Lưu file JSON đã cập nhật
    const updatedContent = JSON.stringify(recipes, null, 2);
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    
    console.log(`\n✅ Đã cập nhật ${recipes.length} công thức và lưu vào file: ${jsonFilePath}`);
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật hình ảnh:', error);
    process.exit(1);
  }
};

// Chạy script
const args = process.argv.slice(2);
const jsonFilePath = args[0] || 'data/20congthu.json';

console.log('🚀 Bắt đầu cập nhật hình ảnh từ Unsplash API');
console.log(`📁 File: ${jsonFilePath}\n`);

updateRecipeImages(jsonFilePath)
  .then(() => {
    console.log('\n✨ Hoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Lỗi:', error);
    process.exit(1);
  });

