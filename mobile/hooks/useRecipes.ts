import { useState, useEffect, useCallback } from 'react';
import { recipeAPI, favoriteAPI, categoryAPI, likeAPI, saveAPI, commentAPI } from '../contexts/api';
import { useAuth } from '../contexts/AuthContext';

// Types
export interface Recipe {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  cookTime?: string;
  cookTimeMinutes?: number;
  time?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Dễ' | 'Trung bình' | 'Khó';
  rating?: number;
  averageRating?: number;
  ratingCount?: number;
  category?: string | {
    _id?: string;
    name?: string;
  };
  categoryName?: string;
  servings?: string | number;
  author?: {
    _id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  ingredients?: string[];
  steps?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Media fields
  mediaType?: 'image' | 'video';
  videoThumbnail?: string;
  videoUrl?: string;
}

interface RecipesResponse {
  items: Recipe[];
  total: number;
  page: number;
  pages: number;
}

interface UseRecipesReturn {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pages: number;
  hasMore: boolean;
  loadRecipes: (page?: number, search?: string, category?: string, difficulty?: string, minRating?: number) => Promise<void>;
  refreshRecipes: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export const useRecipes = (initialPage = 1, initialSearch = '', initialCategory = '', initialDifficulty = '', initialMinRating?: number): UseRecipesReturn => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [minRating, setMinRating] = useState(initialMinRating);

  const loadRecipes = useCallback(async (newPage = 1, newSearch = '', newCategory = '', newDifficulty = '', newMinRating?: number) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 Loading recipes...', { newPage, newSearch, newCategory, newDifficulty, newMinRating });
      
      // Dùng getAll với filter category, search, difficulty, và rating
      const response = await recipeAPI.getAll(
        newPage, 
        20, 
        newCategory || undefined, 
        undefined, 
        newSearch || undefined,
        newDifficulty || undefined,
        newMinRating
      );
      
      console.log('✅ Recipes response:', response);
      
      // Backend trả về { recipes: [...], total: number, page: number, limit: number }
      const responseData = response.data;
      const recipesData = responseData?.recipes || responseData || [];
      const totalCount = responseData?.total || recipesData.length;
      const currentPage = responseData?.page || newPage;
      const limit = responseData?.limit || 20;
      const totalPages = Math.ceil(totalCount / limit);
      
      // Filter duplicates dựa trên _id trước khi set state
      const uniqueRecipes = Array.isArray(recipesData) 
        ? recipesData.filter((recipe: Recipe, index: number, self: Recipe[]) => 
            index === self.findIndex((r: Recipe) => r._id === recipe._id)
          )
        : [];
      
      if (newPage === 1) {
        setRecipes(uniqueRecipes);
      } else {
        // Khi load more, filter duplicates với recipes hiện tại
        setRecipes(prev => {
          const combined = [...prev, ...uniqueRecipes];
          return combined.filter((recipe: Recipe, index: number, self: Recipe[]) => 
            index === self.findIndex((r: Recipe) => r._id === recipe._id)
          );
        });
      }
      
      setTotal(totalCount);
      setPage(currentPage);
      setPages(totalPages);
      setSearch(newSearch);
      setCategory(newCategory);
      setDifficulty(newDifficulty);
      setMinRating(newMinRating);
      
      console.log('✅ Recipes loaded:', recipesData.length, 'items, total:', totalCount);
    } catch (err) {
      console.error('❌ Error loading recipes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRecipes = useCallback(async () => {
    await loadRecipes(1, search, category, difficulty, minRating);
  }, [loadRecipes, search, category, difficulty, minRating]);

  const loadMore = useCallback(async () => {
    if (page < pages && !loading) {
      await loadRecipes(page + 1, search, category, difficulty, minRating);
    }
  }, [loadRecipes, page, pages, loading, search, category, difficulty, minRating]);

  // Load initial recipes
  useEffect(() => {
    loadRecipes(initialPage, initialSearch, initialCategory, initialDifficulty, initialMinRating);
  }, []);

  return {
    recipes,
    loading,
    error,
    total,
    page,
    pages,
    hasMore: page < pages,
    loadRecipes,
    refreshRecipes,
    loadMore,
  };
};

// Hook for single recipe
export const useRecipe = (id: string) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecipe = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('📥 Loading recipe:', id);
      const response = await recipeAPI.getById(id);
      console.log('📥 Recipe response:', response);
      
      // Backend trả về { message, recipe } hoặc { data: { recipe } }
      const recipeData = response.data?.recipe || response.data || response.recipe || response;
      console.log('📥 Recipe data:', recipeData);
      
