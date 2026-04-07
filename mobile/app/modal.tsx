import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useRecipe, useFavorites, useRecipeLikes, useRecipeSaves, useRecipeComments, useRecipeForm } from '@/hooks/useRecipes';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import LoadingPizza from '@/components/LoadingPizza';
import { ratingAPI, recipeAPI, premiumAPI } from '@/contexts/api';

export default function RecipeDetailModal() {
  const { id } = useLocalSearchParams();
  const recipeId = id as string;
  const { recipe, loading, error, refetch } = useRecipe(recipeId);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { isLiked, likesCount, toggleLike } = useRecipeLikes(recipeId);
  const { isSaved, toggleSave } = useRecipeSaves(recipeId);
  const { comments, addComment, deleteComment, replyComment, loading: commentsLoading, refetch: refetchComments } = useRecipeComments(recipeId);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submittingReply, setSubmittingReply] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();
  const { deleteRecipe } = useRecipeForm();
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<{ uri: string; userName: string } | null>(null);
  const [relatedRecipes, setRelatedRecipes] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const INITIAL_COMMENTS_LIMIT = 1; // Số bình luận hiển thị ban đầu
  const [currentServings, setCurrentServings] = useState(recipe?.servings || 4);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingNotes, setRatingNotes] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [canViewFullContent, setCanViewFullContent] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donateAmount, setDonateAmount] = useState('50');
  const [donateMessage, setDonateMessage] = useState('');
  const [donating, setDonating] = useState(false);
  const [editingPremium, setEditingPremium] = useState(false);
  const [premiumPriceInput, setPremiumPriceInput] = useState('');
  const [togglingPremium, setTogglingPremium] = useState(false);
  
  // Check if current user is the author
  const isAuthor = user?._id && (
    (recipe?.author?._id && recipe.author._id.toString() === user._id.toString()) ||
    (recipe?.createdBy && (
      (typeof recipe.createdBy === 'object' && recipe.createdBy._id && recipe.createdBy._id.toString() === user._id.toString()) ||
      (typeof recipe.createdBy === 'string' && recipe.createdBy === user._id.toString())
    )) ||
    (recipe?.author && typeof recipe.author === 'string' && recipe.author === user._id.toString())
  );

  // Update currentServings when recipe loads
  useEffect(() => {
    if (recipe?.servings) {
      setCurrentServings(recipe.servings);
    }
  }, [recipe?.servings]);

  // Reset showAllComments when recipe changes
  useEffect(() => {
    setShowAllComments(false);
  }, [recipeId]);

  // Load related recipes
  useEffect(() => {
    const loadRelatedRecipes = async () => {
      if (!recipe?._id) return;
      
      try {
        setLoadingRelated(true);
        
        // Lấy từ khóa từ title (ví dụ: "bánh kem" -> "bánh")
        const titleWords = recipe.title?.toLowerCase().split(/\s+/) || [];
        const keywords = titleWords.filter((word: string) => word.length > 2); // Lọc từ có độ dài > 2
        
        // Lấy category
        const category = recipe.categoryName || recipe.category?.name || '';
        
        // Tìm món ăn liên quan
        let related: any[] = [];
        
        // 1. Tìm theo category trước
        if (category) {
          try {
            const categoryResponse = await recipeAPI.getByCategory(category, 1, 10);
            const categoryRecipes = categoryResponse.data?.recipes || categoryResponse.data || [];
            related = Array.isArray(categoryRecipes) ? categoryRecipes : [];
          } catch (err) {
            console.log('Error loading by category:', err);
          }
        }
        
        // 2. Nếu không đủ, tìm theo từ khóa trong title
        if (related.length < 4 && keywords.length > 0) {
          try {
            // Tìm món ăn có từ khóa trong title
            const allResponse = await recipeAPI.getAll(1, 20);
            const allRecipes = allResponse.data?.recipes || allResponse.data || [];
            const allArray = Array.isArray(allRecipes) ? allRecipes : [];
            
            // Lọc món ăn có chứa từ khóa trong title
            const keywordMatches = allArray.filter((r: any) => {
              const title = (r.title || '').toLowerCase();
              return keywords.some((keyword: string) => title.includes(keyword));
            });
            
            // Merge và loại bỏ duplicate
            const merged = [...related, ...keywordMatches];
            const unique = merged.filter((r: any, index: number, self: any[]) => 
              index === self.findIndex((t: any) => t._id === r._id)
            );
            related = unique;
          } catch (err) {
            console.log('Error loading by keyword:', err);
          }
        }
        
        // Loại bỏ món ăn hiện tại và giới hạn số lượng
        const filtered = related
          .filter((r: any) => r._id !== recipe._id)
          .slice(0, 6);
        
        setRelatedRecipes(filtered);
      } catch (error) {
        console.error('Error loading related recipes:', error);
      } finally {
        setLoadingRelated(false);
      }
    };
    
    loadRelatedRecipes();
  }, [recipe?._id, recipe?.title, recipe?.categoryName, recipe?.category]);

  // Refresh recipe when screen comes into focus (e.g., after rating from cooking screen)
  useFocusEffect(
    React.useCallback(() => {
      if (refetch) {
        refetch();
      }
    }, [refetch])
  );

  // Load purchase status and user coins
  useEffect(() => {
    const loadPurchaseStatus = async () => {
      if (!recipe) {
        setCanViewFullContent(false);
        setHasPurchased(false);
        return;
      }

      // Nếu là author, có thể xem full content
      if (isAuthor) {
        setCanViewFullContent(true);
        setHasPurchased(true);
        return;
      }

      // Kiểm tra recipe có phải premium không
      if (!recipe.isPremium) {
        setCanViewFullContent(true);
        setHasPurchased(false);
        return;
      }

      // Nếu recipe là premium nhưng user chưa đăng nhập
      if (!user?._id) {
        setCanViewFullContent(false);
        setHasPurchased(false);
        setUserCoins(0);
        return;
      }

      try {
        // Kiểm tra purchase status
        const purchaseResponse = await premiumAPI.checkPurchaseStatus(recipe._id);
        const purchased = purchaseResponse.data?.hasPurchased || false;
        setHasPurchased(purchased);
        setCanViewFullContent(purchased);

        // Load user coins
        const coinsResponse = await premiumAPI.getMyCoins();
        setUserCoins(coinsResponse.data?.coins || 0);
      } catch (err: any) {
        console.error('Error loading purchase status:', err);
        // Nếu lỗi, mặc định không thể xem full content nếu là premium
        setCanViewFullContent(false);
        setHasPurchased(false);
      }
    };

    loadPurchaseStatus();
  }, [recipe?._id, recipe?.isPremium, user?._id, isAuthor]);

  // Handle purchase premium recipe
  const handlePurchasePremium = async () => {
    if (!recipe || !user?._id) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để mua công thức premium');
      return;
    }

    if (purchasing) return;

    try {
      setPurchasing(true);
      const response = await premiumAPI.purchaseRecipe(recipe._id);
      
      Alert.alert('Thành công', 'Đã mua công thức premium thành công!');
      
      // Cập nhật state
      setHasPurchased(true);
      setCanViewFullContent(true);
      setUserCoins(response.data?.remainingCoins || userCoins - (recipe.price || 0));
      
      // Reload recipe để xem full content
      if (refetch) refetch();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể mua công thức premium';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setPurchasing(false);
    }
  };

  const handleToggleFavorite = () => {
    if (recipe) {
      toggleFavorite(recipe._id);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() && !commentImage) return;
    
    setSubmittingComment(true);
    try {
      await addComment(commentText.trim() || 'Đã chia sẻ ảnh kết quả', commentImage);
      setCommentText('');
      setCommentImage(null);
      // Không cần alert, chỉ cần refetch
      refetchComments();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể thêm bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCommentImage(result.assets[0].uri);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Công thức: ${recipe?.title}\n${recipe?.description}\n\nXem chi tiết tại Foodie App!`,
        title: recipe?.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleEdit = () => {
    if (recipe) {
      router.push({
        pathname: '/create-recipe',
        params: { edit: 'true', recipeId: recipe._id }
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa công thức',
      'Bạn có chắc muốn xóa công thức này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe(recipeId);
              Alert.alert('Thành công', 'Đã xóa công thức');
              router.back();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa công thức');
            }
          },
        },
      ]
    );
  };

  const handleViewAuthor = () => {
    if (recipe?.author?._id) {
      router.push(`/user-profile?id=${recipe.author._id}`);
    }
  };

  // Sync premium price input với recipe price
  useEffect(() => {
    if (recipe?.price !== undefined) {
      setPremiumPriceInput(recipe.price.toString());
    }
  }, [recipe?.price]);

  // Handle toggle premium
  const handleTogglePremium = async () => {
    if (!recipe) return;

    const newPremiumStatus = !recipe.isPremium;
    let price = 0;

    // Nếu đang bật premium, cần nhập giá
    if (newPremiumStatus) {
      const inputPrice = parseInt(premiumPriceInput) || 0;
      if (inputPrice < 10) {
        Alert.alert('Lỗi', 'Giá tối thiểu là 10 xu');
        return;
      }
      price = inputPrice;
    } else {
      // Nếu tắt premium, giá sẽ là 0
      price = 0;
    }

    try {
      setTogglingPremium(true);
      await premiumAPI.setRecipePremium(recipeId, newPremiumStatus, price);
      Alert.alert('Thành công', newPremiumStatus ? 'Đã bật trả phí cho công thức' : 'Đã tắt trả phí cho công thức');
      // Reload recipe để cập nhật
      if (refetch) refetch();
      setEditingPremium(false);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể cập nhật trạng thái premium');
    } finally {
      setTogglingPremium(false);
    }
  };

  // Load my rating
  useEffect(() => {
    const loadMyRating = async () => {
      if (!recipeId || !user?._id) {
        setMyRating(null);
        return;
      }
      try {
        const response = await ratingAPI.getMyRating(recipeId);
        if (response.data?.rating?.rating) {
          setMyRating(response.data.rating.rating);
        } else {
          setMyRating(null);
        }
      } catch (err: any) {
        // Nếu lỗi 401 và không có user, đây là bình thường (user chưa đăng nhập)
        // Không cần log error trong trường hợp này
        if (err.response?.status === 401) {
          setMyRating(null);
          return;
        }
        // Các lỗi khác: user chưa đánh giá hoặc có lỗi khác
        setMyRating(null);
      }
    };
    loadMyRating();
  }, [recipeId, user?._id]);

  const handleRateRecipe = async () => {
    if (ratingValue === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn số sao đánh giá');
      return;
    }
    
    try {
      setSubmittingRating(true);
      await ratingAPI.rateRecipe(recipeId, ratingValue, ratingNotes.trim());
      setMyRating(ratingValue);
      setShowRatingModal(false);
      setRatingValue(0);
      setRatingNotes('');
      Alert.alert('Thành công', 'Đã đánh giá công thức thành công');
      // Reload recipe để cập nhật averageRating
      if (refetch) refetch();
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể đánh giá công thức');
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Tính toán lại nguyên liệu dựa trên số lượng người
  const calculateAdjustedIngredients = (ingredients: string[], originalServings: number, newServings: number): string[] => {
    if (!ingredients || ingredients.length === 0 || !originalServings || originalServings === 0) {
      return ingredients;
    }

    const ratio = newServings / originalServings;

    return ingredients.map((ingredient) => {
      // Pattern để tìm số (có thể là số thập phân) và đơn vị
      // Ví dụ: "200g thịt bò", "2 thìa muối", "1.5 lít nước", "1/2 củ hành"
      const numberPattern = /(\d+\.?\d*|\d+\/\d+)/g;
      const matches = ingredient.match(numberPattern);

      if (!matches || matches.length === 0) {
        // Không có số, giữ nguyên
        return ingredient;
      }

      let adjustedIngredient = ingredient;

      matches.forEach((match) => {
        let value: number;

        // Xử lý phân số (ví dụ: 1/2)
        if (match.includes('/')) {
          const [numerator, denominator] = match.split('/').map(Number);
          value = numerator / denominator;
        } else {
          value = parseFloat(match);
        }

        // Tính toán giá trị mới
        const newValue = value * ratio;

        // Format số: nếu < 1 thì hiển thị dạng phân số đơn giản, nếu không thì làm tròn 1 chữ số thập phân
        let formattedValue: string;
        if (newValue < 1 && newValue > 0) {
          // Tìm phân số gần nhất
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
          // Làm tròn đến 1 chữ số thập phân, nhưng nếu là số nguyên thì không hiển thị .0
          formattedValue = newValue % 1 === 0 ? newValue.toString() : newValue.toFixed(1);
        }

        // Thay thế số cũ bằng số mới
        adjustedIngredient = adjustedIngredient.replace(match, formattedValue);
      });

      return adjustedIngredient;
    });
  };

  const adjustedIngredients = recipe?.ingredients 
    ? calculateAdjustedIngredients(recipe.ingredients, recipe.servings || 4, currentServings)
    : [];

  const handleServingsChange = (delta: number) => {
    const newServings = Math.max(1, currentServings + delta);
    setCurrentServings(newServings);
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
            {error || 'Không tìm thấy công thức'}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const recipeData = recipe;

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Hero: media + compact overlay toolbar */}
        <View style={styles.heroSection}>
          <View style={styles.heroMedia}>
            {recipeData.mediaType === 'video' && recipeData.videoUrl ? (
              <View style={styles.heroVideoInner}>
                <Video
                  ref={videoRef}
                  source={{ uri: recipeData.videoUrl }}
                  style={styles.video}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  isLooping={false}
                  shouldPlay={false}
                  onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                    if (status.isLoaded) {
                      setIsPlaying(status.isPlaying);
                    }
                  }}
                />
              </View>
            ) : (
              <ImageWithFallback
                imageUrl={normalizeImageUrl(recipeData.imageUrl, recipeData.updatedAt) || recipeData.imageUrl}
                style={styles.heroImage}
                resizeMode="cover"
                fallbackEmoji="🍽️"
              />
            )}
          </View>
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.12)', 'transparent']}
            locations={[0, 0.45, 1]}
            style={styles.heroTopGradient}
            pointerEvents="none"
          />
          <SafeAreaView edges={['top']} style={styles.heroNav}>
            <View style={styles.heroNavRow}>
              <TouchableOpacity
                style={styles.heroIconBtn}
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Quay lại"
              >
                <IconSymbol name="chevron.left" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.heroIconBtn} onPress={toggleLike}>
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isLiked ? '#FF8C42' : '#FFFFFF'}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroIconBtn} onPress={toggleSave}>
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={22}
                    color={isSaved ? '#FF8C42' : '#FFFFFF'}
                  />
                </TouchableOpacity>
                {isAuthor && user?.role === 'creator' && (
                  <>
                    <TouchableOpacity style={styles.heroIconBtn} onPress={handleEdit}>
                      <Ionicons name="create-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.heroIconBtn} onPress={handleDelete}>
                      <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  </>
                )}
                {!isAuthor && (
                  <TouchableOpacity
                    style={styles.heroIconBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/report',
                        params: { type: 'recipe', targetId: recipe._id },
                      })
                    }
                  >
                    <Ionicons name="flag-outline" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* User Photos Section - How Others Made This Recipe */}
        {comments && comments.length > 0 && comments.some((c: any) => c.imageUrl) && (
          <View style={styles.userPhotosSection}>
            <Text style={styles.userPhotosTitle}>Kết quả của người dùng</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.userPhotosScroll}
            >
              {comments
                .filter((c: any) => c.imageUrl)
                .map((comment: any) => {
                  const imageUrl = normalizeImageUrl(comment.imageUrl, comment.updatedAt) || comment.imageUrl;
                  return (
                    <TouchableOpacity
                      key={comment._id}
                      style={styles.userPhotoItem}
                      activeOpacity={0.9}
                      onPress={() => {
                        if (imageUrl) {
                          setFullscreenImage({
                            uri: imageUrl,
                            userName: comment.user?.name || 'Người dùng'
                          });
                        }
                      }}
                    >
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.userPhotoImage}
                        resizeMode="cover"
                      />
                      <View style={styles.userPhotoOverlay}>
                        <Text style={styles.userPhotoName} numberOfLines={1}>
                          {comment.user?.name || 'Người dùng'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        )}

        {/* Recipe Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.recipeTitle} numberOfLines={3}>
              {recipeData.title}
            </Text>
            {recipeData.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>
          <ThemedText style={styles.recipeDescription}>
            {recipeData.description || ''}
          </ThemedText>

          {/* Creator Premium Toggle Section */}
          {isAuthor && (user?.role === 'creator' || user?.role === 'admin') && (
            <View style={styles.creatorPremiumSection}>
              <View style={styles.creatorPremiumHeader}>
                <View style={styles.creatorPremiumHeaderLeft}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <Text style={styles.creatorPremiumLabel}>Bật/Tắt trả phí</Text>
                </View>
                <TouchableOpacity
                  style={[styles.premiumToggle, recipeData.isPremium && styles.premiumToggleActive]}
                  onPress={handleTogglePremium}
                  disabled={togglingPremium}
                >
                  <View style={[styles.premiumToggleThumb, recipeData.isPremium && styles.premiumToggleThumbActive]} />
                </TouchableOpacity>
              </View>
              {recipeData.isPremium && (
                <View style={styles.creatorPremiumPriceContainer}>
                  {editingPremium ? (
                    <View style={styles.creatorPremiumPriceEdit}>
                      <TextInput
                        style={styles.creatorPremiumPriceInput}
                        value={premiumPriceInput}
                        onChangeText={setPremiumPriceInput}
                        placeholder="Nhập giá (xu)"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        style={styles.creatorPremiumSaveButton}
                        onPress={handleTogglePremium}
                        disabled={togglingPremium}
                      >
                        {togglingPremium ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.creatorPremiumSaveButtonText}>Lưu</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.creatorPremiumCancelButton}
                        onPress={() => {
                          setEditingPremium(false);
                          setPremiumPriceInput(recipeData.price?.toString() || '');
                        }}
                      >
                        <Text style={styles.creatorPremiumCancelButtonText}>Hủy</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.creatorPremiumPriceDisplay}>
                      <Text style={styles.creatorPremiumPriceLabel}>Giá hiện tại: </Text>
                      <Text style={styles.creatorPremiumPriceValue}>{recipeData.price || 0} xu</Text>
                      <TouchableOpacity
                        style={styles.creatorPremiumEditButton}
                        onPress={() => setEditingPremium(true)}
                      >
                        <Ionicons name="create-outline" size={16} color="#FF8C42" />
                        <Text style={styles.creatorPremiumEditButtonText}>Sửa</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <Text style={styles.creatorPremiumHint}>Tối thiểu 10 xu</Text>
                </View>
              )}
            </View>
          )}

          {/* Premium Purchase Section */}
          {recipeData.isPremium && !canViewFullContent && (
            <View style={styles.premiumLockSection}>
              <View style={styles.premiumLockContent}>
                <Ionicons name="lock-closed" size={48} color="#FF8C42" />
                <Text style={styles.premiumLockTitle}>Công thức Premium</Text>
                <Text style={styles.premiumLockText}>
                  Mua công thức này với giá {recipeData.price || 0} xu để xem đầy đủ nguyên liệu và cách làm
                </Text>
                <TouchableOpacity
                  style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
                  onPress={handlePurchasePremium}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="wallet" size={20} color="#FFFFFF" />
                      <Text style={styles.purchaseButtonText}>
                        Mua với {recipeData.price || 0} xu
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text style={styles.coinsText}>Bạn có: {userCoins || 0} xu</Text>
              </View>
            </View>
          )}

          {/* Donate Button - Hiển thị nếu không phải author và author là creator */}
          {!isAuthor && recipe?.author && (recipe.author.role === 'creator' || recipe.author.role === 'admin') && (
            <TouchableOpacity
              style={styles.donateButton}
              onPress={() => setShowDonateModal(true)}
            >
              <Ionicons name="cafe" size={20} color="#FFFFFF" />
              <Text style={styles.donateButtonText}>Mời tôi ly cafe ☕</Text>
            </TouchableOpacity>
          )}

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <View style={styles.ratingHeader}>
              <View style={styles.ratingInfo}>
                <IconSymbol name="star.fill" size={20} color="#FFD700" />
                <Text style={styles.ratingAverage}>
                  {recipeData.averageRating != null ? recipeData.averageRating.toFixed(1) : '0.0'}
                </Text>
                <Text style={styles.ratingCount}>
                  ({recipeData.ratingCount != null ? recipeData.ratingCount : 0} đánh giá)
                </Text>
              </View>
              {!isAuthor ? (
                <TouchableOpacity
                  style={styles.rateButton}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (user?._id) {
                      setShowRatingModal(true);
                    } else {
                      Alert.alert('Thông báo', 'Vui lòng đăng nhập để đánh giá');
                    }
                  }}
                >
                  <Ionicons 
                    name={myRating ? "star" : "star-outline"} 
                    size={18} 
                    color={myRating ? "#FFD700" : "#666"} 
                  />
                  <Text style={styles.rateButtonText}>
                    {myRating ? `Đã đánh giá ${myRating} sao` : 'Đánh giá'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.rateButtonDisabled}>
                  <Ionicons name="star" size={18} color="#CCCCCC" />
                  <Text style={styles.rateButtonTextDisabled}>
                    Công thức của bạn
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Recipe Meta */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <IconSymbol name="clock.fill" size={20} color="#FF8C42" />
              <Text style={styles.metaLabel}>Thời gian</Text>
              <Text style={styles.metaValue}>
                {recipeData.cookTimeMinutes || recipeData.time || recipeData.cookTime || 'N/A'} phút
              </Text>
            </View>
            <View style={styles.metaItem}>
              <IconSymbol name="person.fill" size={20} color="#FF8C42" />
              <Text style={styles.metaLabel}>Khẩu phần</Text>
              <View style={styles.servingsContainer}>
                <TouchableOpacity 
                  style={styles.servingsButton}
                  onPress={() => handleServingsChange(-1)}
                  disabled={currentServings <= 1}
                >
                  <Ionicons 
                    name="remove-circle-outline" 
                    size={24} 
                    color={currentServings <= 1 ? "#CCCCCC" : "#FF8C42"} 
                  />
                </TouchableOpacity>
                <Text style={styles.metaValue}>{String(currentServings)}</Text>
                <TouchableOpacity 
                  style={styles.servingsButton}
                  onPress={() => handleServingsChange(1)}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#FF8C42" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="heart" size={20} color="#FF8C42" />
              <Text style={styles.metaLabel}>Lượt thích</Text>
              <Text style={styles.metaValue}>{String(likesCount || 0)}</Text>
            </View>
          </View>

          {/* Difficulty Badge */}
          <View style={styles.difficultyContainer}>
            <Text style={styles.difficultyLabel}>Độ khó:</Text>
            <Text style={[
              styles.difficultyText, 
              (recipeData.difficulty === 'Easy' || (recipeData.difficulty as string) === 'Dễ') ? styles.difficultyEasy :
              (recipeData.difficulty === 'Medium' || (recipeData.difficulty as string) === 'Trung bình') ? styles.difficultyMedium :
              styles.difficultyHard
            ]}>
              {recipeData.difficulty}
            </Text>
          </View>

          {/* Author Info */}
          {recipeData.author && (
            <TouchableOpacity 
              style={styles.authorContainer}
              onPress={handleViewAuthor}
              activeOpacity={0.7}
            >
              <View style={styles.authorInfo}>
                {recipeData.author.avatarUrl && (
                  <Image 
                    source={{ uri: normalizeImageUrl(recipeData.author.avatarUrl) || recipeData.author.avatarUrl }} 
                    style={styles.authorAvatar} 
                  />
                )}
                <View style={styles.authorTextContainer}>
                  <Text style={styles.authorLabel}>Tác giả:</Text>
                  <Text style={styles.authorName}>{recipeData.author.name || recipeData.author.email}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Ingredients Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithInfo}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Nguyên liệu
            </ThemedText>
            {currentServings !== (recipeData.servings || 4) && (
              <Text style={styles.servingsInfo}>
                (Đã điều chỉnh cho {currentServings} người)
              </Text>
            )}
          </View>
          <View style={styles.ingredientsList}>
            {adjustedIngredients && adjustedIngredients.length > 0 ? (
              adjustedIngredients.map((ingredient: string, index: number) => {
                // Parse ingredient: tách số lượng và tên
                // Format: "1250 g bún tươi" -> quantity: "1250 g", name: "bún tươi"
                const parseIngredient = (ing: string) => {
                  // Tìm pattern số lượng (số + đơn vị) ở đầu
                  const match = ing.match(/^([\d.,\s/]+(?:\s*(?:g|kg|ml|l|thìa|muỗng|tép|củ|quả|trái|bó|nhánh|lá|tấm|miếng|chén|bát|cup|tbsp|tsp|oz|lb|piece|pieces|pcs|pcs?))?)\s+(.+)$/i);
                  if (match) {
                    return {
                      quantity: match[1].trim(),
                      name: match[2].trim()
                    };
                  }
                  // Nếu không match, thử tách số ở đầu
                  const numberMatch = ing.match(/^([\d.,\s/]+)\s+(.+)$/);
                  if (numberMatch) {
                    return {
                      quantity: numberMatch[1].trim(),
                      name: numberMatch[2].trim()
                    };
                  }
                  // Nếu không có số, trả về toàn bộ là tên
                  return {
                    quantity: '',
                    name: ing
                  };
                };
                
                const { quantity, name } = parseIngredient(ingredient);
                
                return (
                  <View key={index} style={styles.ingredientItem}>
                    <View style={styles.ingredientBullet} />
                    <Text style={styles.ingredientName}>{name}</Text>
                    {quantity ? (
                      <Text style={styles.ingredientQuantity}>{quantity}</Text>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Chưa có nguyên liệu</Text>
            )}
          </View>
        </View>

        {/* Instructions Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Cách làm
          </ThemedText>
          {!canViewFullContent && recipeData.isPremium ? (
            <View style={styles.premiumLockMessage}>
              <Ionicons name="lock-closed" size={24} color="#FF8C42" />
              <Text style={styles.premiumLockMessageText}>
                Mua công thức để xem đầy đủ cách làm
              </Text>
            </View>
          ) : (
          <View style={styles.instructionsList}>
            {recipeData.steps && recipeData.steps.length > 0 ? (
              recipeData.steps.map((instruction: string, index: number) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Chưa có hướng dẫn</Text>
            )}
          </View>
          )}
        </View>

        {/* Comments Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Bình luận ({comments.length})
          </ThemedText>
          {commentsLoading ? (
            <ActivityIndicator size="small" color="#FF8C42" />
          ) : (
            <View style={styles.commentsList}>
              {comments.length > 0 ? (
                <>
                  {(showAllComments ? comments : comments.slice(0, INITIAL_COMMENTS_LIMIT)).map((comment: any) => {
                  const isCommentAuthor = comment.user?._id === user?._id;
                  return (
                    <View key={comment._id} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <View style={styles.commentUserInfo}>
                          <TouchableOpacity
                            onPress={() => {
                              if (comment.user?._id) {
                                router.push(`/user-profile?id=${comment.user._id}`);
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            {comment.user?.avatarUrl ? (
                              <Image 
                                source={{ uri: normalizeImageUrl(comment.user.avatarUrl) || comment.user.avatarUrl }} 
                                style={styles.commentAvatar} 
                              />
                            ) : (
                              <View style={styles.commentAvatarPlaceholder}>
                                <Ionicons name="person" size={16} color="#FFFFFF" />
                              </View>
                            )}
                          </TouchableOpacity>
                          <View style={styles.commentUserText}>
                            <TouchableOpacity
                              onPress={() => {
                                if (comment.user?._id) {
                                  router.push(`/user-profile?id=${comment.user._id}`);
                                }
                              }}
                            >
                              <Text style={styles.commentAuthor}>
                                {comment.user?.name || 'Người dùng'}
                              </Text>
                            </TouchableOpacity>
                            <Text style={styles.commentDate}>
                              {formatTime(comment.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.commentContentRow}>
                        <Text style={styles.commentText}>{comment.text}</Text>
                        {comment.imageUrl && (
                          <View style={styles.commentImageContainer}>
                            <Image
                              source={{ uri: normalizeImageUrl(comment.imageUrl, comment.updatedAt) || comment.imageUrl }}
                              style={styles.commentImage}
                              resizeMode="cover"
                            />
                          </View>
                        )}
                        <View style={styles.commentActionsRow}>
                          {/* Like Button */}
                          {user?._id && (
                            <TouchableOpacity
                              onPress={async () => {
                                try {
                                  await commentAPI.likeComment(comment._id);
                                  refetchComments();
                                } catch (error) {
                                  console.error('Error liking comment:', error);
                                }
                              }}
                              style={styles.commentActionIcon}
                            >
                              <Ionicons 
                                name={comment.likes?.includes(user._id) ? "heart" : "heart-outline"} 
                                size={16} 
                                color={comment.likes?.includes(user._id) ? "#FF8C42" : "#666"} 
                              />
                              {comment.likes && comment.likes.length > 0 && (
                                <Text style={styles.commentLikesCount}>{comment.likes.length}</Text>
                              )}
                            </TouchableOpacity>
                          )}
                          {/* Report Button */}
                          {user?._id && !isCommentAuthor && (
                            <TouchableOpacity
                              onPress={() => router.push({
                                pathname: '/report',
                                params: { type: 'comment', targetId: comment._id }
                              })}
                              style={styles.commentActionIcon}
                            >
                              <Ionicons name="flag-outline" size={16} color="#666" />
                            </TouchableOpacity>
                          )}
                          {/* More Options Button (3 dots) */}
                          {user?._id && (
                            <TouchableOpacity
                              onPress={() => {
                                const options: any[] = [];
                                if (isCommentAuthor) {
                                  options.push(
                                    {
                                      text: 'Xóa bình luận',
                                      style: 'destructive' as const,
                                      onPress: async () => {
                                        Alert.alert(
                                          'Xóa bình luận',
                                          'Bạn có chắc muốn xóa bình luận này?',
                                          [
                                            { text: 'Hủy', style: 'cancel' },
                                            {
                                              text: 'Xóa',
                                              style: 'destructive',
                                              onPress: async () => {
                                                try {
                                                  await deleteComment(comment._id);
                                                  refetchComments();
                                                } catch (error) {
                                                  Alert.alert('Lỗi', 'Không thể xóa bình luận');
                                                }
                                              },
                                            },
                                          ]
                                        );
                                      },
                                    },
                                    { text: 'Hủy', style: 'cancel' as const }
                                  );
                                } else {
                                  options.push(
                                    {
                                      text: 'Báo cáo vi phạm',
                                      onPress: () => router.push({
                                        pathname: '/report',
                                        params: { type: 'comment', targetId: comment._id }
                                      }),
                                    },
                                    { text: 'Hủy', style: 'cancel' as const }
                                  );
                                }
                                Alert.alert('Tùy chọn', '', options);
                              }}
                              style={styles.commentActionIcon}
                            >
                              <Ionicons name="ellipsis-horizontal" size={16} color="#666" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      
                      {/* Reply Button */}
                      {user?._id && !isCommentAuthor && (
                        <TouchableOpacity
                          onPress={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                          style={styles.replyButton}
                        >
                          <Ionicons name="chatbubble-outline" size={14} color="#666" />
                          <Text style={styles.replyButtonText}>
                            {comment.replies?.length > 0 ? `Trả lời (${comment.replies.length})` : 'Trả lời'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Replies Section */}
                      {comment.replies && comment.replies.length > 0 && (
                        <View style={styles.repliesContainer}>
                          {comment.replies.map((reply: any) => {
                            const isReplyAuthor = reply.user?._id === user?._id;
                            return (
                              <View key={reply._id} style={styles.replyItem}>
                                <View style={styles.replyHeader}>
                                  <View style={styles.replyUserInfo}>
                                    <TouchableOpacity
                                      onPress={() => {
                                        if (reply.user?._id) {
                                          router.push(`/user-profile?id=${reply.user._id}`);
                                        }
                                      }}
                                      activeOpacity={0.7}
                                    >
                                      {reply.user?.avatarUrl ? (
                                        <Image 
                                          source={{ uri: normalizeImageUrl(reply.user.avatarUrl) || reply.user.avatarUrl }} 
                                          style={styles.replyAvatar} 
                                        />
                                      ) : (
                                        <View style={styles.replyAvatarPlaceholder}>
                                          <Ionicons name="person" size={12} color="#FFFFFF" />
                                        </View>
                                      )}
                                    </TouchableOpacity>
                                    <View style={styles.replyUserText}>
                                      <TouchableOpacity
                                        onPress={() => {
                                          if (reply.user?._id) {
                                            router.push(`/user-profile?userId=${reply.user._id}`);
                                          }
                                        }}
                                      >
                                        <Text style={styles.replyAuthor}>
                                          {reply.user?.name || 'Người dùng'}
                                        </Text>
                                      </TouchableOpacity>
                                      <Text style={styles.replyDate}>
                                        {formatTime(reply.createdAt)}
                                      </Text>
                                    </View>
                                  </View>
                                  {isReplyAuthor && (
                                    <TouchableOpacity
                                      onPress={async () => {
                                        Alert.alert(
                                          'Xóa trả lời',
                                          'Bạn có chắc muốn xóa trả lời này?',
                                          [
                                            { text: 'Hủy', style: 'cancel' },
                                            {
                                              text: 'Xóa',
                                              style: 'destructive',
                                              onPress: async () => {
                                                // Note: Backend cần thêm API để xóa reply
                                                Alert.alert('Thông báo', 'Chức năng xóa trả lời đang được phát triển');
                                              },
                                            },
                                          ]
                                        );
                                      }}
                                      style={styles.deleteReplyButton}
                                    >
                                      <Ionicons name="trash-outline" size={12} color="#FF8C42" />
                                    </TouchableOpacity>
                                  )}
                                </View>
                                <Text style={styles.replyText}>{reply.text}</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* Reply Input */}
                      {replyingTo === comment._id && user?._id && (
                        <View style={styles.replyInputContainer}>
                          <TextInput
                            style={styles.replyInput}
                            placeholder={`Trả lời ${comment.user?.name || 'người dùng'}...`}
                            placeholderTextColor="#9CA3AF"
                            value={replyText[comment._id] || ''}
                            onChangeText={(text) => setReplyText(prev => ({ ...prev, [comment._id]: text }))}
                            multiline
                            maxLength={500}
                          />
                          <View style={styles.replyInputActions}>
                            <TouchableOpacity
                              onPress={() => {
                                setReplyingTo(null);
                                setReplyText(prev => ({ ...prev, [comment._id]: '' }));
                              }}
                              style={styles.cancelReplyButton}
                            >
                              <Text style={styles.cancelReplyText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleReply(comment._id)}
                              disabled={submittingReply[comment._id] || !replyText[comment._id]?.trim()}
                              style={[
                                styles.sendReplyButton,
                                (submittingReply[comment._id] || !replyText[comment._id]?.trim()) && styles.sendReplyButtonDisabled
                              ]}
                            >
                              {submittingReply[comment._id] ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <Ionicons name="send" size={16} color="#FFFFFF" />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                  })}
                  {comments.length > INITIAL_COMMENTS_LIMIT && !showAllComments && (
                    <TouchableOpacity
                      style={styles.showMoreCommentsButton}
                      onPress={() => setShowAllComments(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.showMoreCommentsText}>
                        Xem thêm {comments.length - INITIAL_COMMENTS_LIMIT} bình luận
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#FF8C42" />
                    </TouchableOpacity>
                  )}
                  {showAllComments && comments.length > INITIAL_COMMENTS_LIMIT && (
                    <TouchableOpacity
                      style={styles.showMoreCommentsButton}
                      onPress={() => setShowAllComments(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.showMoreCommentsText}>
                        Thu gọn
                      </Text>
                      <Ionicons name="chevron-up" size={16} color="#FF8C42" />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
              )}
            </View>
          )}
        </View>

        {/* Related Recipes Section */}
        {relatedRecipes.length > 0 && (
          <View style={styles.relatedRecipesSection}>
            <Text style={styles.relatedRecipesTitle}>Món ăn liên quan</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedRecipesScroll}
            >
              {relatedRecipes.map((relatedRecipe: any) => (
                <TouchableOpacity
                  key={relatedRecipe._id}
                  style={styles.relatedRecipeCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    router.push(`/modal?id=${relatedRecipe._id}`);
                  }}
                >
                  {relatedRecipe.imageUrl ? (
                    <Image
                      source={{ uri: normalizeImageUrl(relatedRecipe.imageUrl, relatedRecipe.updatedAt) || relatedRecipe.imageUrl }}
                      style={styles.relatedRecipeImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.relatedRecipeImagePlaceholder}>
                      <Text style={styles.relatedRecipeEmoji}>🍽️</Text>
                    </View>
                  )}
                  <View style={styles.relatedRecipeInfo}>
                    <Text style={styles.relatedRecipeTitle} numberOfLines={2}>
                      {relatedRecipe.title}
                    </Text>
                    <View style={styles.relatedRecipeMeta}>
                      {relatedRecipe.cookTimeMinutes || relatedRecipe.time ? (
                        <View style={styles.relatedRecipeMetaItem}>
                          <Ionicons name="time-outline" size={12} color="#666" />
                          <Text style={styles.relatedRecipeMetaText}>
                            {relatedRecipe.cookTimeMinutes || relatedRecipe.time} phút
                          </Text>
                        </View>
                      ) : null}
                      {relatedRecipe.averageRating ? (
                        <View style={styles.relatedRecipeMetaItem}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text style={styles.relatedRecipeMetaText}>
                            {relatedRecipe.averageRating.toFixed(1)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.startCookingButton}
            onPress={() => {
              router.push(`/cooking?id=${recipeId}`);
            }}
          >
            <IconSymbol name="fork.knife" size={20} color="white" />
            <Text style={styles.startCookingText}>Bắt đầu nấu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <IconSymbol name="paperplane.fill" size={20} color="#FF8C42" />
            <Text style={styles.shareText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Comment Input */}
      {user?._id ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.commentInputContainer} pointerEvents="box-none">
            {user?.avatarUrl ? (
              <Image 
                source={{ uri: normalizeImageUrl(user.avatarUrl) || user.avatarUrl }} 
                style={styles.commentInputAvatar} 
              />
            ) : (
              <View style={styles.commentInputAvatarPlaceholder}>
                <Ionicons name="person" size={16} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.commentInputWrapper}>
              {commentImage && (
                <View style={styles.commentImagePreview}>
                  <Image source={{ uri: commentImage }} style={styles.commentImagePreviewImage} />
                  <TouchableOpacity
                    style={styles.commentImageRemoveButton}
                    onPress={() => setCommentImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF8C42" />
                  </TouchableOpacity>
                </View>
              )}
              <TextInput
                style={styles.commentInput}
                placeholder="Thêm bình luận..."
                placeholderTextColor="#9CA3AF"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
                editable={true}
                returnKeyType="default"
                blurOnSubmit={false}
                onFocus={() => {
                  // Ensure keyboard shows
                }}
              />
            </View>
            <TouchableOpacity
              style={styles.commentImageButton}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="image-outline" size={24} color="#FF8C42" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sendButton, (submittingComment || (!commentText.trim() && !commentImage)) && styles.sendButtonDisabled]}
              onPress={handleAddComment}
              disabled={submittingComment || (!commentText.trim() && !commentImage)}
              activeOpacity={0.7}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.commentInputContainer}>
          <Text style={styles.loginToCommentText}>
            Đăng nhập để bình luận
          </Text>
        </View>
      )}

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <View style={styles.fullscreenImageOverlay}>
          <TouchableOpacity
            style={styles.fullscreenImageCloseButton}
            onPress={() => setFullscreenImage(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.fullscreenImageContainer}>
            <Image
              source={{ uri: fullscreenImage.uri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.fullscreenImageInfo}>
            <Text style={styles.fullscreenImageUserName}>
              {fullscreenImage.userName}
            </Text>
          </View>
        </View>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModal}>
            <View style={styles.ratingModalHeader}>
              <Text style={styles.ratingModalTitle}>Đánh giá công thức</Text>
              <TouchableOpacity onPress={() => {
                setShowRatingModal(false);
                setRatingValue(0);
                setRatingNotes('');
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingStarsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRatingValue(star)}
                  style={styles.ratingStarButton}
                >
                  <Ionicons
                    name={star <= ratingValue ? "star" : "star-outline"}
                    size={40}
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

            <TouchableOpacity
              style={[styles.ratingSubmitButton, (ratingValue === 0 || submittingRating) && styles.ratingSubmitButtonDisabled]}
              onPress={handleRateRecipe}
              disabled={ratingValue === 0 || submittingRating}
            >
              {submittingRating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.ratingSubmitButtonText}>Gửi đánh giá</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Donate Modal */}
      {showDonateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.donateModal}>
            <View style={styles.donateModalHeader}>
              <Text style={styles.donateModalTitle}>Mời tôi ly cafe ☕</Text>
              <TouchableOpacity onPress={() => {
                setShowDonateModal(false);
                setDonateAmount('50');
                setDonateMessage('');
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.donateModalLabel}>Số lượng xu *</Text>
            <TextInput
              style={styles.donateModalInput}
              placeholder="Nhập số lượng xu (tối thiểu 10)"
              value={donateAmount}
              onChangeText={setDonateAmount}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <Text style={styles.coinsText}>Bạn có: {userCoins || 0} xu</Text>

            <Text style={[styles.donateModalLabel, { marginTop: 16 }]}>Lời nhắn (tùy chọn)</Text>
            <TextInput
              style={[styles.donateModalInput, styles.donateModalTextArea]}
              placeholder="Nhập lời nhắn cho creator..."
              value={donateMessage}
              onChangeText={setDonateMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={[styles.donateModalButton, donating && styles.donateModalButtonDisabled]}
              onPress={handleDonate}
              disabled={donating}
            >
              {donating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.donateModalButtonText}>
                  Donate {donateAmount || '0'} xu
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  scrollViewContent: {
    paddingBottom: 24,
  },
  heroSection: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#1A1A1A',
  },
  heroMedia: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#E8E8EA',
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroVideoInner: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  heroTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  heroNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
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
  video: {
    width: '100%',
    height: '100%',
  },
  recipeEmoji: {
    fontSize: 140,
  },
  userPhotosSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userPhotosTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  userPhotosScroll: {
    paddingRight: 16,
  },
  userPhotoItem: {
    width: 120,
    height: 120,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  userPhotoImage: {
    width: '100%',
    height: '100%',
  },
  userPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  userPhotoName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  relatedRecipesSection: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  relatedRecipesTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  relatedRecipesScroll: {
    paddingRight: 16,
  },
  relatedRecipeCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  relatedRecipeImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
  },
  relatedRecipeImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedRecipeEmoji: {
    fontSize: 48,
  },
  relatedRecipeInfo: {
    padding: 12,
  },
  relatedRecipeTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
    minHeight: 40,
  },
  relatedRecipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  relatedRecipeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  relatedRecipeMetaText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recipeTitle: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
    color: '#111827',
    letterSpacing: -0.3,
  },
  recipeDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
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
  difficultyMedium: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  difficultyEasy: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  difficultyHard: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 18,
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
  sectionHeaderWithInfo: {
    marginBottom: 4,
  },
  servingsInfo: {
    fontSize: 14,
    color: '#FF8C42',
    fontFamily: 'Inter_500Medium',
    marginTop: -16,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  servingsButton: {
    padding: 4,
  },
  ingredientsList: {
    gap: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8C42',
    flexShrink: 0,
  },
  ingredientName: {
    fontSize: 17,
    flex: 1,
    lineHeight: 26,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
    marginRight: 12,
  },
  ingredientQuantity: {
    fontSize: 17,
    lineHeight: 26,
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    flexShrink: 0,
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  authorContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorTextContainer: {
    flex: 1,
  },
  authorLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  commentsList: {
    gap: 16,
  },
  showMoreCommentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  showMoreCommentsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8C42',
    fontFamily: 'Inter_600SemiBold',
  },
  commentItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentUserText: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  reportButton: {
    padding: 4,
  },
  deleteCommentButton: {
    padding: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },
  commentText: {
    fontSize: 15,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    marginBottom: 8,
  },
  commentImageContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  commentImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
  },
  replyButtonText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  repliesContainer: {
    marginTop: 12,
    marginLeft: 20,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
    gap: 12,
  },
  replyItem: {
    paddingVertical: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  replyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  replyAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyUserText: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Inter_600SemiBold',
  },
  replyDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  replyText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    lineHeight: 20,
  },
  deleteReplyButton: {
    padding: 4,
  },
  replyInputContainer: {
    marginTop: 12,
    marginLeft: 20,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  replyInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  replyInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelReplyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelReplyText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
  },
  sendReplyButton: {
    backgroundColor: '#FF8C42',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sendReplyButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'flex-end',
    gap: 12,
    zIndex: 1000,
    elevation: 1000, // Android - ensure it's above everything
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInputAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    position: 'relative',
    zIndex: 1000,
    elevation: 1000, // Android
  },
  commentInputWrapper: {
    flex: 1,
  },
  commentImagePreview: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  commentImagePreviewImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  commentImageRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  commentImageButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loginToCommentText: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  ratingSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
    zIndex: 1,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 36, // Cố định chiều cao để vừa với button
  },
  ratingAverage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    minHeight: 36,
    height: 36, // Cố định chiều cao để vừa với rating box
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10, // Android
  },
  rateButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  rateButtonDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 36,
    height: 36, // Cố định chiều cao để vừa với rating box
    justifyContent: 'center',
  },
  rateButtonTextDisabled: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  fullscreenImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 3000,
    elevation: 3000, // Android - above everything
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImageCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 3001,
    elevation: 3001,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenImageInfo: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 3001,
    elevation: 3001,
  },
  fullscreenImageUserName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    elevation: 2000, // Android - above comment input
  },
  ratingModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    zIndex: 2001,
    elevation: 2001, // Android
  },
  ratingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  ratingStarButton: {
    padding: 4,
  },
  ratingValueDisplay: {
    marginTop: 8,
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ratingNotesInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ratingSubmitButton: {
    backgroundColor: '#FF8C42',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ratingSubmitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  ratingSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF8C42',
    fontFamily: 'Inter_700Bold',
  },
  premiumLockSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
  },
  premiumLockContent: {
    alignItems: 'center',
  },
  premiumLockTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'Poppins_700Bold',
  },
  premiumLockText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF8C42',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  coinsText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Inter_400Regular',
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  donateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  donateModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  donateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  donateModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Poppins_700Bold',
  },
  donateModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  donateModalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    fontFamily: 'Inter_400Regular',
  },
  donateModalTextArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  donateModalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  donateModalButtonDisabled: {
    opacity: 0.6,
  },
  donateModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  premiumLockMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
  },
  premiumLockMessageText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  creatorPremiumSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  creatorPremiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorPremiumHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creatorPremiumLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
  },
  premiumToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  premiumToggleActive: {
    backgroundColor: '#FF8C42',
  },
  premiumToggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  premiumToggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  creatorPremiumPriceContainer: {
    marginTop: 12,
  },
  creatorPremiumPriceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  creatorPremiumPriceLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  creatorPremiumPriceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8C42',
    fontFamily: 'Inter_700Bold',
  },
  creatorPremiumEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  creatorPremiumEditButtonText: {
    fontSize: 12,
    color: '#FF8C42',
    fontFamily: 'Inter_500Medium',
  },
  creatorPremiumPriceEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  creatorPremiumPriceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
  },
  creatorPremiumSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FF8C42',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorPremiumSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  creatorPremiumCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorPremiumCancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  creatorPremiumHint: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Inter_400Regular',
  },
});
