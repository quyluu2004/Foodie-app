import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { router, useLocalSearchParams } from 'expo-router';
import { useRecipe, useFavorites } from '@/hooks/useRecipes';
import { useAuth } from '@/contexts/AuthContext';
import LoadingPizza from '@/components/LoadingPizza';

export default function RecipeDetailModal() {
  const { id } = useLocalSearchParams();
  const recipeId = id as string;
  const { recipe, loading, error } = useRecipe(recipeId);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();

  const handleToggleFavorite = () => {
    if (recipe) {
      toggleFavorite(recipe._id);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingPizza size={100} color="#FF8C42" showText={true} />
        </View>
      </ThemedView>
    );
  }

  if (error || !recipe) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={60} color="#FF8C42" />
          <Text style={styles.errorText}>
            {error || 'Recipe not found'}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
            <IconSymbol 
              name="heart.fill" 
              size={24} 
              color={isFavorite(recipe._id) ? "#FFD700" : "white"} 
            />
          </TouchableOpacity>
        </View>

        {/* Recipe Image */}
        <View style={styles.imageContainer}>
          {recipe.imageUrl ? (
            <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
          ) : (
            <Text style={styles.recipeEmoji}>🍽️</Text>
          )}
        </View>

        {/* Recipe Info */}
        <View style={styles.infoContainer}>
          <ThemedText type="title" style={styles.recipeTitle}>
            {recipe.title}
          </ThemedText>
          <ThemedText style={styles.recipeDescription}>
            {recipe.description}
          </ThemedText>

          {/* Recipe Meta */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <IconSymbol name="clock.fill" size={20} color="#FF8C42" />
              <Text style={styles.metaLabel}>Thời gian nấu</Text>
              <Text style={styles.metaValue}>{recipe.cookTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <IconSymbol name="person.fill" size={20} color="#FF8C42" />
              <Text style={styles.metaLabel}>Khẩu phần</Text>
              <Text style={styles.metaValue}>{recipe.servings}</Text>
            </View>
            <View style={styles.metaItem}>
              <IconSymbol name="star.fill" size={20} color="#FFD700" />
              <Text style={styles.metaLabel}>Đánh giá</Text>
              <Text style={styles.metaValue}>{recipe.rating}/5</Text>
            </View>
          </View>

          {/* Difficulty Badge */}
          <View style={styles.difficultyContainer}>
            <Text style={styles.difficultyLabel}>Độ khó:</Text>
            <Text style={[
              styles.difficultyText, 
              recipe.difficulty === 'Easy' ? styles.difficultyEasy :
              recipe.difficulty === 'Medium' ? styles.difficultyMedium :
              styles.difficultyHard
            ]}>
              {recipe.difficulty}
            </Text>
          </View>

          {/* Author Info */}
          {recipe.author && (
            <View style={styles.authorContainer}>
              <Text style={styles.authorLabel}>Tác giả:</Text>
              <Text style={styles.authorName}>{recipe.author.name}</Text>
            </View>
          )}
        </View>

        {/* Ingredients Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Nguyên liệu
          </ThemedText>
          <View style={styles.ingredientsList}>
            {recipe.ingredients?.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Instructions Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Cách làm
          </ThemedText>
          <View style={styles.instructionsList}>
            {recipe.steps?.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.startCookingButton}>
            <IconSymbol name="fork.knife" size={20} color="white" />
            <Text style={styles.startCookingText}>Bắt đầu nấu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <IconSymbol name="paperplane.fill" size={20} color="#FF8C42" />
            <Text style={styles.shareText}>Chia sẻ</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#991B1B',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FF8C42',
  },
  backButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  favoriteButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FAFAFA',
  },
  recipeImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#000000',
    resizeMode: 'contain',
  },
  recipeEmoji: {
    fontSize: 140,
  },
  infoContainer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recipeTitle: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 12,
    color: '#1A1A1A',
  },
  recipeDescription: {
    fontSize: 17,
    color: '#6B7280',
    lineHeight: 26,
    marginBottom: 24,
    fontFamily: 'Inter_400Regular',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  metaItem: {
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  difficultyLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyEasy: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  difficultyMedium: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  difficultyHard: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  section: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 20,
    color: '#1A1A1A',
  },
  ingredientsList: {
    gap: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8C42',
  },
  ingredientText: {
    fontSize: 17,
    flex: 1,
    lineHeight: 26,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
  },
  instructionsList: {
    gap: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF8C42',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  instructionText: {
    fontSize: 17,
    flex: 1,
    lineHeight: 26,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 24,
    gap: 20,
  },
  startCookingButton: {
    flex: 1,
    backgroundColor: '#FF8C42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  startCookingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF8C42',
    gap: 10,
  },
  shareText: {
    color: '#FF8C42',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
