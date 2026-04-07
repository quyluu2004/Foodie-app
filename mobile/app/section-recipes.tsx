import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { recipeAPI, homepageAPI } from '@/contexts/api';
import { useRecipeSaves, Recipe } from '@/hooks/useRecipes';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { normalizeImageUrl } from '@/utils/imageUrl';

export default function SectionRecipesScreen() {
  const { subCategoryId, sectionId, title } = useLocalSearchParams<{
    subCategoryId?: string;
    sectionId?: string;
    title?: string;
  }>();
  
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sectionData, setSectionData] = useState<any>(null);
  const [subCategoryData, setSubCategoryData] = useState<any>(null);

  // Load section và subCategory data
  const loadSectionData = useCallback(async () => {
    try {
      if (sectionId) {
        const response = await homepageAPI.getSection(sectionId);
        const section = response.data?.section;
        if (section) {
          setSectionData(section);
          
          // Tìm subCategory theo ID
          if (subCategoryId && section.subCategories) {
            const subCat = section.subCategories.find(
              (sc: any) => sc._id === subCategoryId || sc.id === subCategoryId
            );
            if (subCat) {
              setSubCategoryData(subCat);
              // Load recipes từ subCategory
              const subCatRecipes = subCat.recipes || [];
              // Đảm bảo recipes có _id hợp lệ
              const validRecipes = Array.isArray(subCatRecipes) 
                ? subCatRecipes.filter((r: any) => r && (r._id || r.id))
                : [];
              setRecipes(validRecipes);
            }
          } else if (section.recipes) {
            // Nếu không có subCategory, dùng recipes từ section
            const sectionRecipes = section.recipes || [];
            // Đảm bảo recipes có _id hợp lệ
            const validRecipes = Array.isArray(sectionRecipes)
              ? sectionRecipes.filter((r: any) => r && (r._id || r.id))
              : [];
            setRecipes(validRecipes);
          }
        }
      }
    } catch (error) {
      console.error('Error loading section data:', error);
    } finally {
      setLoading(false);
    }
  }, [sectionId, subCategoryId]);

  useEffect(() => {
    loadSectionData();
  }, [loadSectionData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSectionData();
    setRefreshing(false);
  }, [loadSectionData]);

  const displayTitle = String(title || subCategoryData?.title || sectionData?.title || 'Công thức');

  const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
    // Đảm bảo _id là string
    const recipeId = typeof recipe._id === 'string' 
      ? recipe._id 
      : (recipe._id ? String(recipe._id) : '');
    
    const { isSaved, toggleSave } = useRecipeSaves(recipeId);

    if (!recipeId) {
      console.warn('Recipe missing _id:', recipe);
      return null;
    }

    // Đảm bảo tất cả các giá trị text đều là string
    const recipeTitle = recipe.title ? String(recipe.title) : 'Không có tiêu đề';
    const recipeDescription = recipe.description ? String(recipe.description).trim() : '';
    const recipeDifficulty = recipe.difficulty ? String(recipe.difficulty) : '';
    const recipeCookTime = recipe.cookTime && typeof recipe.cookTime === 'number' ? String(recipe.cookTime) : null;
    const recipeRating = recipe.averageRating && typeof recipe.averageRating === 'number' 
      ? String(recipe.averageRating.toFixed(1)) 
      : null;
    
    // Ưu tiên videoThumbnail, sau đó mới dùng imageUrl
    const recipeImageUrl = (recipe as any).videoThumbnail || recipe.imageUrl || '';
    const normalizedImageUrl = recipeImageUrl ? normalizeImageUrl(recipeImageUrl) : '';

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => router.push(`/modal?id=${String(recipeId)}`)}
        activeOpacity={0.8}
      >
        <View style={styles.recipeImageContainer}>
          <ImageWithFallback
            imageUrl={normalizedImageUrl}
            style={styles.recipeImage}
            resizeMode="cover"
          />
          {recipeDifficulty && (
            <View style={styles.difficultyBadge}>
              <Ionicons name="sparkles" size={12} color="#FFFFFF" />
              <Text style={styles.difficultyText}>{recipeDifficulty}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleSave();
            }}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? '#FF8C42' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {recipeTitle}
          </Text>
          {recipeDescription && (
            <Text style={styles.recipeDescription} numberOfLines={2}>
              {recipeDescription}
            </Text>
          )}
          <View style={styles.recipeMeta}>
            {recipeCookTime && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.metaText}>{recipeCookTime} phút</Text>
              </View>
            )}
            {recipeRating && (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={14} color="#FF8C42" />
                <Text style={styles.metaText}>{recipeRating}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C42" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {displayTitle}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Intro Text */}
        {subCategoryData?.description && String(subCategoryData.description).trim() && (
          <View style={styles.introContainer}>
            <Text style={styles.introText}>{String(subCategoryData.description)}</Text>
          </View>
        )}

        {/* Recipes List */}
        {recipes.length > 0 ? (
          <View style={styles.recipesList}>
            {recipes.map((recipe, index) => {
              const recipeKey = recipe._id 
                ? `${String(recipe._id)}-${index}` 
                : `recipe-${index}`;
              return (
                <RecipeCard key={recipeKey} recipe={recipe} />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Chưa có công thức nào</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  introContainer: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  recipesList: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  recipeImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  saveButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#999',
  },
});

