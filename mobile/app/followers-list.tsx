import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { followAPI } from '@/contexts/api';
import { useAuth } from '@/contexts/AuthContext';
import LoadingPizza from '@/components/LoadingPizza';

interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export default function FollowersListScreen() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  const loadFollowers = async () => {
    try {
      setLoading(true);
      const response = await followAPI.getFollowers();
      const users = response.data.followers || [];
      setFollowers(users);

      // Load follow status cho mỗi user
      if (user?._id) {
        const followStatuses = await Promise.all(
          users.map(async (follower: User) => {
            try {
              const statusRes = await followAPI.checkFollowStatus(follower._id);
              return { userId: follower._id, isFollowing: statusRes.data.isFollowing };
            } catch (error) {
              return { userId: follower._id, isFollowing: false };
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
    } catch (error) {
      console.error('❌ Error loading followers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowers();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFollowers();
    setRefreshing(false);
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
      // Revert
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

  const renderFollower = ({ item }: { item: User }) => {
    const isFollowing = followingUsers.has(item._id);

    return (
      <View style={styles.userItem}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => router.push(`/user-profile?id=${item._id}`)}
        >
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.userInfoText}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={() => handleFollow(item._id)}
        >
          <Ionicons
            name={isFollowing ? "checkmark" : "add"}
            size={16}
            color={isFollowing ? "#666" : "#FFFFFF"}
          />
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? "Đang theo dõi" : "Theo dõi"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Người theo dõi</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={followers}
        renderItem={renderFollower}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Chưa có người theo dõi</Text>
          </View>
        }
        contentContainerStyle={followers.length === 0 ? styles.emptyList : styles.list}
      />
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
  list: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoText: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
  },
  userEmail: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8C42',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  followingButton: {
    backgroundColor: '#F0F0F0',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  followingButtonText: {
    color: '#666',
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
    fontFamily: 'Inter_400Regular',
  },
  emptyList: {
    flexGrow: 1,
  },
});

