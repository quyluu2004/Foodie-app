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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { postAPI } from '@/contexts/api';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeImageUrl } from '@/utils/imageUrl';
import LoadingPizza from '@/components/LoadingPizza';

interface Post {
  _id: string;
  imageUrl: string;
  caption: string;
  likes: string[];
  comments: any[];
  createdAt: string;
}

export default function MyPostsScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      const response = await postAPI.getByUser(user._id, 1, 100);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('❌ Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user?._id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
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

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => router.push(`/post-detail?id=${item._id}`)}
    >
      <Image 
        source={{ uri: normalizeImageUrl(item.imageUrl, item.updatedAt) || item.imageUrl }} 
        style={styles.postImage} 
      />
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <View style={styles.postStatItem}>
            <Ionicons name="heart" size={18} color="#FFFFFF" />
            <Text style={styles.postStatText}>{item.likes.length}</Text>
          </View>
          <View style={styles.postStatItem}>
            <Ionicons name="chatbubble" size={18} color="#FFFFFF" />
            <Text style={styles.postStatText}>{item.comments.length}</Text>
          </View>
        </View>
      </View>
      <View style={styles.postInfo}>
        <Text style={styles.postCaption} numberOfLines={2}>
          {item.caption}
        </Text>
        <Text style={styles.postTime}>{formatTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingPizza size={100} color="#FF8C42" showText={true} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài đăng của tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      {posts.length === 0 ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <Ionicons name="images-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>Chưa có bài đăng nào</Text>
          <Text style={styles.emptyText}>
            Bắt đầu chia sẻ những khoảnh khắc ẩm thực của bạn!
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.postsGrid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            <View style={styles.statsHeader}>
              <Text style={styles.statsText}>
                Tổng cộng {posts.length} bài đăng
              </Text>
            </View>
          }
        />
      )}
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
    fontFamily: 'Poppins_700Bold',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 8,
    fontFamily: 'Poppins_700Bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Inter_400Regular',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8C42',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  statsHeader: {
    padding: 20,
    paddingBottom: 12,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Inter_600SemiBold',
  },
  postsGrid: {
    padding: 12,
  },
  postCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#000000',
    resizeMode: 'contain',
  },
  postOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  postStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  postInfo: {
    padding: 12,
  },
  postCaption: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: 'Inter_400Regular',
  },
  postTime: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Inter_400Regular',
  },
});

