import React, { useState, useEffect, useCallback } from 'react';
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
import { router, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { reportAPI } from '@/contexts/api';
import LoadingPizza from '@/components/LoadingPizza';

interface Report {
  _id: string;
  type: 'recipe' | 'post' | 'comment' | 'user';
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'rejected';
  targetInfo?: {
    title?: string;
    caption?: string;
    text?: string;
    author?: string;
    user?: string;
  };
  resolvedBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  resolvedAt?: string;
}

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  useEffect(() => {
    loadReports();
  }, [filter]);

  // Reload reports when screen comes into focus (e.g., after submitting a new report)
  useFocusEffect(
    useCallback(() => {
      // Reload when screen comes into focus
      loadReports();
    }, [filter])
  );

  const loadReports = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const response = await reportAPI.getMyReports(status);
      const reportsData = response.data?.reports || [];
      console.log('📋 Loaded reports:', reportsData.length, 'Filter:', filter);
      console.log('📋 Reports status breakdown:', {
        pending: reportsData.filter((r: Report) => r.status === 'pending').length,
        resolved: reportsData.filter((r: Report) => r.status === 'resolved').length,
      });
      setReports(reportsData);
    } catch (error: any) {
      console.error('❌ Error loading reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'recipe':
        return 'Công thức';
      case 'post':
        return 'Bài đăng';
      case 'comment':
        return 'Bình luận';
      case 'user':
        return 'Người dùng';
      default:
        return type;
    }
  };

  const getTargetContent = (report: Report) => {
    if (report.targetInfo) {
      if (report.type === 'recipe') {
        return report.targetInfo.title || 'N/A';
      } else if (report.type === 'post') {
        return report.targetInfo.caption || 'N/A';
      } else if (report.type === 'comment') {
        return report.targetInfo.text || 'N/A';
      }
    }
    return 'N/A';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && reports.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.headerTitle}>
              Báo cáo của tôi
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.loadingContainer}>
            <LoadingPizza size={100} color="#FF8C42" showText={true} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Báo cáo của tôi
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
              Chờ xử lý
            </Text>
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {reports.filter(r => r.status === 'pending').length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'resolved' && styles.filterTabActive]}
            onPress={() => setFilter('resolved')}
          >
            <Text style={[styles.filterText, filter === 'resolved' && styles.filterTextActive]}>
              Đã xử lý
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reports List */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {filteredReports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="flag-outline" size={60} color="#CCCCCC" />
              <Text style={styles.emptyText}>
                {filter === 'all' 
                  ? 'Bạn chưa có báo cáo nào'
                  : filter === 'pending'
                  ? 'Không có báo cáo chờ xử lý'
                  : 'Không có báo cáo đã xử lý'}
              </Text>
            </View>
          ) : (
            filteredReports.map((report) => (
              <View key={report._id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportIconContainer}>
                    <Ionicons name="flag" size={20} color="#FF8C42" />
                  </View>
                  <View style={styles.reportHeaderContent}>
                    <Text style={styles.reportReason}>{report.reason}</Text>
                    <View style={styles.statusContainer}>
                      <View
                        style={[
                          styles.statusBadge,
                          report.status === 'pending'
                            ? styles.statusBadgePending
                            : styles.statusBadgeResolved,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            report.status === 'pending'
                              ? styles.statusTextPending
                              : styles.statusTextResolved,
                          ]}
                        >
                          {report.status === 'pending' ? 'Chờ xử lý' : 'Đã xử lý'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {report.description && (
                  <Text style={styles.reportDescription}>{report.description}</Text>
                )}

                <View style={styles.reportDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="pricetag-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Loại:</Text>
                    <Text style={styles.detailValue}>{getTypeLabel(report.type)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Nội dung:</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {getTargetContent(report)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Ngày gửi:</Text>
                    <Text style={styles.detailValue}>{formatDate(report.createdAt)}</Text>
                  </View>
                  {report.status === 'resolved' && report.resolvedAt && (
                    <View style={styles.detailRow}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
                      <Text style={styles.detailLabel}>Ngày xử lý:</Text>
                      <Text style={styles.detailValue}>{formatDate(report.resolvedAt)}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#FF8C42',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    color: '#FF8C42',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reportHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportHeaderContent: {
    flex: 1,
  },
  reportReason: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePending: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeResolved: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPending: {
    color: '#F57C00',
  },
  statusTextResolved: {
    color: '#2E7D32',
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  reportDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