      if (!recipeData) {
        throw new Error('Recipe not found');
      }
      
      setRecipe(recipeData);
    } catch (err) {
      console.error('❌ Error loading recipe:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  return { recipe, loading, error, refetch: loadRecipe };
};

// Hook for favorites
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const loadFavorites = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await favoriteAPI.getAll();
      // API trả về { favorites: [...] } - mảng các recipe objects
      const recipes = response.data?.favorites || [];
      // Lấy danh sách recipe IDs
      const recipeIds = recipes.map((recipe: any) => recipe._id || recipe.recipe?._id).filter(Boolean);
      setFavorites(recipeIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const toggleFavorite = useCallback(async (recipeId: string) => {
    if (!token) return;
    
    try {
      setError(null);
      await favoriteAPI.add(recipeId);
      
      // Update local state
      setFavorites(prev => 
        prev.includes(recipeId) 
          ? prev.filter(id => id !== recipeId)
          : [...prev, recipeId]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
    }
  }, [token]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    error,
    toggleFavorite,
    isFavorite: (recipeId: string) => favorites.includes(recipeId),
    refetch: loadFavorites,
  };
};

// Hook for creating/updating recipes
export const useRecipeForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const createRecipe = useCallback(async (recipeData: Partial<Recipe> | FormData, imageUri?: string) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      setLoading(true);
      setError(null);
      const response = await recipeAPI.create(recipeData);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create recipe';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateRecipe = useCallback(async (id: string, recipeData: Partial<Recipe>, imageUri?: string) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      setLoading(true);
      setError(null);
      const response = await recipeAPI.update(id, recipeData);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recipe';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteRecipe = useCallback(async (id: string) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      setLoading(true);
      setError(null);
      await recipeAPI.delete(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete recipe';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    loading,
    error,
    createRecipe,
    updateRecipe,
    deleteRecipe,
  };
};

// Hook for categories
export const useCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryAPI.getAll();
      const categoriesData = response.data?.categories || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('❌ Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    refetch: loadCategories,
  };
};

// Hook for recipe likes
export const useRecipeLikes = (recipeId: string) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const checkLikeStatus = useCallback(async () => {
    if (!recipeId || !user?._id) return;
    
    try {
      setLoading(true);
      const response = await likeAPI.getLikes(recipeId);
      const likes = response.data?.likes || response.data || [];
      const likedUserIds = Array.isArray(likes) ? likes.map((like: any) => 
        typeof like === 'string' ? like : (like.user?._id || like.user || like)
      ) : [];
      
      setIsLiked(likedUserIds.includes(user._id));
      setLikesCount(likedUserIds.length);
    } catch (err) {
      console.error('❌ Error checking like status:', err);
    } finally {
      setLoading(false);
    }
  }, [recipeId, user?._id]);

  const toggleLike = useCallback(async () => {
    if (!recipeId) return;
    
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const response = await likeAPI.toggleLike(recipeId);
      // Cập nhật từ response nếu có
      if (response.data?.isLiked !== undefined) {
        setIsLiked(response.data.isLiked);
      }
      if (response.data?.likesCount !== undefined) {
        setLikesCount(response.data.likesCount);
      } else {
        // Fallback: refresh để lấy số lượng chính xác
        await checkLikeStatus();
      }
    } catch (err: any) {
      // Revert on error
      setIsLiked(!newIsLiked);
      setLikesCount(prev => newIsLiked ? Math.max(0, prev - 1) : prev + 1);
      console.error('❌ Error toggling like:', err);
      // Không throw error để UI không bị crash
    }
  }, [recipeId, isLiked, checkLikeStatus]);

  useEffect(() => {
    checkLikeStatus();
  }, [checkLikeStatus]);

  return {
    isLiked,
    likesCount,
    loading,
    toggleLike,
    refetch: checkLikeStatus,
  };
};

