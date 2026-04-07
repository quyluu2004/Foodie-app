import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { storage } from '@/contexts/storage'; // Sử dụng storage từ contexts/storage.ts
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import LoadingPizza from '@/components/LoadingPizza';
import { resolveApiBase } from '@/config/api';

export default function RegisterCompleteScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    handleRegister();
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const handleRegister = async () => {
    let apiBase = '';
    try {
      setLoading(true);
      setError(null);

      // Lấy API base (dùng static import để tránh lỗi async-require của Metro)
      apiBase = resolveApiBase('http://localhost:8080/api');
      
      console.log('🌐 API Base URL:', apiBase);
      console.log('📝 Registration params:', {
        name: params.name,
        email: params.email,
        phone: params.phone,
        gender: params.gender,
        hasBirthDate: !!params.birthDate,
        hasAvatar: !!params.avatarUri,
      });

      // Validate email trước khi gửi
      const email = (params.email as string || '').trim();
      const name = (params.name as string || '').trim();
      
      console.log('📝 Derived data:', { email, name, hasAvatar: !!params.avatarUri });
      
      if (!email || !email.includes('@')) {
        throw new Error('Email không hợp lệ. Vui lòng nhập email đúng định dạng.');
      }

      // Chuẩn bị dữ liệu đăng ký
      const formData = new FormData();
      
      // Thêm các trường text - đảm bảo không gửi undefined
      formData.append('name', (params.name as string || '').trim());
      formData.append('email', email);
      formData.append('password', (params.password as string || '').trim());
      formData.append('phone', (params.phone as string || '').trim());
      formData.append('bio', (params.bio as string || '').trim());
      formData.append('gender', (params.gender as string || '').trim());
      
      console.log('📦 FormData values:', {
        name: params.name,
        email: email,
        phone: params.phone,
        gender: params.gender,
      });
      
      if (params.birthDate) {
        formData.append('birthDate', params.birthDate as string);
      }

      // Xử lý avatar
      const avatarUri = params.avatarUri as string;
      if (avatarUri && !avatarUri.startsWith('http')) {
        // Nếu là local URI, thêm vào FormData
        const filename = avatarUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        (formData as any).append('avatar', {
          uri: avatarUri,
          name: filename,
          type: type,
        });
        console.log('📷 Adding local avatar to FormData');
      } else if (avatarUri) {
        // Nếu là URL (default avatar), gửi trong body
        formData.append('avatarUrl', avatarUri);
        console.log('📷 Using default avatar URL:', avatarUri);
      }

      const registerUrl = `${apiBase}/auth/register`;
      console.log('🚀 Sending request to:', registerUrl);

      // Gọi API đăng ký với timeout
      // Note: Không set Content-Type header khi dùng FormData
      // React Native sẽ tự động set với boundary
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 giây timeout

      try {
        const response = await fetch(registerUrl, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (!response.ok) {
          let errorMessage = 'Đăng ký thất bại';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
            console.error('❌ Error response:', errorData);
          } catch (e) {
            console.error('❌ Could not parse error response');
            errorMessage = `Lỗi ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ Registration successful:', data);

        // Lưu token và user data
        if (data.token) {
          await storage.saveToken(data.token);
        }
        if (data.user) {
          await storage.saveUser(data.user);
        }

        // Chuyển đến màn hình đăng nhập sau 1.5 giây
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Kết nối timeout. Vui lòng kiểm tra kết nối mạng và thử lại.');
        }
        throw fetchError;
      }
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      console.error('❌ Error type:', err?.constructor?.name);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Error stack:', err?.stack);
      
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      if (err?.message?.includes('Network request failed') || err?.message?.includes('timeout')) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend đang chạy (port 8080)\n2. IP address đúng trong config/api.ts\n3. Kết nối mạng\n4. Firewall không chặn kết nối';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      console.error('❌ Full error details:', {
        message: err?.message,
        name: err?.name,
        code: err?.code,
        apiBase: apiBase,
      });
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (loading && !error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#E53E3E" />
        <Animated.View style={[styles.content, animatedStyle]}>
          <LoadingPizza size={100} color="#E53E3E" showText={true} />
        </Animated.View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#E53E3E" />
        <Animated.View style={[styles.content, animatedStyle]}>
          <Ionicons name="close-circle" size={80} color="#E53E3E" />
          <Text style={styles.errorTitle}>Đăng ký thất bại</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.buttonContainer}>
            <Text
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              Thử lại
            </Text>
            <Text
              style={styles.backButton}
              onPress={() => router.replace('/register')}
            >
              Quay lại đăng ký
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E53E3E" />
      <Animated.View style={[styles.content, animatedStyle]}>
        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        <Text style={styles.successTitle}>Đăng ký thành công!</Text>
        <Text style={styles.successText}>
          Tài khoản của bạn đã được tạo thành công.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E53E3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: 'white',
    color: '#E53E3E',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  backButton: {
    color: 'white',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

