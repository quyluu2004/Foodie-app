import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { premiumAPI } from '@/contexts/api';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingPizza from '@/components/LoadingPizza';

interface Transaction {
  _id: string;
  type: 'topup' | 'purchase' | 'donation' | 'earn' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  recipe?: {
    _id: string;
    title: string;
    imageUrl: string;
  };
  recipient?: {
    _id: string;
    name: string;
    avatarUrl: string;
  };
  message?: string;
  metadata?: any;
  createdAt: string;
}

const TRANSACTION_TYPES = [
  { value: '', label: 'Tất cả', icon: 'list' },
  { value: 'topup', label: 'Nạp xu', icon: 'add-circle' },
  { value: 'purchase', label: 'Mua công thức', icon: 'cart' },
  { value: 'donation', label: 'Donate', icon: 'heart' },
  { value: 'earn', label: 'Kiếm được', icon: 'trending-up' },
  { value: 'refund', label: 'Hoàn tiền', icon: 'arrow-undo' },
];

export default function TransactionHistoryScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [selectedType]);

  const loadTransactions = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await premiumAPI.getMyTransactions(
        pageNum,
        20,
        selectedType || undefined
      );

      const newTransactions = response.data.transactions || [];
      
      if (append) {
        setTransactions((prev) => [...prev, ...newTransactions]);
      } else {
        setTransactions(newTransactions);
      }

      setHasMore(
        pageNum < (response.data.pagination?.pages || 0)
      );
      setPage(pageNum);
    } catch (error: any) {
      console.error('❌ Lỗi load transactions:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử giao dịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadTransactions(1, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadTransactions(page + 1, true);
    }
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    setPage(1);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return 'add-circle';
      case 'purchase':
        return 'cart';
      case 'donation':
        return 'heart';
      case 'earn':
        return 'trending-up';
      case 'refund':
        return 'arrow-undo';
      default:
        return 'receipt';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'topup':
        return '#10B981'; // Green
      case 'purchase':
        return '#F59E0B'; // Amber
      case 'donation':
        return '#EF4444'; // Red
      case 'earn':
        return '#3B82F6'; // Blue
      case 'refund':
        return '#8B5CF6'; // Purple
      default:
        return '#6B7280'; // Gray
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'topup':
        return 'Nạp xu';
      case 'purchase':
        return 'Mua công thức';
      case 'donation':
        return 'Donate';
      case 'earn':
        return 'Kiếm được';
      case 'refund':
        return 'Hoàn tiền';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      case 'refunded':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Thành công';
      case 'pending':
        return 'Đang xử lý';
      case 'failed':
        return 'Thất bại';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} phút trước`;
      }
      return `${hours} giờ trước`;
    } else if (days === 1) {
      return 'Hôm qua';
    } else if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const sign = isNegative ? '-' : type === 'topup' || type === 'earn' ? '+' : '-';
    return `${sign}${absAmount.toLocaleString('vi-VN')} Xu`;
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const icon = getTransactionIcon(item.type);
    const color = getTransactionColor(item.type);
    const label = getTransactionLabel(item.type);
    const statusColor = getStatusColor(item.status);
    const isPositive = item.type === 'topup' || item.type === 'earn' || item.type === 'refund';

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionLeft}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
              <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionType}>{label}</Text>
              {item.recipe && (
                <Text style={styles.transactionDetail} numberOfLines={1}>
                  {item.recipe.title}
                </Text>
              )}
              {item.recipient && (
                <Text style={styles.transactionDetail} numberOfLines={1}>
                  Đến: {item.recipient.name}
                </Text>
              )}
              <Text style={styles.transactionTime}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text
              style={[
                styles.transactionAmount,
                isPositive ? styles.amountPositive : styles.amountNegative,
              ]}
            >
              {formatAmount(item.amount, item.type)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        </View>
        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
      <Text style={styles.emptySubtext}>
        {selectedType
          ? `Không có giao dịch loại "${TRANSACTION_TYPES.find((t) => t.value === selectedType)?.label}"`
          : 'Lịch sử giao dịch của bạn sẽ hiển thị ở đây'}
      </Text>
    </View>
  );

  if (loading && transactions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Lịch sử giao dịch</ThemedText>
            <View style={styles.placeholder} />
          </View>
          <LoadingPizza />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Lịch sử giao dịch</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {TRANSACTION_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.filterTab,
                selectedType === type.value && styles.filterTabActive,
              ]}
              onPress={() => handleTypeFilter(type.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={type.icon as any}
                size={18}
                color={selectedType === type.value ? '#FFFFFF' : '#FF8C42'}
              />
              <Text
                style={[
                  styles.filterTabText,
                  selectedType === type.value && styles.filterTabTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transactions List */}
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item._id}
          contentContainerStyle={
            transactions.length === 0 ? styles.emptyList : styles.listContent
          }
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF8C42"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator color="#FF8C42" size="small" />
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF8C42',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  placeholder: {
    width: 40,
  },
  filterContainer: {
    maxHeight: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#FF8C42',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8C42',
    fontFamily: 'Inter_600SemiBold',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyList: {
    flex: 1,
  },
  transactionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  transactionDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: 'Inter_400Regular',
  },
  transactionTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  amountPositive: {
    color: '#10B981',
  },
  amountNegative: {
    color: '#EF4444',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  messageContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontFamily: 'Inter_400Regular',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

