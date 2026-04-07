import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import { useRecipe } from '@/hooks/useRecipes';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeImageUrl } from '@/utils/imageUrl';
import LoadingPizza from '@/components/LoadingPizza';
import { Ionicons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ratingAPI } from '@/contexts/api';
import { ImageWithFallback } from '@/components/ImageWithFallback';

export default function CookingScreen() {
  const { id } = useLocalSearchParams();
  const recipeId = id as string;
  const { recipe, loading, refetch } = useRecipe(recipeId);
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingNotes, setRatingNotes] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [currentServings, setCurrentServings] = useState(4);
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);

  useEffect(() => {
    if (recipe?.servings) {
      setCurrentServings(recipe.servings);
    }
    if (recipe?.steps) {
      setCompletedSteps(new Array(recipe.steps.length).fill(false));
    }
  }, [recipe]);

  // ⚠️ KHÔNG reset video khi chuyển step - video sẽ tiếp tục chạy bình thường
  // Video chỉ play khi component mount lần đầu
  useEffect(() => {
    if (recipe?.videoUrl && recipe.mediaType === 'video' && videoRef.current && !isPlaying) {
      // Chỉ play video lần đầu khi load, không reset khi chuyển step
      videoRef.current.playAsync().catch((error) => {
        console.log('Video play error:', error);
      });
    }
  }, [recipe?.videoUrl, recipe?.mediaType]); // Chỉ phụ thuộc vào videoUrl, không phụ thuộc vào currentStep


  // Tính toán nguyên liệu điều chỉnh
  const calculateAdjustedIngredients = (ingredients: string[], originalServings: number, newServings: number): string[] => {
    if (!ingredients || ingredients.length === 0) return [];
    const ratio = newServings / originalServings;

    return ingredients.map((ingredient) => {
      let adjustedIngredient = ingredient;
      const numberPattern = /(\d+(?:\/\d+)?(?:\.\d+)?)/g;
      const matches = ingredient.match(numberPattern);

      if (!matches) return adjustedIngredient;

      matches.forEach((match) => {
        let value: number;
        if (match.includes('/')) {
          const [numerator, denominator] = match.split('/').map(Number);
          value = numerator / denominator;
        } else {
          value = parseFloat(match);
        }

        const newValue = value * ratio;

        let formattedValue: string;
        if (newValue < 1 && newValue > 0) {
          const fractions = [
            { value: 1/8, text: '1/8' },
            { value: 1/4, text: '1/4' },
            { value: 1/3, text: '1/3' },
            { value: 1/2, text: '1/2' },
            { value: 2/3, text: '2/3' },
            { value: 3/4, text: '3/4' },
          ];
          const closest = fractions.reduce((prev, curr) => 
            Math.abs(curr.value - newValue) < Math.abs(prev.value - newValue) ? curr : prev
          );
          formattedValue = closest.text;
        } else {
          formattedValue = newValue % 1 === 0 ? newValue.toString() : newValue.toFixed(1);
        }

        adjustedIngredient = adjustedIngredient.replace(match, formattedValue);
      });

      return adjustedIngredient;
    });
  };

  const adjustedIngredients = recipe?.ingredients 
    ? calculateAdjustedIngredients(recipe.ingredients, recipe.servings || 4, currentServings)
    : [];

  const handleStepComplete = (stepIndex: number) => {
    const newCompleted = [...completedSteps];
    newCompleted[stepIndex] = !newCompleted[stepIndex];
    setCompletedSteps(newCompleted);

    // Tự động chuyển sang bước tiếp theo nếu chưa hoàn thành
    if (newCompleted[stepIndex] && stepIndex < (recipe?.steps?.length || 0) - 1) {
      setTimeout(() => {
        setCurrentStep(stepIndex + 1);
      }, 500);
    }
  };

  const handleNextStep = () => {
    if (currentStep < (recipe?.steps?.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Đã hoàn thành tất cả các bước
      checkAllStepsCompleted();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const checkAllStepsCompleted = () => {
    const allCompleted = completedSteps.every(step => step === true);
    if (allCompleted && recipe?.steps && completedSteps.length === recipe.steps.length) {
      // Hiện modal đánh giá
      setShowRatingModal(true);
    } else {
      Alert.alert(
        'Chưa hoàn thành',
        'Vui lòng hoàn thành tất cả các bước trước khi đánh giá.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleFinish = () => {
    checkAllStepsCompleted();
  };

  const handleSubmitRating = async () => {
    if (ratingValue === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn số sao đánh giá');
      return;
    }

    if (!user?._id) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để đánh giá');
      return;
    }

    try {
      setSubmittingRating(true);
      const response = await ratingAPI.rateRecipe(recipeId, ratingValue, ratingNotes.trim());
      
      // Cập nhật recipe data để hiển thị rating mới
      if (response.data?.recipe) {
        // Rating đã được cập nhật trong backend, recipe sẽ tự động tính lại averageRating
      }
      
      // Refresh recipe data để cập nhật rating
      if (refetch) {
        await refetch();
      }
      
      Alert.alert(
        'Thành công',
        'Cảm ơn bạn đã đánh giá công thức!',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowRatingModal(false);
              // Quay lại và recipe data đã được refresh
              router.back();
            }
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể đánh giá công thức');
    } finally {
      setSubmittingRating(false);
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

  if (!recipe) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy công thức</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const totalSteps = recipe.steps?.length || 0;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const allStepsCompleted = completedSteps.length > 0 && completedSteps.every(step => step === true);

  return (
    <ThemedView style={styles.container}>
      {/* Header với Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>cooking</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Navigation Bar (White) */}
      <View style={styles.navBar}>
        <Text style={styles.stepCounter}>
          {currentStep + 1} of {totalSteps}
        </Text>
        <TouchableOpacity 
          onPress={() => setShowIngredientsModal(true)}
          style={styles.ingredientsButton}
        >
          <Text style={styles.ingredientsButtonText}>Ingredients</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content - Video/Image với Text Overlay */}
      <View style={styles.mainContentContainer}>
        {recipe.mediaType === 'video' && recipe.videoUrl ? (
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: recipe.videoUrl }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              useNativeControls={false}
              isLooping={false}
              shouldPlay={true}
              isMuted={false}
              onPlaybackStatusUpdate={(status) => {
                setVideoStatus(() => status);
                if (status.isLoaded) {
                  setIsPlaying(status.isPlaying);
                }
              }}
            />
            {/* Text Overlay trên video - hiển thị nguyên liệu của step hiện tại */}
            {adjustedIngredients.length > 0 && (
              <View style={styles.videoOverlay}>
                {adjustedIngredients.slice(0, 2).map((ingredient: string, idx: number) => {
                  // Parse ingredient để tách số lượng và tên
                  const match = ingredient.match(/^([\d\s\/\.]+)\s*(.+)$/);
                  const quantity = match ? match[1].trim() : '';
                  const name = match ? match[2].trim() : ingredient;
                  
                  return (
                    <View key={idx} style={styles.overlayIngredient}>
                      <Text style={styles.overlayIngredientName}>{name}</Text>
                      {quantity && (
                        <Text style={styles.overlayIngredientQuantity}>{quantity}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
            {videoStatus && !videoStatus.isLoaded && (
              <View style={styles.videoLoadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.videoLoadingText}>Đang tải video...</Text>
              </View>
            )}
          </View>
        ) : recipe.imageUrl ? (
          <View style={styles.imageContainer}>
            <ImageWithFallback
              imageUrl={normalizeImageUrl(recipe.imageUrl, recipe.updatedAt) || recipe.imageUrl}
              style={styles.recipeImage}
              resizeMode="cover"
              fallbackEmoji="🍽️"
            />
            {/* Text Overlay trên ảnh */}
            {adjustedIngredients.length > 0 && (
              <View style={styles.videoOverlay}>
                {adjustedIngredients.slice(0, 2).map((ingredient: string, idx: number) => {
                  // Parse ingredient để tách số lượng và tên
                  const match = ingredient.match(/^([\d\s\/\.]+)\s*(.+)$/);
                  const quantity = match ? match[1].trim() : '';
                  const name = match ? match[2].trim() : ingredient;
                  
                  return (
                    <View key={idx} style={styles.overlayIngredient}>
                      <Text style={styles.overlayIngredientName}>{name}</Text>
                      {quantity && (
                        <Text style={styles.overlayIngredientQuantity}>{quantity}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholderMedia}>
            <Ionicons name="image-outline" size={64} color="#9CA3AF" />
            <Text style={styles.placeholderText}>Không có media</Text>
          </View>
        )}

        {/* Instruction Text (White Background) */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            {recipe.steps && recipe.steps[currentStep] ? recipe.steps[currentStep] : 'Chưa có hướng dẫn'}
          </Text>
        </View>
      </View>

      {/* Bottom Navigation Buttons */}
      <View style={styles.bottomNavContainer}>
        <TouchableOpacity
          onPress={handlePreviousStep}
          disabled={currentStep === 0}
          style={[
            styles.bottomNavButton,
            styles.bottomNavButtonSecondary,
            currentStep === 0 && styles.bottomNavButtonDisabled
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={currentStep === 0 ? "#9CA3AF" : "#1A1A1A"} />
        </TouchableOpacity>

        {currentStep < totalSteps - 1 ? (
          <TouchableOpacity
            onPress={handleNextStep}
            style={[styles.bottomNavButton, styles.bottomNavButtonPrimary]}
          >
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleFinish}
            disabled={!allStepsCompleted}
            style={[
              styles.bottomNavButton,
              styles.bottomNavButtonPrimary,
              !allStepsCompleted && styles.bottomNavButtonDisabled
            ]}
          >
            <Ionicons name="checkmark-circle" size={24} color={allStepsCompleted ? "#FFFFFF" : "#9CA3AF"} />
          </TouchableOpacity>
        )}
      </View>

      {/* Ingredients Modal */}
      <Modal
        visible={showIngredientsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowIngredientsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ingredientsModal}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Nguyên liệu ({currentServings} người)
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowIngredientsModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {adjustedIngredients.length > 0 ? (
                adjustedIngredients.map((ingredient: string, index: number) => (
                  <View key={index} style={styles.modalIngredientItem}>
                    <View style={styles.modalIngredientBullet} />
                    <Text style={styles.modalIngredientText}>{ingredient}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa có nguyên liệu</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowRatingModal(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.ratingModal}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.ratingModalContent}
                >
                  <View style={styles.ratingModalHeader}>
                    <ThemedText type="subtitle" style={styles.ratingModalTitle}>
                      Đánh giá công thức
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => setShowRatingModal(false)}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.ratingModalSubtitle}>
                    Bạn đánh giá công thức này như thế nào?
                  </Text>

                  {/* Star Rating */}
                  <View style={styles.ratingStarsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setRatingValue(star)}
                        style={styles.ratingStarButton}
                      >
                        <Ionicons
                          name={star <= ratingValue ? "star" : "star-outline"}
                          size={50}
                          color={star <= ratingValue ? "#FFD700" : "#DDD"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Display selected rating */}
                  {ratingValue > 0 && (
                    <View style={styles.ratingValueDisplay}>
                      <Text style={styles.ratingValueText}>
                        Đã chọn: {ratingValue} {ratingValue === 1 ? 'sao' : 'sao'}
                      </Text>
                    </View>
                  )}

                  {/* Notes Input */}
                  <Text style={styles.ratingModalLabel}>Ghi chú (tùy chọn)</Text>
                  <TextInput
                    style={styles.ratingNotesInput}
                    placeholder="Nhập ghi chú về công thức này..."
                    placeholderTextColor="#999"
                    value={ratingNotes}
                    onChangeText={setRatingNotes}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    textAlignVertical="top"
                  />

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleSubmitRating}
                    disabled={ratingValue === 0 || submittingRating}
                    style={[
                      styles.submitRatingButton,
                      (ratingValue === 0 || submittingRating) && styles.submitRatingButtonDisabled
                    ]}
                  >
                    {submittingRating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitRatingButtonText}>
                        Gửi đánh giá
                      </Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'lowercase',
  },
  placeholder: {
    width: 40,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  stepCounter: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter_500Medium',
  },
  ingredientsButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  ingredientsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8C42', // Orange color - đồng bộ với app
    fontFamily: 'Inter_600SemiBold',
  },
  mainContentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#991B1B',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '50%',
    backgroundColor: '#000000',
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  videoContainer: {
    width: '100%',
    height: '50%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 12,
  },
  overlayIngredient: {
    gap: 2,
    backgroundColor: 'transparent',
  },
  overlayIngredientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  overlayIngredientQuantity: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  placeholderMedia: {
    width: '100%',
    height: '50%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },
  instructionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  instructionText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#1A1A1A',
    fontFamily: 'Inter_400Regular',
  },
  videoLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    gap: 12,
  },
  videoLoadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  stepVideoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000000',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  stepVideo: {
    width: '100%',
    height: '100%',
  },
  stepVideoLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stepVideoLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  ingredientCheckbox: {
    width: 24,
    height: 24,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  stepsContainer: {
    gap: 16,
  },
  stepItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  stepItemActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FF8C42',
  },
  stepItemCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C42',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberCompleted: {
    backgroundColor: '#10B981',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  stepCheckbox: {
    padding: 4,
  },
  stepText: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  stepTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomNavContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
    justifyContent: 'space-between',
  },
  bottomNavButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 56,
  },
  bottomNavButtonPrimary: {
    backgroundColor: '#FF8C42',
  },
  bottomNavButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  bottomNavButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.5,
  },
  ingredientsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalContent: {
    padding: 20,
  },
  modalIngredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  modalIngredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8C42',
  },
  modalIngredientText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ratingModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: Platform.OS === 'ios' ? '85%' : '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  ratingModalContent: {
    padding: 24,
  },
  ratingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingModalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  ratingModalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  ratingStarButton: {
    padding: 4,
  },
  ratingValueDisplay: {
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
    alignItems: 'center',
  },
  ratingValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B00',
  },
  ratingModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  ratingNotesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
    minHeight: 100,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  submitRatingButton: {
    backgroundColor: '#FF8C42',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitRatingButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  submitRatingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