// Hook for recipe saves
export const useRecipeSaves = (recipeId: string) => {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const checkSaveStatus = useCallback(async () => {
    if (!recipeId || !user?._id) {
      setIsSaved(false);
      return;
    }
    
    try {
      setLoading(true);
      // Dùng endpoint check riêng thay vì load tất cả saved recipes
      const response = await saveAPI.checkSaved(recipeId);
      setIsSaved(response.data?.isSaved || false);
    } catch (err: any) {
      // Nếu lỗi 401 và không có user, đây là bình thường (user chưa đăng nhập)
      if (err.response?.status === 401 && !user?._id) {
        setIsSaved(false);
        return;
      }
      
      // Nếu lỗi 401 nhưng có user, có thể token hết hạn
      if (err.response?.status === 401) {
        setIsSaved(false);
        return;
      }
      
      // Các lỗi khác: thử fallback
      try {
        const fallbackResponse = await saveAPI.getSavedRecipes(user._id);
        const savedRecipes = fallbackResponse.data?.recipes || fallbackResponse.data?.savedRecipes || (Array.isArray(fallbackResponse.data) ? fallbackResponse.data : []) || [];
        const savedRecipeIds = Array.isArray(savedRecipes) ? savedRecipes.map((recipe: any) => 
          typeof recipe === 'string' ? recipe : (recipe._id || recipe.recipe?._id || recipe.recipe)
        ) : [];
        setIsSaved(savedRecipeIds.includes(recipeId));
      } catch (fallbackErr: any) {
        // Không log error cho 401 (unauthorized) và 429 (rate limit)
        // Đây là các lỗi bình thường, không cần log
        if (fallbackErr.response?.status !== 401 && fallbackErr.response?.status !== 429) {
          console.error('❌ Error in fallback check:', fallbackErr);
        } else if (fallbackErr.response?.status === 429) {
          // Rate limit - chỉ log warning, không error
          console.warn('⚠️ Rate limit in fallback check, skipping...');
        }
        setIsSaved(false);
      }
    } finally {
      setLoading(false);
    }
  }, [recipeId, user?._id]);

  const toggleSave = useCallback(async () => {
    if (!recipeId) {
      console.warn('⚠️ [toggleSave] No recipeId provided');
      return;
    }
    
    if (!user?._id) {
      console.warn('⚠️ [toggleSave] No user ID, cannot save recipe');
      return;
    }
    
    const previousIsSaved = isSaved;
    const newIsSaved = !isSaved;
    
    console.log('💾 [toggleSave] ========================================');
    console.log('💾 [toggleSave] Toggling save for recipe:', recipeId);
    console.log('💾 [toggleSave] User ID:', user._id);
    console.log('💾 [toggleSave] Current state:', isSaved, 'New state:', newIsSaved);
    
    // Optimistic update
    setIsSaved(newIsSaved);

    try {
      const response = await saveAPI.toggleSave(recipeId);
      console.log('✅ [toggleSave] API response:', response.data);
      console.log('✅ [toggleSave] Response status:', response.status);
      
      // Cập nhật lại state từ response để đảm bảo đồng bộ
      if (response.data?.isSaved !== undefined) {
        setIsSaved(response.data.isSaved);
        console.log('✅ Updated isSaved to:', response.data.isSaved);
      } else {
        // Nếu response không có isSaved, refresh status
        console.log('⚠️ Response không có isSaved, refreshing status...');
        await checkSaveStatus();
      }
    } catch (err: any) {
      // Revert on error
      console.error('❌ Error toggling save:', err);
      setIsSaved(previousIsSaved);
      
      // Hiển thị thông báo lỗi cho user
      if (err.response?.data?.message) {
        console.error('Error message:', err.response.data.message);
      }
      
      // Thử refresh status để đảm bảo đồng bộ
      setTimeout(() => {
        checkSaveStatus();
      }, 1000);
    }
  }, [recipeId, isSaved, checkSaveStatus]);

  useEffect(() => {
    checkSaveStatus();
  }, [checkSaveStatus]);

  return {
    isSaved,
    loading,
    toggleSave,
    refetch: checkSaveStatus,
  };
};

// Hook for recipe comments
export const useRecipeComments = (recipeId: string) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!recipeId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await commentAPI.getComments(recipeId);
      const commentsData = response.data?.comments || response.data || [];
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (err) {
      console.error('❌ Error loading comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  const addComment = useCallback(async (text: string, imageUri?: string | null) => {
    if (!recipeId || !text.trim()) return;
    
    try {
      await commentAPI.addComment(recipeId, text.trim(), imageUri);
      await loadComments(); // Reload comments
    } catch (err) {
      console.error('❌ Error adding comment:', err);
      throw err;
    }
  }, [recipeId, loadComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await commentAPI.deleteComment(commentId);
      await loadComments(); // Reload comments
    } catch (err) {
      console.error('❌ Error deleting comment:', err);
      throw err;
    }
  }, [loadComments]);

  const replyComment = useCallback(async (commentId: string, text: string) => {
    try {
      await commentAPI.replyComment(commentId, text.trim());
      await loadComments(); // Reload comments
    } catch (err) {
      console.error('❌ Error replying to comment:', err);
      throw err;
    }
  }, [loadComments]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    replyComment,
    refetch: loadComments,
  };
};
