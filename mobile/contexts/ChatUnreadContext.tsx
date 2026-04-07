import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { chatAPI } from '@/contexts/api';

interface ChatUnreadContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const ChatUnreadContext = createContext<ChatUnreadContextType | undefined>(undefined);

export const ChatUnreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refreshUnreadCount = async () => {
    if (!user?._id) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await chatAPI.getUnreadCount();
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('❌ Error loading chat unread count:', error);
      }
      setUnreadCount(0);
    }
  };

  // Load unread count on mount and when user changes
  useEffect(() => {
    refreshUnreadCount();

    // Polling: Refresh every 30 seconds
    const pollInterval = setInterval(() => {
      refreshUnreadCount();
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [user?._id]);

  // Listen for unread count updates via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected || !user?._id) return;

    const handleUnreadChatCount = (data: { unreadCount: number }) => {
      console.log('💬 [ChatUnreadContext] Received unreadChatCount event:', data.unreadCount);
      setUnreadCount(data.unreadCount);
    };

    socket.on('unreadChatCount', handleUnreadChatCount);

    return () => {
      socket.off('unreadChatCount', handleUnreadChatCount);
    };
  }, [socket, isConnected, user?._id]);

  return (
    <ChatUnreadContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </ChatUnreadContext.Provider>
  );
};

export const useChatUnread = () => {
  const context = useContext(ChatUnreadContext);
  if (context === undefined) {
    throw new Error('useChatUnread must be used within a ChatUnreadProvider');
  }
  return context;
};

