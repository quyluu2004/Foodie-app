import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { favoriteAPI } from '@/contexts/api';
import { useAuth } from '@/contexts/AuthContext';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  
  // Animation values
  const headerTranslateY = useSharedValue(50);
  const headerOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(50);
  const statsOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(50);
  const listOpacity = useSharedValue(0);
  const counterScale = useSharedValue(1);

  const loadFavorites = async () => {
    if (!token) {
      setError('Vui lòng đăng nhập để xem món yêu thích');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await favoriteAPI.getAll();
      const recipes = response.data?.favorites || [];
      setFavorites(recipes);
      console.log('✅ Favorites loaded:', recipes.length);
    } catch (err: any) {
      console.error('❌ Error loading favorites:', err);
      setError(err?.response?.data?.message || 'Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
    
    // Staggered animations
    setTimeout(() => {
      headerTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
      headerOpacity.value = withTiming(1, { duration: 600 });
    }, 100);

    setTimeout(() => {
      statsTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
      statsOpacity.value = withTiming(1, { duration: 600 });
    }, 200);

    setTimeout(() => {
      listTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
      listOpacity.value = withTiming(1, { duration: 600 });
    }, 300);
  }, [token]);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: headerTranslateY.value }],
      opacity: headerOpacity.value,
    };
  });

  const statsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: statsTranslateY.value }],
      opacity: statsOpacity.value,
    };
  });

  const listAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: listTranslateY.value }],
      opacity: listOpacity.value,
    };
  });

  const counterAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: counterScale.value }],
    };
  });

  const handleRemoveFavorite = async (recipeId: string) => {
    if (!token) return;
    
    try {
      // Heart animation
      counterScale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      
      await favoriteAPI.add(recipeId);
      // Reload favorites after toggle
      await loadFavorites();
    } catch (err: any) {
      console.error('❌ Error removing favorite:', err);
    }
  };

  const handleRecipePress = (recipeId: string) => {
    router.push(`/modal?id=${recipeId}`);
  };

  const favoriteCount = favorites.length;

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadFavorites} />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <ThemedText type="title" style={styles.headerTitle}>
            Món yêu thích
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Những công thức bạn đã lưu
          </ThemedText>
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
          <View style={styles.statItem}>
            <Animated.View style={counterAnimatedStyle}>
              <ThemedText type="title" style={styles.statNumber}>
                {favoriteCount}
              </ThemedText>
            </Animated.View>
            <ThemedText style={styles.statLabel}>Công thức đã lưu</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="title" style={styles.statNumber}>
              12
            </ThemedText>
            <ThemedText style={styles.statLabel}>Đã nấu</ThemedText>
          </View>
        </Animated.View>

        {/* Favorites List */}
        <Animated.View style={[styles.favoritesContainer, listAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Công thức đã lưu
            </ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.sortText}>Sắp xếp</ThemedText>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Đang tải...</Text>
            </View>
          ) : favorites.length > 0 ? (
            <View style={styles.favoritesList}>
              {favorites.map((recipe) => (
                <TouchableOpacity 
                  key={recipe._id} 
                  style={styles.favoriteItem}
                  onPress={() => handleRecipePress(recipe._id)}
                >
                  <View style={styles.favoriteImageContainer}>
                    {recipe.imageUrl ? (
                      <Image source={{ uri: recipe.imageUrl }} style={styles.favoriteImage} />
                    ) : (
                      <Text style={styles.favoriteEmoji}>🍽️</Text>
                    )}
                  </View>
                  <View style={styles.favoriteInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.favoriteTitle}>
                      {recipe.title}
                    </ThemedText>
                    <ThemedText style={styles.favoriteDescription}>
                      {recipe.description}
                    </ThemedText>
                    <View style={styles.favoriteMeta}>
                      <View style={styles.metaItem}>
                        <IconSymbol name="clock.fill" size={14} color="#666" />
                        <Text style={styles.metaText}>{recipe.cookTime}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <IconSymbol name="star.fill" size={14} color="#FFD700" />
                        <Text style={styles.metaText}>{recipe.rating || 0}</Text>
                      </View>
                      {recipe.createdAt && (
                        <Text style={styles.addedDate}>
                          {new Date(recipe.createdAt).toLocaleDateString('vi-VN')}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveFavorite(recipe._id)}
                  >
                    <IconSymbol name="heart.fill" size={20} color="#E53E3E" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="chevron.right" size={60} color="#ccc" />
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                Chưa có món yêu thích
              </ThemedText>
              <ThemedText style={styles.emptyDescription}>
                Hãy khám phá và lưu những công thức bạn thích!
              </ThemedText>
              <TouchableOpacity 
                style={styles.exploreButton}
                onPress={() => router.push('/(tabs)/recipes')}
              >
                <ThemedText style={styles.exploreButtonText}>
                  Khám phá công thức
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Recently Cooked */}
        <View style={styles.recentContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Đã nấu gần đây
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.recentList}>
              <TouchableOpacity style={styles.recentItem}>
                <Text style={styles.recentEmoji}>🍜</Text>
                <Text style={styles.recentTitle}>Phở Bò</Text>
                <Text style={styles.recentDate}>Hôm qua</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.recentItem}>
                <Text style={styles.recentEmoji}>🥖</Text>
                <Text style={styles.recentTitle}>Bánh Mì</Text>
                <Text style={styles.recentDate}>3 ngày trước</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.recentItem}>
                <Text style={styles.recentEmoji}>🌯</Text>
                <Text style={styles.recentTitle}>Gỏi Cuốn</Text>
                <Text style={styles.recentDate}>1 tuần trước</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FF8C42',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginHorizontal: 20,
    marginTop: -12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#FF8C42',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 24,
  },
  favoritesContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
  },
  sortText: {
    fontSize: 15,
    color: '#FF8C42',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  favoritesList: {
    gap: 20,
  },
  favoriteItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  favoriteImageContainer: {
    marginRight: 20,
  },
  favoriteImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    resizeMode: 'contain',
  },
  favoriteEmoji: {
    fontSize: 48,
  },
  favoriteInfo: {
    flex: 1,
    gap: 6,
  },
  favoriteTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
  },
  favoriteDescription: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  favoriteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  addedDate: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#9CA3AF',
  },
  removeButton: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 24,
    marginBottom: 12,
    color: '#1A1A1A',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  exploreButton: {
    backgroundColor: '#FF8C42',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  recentContainer: {
    padding: 20,
    paddingTop: 0,
  },
  recentList: {
    flexDirection: 'row',
    gap: 20,
  },
  recentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  recentEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: 6,
    color: '#1A1A1A',
  },
  recentDate: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#FEE2E2',
    margin: 20,
    borderRadius: 12,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
});
