import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { statsAPI } from '@/contexts/api';
import { useAuth } from '@/contexts/AuthContext';
import LoadingPizza from '@/components/LoadingPizza';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function CreatorDashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await statsAPI.getCreatorStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('❌ Error loading creator stats:', error);
      if (error.response?.status === 403) {
        // Không phải creator
        router.back();
      }
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

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Creator Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không thể tải dữ liệu</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Format số với dấu phẩy
  const formatNumber = (num: number) => {
    return num?.toLocaleString('vi-VN') || '0';
  };

  // Tính phần trăm tăng trưởng (đơn giản)
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Lấy dữ liệu 7 ngày gần nhất cho biểu đồ
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const last7Days = getLast7Days();
  
  // Merge dữ liệu với ngày
  const viewsData = last7Days.map(date => {
    const found = stats.growth?.views?.find((v: any) => v._id === date);
    return { date, count: found?.count || 0 };
  });

  const savesData = last7Days.map(date => {
    const found = stats.growth?.saves?.find((v: any) => v._id === date);
    return { date, count: found?.count || 0 };
  });

  const cookedData = last7Days.map(date => {
    const found = stats.growth?.cooked?.find((v: any) => v._id === date);
    return { date, count: found?.count || 0 };
  });

  // Tìm max value để scale biểu đồ
  const maxValue = Math.max(
    ...viewsData.map(d => d.count),
    ...savesData.map(d => d.count),
    ...cookedData.map(d => d.count),
    1
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Cards */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <LinearGradient
                colors={['#FF8C42', '#FF6B35']}
                style={styles.cardGradient}
              >
                <Ionicons name="eye" size={32} color="#FFFFFF" />
                <Text style={styles.cardValue}>{formatNumber(stats.overview?.totalViews || 0)}</Text>
                <Text style={styles.cardLabel}>Lượt xem</Text>
              </LinearGradient>
            </View>

            <View style={styles.overviewCard}>
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                style={styles.cardGradient}
              >
                <Ionicons name="bookmark" size={32} color="#FFFFFF" />
                <Text style={styles.cardValue}>{formatNumber(stats.overview?.totalSaves || 0)}</Text>
                <Text style={styles.cardLabel}>Lượt lưu</Text>
              </LinearGradient>
            </View>

            <View style={styles.overviewCard}>
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.cardGradient}
              >
                <Ionicons name="restaurant" size={32} color="#FFFFFF" />
                <Text style={styles.cardValue}>{formatNumber(stats.overview?.totalCooked || 0)}</Text>
                <Text style={styles.cardLabel}>Lượt nấu thử</Text>
              </LinearGradient>
            </View>

            <View style={styles.overviewCard}>
              <LinearGradient
                colors={['#9C27B0', '#7B1FA2']}
                style={styles.cardGradient}
              >
                <Ionicons name="heart" size={32} color="#FFFFFF" />
                <Text style={styles.cardValue}>{formatNumber(stats.overview?.totalLikes || 0)}</Text>
                <Text style={styles.cardLabel}>Lượt thích</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Growth Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Tăng trưởng 7 ngày gần nhất</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {last7Days.map((date, index) => {
                const viewsHeight = (viewsData[index].count / maxValue) * 150;
                const savesHeight = (savesData[index].count / maxValue) * 150;
                const cookedHeight = (cookedData[index].count / maxValue) * 150;
                const dayLabel = new Date(date).toLocaleDateString('vi-VN', { weekday: 'short' });

                return (
                  <View key={date} style={styles.barGroup}>
                    <View style={styles.barsContainer}>
                      <View style={[styles.bar, styles.barViews, { height: Math.max(viewsHeight, 4) }]} />
                      <View style={[styles.bar, styles.barSaves, { height: Math.max(savesHeight, 4) }]} />
                      <View style={[styles.bar, styles.barCooked, { height: Math.max(cookedHeight, 4) }]} />
                    </View>
                    <Text style={styles.barLabel}>{dayLabel}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FF8C42' }]} />
                <Text style={styles.legendText}>Lượt xem</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Lượt lưu</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
                <Text style={styles.legendText}>Lượt nấu</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Recipes */}
        {stats.topRecipes && stats.topRecipes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Công thức được lưu nhiều nhất</Text>
            {stats.topRecipes.slice(0, 5).map((recipe: any, index: number) => (
              <TouchableOpacity
                key={recipe._id}
                style={styles.recipeCard}
                onPress={() => router.push(`/section-recipes?recipeId=${recipe._id}` as any)}
              >
                <View style={styles.recipeRank}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
                  <View style={styles.recipeStats}>
                    <Ionicons name="bookmark" size={14} color="#4CAF50" />
                    <Text style={styles.recipeStatText}>{formatNumber(recipe.saveCount || 0)} lượt lưu</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Hot Recipes */}
        {stats.hotRecipes && stats.hotRecipes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Món ăn đang hot</Text>
            {stats.hotRecipes.map((recipe: any, index: number) => (
              <TouchableOpacity
                key={recipe._id}
                style={styles.recipeCard}
                onPress={() => router.push(`/section-recipes?recipeId=${recipe._id}` as any)}
              >
                <View style={styles.recipeRank}>
                  <Ionicons name="flame" size={20} color="#FF6B35" />
                </View>
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
                  <View style={styles.recipeStatsRow}>
                    <View style={styles.recipeStats}>
                      <Ionicons name="eye" size={12} color="#666" />
                      <Text style={styles.recipeStatTextSmall}>{formatNumber(recipe.viewCount || 0)}</Text>
                    </View>
                    <View style={styles.recipeStats}>
                      <Ionicons name="bookmark" size={12} color="#666" />
                      <Text style={styles.recipeStatTextSmall}>{formatNumber(recipe.saveCount || 0)}</Text>
                    </View>
                    <View style={styles.recipeStats}>
                      <Ionicons name="restaurant" size={12} color="#666" />
                      <Text style={styles.recipeStatTextSmall}>{formatNumber(recipe.cookedCount || 0)}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Insights */}
        {stats.insights?.bestPostingHours && stats.insights.bestPostingHours.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Insight: Khung giờ đăng bài tốt nhất</Text>
            <View style={styles.insightsContainer}>
              {stats.insights.bestPostingHours.map((insight: any, index: number) => (
                <View key={index} style={styles.insightCard}>
                  <Text style={styles.insightHour}>{insight.hour}:00</Text>
                  <Text style={styles.insightLikes}>{formatNumber(insight.totalLikes)} likes</Text>
                  <Text style={styles.insightRecipes}>{insight.recipeCount} bài đăng</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Total Recipes */}
        <View style={styles.section}>
          <View style={styles.totalRecipesCard}>
            <Ionicons name="document-text" size={32} color="#FF8C42" />
            <Text style={styles.totalRecipesText}>
              Tổng số công thức: <Text style={styles.totalRecipesNumber}>{stats.overview?.totalRecipes || 0}</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FF8C42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  overviewSection: {
    padding: 16,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    fontFamily: 'Poppins_700Bold',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewCard: {
    width: (width - 48) / 2,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    fontFamily: 'Poppins_700Bold',
  },
  cardLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
    fontFamily: 'Inter_500Medium',
  },
  chartSection: {
    padding: 16,
    paddingTop: 0,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: 16,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    width: '100%',
    justifyContent: 'center',
    gap: 2,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    minHeight: 4,
  },
  barViews: {
    backgroundColor: '#FF8C42',
  },
  barSaves: {
    backgroundColor: '#4CAF50',
  },
  barCooked: {
    backgroundColor: '#2196F3',
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  recipeRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C4220',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8C42',
    fontFamily: 'Poppins_700Bold',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  recipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recipeStatText: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'Inter_500Medium',
  },
  recipeStatTextSmall: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  insightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: (width - 56) / 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  insightHour: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF8C42',
    fontFamily: 'Poppins_700Bold',
  },
  insightLikes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  insightRecipes: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  totalRecipesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  totalRecipesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontFamily: 'Inter_500Medium',
  },
  totalRecipesNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF8C42',
    fontFamily: 'Poppins_700Bold',
  },
});

