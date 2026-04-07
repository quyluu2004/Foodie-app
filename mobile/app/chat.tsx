import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
  Dimensions,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useChatUnread } from '@/contexts/ChatUnreadContext';
import { chatAPI, authAPI } from '@/contexts/api';
import { normalizeImageUrl } from '@/utils/imageUrl';
import axios from 'axios';
import { resolveApiBase } from '@/config/api';

const { width } = Dimensions.get('window');
const EMOJI_LIST = ['😀', '😂', '😍', '🥰', '😘', '😊', '😉', '😎', '🤗', '🤔', '😏', '😴', '😋', '😝', '🤪', '😜', '😮', '😯', '😲', '😳', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

interface ChatMessage {
  _id: string;
  text: string;
  imageUrl?: string;
  senderId: string;
  receiverId: string;
  sender?: {
    _id: string;
    name?: string;
    avatarUrl?: string;
  };
  createdAt: Date;
  isRead?: boolean;
  reactions?: { [emoji: string]: string[] };
  replyTo?: {
    _id: string;
    text?: string;
    imageUrl?: string;
    sender?: { name: string; _id: string };
  };
}

interface MessageMenu {
  messageId: string;
  position: { x: number; y: number };
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ userId?: string; userName?: string }>();
  const userId = params.userId;
  const userName = params.userName || 'Người dùng';
  const { user: currentUser, token } = useAuth();
  const { socket, isConnected } = useSocket();
  const { refreshUnreadCount } = useChatUnread();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<{ name: string; avatarUrl?: string } | null>(null);
  const [messageMenu, setMessageMenu] = useState<MessageMenu | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const tokenRef = useRef<string | null>(null);
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const messageRefs = useRef<{ [key: string]: View | null }>({});
  const conversationIdRef = useRef<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    if (userId) {
      // Reset conversationId when userId changes
      conversationIdRef.current = null;
      setConversationId(null);
      setMessages([]);
      loadUserInfo();
      loadMessages();
    }
  }, [userId]);

  // Socket.IO: Join conversation room and listen for new messages
  useEffect(() => {
    if (!socket || !isConnected || !userId || !currentUser?._id) return;

    console.log(`🔌 Setting up Socket.IO listeners for userId: ${userId}, conversationId: ${conversationId}`);

    // Listen for new messages (listen to both conversation room and personal room)
    const handleNewMessage = (messageData: any) => {
      console.log('📨 Received newMessage event:', {
        conversationId: messageData.conversationId,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        currentUserId: currentUser._id,
        isForThisConversation: conversationId ? messageData.conversationId === conversationId : true,
        isFromOtherUser: messageData.senderId !== currentUser._id,
      });

      // Check if message is for this conversation and from other user
      const currentUserIdStr = String(currentUser._id);
      const senderIdStr = String(messageData.senderId);
      const receiverIdStr = String(messageData.receiverId);
      const userIdStr = String(userId);
      
      const isForThisConversation = conversationId 
        ? String(messageData.conversationId) === String(conversationId)
        : (receiverIdStr === currentUserIdStr && senderIdStr === userIdStr);
      const isFromOtherUser = senderIdStr !== currentUserIdStr;

      if (isForThisConversation && isFromOtherUser) {
        // Format message
        const formattedMessage: ChatMessage = {
          _id: messageData._id,
          text: String(messageData.text || ''),
          imageUrl: messageData.imageUrl || undefined,
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          sender: messageData.sender ? {
            _id: messageData.sender._id || '',
            name: messageData.sender.name || '',
            avatarUrl: messageData.sender.avatarUrl || undefined,
          } : undefined,
          createdAt: messageData.createdAt ? new Date(messageData.createdAt) : new Date(),
          isRead: messageData.isRead || false,
          reactions: messageData.reactions || undefined,
          replyTo: messageData.replyTo ? {
            _id: messageData.replyTo._id || '',
            text: messageData.replyTo.text || '',
            imageUrl: messageData.replyTo.imageUrl || undefined,
            sender: messageData.replyTo.sender ? {
              _id: messageData.replyTo.sender._id || '',
              name: messageData.replyTo.sender.name || '',
            } : undefined,
          } : undefined,
        };

        // Add message to state (avoid duplicates)
        setMessages(prev => {
          const exists = prev.some(m => m._id === formattedMessage._id);
          if (exists) {
            console.log('⚠️ Message already exists, skipping:', formattedMessage._id);
            return prev;
          }
          console.log('✅ Adding new message to state:', formattedMessage._id);
          return [...prev, formattedMessage];
        });

        // Auto scroll to bottom
        setTimeout(() => {
          scrollToEnd();
        }, 100);
      } else {
        console.log('⏭️ Skipping message:', {
          isForThisConversation,
          isFromOtherUser,
          reason: !isForThisConversation ? 'not for this conversation' : 'from current user'
        });
      }
    };

    socket.on('newMessage', handleNewMessage);

    // Join conversation room if we have conversationId
    if (conversationId) {
      socket.emit('joinConversation', conversationId);
      console.log(`📥 Joined conversation room: ${conversationId}`);
    }

    // Cleanup: Leave room and remove listener
    return () => {
      if (conversationId) {
        socket.emit('leaveConversation', conversationId);
        console.log(`📤 Left conversation room: ${conversationId}`);
      }
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, isConnected, userId, currentUser?._id, conversationId]);

  // Refresh messages khi screen vào focus
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        loadMessages();
      }
    }, [userId])
  );

  const loadUserInfo = async () => {
    if (!userId) return;
    try {
      const response = await authAPI.getUserById(userId);
      const userData = response.data?.user;
      if (userData) {
        setOtherUser({
          name: userData.name || userName,
          avatarUrl: userData.avatarUrl,
        });
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      // Fallback to params
      setOtherUser({
        name: userName,
        avatarUrl: undefined,
      });
    }
  };

  useEffect(() => {
    scrollToEnd();
  }, [messages]);

  useEffect(() => {
    if (messageMenu) {
      Animated.spring(menuAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [messageMenu]);

  const loadMessages = async (isPolling = false) => {
    if (!userId) return;
    try {
      // Chỉ set loading khi không phải polling (tránh UI flickering)
      if (!isPolling) {
        setLoading(true);
      }
      const response = await chatAPI.getMessages(userId);
      const messagesData = response.data?.data || [];
      // Format messages để hiển thị
      const formattedMessages = messagesData.map((msg: any) => {
        // Format reactions từ Map sang object
        let reactions = {};
        if (msg.reactions) {
          if (msg.reactions instanceof Map) {
            // Convert Map to object
            msg.reactions.forEach((value, key) => {
              reactions[key] = Array.isArray(value) ? value : [];
            });
          } else if (typeof msg.reactions === 'object') {
            reactions = msg.reactions;
          }
        }
        
        // Store conversation ID from first message
        if (!conversationIdRef.current && msg.conversation) {
          const convId = msg.conversation.toString();
          conversationIdRef.current = convId;
          setConversationId(convId); // Update state to trigger Socket.IO listener re-run
          console.log('💾 Stored conversationId:', convId);
        }
        
         return {
           _id: msg._id || `msg-${Date.now()}-${Math.random()}`,
           text: String(msg.text || ''),
           imageUrl: msg.imageUrl || undefined,
           senderId: msg.sender?._id || msg.sender || '',
           receiverId: msg.receiver?._id || msg.receiver || '',
           sender: msg.sender ? {
             _id: msg.sender._id || '',
             name: msg.sender.name || '',
             avatarUrl: msg.sender.avatarUrl || undefined,
           } : undefined,
           createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
           isRead: msg.isRead || false,
           reactions: Object.keys(reactions).length > 0 ? reactions : undefined,
           replyTo: msg.replyTo ? {
             _id: msg.replyTo._id || '',
             text: msg.replyTo.text || '',
             imageUrl: msg.replyTo.imageUrl || undefined,
             sender: msg.replyTo.sender ? {
               _id: msg.replyTo.sender._id || '',
               name: msg.replyTo.sender.name || '',
             } : undefined,
           } : undefined,
         };
      });
      
      // Chỉ cập nhật state nếu có thay đổi (tránh re-render không cần thiết)
      setMessages(prev => {
        const prevIds = new Set(prev.map(m => m._id));
        const newIds = new Set(formattedMessages.map(m => m._id));
        
        // Kiểm tra xem có tin nhắn mới hoặc thay đổi không
        const hasNewMessages = formattedMessages.length !== prev.length || 
          formattedMessages.some(msg => !prevIds.has(msg._id));
        
        // Kiểm tra xem có thay đổi reactions không
        const hasReactionChanges = formattedMessages.some(newMsg => {
          const oldMsg = prev.find(m => m._id === newMsg._id);
          if (!oldMsg) return false;
          const oldReactions = JSON.stringify(oldMsg.reactions || {});
          const newReactions = JSON.stringify(newMsg.reactions || {});
          return oldReactions !== newReactions;
        });
        
        // Chỉ update nếu có thay đổi
        if (hasNewMessages || hasReactionChanges) {
          return formattedMessages;
        }
        return prev;
      });
      
      // Đánh dấu đã đọc (chỉ khi không phải polling để tránh spam API)
      if (!isPolling) {
        await chatAPI.markAsRead(userId);
        // Refresh unread count after marking as read
        refreshUnreadCount();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Chỉ set empty array khi không phải polling (tránh xóa messages khi polling lỗi)
      if (!isPolling) {
        setMessages([]);
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || !userId || sending) return;

    const messageText = inputText.trim();
    const replyToId = replyingTo?._id;
    setInputText('');
    setReplyingTo(null);
    const imageToSend = selectedImage;
    setSelectedImage(null);

    // Optimistic update
    const tempMessage: ChatMessage = {
      _id: `temp-${Date.now()}`,
      text: messageText,
      imageUrl: imageToSend || undefined,
      senderId: currentUser?._id || '',
      receiverId: userId,
      createdAt: new Date(),
      isRead: false,
    };

    setMessages(prev => [...prev, tempMessage]);
    setSending(true);

    try {
      if (imageToSend) {
        // Gửi với hình ảnh
        const BASE_URL = resolveApiBase("http://localhost:8080/api");
        const formData = new FormData();
        if (messageText) {
          formData.append('text', messageText);
        }
        
        const filename = imageToSend.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        (formData as any).append('image', {
          uri: Platform.OS === 'ios' ? imageToSend.replace('file://', '') : imageToSend,
          name: filename,
          type: type,
        });

        const formDataApi = axios.create({
          baseURL: BASE_URL,
          timeout: 30000,
          // Đặt sẵn header multipart để tránh axios trên React Native set sai mặc định gây Network Error
          headers: {
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json',
          },
        });
        
        formDataApi.interceptors.request.use(
          (config) => {
            const currentToken = tokenRef.current;
            if (currentToken) {
              config.headers.Authorization = `Bearer ${currentToken}`;
            }
            return config;
          },
          (error) => {
            return Promise.reject(error);
          }
        );

        await formDataApi.post(`/chat/messages/${userId}`, formData);
      } else {
        // Gửi chỉ text
        await chatAPI.sendMessage(userId, messageText, replyToId);
      }
      
      // Reload messages để lấy tin nhắn từ server với đầy đủ thông tin
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      // Revert optimistic update
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const scrollToEnd = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (date: Date | string) => {
    try {
      const now = new Date();
      const messageDate = date instanceof Date ? date : new Date(date);
      if (isNaN(messageDate.getTime())) return '';
      const diff = now.getTime() - messageDate.getTime();
      const minutes = Math.floor(diff / 60000);

      if (minutes < 1) return 'Vừa xong';
      if (minutes < 60) return `${minutes} phút trước`;
      return messageDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Chọn hình ảnh',
      'Bạn muốn chọn hình ảnh từ đâu?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thư viện',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              setSelectedImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Chụp ảnh',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập camera');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              setSelectedImage(result.assets[0].uri);
            }
          },
        },
      ]
    );
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const insertEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleLongPress = (message: ChatMessage, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setMessageMenu({
      messageId: message._id,
      position: { x: pageX, y: pageY },
    });
  };

  const handleDoubleTap = async (message: ChatMessage) => {
    // Tự động thả tim khi double tap
    await handleQuickReaction(message, '❤️');
  };

  const handleQuickReaction = async (message: ChatMessage, emoji: string) => {
    try {
      setMessageMenu(null);
      
      // Gọi API trước
      await chatAPI.toggleReaction(message._id, emoji);
      
      // Optimistic update sau khi API thành công
      const currentReactions = message.reactions || {};
      const emojiReactions = currentReactions[emoji] || [];
      const userReacted = emojiReactions.some((id: string) => id === currentUser?._id);
      
      setMessages(prev => prev.map(msg => {
        if (msg._id === message._id) {
          const newReactions = { ...currentReactions };
          if (userReacted) {
            // Xóa reaction
            const filtered = emojiReactions.filter((id: string) => id !== currentUser?._id);
            if (filtered.length === 0) {
              delete newReactions[emoji];
            } else {
              newReactions[emoji] = filtered;
            }
          } else {
            // Thêm reaction
            newReactions[emoji] = [...emojiReactions, currentUser?._id || ''];
          }
          return {
            ...msg,
            reactions: Object.keys(newReactions).length > 0 ? newReactions : undefined,
          };
        }
        return msg;
      }));
      
      // Reload sau một chút để sync với server
      setTimeout(async () => {
        await loadMessages();
      }, 500);
    } catch (error) {
      console.error('Error toggling reaction:', error);
      Alert.alert('Lỗi', 'Không thể thêm reaction. Vui lòng thử lại.');
      // Reload để lấy state đúng từ server
      await loadMessages();
    }
  };

  const handleCopy = async (message: ChatMessage) => {
    try {
      await Clipboard.setStringAsync(message.text || '');
      setMessageMenu(null);
      Alert.alert('Đã sao chép', 'Tin nhắn đã được sao chép');
    } catch (error) {
      console.error('Error copying:', error);
      Alert.alert('Lỗi', 'Không thể sao chép tin nhắn');
    }
  };

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
    setMessageMenu(null);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerUserInfo}
            onPress={() => {
              if (userId) {
                router.push({
                  pathname: '/user-profile',
                  params: { userId: userId },
                });
              }
            }}
          >
            {otherUser?.avatarUrl ? (
              <Image 
                source={{ uri: normalizeImageUrl(otherUser.avatarUrl) || otherUser.avatarUrl }} 
                style={styles.headerAvatar}
              />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>
              {otherUser?.name || userName}
            </Text>
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C42" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Giống Messenger với Avatar và Tên */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerUserInfo}
          onPress={() => {
            if (userId) {
              router.push({
                pathname: '/user-profile',
                params: { userId: userId },
              });
            }
          }}
        >
          {otherUser?.avatarUrl ? (
            <Image 
              source={{ uri: normalizeImageUrl(otherUser.avatarUrl) || otherUser.avatarUrl }} 
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {otherUser?.name || userName}
          </Text>
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages - Giống Messenger */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
            <Text style={styles.emptySubtext}>Bắt đầu cuộc trò chuyện với {userName}</Text>
          </View>
        ) : (
          <>
            {replyingTo && (
              <View style={styles.replyPreview}>
                <View style={styles.replyPreviewContent}>
                  <View style={styles.replyPreviewLine} />
                  <View style={styles.replyPreviewInfo}>
                    <Text style={styles.replyPreviewName}>
                      {replyingTo.senderId === currentUser?._id ? 'Bạn' : (otherUser?.name || 'Người dùng')}
                    </Text>
                    <Text style={styles.replyPreviewText} numberOfLines={1}>
                      {replyingTo.text || 'Hình ảnh'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={cancelReply} style={styles.replyCancelButton}>
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}
             {messages.map((message) => {
               const isMyMessage = message.senderId === currentUser?._id;
               const messageSenderId = message.senderId;
               return (
                 <View
                   key={message._id}
                   ref={(ref) => {
                     if (ref) {
                       messageRefs.current[message._id] = ref;
                     }
                   }}
                   style={[
                     styles.messageWrapper,
                     isMyMessage ? styles.myMessageWrapper : styles.otherMessageWrapper,
                   ]}
                 >
                   {/* Avatar cho tin nhắn của người khác */}
                   {!isMyMessage && (
                     <TouchableOpacity
                       style={styles.messageAvatar}
                       onPress={() => {
                         if (messageSenderId) {
                           router.push({
                             pathname: '/user-profile',
                             params: { userId: messageSenderId },
                           });
                         }
                       }}
                     >
                       {message.sender?.avatarUrl ? (
                         <Image
                           source={{ uri: normalizeImageUrl(message.sender.avatarUrl) || message.sender.avatarUrl }}
                           style={styles.messageAvatarImage}
                         />
                       ) : (
                         <View style={styles.messageAvatarPlaceholder}>
                           <Ionicons name="person" size={16} color="#666" />
                         </View>
                       )}
                     </TouchableOpacity>
                   )}
                   {/* Container cho reply preview và bubble - để align cùng nhau */}
                   <View style={[
                     styles.messageContentWrapper,
                     isMyMessage ? styles.messageContentWrapperMy : styles.messageContentWrapperOther,
                   ]}>
                     {/* Reply preview - ô trắng mờ nằm NGOÀI bubble cam nhưng ở trên đầu */}
                     {message.replyTo && (
                       <TouchableOpacity
                         style={[
                           styles.replyToPreview,
                           isMyMessage ? styles.replyToPreviewMy : styles.replyToPreviewOther,
                         ]}
                       onPress={() => {
                         // Tìm tin nhắn đã reply và scroll tới đó
                         const repliedMessageId = message.replyTo?._id;
                         if (repliedMessageId && scrollViewRef.current) {
                           const repliedMessageRef = messageRefs.current[repliedMessageId];
                           if (repliedMessageRef) {
                             // Sử dụng measureLayout để scroll chính xác
                             repliedMessageRef.measureLayout(
                               scrollViewRef.current as any,
                               (x, y, width, height) => {
                                 scrollViewRef.current?.scrollTo({
                                   y: Math.max(0, y - 50), // Trừ 50px để hiển thị phần trên
                                   animated: true,
                                 });
                               },
                               () => {
                                 // Fallback: scroll tới index ước tính
                                 const repliedMessageIndex = messages.findIndex(m => m._id === repliedMessageId);
                                 if (repliedMessageIndex !== -1) {
                                   const estimatedY = repliedMessageIndex * 100;
                                   scrollViewRef.current?.scrollTo({
                                     y: Math.max(0, estimatedY - 50),
                                     animated: true,
                                   });
                                 }
                               }
                             );
                           } else {
                             // Fallback: scroll tới index ước tính
                             const repliedMessageIndex = messages.findIndex(m => m._id === repliedMessageId);
                             if (repliedMessageIndex !== -1) {
                               setTimeout(() => {
                                 const estimatedY = repliedMessageIndex * 100;
                                 scrollViewRef.current?.scrollTo({
                                   y: Math.max(0, estimatedY - 50),
                                   animated: true,
                                 });
                               }, 100);
                             }
                           }
                         }
                       }}
                       activeOpacity={0.7}
                     >
                       <View style={styles.replyToLine} />
                       <View style={styles.replyToInfo}>
                         <Text style={styles.replyToName}>
                           {message.replyTo.sender?.name || (message.replyTo.sender?._id === currentUser?._id ? 'Bạn' : 'Người dùng')}
                         </Text>
                         <View style={styles.replyToContent}>
                           {message.replyTo.imageUrl ? (
                             <>
                               <Ionicons name="attach" size={10} color="#666" />
                               <Text style={styles.replyToText}>File đính kèm</Text>
                             </>
                           ) : (
                             <Text style={styles.replyToText}>
                               {message.replyTo.text || ''}
                             </Text>
                           )}
                         </View>
                         </View>
                       </TouchableOpacity>
                     )}
                     {/* Reply indicator - mũi tên và text phía trên tin nhắn */}
                     {message.replyTo && (
                       <View style={[
                         styles.replyIndicator,
                         isMyMessage ? styles.replyIndicatorRight : styles.replyIndicatorLeft,
                       ]}>
                         <Ionicons 
                           name="arrow-back" 
                           size={12} 
                           color={isMyMessage ? '#FF8C42' : '#666'} 
                           style={styles.replyArrow}
                         />
                         <Text style={[
                           styles.replyIndicatorText,
                           isMyMessage ? styles.replyIndicatorTextRight : styles.replyIndicatorTextLeft,
                         ]} numberOfLines={1}>
                           Bạn đã trả lời
                         </Text>
                       </View>
                     )}
                     <Pressable
                     onLongPress={(e) => handleLongPress(message, e)}
                     onPress={() => {
                       // Double tap detection
                       const now = Date.now();
                       const lastTap = (message as any).lastTap || 0;
                       const timeDiff = now - lastTap;
                       
                       if (timeDiff < 300 && timeDiff > 0) {
                         // Double tap detected
                         handleDoubleTap(message);
                       }
                       (message as any).lastTap = now;
                     }}
                     style={[
                       styles.messageBubble,
                       isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
                       !message.text && message.imageUrl && styles.messageBubbleImageOnly, // Khi chỉ có hình, điều chỉnh padding
                     ]}
                   >
                    {message.imageUrl && (
                      <View style={[
                        styles.messageImageContainer,
                        !message.text && styles.messageImageContainerFull, // Khi chỉ có hình, fill toàn bộ bubble
                      ]}>
                        <Image 
                          source={{ uri: normalizeImageUrl(message.imageUrl) || message.imageUrl }} 
                          style={styles.messageImage}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    {message.text ? (
                      <Text
                        style={[
                          styles.messageText,
                          isMyMessage ? styles.myMessageText : styles.otherMessageText,
                        ]}
                      >
                        {String(message.text)}
                      </Text>
                    ) : null}
                    <Text
                      style={[
                        styles.messageTime,
                        isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
                      ]}
                    >
                      {formatTime(message.createdAt) || ''}
                    </Text>
                    {/* Reactions hiển thị như emoji nhỏ ở góc dưới bên phải của bubble - giống Messenger */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <View style={[
                        styles.reactionIcon,
                        isMyMessage ? styles.reactionIconRight : styles.reactionIconLeft,
                      ]}>
                        {/* Hiển thị emoji đầu tiên hoặc emoji phổ biến nhất */}
                        {(() => {
                          const reactions = message.reactions;
                          const sortedReactions = Object.entries(reactions).sort((a, b) => (b[1]?.length || 0) - (a[1]?.length || 0));
                          const topReaction = sortedReactions[0];
                          return topReaction ? (
                            <Text style={styles.reactionEmojiIcon}>{topReaction[0]}</Text>
                          ) : null;
                        })()}
                       </View>
                     )}
                   </Pressable>
                   </View>
                 </View>
               );
             })}
          </>
        )}
      </ScrollView>

      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={styles.selectedImageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} resizeMode="cover" />
          <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Bar - Giống Messenger */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          {/* Emoji Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Ionicons name="happy-outline" size={24} color="#FF8C42" />
          </TouchableOpacity>

          {/* Image Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={showImagePicker}
            disabled={sending}
          >
            <Ionicons name="image-outline" size={24} color="#FF8C42" />
          </TouchableOpacity>

          {/* Camera Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={showImagePicker}
            disabled={sending}
          >
            <Ionicons name="camera-outline" size={24} color="#FF8C42" />
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#8E8E93"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!sending}
          />

          {/* Send Button */}
          {(inputText.trim() || selectedImage) && (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Message Context Menu */}
      {messageMenu && (
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMessageMenu(null)}
        >
          <Animated.View
            style={[
              styles.messageMenu,
              {
                opacity: menuAnimation,
                transform: [
                  {
                    translateY: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Quick Reactions */}
            <View style={styles.quickReactions}>
              {QUICK_REACTIONS.map((emoji) => {
                const message = messages.find(m => m._id === messageMenu.messageId);
                if (!message) return null;
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.quickReactionButton}
                    onPress={() => handleQuickReaction(message, emoji)}
                  >
                    <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {/* Menu Options */}
            <View style={styles.menuOptions}>
              {(() => {
                const message = messages.find(m => m._id === messageMenu.messageId);
                if (!message) return null;
                return (
                  <>
                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => handleReply(message)}
                    >
                      <Ionicons name="arrow-undo" size={20} color="#050505" />
                      <Text style={styles.menuOptionText}>Trả lời</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.menuOption}
                      onPress={() => handleCopy(message)}
                    >
                      <Ionicons name="copy-outline" size={20} color="#050505" />
                      <Text style={styles.menuOptionText}>Sao chép</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>
          </Animated.View>
        </Pressable>
      )}

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <View style={styles.emojiModalOverlay}>
          <View style={styles.emojiModalContent}>
            <View style={styles.emojiModalHeader}>
              <Text style={styles.emojiModalTitle}>Chọn emoji</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.emojiGrid}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            >
              {EMOJI_LIST.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emojiItem}
                  onPress={() => insertEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
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
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  messageWrapper: {
    marginBottom: 4,
    maxWidth: '75%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  messageAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E4E6EB',
  },
  messageAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E4E6EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContentWrapper: {
    flex: 1,
    maxWidth: '75%',
  },
  messageContentWrapperMy: {
    alignItems: 'flex-end',
  },
  messageContentWrapperOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 60,
    maxWidth: '85%',
    position: 'relative',
    marginBottom: 8,
    alignSelf: 'flex-start',
    overflow: 'hidden', // Đảm bảo hình ảnh không tràn ra ngoài bubble
  },
  myMessageBubble: {
    backgroundColor: '#FF8C42',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  otherMessageBubble: {
    backgroundColor: '#E4E6EB',
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  messageBubbleImageOnly: {
    paddingHorizontal: 0, // Khi chỉ có hình, không cần padding ngang
    paddingVertical: 0, // Khi chỉ có hình, không cần padding dọc
  },
  messageImageContainer: {
    marginBottom: 6,
    overflow: 'hidden',
    borderRadius: 12, // Bo tròn góc để khớp với bubble
  },
  messageImageContainerFull: {
    marginBottom: 0, // Khi chỉ có hình, không cần margin bottom
    borderRadius: 18, // Khớp với borderRadius của bubble
  },
  messageImage: {
    width: 250,
    height: 250,
    borderRadius: 0, // Không cần borderRadius vì container sẽ xử lý
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#050505',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#8E8E93',
  },
  selectedImageContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F2F5',
    borderRadius: 18,
    fontSize: 15,
    color: '#050505',
    fontFamily: 'Inter_400Regular',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  emojiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  emojiModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  emojiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  emojiModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#050505',
    fontFamily: 'Inter_600SemiBold',
  },
  emojiGrid: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  emojiItem: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  emojiText: {
    fontSize: 32,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  messageMenu: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
  },
  quickReactions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
    gap: 8,
  },
  quickReactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  quickReactionEmoji: {
    fontSize: 24,
  },
  menuOptions: {
    paddingTop: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  menuOptionText: {
    fontSize: 16,
    color: '#050505',
    fontFamily: 'Inter_400Regular',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8C42',
  },
  replyPreviewContent: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  replyPreviewLine: {
    width: 3,
    height: 40,
    backgroundColor: '#FF8C42',
    borderRadius: 2,
    marginRight: 12,
  },
  replyPreviewInfo: {
    flex: 1,
  },
  replyPreviewName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF8C42',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  replyCancelButton: {
    padding: 4,
    marginLeft: 8,
  },
  reactionIcon: {
    position: 'absolute',
    bottom: -4,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  reactionIconRight: {
    right: -4,
  },
  reactionIconLeft: {
    left: -4,
  },
  reactionEmojiIcon: {
    fontSize: 14,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    paddingHorizontal: 8,
  },
  replyIndicatorRight: {
    alignSelf: 'flex-end',
  },
  replyIndicatorLeft: {
    alignSelf: 'flex-start',
  },
  replyArrow: {
    marginRight: 2,
  },
  replyIndicatorText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  replyIndicatorTextRight: {
    color: '#FF8C42',
  },
  replyIndicatorTextLeft: {
    color: '#666',
  },
  replyToPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 6,
    paddingBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#FF8C42',
    borderRadius: 8,
    minWidth: 100,
    maxWidth: '75%',
    alignSelf: 'flex-start',
  },
  replyToPreviewMy: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignSelf: 'flex-end',
  },
  replyToPreviewOther: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignSelf: 'flex-start',
  },
  replyToLine: {
    width: 2,
    height: 24,
    backgroundColor: '#FF8C42',
    borderRadius: 1,
    marginRight: 6,
  },
  replyToInfo: {
    flex: 1,
    minWidth: 0,
  },
  replyToName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF8C42',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  replyToContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  replyToText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
});
