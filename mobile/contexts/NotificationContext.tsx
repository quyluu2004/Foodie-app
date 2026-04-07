import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { notificationAPI } from '@/contexts/api';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      const response = await notificationAPI.getAll(1, 1, true);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('❌ Error loading notifications count:', error);
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

  // Listen for new notifications via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected || !user?._id) return;

    const handleNewNotification = () => {
      console.log('🔔 [NotificationContext] Received new notification event');
      // Refresh count after a short delay to ensure backend has processed
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(() => {
        refreshUnreadCount();
      }, 500);
    };

    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newNotification', handleNewNotification);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [socket, isConnected, user?._id]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

