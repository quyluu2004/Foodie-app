import React, { useState, useEffect } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { statsAPI, saveAPI } from '@/contexts/api';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeImageUrl } from '@/utils/imageUrl';
import LoadingPizza from '@/components/LoadingPizza';

export default function SavedRecipesStatsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      // Lấy saved recipes từ saveAPI
      // Backend trả về { message, recipes, count }
      const savedRecipesResponse = await saveAPI.getSavedRecipes(user._id);
      const recipes = savedRecipesResponse.data?.recipes || savedRecipesResponse.data?.savedRecipes || savedRecipesResponse.data || [];
      setSavedRecipes(Array.isArray(recipes) ? recipes : []);
      
      // Lấy stats từ statsAPI (nếu có)
      try {
        const statsResponse = await statsAPI.getSavedRecipesStats();
        setStats(statsResponse.data);
      } catch (statsError) {
        // Nếu statsAPI không có, chỉ dùng saved recipes
        setStats({
          totalSaved: Array.isArray(recipes) ? recipes.length : 0,
          savedRecipes: recipes,
        });
      }
    } catch (error) {
      console.error('❌ Error loading saved recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingPizza size={100} color="#FF8C42" showText={true} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Công thức đã lưu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Total Saved */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="bookmark" size={28} color="#FF8C42" />
            <Text style={styles.statTitle}>Tổng số công thức đã lưu</Text>
          </View>
          <Text style={styles.statValue}>{stats?.totalSaved || 0}</Text>
        </View>

        {/* Collections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bộ sưu tập ({stats?.totalCollections || 0})</Text>
          </View>
          {stats?.collections && stats.collections.length > 0 ? (
            <View style={styles.collectionsList}>
              {stats.collections.map((collection: any) => (
                <TouchableOpacity key={collection._id} style={styles.collectionCard}>
                  <View style={styles.collectionHeader}>
                    <Ionicons name="folder" size={20} color="#FF8C42" />
                    <Text style={styles.collectionName}>{collection.name}</Text>
                  </View>
                  {collection.description && (
                    <Text style={styles.collectionDescription}>{collection.description}</Text>
                  )}
                  <Text style={styles.collectionCount}>
                    {collection.recipeCount} công thức
                  </Text>
                  {collection.recipes && collection.recipes.length > 0 && (
                    <View style={styles.collectionRecipes}>
                      {collection.recipes.slice(0, 3).map((recipe: any, index: number) => (
                        <Image
                          key={index}
                          source={{ uri: recipe.imageUrl || 'https://via.placeholder.com/60' }}
                          style={styles.collectionRecipeImage}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="folder-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>Chưa có bộ sưu tập nào</Text>
            </View>
          )}
        </View>

        {/* Top Saved Recipes */}
        {stats?.topSavedRecipes && stats.topSavedRecipes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 3 công thức được lưu nhiều nhất</Text>
            <View style={styles.topRecipesList}>
              {stats.topSavedRecipes.map((recipe: any, index: number) => (
                <TouchableOpacity
                  key={recipe._id}
                  style={styles.topRecipeCard}
                  onPress={() => router.push(`/modal?id=${recipe._id}`)}
                >
                  <View style={styles.topRecipeRank}>
                    <Text style={styles.topRecipeRankText}>{index + 1}</Text>
                  </View>
                  {recipe.imageUrl ? (
                    <Image source={{ uri: recipe.imageUrl }} style={styles.topRecipeImage} />
                  ) : (
                    <View style={styles.topRecipeImagePlaceholder}>
                      <Ionicons name="restaurant" size={24} color="#CCCCCC" />
                    </View>
                  )}
                  <View style={styles.topRecipeInfo}>
                    <Text style={styles.topRecipeTitle} numberOfLines={2}>
                      {recipe.title}
                    </Text>
                    {recipe.category && (
                      <Text style={styles.topRecipeCategory}>{recipe.category}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Saved Recipes List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Công thức đã lưu ({savedRecipes.length})</Text>
          {savedRecipes && savedRecipes.length > 0 ? (
            <View style={styles.recipesGrid}>
              {savedRecipes.map((recipe: any) => {
                const recipeId = recipe._id || recipe.recipe?._id || recipe.recipe;
                const recipeData = recipe.recipe || recipe;
                return (
                  <TouchableOpacity
                    key={recipeId}
                    style={styles.recipeCard}
                    onPress={() => router.push(`/modal?id=${recipeId}`)}
                  >
                    {(recipeData as any).videoThumbnail || recipeData.imageUrl ? (
                      <Image 
                        source={{ uri: normalizeImageUrl((recipeData as any).videoThumbnail || recipeData.imageUrl, recipeData.updatedAt) || (recipeData as any).videoThumbnail || recipeData.imageUrl }} 
                        style={styles.recipeImage} 
                      />
                    ) : (
                      <View style={styles.recipeImagePlaceholder}>
                        <Ionicons name="restaurant" size={32} color="#CCCCCC" />
                      </View>
                    )}
                    <View style={styles.recipeCardContent}>
                      <Text style={styles.recipeTitle} numberOfLines={2}>
                        {recipeData.title}
                      </Text>
                      {recipeData.averageRating != null && (
                        <View style={styles.recipeRating}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text style={styles.recipeRatingText}>
                            {recipeData.averageRating.toFixed(1)} ({recipeData.ratingCount != null ? recipeData.ratingCount : 0})
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>Chưa có công thức nào được lưu</Text>
              <Text style={styles.emptySubtext}>
                Khám phá và lưu những công thức bạn yêu thích!
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push('/(tabs)/recipes')}
              >
                <Text style={styles.exploreButtonText}>Khám phá công thức</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FF8C42',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  content: {
    flex: 1,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF8C42',
    fontFamily: 'Poppins_700Bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 16,
  },
  collectionsList: {
    gap: 12,
  },
  collectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
  },
  collectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Inter_400Regular',
  },
  collectionCount: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
    fontFamily: 'Inter_400Regular',
  },
  collectionRecipes: {
    flexDirection: 'row',
    gap: 8,
  },
  collectionRecipeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  topRecipesList: {
    gap: 12,
  },
  topRecipeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    gap: 12,
  },
  topRecipeRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRecipeRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  topRecipeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#000000',
    resizeMode: 'contain',
  },
  topRecipeImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRecipeInfo: {
    flex: 1,
  },
  topRecipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  topRecipeCategory: {
    fontSize: 13,
    color: '#999',
    fontFamily: 'Inter_400Regular',
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recipeCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#000000',
    resizeMode: 'contain',
  },
  recipeImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeCardContent: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  recipeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeRatingText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontFamily: 'Inter_500Medium',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  exploreButton: {
    marginTop: 20,
    backgroundColor: '#FF8C42',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

