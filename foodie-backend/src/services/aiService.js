import { GoogleGenerativeAI } from "@google/generative-ai";
import Recipe from "../models/Recipe.js";

// Gemini API Configuration
// Gemini API Configuration
// QUAN TRỌNG: API Key phải được lấy từ biến môi trường
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ [AI Service] CRITICAL ERROR: GEMINI_API_KEY is missing in .env file");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

// Keywords để detect câu hỏi về nấu ăn, dinh dưỡng, nguyên liệu, và thực phẩm
const COOKING_KEYWORDS = [
  // Từ khóa chính về nấu ăn
  'nấu', 'nau', 'công thức', 'cong thuc', 'recipe', 'món ăn', 'mon an',
  'nguyên liệu', 'nguyen lieu', 'ingredient', 'cách làm', 'cach lam',
  'thời gian nấu', 'thoi gian nau', 'cook time', 'độ khó', 'do kho', 'difficulty',
  // Dinh dưỡng - mở rộng
  'calories', 'calo', 'dinh dưỡng', 'dinh duong', 'nutrition', 'healthy', 'sức khỏe', 'suc khoe',
  'protein', 'đạm', 'dam', 'carb', 'carbohydrate', 'tinh bột', 'tinh bot', 'fat', 'chất béo', 'chat beo',
  'vitamin', 'khoáng chất', 'khoang chat', 'mineral', 'năng lượng', 'nang luong', 'energy',
  'chất xơ', 'chat xo', 'fiber', 'chất đạm', 'chat dam', 'chất bột', 'chat bot',
  'canxi', 'calcium', 'sắt', 'sat', 'iron', 'kẽm', 'kem', 'zinc',
  'omega', 'cholesterol', 'đường', 'duong', 'sugar', 'muối', 'muoi', 'salt',
  // Thực phẩm và nguyên liệu - mở rộng
  'thực phẩm', 'thuc pham', 'food', 'món', 'mon', 'dish', 'đồ ăn', 'do an',
  'trái cây', 'trai cay', 'fruit', 'hoa quả', 'hoa qua', 'rau', 'vegetable', 'rau củ', 'rau cu',
  'củ quả', 'cu qua', 'thịt', 'thit', 'meat', 'cá', 'ca', 'fish', 'hải sản', 'hai san', 'seafood',
  'thịt bò', 'thit bo', 'beef', 'thịt gà', 'thit ga', 'chicken', 'thịt heo', 'thit heo', 'pork',
  'tôm', 'tom', 'shrimp', 'cua', 'crab', 'mực', 'muc', 'squid', 'cá hồi', 'ca hoi', 'salmon',
  'rau xanh', 'rau xanh', 'green vegetable', 'cà rốt', 'ca rot', 'carrot', 'cà chua', 'ca chua', 'tomato',
  'bông cải', 'bong cai', 'broccoli', 'bắp cải', 'bap cai', 'cabbage', 'rau muống', 'rau muong',
  'chuối', 'chuoi', 'banana', 'táo', 'tao', 'apple', 'cam', 'orange', 'nho', 'grape',
  'dâu tây', 'dau tay', 'strawberry', 'bơ', 'bo', 'avocado', 'đậu', 'dau', 'bean',
  'đậu phụ', 'dau phu', 'tofu', 'đậu nành', 'dau nanh', 'soy', 'đậu xanh', 'dau xanh',
  'trứng', 'trung', 'egg', 'sữa', 'sua', 'milk', 'phô mai', 'pho mai', 'cheese',
  'gạo', 'gao', 'rice', 'mì', 'mi', 'noodle', 'bún', 'bun', 'bánh mì', 'banh mi',
  // Thực đơn và kế hoạch ăn
  'bảo quản', 'bao quan', 'storage', 'lưu trữ', 'luu tru',
  'meal plan', 'kế hoạch bữa ăn', 'ke hoach bua an', 'thực đơn', 'thuc don', 'menu',
  'ăn uống', 'an uong', 'bữa ăn', 'bua an', 'meal', 'breakfast', 'lunch', 'dinner',
  'chỉnh thực đơn', 'chinh thuc don', 'gợi ý', 'goi y', 'suggest', 'đề xuất', 'de xuat',
  // Món ăn phổ biến
  'phở', 'pho', 'bánh', 'banh', 'canh', 'soup', 'salad', 'gỏi', 'goi',
  'chiên', 'chien', 'xào', 'xao', 'nướng', 'nuong', 'hấp', 'hap', 'luộc', 'luoc',
  // Từ khóa tìm kiếm và câu hỏi
  'tìm', 'tim', 'tìm kiếm', 'tim kiem', 'search', 'find', 'có', 'co', 'với', 'voi', 'with',
  'cho tôi', 'cho toi', 'giúp tôi', 'giup toi', 'help', 'recommend', 'đề xuất', 'de xuat',
  'nhiều', 'nhieu', 'much', 'nhiều nhất', 'nhieu nhat', 'most', 'ít', 'it', 'least',
  'loại nào', 'loai nao', 'which', 'gì', 'gi', 'what', 'tại sao', 'tai sao', 'why',
  'lượng', 'luong', 'amount', 'bao nhiêu', 'bao nhieu', 'how much', 'có chứa', 'co chua', 'contains'
];

