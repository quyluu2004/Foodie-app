import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Alert,
  FlatList, // Add FlatList import
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ChatBubble } from '@/components/ChatBubble';
import { useAuth } from '@/contexts/AuthContext';
import { recipeAPI } from '@/contexts/api';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { MessageItem } from '@/components/MessageItem';
import axios from 'axios';
import { resolveApiBase } from '@/config/api';

const { width } = Dimensions.get('window');
const RECIPE_CARD_WIDTH = width * 0.7;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  recipeIds?: string[];
  imageUri?: string;
}

interface Recipe {
  _id: string;
  title: string;
  imageUrl?: string;
  updatedAt?: string | Date;
  cookTimeMinutes?: number;
  averageRating?: number;
  ratingCount?: number;
  difficulty?: string;
  // Media fields (match backend recipe shape)
  mediaType?: 'image' | 'video';
  videoThumbnail?: string;
  videoUrl?: string;
}

// Counter để đảm bảo ID unique
let messageIdCounter = 0;

export default function AIChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      text: 'Xin chào! Mình là trợ lý AI của Foodie. Mình có thể giúp bạn về nấu ăn, công thức, nguyên liệu, dinh dưỡng và các chủ đề liên quan đến thực phẩm. Bạn muốn hỏi gì?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<{ [key: string]: Recipe }>({});
  const [loadingRecipes, setLoadingRecipes] = useState<{ [key: string]: boolean }>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { token } = useAuth();

  // Axios instance cho AI chat
  const aiChatApiRef = useRef<ReturnType<typeof axios.create> | null>(null);
  const tokenRef = useRef<string | null>(null);

  // Cập nhật tokenRef khi token thay đổi
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Khởi tạo axios instance
  useEffect(() => {
    if (!aiChatApiRef.current) {
      const BASE_URL = resolveApiBase("http://localhost:8080/api");

      aiChatApiRef.current = axios.create({
        baseURL: BASE_URL,
        timeout: 60000,
      });

      // Thêm interceptor để tự động thêm token
      aiChatApiRef.current.interceptors.request.use(
        (config) => {
          const currentToken = tokenRef.current;
          if (currentToken) {
            config.headers.Authorization = `Bearer ${currentToken}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );
    }
  }, []);

  // Scroll to end khi messages thay đổi
  useEffect(() => {
    if (messages.length > 0) {
      // Sử dụng requestAnimationFrame để đảm bảo scroll sau khi render
      requestAnimationFrame(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 200);
      });
    }
  }, [messages.length]);

  // Debug: Log messages khi render - sử dụng useLayoutEffect để log trước khi render
  // Debug: Log messages khi render - sử dụng useLayoutEffect để log trước khi render
  // useLayoutEffect(() => {
  //   console.log('🎨 [AI Chat] Messages state updated (before render):', {
  //     count: messages.length,
  //     ids: messages.map(m => ({ id: m.id, isUser: m.isUser, textLength: m.text?.length || 0 }))
  //   });
  // }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const showImagePicker = () => {
    Alert.alert(
      'Chọn hình ảnh',
      'Bạn muốn chọn hình ảnh từ đâu?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thư viện',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              setSelectedImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Chụp ảnh',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              setSelectedImage(result.assets[0].uri);
            }
          },
        },
      ]
    );
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  // Extract recipe IDs từ message text
  const extractRecipeIds = (text: string): string[] => {
    const recipeRegex = /\[RECIPE:([a-f0-9]{24}):[^\]]+\]/gi;
    const ids: string[] = [];
    let match;

    recipeRegex.lastIndex = 0;
    while ((match = recipeRegex.exec(text)) !== null) {
      const id = match[1]?.trim();
      if (id && id.length === 24 && /^[a-f0-9]{24}$/i.test(id)) {
        ids.push(id);
      }
    }

    return [...new Set(ids)];
  };

  // Fetch recipe data
  const fetchRecipes = useCallback(async (recipeIds: string[]) => {
    const newRecipes: { [key: string]: Recipe } = {};
    const toFetch = recipeIds.filter(id => !recipes[id] && !loadingRecipes[id]);

    if (toFetch.length === 0) return;

    setLoadingRecipes(prev => {
      const updated = { ...prev };
      toFetch.forEach(id => {
        updated[id] = true;
      });
      return updated;
    });

    try {
      const promises = toFetch.map(async (id) => {
        try {
          const cleanId = id?.trim();
          if (!cleanId || cleanId.length !== 24 || !/^[a-f0-9]{24}$/i.test(cleanId)) {
            return null;
          }

          const response = await recipeAPI.getById(cleanId);
          const recipeData = response.data?.recipe || response.data?.data || response.data;
          return { id, recipe: recipeData };
        } catch (error) {
          console.error(`Error fetching recipe ${id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      results.forEach((result) => {
        if (result && result.recipe) {
          newRecipes[result.id] = result.recipe;
        }
      });

      setRecipes(prev => ({ ...prev, ...newRecipes }));
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoadingRecipes(prev => {
        const updated = { ...prev };
        toFetch.forEach(id => {
          delete updated[id];
        });
        return updated;
      });
    }
  }, [recipes, loadingRecipes]);

  const sendMessage = async () => {
    // Kiểm tra điều kiện
    if ((!inputText.trim() && !selectedImage) || loading) {
      return;
    }

    const messageText = inputText.trim();
    const imageUri = selectedImage;

    // Tạo user message với ID unique
    messageIdCounter++;
    const userMessageId = `user-${Date.now()}-${messageIdCounter}`;
    const userMessage: Message = {
      id: userMessageId,
      text: messageText || 'Phân tích hình ảnh này',
      isUser: true,
      timestamp: new Date(),
      imageUri: imageUri || undefined,
    };

    // Thêm user message vào state
    setMessages(prev => {
      // Đảm bảo không trùng lặp ID (dù rất hiếm)
      const exists = prev.some(m => m.id === userMessage.id);
      if (exists) return prev;
      return [...prev, userMessage];
    });

    // Clear input và image
    setInputText('');
    setSelectedImage(null);

    // Auto scroll to bottom ngay lập tức
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    // Set loading
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', messageText || 'Phân tích hình ảnh này');

      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        (formData as any).append('image', {
          uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
          name: filename,
          type: type,
        });
      }

      // Resolve API URL
      // Lấy base URL từ cấu hình hiện tại hoặc default
      const baseUrl = aiChatApiRef.current?.defaults.baseURL || "http://10.0.2.2:8080/api";
      const apiUrl = `${baseUrl}/ai/chat`;

      // console.log('📤 [AI Chat] Sending request (fetch):', {
      //   url: apiUrl,
      //   hasMessage: !!messageText,
      //   hasImage: !!imageUri
      // });

      // Prepare headers
      const headers: any = {
        'Accept': 'application/json',
      };

      // Add Authorization if token exists
      if (tokenRef.current) {
        headers['Authorization'] = `Bearer ${tokenRef.current}`;
      }

      // Lưu ý: KHÔNG set 'Content-Type': 'multipart/form-data' thủ công với fetch
      // Browser/Runtime sẽ tự động set boundary cho FormData

      // Use fetch instead of axios for better FormData handling on Android
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      // console.log('✅ [AI Chat] Request successful');

      // Parse response
      let aiText = '';
      if (responseData) {
        if (typeof responseData === 'string') {
          aiText = responseData;
        } else if (responseData.message) {
          aiText = responseData.message;
        } else if (responseData.data && typeof responseData.data === 'string') {
          aiText = responseData.data;
        } else {
          aiText = JSON.stringify(responseData);
        }
      }

      if (!aiText || aiText.trim().length === 0) {
        aiText = 'Xin lỗi, không nhận được phản hồi từ AI.';
      }

      const recipeIds = extractRecipeIds(aiText);

      // Tạo AI message với ID unique
      messageIdCounter++;
      const aiMessageId = `ai-${Date.now()}-${messageIdCounter}`;
      const aiMessage: Message = {
        id: aiMessageId,
        text: aiText.trim(),
        isUser: false,
        timestamp: new Date(),
        recipeIds: recipeIds.length > 0 ? recipeIds : undefined,
      };

      // Thêm AI message vào state
      setMessages(prev => [...prev, aiMessage]);

      // Fetch recipe data nếu có
      if (recipeIds.length > 0) {
        fetchRecipes(recipeIds);
      }
    } catch (error: any) {
      console.error('❌ [AI Chat] Error sending message:', error);

      let errorText = 'Xin lỗi, có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.';

      if (error.message?.includes('Network request failed') || error.message?.includes('Network Error')) {
        errorText = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo server backend đang chạy.';
      } else if (error.message) {
        errorText = error.message;
      }

      // Tạo error message với ID unique
      messageIdCounter++;
      const errorMessageId = `error-${Date.now()}-${messageIdCounter}`;
      const errorMessage: Message = {
        id: errorMessageId,
        text: errorText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Ionicons name="restaurant" size={20} color="#FF8C42" />
          </View>
          <Text style={styles.headerTitle}>AI Trợ Lý Nấu Ăn</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        extraData={recipes}
        keyExtractor={(item, index) => item.id || `msg-${index}`}
        removeClippedSubviews={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        renderItem={({ item }) => (
          <MessageItem
            item={item}
            recipes={recipes}
            formatTime={formatTime}
          />
        )}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        onLayout={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
          </View>
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF8C42" />
              <Text style={styles.loadingText}>AI đang suy nghĩ...</Text>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          {selectedImage && (
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                <Ionicons name="close-circle" size={24} color="#FF8C42" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={showImagePicker}
              disabled={loading}
            >
              <Ionicons name="image-outline" size={24} color="#FF8C42" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Nhập câu hỏi của bạn..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendButton, ((!inputText.trim() && !selectedImage) || loading) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={(!inputText.trim() && !selectedImage) || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Poppins_600SemiBold',
  },
  placeholder: {
    width: 40,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    fontSize: 15,
    color: '#1F2937',
    fontFamily: 'Inter_400Regular',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  recipeCardsContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingLeft: 16,
  },
  recipeCardsScroll: {
    paddingRight: 16,
    gap: 12,
  },
  recipeCard: {
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: RECIPE_CARD_WIDTH,
  },
  recipeImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  recipeImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeEmoji: {
    fontSize: 60,
  },
  recipeInfo: {
    padding: 12,
    width: '100%',
    minHeight: 80,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A1A',
    lineHeight: 22,
    marginBottom: 8,
    width: '100%',
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recipeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 8,
    marginHorizontal: 16,
    alignSelf: 'flex-start',
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    flex: 1,
  },
  imageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  userImageContainer: {
    marginRight: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: width * 0.7,
    alignSelf: 'flex-end',
  },
  userImage: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 12,
  },
});
