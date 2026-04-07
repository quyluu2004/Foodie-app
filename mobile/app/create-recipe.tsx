import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRecipeForm, useCategories } from '@/hooks/useRecipes';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AuthGuard from '@/components/AuthGuard';
import { VI } from '@/constants/strings';
import ErrorHandler from '@/utils/errorHandler';
import { recipeAPI, premiumAPI } from '@/contexts/api';

export default function CreateRecipeScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false); // State cho upload video
  const [cookTime, setCookTime] = useState('');
  const [difficulty, setDifficulty] = useState('Dễ');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState<Array<{ name: string; quantity: string }>>([{ name: '', quantity: '' }]);
  const [steps, setSteps] = useState(['']);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState('');
  const { user, token, isAuthenticated } = useAuth();
  const { categories: categoriesList, loading: categoriesLoading } = useCategories();

  const difficulties = [VI.easy, VI.medium, VI.hard];
  
  // Sắp xếp categories theo thứ tự ưu tiên
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
  
  // Sử dụng categories từ API hoặc fallback
  const allCategoryNames = categoriesList && categoriesList.length > 0 
    ? categoriesList.map((cat: any) => cat.name || cat)
    : categoryOrder;
  
  // Sắp xếp categories theo thứ tự ưu tiên
  const sortedCategories = categoryOrder.filter(cat => allCategoryNames.includes(cat));
  const otherCategories = allCategoryNames.filter((cat: string) => !categoryOrder.includes(cat));
  const categories = [...sortedCategories, ...otherCategories];

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredientName = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], name: value };
    setIngredients(newIngredients);
  };

  const updateIngredientQuantity = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], quantity: value };
    setIngredients(newIngredients);
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  // Chọn video từ thư viện
  const pickVideo = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện để chọn video');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // CHỈ CHỌN VIDEO
        allowsEditing: false,
        quality: 1,
        // Bỏ videoMaxDuration để cho phép chọn bất kỳ video nào, sẽ validate sau
      });

      if (!result.canceled && result.assets[0]) {
        const video = result.assets[0];
        
        console.log('📹 Video selected:', {
          uri: video.uri,
          duration: video.duration,
          fileSize: video.fileSize,
          width: video.width,
          height: video.height,
          mimeType: video.mimeType,
        });
        
        // Kiểm tra file size (300MB = 300 * 1024 * 1024 bytes)
        if (video.fileSize && video.fileSize > 300 * 1024 * 1024) {
          Alert.alert('File quá lớn', 'Video không được vượt quá 300MB');
          return;
        }
        
        // Kiểm tra duration (7 phút = 420 giây)
        // video.duration có thể là milliseconds hoặc seconds, cần kiểm tra
        // Nếu duration không có, bỏ qua validation (cho phép upload)
        if (video.duration !== undefined && video.duration !== null) {
          let durationInSeconds = video.duration;
          
          // Nếu duration > 1000, có thể là milliseconds, chuyển sang seconds
          if (durationInSeconds > 1000) {
            durationInSeconds = durationInSeconds / 1000;
          }
          
          console.log('⏱️ Video duration:', {
            original: video.duration,
            inSeconds: durationInSeconds,
            maxAllowed: 420,
          });
          
          // Validate: không được quá 7 phút (420 giây)
          if (durationInSeconds > 420) {
            const minutes = Math.floor(durationInSeconds / 60);
            const seconds = Math.round(durationInSeconds % 60);
            Alert.alert('Video quá dài', `Video của bạn dài ${minutes} phút ${seconds} giây. Video không được vượt quá 7 phút (420 giây)`);
            return;
          }
        } else {
          console.log('⚠️ Video duration không có, bỏ qua validation duration');
        }
        
        setVideoUri(video.uri);
        console.log('✅ Video đã được chọn và validate thành công');
      }
    } catch (error) {
      console.error('❌ Error picking video:', error);
      Alert.alert('Lỗi', 'Không thể chọn video. Vui lòng thử lại.');
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !token) {
      ErrorHandler.showErrorAlert(null, VI.authError);
      return;
    }

    if (!title || !description || !category) {
      ErrorHandler.showErrorAlert(null, VI.validationError);
      return;
    }

    // Ghép tên và số lượng thành format "số lượng tên"
    const validIngredients = ingredients
      .map(ing => {
        const name = ing.name?.trim() || '';
        const quantity = ing.quantity?.trim() || '';
        if (name && quantity) {
          return `${quantity} ${name}`;
        } else if (name) {
          return name;
        } else if (quantity) {
          return quantity;
        }
        return '';
      })
      .filter(ing => ing.trim() !== '');
    const validSteps = steps.filter(step => step.trim() !== '');

    if (validIngredients.length === 0 || validSteps.length === 0) {
      ErrorHandler.showErrorAlert(null, VI.ingredientsRequired + ' và ' + VI.stepsRequired);
      return;
    }

    if (!videoUri) {
      ErrorHandler.showErrorAlert(null, 'Vui lòng chọn video để đăng công thức');
      return;
    }

    try {
      setLoading(true);
      
      // Tìm category ID từ tên category
      let categoryId = category;
      if (categoriesList && categoriesList.length > 0) {
        const foundCategory = categoriesList.find((cat: any) => 
          (cat.name || cat) === category
        );
        if (foundCategory && foundCategory._id) {
          categoryId = foundCategory._id;
        }
      }

      // Bước 1: Tạo recipe với text data (KHÔNG có video) - nhanh <1s
      const cookTimeValue = parseInt(cookTime) || 0;
      
      // Map difficulty từ tiếng Việt sang tiếng Anh nếu cần
      let difficultyValue = difficulty;
      const difficultyMap: { [key: string]: string } = {
        'Dễ': 'easy',
        'Trung bình': 'medium',
        'Khó': 'hard',
      };
      if (difficultyMap[difficulty]) {
        difficultyValue = difficultyMap[difficulty];
      }
      
      const recipeData: any = {
        title,
        description,
        category: categoryId,
        difficulty: difficultyValue,
        servings: parseInt(servings) || 1, // Gửi số nguyên, không phải string
        ingredients: JSON.stringify(validIngredients),
        steps: JSON.stringify(validSteps),
      };
      
      // Chỉ thêm cookTime nếu có giá trị
      if (cookTimeValue > 0) {
        recipeData.cookTime = cookTimeValue;
        recipeData.cookTimeMinutes = cookTimeValue;
      }

      console.log('📤 Step 1: Creating recipe (text only)...');
      console.log('📤 Recipe data being sent:', {
        title,
        description: description?.substring(0, 50) + '...',
        category: categoryId,
        difficulty: difficultyValue,
        servings: parseInt(servings) || 1,
        cookTime: cookTimeValue > 0 ? cookTimeValue : undefined,
        ingredientsCount: validIngredients.length,
        stepsCount: validSteps.length,
        ingredients: JSON.stringify(validIngredients).substring(0, 100) + '...',
        steps: JSON.stringify(validSteps).substring(0, 100) + '...',
      });
      
      const createResponse = await recipeAPI.create(recipeData);
      const recipeId = createResponse.data?.recipe?._id || createResponse.data?.recipeId;
      
      if (!recipeId) {
        throw new Error('Không nhận được recipeId từ server');
      }

      console.log('✅ Step 1: Recipe created successfully, ID:', recipeId);

      // Bước 1.5: Set premium nếu creator chọn
      if ((user?.role === 'creator' || user?.role === 'admin') && isPremium && premiumPrice) {
        const price = parseInt(premiumPrice);
        if (price >= 10) {
          try {
            await premiumAPI.setRecipePremium(recipeId, true, price);
            console.log('✅ Premium set successfully');
          } catch (premiumError: any) {
            console.error('⚠️ Error setting premium:', premiumError);
            // Không block nếu set premium lỗi, recipe vẫn được tạo
          }
        }
      }

      // Bước 2: Upload video lên Cloudinary (riêng biệt, không block)
      setUploadingVideo(true);
      console.log('📤 Step 2: Uploading video to Cloudinary...');
      
      const videoUriFixed = Platform.OS === 'android' 
        ? videoUri.replace('file://', '') 
        : videoUri;
      
      const uriParts = videoUriFixed.split('.');
      const extension = uriParts[uriParts.length - 1]?.toLowerCase() || 'mp4';
      const mimeType = extension === 'mov' ? 'video/quicktime' : 'video/mp4';
      
      const videoFormData = new FormData();
      videoFormData.append('video', {
        uri: videoUriFixed,
        name: `recipe-video.${extension}`,
        type: mimeType,
      } as any);

      const uploadResponse = await recipeAPI.uploadVideo(videoFormData);
      const { videoUrl, videoThumbnail, videoDuration, videoSize, videoFormat, videoQualities } = uploadResponse.data;

      console.log('✅ Step 2: Video uploaded successfully:', videoUrl?.substring(0, 50) + '...');

      // Bước 3: Cập nhật recipe với videoUrl
      console.log('📤 Step 3: Updating recipe with video URL...');
      await recipeAPI.updateMedia(recipeId, {
        videoUrl,
        videoThumbnail,
        videoDuration,
        videoSize,
        videoFormat,
        videoQualities,
      });

      console.log('✅ Step 3: Recipe updated with video successfully');
      setUploadingVideo(false);
      
      ErrorHandler.showSuccessAlert(VI.createRecipeSuccess);
      
      // Navigate về màn hình recipes
      setTimeout(() => {
        router.push('/(tabs)/recipes');
      }, 500);
    } catch (error: any) {
      console.error('❌ Error creating recipe:', error);
      console.error('❌ Error response:', error?.response?.data);
      console.error('❌ Validation errors:', error?.response?.data?.errors);
      
      // Hiển thị validation errors chi tiết nếu có
      let errorMessage = error?.response?.data?.message || error?.message || 'Không thể tạo công thức';
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors
          .map((err: any) => `${err.field}: ${err.message}`)
          .join('\n');
        errorMessage = `Lỗi validation:\n${validationErrors}`;
      }
      
      ErrorHandler.showErrorAlert(error, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            {VI.createRecipe}
          </ThemedText>
        </View>

        <View style={styles.form}>
          {/* Video Upload */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Video *</ThemedText>
            <TouchableOpacity style={styles.imageUpload} onPress={pickVideo}>
              {videoUri ? (
                <View style={styles.videoPreview}>
                  <IconSymbol name="play.circle.fill" size={50} color="#FF8C42" />
                  <Text style={styles.videoPreviewText}>Video đã chọn</Text>
                  <Text style={styles.videoPreviewSubtext}>Chạm để chọn video khác</Text>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <IconSymbol name="video.fill" size={40} color="#FF8C42" />
                  <Text style={styles.uploadText}>Video</Text>
                  <Text style={styles.uploadSubtext}>Tối đa 300MB, 7 phút</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Thông tin cơ bản</ThemedText>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{VI.recipeTitle} *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={VI.titlePlaceholder}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{VI.description} *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={VI.descriptionPlaceholder}
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>{VI.category} *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryContainer}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          category === cat && styles.categoryChipActive
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextActive
                        ]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>{VI.cookTime} ({VI.minutes})</Text>
                <TextInput
                  style={styles.input}
                  value={cookTime}
                  onChangeText={setCookTime}
                  placeholder="30"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>{VI.servings}</Text>
                <TextInput
                  style={styles.input}
                  value={servings}
                  onChangeText={setServings}
                  placeholder="4"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{VI.difficulty}</Text>
              <View style={styles.difficultyContainer}>
                {difficulties.map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.difficultyChip,
                      difficulty === diff && styles.difficultyChipActive
                    ]}
                    onPress={() => setDifficulty(diff)}
                  >
                    <Text style={[
                      styles.difficultyChipText,
                      difficulty === diff && styles.difficultyChipTextActive
                    ]}>
                      {diff}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Premium Recipe Option - Chỉ hiển thị cho Creator */}
            {(user?.role === 'creator' || user?.role === 'admin') && (
              <View style={styles.premiumSection}>
                <View style={styles.premiumHeader}>
                  <View style={styles.premiumHeaderLeft}>
                    <IconSymbol name="star.fill" size={20} color="#FFD700" />
                    <Text style={styles.premiumLabel}>Công thức Premium</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggle, isPremium && styles.toggleActive]}
                    onPress={() => {
                      setIsPremium(!isPremium);
                      if (!isPremium) {
                        setPremiumPrice('50'); // Giá mặc định
                      } else {
                        setPremiumPrice('');
                      }
                    }}
                  >
                    <View style={[styles.toggleThumb, isPremium && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
                {isPremium && (
                  <View style={styles.premiumPriceContainer}>
                    <Text style={styles.premiumPriceLabel}>Giá (xu):</Text>
                    <TextInput
                      style={styles.premiumPriceInput}
                      value={premiumPrice}
                      onChangeText={setPremiumPrice}
                      placeholder="50"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                    <Text style={styles.premiumPriceHint}>Tối thiểu 10 xu</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>{VI.ingredients}</ThemedText>
              <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
                <IconSymbol name="plus" size={20} color="#FF8C42" />
              </TouchableOpacity>
            </View>

            {(ingredients ?? []).map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <TextInput
                  style={[styles.input, styles.ingredientNameInput]}
                  value={ingredient.name}
                  onChangeText={(value) => updateIngredientName(index, value)}
                  placeholder={`Tên nguyên liệu ${index + 1}`}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.input, styles.ingredientQuantityInput]}
                  value={ingredient.quantity}
                  onChangeText={(value) => updateIngredientQuantity(index, value)}
                  placeholder="Số lượng"
                  placeholderTextColor="#999"
                />
                {(ingredients ?? []).length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeIngredient(index)}
                    style={styles.removeButton}
                  >
                    <IconSymbol name="minus" size={20} color="#FF8C42" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Steps */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>{VI.steps}</ThemedText>
              <TouchableOpacity onPress={addStep} style={styles.addButton}>
                <IconSymbol name="plus" size={20} color="#FF8C42" />
              </TouchableOpacity>
            </View>

            {(steps ?? []).map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.stepInput]}
                  value={step}
                  onChangeText={(value) => updateStep(index, value)}
                  placeholder={`${VI.stepPlaceholder} ${index + 1}`}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={2}
                />
                {(steps ?? []).length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeStep(index)}
                    style={styles.removeButton}
                  >
                    <IconSymbol name="minus" size={20} color="#FF8C42" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (loading || uploadingVideo) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || uploadingVideo}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Đang tạo công thức...</Text>
              </View>
            ) : uploadingVideo ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Đang xử lý video...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>
                {VI.createRecipe}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </AuthGuard>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FF8C42',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  imageUpload: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  uploadedImage: {
    width: 116,
    height: 116,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  uploadText: {
    fontSize: 14,
    color: '#FF8C42',
    fontFamily: 'Inter_500Medium',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  videoPreviewText: {
    fontSize: 14,
    color: '#FF8C42',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 8,
  },
  videoPreviewSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  difficultyChipActive: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  difficultyChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
  },
  difficultyChipTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  ingredientNameInput: {
    flex: 1,
  },
  ingredientQuantityInput: {
    width: 120,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  stepInput: {
    flex: 1,
    height: 60,
    textAlignVertical: 'top',
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
  },
  submitButton: {
    backgroundColor: '#FF8C42',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  premiumSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#FF8C42',
  },
  toggleThumb: {
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
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  premiumPriceContainer: {
    marginTop: 12,
  },
  premiumPriceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Inter_500Medium',
  },
  premiumPriceInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
  },
  premiumPriceHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
});


