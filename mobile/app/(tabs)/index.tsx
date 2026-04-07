import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity,
  Image, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useChatUnread } from '@/contexts/ChatUnreadContext';
import { recipeAPI, postAPI, homepageAPI } from '@/contexts/api';
import { useRecipes, useFavorites, useRecipeSaves, Recipe } from '@/hooks/useRecipes';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { LinearGradient } from 'expo-linear-gradient';
import { debounce, filterRecipes } from '@/utils/searchUtils';
import { storage } from '@/contexts/storage';

// Components tách riêng
import {
  FeaturedRecipeCard, RecipeCard, RecentRecipeCard,
  CategoryCard, CommunityPostCard, GuideCard,
  SearchResultItem, DietaryModal,
  DIETARY_FILTERS, RECIPE_CATEGORIES, SPECIAL_GUIDES,
  Category, Post,
} from '@/components/home';
import { MAX_HOME_CONTENT_WIDTH } from '@/components/home/homeLayout';

export default function HomeScreen() {
  const { user } = useAuth();
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const { unreadCount: chatUnreadCount } = useChatUnread();
  const totalUnreadCount = (notificationUnreadCount || 0) + (chatUnreadCount || 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDietary, setSelectedDietary] = useState('all');
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<any[]>([]);
  const [communityRecipes, setCommunityRecipes] = useState<any[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<any[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<any[]>([]);
  const [viewedRecipes, setViewedRecipes] = useState<any[]>([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState<any[]>([]);
  const [featuredRecipe, setFeaturedRecipe] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const { recipes, loading: recipesLoading, refreshRecipes } = useRecipes(1, searchQuery, '');
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  // --- Dietary filter logic ---
  const filterRecipesByDietary = useCallback((recipes: any[], dietary: string, diets: string[] = [], ingredients: string[] = []) => {
    let filtered = recipes;

    if (dietary !== 'all') {
      filtered = filtered.filter((recipe) => {
        const title = (recipe.title || '').toLowerCase();
        const description = (recipe.description || '').toLowerCase();
        const tags = (recipe.tags || []).map((tag: string) => tag.toLowerCase());
        const category = (recipe.categoryName || recipe.category?.name || '').toLowerCase();
        const searchText = `${title} ${description} ${tags.join(' ')} ${category}`;

        switch (dietary) {
          case 'vegan': return searchText.includes('vegan') || searchText.includes('thuần chay') || searchText.includes('chay') || tags.includes('vegan');
          case 'vegetarian': return searchText.includes('vegetarian') || searchText.includes('chay') || tags.includes('vegetarian');
          case 'gluten-free': return searchText.includes('gluten-free') || searchText.includes('không gluten') || tags.includes('gluten-free');
          case 'keto': return searchText.includes('keto') || tags.includes('keto');
          case 'low-carb': return searchText.includes('low-carb') || searchText.includes('ít tinh bột') || tags.includes('low-carb');
          default: return true;
        }
      });
    }

    if (diets.length > 0) {
      filtered = filtered.filter((recipe) => {
        const title = (recipe.title || '').toLowerCase();
        const description = (recipe.description || '').toLowerCase();
        const tags = (recipe.tags || []).map((tag: string) => tag.toLowerCase());
        const category = (recipe.categoryName || recipe.category?.name || '').toLowerCase();
        const searchText = `${title} ${description} ${tags.join(' ')} ${category}`;

        return diets.some(diet => {
          const dietMap: { [key: string]: string[] } = {
            'vegan': ['vegan', 'thuần chay', 'thuan chay'],
            'vegetarian': ['vegetarian', 'chay', 'món chay'],
            'keto': ['keto'],
            'gluten-free': ['gluten-free', 'không gluten', 'khong gluten'],
            'dairy-free': ['dairy-free', 'không sữa', 'khong sua'],
            'low-carb': ['low-carb', 'ít tinh bột', 'it tinh bot'],
          };
          const keywords = dietMap[diet.toLowerCase()] || [diet.toLowerCase()];
          return keywords.some(keyword => searchText.includes(keyword) || tags.includes(keyword));
        });
      });
    }

    if (ingredients.length > 0) {
      filtered = filtered.filter((recipe) => {
        const ingredientsList = (recipe.ingredients || []).map((ing: string) => ing.toLowerCase());
        const title = (recipe.title || '').toLowerCase();
        const description = (recipe.description || '').toLowerCase();
        const searchText = `${title} ${description} ${ingredientsList.join(' ')}`;

        const ingredientMap: { [key: string]: string[] } = {
          'pork': ['thịt heo', 'thịt lợn', 'thit heo', 'thit lon', 'pork', 'giò heo', 'gio heo', 'sườn heo', 'suon heo'],
          'chicken': ['thịt gà', 'thit ga', 'chicken'],
          'beef': ['thịt bò', 'thit bo', 'beef', 'xương bò', 'xuong bo'],
          'seafood': ['hải sản', 'hai san', 'seafood', 'tôm', 'cá', 'tom', 'ca', 'tôm sú', 'tom su', 'chả cua', 'cha cua'],
          'dairy': ['sữa', 'sua', 'dairy', 'milk', 'bơ', 'bo', 'butter', 'sốt mayonnaise', 'sot mayonnaise', 'pate'],
          'eggs': ['trứng', 'trung', 'egg', 'trứng gà', 'trung ga'],
          'peanuts': ['đậu phộng', 'dau phong', 'peanut', 'lạc', 'lac', 'lạc rang', 'lac rang'],
          'soy': ['đậu nành', 'dau nanh', 'soy', 'đậu phụ', 'dau phu', 'tofu', 'nước tương', 'nuoc tuong'],
          'gluten': ['gluten', 'bột mì', 'bot mi', 'wheat', 'bánh mì', 'banh mi', 'bánh phở', 'banh pho', 'bún', 'bun', 'bột bánh', 'bot banh'],
        };

        return !ingredients.some(ingredient => {
          const keywords = ingredientMap[ingredient.toLowerCase()] || [ingredient.toLowerCase()];
          return keywords.some(keyword => searchText.includes(keyword) || ingredientsList.some((ing: string) => ing.includes(keyword)));
        });
      });
    }

    return filtered;
  }, []);

  // --- Data loading ---
  const [homepageSections, setHomepageSections] = useState<any[]>([]);
  const [categorySection, setCategorySection] = useState<any>(null);

  const loadTrendingRecipes = useCallback(async () => {
    try {
      try {
        const sectionsResponse = await homepageAPI.getSections();
        const sections = sectionsResponse.data?.sections || [];
        setHomepageSections(sections);

        const cozySection = sections.find((s: any) =>
          s.title?.toLowerCase().includes('ấm cúng') ||
          s.title?.toLowerCase().includes('đêm lạnh') ||
          (s.type === 'category' && s.subCategories && s.subCategories.length > 0)
        );
        if (cozySection) setCategorySection(cozySection);

        const hotSection = sections.find((s: any) =>
          s.title?.toLowerCase().includes('hot') ||
          s.title?.toLowerCase().includes('đang hot') ||
          s.type === 'recipe-list'
        );
        if (hotSection && hotSection.recipes && hotSection.recipes.length > 0) {
          const filtered = filterRecipesByDietary(hotSection.recipes, selectedDietary, selectedDiets, selectedIngredients);
          setTrendingRecipes(filtered.slice(0, 6));
          return;
        }
      } catch (sectionsError: unknown) {
        const errorMessage = sectionsError instanceof Error ? sectionsError.message : 'Unknown error';
        console.log('⚠️ Could not load homepage sections, using fallback:', errorMessage);
      }

      const response = await recipeAPI.getAll(1, 20);
      const allRecipes = response.data?.recipes || response.data || [];
      const filtered = filterRecipesByDietary(allRecipes, selectedDietary, selectedDiets, selectedIngredients);
      const sorted = [...filtered].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 6);
      setTrendingRecipes(sorted);
    } catch (error) { console.error('Error loading trending recipes:', error); }
  }, [selectedDietary, selectedDiets, selectedIngredients, filterRecipesByDietary]);

  const loadPopularRecipes = useCallback(async () => {
    try {
      const response = await recipeAPI.getAll(1, 20);
      const allRecipes = response.data?.recipes || response.data || [];
      const filtered = filterRecipesByDietary(allRecipes, selectedDietary, selectedDiets, selectedIngredients);
      const sorted = [...filtered].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0)).slice(0, 8);
      setPopularRecipes(sorted);
    } catch (error) { console.error('Error loading popular recipes:', error); }
  }, [selectedDietary, selectedDiets, selectedIngredients, filterRecipesByDietary]);

  const loadRecentRecipes = useCallback(async () => {
    try {
      const response = await recipeAPI.getAll(1, 20);
      const allRecipes = response.data?.recipes || response.data || [];
      const filtered = filterRecipesByDietary(allRecipes, selectedDietary, selectedDiets, selectedIngredients);
      const sorted = [...filtered].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 6);
      setRecentRecipes(sorted);
    } catch (error) { console.error('Error loading recent recipes:', error); }
  }, [selectedDietary, selectedDiets, selectedIngredients, filterRecipesByDietary]);

  const loadFeaturedRecipe = useCallback(async () => {
    try {
      const response = await recipeAPI.getAll(1, 1);
      const allRecipes = response.data?.recipes || response.data || [];
      if (allRecipes.length > 0) setFeaturedRecipe(allRecipes[0]);
    } catch (error) { console.error('Error loading featured recipe:', error); }
  }, []);

  const loadCommunityRecipes = useCallback(async () => {
    try {
      const response = await postAPI.getAll(1, 6);
      const posts = response.data?.posts || [];
      setCommunityRecipes(posts);
    } catch (error: any) {
      if (error.response?.status === 401 && !user) {
        setCommunityRecipes([]);
      } else {
        console.error('Error loading community recipes:', error);
      }
    }
  }, [user]);

  const loadViewedRecipes = useCallback(async () => {
    try {
      if (!user) return;
      const response = await recipeAPI.getViewed(1, 10);
      setViewedRecipes(response.data?.recipes || []);
    } catch (error) { console.error('❌ Error loading viewed recipes:', error); }
  }, [user]);

  const loadRecommendedRecipes = useCallback(async () => {
    try {
      if (!user) return;
      const response = await recipeAPI.getRecommended(1, 10);
      setRecommendedRecipes(response.data?.recipes || []);
    } catch (error) { console.error('Error loading recommended recipes:', error); }
  }, [user]);

  const getSearchSuggestions = useCallback((query: string) => {
    if (!query || query.length < 2) { setSearchSuggestions([]); return; }
    const suggestions = ['Phở bò', 'Bánh mì', 'Bún chả', 'Cơm tấm', 'Bánh xèo', 'Gỏi cuốn', 'Bún bò Huế', 'Cao lầu']
      .filter((item) => item.toLowerCase().includes(query.toLowerCase()));
    setSearchSuggestions(suggestions.slice(0, 5));
  }, []);

  const loadHomepageSections = useCallback(async () => {
    try {
      const sectionsResponse = await homepageAPI.getSections();
      const sections = sectionsResponse.data?.sections || [];
      setHomepageSections(sections);
      const cozySection = sections.find((s: any) =>
        s.title?.toLowerCase().includes('ấm cúng') ||
        s.title?.toLowerCase().includes('đêm lạnh') ||
        (s.type === 'category' && s.subCategories && s.subCategories.length > 0)
      );
      if (cozySection) setCategorySection(cozySection);
    } catch (error) { console.error('Error loading homepage sections:', error); }
  }, []);

  // --- Effects ---
  useEffect(() => {
    const loadDietaryPreferences = async () => {
      try {
        const preferences = await storage.getDietaryPreferences();
        if (preferences) {
          setSelectedDiets(preferences.diets || []);
          setSelectedIngredients(preferences.ingredients || []);
        }
      } catch (error) { console.error('Error loading dietary preferences:', error); }
    };
    loadDietaryPreferences();
  }, []);

  useEffect(() => {
    const savePreferences = async () => {
      if (selectedDiets.length > 0 || selectedIngredients.length > 0) {
        await storage.saveDietaryPreferences({ diets: selectedDiets, ingredients: selectedIngredients });
      }
    };
    savePreferences();
  }, [selectedDiets, selectedIngredients]);

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        loadHomepageSections(), loadTrendingRecipes(), loadCommunityRecipes(),
        loadPopularRecipes(), loadRecentRecipes(), loadFeaturedRecipe(),
        loadViewedRecipes(), loadRecommendedRecipes(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, [selectedDietary, selectedDiets, selectedIngredients, user, loadHomepageSections]);

  useEffect(() => {
    if (!loading) { loadTrendingRecipes(); loadPopularRecipes(); loadRecentRecipes(); }
  }, [selectedDietary]);

  useEffect(() => { getSearchSuggestions(searchQuery); }, [searchQuery, getSearchSuggestions]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshRecipes(), loadTrendingRecipes(), loadCommunityRecipes(),
      loadPopularRecipes(), loadRecentRecipes(), loadFeaturedRecipe(),
      loadViewedRecipes(), loadRecommendedRecipes(),
    ]);
    setRefreshing(false);
  }, [refreshRecipes, loadTrendingRecipes, loadCommunityRecipes, loadPopularRecipes, loadRecentRecipes, loadFeaturedRecipe, loadViewedRecipes, loadRecommendedRecipes]);

  // --- Search ---
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      if (query.trim()) router.push(`/(tabs)/recipes?search=${encodeURIComponent(query.trim())}`);
    }, 400), []
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const allRecipesForSearch = useMemo(() => {
    const allRecipes: any[] = [];
    if (trendingRecipes.length > 0) allRecipes.push(...trendingRecipes);
    if (popularRecipes.length > 0) allRecipes.push(...popularRecipes);
    if (recentRecipes.length > 0) allRecipes.push(...recentRecipes);
    if (viewedRecipes.length > 0) allRecipes.push(...viewedRecipes);
    if (recommendedRecipes.length > 0) allRecipes.push(...recommendedRecipes);
    if (featuredRecipe) allRecipes.push(featuredRecipe);
    return allRecipes.filter((recipe, index, self) => index === self.findIndex((r) => r._id === recipe._id));
  }, [trendingRecipes, popularRecipes, recentRecipes, viewedRecipes, recommendedRecipes, featuredRecipe]);

  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filterRecipes(allRecipesForSearch, {
      searchQuery: searchQuery.trim(), dietary: selectedDietary,
      diets: selectedDiets, ingredients: selectedIngredients,
    });
  }, [searchQuery, allRecipesForSearch, selectedDietary, selectedDiets, selectedIngredients]);

  const trendingIds = useMemo(() => new Set(trendingRecipes.map((r) => r._id)), [trendingRecipes]);
  const popularWithoutTrending = useMemo(
    () => popularRecipes.filter((r) => !trendingIds.has(r._id)),
    [popularRecipes, trendingIds]
  );

  const handleRecipePress = (recipeId: string) => router.push(`/modal?id=${recipeId}`);

  // --- Render ---
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS === 'web' && styles.scrollContentWeb,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF8C42" />}
      >
        <View
          style={[
            styles.pageInner,
            Platform.OS === 'web' && { maxWidth: MAX_HOME_CONTENT_WIDTH, alignSelf: 'center' as const },
          ]}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoContainer} onPress={() => router.push('/ai-chat')}>
            <View style={styles.logo}><Text style={styles.logoEmoji}>👨‍🍳</Text></View>
          </TouchableOpacity>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm Foodie"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              onSubmitEditing={() => handleSearch(searchQuery)}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(tabs)/profile')}>
            <View style={styles.profileAvatarContainer}>
              {user?.avatarUrl ? (
                <Image source={{ uri: normalizeImageUrl(user.avatarUrl) || user.avatarUrl }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  <Ionicons name="person" size={18} color="#FF8C42" />
                </View>
              )}
              {user?.role === 'creator' && (
                <View style={styles.profileCreatorBadge}>
                  <LinearGradient colors={['#FFD43B', '#FFB300']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileCreatorBadgeGradient}>
                    <Ionicons name="restaurant" size={6} color="#FFFFFF" />
                  </LinearGradient>
                </View>
              )}
              {totalUnreadCount > 0 && (
                <View style={styles.profileNotificationBadge}>
                  <Text style={styles.profileNotificationBadgeText}>{totalUnreadCount > 9 ? '9+' : totalUnreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Dietary Preferences */}
        <View style={styles.dietaryLinkContainer}>
          <TouchableOpacity style={styles.dietaryLink} onPress={() => setShowDietaryModal(true)}>
            <Ionicons name="options" size={16} color="#FF8C42" />
            <Text style={styles.dietaryLinkText}>Tùy chọn dinh dưỡng</Text>
            {(selectedDiets.length > 0 || selectedIngredients.length > 0) && (
              <View style={styles.dietaryBadge}>
                <Text style={styles.dietaryBadgeText}>{selectedDiets.length + selectedIngredients.length} đã chọn</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Dietary Filters */}
        {selectedDietary !== 'all' && (
          <View style={styles.dietaryFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dietaryFiltersScroll}>
              {DIETARY_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.dietaryFilterChip, selectedDietary === filter.id && styles.dietaryFilterChipActive, { borderColor: filter.color }]}
                  onPress={() => setSelectedDietary(filter.id)}
                >
                  <Ionicons name={filter.icon as any} size={16} color={selectedDietary === filter.id ? '#FFFFFF' : filter.color} />
                  <Text style={[styles.dietaryFilterChipText, selectedDietary === filter.id && styles.dietaryFilterChipTextActive, { color: selectedDietary === filter.id ? '#FFFFFF' : filter.color }]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Dietary Modal */}
        <DietaryModal
          visible={showDietaryModal}
          selectedDiets={selectedDiets}
          selectedIngredients={selectedIngredients}
          onChangeDiets={setSelectedDiets}
          onChangeIngredients={setSelectedIngredients}
          onClose={() => setShowDietaryModal(false)}
        />

        {/* Featured Recipe */}
        {featuredRecipe && !searchQuery.trim() && (
          <View style={styles.section}>
            <FeaturedRecipeCard recipe={featuredRecipe} onPress={handleRecipePress} />
          </View>
        )}

        {/* Categories (API) */}
        {categorySection && !searchQuery.trim() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{categorySection.title}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {categorySection.subCategories && categorySection.subCategories.length > 0 ? (
                categorySection.subCategories
                  .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                  .map((subCat: any) => (
                    <CategoryCard
                      key={subCat._id}
                      sectionId={categorySection?._id || categorySection?.id}
                      category={{
                        id: subCat._id, title: subCat.title, subtitle: '',
                        icon: subCat.icon || '🍽️', color: subCat.color || '#FF8C42',
                        gradient: [subCat.color || '#FF8C42', (subCat.color || '#FF8C42') + 'CC'],
                        recipes: subCat.recipes || [],
                        style: subCat.style || {
                          borderWidth: 1, borderColor: subCat.color || '#FF8C42', borderRadius: 20,
                          backgroundLayer: { enabled: true, color: '#FFE66D', offset: 8, borderRadius: 20 },
                        },
                      }}
                    />
                  ))
              ) : (
                RECIPE_CATEGORIES.map((cat) => <CategoryCard key={cat.id} category={cat} />)
              )}
            </ScrollView>
          </View>
        )}

        {/* Fallback Categories */}
        {!categorySection && !searchQuery.trim() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Món ăn ấm cúng cho đêm lạnh</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
              {RECIPE_CATEGORIES.map((cat) => <CategoryCard key={cat.id} category={cat} />)}
            </ScrollView>
          </View>
        )}

        {/* Search Results */}
        {searchQuery.trim() && (
          <View style={styles.searchResultsSection}>
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsTitle}>Kết quả tìm kiếm</Text>
              {filteredSearchResults.length > 0 && (
                <TouchableOpacity onPress={() => router.push(`/(tabs)/recipes?search=${encodeURIComponent(searchQuery.trim())}`)}>
                  <Text style={styles.searchResultsSeeAll}>Xem tất cả</Text>
                </TouchableOpacity>
              )}
            </View>
            {filteredSearchResults.length > 0 ? (
              <View style={styles.searchResultsList}>
                {filteredSearchResults.map((recipe) => <SearchResultItem key={recipe._id} recipe={recipe} onPress={handleRecipePress} />)}
              </View>
            ) : (
              <View style={styles.emptySearchContainer}>
                <Ionicons name="search-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptySearchText}>Không tìm thấy công thức nào</Text>
                <Text style={styles.emptySearchSubtext}>Thử tìm kiếm với từ khóa khác</Text>
              </View>
            )}
          </View>
        )}

        {/* Trending */}
        {!searchQuery.trim() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Công thức đang hot</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/recipes')}><Text style={styles.sectionSeeAll}>Xem tất cả</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingContainer}>
              {trendingRecipes.map((recipe, index) => <RecipeCard key={recipe._id} recipe={recipe} index={index} onPress={handleRecipePress} />)}
            </ScrollView>
          </View>
        )}

        {/* Community */}
        {!searchQuery.trim() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cộng đồng đang nấu gì!</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}><Text style={styles.sectionSeeAll}>Xem thêm cộng đồng {'>'}</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.communityContainer}>
              {communityRecipes.map((post) => <CommunityPostCard key={post._id} post={post} />)}
            </ScrollView>
          </View>
        )}

        {/* Popular */}
        {!searchQuery.trim() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Công thức phổ biến tuần này</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/recipes')}><Text style={styles.sectionSeeAll}>Xem tất cả</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingContainer}>
              {(popularWithoutTrending.length > 0 ? popularWithoutTrending : popularRecipes).map((recipe, index) => (
                <RecipeCard key={recipe._id} recipe={recipe} index={index} onPress={handleRecipePress} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Viewed Recipes */}
        {user && !searchQuery.trim() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Công thức bạn đã xem</Text>
              {viewedRecipes.length > 0 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/recipes')}><Text style={styles.sectionSeeAll}>Xem tất cả</Text></TouchableOpacity>
              )}
            </View>
            {viewedRecipes.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingContainer}>
                {viewedRecipes.map((recipe, index) => <RecipeCard key={recipe._id} recipe={recipe} index={index} onPress={handleRecipePress} />)}
              </ScrollView>
            ) : (
              <View style={styles.emptyStateContainer}><Text style={styles.emptyStateText}>Bạn chưa xem công thức nào. Hãy khám phá các công thức mới!</Text></View>
            )}
          </View>
        )}

        {/* Recommended */}
        {user && !searchQuery.trim() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Dành cho bạn từ món đã lưu</Text>
              {recommendedRecipes.length > 0 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/recipes')}><Text style={styles.sectionSeeAll}>Xem tất cả</Text></TouchableOpacity>
              )}
            </View>
            {recommendedRecipes.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingContainer}>
                {recommendedRecipes.map((recipe, index) => <RecipeCard key={recipe._id} recipe={recipe} index={index} onPress={handleRecipePress} />)}
              </ScrollView>
            ) : (
              <View style={styles.emptyStateContainer}><Text style={styles.emptyStateText}>Lưu công thức yêu thích để nhận gợi ý phù hợp với bạn!</Text></View>
            )}
          </View>
        )}

        {/* Guides */}
        {!searchQuery.trim() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hướng dẫn</Text>
              <TouchableOpacity><Text style={styles.sectionSeeAll}>Xem thêm hướng dẫn {'>'}</Text></TouchableOpacity>
            </View>
            <View style={styles.guidesContainer}>
              {SPECIAL_GUIDES.map((guide) => <GuideCard key={guide.id} guide={guide} />)}
            </View>
          </View>
        )}

        {/* Recent */}
        {!searchQuery.trim() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gần đây</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/recipes')}><Text style={styles.sectionSeeAll}>Xem tất cả</Text></TouchableOpacity>
            </View>
            <View style={styles.recentGrid}>
              {recentRecipes.slice(0, 4).map((recipe) => <RecentRecipeCard key={recipe._id} recipe={recipe} onPress={handleRecipePress} />)}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  scrollContentWeb: { width: '100%' },
  pageInner: { width: '100%' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  logoContainer: { marginRight: 12 },
  logo: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF8C42',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF',
    shadowColor: '#FF8C42', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  logoEmoji: { fontSize: 24 },
  searchBarContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F9FA', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, marginRight: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: '#1A1A1A' },
  profileButton: { width: 40, height: 40, borderRadius: 20 },
  profileAvatarContainer: { width: 40, height: 40, borderRadius: 20, position: 'relative' },
  profileAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#F0F0F0' },
  profileAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  profileCreatorBadge: {
    position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: 7,
    borderWidth: 1.5, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3, overflow: 'hidden',
  },
  profileCreatorBadgeGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 6.5 },
  profileNotificationBadge: {
    position: 'absolute', top: -2, right: -2, backgroundColor: '#FF8C42',
    borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: '#FFFFFF', zIndex: 10,
  },
  profileNotificationBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  dietaryLinkContainer: { paddingHorizontal: 16, paddingVertical: 14, alignItems: 'stretch' },
  dietaryLink: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-end',
    backgroundColor: '#FFF8F3', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
    borderWidth: 1, borderColor: '#FFE4D4',
  },
  dietaryLinkText: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold', color: '#FF8C42', marginLeft: 6 },
  dietaryBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#FF8C42' },
  dietaryBadgeText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  dietaryFiltersContainer: { paddingVertical: 12, backgroundColor: '#F8F9FA', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dietaryFiltersScroll: { paddingHorizontal: 16, gap: 10 },
  dietaryFilterChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 2, gap: 6, marginRight: 8,
  },
  dietaryFilterChipActive: { backgroundColor: '#FF8C42' },
  dietaryFilterChipText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  dietaryFilterChipTextActive: { color: '#FFFFFF' },
  section: { marginTop: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    paddingLeft: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C42',
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#1A1A1A', letterSpacing: -0.3 },
  sectionSeeAll: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold', color: '#FF8C42', marginBottom: 2 },
  categoriesContainer: { paddingHorizontal: 16, paddingRight: 24, gap: 0, alignItems: 'flex-start' },
  trendingContainer: { paddingLeft: 16, paddingRight: 8 },
  communityContainer: { paddingLeft: 16, paddingRight: 8 },
  guidesContainer: { paddingHorizontal: 16, gap: 12 },
  recentGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  bottomPadding: { height: 100 },
  emptyStateContainer: { paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  emptySearchContainer: { padding: 60, alignItems: 'center', justifyContent: 'center' },
  emptySearchText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#1A1A1A', textAlign: 'center', marginTop: 16, marginBottom: 8 },
  emptySearchSubtext: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#666', textAlign: 'center' },
  searchResultsSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  searchResultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  searchResultsTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#1A1A1A' },
  searchResultsSeeAll: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#FF8C42' },
  searchResultsList: { gap: 0 },
});