/**
 * Kiểm tra xem câu hỏi có liên quan đến nấu ăn không
 */
export const isCookingRelated = (question) => {
  if (!question || typeof question !== 'string') return false;

  const normalizedQuestion = question.toLowerCase().trim();

  // Kiểm tra có chứa keyword nào không
  return COOKING_KEYWORDS.some(keyword =>
    normalizedQuestion.includes(keyword.toLowerCase())
  );
};

/**
 * Lấy dữ liệu công thức từ MongoDB (KHÔNG hardcode - luôn fetch từ database)
 */
export const getRecipesData = async (limit = 100) => {
  try {
    // Tối ưu: sắp xếp theo rating và popularity để lấy công thức tốt nhất trước
    const recipes = await Recipe.find({ status: 'approved' })
      .select('_id title description ingredients steps difficulty cookTimeMinutes servings categoryName averageRating ratingCount imageUrl updatedAt')
      .sort({ averageRating: -1, ratingCount: -1, createdAt: -1 }) // Ưu tiên công thức có rating cao và phổ biến
      .limit(limit)
      .lean();

    return recipes.map(recipe => ({
      id: recipe._id?.toString() || '',
      title: recipe.title || '',
      description: recipe.description || '',
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      steps: Array.isArray(recipe.steps) ? recipe.steps : [],
      difficulty: recipe.difficulty || 'Dễ',
      cookTime: recipe.cookTimeMinutes || recipe.time || 0,
      servings: recipe.servings || 1,
      category: recipe.categoryName || '',
      rating: recipe.averageRating || 0,
      ratingCount: recipe.ratingCount || 0,
      imageUrl: recipe.imageUrl || '',
      updatedAt: recipe.updatedAt || recipe.createdAt || new Date()
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Tìm công thức theo từ khóa trong nguyên liệu hoặc tên
 */
export const searchRecipesByKeyword = async (keyword) => {
  try {
    const normalizedKeyword = keyword.toLowerCase().trim();

    const recipes = await Recipe.find({
      status: 'approved',
      $or: [
        { title: { $regex: normalizedKeyword, $options: 'i' } },
        { description: { $regex: normalizedKeyword, $options: 'i' } },
        { ingredients: { $regex: normalizedKeyword, $options: 'i' } },
        { categoryName: { $regex: normalizedKeyword, $options: 'i' } }
      ]
    })
      .select('_id title description ingredients steps difficulty cookTimeMinutes servings categoryName averageRating ratingCount imageUrl updatedAt')
      .limit(20)
      .lean();

    return recipes.map(recipe => ({
      id: recipe._id?.toString() || '',
      title: recipe.title || '',
      description: recipe.description || '',
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      steps: Array.isArray(recipe.steps) ? recipe.steps : [],
      difficulty: recipe.difficulty || 'Dễ',
      cookTime: recipe.cookTimeMinutes || recipe.time || 0,
      servings: recipe.servings || 1,
      category: recipe.categoryName || '',
      rating: recipe.averageRating || 0,
      ratingCount: recipe.ratingCount || 0,
      imageUrl: recipe.imageUrl || '',
      updatedAt: recipe.updatedAt || recipe.createdAt || new Date()
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Tạo prompt cho Gemini AI với dữ liệu động từ MongoDB
 */
const createPrompt = (question, appData) => {
  const recipesContext = appData.length > 0
    ? JSON.stringify(appData, null, 2)
    : 'Không có dữ liệu công thức trong ứng dụng.';

  return `Bạn là trợ lý AI chuyên về nấu ăn, dinh dưỡng, nguyên liệu và công thức trong ứng dụng Foodie.

QUY TẮC:
1. TRẢ LỜI về: nấu ăn, công thức, nguyên liệu, dinh dưỡng (protein, chất xơ, vitamin, khoáng chất...), thực phẩm, thực đơn, calories, bảo quản thực phẩm
2. KHÔNG trả lời các chủ đề khác (thời tiết, tin tức, giải trí, v.v.)
3. Khi trả lời về dinh dưỡng/nguyên liệu: LUÔN gợi ý công thức phù hợp từ dữ liệu ứng dụng
4. CHỈ sử dụng công thức từ dữ liệu ứng dụng bên dưới
5. KHÔNG được tạo ra công thức mới không có trong dữ liệu
6. Trả lời bằng tiếng Việt, thân thiện, dễ hiểu

QUAN TRỌNG - CÁCH TRẢ LỜI:

A. Khi hỏi về CÔNG THỨC:
- CHỈ GIỚI THIỆU ngắn gọn về món ăn (2-3 câu)
- KHÔNG liệt kê từng bước nấu ăn chi tiết
- KHÔNG liệt kê đầy đủ nguyên liệu
- CHỈ nói về: món ăn là gì, đặc điểm nổi bật, tại sao nên thử
- Ví dụ: "Phở Bò là món ăn truyền thống của Việt Nam với nước dùng thơm ngon, thịt bò mềm và bánh phở dai. Món này rất phù hợp cho bữa sáng hoặc trưa."

B. Khi hỏi về DINH DƯỠNG (protein, chất xơ, vitamin, v.v.):
- Trả lời chi tiết về dinh dưỡng dựa trên kiến thức chung
- Giải thích lợi ích và vai trò của chất dinh dưỡng đó
- SAU ĐÓ, LUÔN gợi ý 2-3 công thức từ dữ liệu ứng dụng có chứa nguyên liệu/thực phẩm giàu chất dinh dưỡng đó
- Ví dụ: "Protein (đạm) rất quan trọng cho cơ thể... Các thực phẩm giàu protein bao gồm thịt bò, thịt gà, cá, đậu... Bạn có thể thử [RECIPE:xxx:Phở Bò] hoặc [RECIPE:yyy:Cơm Gà]."

C. Khi hỏi về NGUYÊN LIỆU/THỰC PHẨM (trái cây, rau, thịt, v.v.):
- Trả lời về đặc điểm, dinh dưỡng, lợi ích của nguyên liệu đó
- SAU ĐÓ, LUÔN gợi ý 2-3 công thức từ dữ liệu ứng dụng có sử dụng nguyên liệu đó
- Ví dụ: "Rau muống rất giàu chất xơ và vitamin... Bạn có thể thử [RECIPE:xxx:Canh Rau Muống] hoặc [RECIPE:yyy:Rau Muống Xào]."

D. Khi hỏi về CÔNG THỨC THEO KIỂU KHÁC:
- Tìm công thức tương tự trong dữ liệu
- Gợi ý các biến thể hoặc công thức liên quan
- Ví dụ: Nếu hỏi "phở bò nhưng không có thịt", gợi ý phở chay hoặc phở gà

ĐỊNH DẠNG CÔNG THỨC QUAN TRỌNG (BẮT BUỘC):
Khi đề xuất hoặc đề cập đến bất kỳ công thức nào từ dữ liệu, BẮT BUỘC sử dụng format sau:
[RECIPE:id:tên công thức]

Ví dụ cụ thể:
- Nếu dữ liệu có công thức: {"id": "67890abc", "title": "Phở Bò", ...}
- Khi trả lời, viết: "Bạn có thể thử [RECIPE:67890abc:Phở Bò] - một món ăn truyền thống của Việt Nam."

QUY TẮC SỬ DỤNG:
1. Mỗi công thức chỉ dùng format [RECIPE:id:tên] MỘT LẦN trong câu trả lời
2. Đặt format này ngay sau khi đề cập đến tên công thức lần đầu tiên
3. Sử dụng đúng "id" từ trường "id" trong dữ liệu công thức
4. Sử dụng đúng "tên công thức" từ trường "title" trong dữ liệu
5. KHÔNG dùng format này cho công thức không có trong dữ liệu
6. Khi liệt kê nhiều công thức, mỗi công thức phải có format riêng

DỮ LIỆU CÔNG THỨC TỪ ỨNG DỤNG (appData):
${recipesContext}

Câu hỏi: ${question}

HƯỚNG DẪN TRẢ LỜI CỤ THỂ:

1. Nếu câu hỏi về DINH DƯỠNG (protein, chất xơ, vitamin, v.v.):
   → Trả lời về dinh dưỡng (2-3 câu)
   → Tìm trong dữ liệu công thức có nguyên liệu liên quan
   → Gợi ý 2-3 công thức phù hợp với format [RECIPE:id:tên]

2. Nếu câu hỏi về NGUYÊN LIỆU/THỰC PHẨM (trái cây, rau, thịt, v.v.):
   → Trả lời về nguyên liệu (2-3 câu)
   → Tìm trong dữ liệu công thức có sử dụng nguyên liệu đó
   → Gợi ý 2-3 công thức phù hợp với format [RECIPE:id:tên]

3. Nếu câu hỏi về CÔNG THỨC:
   → CHỈ GIỚI THIỆU ngắn gọn (2-3 câu)
   → Gợi ý công thức với format [RECIPE:id:tên]

4. Nếu câu hỏi về CÔNG THỨC THEO KIỂU KHÁC:
   → Tìm công thức tương tự hoặc biến thể trong dữ liệu
   → Gợi ý các công thức phù hợp với format [RECIPE:id:tên]

LUÔN NHỚ: Sau khi trả lời về dinh dưỡng/nguyên liệu, PHẢI gợi ý công thức từ dữ liệu ứng dụng!

Hãy trả lời dựa trên câu hỏi và nhớ sử dụng format [RECIPE:id:tên] khi đề xuất công thức:`;
};

/**
 * Gửi câu hỏi đến Gemini AI với dữ liệu động từ MongoDB
 */
export const chatWithAI = async (question) => {
  try {
    // Kiểm tra câu hỏi có liên quan đến nấu ăn không
    if (!isCookingRelated(question)) {
      return {
        success: false,
        message: "Xin lỗi, mình chỉ hỗ trợ câu hỏi về nấu ăn và công thức trong ứng dụng Foodie."
      };
    }

    // Fetch recipe data from MongoDB (appData)
    // OPTIMIZATION: Reduce limit to 40 to avoid token limits
    let appData = await getRecipesData(40);

    // OPTIMIZATION: Remove large fields like 'steps' from context
    const optimizedAppData = appData.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      ingredients: r.ingredients, // Keep ingredients for search
      // steps: r.steps, // Remove steps to save tokens
      category: r.category,
      rating: r.rating,
      cookTime: r.cookTime,
      difficulty: r.difficulty
    }));

    // Phân tích câu hỏi để tìm công thức phù hợp
    const normalizedQuestion = question.toLowerCase();

    // Tìm kiếm dựa trên nguyên liệu/thực phẩm được đề cập
    const ingredientKeywords = [
      // Thịt
      'thịt bò', 'thit bo', 'beef', 'thịt gà', 'thit ga', 'chicken',
      'thịt heo', 'thit heo', 'pork', 'thịt', 'thit', 'meat',
      // Hải sản
      'cá', 'ca', 'fish', 'tôm', 'tom', 'shrimp', 'cua', 'crab', 'mực', 'muc', 'squid',
      'cá hồi', 'ca hoi', 'salmon', 'hải sản', 'hai san', 'seafood',
      // Rau củ
      'rau', 'vegetable', 'rau muống', 'rau muong', 'rau xanh', 'rau xanh',
      'cà rốt', 'ca rot', 'carrot', 'cà chua', 'ca chua', 'tomato',
      'bông cải', 'bong cai', 'broccoli', 'bắp cải', 'bap cai', 'cabbage',
      // Trái cây
      'trái cây', 'trai cay', 'fruit', 'hoa quả', 'hoa qua',
      'chuối', 'chuoi', 'banana', 'táo', 'tao', 'apple', 'cam', 'orange',
      'nho', 'grape', 'dâu tây', 'dau tay', 'strawberry', 'bơ', 'bo', 'avocado',
      // Đậu và protein thực vật
      'đậu', 'dau', 'bean', 'đậu phụ', 'dau phu', 'tofu', 'đậu nành', 'dau nanh', 'soy',
      'đậu xanh', 'dau xanh', 'đậu đỏ', 'dau do',
      // Khác
      'trứng', 'trung', 'egg', 'sữa', 'sua', 'milk', 'phô mai', 'pho mai', 'cheese',
      'gạo', 'gao', 'rice', 'mì', 'mi', 'noodle', 'bún', 'bun', 'bánh mì', 'banh mi'
    ];

    // Tìm nguyên liệu được đề cập trong câu hỏi
    const foundIngredient = ingredientKeywords.find(keyword =>
      normalizedQuestion.includes(keyword.toLowerCase())
    );

    // Tìm kiếm dựa trên dinh dưỡng
    const nutritionKeywords = {
      'protein': ['thịt', 'thit', 'meat', 'cá', 'ca', 'fish', 'tôm', 'tom', 'đậu', 'dau', 'trứng', 'trung', 'egg'],
      'đạm': ['thịt', 'thit', 'meat', 'cá', 'ca', 'fish', 'tôm', 'tom', 'đậu', 'dau', 'trứng', 'trung', 'egg'],
      'chất xơ': ['rau', 'vegetable', 'trái cây', 'trai cay', 'fruit', 'đậu', 'dau', 'gạo', 'gao'],
      'chat xo': ['rau', 'vegetable', 'trái cây', 'trai cay', 'fruit', 'đậu', 'dau', 'gạo', 'gao'],
      'fiber': ['rau', 'vegetable', 'trái cây', 'trai cay', 'fruit', 'đậu', 'dau', 'gạo', 'gao'],
      'vitamin': ['rau', 'vegetable', 'trái cây', 'trai cay', 'fruit', 'cà chua', 'ca chua', 'cam', 'orange'],
      'canxi': ['sữa', 'sua', 'milk', 'phô mai', 'pho mai', 'cheese', 'cá', 'ca', 'fish'],
      'sắt': ['thịt', 'thit', 'meat', 'cá', 'ca', 'fish', 'rau xanh', 'rau xanh'],
      'sat': ['thịt', 'thit', 'meat', 'cá', 'ca', 'fish', 'rau xanh', 'rau xanh']
    };

    // Kiểm tra xem câu hỏi có đề cập đến dinh dưỡng không
    const foundNutrition = Object.keys(nutritionKeywords).find(nutrition =>
      normalizedQuestion.includes(nutrition.toLowerCase())
    );

    // Nếu tìm thấy nguyên liệu hoặc dinh dưỡng, tìm công thức phù hợp
    if (foundIngredient) {
      const searchedRecipes = await searchRecipesByKeyword(foundIngredient);
      if (searchedRecipes.length > 0) {
        appData = searchedRecipes;
      }
    } else if (foundNutrition) {
      // Tìm công thức có chứa nguyên liệu liên quan đến dinh dưỡng đó
      const relatedIngredients = nutritionKeywords[foundNutrition];
      const allSearchedRecipes = [];

      for (const ingredient of relatedIngredients) {
        const recipes = await searchRecipesByKeyword(ingredient);
        allSearchedRecipes.push(...recipes);
      }

      // Loại bỏ duplicate
      const uniqueRecipes = Array.from(
        new Map(allSearchedRecipes.map(recipe => [recipe.id, recipe])).values()
      );

      if (uniqueRecipes.length > 0) {
        appData = uniqueRecipes.slice(0, 20); // Giới hạn 20 công thức
      }
    }

    // Tạo prompt với appData
    const prompt = createPrompt(question, appData);

    // Call Gemini API - sử dụng stable models
    let text = '';
    // Use multiple models as fallback (each has separate quota)
    const modelNames = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = result.response;
        text = response.text();
        if (text && text.trim().length > 0) {
          break; // Thành công
        }
      } catch (modelError) {
        console.error(`❌ [AI Service] SDK model ${modelName} failed:`, modelError.message);
        continue; // Thử model tiếp theo
      }
    }

    // Fallback: REST API trực tiếp
    if (!text || text.trim().length === 0) {
      console.log('⚠️ [AI Service] SDK failed, trying REST API fallback');
      const availableModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];

      for (const modelName of availableModels) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }]
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
              text = data.candidates[0].content.parts[0].text || '';
              if (text && text.trim().length > 0) {
                break;
              }
            }
          }
        } catch (restError) {
          console.error(`❌ [AI Service] REST API failed:`, restError.message);
          continue;
        }
      }
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Unable to get response from Gemini API. Please check API key and model availability.');
    }

    return {
      success: true,
      message: text.trim()
    };
  } catch (error) {
    // Log error để debug (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      console.error('AI Chat Error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }

    // Trả về thông báo lỗi thân thiện
    let errorMessage = "Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.";

    // Nếu là lỗi API key hoặc model, thông báo cụ thể hơn
    if (error.message && (error.message.includes('API key') || error.message.includes('404') || error.message.includes('not found'))) {
      errorMessage = "Xin lỗi, có vấn đề với kết nối AI. Vui lòng liên hệ admin để được hỗ trợ.";
    }

    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Chat với AI sử dụng hình ảnh (Gemini Vision API)
 */
export const chatWithImage = async (imageFile, question = 'Phân tích hình ảnh này và tìm các công thức liên quan') => {
  try {
    console.log('📸 [Vision] Starting image analysis...');
    console.log('📸 [Vision] Image file:', {
      mimetype: imageFile.mimetype,
      size: imageFile.buffer?.length || 0,
      fieldname: imageFile.fieldname,
      originalname: imageFile.originalname
    });

    // Kiểm tra buffer
    if (!imageFile.buffer || imageFile.buffer.length === 0) {
      throw new Error('Image buffer is empty');
    }

    // Chuyển đổi image buffer thành base64
    const imageBase64 = imageFile.buffer.toString('base64');
    const imageMimeType = imageFile.mimetype || 'image/jpeg';

    console.log('📸 [Vision] Image converted to base64, length:', imageBase64.length);
    console.log('📸 [Vision] Image mime type:', imageMimeType);

    // Validate base64
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error('Invalid image data - base64 too short');
    }

    // Lấy dữ liệu công thức từ database - giảm số lượng để tối ưu tốc độ
    // Chỉ lấy 30 công thức phổ biến nhất thay vì 100
    const appData = await getRecipesData(30);

    // Tạo prompt ngắn gọn để tối ưu tốc độ - chỉ gửi title và category
    const recipesSummary = appData.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category
    }));

    const visionPrompt = `Bạn là trợ lý AI chuyên về nấu ăn trong ứng dụng Foodie.

QUY TẮC:
1. CHỈ trả lời về nấu ăn, công thức, nguyên liệu
2. CHỈ sử dụng công thức từ danh sách bên dưới
3. Trả lời bằng tiếng Việt, ngắn gọn (2-3 câu)

NHIỆM VỤ:
- Phân tích hình ảnh và xác định món ăn hoặc nguyên liệu
- Nếu thấy món ăn: giới thiệu ngắn gọn và gợi ý 2-3 công thức tương tự
- Nếu thấy nguyên liệu: gợi ý 2-3 công thức sử dụng nguyên liệu đó

ĐỊNH DẠNG (BẮT BUỘC):
Khi đề xuất công thức, dùng format: [RECIPE:id:tên công thức]

DANH SÁCH CÔNG THỨC:
${JSON.stringify(recipesSummary, null, 1)}

Câu hỏi: ${question}

Phân tích hình ảnh và trả lời ngắn gọn.`;

    // Thử nhiều model (mỗi model có quota riêng)
    const visionModels = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.5-flash'
    ];

    let text = '';

    // Thử SDK với format đơn giản nhất để tối ưu tốc độ
    for (const modelName of visionModels) {
      try {
        console.log(`🔄 [Vision] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        // Chỉ thử format đơn giản nhất (array format) - nhanh nhất
        const result = await model.generateContent([
          visionPrompt,
          {
            inlineData: {
              data: imageBase64,
              mimeType: imageMimeType
            }
          }
        ]);

        const response = await result.response;
        text = response.text();

        if (text && text.trim().length > 0) {
          console.log(`✅ [Vision] Successfully analyzed image with ${modelName}`);
          break;
        }
      } catch (modelError) {
        console.log(`❌ [Vision] Model ${modelName} failed:`, modelError.message);
        // Nếu model đầu tiên fail, thử model backup
        if (visionModels.indexOf(modelName) === 0) {
          // Thử gemini-1.5-flash làm backup
          try {
            console.log(`🔄 [Vision] Trying backup model: gemini-2.0-flash`);
            const backupModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const backupResult = await backupModel.generateContent([
              visionPrompt,
              {
                inlineData: {
                  data: imageBase64,
                  mimeType: imageMimeType
                }
              }
            ]);
            const backupResponse = await backupResult.response;
            text = backupResponse.text();
            if (text && text.trim().length > 0) {
              console.log(`✅ [Vision] Successfully analyzed with backup model`);
              break;
            }
          } catch (backupError) {
            console.log(`❌ [Vision] Backup model also failed`);
          }
        }
        continue;
      }
    }

    // Nếu SDK không hoạt động, thử REST API trực tiếp (chỉ thử 1 model để tối ưu tốc độ)
    if (!text || text.trim().length === 0) {
      console.log('🔄 [Vision] Trying REST API for vision...');
      const restModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];
      for (const modelName of restModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  role: 'user',
                  parts: [
                    { text: visionPrompt },
                    {
                      inlineData: {
                        data: imageBase64,
                        mimeType: imageMimeType
                      }
                    }
                  ]
                }],
                generationConfig: {
                  temperature: 0.4,
                  topK: 32,
                  topP: 1,
                  maxOutputTokens: 4096,
                }
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
              text = data.candidates[0].content.parts[0].text || '';
              if (text && text.trim().length > 0) {
                console.log(`✅ Successfully used REST API with model: ${modelName}`);
                break;
              }
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.log(`❌ REST API error for ${modelName}:`, response.status, errorData);
          }
        } catch (restError) {
          console.log(`❌ REST API exception for ${modelName}:`, restError.message);
          continue;
        }
      }
    }

    if (!text || text.trim().length === 0) {
      console.log('❌ [Vision] All vision models failed. Trying keyword-based search...');

      // Thử phân tích đơn giản dựa trên câu hỏi của user
      const questionLower = question.toLowerCase();
      const keywords = [];

      // Tìm keywords phổ biến trong câu hỏi
      const commonFoods = ['phở', 'pho', 'bánh', 'banh', 'nem', 'chả giò', 'cha gio', 'gỏi', 'goi', 'canh', 'bún', 'bun', 'mì', 'mi'];
      for (const food of commonFoods) {
        if (questionLower.includes(food)) {
          keywords.push(food);
        }
      }

      let relatedRecipes = [];

      if (keywords.length > 0) {
        console.log('🔍 [Vision] Found keywords:', keywords);
        for (const keyword of keywords) {
          const recipes = await searchRecipesByKeyword(keyword);
          relatedRecipes.push(...recipes);
        }
        relatedRecipes = Array.from(new Map(relatedRecipes.map(r => [r.id, r])).values()).slice(0, 5);
      }

      // Nếu không tìm thấy, lấy công thức phổ biến
      if (relatedRecipes.length === 0) {
        console.log('📋 [Vision] No keyword matches, using popular recipes');
        const popularRecipes = await Recipe.find({ status: 'approved' })
          .select('_id title')
          .sort({ averageRating: -1, ratingCount: -1 })
          .limit(3)
          .lean();

        relatedRecipes = popularRecipes.map(r => ({
          id: r._id?.toString() || '',
          title: r.title || ''
        }));
      }

      const recipeText = relatedRecipes.map(r => `[RECIPE:${r.id}:${r.title}]`).join(' ');

      return {
        success: true,
        message: `Xin lỗi, mình không thể phân tích hình ảnh này bằng AI. Tuy nhiên, bạn có thể tham khảo các công thức liên quan sau:\n\n${recipeText}`
      };
    }

    // Tìm các công thức liên quan dựa trên kết quả phân tích (tối ưu: chỉ tìm nếu chưa có trong response)
    if (!text.includes('[RECIPE:')) {
      const analysisText = text.toLowerCase();
      const keywords = analysisText.split(/\s+/).filter(word => word.length > 3).slice(0, 5); // Chỉ lấy 5 từ quan trọng nhất
      const relatedRecipes = [];

      // Tìm công thức theo keywords (song song để tối ưu tốc độ)
      const searchPromises = keywords.map(keyword => searchRecipesByKeyword(keyword));
      const searchResults = await Promise.all(searchPromises);
      searchResults.forEach(recipes => relatedRecipes.push(...recipes));

      // Loại bỏ duplicate và giới hạn số lượng
      const uniqueRecipes = Array.from(new Map(relatedRecipes.map(r => [r.id, r])).values()).slice(0, 3);

      // Nếu không tìm thấy, lấy công thức phổ biến từ appData đã có (không cần query lại)
      if (uniqueRecipes.length === 0 && appData.length > 0) {
        const topRecipes = appData.slice(0, 3).map(r => ({
          id: r.id,
          title: r.title
        }));
        uniqueRecipes.push(...topRecipes);
      }

      // Thêm các công thức vào response text
      if (uniqueRecipes.length > 0) {
        const recipeText = uniqueRecipes.map(r => `[RECIPE:${r.id}:${r.title}]`).join(' ');
        text += `\n\nCác công thức liên quan: ${recipeText}`;
      }
    }

    return {
      success: true,
      message: text.trim()
    };
  } catch (error) {
    console.error('AI Image Chat Error:', error);

    return {
      success: false,
      message: error.message || "Xin lỗi, có lỗi xảy ra khi phân tích hình ảnh. Vui lòng thử lại sau."
    };
  }
};

