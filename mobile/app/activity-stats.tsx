import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { statsAPI } from '@/contexts/api';
import { useAuth } from '@/contexts/AuthContext';
import LoadingPizza from '@/components/LoadingPizza';

export default function ActivityStatsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await statsAPI.getActivityStats();
      setStats(response.data);
    } catch (error) {
      console.error('❌ Error loading activity stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
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

  const totalActivities =
    (stats?.totalActivities?.likes || 0) +
    (stats?.totalActivities?.comments || 0) +
    (stats?.totalActivities?.follows || 0) +
    (stats?.totalActivities?.recipeSaves || 0) +
    (stats?.totalActivities?.posts || 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hoạt động</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Total Activities */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="stats-chart" size={28} color="#FF8C42" />
            <Text style={styles.statTitle}>Tổng số hoạt động</Text>
          </View>
          <Text style={styles.statValue}>{totalActivities}</Text>
        </View>

        {/* Follow Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theo dõi</Text>
          <View style={styles.followStats}>
            <TouchableOpacity
              style={styles.followCard}
              onPress={() => router.push('/followers-list')}
            >
              <Ionicons name="people" size={24} color="#FF8C42" />
              <Text style={styles.followNumber}>{stats?.followersCount || 0}</Text>
              <Text style={styles.followLabel}>Người theo dõi</Text>
              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" style={styles.followChevron} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.followCard}
              onPress={() => router.push('/following-list')}
            >
              <Ionicons name="person-add" size={24} color="#FF8C42" />
              <Text style={styles.followNumber}>{stats?.followingCount || 0}</Text>
              <Text style={styles.followLabel}>Đang theo dõi</Text>
              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" style={styles.followChevron} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết hoạt động</Text>
          <View style={styles.activityList}>
            <TouchableOpacity
              style={styles.activityItem}
              onPress={() => router.push('/likes-received-list')}
            >
              <View style={[styles.activityIcon, { backgroundColor: '#FFE5E5' }]}>
                <Ionicons name="heart" size={20} color="#FF8C42" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Lượt thích nhận được</Text>
                <Text style={styles.activityValue}>
                  {stats?.totalLikesReceived || 0} lượt thích
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.activityItem}
              onPress={() => router.push('/comments-received-list')}
            >
              <View style={[styles.activityIcon, { backgroundColor: '#E5F3FF' }]}>
                <Ionicons name="chatbubble" size={20} color="#2196F3" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Bình luận nhận được</Text>
                <Text style={styles.activityValue}>
                  {stats?.totalCommentsReceived || 0} bình luận
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#FFF4E5' }]}>
                <Ionicons name="bookmark" size={20} color="#FF9800" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Công thức được lưu</Text>
                <Text style={styles.activityValue}>
                  {stats?.totalRecipeSaves || 0} lần lưu
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.activityItem}
              onPress={() => router.push('/my-posts')}
            >
              <View style={[styles.activityIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="images" size={20} color="#4CAF50" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Bài đăng đã tạo</Text>
                <Text style={styles.activityValue}>
                  {stats?.totalActivities?.posts || 0} bài đăng
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.activityItem}
              onPress={() => router.push('/following-list')}
            >
              <View style={[styles.activityIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="person-add" size={20} color="#9C27B0" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Đang theo dõi</Text>
                <Text style={styles.activityValue}>
                  {stats?.totalActivities?.follows || 0} người
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.activityItem}
              onPress={() => router.push('/my-reports')}
            >
              <View style={[styles.activityIcon, { backgroundColor: '#FFE5E5' }]}>
                <Ionicons name="flag" size={20} color="#FF8C42" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Báo cáo của tôi</Text>
                <Text style={styles.activityValue}>
                  {stats?.pendingReports || 0} đang chờ xử lý
                  {stats?.totalReports > 0 && ` • ${stats?.totalReports || 0} tổng`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tóm tắt</Text>
          <View style={styles.summaryList}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Lượt tương tác</Text>
              <Text style={styles.summaryValue}>
                {(stats?.totalLikesReceived || 0) + (stats?.totalCommentsReceived || 0)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Nội dung đã tạo</Text>
              <Text style={styles.summaryValue}>
                {(stats?.totalActivities?.posts || 0) + (stats?.totalActivities?.recipeSaves || 0)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Mức độ tương tác</Text>
              <Text style={styles.summaryValue}>
                {stats?.totalLikesReceived > 0
                  ? Math.round(
                      ((stats?.totalLikesReceived || 0) /
                        (stats?.totalActivities?.posts || 1)) *
                        10
                    ) / 10
                  : 0}
                %
              </Text>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF8C42',
    fontFamily: 'Poppins_700Bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 16,
  },
  followStats: {
    flexDirection: 'row',
    gap: 12,
  },
  followCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  followChevron: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  followNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF8C42',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Poppins_700Bold',
  },
  followLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 16,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Inter_400Regular',
  },
  activityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    fontFamily: 'Poppins_700Bold',
  },
  summaryList: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF8C42',
    fontFamily: 'Inter_600SemiBold',
  },
});

