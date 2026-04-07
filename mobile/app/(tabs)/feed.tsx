import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { postAPI, followAPI } from '@/contexts/api';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingPizza from '@/components/LoadingPizza';

interface Post {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  caption: string;
  imageUrl: string;
  likes: string[];
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      avatarUrl?: string;
    };
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const loadPosts = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await postAPI.getAll(pageNum, 10);
      const newPosts = response.data.posts || [];

      // Load saved status cho tất cả posts (sẽ được cập nhật sau khi có API check)
      // Tạm thời để trống, sẽ được cập nhật khi user save/unsave

      // Load follow status cho tất cả users trong posts
      if (user?._id && (refresh || pageNum === 1)) {
        const userIds = [...new Set(newPosts.map((post: Post) => post.user._id))];
        const followStatuses = await Promise.all(
          userIds
            .filter((id) => id !== user._id) // Không check chính mình
            .map(async (userId) => {
              try {
                const statusRes = await followAPI.checkFollowStatus(userId);
                return { userId, isFollowing: statusRes.data.isFollowing };
              } catch (error) {
                return { userId, isFollowing: false };
              }
            })
        );

        const newFollowing = new Set<string>();
        followStatuses.forEach(({ userId, isFollowing }) => {
          if (isFollowing) {
            newFollowing.add(userId);
          }
        });
        setFollowingUsers(newFollowing);
      }

      if (refresh || pageNum === 1) {
        setPosts(newPosts);
        // Cập nhật liked posts
        const liked = new Set<string>();
        newPosts.forEach((post: Post) => {
          if (post.likes && Array.isArray(post.likes) && post.likes.includes(user?._id || '')) {
            liked.add(post._id);
          }
        });
        setLikedPosts(liked);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
        // Cập nhật liked posts cho posts mới
        const newLiked = new Set(likedPosts);
        newPosts.forEach((post: Post) => {
          if (post.likes && Array.isArray(post.likes) && post.likes.includes(user?._id || '')) {
            newLiked.add(post._id);
          }
        });
        setLikedPosts(newLiked);
      }

      setHasMore(newPosts.length === 10);
      setPage(pageNum);
    } catch (error: any) {
      // Nếu lỗi 401 và không có user = đã logout, không hiển thị alert
      if (error.response?.status === 401 && !user) {
        console.log('⚠️ User logged out, skipping posts');
        setPosts([]);
      } else {
        console.error('❌ Error loading posts:', error);
        Alert.alert('Lỗi', 'Không thể tải bài đăng. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadPosts(1, false);
  }, []);

  const handleRefresh = () => {
    loadPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1, false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const isLiked = likedPosts.has(postId);
      
      // Optimistic update
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });

      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              likes: isLiked
                ? post.likes.filter((id) => id !== user?._id)
                : [...post.likes, user?._id || ''],
            };
          }
          return post;
        })
      );

      await postAPI.toggleLike(postId);
    } catch (error: any) {
      console.error('❌ Error toggling like:', error);
      // Revert optimistic update
      handleRefresh();
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user?._id || userId === user._id) return;

    try {
      const isFollowing = followingUsers.has(userId);
      
      // Optimistic update
      setFollowingUsers((prev) => {
        const newSet = new Set(prev);
        if (isFollowing) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });

      await followAPI.toggleFollow(userId);
    } catch (error: any) {
      console.error('❌ Error toggling follow:', error);
      // Revert optimistic update
      const statusRes = await followAPI.checkFollowStatus(userId);
      setFollowingUsers((prev) => {
        const newSet = new Set(prev);
        if (statusRes.data.isFollowing) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    }
  };

  const handleSave = async (postId: string) => {
    if (!user?._id) {
      console.warn('⚠️ [handleSave] No user ID, cannot save post');
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để lưu bài đăng');
      return;
    }

    try {
      const isSaved = savedPosts.has(postId);
      console.log('💾 [handleSave] Toggling save for post:', postId, 'Current state:', isSaved);
      
      // Optimistic update
      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        if (isSaved) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });

      console.log('💾 [handleSave] Calling API...');
      const response = await postAPI.toggleSave(postId);
      console.log('✅ [handleSave] API response:', response.data);
      
      // Cập nhật lại state từ response
      if (response.data?.isSaved !== undefined) {
        setSavedPosts((prev) => {
          const newSet = new Set(prev);
          if (response.data.isSaved) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
      }
      
      // Hiển thị thông báo
      if (response.data?.isSaved) {
        Alert.alert('Đã lưu', 'Bài đăng đã được lưu vào hồ sơ của bạn');
      } else {
        Alert.alert('Đã bỏ lưu', 'Bài đăng đã được bỏ lưu');
      }
    } catch (error: any) {
      console.error('❌ [handleSave] Error toggling save:', error);
      console.error('❌ [handleSave] Error details:', error.response?.data || error.message);
      
      // Revert optimistic update
      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        if (savedPosts.has(postId)) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });
      
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể lưu bài đăng. Vui lòng thử lại.');
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

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = likedPosts.has(item._id);
    const isSaved = savedPosts.has(item._id);
    const isOwnPost = item.user._id === user?._id;
    const isFollowing = followingUsers.has(item.user._id);

    return (
      <View style={styles.postContainer}>
        {/* Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => router.push(`/user-profile?id=${item.user._id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarWrapper}>
              {item.user.avatarUrl ? (
                <Image source={{ uri: normalizeImageUrl(item.user.avatarUrl) || item.user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={16} color="#FFFFFF" />
                </View>
              )}
              {/* Creator Badge - Nón đầu bếp */}
              {item.user?.role === 'creator' && (
                <View style={styles.feedCreatorBadge}>
                  <LinearGradient
                    colors={['#FFD43B', '#FFB300']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.feedCreatorBadgeGradient}
                  >
                    <Ionicons name="restaurant" size={6} color="#FFFFFF" />
                  </LinearGradient>
                </View>
              )}
            </View>
            <View style={styles.userInfoText}>
              <Text style={styles.username}>{item.user.name}</Text>
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
          {/* Follow Button */}
          {!isOwnPost && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton
              ]}
              onPress={() => handleFollow(item.user._id)}
            >
              <Ionicons
                name={isFollowing ? "checkmark" : "add"}
                size={16}
                color={isFollowing ? "#666" : "#FFFFFF"}
              />
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText
              ]}>
                {isFollowing ? "Đang theo dõi" : "Theo dõi"}
              </Text>
            </TouchableOpacity>
          )}
          {isOwnPost && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Xóa bài đăng',
                  'Bạn có chắc muốn xóa bài đăng này?',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Xóa',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await postAPI.delete(item._id);
                          setPosts((prev) => prev.filter((p) => p._id !== item._id));
                        } catch (error) {
                          Alert.alert('Lỗi', 'Không thể xóa bài đăng');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Image */}
        <TouchableOpacity
          onPress={() => router.push(`/post-detail?id=${item._id}`)}
          activeOpacity={0.9}
        >
          <Image source={{ uri: normalizeImageUrl(item.imageUrl, item.updatedAt) || item.imageUrl }} style={styles.postImage} />
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity
              onPress={() => handleLike(item._id)}
              style={styles.actionButton}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={28}
                color={isLiked ? '#FF8C42' : '#1A1A1A'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/post-detail?id=${item._id}`)}
              style={styles.actionButton}
            >
              <Ionicons name="chatbubble-outline" size={26} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
          <View style={styles.actionsRight}>
            {item.user._id !== user?._id && (
              <TouchableOpacity
                onPress={() => router.push({
                  pathname: '/report',
                  params: { type: 'post', targetId: item._id }
                })}
                style={styles.actionButton}
              >
                <Ionicons name="flag-outline" size={24} color="#666" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleSave(item._id)}
              style={styles.actionButton}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={26}
                color={isSaved ? '#FF8C42' : '#1A1A1A'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Likes Count */}
        {item.likes.length > 0 && (
          <Text style={styles.likesCount}>
            {item.likes.length} lượt thích
          </Text>
        )}

        {/* Caption */}
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{item.user.name}</Text>{' '}
            {item.caption}
          </Text>
        </View>

        {/* Comments Preview */}
        {item.comments.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push(`/post-detail?id=${item._id}`)}
          >
            <Text style={styles.viewComments}>
              Xem {item.comments.length} bình luận
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingPizza size={100} color="#FF8C42" showText={true} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Feed
        </ThemedText>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && !loading ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color="#FF8C42" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>Chưa có bài đăng nào</Text>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  addButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  postContainer: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedCreatorBadge: {
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
  feedCreatorBadgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6.5,
  },
  userInfoText: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8C42',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  followingButton: {
    backgroundColor: '#F0F0F0',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  followingButtonText: {
    color: '#666',
  },
  postImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#000000',
    resizeMode: 'contain',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionsLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  likesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  captionContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '600',
  },
  viewComments: {
    fontSize: 14,
    color: '#999',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#FF8C42',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

