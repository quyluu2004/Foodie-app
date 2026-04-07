/**
 * Tối ưu thuật toán tìm kiếm - Enhanced version
 */

// Cache để lưu search text đã normalize (LRU cache)
const searchTextCache = new Map<string, string>();
const MAX_CACHE_SIZE = 2000;

// Vietnamese diacritics mapping for better normalization
const VIETNAMESE_MAP: { [key: string]: string } = {
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
 * Normalize và cache search text với Vietnamese support tốt hơn
 */
export const normalizeSearchText = (text: string): string => {
  if (!text) return '';
  
  // Check cache
  if (searchTextCache.has(text)) {
    return searchTextCache.get(text)!;
  }
  
  // Normalize: lowercase, remove diacritics, trim
  let normalized = text
    .toLowerCase()
    .trim();
  
  // Replace Vietnamese characters manually for better performance
  normalized = normalized.replace(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, (char) => {
    return VIETNAMESE_MAP[char] || char;
  });
  
  // Remove remaining diacritics (fallback)
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Cache result với LRU strategy
  if (searchTextCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (first key)
    const firstKey = searchTextCache.keys().next().value;
    searchTextCache.delete(firstKey);
  }
  searchTextCache.set(text, normalized);
  
  return normalized;
};

/**
 * Tối ưu fuzzy search với scoring nâng cao
 */
export const fuzzyMatch = (text: string, query: string): { match: boolean; score: number } => {
  if (!query) return { match: true, score: 0 };
  
  const normalizedText = normalizeSearchText(text);
  const normalizedQuery = normalizeSearchText(query);
  
  // Exact match - highest score
  if (normalizedText === normalizedQuery) {
    return { match: true, score: 100 };
  }
  
  // Starts with - high score (bonus nếu match ở đầu)
  if (normalizedText.startsWith(normalizedQuery)) {
    const bonus = normalizedText.length === normalizedQuery.length ? 0 : 5;
    return { match: true, score: 85 + bonus };
  }
  
  // Contains - medium score (bonus nếu match gần đầu)
  const containsIndex = normalizedText.indexOf(normalizedQuery);
  if (containsIndex !== -1) {
    // Bonus nếu match ở đầu (first 20% of text)
    const positionBonus = containsIndex < normalizedText.length * 0.2 ? 10 : 0;
    return { match: true, score: 60 + positionBonus };
  }
  
  // Word boundary match - medium-high score
  const words = normalizedText.split(/\s+/);
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
  
  if (queryWords.length === 0) {
    return { match: false, score: 0 };
  }
  
  let wordMatchScore = 0;
  let matchedWords = 0;
  
  for (const queryWord of queryWords) {
    if (queryWord.length < 2) continue; // Skip single character words
    
    let found = false;
    for (const word of words) {
      if (word === queryWord) {
        // Exact word match - highest word score
        wordMatchScore += 50;
        matchedWords++;
        found = true;
        break;
      } else if (word.startsWith(queryWord)) {
        // Word starts with query - high score
        wordMatchScore += 40;
        matchedWords++;
        found = true;
        break;
      } else if (word.includes(queryWord)) {
        // Word contains query - medium score
        wordMatchScore += 25;
        matchedWords++;
        found = true;
        break;
      }
    }
    
    // Partial character match (for typos)
    if (!found && queryWord.length >= 3) {
      for (const word of words) {
        if (word.length >= queryWord.length - 1) {
          // Check if most characters match
          let matchCount = 0;
          for (let i = 0; i < Math.min(queryWord.length, word.length); i++) {
            if (queryWord[i] === word[i] || queryWord[i] === word[i + 1] || queryWord[i + 1] === word[i]) {
              matchCount++;
            }
          }
          if (matchCount >= queryWord.length * 0.7) {
            wordMatchScore += 15;
            matchedWords++;
            break;
          }
        }
      }
    }
  }
  
  // Bonus nếu match nhiều từ
  if (matchedWords === queryWords.length && queryWords.length > 1) {
    wordMatchScore += 20; // All words matched bonus
  }
  
  if (wordMatchScore > 0) {
    return { match: true, score: Math.min(95, wordMatchScore) };
  }
  
  // No match
  return { match: false, score: 0 };
};

/**
 * Tối ưu filter recipes với multiple criteria
 */
export const filterRecipes = (
  recipes: any[],
  options: {
    searchQuery?: string;
    dietary?: string;
    diets?: string[];
    ingredients?: string[];
  }
): any[] => {
  if (!recipes || recipes.length === 0) return [];
  
  const { searchQuery, dietary, diets, ingredients } = options;
  
  // Early return nếu không có filter
  if (!searchQuery && !dietary && (!diets || diets.length === 0) && (!ingredients || ingredients.length === 0)) {
    return recipes;
  }
  
  // Pre-compute search text cho tất cả recipes (cache với memoization)
  // Sử dụng WeakMap để cache recipes đã xử lý (tự động cleanup khi recipe bị GC)
  const recipeCache = new WeakMap();
  
  const recipesWithSearchText = recipes.map(recipe => {
    // Check cache
    if (recipeCache.has(recipe)) {
      return recipeCache.get(recipe);
    }
    
    const title = recipe.title || '';
    const description = recipe.description || '';
    const tags = Array.isArray(recipe.tags) ? recipe.tags : [];
    const category = recipe.categoryName || recipe.category?.name || '';
    const ingredientsList = Array.isArray(recipe.ingredients) 
      ? recipe.ingredients.map((ing: any) => typeof ing === 'string' ? ing : ing.name || ing)
      : [];
    
    // Combine all searchable text với priority weights
    // Title và category có weight cao hơn
    const searchText = normalizeSearchText(
      `${title} ${title} ${category} ${description} ${tags.join(' ')} ${ingredientsList.join(' ')}`
    );
    
    const processed = {
      ...recipe,
      _searchText: searchText,
      _titleText: normalizeSearchText(title),
      _categoryText: normalizeSearchText(category),
      _tags: new Set(tags.map((tag: string) => normalizeSearchText(tag))),
      _ingredients: new Set(ingredientsList.map((ing: string) => normalizeSearchText(ing))),
    };
    
    // Cache processed recipe
    recipeCache.set(recipe, processed);
    
    return processed;
  });
  
  // Filter by search query
  let filtered = recipesWithSearchText;
  
  if (searchQuery) {
    const normalizedQuery = normalizeSearchText(searchQuery);
    
    // Multi-field search với priority
    filtered = filtered
      .map(recipe => {
        // Search trong title (highest priority)
        const titleMatch = fuzzyMatch(recipe._titleText, normalizedQuery);
        if (titleMatch.match) {
          return { ...recipe, _searchScore: titleMatch.score + 20 }; // Bonus cho title match
        }
        
        // Search trong category
        const categoryMatch = fuzzyMatch(recipe._categoryText, normalizedQuery);
        if (categoryMatch.match) {
          return { ...recipe, _searchScore: categoryMatch.score + 10 }; // Bonus cho category match
        }
        
        // Search trong full text
        const fullMatch = fuzzyMatch(recipe._searchText, normalizedQuery);
        if (fullMatch.match) {
          return { ...recipe, _searchScore: fullMatch.score };
        }
        
        return null;
      })
      .filter(Boolean) as any[];
    
    // Sort by relevance score (descending)
    filtered.sort((a, b) => {
      const scoreDiff = (b._searchScore || 0) - (a._searchScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      
      // Tie-breaker: sort by rating if scores are equal
      const ratingA = a.averageRating || 0;
      const ratingB = b.averageRating || 0;
      return ratingB - ratingA;
    });
  }
  
  // Filter by dietary preference
  if (dietary && dietary !== 'all') {
    filtered = filtered.filter(recipe => {
      const searchText = recipe._searchText;
      const tags = recipe._tags;
      
      switch (dietary) {
        case 'vegan':
          return searchText.includes('vegan') || 
                 searchText.includes('thuan chay') || 
                 searchText.includes('chay') || 
                 tags.has('vegan');
        case 'vegetarian':
          return searchText.includes('vegetarian') || 
                 searchText.includes('chay') ||
                 tags.has('vegetarian');
        case 'gluten-free':
          return searchText.includes('gluten-free') || 
                 searchText.includes('khong gluten') ||
                 tags.has('gluten-free');
        case 'keto':
          return searchText.includes('keto') || 
                 tags.has('keto');
        case 'low-carb':
          return searchText.includes('low-carb') || 
                 searchText.includes('it tinh bot') ||
                 tags.has('low-carb');
        default:
          return true;
      }
    });
  }
  
  // Filter by diets
  if (diets && diets.length > 0) {
    const normalizedDiets = new Set(diets.map(d => normalizeSearchText(d)));
    filtered = filtered.filter(recipe => {
      return Array.from(normalizedDiets).some(diet => 
        recipe._searchText.includes(diet) || recipe._tags.has(diet)
      );
    });
  }
  
  // Filter by ingredients to avoid
  if (ingredients && ingredients.length > 0) {
    const normalizedIngredients = new Set(ingredients.map(i => normalizeSearchText(i)));
    filtered = filtered.filter(recipe => {
      // Recipe không chứa bất kỳ ingredient nào trong danh sách cần tránh
      return !Array.from(normalizedIngredients).some(ingredient =>
        recipe._ingredients.has(ingredient) || recipe._searchText.includes(ingredient)
      );
    });
  }
  
  // Remove temporary properties
  return filtered.map(({ _searchText, _tags, _ingredients, _searchScore, ...recipe }) => recipe);
};

/**
 * Debounce function để tối ưu search input
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};

/**
 * Clear search cache (call khi cần)
 */
export const clearSearchCache = () => {
  searchTextCache.clear();
};

