import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { resolveApiBase } from '@/config/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = Infinity; // Không giới hạn số lần reconnect
  const isManualDisconnect = useRef(false); // Theo dõi disconnect có chủ ý không
  const isConnecting = useRef(false); // Tránh kết nối trùng lặp

  const connect = () => {
    // Kiểm tra điều kiện kết nối
    if (!token || !user?._id) {
      if (__DEV__) {
        console.log('⚠️ Cannot connect socket: No token or user');
      }
      return;
    }

    // Tránh kết nối trùng lặp
    if (isConnecting.current || (socket && socket.connected)) {
      return;
    }

    isConnecting.current = true;
    isManualDisconnect.current = false;

    // Disconnect existing socket if any
    if (socket) {
      socket.removeAllListeners(); // Xóa tất cả listeners để tránh memory leak
      socket.disconnect();
      setSocket(null);
    }

    // Get base URL and construct socket URL
    let BASE_URL = resolveApiBase('http://localhost:8080/api');
    
    // If resolved URL contains exp.direct (Expo tunnel), fallback to localhost
    if (BASE_URL.includes('exp.direct') || BASE_URL.includes('tunnel')) {
      if (__DEV__) {
        console.log('⚠️ Expo tunnel detected in API URL, using localhost for Socket.IO');
      }
      BASE_URL = 'http://localhost:8080/api';
    }
    
    // Remove /api and ensure we have the base URL
    let socketUrl = BASE_URL.replace('/api', '');
    // If URL doesn't end with port, add it
    if (!socketUrl.match(/:\d+$/)) {
      socketUrl = socketUrl.replace(/\/$/, '') + ':8080';
    }
    
    // Final check: if URL still contains exp.direct, use localhost
    if (socketUrl.includes('exp.direct') || socketUrl.includes('tunnel')) {
      if (__DEV__) {
        console.log('⚠️ Expo tunnel detected in Socket URL, using localhost');
      }
      socketUrl = 'http://localhost:8080';
    }

    if (__DEV__) {
      console.log('🔌 Connecting to Socket.IO:', socketUrl);
    }

    const newSocket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true, // Bật reconnect tự động của Socket.io
      reconnectionDelay: 1000, // Bắt đầu với 1 giây
      reconnectionDelayMax: 10000, // Tối đa 10 giây
      reconnectionAttempts: Infinity, // Không giới hạn số lần reconnect
      timeout: 20000, // 20 seconds timeout
      forceNew: false, // Không force new connection để tận dụng connection pool
      // Increase ping timeout to handle slow networks
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      // Thêm options để xử lý lỗi tốt hơn
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      if (__DEV__) {
        console.log('✅ Socket.IO connected:', newSocket.id);
      }
      setIsConnected(true);
      reconnectAttempts.current = 0; // Reset counter khi kết nối thành công
      isConnecting.current = false;
      
      // Clear any pending reconnect timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      isConnecting.current = false;
      
      // Chỉ log ở development mode
      if (__DEV__) {
        console.log('❌ Socket.IO disconnected:', reason);
        if (reason === 'io server disconnect') {
          console.log('   → Server initiated disconnect');
        } else if (reason === 'io client disconnect') {
          console.log('   → Client initiated disconnect (intentional)');
        } else if (reason === 'ping timeout') {
          console.log('   → Ping timeout - connection may be unstable');
        } else if (reason === 'transport close') {
          console.log('   → Transport closed - network issue');
        } else if (reason === 'transport error') {
          console.log('   → Transport error - connection error');
        }
      }
      
      // Không reconnect nếu là disconnect có chủ ý
      if (isManualDisconnect.current || reason === 'io client disconnect') {
        return;
      }
      
      // Socket.io sẽ tự động reconnect, không cần manual reconnect
      // Chỉ cần đảm bảo state được cập nhật
    });

    // Xử lý reconnect events của Socket.io Manager
    // Lắng nghe events từ manager để theo dõi reconnect attempts
    const manager = newSocket.io;
    if (manager) {
      manager.on('reconnect_attempt', (attemptNumber) => {
        if (__DEV__) {
          console.log(`🔄 Socket.IO reconnect attempt ${attemptNumber}`);
        }
        reconnectAttempts.current = attemptNumber;
      });

      manager.on('reconnect', (attemptNumber) => {
        if (__DEV__) {
          console.log(`✅ Socket.IO reconnected after ${attemptNumber} attempts`);
        }
        reconnectAttempts.current = 0;
      });

      manager.on('reconnect_failed', () => {
        if (__DEV__) {
          console.log('❌ Socket.IO reconnect failed - will keep trying');
        }
        // Socket.io sẽ tiếp tục thử reconnect tự động với cấu hình Infinity
      });
    }

    // Xử lý connect_error một cách im lặng
    newSocket.on('connect_error', (error) => {
      isConnecting.current = false;
      
      // Chỉ log ở development, không log error để tránh hiển thị Console Error
      if (__DEV__) {
        // Sử dụng console.log thay vì console.error để tránh hiển thị error trong React Native
        console.log('⚠️ Socket.IO connection error:', error.message);
        console.log('⚠️ Socket URL attempted:', socketUrl);
      }
      
      setIsConnected(false);
      
      // Socket.io sẽ tự động retry, không cần manual retry
      // Chỉ cần đảm bảo state được cập nhật
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    isManualDisconnect.current = true; // Đánh dấu là disconnect có chủ ý
    isConnecting.current = false;
    
    if (socket) {
      socket.removeAllListeners(); // Xóa tất cả listeners
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
    
    // Clear any pending reconnect timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // Connect when token/user is available
  useEffect(() => {
    if (token && user?._id) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, user?._id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

