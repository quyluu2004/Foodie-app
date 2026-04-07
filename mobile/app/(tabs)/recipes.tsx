import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, TextInput, Modal, Pressable, Dimensions, Platform, useWindowDimensions } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { router, useFocusEffect } from 'expo-router';
import React from 'react';
import { useRecipes, useFavorites, useCategories, useRecipeSaves } from '@/hooks/useRecipes';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { LinearGradient } from 'expo-linear-gradient';
import { debounce } from '@/utils/searchUtils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const LIST_MAX_WIDTH = 720;

const RecipeCard = ({ recipe, onPress }: { recipe: any; onPress: () => void }) => {
  const { width: winW } = useWindowDimensions();
  const { isSaved, toggleSave } = useRecipeSaves(recipe._id);
  const categoryName = recipe.categoryName || recipe.category?.name || recipe.category || 'Chưa phân loại';

  const listW = Platform.OS === 'web' ? Math.min(winW, LIST_MAX_WIDTH) : winW;
  const thumbW = Math.round(Math.min(Math.max(listW * 0.3, 116), 142));
  const thumbH = Math.round(thumbW * 1.22);

  const imageUri =
    recipe.mediaType === 'video' && recipe.videoThumbnail
      ? recipe.videoThumbnail
      : recipe.imageUrl
        ? normalizeImageUrl(recipe.imageUrl, recipe.updatedAt) || recipe.imageUrl
        : null;

  return (
    <TouchableOpacity style={styles.recipeCard} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.recipeRow}>
        <View style={[styles.recipeThumbWrap, { width: thumbW, height: thumbH }]}>
          <ImageWithFallback
            imageUrl={imageUri}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            fallbackIcon="restaurant-outline"
            fallbackIconSize={36}
          />
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleSave();
            }}
          >
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color="#FF8C42" />
          </TouchableOpacity>
        </View>

        <View style={styles.recipeBody}>
          <View style={styles.recipeBodyTop}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText} numberOfLines={1}>{categoryName}</Text>
            </View>
            <Text style={styles.recipeTitle} numberOfLines={2}>
              {recipe.title}
            </Text>
            <View style={styles.recipeMeta}>
              <Ionicons name="time-outline" size={15} color="#888" />
              <Text style={styles.recipeMetaText}>
                {recipe.cookTimeMinutes || recipe.time || recipe.cookTime || '—'} phút
              </Text>
              {recipe.commentCount > 0 && (
                <>
                  <Text style={styles.metaDot}>·</Text>
                  <Ionicons name="chatbubble-outline" size={14} color="#888" />
                  <Text style={styles.recipeMetaText}>{recipe.commentCount}</Text>
                </>
              )}
            </View>
          </View>

          {recipe.author && (
            <View style={styles.authorRow}>
              <View style={styles.recipeAuthorAvatarWrapper}>
                {recipe.author.avatarUrl ? (
                  <Image
                    source={{ uri: normalizeImageUrl(recipe.author.avatarUrl) || recipe.author.avatarUrl }}
                    style={styles.authorAvatarSmall}
                  />
                ) : (
                  <View style={[styles.authorAvatarSmall, styles.authorAvatarPlaceholder]}>
                    <Ionicons name="person" size={12} color="#999" />
                  </View>
                )}
                {recipe.author?.role === 'creator' && (
                  <View style={styles.recipeCreatorBadge}>
                    <LinearGradient
                      colors={['#FFD43B', '#FFB300']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.recipeCreatorBadgeGradient}
                    >
                      <Ionicons name="restaurant" size={5} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                )}
              </View>
              <Text style={styles.authorNameSmall} numberOfLines={1}>
                {recipe.author.name || recipe.author.email || 'Người dùng'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function RecipesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Tất cả');
  const [selectedMinRating, setSelectedMinRating] = useState<number | undefined>(undefined);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const { user } = useAuth();
  
  const {
    recipes,
    loading,
    error,
    total,
    hasMore,
    loadRecipes,
    refreshRecipes,
    loadMore,
  } = useRecipes(
    1, 
    searchQuery, 
    selectedCategory === 'Tất cả' ? '' : selectedCategory,
    selectedDifficulty === 'Tất cả' ? '' : selectedDifficulty,
    selectedMinRating
  );

  const { categories, loading: categoriesLoading } = useCategories();
  
  // Tạo danh sách categories với "Tất cả" ở đầu
  const categoryOrder = [
    'Món chính',
    'Món khai vị', 
    'Món nước',
    'Món chiên',
    'Món xào',
    'Món nướng',
    'Món hấp',
    'Món chay',
    'Món tráng miệng',
    'Món ăn vặt'
  ];
  
  const categoryNames = categories.map((cat: any) => cat.name || cat);
  const sortedCategories = categoryOrder.filter(cat => categoryNames.includes(cat));
  const otherCategories = categoryNames.filter(cat => !categoryOrder.includes(cat));
  const allCategories = ['Tất cả', ...sortedCategories, ...otherCategories];

  // Refresh recipes khi quay lại trang này (sau khi tạo công thức mới)
  useFocusEffect(
    React.useCallback(() => {
      refreshRecipes();
    }, [refreshRecipes])
  );

  const handleRecipePress = (recipeId: string) => {
    router.push(`/modal?id=${recipeId}`);
  };

  const handleCategoryChange = (category: string, closeSheet = false) => {
    setSelectedCategory(category);
    const difficulty = selectedDifficulty === 'Tất cả' ? '' : selectedDifficulty;
    loadRecipes(1, searchQuery, category === 'Tất cả' ? '' : category, difficulty, selectedMinRating);
    if (closeSheet) {
      setShowFilterSheet(false);
    }
  };

  const handleDifficultyChange = (difficulty: string, closeSheet = false) => {
    setSelectedDifficulty(difficulty);
    const category = selectedCategory === 'Tất cả' ? '' : selectedCategory;
    loadRecipes(1, searchQuery, category, difficulty === 'Tất cả' ? '' : difficulty, selectedMinRating);
    if (closeSheet) {
      setShowFilterSheet(false);
    }
  };

  const handleRatingChange = (rating: number | undefined, closeSheet = false) => {
    setSelectedMinRating(rating);
    const category = selectedCategory === 'Tất cả' ? '' : selectedCategory;
    const difficulty = selectedDifficulty === 'Tất cả' ? '' : selectedDifficulty;
    loadRecipes(1, searchQuery, category, difficulty, rating);
    if (closeSheet) {
      setShowFilterSheet(false);
    }
  };

  // Debounced search để tối ưu performance
  const debouncedLoadRecipes = useMemo(
    () => debounce((query: string, category: string, difficulty: string, minRating?: number) => {
      loadRecipes(1, query, category, difficulty, minRating);
    }, 500),
    [loadRecipes]
  );
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const category = selectedCategory === 'Tất cả' ? '' : selectedCategory;
    const difficulty = selectedDifficulty === 'Tất cả' ? '' : selectedDifficulty;
    debouncedLoadRecipes(query, category, difficulty, selectedMinRating);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Công thức</Text>
        </View>

        {/* Search Bar with Filter Button */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm công thức..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterSheet(true)}
          >
            <Ionicons name="options-outline" size={20} color="#FF8C42" />
            {(selectedCategory !== 'Tất cả' || selectedDifficulty !== 'Tất cả' || selectedMinRating !== undefined) && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>

        {/* Recipes List */}
        <ScrollView
          style={styles.recipesList}
          contentContainerStyle={[
            styles.recipesListContent,
            Platform.OS === 'web' && styles.recipesListContentWeb,
          ]}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshRecipes} tintColor="#FF8C42" />
          }
          onScrollEndDrag={() => {
            if (hasMore && !loading) {
              loadMore();
            }
          }}
        >
          {loading && recipes.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : recipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>Chưa có công thức nào</Text>
            </View>
          ) : (
            <View style={styles.recipesGrid}>
              {recipes.map((recipe, index) => (
                <RecipeCard
                  key={`${recipe._id}-${index}`}
                  recipe={recipe}
                  onPress={() => handleRecipePress(recipe._id)}
                />
              ))}
            </View>
          )}

          {loading && recipes.length > 0 && (
            <View style={styles.loadingMoreContainer}>
              <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
            </View>
          )}
        </ScrollView>

        {/* Filter Bottom Sheet */}
        <Modal
          visible={showFilterSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFilterSheet(false)}
        >
          <View style={styles.bottomSheetOverlay}>
            <Pressable
              style={styles.bottomSheetOverlayPressable}
              onPress={() => setShowFilterSheet(false)}
            />
            <View style={styles.bottomSheetContent}>
              {/* Handle */}
              <View style={styles.bottomSheetHandle} />
              
              {/* Header */}
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Bộ lọc</Text>
                <TouchableOpacity onPress={() => setShowFilterSheet(false)}>
                  <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.bottomSheetBody} 
                contentContainerStyle={styles.bottomSheetBodyContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {/* Category Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Loại món</Text>
                  <View style={styles.filterGrid}>
                    {allCategories && allCategories.length > 0 ? allCategories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.filterGridItem,
                          selectedCategory === category && styles.filterGridItemActive,
                        ]}
                        onPress={() => handleCategoryChange(category, true)}
                      >
                        <Text
                          style={[
                            styles.filterGridItemText,
                            selectedCategory === category && styles.filterGridItemTextActive,
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    )) : (
                      <Text style={styles.emptyFilterText}>Đang tải...</Text>
                    )}
                  </View>
                </View>

                {/* Difficulty Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Độ khó</Text>
                  <View style={styles.filterGrid}>
                    {['Tất cả', 'Dễ', 'Trung bình', 'Khó'].map((difficulty) => (
                      <TouchableOpacity
                        key={difficulty}
                        style={[
                          styles.filterGridItem,
                          selectedDifficulty === difficulty && styles.filterGridItemActive,
                        ]}
                        onPress={() => handleDifficultyChange(difficulty, true)}
                      >
                        <Text
                          style={[
                            styles.filterGridItemText,
                            selectedDifficulty === difficulty && styles.filterGridItemTextActive,
                          ]}
                        >
                          {difficulty}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Rating Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Đánh giá</Text>
                  <View style={styles.filterGrid}>
                    <TouchableOpacity
                      style={[
                        styles.filterGridItem,
                        selectedMinRating === undefined && styles.filterGridItemActive,
                      ]}
                      onPress={() => handleRatingChange(undefined, true)}
                    >
                      <Text
                        style={[
                          styles.filterGridItemText,
                          selectedMinRating === undefined && styles.filterGridItemTextActive,
                        ]}
                      >
                        Tất cả
                      </Text>
                    </TouchableOpacity>
                    {[4, 3, 2, 1].map((rating) => (
                      <TouchableOpacity
                        key={rating}
                        style={[
                          styles.filterGridItem,
                          selectedMinRating === rating && styles.filterGridItemActive,
                        ]}
                        onPress={() => handleRatingChange(rating, true)}
                      >
                        <Ionicons 
                          name="star" 
                          size={16} 
                          color={selectedMinRating === rating ? '#FFFFFF' : '#FF8C42'} 
                          style={{ marginRight: 4 }} 
                        />
                        <Text
                          style={[
                            styles.filterGridItemText,
                            selectedMinRating === rating && styles.filterGridItemTextActive,
                          ]}
                        >
                          {rating}+
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.bottomSheetFooter}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    setSelectedCategory('Tất cả');
                    setSelectedDifficulty('Tất cả');
                    setSelectedMinRating(undefined);
                    loadRecipes(1, searchQuery, '', '', undefined);
                  }}
                >
                  <Text style={styles.resetButtonText}>Đặt lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setShowFilterSheet(false)}
                >
                  <Text style={styles.applyButtonText}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FF8C42',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECECEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Inter_400Regular',
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8C42',
  },
  recipesList: {
    flex: 1,
  },
  recipesListContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  recipesListContentWeb: {
    maxWidth: LIST_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  recipesGrid: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 0,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  recipeThumbWrap: {
    position: 'relative',
    backgroundColor: '#F0F0F2',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    overflow: 'hidden',
  },
  bookmarkButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeBody: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingRight: 16,
    justifyContent: 'space-between',
    minHeight: 100,
  },
  recipeBodyTop: {
    flexShrink: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
    maxWidth: '100%',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 22,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaDot: {
    fontSize: 13,
    color: '#C4C4C4',
    marginHorizontal: 2,
  },
  recipeMetaText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
  },
  recipeAuthorAvatarWrapper: {
    position: 'relative',
  },
  authorAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  authorAvatarPlaceholder: {
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeCreatorBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    overflow: 'hidden',
  },
  recipeCreatorBadgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5.5,
  },
  authorNameSmall: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#C45C2C',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF8C42',
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    fontFamily: 'Inter_400Regular',
  },
  loadingMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },
  // Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheetOverlayPressable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.75,
    paddingBottom: 0,
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1000,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Poppins_700Bold',
  },
  bottomSheetBody: {
    flex: 1,
    height: '100%',
  },
  bottomSheetBodyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    minWidth: 100,
    justifyContent: 'center',
  },
  filterGridItemActive: {
    backgroundColor: '#FF8C42',
  },
  filterGridItemText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
  },
  filterGridItemTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  emptyFilterText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
    padding: 20,
  },
  bottomSheetFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter_600SemiBold',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF8C42',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
});
