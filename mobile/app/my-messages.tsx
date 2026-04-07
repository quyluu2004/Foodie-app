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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messageAPI } from '@/contexts/api';
import LoadingPizza from '@/components/LoadingPizza';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  _id: string;
  subject: string;
  message: string;
  type: string;
  status: string;
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function MyMessagesScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getMyMessages();
      setMessages(response.data?.data || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      Alert.alert('Lỗi', 'Không thể tải tin nhắn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FBBF24';
      case 'read':
        return '#60A5FA';
      case 'replied':
        return '#34D399';
      case 'resolved':
        return '#9CA3AF';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'read':
        return 'Đã đọc';
      case 'replied':
        return 'Đã trả lời';
      case 'resolved':
        return 'Đã giải quyết';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'password_reset':
        return 'key';
      case 'support':
        return 'help-circle';
      case 'report':
        return 'flag';
      default:
        return 'mail';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'password_reset':
        return '#F44336';
      case 'support':
        return '#2196F3';
      case 'report':
        return '#FF9800';
      default:
        return '#9C27B0';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tin nhắn của tôi</Text>
          <View style={{ width: 40 }} />
        </View>
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
        <Text style={styles.headerTitle}>Tin nhắn của tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Bạn chưa có tin nhắn nào</Text>
            <Text style={styles.emptySubtext}>
              Các phản hồi từ admin sẽ xuất hiện ở đây
            </Text>
          </View>
        ) : (
          <View style={styles.messagesList}>
            {messages.map((message) => (
              <TouchableOpacity
                key={message._id}
                style={styles.messageCard}
                onPress={() => setSelectedMessage(message)}
                activeOpacity={0.7}
              >
                <View style={styles.messageHeader}>
                  <View style={[styles.typeIcon, { backgroundColor: getTypeColor(message.type) + '20' }]}>
                    <Ionicons
                      name={getTypeIcon(message.type) as any}
                      size={20}
                      color={getTypeColor(message.type)}
                    />
                  </View>
                  <View style={styles.messageHeaderText}>
                    <Text style={styles.messageSubject} numberOfLines={1}>
                      {message.subject}
                    </Text>
                    <Text style={styles.messageDate}>
                      {new Date(message.createdAt).toLocaleString('vi-VN')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(message.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(message.status) }]}>
                      {getStatusText(message.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.messagePreview} numberOfLines={2}>
                  {message.message}
                </Text>

                {message.adminReply && (
                  <View style={styles.replyIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                    <Text style={styles.replyIndicatorText}>
                      Đã có phản hồi từ admin
                    </Text>
                  </View>
                )}

                {message.type === 'password_reset' && message.adminReply && (
                  <View style={styles.passwordResetAlert}>
                    <Ionicons name="key" size={20} color="#F44336" />
                    <Text style={styles.passwordResetText}>
                      Mật khẩu mới đã được gửi trong phản hồi
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết tin nhắn</Text>
              <TouchableOpacity
                onPress={() => setSelectedMessage(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Tiêu đề</Text>
                <Text style={styles.detailValue}>{selectedMessage.subject}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Loại</Text>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(selectedMessage.type) + '20' }]}>
                  <Ionicons
                    name={getTypeIcon(selectedMessage.type) as any}
                    size={16}
                    color={getTypeColor(selectedMessage.type)}
                  />
                  <Text style={[styles.typeText, { color: getTypeColor(selectedMessage.type) }]}>
                    {selectedMessage.type === 'password_reset'
                      ? 'Đặt lại mật khẩu'
                      : selectedMessage.type === 'support'
                      ? 'Hỗ trợ'
                      : selectedMessage.type === 'report'
                      ? 'Báo cáo'
                      : 'Chung'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Nội dung tin nhắn của bạn</Text>
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{selectedMessage.message}</Text>
                </View>
              </View>

              {selectedMessage.adminReply ? (
                <View style={styles.detailSection}>
                  <View style={styles.replyHeader}>
                    <Ionicons name="checkmark-circle" size={20} color="#34D399" />
                    <Text style={styles.replyHeaderText}>Phản hồi từ admin</Text>
                  </View>
                  {selectedMessage.repliedAt && (
                    <Text style={styles.replyDate}>
                      {new Date(selectedMessage.repliedAt).toLocaleString('vi-VN')}
                    </Text>
                  )}
                  <View style={styles.replyBox}>
                    <Text style={styles.replyText}>{selectedMessage.adminReply}</Text>
                  </View>

                  {selectedMessage.type === 'password_reset' && (
                    <View style={styles.passwordResetBox}>
                      <Ionicons name="key" size={24} color="#F44336" />
                      <Text style={styles.passwordResetTitle}>Mật khẩu mới</Text>
                      <Text style={styles.passwordResetDescription}>
                        Mật khẩu mới của bạn đã được gửi trong phản hồi ở trên. Vui lòng đăng nhập và đổi mật khẩu ngay để bảo mật tài khoản.
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noReplyBox}>
                  <Ionicons name="time-outline" size={24} color="#FBBF24" />
                  <Text style={styles.noReplyText}>
                    Admin chưa phản hồi. Vui lòng chờ trong giây lát.
                  </Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Trạng thái</Text>
                <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedMessage.status) + '20' }]}>
                  <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedMessage.status) }]}>
                    {getStatusText(selectedMessage.status)}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setSelectedMessage(null)}
              >
                <Text style={styles.closeModalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FF8C42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  messagesList: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageHeaderText: {
    flex: 1,
  },
  messageSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  messageDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  messagePreview: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  replyIndicatorText: {
    fontSize: 12,
    color: '#34D399',
    marginLeft: 6,
    fontWeight: '600',
  },
  passwordResetAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  passwordResetText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 6,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  messageBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8C42',
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34D399',
    marginLeft: 8,
  },
  replyDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  replyBox: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#34D399',
  },
  replyText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  passwordResetBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignItems: 'center',
  },
  passwordResetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F44336',
    marginTop: 8,
    marginBottom: 8,
  },
  passwordResetDescription: {
    fontSize: 13,
    color: '#991B1B',
    textAlign: 'center',
    lineHeight: 18,
  },
  noReplyBox: {
    padding: 20,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    alignItems: 'center',
  },
  noReplyText: {
    fontSize: 14,
    color: '#92400E',
    marginTop: 8,
    textAlign: 'center',
  },
  statusBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusTextLarge: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeModalButton: {
    backgroundColor: '#FF8C42',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

