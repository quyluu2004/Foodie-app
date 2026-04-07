import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AvatarPicker from '@/components/AvatarPicker';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_face,r_max/w_200/lady.jpg';

export default function AvatarPickerScreen() {
  const params = useLocalSearchParams();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);

  React.useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 500 });
    containerTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      transform: [{ translateY: containerTranslateY.value }],
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleContinue = () => {
    buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
      buttonScale.value = withSpring(1);
    });

    // Lấy dữ liệu từ params và thêm avatarUri
    const registrationData = {
      ...params,
      avatarUri: avatarUri || DEFAULT_AVATAR,
    };

    // Chuyển sang màn hình xử lý đăng ký
    router.push({
      pathname: '/register-complete',
      params: registrationData,
    });
  };

  const handleSkip = () => {
    const registrationData = {
      ...params,
      avatarUri: DEFAULT_AVATAR,
    };

    router.push({
      pathname: '/register-complete',
      params: registrationData,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#E53E3E" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, containerAnimatedStyle]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name="person-circle-outline" size={60} color="white" />
          </View>
          <Text style={styles.title}>Chọn Avatar</Text>
          <Text style={styles.subtitle}>
            Thêm ảnh đại diện để mọi người nhận ra bạn
          </Text>
        </Animated.View>

        {/* Content */}
        <Animated.View style={[styles.content, containerAnimatedStyle]}>
          <AvatarPicker
            avatarUri={avatarUri}
            onAvatarSelected={setAvatarUri}
            size={150}
          />

          <Text style={styles.hint}>
            Bạn có thể chọn ảnh từ thư viện hoặc bỏ qua để sử dụng ảnh mặc định
          </Text>

          <View style={styles.buttonContainer}>
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>Tiếp tục</Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Bỏ qua</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E53E3E',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 8,
  },
  iconContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
    minHeight: '60%',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
  continueButton: {
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

