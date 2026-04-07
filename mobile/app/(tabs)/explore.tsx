import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

const featuredContent = [
  {
    id: 1,
    title: 'Món ăn truyền thống',
    description: 'Khám phá những món ăn cổ truyền của Việt Nam',
    image: '🏮',
    recipes: 25,
    color: '#FF4D4D',
    icon: 'star.fill',
  },
  {
    id: 2,
    title: 'Món chay',
    description: 'Công thức nấu ăn chay ngon và bổ dưỡng',
    image: '🥬',
    recipes: 18,
    color: '#4CAF50',
    icon: 'chevron.right',
  },
  {
    id: 3,
    title: 'Món ngọt',
    description: 'Các món tráng miệng và bánh ngọt',
    image: '🍰',
    recipes: 32,
    color: '#FF9800',
    icon: 'star.fill',
  },
  {
    id: 4,
    title: 'Món nhanh',
    description: 'Công thức nấu ăn nhanh trong 30 phút',
    image: '⚡',
    recipes: 15,
    color: '#9C27B0',
    icon: 'clock.fill',
  },
];

const trendingRecipes = [
  { id: 1, name: 'Phở Bò', image: '🍜', views: '2.5K' },
  { id: 2, name: 'Bánh Mì', image: '🥖', views: '1.8K' },
  { id: 3, name: 'Gỏi Cuốn', image: '🌯', views: '1.2K' },
  { id: 4, name: 'Bún Chả', image: '🍲', views: '980' },
];

const CategoryCard = ({ category, index }: { category: typeof featuredContent[0]; index: number }) => {
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const cardTranslateX = useSharedValue(50);

  useEffect(() => {
    setTimeout(() => {
      cardOpacity.value = withTiming(1, { duration: 600 });
      cardTranslateX.value = withSpring(0, { damping: 12, stiffness: 100 });
    }, index * 150);
  }, [index]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }, { translateX: cardTranslateX.value }],
    opacity: cardOpacity.value,
  }));

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity
        style={[styles.categoryCard, { borderLeftColor: category.color }]}
        onPressIn={() => (cardScale.value = withSpring(0.95))}
        onPressOut={() => (cardScale.value = withSpring(1))}
        activeOpacity={0.9}
      >
        <View style={styles.categoryImageContainer}>
          <Text style={styles.categoryEmoji}>{category.image}</Text>
          <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
            <IconSymbol name={category.icon as any} size={16} color={category.color} />
          </View>
        </View>
        <View style={styles.categoryInfo}>
          <ThemedText style={styles.categoryTitle}>{category.title}</ThemedText>
          <ThemedText style={styles.categoryDescription}>{category.description}</ThemedText>
          <View style={styles.categoryMeta}>
            <IconSymbol name="fork.knife" size={14} color="#444" />
            <Text style={styles.categoryCount}>{category.recipes} công thức</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const TrendingCard = ({ recipe, index }: { recipe: typeof trendingRecipes[0]; index: number }) => {
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);

  useEffect(() => {
    setTimeout(() => {
      cardOpacity.value = withTiming(1, { duration: 600 });
      cardTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    }, index * 100);
  }, [index]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }, { translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));

  const handlePress = () => {
    router.push(`/modal?id=${recipe.id}`);
  };

  return (
    <Animated.View style={cardAnimatedStyle}>
      <TouchableOpacity
        style={styles.trendingItem}
        onPress={handlePress}
        onPressIn={() => (cardScale.value = withSpring(0.95))}
        onPressOut={() => (cardScale.value = withSpring(1))}
        activeOpacity={0.9}
      >
        <View style={styles.trendingImageContainer}>
          <Text style={styles.trendingEmoji}>{recipe.image}</Text>
          <View style={styles.trendingBadge}>
            <IconSymbol name="star.fill" size={10} color="#FFD700" />
            <Text style={styles.trendingBadgeText}>Hot</Text>
          </View>
        </View>
        <ThemedText style={styles.trendingTitle}>{recipe.name}</ThemedText>
        <View style={styles.trendingMeta}>
          <IconSymbol name="eye.fill" size={12} color="#FF4D4D" />
          <Text style={styles.trendingViews}>{recipe.views} lượt xem</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ExploreScreen() {
  const headerTranslateY = useSharedValue(-50);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerTranslateY.value = withSpring(0);
    headerOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
    opacity: headerOpacity.value,
  }));

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <ThemedText style={styles.headerTitle}>Khám phá</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Tìm hiểu thêm về ẩm thực Việt Nam</ThemedText>
        </Animated.View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#444" />
            <Text style={styles.searchPlaceholder}>Tìm kiếm món ăn...</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Danh mục nổi bật</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScrollContent}>
            {featuredContent.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </ScrollView>
        </View>

        {/* Trending */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Xu hướng</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.seeAllText}>Xem tất cả</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.trendingList}>
              {trendingRecipes.map((recipe, index) => (
                <TrendingCard key={recipe.id} recipe={recipe} index={index} />
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollView: { flex: 1 },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#FF8C42' },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerSubtitle: { 
    fontSize: 17, 
    color: '#FFFFFF', 
    fontWeight: '400',
    fontFamily: 'Inter_400Regular'
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: { 
    color: '#6B7280', 
    fontSize: 16, 
    fontWeight: '400',
    fontFamily: 'Inter_400Regular'
  },
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: '600', 
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A', 
    marginBottom: 16 
  },
  seeAllText: { 
    fontSize: 15, 
    color: '#FF8C42', 
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    textDecorationLine: 'underline' 
  },

  // Categories
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  categoryImageContainer: { marginRight: 20 },
  categoryEmoji: { fontSize: 48 },
  categoryInfo: { flex: 1, gap: 6 },
  categoryTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A' 
  },
  categoryDescription: { 
    fontSize: 15, 
    color: '#6B7280', 
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22 
  },
  categoryMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  categoryCount: { 
    fontSize: 14, 
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#6B7280' 
  },
  categoryIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ✅ Trending (đã thêm trendingImageContainer)
  trendingList: { flexDirection: 'row', gap: 20 },
  trendingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  trendingImageContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  trendingEmoji: { fontSize: 48 },
  trendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  trendingMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendingViews: { 
    fontSize: 14, 
    color: '#6B7280', 
    fontWeight: '400',
    fontFamily: 'Inter_400Regular'
  },
  trendingBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF8C42',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingBadgeText: { 
    fontSize: 10, 
    color: '#FFFFFF', 
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold'
  },
  categoriesScrollContent: { paddingHorizontal: 20 },
});
