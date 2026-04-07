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
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, DancingScript_400Regular, DancingScript_500Medium, DancingScript_600SemiBold, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { chatAPI } from '@/contexts/api';
import { normalizeImageUrl } from '@/utils/imageUrl';
import LoadingPizza from '@/components/LoadingPizza';

interface ChatConversation {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  lastMessage?: string | null;
  lastMessageTime?: Date | string | null;
  unreadCount?: number | null;
}

export default function ChatListScreen() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load Dancing Script font (giống admin web)
  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
    DancingScript_500Medium,
    DancingScript_600SemiBold,
    DancingScript_700Bold,
  });

  useEffect(() => {
    loadConversations();
  }, []);

  // Socket.IO: Listen for new messages to update chat list real-time
  useEffect(() => {
    if (!socket || !isConnected || !user?._id) return;

    console.log('📋 [ChatList] Setting up Socket.IO listener for chat list updates');

    const handleNewMessage = (messageData: any) => {
      console.log('📨 [ChatList] Received newMessage event:', {
        conversationId: messageData.conversationId,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        currentUserId: user._id,
        text: messageData.text?.substring(0, 20),
      });

      const currentUserIdStr = String(user._id);
      const senderIdStr = String(messageData.senderId);
      const receiverIdStr = String(messageData.receiverId);
      const conversationId = messageData.conversationId;

      // Determine message text
      let messageText = '';
      if (messageData.imageUrl) {
        messageText = '📷 Đã gửi một hình ảnh';
      } else if (messageData.text) {
        messageText = String(messageData.text);
      } else {
        messageText = 'Đã gửi một tin nhắn';
      }

      // Update conversation in list (for both sent and received messages)
      setConversations(prev => {
        // Find conversation by conversationId or userId
        const existingIndex = prev.findIndex(conv => {
          if (conversationId && String(conv._id) === String(conversationId)) {
            return true;
          }
          // If sender is current user, find by receiverId
          if (senderIdStr === currentUserIdStr && String(conv.userId) === receiverIdStr) {
            return true;
          }
          // If receiver is current user, find by senderId
          if (receiverIdStr === currentUserIdStr && String(conv.userId) === senderIdStr) {
            return true;
          }
          return false;
        });

        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          const existingConv = updated[existingIndex];
          
          // Determine user info
          let userId = existingConv.userId;
          let userName = existingConv.userName;
          let userAvatar = existingConv.userAvatar;
          
          // If message is from other user, use sender info
          if (senderIdStr !== currentUserIdStr) {
            userId = senderIdStr;
            userName = messageData.sender?.name || existingConv.userName;
            userAvatar = messageData.sender?.avatarUrl || existingConv.userAvatar;
          } else {
            // If message is from current user, use receiver info
            userId = receiverIdStr;
            userName = messageData.receiver?.name || existingConv.userName;
            userAvatar = messageData.receiver?.avatarUrl || existingConv.userAvatar;
          }

          updated[existingIndex] = {
            ...updated[existingIndex],
            _id: conversationId || existingConv._id,
            userId: userId,
            userName: userName,
            userAvatar: userAvatar,
            lastMessage: messageText,
            lastMessageTime: new Date(),
            // Only increment unread if message is from other user
            unreadCount: senderIdStr !== currentUserIdStr 
              ? (existingConv.unreadCount || 0) + 1 
              : existingConv.unreadCount || 0,
          };
          
          // Move to top (most recent)
          const [moved] = updated.splice(existingIndex, 1);
          return [moved, ...updated];
        } else {
          // Add new conversation if not exists
          const isFromOtherUser = senderIdStr !== currentUserIdStr;
          const otherUserId = isFromOtherUser ? senderIdStr : receiverIdStr;
          const otherUserName = isFromOtherUser 
            ? (messageData.sender?.name || 'Người dùng')
            : (messageData.receiver?.name || 'Người dùng');
          const otherUserAvatar = isFromOtherUser
            ? messageData.sender?.avatarUrl
            : messageData.receiver?.avatarUrl;

          return [{
            _id: conversationId || `conv-${Date.now()}`,
            userId: otherUserId,
            userName: otherUserName,
            userAvatar: otherUserAvatar,
            lastMessage: messageText,
            lastMessageTime: new Date(),
            unreadCount: isFromOtherUser ? 1 : 0,
          }, ...prev];
        }
      });

      // Không hiển thị notification popup, chỉ cập nhật số lượng tin nhắn chưa đọc trong chat list
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, isConnected, user?._id]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getConversations();
      const conversationsData = response.data?.data || [];
      
      // Ensure all conversations have required fields and filter out invalid ones
      const formattedConversations = conversationsData
        .filter((conv: any) => conv && (conv._id || conv.userId)) // Filter out invalid conversations
        .map((conv: any) => ({
          _id: conv._id ? String(conv._id) : `conv-${Date.now()}-${Math.random()}`,
          userId: conv.userId ? String(conv.userId) : '',
          userName: conv.userName ? String(conv.userName) : 'Người dùng',
          userAvatar: conv.userAvatar ? String(conv.userAvatar) : undefined,
          lastMessage: conv.lastMessage ? String(conv.lastMessage) : '',
          lastMessageTime: conv.lastMessageTime || undefined,
          unreadCount: typeof conv.unreadCount === 'number' ? Number(conv.unreadCount) : 0,
        }));
      
      setConversations(formattedConversations);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      // Nếu lỗi, để empty array
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const getValidAvatarUrl = normalizeImageUrl;

  const formatTime = (date?: Date | string): string => {
    if (!date) return '';
    try {
      const now = new Date();
      const messageDate = date instanceof Date ? date : new Date(date);
      if (isNaN(messageDate.getTime())) return '';
      const diff = now.getTime() - messageDate.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      // Format giống Messenger
      if (minutes < 1) return 'Vừa xong';
      if (minutes < 60) return `${minutes} phút trước`;
      if (hours < 24) return `${hours} giờ trước`;
      if (days === 0) {
        // Hôm nay - hiển thị giờ:phút
        const timeStr = messageDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return timeStr || '';
      }
      if (days === 1) {
        // Hôm qua
        return 'Hôm qua';
      }
      if (days < 7) {
        // Trong tuần - hiển thị thứ
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const dayIndex = messageDate.getDay();
        return dayNames[dayIndex] || '';
      }
      // Ngoài tuần - hiển thị ngày tháng
      const day = messageDate.getDate();
      const month = messageDate.getMonth() + 1;
      return `${day} thg ${month}`;
    } catch (error) {
      return '';
    }
  };

  // Đợi font load xong
  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.headerTitle, { fontFamily: undefined }]}>Foodie</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerIconButton}>
                <Ionicons name="create-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm cuộc trò chuyện..."
                placeholderTextColor="#8E8E93"
                editable={false}
              />
              <TouchableOpacity style={styles.searchGridButton}>
                <Ionicons name="grid-outline" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingPizza size={100} color="#FF8C42" showText={true} />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Foodie</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerIconButton}>
                <Ionicons name="create-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm cuộc trò chuyện..."
                placeholderTextColor="#8E8E93"
                editable={false}
              />
              <TouchableOpacity style={styles.searchGridButton}>
                <Ionicons name="grid-outline" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingPizza size={100} color="#FF8C42" showText={true} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Giống Messenger nhưng dùng màu app */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Foodie</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconButton}>
              <Ionicons name="create-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm cuộc trò chuyện..."
              placeholderTextColor="#8E8E93"
            />
            <TouchableOpacity style={styles.searchGridButton}>
              <Ionicons name="grid-outline" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
            <Text style={styles.emptySubtext}>
              Bắt đầu trò chuyện với người dùng khác từ trang hồ sơ của họ
            </Text>
          </View>
        ) : (
          <View style={styles.conversationsList}>
            {conversations.map((conversation) => {
              // Ensure all values are properly formatted and never undefined/null
              const conversationId = conversation?._id ? String(conversation._id) : `conv-${Date.now()}-${Math.random()}`;
              const validAvatarUrl = conversation?.userAvatar ? getValidAvatarUrl(conversation.userAvatar) : null;
              const userName = conversation?.userName ? String(conversation.userName) : 'Người dùng';
              const userId = conversation?.userId ? String(conversation.userId) : '';
              const unreadCount = conversation?.unreadCount || 0;
              const hasUnread = Number(unreadCount) > 0;
              const lastMessageTime = conversation?.lastMessageTime || null;
              const lastMessage = conversation?.lastMessage ? String(conversation.lastMessage) : '';
              
              return (
                <TouchableOpacity
                  key={conversationId}
                  style={styles.conversationItem}
                  onPress={() => {
                    if (userId) {
                      router.push(`/chat?userId=${userId}&userName=${encodeURIComponent(userName)}`);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarContainer}>
                    {validAvatarUrl ? (
                      <Image source={{ uri: validAvatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={20} color="#666" />
                      </View>
                    )}
                    {hasUnread && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {Number(unreadCount) > 9 ? '9+' : String(unreadCount)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={[styles.userName, hasUnread && styles.userNameUnread]} numberOfLines={1}>
                        {userName}
                      </Text>
                      {lastMessageTime ? (
                        <Text style={styles.timeText}>
                          {String(formatTime(lastMessageTime) || '')}
                        </Text>
                      ) : null}
                    </View>
                    {lastMessage && lastMessage.trim() ? (
                      <Text style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]} numberOfLines={1}>
                        {lastMessage}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  header: {
    backgroundColor: '#FF8C42',
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 30, // text-3xl trong Tailwind = 30px
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
    fontFamily: 'DancingScript_700Bold', // 'Dancing Script', cursive
    letterSpacing: 0,
    textTransform: 'none',
    includeFontPadding: false,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#050505',
    fontFamily: 'Inter_400Regular',
    padding: 0,
  },
  searchGridButton: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  conversationsList: {
    paddingVertical: 0,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E6EB',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E4E6EB',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E4E6EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050505',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  userNameUnread: {
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Inter_400Regular',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Inter_400Regular',
  },
  lastMessageUnread: {
    color: '#050505',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

