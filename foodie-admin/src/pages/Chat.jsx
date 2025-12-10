import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { MessageSquare, Search, Send, User, Clock, CheckCircle2, Users } from 'lucide-react';

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' or 'users'
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const conversationIdRef = useRef(null);
  const selectedConversationRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchAllUsers();
    
    // Initialize Socket.IO connection
    const token = localStorage.getItem('adminToken');
    if (token) {
      socketRef.current = io('http://localhost:8080', {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected');
      });

      socketRef.current.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      // Listen for new messages
      socketRef.current.on('newMessage', (messageData) => {
        console.log('📨 New message received:', messageData);
        // Format message data
        const formattedMessage = {
          ...messageData,
          senderId: messageData.senderId || messageData.sender?._id,
          senderName: messageData.sender?.name || 'Người dùng',
          senderAvatar: messageData.sender?.avatarUrl || null,
          receiverId: messageData.receiverId || messageData.receiver?._id,
          receiverName: messageData.receiver?.name || 'Người dùng',
          receiverAvatar: messageData.receiver?.avatarUrl || null,
        };
        
        // Update messages if it's for the current conversation
        setMessages(prev => {
          // Use ref to get current selectedConversation
          const currentConv = selectedConversationRef.current;
          // Check if this message is for the currently selected conversation
          const isForCurrentConv = currentConv && 
            (formattedMessage.senderId?.toString() === currentConv.userId?.toString() || 
             formattedMessage.receiverId?.toString() === currentConv.userId?.toString());
          
          if (isForCurrentConv) {
            // Check if message already exists
            const exists = prev.some(msg => msg._id === formattedMessage._id);
            if (exists) return prev;
            return [...prev, formattedMessage];
          }
          return prev;
        });
        
        // Always refresh conversations to update lastMessage
        fetchConversations();
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Update ref when selectedConversation changes
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Join conversation room when conversation changes
  useEffect(() => {
    if (socketRef.current && selectedConversation) {
      // Leave previous conversation room
      if (conversationIdRef.current) {
        socketRef.current.emit('leaveConversation', conversationIdRef.current);
      }
      
      // Find conversation ID
      const conv = conversations.find(c => c.userId === selectedConversation.userId);
      if (conv?._id) {
        conversationIdRef.current = conv._id;
        socketRef.current.emit('joinConversation', conv._id);
      }
    }
  }, [selectedConversation, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Check URL params for direct chat with user
  useEffect(() => {
    const userId = searchParams.get('userId');
    const userName = searchParams.get('userName');
    
    if (userId && userName && conversations.length > 0) {
      // Find conversation with this user
      const existingConv = conversations.find(conv => conv.userId === userId);
      if (existingConv) {
        setSelectedConversation(existingConv);
      } else {
        // Create a temporary conversation object for display
        setSelectedConversation({
          _id: `temp-${userId}`,
          userId: userId,
          userName: decodeURIComponent(userName),
          userEmail: '',
          userAvatar: null,
          lastMessage: '',
          lastMessageTime: null,
          unreadCount: 0,
        });
      }
      // Clear URL params after setting conversation
      setSearchParams({});
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    if (selectedConversation && selectedConversation.userId) {
      fetchMessages(selectedConversation.userId);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat/admin/conversations');
      setConversations(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      alert('Có lỗi xảy ra khi tải danh sách cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get('/auth/users');
      // Filter out admin users (optional - you can remove this if you want to show all)
      const users = (response.data?.users || []).filter(user => user.role !== 'admin');
      setAllUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Don't show alert for users, just log error
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      setLoadingMessages(true);
      const response = await api.get(`/chat/messages/${userId}`);
      const messagesData = response.data?.data || [];
      // Format messages to include sender info
      const formattedMessages = messagesData.map(msg => ({
        ...msg,
        senderId: msg.sender?._id?.toString() || msg.senderId?.toString() || '',
        senderName: msg.sender?.name || 'Người dùng',
        senderAvatar: msg.sender?.avatarUrl || null,
        receiverId: msg.receiver?._id?.toString() || msg.receiverId?.toString() || '',
        receiverName: msg.receiver?.name || 'Người dùng',
        receiverAvatar: msg.receiver?.avatarUrl || null,
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      alert('Có lỗi xảy ra khi tải tin nhắn');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Normalize image URL
  const normalizeImageUrl = (url) => {
    if (!url) return null;
    // Replace old IP addresses with localhost
    return url
      .replace(/192\.168\.\d+\.\d+/g, 'localhost')
      .replace(/10\.\d+\.\d+\.\d+/g, 'localhost')
      .replace(/172\.\d+\.\d+\.\d+/g, 'localhost');
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedConversation || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await api.post(`/chat/messages/${selectedConversation.userId}`, {
        text: messageText,
      });
      
      // Reload messages
      await fetchMessages(selectedConversation.userId);
      // Reload conversations để cập nhật lastMessage
      await fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Có lỗi xảy ra khi gửi tin nhắn');
      setInputText(messageText); // Restore text on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return d.toLocaleDateString('vi-VN');
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = allUsers.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user) => {
    // Check if conversation already exists
    const existingConv = conversations.find(conv => conv.userId === user._id);
    if (existingConv) {
      setSelectedConversation(existingConv);
      setActiveTab('conversations'); // Switch to conversations tab
    } else {
      // Create temporary conversation object
      setSelectedConversation({
        _id: `temp-${user._id}`,
        userId: user._id,
        userName: user.name || 'Người dùng',
        userEmail: user.email || '',
        userAvatar: user.avatarUrl || null,
        lastMessage: '',
        lastMessageTime: null,
        unreadCount: 0,
      });
    }
  };

  return (
    <div className="p-4 lg:p-6 animate__animated animate__fadeInUp page-transition w-full h-full flex gap-4">
      {/* Conversations/Users List */}
      <div className="w-80 bg-white dark:bg-[#333333] rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-[#404040] flex flex-col">
        {/* Header with Tabs */}
        <div className="p-4 border-b border-gray-200 dark:border-[#404040]">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'conversations'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-[#404040] text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-200 dark:hover:bg-[#505050]'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Cuộc trò chuyện
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-[#404040] text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-200 dark:hover:bg-[#505050]'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              Tất cả người dùng
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-[#2A2A2A] text-gray-900"
            />
          </div>
        </div>

        {/* Conversations or Users List */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'conversations' ? (
            // Conversations Tab
            loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-[#E5E5E5]">Đang tải...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 dark:text-[#666666] mx-auto mb-2" />
                <p className="text-gray-500 dark:text-[#E5E5E5]">Không có cuộc trò chuyện nào</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 border-b border-gray-200 dark:border-[#404040] cursor-pointer transition-colors ${
                    selectedConversation?._id === conv._id ? 'bg-blue-50 dark:bg-[#1a1a2e]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      {conv.userAvatar && normalizeImageUrl(conv.userAvatar) ? (
                        <img
                          src={normalizeImageUrl(conv.userAvatar)}
                          alt={conv.userName}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span 
                        className="text-white font-bold text-lg"
                        style={{ display: conv.userAvatar && normalizeImageUrl(conv.userAvatar) ? 'none' : 'flex' }}
                      >
                        {conv.userName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-[#FFFFFF] truncate">
                          {conv.userName}
                        </h3>
                        {conv.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-[#CCCCCC] truncate mb-1">
                        {conv.lastMessage || 'Chưa có tin nhắn'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-[#888888]">
                        {formatTime(conv.lastMessageTime)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            // All Users Tab
            loadingUsers ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-[#E5E5E5]">Đang tải...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-300 dark:text-[#666666] mx-auto mb-2" />
                <p className="text-gray-500 dark:text-[#E5E5E5]">Không có người dùng nào</p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const hasConversation = conversations.some(conv => conv.userId === user._id);
                const isSelected = selectedConversation?.userId === user._id;
                
                return (
                  <div
                    key={user._id}
                    onClick={() => handleSelectUser(user)}
                    className={`p-4 border-b border-gray-200 dark:border-[#404040] cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-[#1a1a2e]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        {user.avatarUrl && normalizeImageUrl(user.avatarUrl) ? (
                          <img
                            src={normalizeImageUrl(user.avatarUrl)}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span 
                          className="text-white font-bold text-lg"
                          style={{ display: user.avatarUrl && normalizeImageUrl(user.avatarUrl) ? 'none' : 'flex' }}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-[#FFFFFF] truncate">
                            {user.name || 'Người dùng'}
                          </h3>
                          {hasConversation && (
                            <span className="bg-green-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                              Đã chat
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-[#CCCCCC] truncate mb-1">
                          {user.email || ''}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-[#888888]">
                          {user.role === 'creator' ? 'Người tạo' : 'Người dùng'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-[#333333] rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-[#404040] flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-[#404040]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  {selectedConversation.userAvatar && normalizeImageUrl(selectedConversation.userAvatar) ? (
                    <img
                      src={normalizeImageUrl(selectedConversation.userAvatar)}
                      alt={selectedConversation.userName}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span 
                    className="text-white font-bold"
                    style={{ display: selectedConversation.userAvatar && normalizeImageUrl(selectedConversation.userAvatar) ? 'none' : 'flex' }}
                  >
                    {selectedConversation.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-[#FFFFFF]">
                    {selectedConversation.userName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-[#AAAAAA]">
                    {selectedConversation.userEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-[#E5E5E5]">Đang tải tin nhắn...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 text-gray-300 dark:text-[#666666] mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-[#E5E5E5]">Chưa có tin nhắn nào</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    // In admin panel, we are the admin
                    // Messages sent by admin (not from the selected user) should be on the right
                    const isOwnMessage = msg.senderId?.toString() !== selectedConversation.userId?.toString();
                    const senderName = isOwnMessage ? 'Bạn' : (msg.senderName || selectedConversation.userName || 'Người dùng');
                    const senderAvatar = isOwnMessage ? null : (msg.senderAvatar || selectedConversation.userAvatar);

                    return (
                      <div
                        key={msg._id || `msg-${Date.now()}-${Math.random()}`}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end gap-2`}
                      >
                        {!isOwnMessage && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                            {senderAvatar && normalizeImageUrl(senderAvatar) ? (
                              <img
                                src={normalizeImageUrl(senderAvatar)}
                                alt={senderName}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <span 
                              className="text-white font-bold text-xs"
                              style={{ display: senderAvatar && normalizeImageUrl(senderAvatar) ? 'none' : 'flex' }}
                            >
                              {senderName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                          {!isOwnMessage && (
                            <span className="text-xs text-gray-500 dark:text-[#AAAAAA] mb-1 px-2">
                              {senderName}
                            </span>
                          )}
                          <div
                            className={`rounded-lg p-3 ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-[#404040] text-gray-900 dark:text-[#FFFFFF]'
                            }`}
                          >
                            {msg.text && <p className={`whitespace-pre-wrap ${isOwnMessage ? 'text-white' : ''}`}>{msg.text}</p>}
                            {msg.imageUrl && (
                              <img
                                src={normalizeImageUrl(msg.imageUrl)}
                                alt="Message"
                                className="mt-2 rounded-lg max-w-full h-auto"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className={`flex items-center gap-2 mt-2 text-xs ${isOwnMessage ? 'text-white opacity-80' : 'opacity-70'}`}>
                              <span>{new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              {isOwnMessage && msg.isRead && (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-[#404040]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-[#2A2A2A] dark:text-[#FFFFFF]"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || sending}
                  className={`p-2 rounded-lg transition-colors ${
                    !inputText.trim() || sending
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-20 h-20 text-gray-300 dark:text-[#666666] mx-auto mb-4" />
              <p className="text-gray-500 dark:text-[#E5E5E5] text-lg">
                Chọn một cuộc trò chuyện để bắt đầu
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

