import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  StatusBar,
  Platform,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Linking,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { postAPI, authAPI, statsAPI, saveAPI, notificationAPI, recipeAPI, categoryAPI, premiumAPI } from '@/contexts/api';
import { Ionicons } from '@expo/vector-icons';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingPizza from '@/components/LoadingPizza';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { useRecipeLikes, useRecipeSaves } from '@/hooks/useRecipes';

interface Post {
  _id: string;
  imageUrl: string;
  caption: string;
  likes: string[];
  comments: any[];
  createdAt: string;
}

// My Recipe Card Component - Hiển thị recipe với stats và nút edit (nếu là creator)
const MyRecipeCard = ({ recipe, isCreator }: { recipe: any; isCreator: boolean }) => {
  const { likesCount } = useRecipeLikes(recipe._id);
  const savesCount = recipe.savesCount || 0;
  const sharesCount = 0; // Tạm thời, có thể thêm sau

  return (
    <TouchableOpacity
      style={styles.tastyRecipeCard}
      onPress={() => router.push(`/modal?id=${recipe._id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.tastyRecipeImageContainer}>
        <ImageWithFallback
          imageUrl={
            // Ưu tiên videoThumbnail nếu có video, sau đó mới dùng imageUrl
            recipe.mediaType === 'video' && recipe.videoThumbnail
              ? recipe.videoThumbnail
              : normalizeImageUrl(recipe.imageUrl, recipe.updatedAt) || recipe.imageUrl
          }
          style={styles.tastyRecipeImage}
          resizeMode="cover"
          fallbackIcon="restaurant-outline"
          fallbackIconSize={48}
        />
        {isCreator && (
          <TouchableOpacity
            style={styles.tastyRecipeEditButton}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/create-recipe?id=${recipe._id}`);
            }}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.tastyRecipeContent}>
        <Text style={styles.tastyRecipeTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.tastyRecipeStats}>
          <View style={styles.tastyRecipeStatItem}>
            <Ionicons name="heart" size={14} color="#EF4444" />
            <Text style={styles.tastyRecipeStatText}>{likesCount || 0}</Text>
          </View>
          <View style={styles.tastyRecipeStatItem}>
            <Ionicons name="bookmark" size={14} color="#F59E0B" />
            <Text style={styles.tastyRecipeStatText}>{savesCount || 0}</Text>
          </View>
          <View style={styles.tastyRecipeStatItem}>
            <Ionicons name="share-social" size={14} color="#6366F1" />
            <Text style={styles.tastyRecipeStatText}>{sharesCount || 0}</Text>
          </View>
          <View style={styles.tastyRecipeStatItem}>
            <Ionicons name="eye" size={14} color="#10B981" />
            <Text style={styles.tastyRecipeStatText}>{recipe.views || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-posts' | 'saved-posts' | 'my-recipes' | 'user-info'>('my-posts'); // 'my-posts' = saved recipes tab
  const [savedSubTab, setSavedSubTab] = useState<'recipes' | 'posts'>('recipes'); // Sub-tab trong tab "Lưu trữ"
  const [myRecipes, setMyRecipes] = useState<any[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bio, setBio] = useState(user?.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [newLinkType, setNewLinkType] = useState<'email' | 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'website' | 'custom'>('email');
  const [newLinkValue, setNewLinkValue] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedRecipesStats, setSavedRecipesStats] = useState<any>(null);
  const [cookedStats, setCookedStats] = useState<any>(null);
  const [activityStats, setActivityStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const { unreadCount: unreadNotifications, refreshUnreadCount } = useNotifications();
  const [followersCount, setFollowersCount] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [userCoins, setUserCoins] = useState(0);
  const [loadingCoins, setLoadingCoins] = useState(false);
  
  // Tab layout refs
  const tabLayouts = useRef<{ [key: string]: { x: number; width: number } }>({});
  
  // Animation values
  const headerHeight = useSharedValue(280); // Increased height to fit stats
  const avatarScale = useSharedValue(1);
  const cardTranslateY = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const menuItemTranslateX = useSharedValue(50);
  const menuItemOpacity = useSharedValue(0);
  
  // Tab underline animation
  const tabUnderlinePosition = useSharedValue(0);
  const tabUnderlineWidth = useSharedValue(0);
  
  // Function to update tab underline position
  const updateTabUnderline = (tab: 'my-posts' | 'saved-posts' | 'my-recipes' | 'user-info') => {
    const layout = tabLayouts.current[tab];
    if (layout) {
      tabUnderlineWidth.value = withSpring(layout.width, { damping: 15, stiffness: 150 });
      tabUnderlinePosition.value = withSpring(layout.x, { damping: 15, stiffness: 150 });
    }
  };

  // Use actual user data from AuthContext, fallback to defaults if not available
  const userData = {
    name: user?.name || 'Foodie User',
    email: user?.email || '',
    phone: user?.phone || 'Chưa cập nhật',
    birthDate: user?.birthDate 
      ? new Date(user.birthDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Chưa cập nhật',
    joinDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : 'Chưa xác định',
    recipesCooked: 0, // TODO: Get from API
    recipesSaved: 0, // TODO: Get from API
    level: 'Đầu bếp nghiệp dư',
    avatar: user?.avatarUrl || null,
    bio: user?.bio || '',
    socialLinks: user?.socialLinks || {},
    role: user?.role || 'user', // Thêm role vào userData
  };

  // Debug: Log user role để kiểm tra
  useEffect(() => {
    console.log('👤 User role in Profile:', user?.role);
    console.log('👤 UserData role:', userData.role);
    console.log('👤 Should show badge:', userData.role === 'creator');
  }, [user?.role]);

  useEffect(() => {
    setBio(user?.bio || '');
  }, [user?.bio]);

  // Sử dụng utility function để normalize avatar URL
  const getValidAvatarUrl = normalizeImageUrl;

  const loadUserPosts = async () => {
    if (!user?._id) return;

    try {
      setLoadingPosts(true);
      const response = await postAPI.getByUser(user._id, 1, 100);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('❌ Error loading user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadSavedPosts = async () => {
    if (!user?._id) return;

    try {
      setLoadingSavedPosts(true);
      console.log('📖 Loading saved posts for user:', user._id);
      const response = await postAPI.getSavedPosts(1, 100);
      console.log('✅ Saved posts response:', JSON.stringify(response.data, null, 2));
      const posts = response.data?.posts || response.data || [];
      console.log('📖 Found saved posts:', posts.length);
      console.log('📖 Saved posts data:', posts.map((p: any) => ({ id: p._id, caption: p.caption?.substring(0, 30) })));
      setSavedPosts(Array.isArray(posts) ? posts : []);
    } catch (error) {
      console.error('❌ Error loading saved posts:', error);
      setSavedPosts([]);
    } finally {
      setLoadingSavedPosts(false);
    }
  };

  const loadMyRecipes = async () => {
    if (!user?._id) return;

    try {
      setLoadingRecipes(true);
      // Lấy tất cả recipes, sau đó filter theo author
      const response = await recipeAPI.getAll(1, 100);
      const allRecipes = response.data?.recipes || response.data || [];
      // Filter recipes của user hiện tại
      const userRecipes = allRecipes.filter((recipe: any) => 
        recipe.author?._id === user._id || recipe.createdBy?._id === user._id || recipe.author === user._id
      );
      
      // Load saves count cho mỗi recipe
      const recipesWithStats = await Promise.all(
        userRecipes.map(async (recipe: any) => {
          try {
            // Load saves count từ API (tạm thời dùng 0, có thể thêm API endpoint sau)
            // TODO: Thêm API endpoint để lấy saves count của recipe
            const savesCount = 0; // Tạm thời
            return {
              ...recipe,
              savesCount,
            };
          } catch (error) {
            console.error('Error loading stats for recipe:', recipe._id, error);
            return {
              ...recipe,
              savesCount: 0,
            };
          }
        })
      );
      
      setMyRecipes(recipesWithStats);
      
      // Cập nhật ratings count sau khi load recipes
      const recipesWithRatings = recipesWithStats.filter((r: any) => 
        r.rating && r.rating > 0
      ).length;
      setRatingsCount(recipesWithRatings);
    } catch (error) {
      console.error('❌ Error loading my recipes:', error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const loadStats = async () => {
    if (!user?._id) {
      console.warn('⚠️ [loadStats] No user ID, skipping load');
      return;
    }

    try {
      setLoadingStats(true);
      // Lấy saved recipes từ API mới
      console.log('📖 [loadStats] ========================================');
      console.log('📖 [loadStats] Loading saved recipes for user:', user._id);
      console.log('📖 [loadStats] User name:', user?.name || 'Unknown');
      console.log('📖 [loadStats] API endpoint: /saved/user/' + user._id);
      
      const savedRecipesResponse = await saveAPI.getSavedRecipes(user._id);
      console.log('✅ [loadStats] Full response:', savedRecipesResponse);
      console.log('✅ [loadStats] Response status:', savedRecipesResponse.status);
      console.log('✅ [loadStats] Response data:', JSON.stringify(savedRecipesResponse.data, null, 2));
      
      // Backend trả về { message, recipes, count }
      let savedRecipes = savedRecipesResponse.data?.recipes || savedRecipesResponse.data?.savedRecipes || [];
      
      // Nếu không có recipes, thử lấy từ data trực tiếp
      if (!Array.isArray(savedRecipes) || savedRecipes.length === 0) {
        if (Array.isArray(savedRecipesResponse.data)) {
          savedRecipes = savedRecipesResponse.data;
        }
      }
      
      // Đảm bảo savedRecipes là array
      if (!Array.isArray(savedRecipes)) {
        console.warn('⚠️ [loadStats] savedRecipes is not an array:', typeof savedRecipes);
        savedRecipes = [];
      }
      
      // Extract recipes từ Saved objects nếu cần (khi backend trả về Saved objects với field recipe)
      const extractedRecipes = savedRecipes.map((item: any) => {
        // Nếu item có field recipe, đó là Saved object -> extract recipe
        if (item && item.recipe && typeof item.recipe === 'object') {
          return item.recipe;
        }
        // Nếu item đã là Recipe object, trả về trực tiếp
        return item;
      }).filter((recipe: any) => {
        // Lọc bỏ null/undefined
        return recipe != null && recipe._id != null;
      });
      
      const totalSaved = extractedRecipes.length;
      console.log('📖 [loadStats] Found saved recipes:', totalSaved);
      console.log('📖 [loadStats] Recipe IDs:', extractedRecipes.map((r: any) => r._id));
      console.log('📖 [loadStats] Recipe titles:', extractedRecipes.map((r: any) => r.title || 'No title'));
      console.log('🖼️ [loadStats] Recipe images:', extractedRecipes.map((r: any) => ({
        id: r._id,
        title: r.title,
        imageUrl: r.imageUrl || r.image || 'NO IMAGE',
        hasImage: !!(r.imageUrl || r.image)
      })));
      
      // Lấy stats từ statsAPI
      const [cookedRes, activityRes] = await Promise.all([
        statsAPI.getCookedStats(),
        statsAPI.getActivityStats(),
      ]);
      
      // Cập nhật savedRecipesStats với dữ liệu đã extract
      const newStats = {
        totalSaved: totalSaved,
        savedRecipes: extractedRecipes,
      };
      
      console.log('✅ [loadStats] Setting savedRecipesStats:', {
        totalSaved: newStats.totalSaved,
        savedRecipesCount: newStats.savedRecipes.length,
        recipeIds: newStats.savedRecipes.map((r: any) => r._id),
        recipeTitles: newStats.savedRecipes.map((r: any) => r.title || 'No title')
      });
      
      setSavedRecipesStats(newStats);
      setCookedStats(cookedRes.data);
      setActivityStats(activityRes.data);
      
      console.log('✅ [loadStats] Updated savedRecipesStats with', totalSaved, 'recipes');
      console.log('📖 [loadStats] ========================================');
    } catch (error: any) {
      console.error('❌ [loadStats] Error loading stats:', error);
      console.error('❌ [loadStats] Error details:', error.response?.data || error.message);
      
      // Fallback: thử dùng statsAPI nếu saveAPI lỗi
      try {
        console.log('🔄 [loadStats] Trying fallback API...');
        const savedRes = await statsAPI.getSavedRecipesStats();
        const fallbackData = savedRes.data || {};
        let fallbackRecipes = Array.isArray(fallbackData.savedRecipes) ? fallbackData.savedRecipes : (Array.isArray(fallbackData) ? fallbackData : []);
        
        // Extract recipes nếu cần
        if (Array.isArray(fallbackRecipes) && fallbackRecipes.length > 0) {
          const firstItem = fallbackRecipes[0];
          if (firstItem && firstItem.recipe && !firstItem.title) {
            fallbackRecipes = fallbackRecipes
              .map((item: any) => item.recipe || item)
              .filter((recipe: any) => recipe != null && recipe._id != null);
          }
        }
        
        console.log('✅ [loadStats] Fallback loaded', fallbackRecipes.length, 'recipes');
        setSavedRecipesStats({
          totalSaved: fallbackData.totalSaved || fallbackRecipes.length || 0,
          savedRecipes: fallbackRecipes,
        });
      } catch (fallbackError: any) {
        // Không log error cho 429 (rate limit) - đây là lỗi bình thường
        if (fallbackError.response?.status !== 429) {
          console.error('❌ [loadStats] Error loading saved recipes stats (fallback):', fallbackError);
        } else {
          console.warn('⚠️ [loadStats] Rate limit in fallback, skipping...');
        }
        // Set empty state if all fails
        setSavedRecipesStats({
          totalSaved: 0,
          savedRecipes: [],
        });
      }
    } finally {
      setLoadingStats(false);
    }
  };

  // Update tab underline when activeTab changes
  useEffect(() => {
    updateTabUnderline(activeTab as 'my-posts' | 'saved-posts' | 'my-recipes' | 'user-info');
  }, [activeTab]);

  // Refresh saved recipes when screen comes into focus (e.g., after saving a recipe)
  useFocusEffect(
    React.useCallback(() => {
      if (user?._id) {
        console.log('🔄 [useFocusEffect] Screen focused, refreshing saved recipes...');
        // Refresh saved recipes and posts when returning to profile
        loadStats();
        if (savedSubTab === 'posts') {
          loadSavedPosts();
        }
      }
    }, [user?._id, savedSubTab])
  );

  // Load saved posts when switching to saved posts sub-tab
  useEffect(() => {
    if (activeTab === 'my-posts' && savedSubTab === 'posts' && user?._id) {
      console.log('🔄 Loading saved posts for sub-tab');
      loadSavedPosts();
    }
  }, [activeTab, savedSubTab, user?._id]);

  // Refresh saved recipes when switching to recipes sub-tab
  useEffect(() => {
    if (activeTab === 'my-posts' && savedSubTab === 'recipes' && user?._id) {
      console.log('🔄 Loading saved recipes for sub-tab');
      loadStats();
    }
  }, [activeTab, savedSubTab, user?._id]);

  // Refresh saved recipes when tab becomes active
  useEffect(() => {
    if (activeTab === 'my-posts' && user?._id) {
      console.log('🔄 Tab "Lưu trữ" is active, refreshing data...');
      loadStats();
      if (savedSubTab === 'posts') {
        loadSavedPosts();
      }
    }
  }, [activeTab, user?._id]);

  // Load my recipes when "Công thức" tab becomes active
  useEffect(() => {
    if (activeTab === 'my-recipes' && user?._id) {
      console.log('🔄 Tab "Công thức" is active, loading recipes...');
      loadMyRecipes();
    }
  }, [activeTab, user?._id]);

  useEffect(() => {
    // Initial animations
    setTimeout(() => {
      cardTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
      cardOpacity.value = withTiming(1, { duration: 600 });
    }, 200);

    // Menu items animation
    setTimeout(() => {
      menuItemTranslateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      menuItemOpacity.value = withTiming(1, { duration: 800 });
    }, 400);

          // Refresh user data from server to get latest role
          refreshUser();
          // Load user posts, saved posts, recipes and stats
          loadUserPosts();
          loadSavedPosts();
          loadMyRecipes();
          loadStats();
          loadNotifications();
          loadUserStats();
          loadUserCoins();
        }, [user?._id]);

  const loadNotifications = async () => {
    // Use NotificationContext to refresh count
    await refreshUnreadCount();
  };

  const loadUserStats = async () => {
    if (!user?._id) return;

    try {
      // Lấy followers count từ getUserById
      const response = await authAPI.getUserById(user._id);
      setFollowersCount(response.data?.followersCount || 0);
      
      // Tính ratings từ myRecipes (số recipes có rating > 0)
      const recipesWithRatings = myRecipes.filter((r: any) => 
        r.rating && r.rating > 0
      ).length;
      setRatingsCount(recipesWithRatings);
    } catch (error) {
      console.error('❌ Error loading user stats:', error);
    }
  };

  const loadUserCoins = async () => {
    if (!user?._id) return;

    try {
      setLoadingCoins(true);
      const response = await premiumAPI.getMyCoins();
      setUserCoins(response.data?.coins || 0);
    } catch (error) {
      console.error('❌ Error loading user coins:', error);
    } finally {
      setLoadingCoins(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser(); // Refresh user data first
    await Promise.all([loadUserPosts(), loadSavedPosts(), loadMyRecipes(), loadStats(), loadNotifications(), loadUserCoins()]);
    setRefreshing(false);
  };

  const handleSaveBio = async () => {
    try {
      setSaving(true);
      const response = await authAPI.updateProfile({
        bio: bio,
        socialLinks: user?.socialLinks,
      });
      if (response.data?.user && updateUser) {
        updateUser(response.data.user);
      }
      setIsEditingBio(false);
      Alert.alert('Thành công', 'Đã cập nhật mô tả');
    } catch (error: any) {
      console.error('❌ Error saving bio:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật mô tả');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = () => {
    setShowAddLinkModal(true);
    setNewLinkValue('');
    setNewLinkLabel('');
  };

  const handleSaveLink = async () => {
    if (!newLinkValue.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập link');
      return;
    }

    try {
      setSaving(true);
      const currentLinks = user?.socialLinks || {};
      const updatedLinks = { ...currentLinks };

      if (newLinkType === 'custom') {
        if (!newLinkLabel.trim()) {
          Alert.alert('Lỗi', 'Vui lòng nhập tên link');
          return;
        }
        updatedLinks.custom = [
          ...(updatedLinks.custom || []),
          { label: newLinkLabel.trim(), url: newLinkValue.trim() }
        ];
      } else {
        updatedLinks[newLinkType] = newLinkValue.trim();
      }

      const response = await authAPI.updateProfile({
        bio: user?.bio || '',
        socialLinks: updatedLinks,
      });
      if (response.data?.user && updateUser) {
        updateUser(response.data.user);
      }
      setShowAddLinkModal(false);
      setNewLinkValue('');
      setNewLinkLabel('');
      Alert.alert('Thành công', 'Đã thêm link');
    } catch (error: any) {
      console.error('❌ Error saving link:', error);
      Alert.alert('Lỗi', 'Không thể thêm link');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenLink = async (url: string) => {
    if (!url) return;
    
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = `https://${url}`;
    }

    try {
      const canOpen = await Linking.canOpenURL(finalUrl);
      if (canOpen) {
        await Linking.openURL(finalUrl);
      } else {
        Alert.alert('Lỗi', 'Không thể mở link này');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể mở link');
    }
  };

  const getSocialLinkIcon = (type: string) => {
    switch (type) {
      case 'email':
        return 'mail-outline';
      case 'facebook':
        return 'logo-facebook';
      case 'instagram':
        return 'logo-instagram';
      case 'twitter':
        return 'logo-twitter';
      case 'youtube':
        return 'logo-youtube';
      case 'website':
        return 'globe-outline';
      default:
        return 'link-outline';
    }
  };

  const getSocialLinkLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'facebook':
        return 'Facebook';
      case 'instagram':
        return 'Instagram';
      case 'twitter':
        return 'Twitter';
      case 'youtube':
        return 'YouTube';
      case 'website':
        return 'Website';
      default:
        return type;
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: headerHeight.value,
    };
  });

  const avatarAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: avatarScale.value }],
    };
  });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: cardTranslateY.value }],
      opacity: cardOpacity.value,
    };
  });

  const menuItemAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: menuItemTranslateX.value }],
      opacity: menuItemOpacity.value,
    };
  });

  const handleEditProfile = () => {
    avatarScale.value = withSpring(1.1, { duration: 200 }, () => {
      avatarScale.value = withSpring(1);
    });
    Alert.alert('Chỉnh sửa hồ sơ', 'Tính năng đang được phát triển');
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
      router.replace('/auth');
    };

    if (Platform.OS === 'web') {
      // Alert.alert with buttons is not supported on Expo Web
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        await doLogout();
      }
    } else {
      Alert.alert(
        'Đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng xuất', style: 'destructive', onPress: doLogout },
        ]
      );
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8C42" />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View style={[styles.headerContent, { paddingTop: Platform.OS === 'ios' ? 20 : 40 }]}>
            {/* Avatar and Settings Row */}
            <View style={styles.avatarRow}>
              {/* Chat Icon - Góc trên cùng bên trái */}
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => router.push('/chat-list')}
              >
                <Ionicons name="chatbubbles-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              
              <Animated.View style={[styles.avatarContainer, avatarAnimatedStyle]}>
                {(() => {
                  const validAvatarUrl = getValidAvatarUrl(userData.avatar);
                  return validAvatarUrl ? (
                    <Image 
                      source={{ uri: validAvatarUrl }} 
                      style={styles.avatarImage}
                      onError={(e) => {
                        console.error('Error loading avatar:', e.nativeEvent.error);
                        console.error('Avatar URL:', validAvatarUrl);
                      }}
                      onLoad={() => {
                        console.log('✅ Avatar loaded successfully:', validAvatarUrl);
                      }}
                    />
                  ) : (
                    <Text style={styles.avatarEmoji}>👨‍🍳</Text>
                  );
                })()}
                {/* Creator Badge - Nón đầu bếp */}
                {userData?.role === 'creator' && (
                  <View style={styles.creatorBadge}>
                    <LinearGradient
                      colors={['#FFD43B', '#FFB300']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.creatorBadgeGradient}
                    >
                      <Ionicons name="restaurant" size={8} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                )}
              </Animated.View>
              
              {/* Notifications Icon */}
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push('/notifications')}
              >
                <Ionicons name="notifications-outline" size={28} color="#FFFFFF" />
                {unreadNotifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {/* Settings Icon */}
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* User Name - Right below avatar */}
            <ThemedText type="title" style={styles.userName} numberOfLines={2}>
              {userData.name}
            </ThemedText>
            
            {/* Stats Row */}
            <View style={styles.userStatsRow}>
              <View style={styles.userStatItem}>
                <Text style={styles.userStatNumber}>{followersCount}</Text>
                <Text style={styles.userStatLabel}>Theo dõi</Text>
              </View>
              <View style={styles.userStatItem}>
                <Text style={styles.userStatNumber}>{posts.length}</Text>
                <Text style={styles.userStatLabel}>Đăng bài</Text>
              </View>
              <View style={styles.userStatItem}>
                <Text style={styles.userStatNumber}>{ratingsCount}</Text>
                <Text style={styles.userStatLabel}>Đánh giá</Text>
              </View>
            </View>
            
          </View>
        </Animated.View>

        {/* Coins Widget - Ngay dưới stats row và trên tab bar */}
        <View style={styles.coinsWidgetContainer}>
          <View style={styles.coinsWidget}>
            <View style={styles.coinsWidgetLeft}>
              <View style={styles.coinIconContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.coinIconGradient}
                >
                  <Text style={styles.coinIconText}>₫</Text>
                </LinearGradient>
              </View>
              <Text style={styles.coinsAmount}>
                {loadingCoins ? '...' : userCoins.toLocaleString('vi-VN')} Xu
              </Text>
            </View>
            <TouchableOpacity
              style={styles.topUpButton}
              onPress={() => {
                router.push('/top-up');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.topUpButtonText}>Nạp ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modern Tab Bar */}
        <Animated.View style={[styles.modernTabContainer, cardAnimatedStyle]}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={styles.modernTab}
              onPress={() => setActiveTab('my-posts')}
              onLayout={(event) => {
                const { width, x } = event.nativeEvent.layout;
                tabLayouts.current['my-posts'] = { width, x };
                if (activeTab === 'my-posts') {
                  updateTabUnderline('my-posts');
                }
              }}
            >
              <Ionicons 
                name={activeTab === 'my-posts' ? 'bookmark' : 'bookmark-outline'} 
                size={24} 
                color={activeTab === 'my-posts' ? '#FF7A00' : '#9CA3AF'} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modernTab}
              onPress={() => setActiveTab('saved-posts')}
              onLayout={(event) => {
                const { width, x } = event.nativeEvent.layout;
                tabLayouts.current['saved-posts'] = { width, x };
                if (activeTab === 'saved-posts') {
                  updateTabUnderline('saved-posts');
                }
              }}
            >
              <Ionicons 
                name={activeTab === 'saved-posts' ? 'images' : 'images-outline'} 
                size={24} 
                color={activeTab === 'saved-posts' ? '#FF7A00' : '#9CA3AF'} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modernTab}
              onPress={() => setActiveTab('my-recipes')}
              onLayout={(event) => {
                const { width, x } = event.nativeEvent.layout;
                tabLayouts.current['my-recipes'] = { width, x };
                if (activeTab === 'my-recipes') {
                  updateTabUnderline('my-recipes');
                }
              }}
            >
              <Ionicons 
                name={activeTab === 'my-recipes' ? 'restaurant' : 'restaurant-outline'} 
                size={24} 
                color={activeTab === 'my-recipes' ? '#FF7A00' : '#9CA3AF'} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modernTab}
              onPress={() => setActiveTab('user-info')}
              onLayout={(event) => {
                const { width, x } = event.nativeEvent.layout;
                tabLayouts.current['user-info'] = { width, x };
                if (activeTab === 'user-info') {
                  updateTabUnderline('user-info');
                }
              }}
            >
              <Ionicons 
                name={activeTab === 'user-info' ? 'information-circle' : 'information-circle-outline'} 
                size={24} 
                color={activeTab === 'user-info' ? '#FF7A00' : '#9CA3AF'} 
              />
            </TouchableOpacity>
            
            {/* Animated Underline */}
            <Animated.View
              style={[
                styles.tabUnderline,
                useAnimatedStyle(() => ({
                  transform: [{ translateX: tabUnderlinePosition.value }],
                  width: tabUnderlineWidth.value,
                })),
              ]}
            />
          </View>
        </Animated.View>

        {/* Tab Content */}
        <Animated.View style={[styles.tabContentContainer, cardAnimatedStyle]}>
          {activeTab === 'my-posts' ? (
            <>
              {/* Tab "Lưu trữ" - Tasty Style với Sub-tabs */}
              {/* Sub-tab Navigation */}
              <View style={styles.subTabContainer}>
                <TouchableOpacity
                  style={[styles.subTab, savedSubTab === 'recipes' && styles.subTabActive]}
                  onPress={() => setSavedSubTab('recipes')}
                >
                  <Text style={[styles.subTabText, savedSubTab === 'recipes' && styles.subTabTextActive]}>
                    Lưu công thức
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.subTab, savedSubTab === 'posts' && styles.subTabActive]}
                  onPress={() => setSavedSubTab('posts')}
                >
                  <Text style={[styles.subTabText, savedSubTab === 'posts' && styles.subTabTextActive]}>
                    Lưu bài đăng
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sub-tab Content */}
              {savedSubTab === 'recipes' ? (
                <ScrollView
                  style={styles.tastyContentScrollView}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={loadingStats}
                      onRefresh={loadStats}
                      colors={['#FF7A00']}
                      tintColor="#FF7A00"
                    />
                  }
                >
                  {/* Lưu công thức */}
                  {loadingStats && (!savedRecipesStats?.savedRecipes || savedRecipesStats.savedRecipes.length === 0) ? (
                    <View style={styles.tastyLoadingContainer}>
                      <LoadingPizza size={80} color="#FF7A00" showText={true} />
                    </View>
                  ) : !savedRecipesStats || !savedRecipesStats.savedRecipes || !Array.isArray(savedRecipesStats.savedRecipes) || savedRecipesStats.savedRecipes.length === 0 ? (
                    <View style={styles.tastyEmptyContainer}>
                      <View style={styles.tastyEmptyIllustration}>
                        <Ionicons name="bookmark-outline" size={80} color="#E5E7EB" />
                      </View>
                      <Text style={styles.tastyEmptyTitle}>Chưa có công thức nào được lưu</Text>
                      <Text style={styles.tastyEmptySubtitle}>Hãy lưu những công thức yêu thích để xem lại sau</Text>
                      <TouchableOpacity
                        style={styles.tastyEmptyButton}
                        onPress={() => router.push('/(tabs)/recipes')}
                      >
                        <Text style={styles.tastyEmptyButtonText}>Khám phá công thức</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.tastyRecipesGrid}>
                      {(() => {
                        // Component để render image với error handling
                        const RecipeImage = ({ imageUrl, recipeId }: { imageUrl: string | null; recipeId: string }) => {
                          const [imageError, setImageError] = React.useState(false);
                          
                          React.useEffect(() => {
                            // Reset error khi imageUrl thay đổi
                            setImageError(false);
                          }, [imageUrl]);
                          
                          // Nếu không có URL hoặc có lỗi, hiển thị placeholder
                          if (!imageUrl || imageError) {
                            return (
                              <View style={[styles.tastyRecipeImage, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="restaurant-outline" size={48} color="#CCCCCC" />
                              </View>
                            );
                          }
                          
                          return (
                            <Image 
                              source={{ 
                                uri: imageUrl,
                                // Thêm cache policy cho external images
                                cache: 'force-cache'
                              }} 
                              style={styles.tastyRecipeImage}
                              resizeMode="cover"
                              onError={(error) => {
                                // Chỉ log warning, không log error để tránh spam console
                                if (!imageError) {
                                  console.warn('⚠️ [Image] Failed to load image for recipe', recipeId);
                                  console.warn('⚠️ [Image] URL:', imageUrl?.substring(0, 100) + '...');
                                }
                                setImageError(true);
                              }}
                              onLoad={() => {
                                // Chỉ log trong development
                                if (__DEV__) {
                                  console.log('✅ [Image] Loaded image for recipe', recipeId);
                                }
                              }}
                            />
                          );
                        };

                        const recipes = Array.isArray(savedRecipesStats.savedRecipes) ? savedRecipesStats.savedRecipes : [];
                        
                        // ✅ FIX: Loại bỏ duplicate recipes dựa trên _id
                        const uniqueRecipes = recipes.filter((recipe: any, index: number, self: any[]) => {
                          const recipeData = recipe && recipe.recipe ? recipe.recipe : recipe;
                          const recipeId = recipeData?._id || recipe?._id;
                          if (!recipeId) return false; // Bỏ qua recipes không có _id
                          
                          // Tìm index đầu tiên của recipe có cùng _id
                          const firstIndex = self.findIndex((r: any) => {
                            const rData = r && r.recipe ? r.recipe : r;
                            const rId = rData?._id || r?._id;
                            return rId === recipeId;
                          });
                          
                          // Chỉ giữ lại recipe đầu tiên
                          return firstIndex === index;
                        });
                        
                        console.log('🎨 [Render] Rendering', uniqueRecipes.length, 'unique saved recipes (filtered from', recipes.length, 'total)');
                        console.log('🎨 [Render] Recipe data:', uniqueRecipes.map((r: any) => { 
                          const rData = r && r.recipe ? r.recipe : r;
                          return { 
                            id: rData?._id || r?._id, 
                            title: rData?.title || r?.title,
                            hasRecipe: !!r.recipe 
                          };
                        }));
                        
                        return uniqueRecipes.map((recipe: any, index: number) => {
                          // Đảm bảo lấy đúng recipe data
                          const recipeData = recipe && recipe.recipe ? recipe.recipe : recipe;
                          
                          // Validate recipe data
                          if (!recipeData || !recipeData._id) {
                            console.warn('⚠️ [Render] Invalid recipe at index', index, recipe);
                            return null;
                          }
                          
                          console.log('🎨 [Render] Rendering recipe:', recipeData._id, recipeData.title);
                        const categoryName = recipeData.categoryName || recipeData.category?.name || recipeData.category || 'Chưa phân loại';
                        const cookTime = recipeData.cookTimeMinutes || recipeData.cookTime || 0;
                        const averageRating = recipeData.averageRating || 0;
                        const ratingCount = recipeData.ratingCount || 0;
                        const favoritePercent = ratingCount > 0 ? Math.round((averageRating / 5) * 100) : 0;

                        // Xử lý image URL với logging - ưu tiên videoThumbnail
                        const rawImageUrl = (recipeData as any).videoThumbnail || recipeData.imageUrl || recipeData.image || null;
                        
                        // Nếu URL đã là URL hợp lệ (http/https), dùng trực tiếp
                        // Chỉ normalize nếu là đường dẫn local hoặc cần xử lý
                        let finalImageUrl = null;
                        if (rawImageUrl) {
                          if (rawImageUrl.startsWith('http://') || rawImageUrl.startsWith('https://')) {
                            // URL hợp lệ, dùng trực tiếp
                            // Nếu là Unsplash URL, có thể có vấn đề - để component tự handle error
                            finalImageUrl = rawImageUrl;
                          } else {
                            // Đường dẫn local, cần normalize
                            finalImageUrl = normalizeImageUrl(rawImageUrl, recipeData.updatedAt);
                          }
                        }
                        
                        // Không có ảnh -> hiển thị placeholder icon (đã handle trong RecipeImage component)
                        
                        console.log('🖼️ [Render] Image for recipe', recipeData._id, ':', {
                          raw: rawImageUrl,
                          final: finalImageUrl,
                          hasImage: !!rawImageUrl
                        });

                        return (
                          <TouchableOpacity
                            key={recipeData._id || recipe._id}
                            style={styles.tastyRecipeCard}
                            onPress={() => router.push(`/modal?id=${recipeData._id || recipe._id}`)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.tastyRecipeImageContainer}>
                              <RecipeImage imageUrl={finalImageUrl} recipeId={recipeData._id} />
                              {favoritePercent > 0 && (
                                <View style={styles.tastyRecipeBadge}>
                                  <Ionicons name="heart" size={12} color="#FFFFFF" />
                                  <Text style={styles.tastyRecipeBadgeText}>{favoritePercent}%</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.tastyRecipeContent}>
                              <Text style={styles.tastyRecipeTitle} numberOfLines={2}>
                                {recipeData.title}
                              </Text>
                              <View style={styles.tastyRecipeMeta}>
                                <View style={styles.tastyRecipeMetaItem}>
                                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                                  <Text style={styles.tastyRecipeMetaText}>{cookTime} phút</Text>
                                </View>
                                {averageRating > 0 && (
                                  <View style={styles.tastyRecipeMetaItem}>
                                    <Ionicons name="star" size={14} color="#FFB800" />
                                    <Text style={styles.tastyRecipeMetaText}>{averageRating.toFixed(1)}</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      }).filter((item: any) => item != null);
                      })()}
                    </View>
                  )}
                </ScrollView>
              ) : (
                <>
                  {/* Lưu bài đăng */}
                  {loadingSavedPosts ? (
                    <View style={styles.tastyLoadingContainer}>
                      <LoadingPizza size={80} color="#FF7A00" showText={true} />
                    </View>
                  ) : !savedPosts || savedPosts.length === 0 ? (
                    <View style={styles.tastyEmptyContainer}>
                      <View style={styles.tastyEmptyIllustration}>
                        <Ionicons name="bookmark-outline" size={80} color="#E5E7EB" />
                      </View>
                      <Text style={styles.tastyEmptyTitle}>Chưa có bài đăng nào được lưu</Text>
                      <Text style={styles.tastyEmptySubtitle}>Hãy lưu những bài đăng yêu thích để xem lại sau</Text>
                    </View>
                  ) : (
                    <View style={styles.tastyPostsList}>
                      {savedPosts.map((post) => (
                        <TouchableOpacity
                          key={post._id}
                          style={styles.tastyPostCard}
                          onPress={() => router.push(`/post-detail?id=${post._id}`)}
                          activeOpacity={0.8}
                        >
                          {post.imageUrl && (
                            <Image 
                              source={{ uri: normalizeImageUrl(post.imageUrl, post.updatedAt) || post.imageUrl }} 
                              style={styles.tastyPostImage}
                              resizeMode="cover"
                            />
                          )}
                          <View style={styles.tastyPostContent}>
                            <View style={styles.tastyPostHeader}>
                              <View style={styles.tastyPostAvatar}>
                                <Ionicons name="person" size={20} color="#FFFFFF" />
                              </View>
                              <View style={styles.tastyPostHeaderText}>
                                <Text style={styles.tastyPostAuthor}>{post.user?.name || 'Người dùng'}</Text>
                                <Text style={styles.tastyPostDate}>
                                  {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                </Text>
                              </View>
                            </View>
                            {post.caption && (
                              <Text style={styles.tastyPostCaption} numberOfLines={3}>
                                {post.caption}
                              </Text>
                            )}
                            <View style={styles.tastyPostActions}>
                              <View style={styles.tastyPostActionItem}>
                                <Ionicons name="heart" size={18} color="#FF7A00" />
                                <Text style={styles.tastyPostActionText}>{post.likes?.length || 0}</Text>
                              </View>
                              <View style={styles.tastyPostActionItem}>
                                <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
                                <Text style={styles.tastyPostActionText}>{post.comments?.length || 0}</Text>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </>
          ) : activeTab === 'saved-posts' ? (
            <>
              {/* Tab "Bài đăng" - Tasty Style */}
              {loadingPosts ? (
                <View style={styles.tastyLoadingContainer}>
                  <LoadingPizza size={80} color="#FF7A00" showText={true} />
                </View>
              ) : posts.length === 0 ? (
                <View style={styles.tastyEmptyContainer}>
                  <View style={styles.tastyEmptyIllustration}>
                    <Ionicons name="images-outline" size={80} color="#E5E7EB" />
                  </View>
                  <Text style={styles.tastyEmptyTitle}>Chưa có bài đăng nào</Text>
                  <Text style={styles.tastyEmptySubtitle}>Hãy chia sẻ những khoảnh khắc nấu ăn của bạn</Text>
                </View>
              ) : (
                <View style={styles.tastyPostsList}>
                  {posts.map((post) => (
                    <TouchableOpacity
                      key={post._id}
                      style={styles.tastyPostCard}
                      onPress={() => router.push(`/post-detail?id=${post._id}`)}
                      activeOpacity={0.8}
                    >
                      {post.imageUrl && (
                        <Image 
                          source={{ uri: normalizeImageUrl(post.imageUrl, post.updatedAt) || post.imageUrl }} 
                          style={styles.tastyPostImage}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.tastyPostContent}>
                        <View style={styles.tastyPostHeader}>
                          <View style={styles.tastyPostAvatar}>
                            <Ionicons name="person" size={20} color="#FFFFFF" />
                          </View>
                          <View style={styles.tastyPostHeaderText}>
                            <Text style={styles.tastyPostAuthor}>{user?.name || 'Bạn'}</Text>
                            <Text style={styles.tastyPostDate}>
                              {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                            </Text>
                          </View>
                        </View>
                        {post.caption && (
                          <Text style={styles.tastyPostCaption} numberOfLines={3}>
                            {post.caption}
                          </Text>
                        )}
                        <View style={styles.tastyPostActions}>
                          <View style={styles.tastyPostActionItem}>
                            <Ionicons name="heart" size={18} color="#FF7A00" />
                            <Text style={styles.tastyPostActionText}>{post.likes.length}</Text>
                          </View>
                          <View style={styles.tastyPostActionItem}>
                            <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
                            <Text style={styles.tastyPostActionText}>{post.comments.length}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : activeTab === 'my-recipes' ? (
            <>
              {/* Tab "Công thức" - Hiển thị recipes user đã đăng */}
              {loadingRecipes ? (
                <View style={styles.tastyLoadingContainer}>
                  <LoadingPizza size={80} color="#FF7A00" showText={true} />
                </View>
              ) : myRecipes.length === 0 ? (
                <View style={styles.tastyEmptyContainer}>
                  <View style={styles.tastyEmptyIllustration}>
                    <Ionicons name="restaurant-outline" size={80} color="#E5E7EB" />
                  </View>
                  <Text style={styles.tastyEmptyTitle}>Chưa có công thức nào</Text>
                  <Text style={styles.tastyEmptySubtitle}>Hãy tạo công thức đầu tiên của bạn</Text>
                </View>
              ) : (
                <ScrollView 
                  style={styles.tastyRecipesList}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl 
                      refreshing={refreshing} 
                      onRefresh={async () => {
                        setRefreshing(true);
                        await loadMyRecipes();
                        setRefreshing(false);
                      }} 
                      tintColor="#FF7A00" 
                    />
                  }
                >
                  <View style={styles.tastyRecipesGrid}>
                    {(() => {
                      // ✅ FIX: Loại bỏ duplicate recipes dựa trên _id
                      const uniqueMyRecipes = myRecipes.filter((recipe: any, index: number, self: any[]) => {
                        const recipeId = recipe?._id;
                        if (!recipeId) return false; // Bỏ qua recipes không có _id
                        
                        // Tìm index đầu tiên của recipe có cùng _id
                        const firstIndex = self.findIndex((r: any) => r?._id === recipeId);
                        
                        // Chỉ giữ lại recipe đầu tiên
                        return firstIndex === index;
                      });
                      
                      return uniqueMyRecipes.map((recipe) => (
                        <MyRecipeCard 
                          key={recipe._id} 
                          recipe={recipe} 
                          isCreator={user?.role === 'creator'} 
                        />
                      ));
                    })()}
                  </View>
                </ScrollView>
              )}
            </>
          ) : activeTab === 'user-info' ? (
            <>
              {/* Tab "Thông tin người dùng" - Tasty Style */}
              <View style={styles.tastyUserInfoContainer}>
                {/* Bio Section */}
                <View style={styles.tastyInfoSection}>
                  <View style={styles.tastyInfoSectionHeader}>
                    <Text style={styles.tastyInfoSectionTitle}>Giới thiệu</Text>
                    {!isEditingBio && (
                      <TouchableOpacity onPress={() => setIsEditingBio(true)}>
                        <Ionicons name="create-outline" size={20} color="#FF7A00" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {isEditingBio ? (
                    <View>
                      <TextInput
                        style={styles.tastyBioInput}
                        placeholder="Nhập mô tả về bản thân..."
                        placeholderTextColor="#9CA3AF"
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        numberOfLines={4}
                      />
                      <View style={styles.tastyBioActions}>
                        <TouchableOpacity
                          style={styles.tastyBioCancelButton}
                          onPress={() => {
                            setBio(user?.bio || '');
                            setIsEditingBio(false);
                          }}
                        >
                          <Text style={styles.tastyBioCancelText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.tastyBioSaveButton}
                          onPress={handleSaveBio}
                          disabled={saving}
                        >
                          {saving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.tastyBioSaveText}>Lưu</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.tastyBioText}>
                      {userData.bio || 'Chưa có mô tả. Nhấn vào biểu tượng chỉnh sửa để thêm mô tả.'}
                    </Text>
                  )}
                </View>

                {/* Social Links Section */}
                <View style={styles.tastyInfoSection}>
                  <View style={styles.tastyInfoSectionHeader}>
                    <Text style={styles.tastyInfoSectionTitle}>Liên kết</Text>
                    <TouchableOpacity
                      style={styles.tastyAddLinkButton}
                      onPress={handleAddLink}
                    >
                      <Ionicons name="add" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.tastyLinksList}>
                    {userData.socialLinks?.email && (
                      <TouchableOpacity
                        style={styles.tastyLinkItem}
                        onPress={() => handleOpenLink(`mailto:${userData.socialLinks?.email}`)}
                      >
                        <Ionicons name={getSocialLinkIcon('email')} size={20} color="#FF7A00" />
                        <Text style={styles.tastyLinkText} numberOfLines={1}>{userData.socialLinks.email}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                      </TouchableOpacity>
                    )}

                    {userData.socialLinks?.facebook && (
                      <TouchableOpacity
                        style={styles.tastyLinkItem}
                        onPress={() => handleOpenLink(userData.socialLinks?.facebook || '')}
                      >
                        <Ionicons name={getSocialLinkIcon('facebook')} size={20} color="#1877F2" />
                        <Text style={styles.tastyLinkText} numberOfLines={1}>{userData.socialLinks.facebook}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                      </TouchableOpacity>
                    )}

                    {userData.socialLinks?.instagram && (
                      <TouchableOpacity
                        style={styles.tastyLinkItem}
                        onPress={() => handleOpenLink(userData.socialLinks?.instagram || '')}
                      >
                        <Ionicons name={getSocialLinkIcon('instagram')} size={20} color="#E4405F" />
                        <Text style={styles.tastyLinkText} numberOfLines={1}>{userData.socialLinks.instagram}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                      </TouchableOpacity>
                    )}

                    {userData.socialLinks?.twitter && (
                      <TouchableOpacity
                        style={styles.tastyLinkItem}
                        onPress={() => handleOpenLink(userData.socialLinks?.twitter || '')}
                      >
                        <Ionicons name={getSocialLinkIcon('twitter')} size={20} color="#1DA1F2" />
                        <Text style={styles.tastyLinkText} numberOfLines={1}>{userData.socialLinks.twitter}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                      </TouchableOpacity>
                    )}

                    {userData.socialLinks?.youtube && (
                      <TouchableOpacity
                        style={styles.tastyLinkItem}
                        onPress={() => handleOpenLink(userData.socialLinks?.youtube || '')}
                      >
                        <Ionicons name={getSocialLinkIcon('youtube')} size={20} color="#FF0000" />
                        <Text style={styles.tastyLinkText} numberOfLines={1}>{userData.socialLinks.youtube}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                      </TouchableOpacity>
                    )}

                    {userData.socialLinks?.website && (
                      <TouchableOpacity
                        style={styles.tastyLinkItem}
                        onPress={() => handleOpenLink(userData.socialLinks?.website || '')}
                      >
                        <Ionicons name={getSocialLinkIcon('website')} size={20} color="#4CAF50" />
                        <Text style={styles.tastyLinkText} numberOfLines={1}>{userData.socialLinks.website}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                      </TouchableOpacity>
                    )}

                    {userData.socialLinks?.custom?.map((link, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.tastyLinkItem}
                        onPress={() => handleOpenLink(link.url)}
                      >
                        <Ionicons name="link-outline" size={20} color="#6B7280" />
                        <Text style={styles.tastyLinkText} numberOfLines={1}>{link.label}: {link.url}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                      </TouchableOpacity>
                    ))}

                    {!userData.socialLinks?.email &&
                      !userData.socialLinks?.facebook &&
                      !userData.socialLinks?.instagram &&
                      !userData.socialLinks?.twitter &&
                      !userData.socialLinks?.youtube &&
                      !userData.socialLinks?.website &&
                      (!userData.socialLinks?.custom || userData.socialLinks.custom.length === 0) && (
                        <View style={styles.tastyEmptyLinksContainer}>
                          <Ionicons name="link-outline" size={48} color="#E5E7EB" />
                          <Text style={styles.tastyEmptyLinksText}>Chưa có liên kết</Text>
                          <Text style={styles.tastyEmptyLinksSubtext}>Nhấn nút "+" để thêm liên kết</Text>
                        </View>
                      )}
                  </View>
                </View>

                {/* Personal Info Section */}
                <View style={styles.tastyInfoSection}>
                  <Text style={styles.tastyInfoSectionTitle}>Thông tin cá nhân</Text>
                  
                  <View style={styles.tastyInfoItem}>
                    <View style={styles.tastyInfoIconContainer}>
                      <Ionicons name="mail-outline" size={20} color="#FF7A00" />
                    </View>
                    <View style={styles.tastyInfoContent}>
                      <Text style={styles.tastyInfoLabel}>Email</Text>
                      <Text style={styles.tastyInfoValue}>{userData.email}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.tastyInfoItem}>
                    <View style={styles.tastyInfoIconContainer}>
                      <Ionicons name="call-outline" size={20} color="#FF7A00" />
                    </View>
                    <View style={styles.tastyInfoContent}>
                      <Text style={styles.tastyInfoLabel}>Số điện thoại</Text>
                      <Text style={styles.tastyInfoValue}>{userData.phone}</Text>
                    </View>
                  </View>
                  
                  {userData.birthDate && (
                    <View style={styles.tastyInfoItem}>
                      <View style={styles.tastyInfoIconContainer}>
                        <Ionicons name="calendar-outline" size={20} color="#FF7A00" />
                      </View>
                      <View style={styles.tastyInfoContent}>
                        <Text style={styles.tastyInfoLabel}>Ngày sinh</Text>
                        <Text style={styles.tastyInfoValue}>{userData.birthDate}</Text>
                      </View>
                    </View>
                  )}
                  
                  {userData.joinDate && (
                    <View style={styles.tastyInfoItem}>
                      <View style={styles.tastyInfoIconContainer}>
                        <Ionicons name="time-outline" size={20} color="#FF7A00" />
                      </View>
                      <View style={styles.tastyInfoContent}>
                        <Text style={styles.tastyInfoLabel}>Tham gia từ</Text>
                        <Text style={styles.tastyInfoValue}>{userData.joinDate}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </>
          ) : null}
        </Animated.View>


        {/* Logout Button */}
        <Animated.View style={[styles.logoutContainer, menuItemAnimatedStyle]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <IconSymbol name="chevron.right" size={20} color="white" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Foodie v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Add Link Modal */}
      <Modal
        visible={showAddLinkModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddLinkModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAddLinkModal(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Thêm liên kết</Text>
                  <TouchableOpacity onPress={() => setShowAddLinkModal(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalScrollView}
                  contentContainerStyle={styles.modalBody}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.modalLabel}>Loại liên kết</Text>
                  <View style={styles.linkTypeContainer}>
                    {['email', 'facebook', 'instagram', 'twitter', 'youtube', 'website', 'custom'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.linkTypeButton,
                          newLinkType === type && styles.linkTypeButtonActive
                        ]}
                        onPress={() => setNewLinkType(type as any)}
                      >
                        <Text style={[
                          styles.linkTypeText,
                          newLinkType === type && styles.linkTypeTextActive
                        ]}>
                          {getSocialLinkLabel(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {newLinkType === 'custom' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.modalLabel}>Tên liên kết</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Ví dụ: TikTok, LinkedIn..."
                        placeholderTextColor="#999"
                        value={newLinkLabel}
                        onChangeText={setNewLinkLabel}
                      />
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.modalLabel}>
                      {newLinkType === 'email' ? 'Email' : newLinkType === 'custom' ? 'URL' : 'Link'}
                    </Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder={
                        newLinkType === 'email' 
                          ? 'example@email.com'
                          : newLinkType === 'custom'
                          ? 'https://...'
                          : 'https://...'
                      }
                      placeholderTextColor="#999"
                      value={newLinkValue}
                      onChangeText={setNewLinkValue}
                      keyboardType={newLinkType === 'email' ? 'email-address' : 'url'}
                      autoCapitalize="none"
                    />
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowAddLinkModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={handleSaveLink}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalSaveText}>Lưu</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#FF8C42',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
    minHeight: 300,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
    position: 'relative',
  },
  chatButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  notificationButton: {
    position: 'absolute',
    top: 0,
    right: 60,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF8C42',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  settingsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  creatorBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    overflow: 'hidden',
  },
  creatorBadgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6.5, // Slightly smaller than parent to account for border
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginTop: -8,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    maxWidth: '90%',
    paddingHorizontal: 20,
  },
  userStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    paddingBottom: 16,
  },
  userStatItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  userStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
  },
  userStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
  },
  userStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  userLevel: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: '90%',
    paddingHorizontal: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modernTabContainer: {
    marginTop: 0,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 4,
    alignItems: 'center',
  },
  modernTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 48,
    height: 48,
  },
  modernTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'Inter_500Medium',
  },
  modernTabTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Inter_700Bold',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: '#FF8C42',
    borderRadius: 2,
  },
  tabContentContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  activityContainer: {
    gap: 16,
    paddingVertical: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  activityContent: {
    flex: 1,
    marginLeft: 16,
  },
  activityLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  activityValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Poppins_700Bold',
  },
  statsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
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
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#FF8C42',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  logoutContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#FF8C42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },
  bioContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    fontFamily: 'Inter_400Regular',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  bioActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  bioCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bioCancelText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  bioSaveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FF8C42',
  },
  bioSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  socialLinksContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
  socialLinksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addLinkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialLinksList: {
    gap: 12,
  },
  socialLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    gap: 12,
  },
  socialLinkText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Inter_400Regular',
  },
  noLinksText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: 'Inter_400Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    maxWidth: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Poppins_700Bold',
  },
  modalScrollView: {
    flexGrow: 0,
  },
  modalBody: {
    padding: 20,
    paddingBottom: 10,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  linkTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  linkTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  linkTypeButtonActive: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  linkTypeText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  linkTypeTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    fontFamily: 'Inter_400Regular',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  modalCancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  modalSaveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#FF8C42',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  postsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FF8C42',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  postsLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  postsEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  postsEmptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    marginBottom: 20,
  },
  postsEmptyButton: {
    backgroundColor: '#FF8C42',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  postsEmptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  postGridItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  postGridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    resizeMode: 'contain',
  },
  postGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  postGridStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postGridStatText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryFilterContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  recipesList: {
    gap: 12,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  recipeImage: {
    width: 100,
    height: 100,
    backgroundColor: '#F3F4F6',
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  recipeCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  recipeCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  // ========== TASTY APP STYLES ==========
  // Loading & Empty States
  tastyContentScrollView: {
    flex: 1,
  },
  tastyLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  tastyEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  tastyEmptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  tastyEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  tastyEmptySubtitle: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  tastyEmptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF7A00',
    borderRadius: 20,
  },
  tastyEmptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  // Saved Recipes Tab - Grid Style
  tastyRecipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 20,
  },
  tastyRecipeCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  tastyRecipeImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  tastyRecipeImage: {
    width: '100%',
    height: '100%',
  },
  tastyRecipeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 122, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tastyRecipeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  tastyRecipeContent: {
    padding: 16,
  },
  tastyRecipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 22,
  },
  tastyRecipeEditButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tastyRecipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  tastyRecipeStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tastyRecipeStatText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  tastyRecipesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tastyRecipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tastyRecipeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tastyRecipeMetaText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  // Posts Tab - Card Style
  tastyPostsList: {
    gap: 16,
    paddingBottom: 20,
  },
  tastyPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  tastyPostImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F3F4F6',
  },
  tastyPostContent: {
    padding: 16,
  },
  tastyPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tastyPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF7A00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tastyPostHeaderText: {
    flex: 1,
  },
  tastyPostAuthor: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  tastyPostDate: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#9CA3AF',
  },
  tastyPostCaption: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  tastyPostActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tastyPostActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tastyPostActionText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#6B7280',
  },
  // Activity Tab - Grid Style
  tastyActivityContainer: {
    paddingBottom: 20,
  },
  tastyActivityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  tastyActivityCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  tastyActivityIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tastyActivityValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  tastyActivityLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  // User Info Tab Styles
  tastyUserInfoContainer: {
    paddingBottom: 20,
  },
  tastyInfoSection: {
    marginBottom: 24,
  },
  tastyInfoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tastyInfoSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#1F2937',
  },
  tastyBioInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    fontFamily: 'Inter_400Regular',
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
  },
  tastyBioText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
    fontFamily: 'Inter_400Regular',
  },
  tastyBioActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  tastyBioCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tastyBioCancelText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  tastyBioSaveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FF7A00',
  },
  tastyBioSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  tastyAddLinkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF7A00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tastyLinksList: {
    gap: 12,
  },
  tastyLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  tastyLinkText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontFamily: 'Inter_400Regular',
  },
  tastyEmptyLinksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 40,
  },
  tastyEmptyLinksText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 4,
  },
  tastyEmptyLinksSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  tastyInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    gap: 12,
  },
  tastyInfoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tastyInfoContent: {
    flex: 1,
  },
  tastyInfoLabel: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  tastyInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#1F2937',
  },
  // Sub-tab Styles
  subTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    marginHorizontal: 0,
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  subTabTextActive: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FF7A00',
  },
  coinsWidgetContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  coinsWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  coinsWidgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  coinIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  coinIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  coinIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  coinsAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    fontFamily: 'Inter_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8C42',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#FF8C42',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  topUpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
});


