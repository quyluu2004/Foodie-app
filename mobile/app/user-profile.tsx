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
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authAPI, followAPI, postAPI, saveAPI, premiumAPI } from '@/contexts/api';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeImageUrl } from '@/utils/imageUrl';
import LoadingPizza from '@/components/LoadingPizza';
import { LinearGradient } from 'expo-linear-gradient';

interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  gender?: string;
  birthDate?: string | Date;
  socialLinks?: {
    email?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
    custom?: Array<{ label: string; url: string }>;
  };
  createdAt?: string | Date;
  role?: string;
  isPrivate?: boolean;
}

interface Post {
  _id: string;
  imageUrl: string;
  caption: string;
  likes: string[];
  comments: any[];
  createdAt: string;
}

type TabType = 'posts' | 'activity' | 'info';

export default function UserProfileScreen() {
  const params = useLocalSearchParams<{ id?: string; userId?: string }>();
  const id = params.id || params.userId;
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [canViewFullProfile, setCanViewFullProfile] = useState(true);
  const isOwnProfile = currentUser?._id === id;
  const [userCoins, setUserCoins] = useState(0);
  const [loadingCoins, setLoadingCoins] = useState(false);

  const loadUserProfile = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await authAPI.getUserById(id);
      const data = response.data;
      setUser(data.user);
      setIsFollowing(data.isFollowing || false);
      setFollowersCount(data.followersCount || 0);
      setFollowingCount(data.followingCount || 0);
      setPostsCount(data.postsCount || 0);
      setRatingsCount(data.ratingsCount || 0);
      setCanViewFullProfile(data.canViewFullProfile !== false);
      
      console.log('📊 User stats:', {
        followers: data.followersCount,
        following: data.followingCount,
        posts: data.postsCount,
        ratings: data.ratingsCount,
        isPrivate: data.user?.isPrivate,
        canViewFullProfile: data.canViewFullProfile
      });
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    if (!id || !canViewFullProfile) return;

    try {
      setLoadingPosts(true);
      const response = await postAPI.getByUser(id, 1, 12);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('❌ Error loading user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadActivity = async () => {
    if (!id || !canViewFullProfile) return;

    try {
      setLoadingActivity(true);
      // Load saved recipes
      const savedRecipesResponse = await saveAPI.getSavedRecipes(id);
      setSavedRecipes(savedRecipesResponse.data.recipes || []);
      
      // Load saved posts (if API exists)
      // const savedPostsResponse = await postAPI.getSavedPosts(id);
      // setSavedPosts(savedPostsResponse.data.posts || []);
    } catch (error) {
      console.error('❌ Error loading activity:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadUserProfile();
    }
  }, [id]);

  // Load user coins if viewing own profile
  useEffect(() => {
    const loadUserCoins = async () => {
      if (!isOwnProfile || !currentUser?._id) return;
      
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

    if (isOwnProfile) {
      loadUserCoins();
    }
  }, [isOwnProfile, currentUser?._id]);

  useEffect(() => {
    if (activeTab === 'posts' && canViewFullProfile) {
      loadUserPosts();
    } else if (activeTab === 'activity' && canViewFullProfile) {
      loadActivity();
    }
  }, [activeTab, canViewFullProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    if (activeTab === 'posts') {
      await loadUserPosts();
    } else if (activeTab === 'activity') {
      await loadActivity();
    }
    setRefreshing(false);
  };

  const handleFollow = async () => {
    if (!id || !currentUser?._id || id === currentUser._id) return;

    try {
      const wasFollowing = isFollowing;
      
      // Optimistic update
      setIsFollowing(!wasFollowing);
      setFollowersCount((prev) => (wasFollowing ? prev - 1 : prev + 1));

      await followAPI.toggleFollow(id);
      
      // Reload profile to get updated privacy access
      await loadUserProfile();
    } catch (error: any) {
      console.error('❌ Error toggling follow:', error);
      // Revert
      setIsFollowing(!isFollowing);
      setFollowersCount((prev) => (isFollowing ? prev - 1 : prev + 1));
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const getSocialLinkIcon = (type: string) => {
    switch (type) {
      case 'email': return 'mail-outline';
      case 'facebook': return 'logo-facebook';
      case 'instagram': return 'logo-instagram';
      case 'twitter': return 'logo-twitter';
      case 'youtube': return 'logo-youtube';
      case 'website': return 'globe-outline';
      default: return 'link-outline';
    }
  };

  const getSocialLinkLabel = (type: string) => {
    switch (type) {
      case 'email': return 'Email';
      case 'facebook': return 'Facebook';
      case 'instagram': return 'Instagram';
      case 'twitter': return 'Twitter';
      case 'youtube': return 'YouTube';
      case 'website': return 'Website';
      default: return type;
    }
  };

  const getValidAvatarUrl = normalizeImageUrl;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingPizza size={100} color="#FF8C42" showText={true} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color="#CCCCCC" />
          <Text style={styles.errorText}>Không tìm thấy người dùng</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Giống hình 2: có bell icon bên phải */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.name}</Text>
        <TouchableOpacity 
          style={styles.headerIconButton}
          onPress={() => {
            // TODO: Navigate to notifications
          }}
        >
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Profile Header - Giống hình 2 */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {(() => {
              const validAvatarUrl = getValidAvatarUrl(user.avatarUrl);
              return validAvatarUrl ? (
                <Image source={{ uri: validAvatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="#FFFFFF" />
                </View>
              );
            })()}
            {/* Creator Badge */}
            {user?.role === 'creator' && (
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
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          {user.bio && canViewFullProfile && <Text style={styles.bio}>{user.bio}</Text>}

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.followButton, isFollowing && styles.followingButton]}
                onPress={handleFollow}
                activeOpacity={0.8}
              >
                {!isFollowing ? (
                  <LinearGradient
                    colors={['#FF8C42', '#FF6B35']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.followButtonGradient}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.followButtonText}>Theo dõi</Text>
                  </LinearGradient>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#666" />
                    <Text style={[styles.followButtonText, styles.followingButtonText]}>
                      Đang theo dõi
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => {
                  router.push(`/chat?userId=${id}&userName=${encodeURIComponent(user.name)}`);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color="#FF8C42" />
              </TouchableOpacity>
            </View>
          )}

          {/* Stats - Giống hình 2: Theo dõi, Đăng bài, Đánh giá với icons */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push(`/followers-list?userId=${id}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="people" size={20} color="#FFFFFF" style={styles.statIcon} />
              <Text style={styles.statNumber}>{followersCount ?? 0}</Text>
              <Text style={styles.statLabel}>Theo dõi</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Ionicons name="images" size={20} color="#FFFFFF" style={styles.statIcon} />
              <Text style={styles.statNumber}>{postsCount ?? 0}</Text>
              <Text style={styles.statLabel}>Đăng bài</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color="#FFFFFF" style={styles.statIcon} />
              <Text style={styles.statNumber}>{ratingsCount ?? 0}</Text>
              <Text style={styles.statLabel}>Đánh giá</Text>
            </View>
          </View>
        </View>

        {/* Coins Widget - Only show for own profile */}
        {isOwnProfile && (
          <View style={styles.coinsWidgetContainer}>
            <View style={styles.coinsWidget}>
              <View style={styles.coinsWidgetLeft}>
                <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
                <Text style={styles.coinsAmount}>
                  {loadingCoins ? '...' : userCoins.toLocaleString('vi-VN')} Xu
                </Text>
              </View>
              <TouchableOpacity
                style={styles.topUpButton}
                onPress={() => {
                  // TODO: Navigate to top-up screen or show modal
                  console.log('Navigate to top-up');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.topUpButtonText}>Nạp ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Private Profile Notice */}
        {!canViewFullProfile && (
          <View style={styles.privateNotice}>
            <Ionicons name="lock-closed" size={24} color="#FF8C42" />
            <Text style={styles.privateNoticeText}>
              Tài khoản này ở chế độ riêng tư. Theo dõi để xem bài đăng và hoạt động.
            </Text>
            {!isFollowing && (
              <TouchableOpacity
                style={styles.followPrivateButton}
                onPress={handleFollow}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF8C42', '#FF6B35']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.followPrivateButtonGradient}
                >
                  <Text style={styles.followPrivateButtonText}>Theo dõi</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Tabs - Bài đăng, Hoạt động, Thông tin */}
        {canViewFullProfile && (
          <>
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
                onPress={() => setActiveTab('posts')}
              >
                <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
                  Bài đăng
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'activity' && styles.tabActive]}
                onPress={() => setActiveTab('activity')}
              >
                <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>
                  Hoạt động
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'info' && styles.tabActive]}
                onPress={() => setActiveTab('info')}
              >
                <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
                  Thông tin
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View style={styles.tabContent}>
              {activeTab === 'posts' && (
                <View style={styles.postsContainer}>
                  {loadingPosts ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FF8C42" />
                    </View>
                  ) : posts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="images-outline" size={48} color="#CCCCCC" />
                      <Text style={styles.emptyText}>Chưa có bài đăng nào</Text>
                    </View>
                  ) : (
                    <View style={styles.postsGrid}>
                      {posts.map((post) => (
                        <TouchableOpacity
                          key={post._id}
                          style={styles.postGridItem}
                          onPress={() => router.push(`/post-detail?id=${post._id}`)}
                        >
                          <Image source={{ uri: post.imageUrl }} style={styles.postGridImage} />
                          <View style={styles.postGridStats}>
                            <Ionicons name="heart" size={14} color="#FFFFFF" />
                            <Text style={styles.postGridStatText}>{post.likes.length}</Text>
                            <Ionicons name="chatbubble" size={14} color="#FFFFFF" style={{ marginLeft: 8 }} />
                            <Text style={styles.postGridStatText}>{post.comments.length}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'activity' && (
                <View style={styles.activityContainer}>
                  {loadingActivity ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FF8C42" />
                    </View>
                  ) : (
                    <>
                      {savedRecipes.length > 0 && (
                        <View style={styles.activitySection}>
                          <View style={styles.sectionHeader}>
                            <Ionicons name="bookmark" size={18} color="#FF8C42" />
                            <Text style={styles.sectionTitle}>Công thức đã lưu</Text>
                          </View>
                          <View style={styles.recipesGrid}>
                            {savedRecipes.slice(0, 6).map((recipe: any) => (
                              <TouchableOpacity
                                key={recipe._id}
                                style={styles.recipeCard}
                                onPress={() => router.push(`/recipe-detail?id=${recipe._id}`)}
                              >
                                <Image
                                  source={{ uri: recipe.imageUrl || recipe.image }}
                                  style={styles.recipeImage}
                                />
                                <Text style={styles.recipeTitle} numberOfLines={2}>
                                  {recipe.title}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                      {savedRecipes.length === 0 && (
                        <View style={styles.emptyContainer}>
                          <Ionicons name="bookmark-outline" size={48} color="#CCCCCC" />
                          <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}

              {activeTab === 'info' && (
                <View style={styles.infoContainer}>
                  {user.socialLinks && (
                    (user.socialLinks.email ||
                      user.socialLinks.facebook ||
                      user.socialLinks.instagram ||
                      user.socialLinks.twitter ||
                      user.socialLinks.youtube ||
                      user.socialLinks.website ||
                      (user.socialLinks.custom && user.socialLinks.custom.length > 0)) && (
                      <View style={styles.socialLinksSection}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="link" size={18} color="#FF8C42" />
                          <Text style={styles.sectionTitle}>Liên kết</Text>
                        </View>
                        <View style={styles.socialLinksList}>
                          {user.socialLinks.email && (
                            <TouchableOpacity
                              style={styles.socialLinkItem}
                              onPress={() => handleOpenLink(`mailto:${user.socialLinks?.email}`)}
                            >
                              <Ionicons name={getSocialLinkIcon('email')} size={20} color="#FF8C42" />
                              <Text style={styles.socialLinkText}>{user.socialLinks.email}</Text>
                              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                            </TouchableOpacity>
                          )}
                          {user.socialLinks.facebook && (
                            <TouchableOpacity
                              style={styles.socialLinkItem}
                              onPress={() => handleOpenLink(user.socialLinks?.facebook || '')}
                            >
                              <Ionicons name={getSocialLinkIcon('facebook')} size={20} color="#1877F2" />
                              <Text style={styles.socialLinkText}>{user.socialLinks.facebook}</Text>
                              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                            </TouchableOpacity>
                          )}
                          {user.socialLinks.instagram && (
                            <TouchableOpacity
                              style={styles.socialLinkItem}
                              onPress={() => handleOpenLink(user.socialLinks?.instagram || '')}
                            >
                              <Ionicons name={getSocialLinkIcon('instagram')} size={20} color="#E4405F" />
                              <Text style={styles.socialLinkText}>{user.socialLinks.instagram}</Text>
                              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                            </TouchableOpacity>
                          )}
                          {user.socialLinks.twitter && (
                            <TouchableOpacity
                              style={styles.socialLinkItem}
                              onPress={() => handleOpenLink(user.socialLinks?.twitter || '')}
                            >
                              <Ionicons name={getSocialLinkIcon('twitter')} size={20} color="#1DA1F2" />
                              <Text style={styles.socialLinkText}>{user.socialLinks.twitter}</Text>
                              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                            </TouchableOpacity>
                          )}
                          {user.socialLinks.youtube && (
                            <TouchableOpacity
                              style={styles.socialLinkItem}
                              onPress={() => handleOpenLink(user.socialLinks?.youtube || '')}
                            >
                              <Ionicons name={getSocialLinkIcon('youtube')} size={20} color="#FF8C42" />
                              <Text style={styles.socialLinkText}>{user.socialLinks.youtube}</Text>
                              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                            </TouchableOpacity>
                          )}
                          {user.socialLinks.website && (
                            <TouchableOpacity
                              style={styles.socialLinkItem}
                              onPress={() => handleOpenLink(user.socialLinks?.website || '')}
                            >
                              <Ionicons name={getSocialLinkIcon('website')} size={20} color="#4CAF50" />
                              <Text style={styles.socialLinkText}>{user.socialLinks.website}</Text>
                              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                            </TouchableOpacity>
                          )}
                          {user.socialLinks.custom?.map((link, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.socialLinkItem}
                              onPress={() => handleOpenLink(link.url)}
                            >
                              <Ionicons name="link-outline" size={20} color="#666" />
                              <Text style={styles.socialLinkText}>{link.label}: {link.url}</Text>
                              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )
                  )}
                  {(!user.socialLinks || 
                    (!user.socialLinks.email && !user.socialLinks.facebook && !user.socialLinks.instagram &&
                     !user.socialLinks.twitter && !user.socialLinks.youtube && !user.socialLinks.website &&
                     (!user.socialLinks.custom || user.socialLinks.custom.length === 0))) && (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="information-circle-outline" size={48} color="#CCCCCC" />
                      <Text style={styles.emptyText}>Chưa có thông tin</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}
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
    padding: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
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
    flex: 1,
    textAlign: 'center',
  },
  headerIconButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FF8C42',
    paddingTop: Platform.OS === 'ios' ? 40 : 24,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
    alignSelf: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  creatorBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  creatorBadgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  bio: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    minWidth: 140,
    justifyContent: 'center',
    gap: 6,
  },
  followButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 6,
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#666',
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  privateNotice: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  privateNoticeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  followPrivateButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  followPrivateButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  followPrivateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF8C42',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#FF8C42',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  postsContainer: {
    padding: 16,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  postGridItem: {
    width: '32%',
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  postGridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    resizeMode: 'cover',
  },
  postGridStats: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  postGridStatText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  activityContainer: {
    padding: 16,
  },
  activitySection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recipeCard: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F9F9F9',
  },
  recipeImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E0E0E0',
    resizeMode: 'cover',
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    padding: 12,
  },
  infoContainer: {
    padding: 16,
  },
  socialLinksSection: {
    marginBottom: 24,
  },
  socialLinksList: {
    gap: 12,
  },
  socialLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    gap: 12,
  },
  socialLinkText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  backButtonText: {
    color: '#FF8C42',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coinsWidgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  coinsAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
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
