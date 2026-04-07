import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useOnboarding } from '@/contexts/OnboardingContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Chào mừng đến với Foodie',
    subtitle: 'Khám phá những món ăn ngon từ Việt Nam',
    description: 'Tìm kiếm và chia sẻ những công thức nấu ăn tuyệt vời từ khắp mọi miền đất nước.',
    icon: '🍜',
    color: '#FF8C42',
  },
  {
    id: 2,
    title: 'Tạo công thức riêng',
    subtitle: 'Chia sẻ bí quyết nấu ăn của bạn',
    description: 'Lưu lại những công thức gia đình và chia sẻ với cộng đồng yêu thích ẩm thực.',
    icon: '👨‍🍳',
    color: '#10B981',
  },
  {
    id: 3,
    title: 'Lưu món yêu thích',
    subtitle: 'Tạo bộ sưu tập cá nhân',
    description: 'Lưu lại những món ăn bạn yêu thích và dễ dàng tìm lại khi cần.',
    icon: '❤️',
    color: '#3B82F6',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const fadeAnim = useSharedValue(1);
  const { setHasSeenOnboarding } = useOnboarding();

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scrollX.value = withSpring((currentIndex + 1) * width);
    } else {
      handleGetStarted();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      scrollX.value = withSpring((currentIndex - 1) * width);
    }
  };

  const handleGetStarted = async () => {
    await setHasSeenOnboarding(true);
    fadeAnim.value = withTiming(0, { duration: 300 }, () => {
      router.replace('/(tabs)');
    });
  };

  const handleSkip = async () => {
    await setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const renderSlide = (item: typeof onboardingData[0], index: number) => {
    const slideAnimatedStyle = useAnimatedStyle(() => {
      const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
      const translateX = interpolate(scrollX.value, inputRange, [width, 0, -width]);
      const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0]);
      
      return {
        transform: [{ translateX }],
        opacity,
      };
    });

    return (
      <Animated.View key={item.id} style={[styles.slide, slideAnimatedStyle]}>
        <View style={styles.slideContent}>
          <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
            <Text style={styles.iconText}>{item.icon}</Text>
          </View>
          
          <ThemedText type="title" style={styles.title}>
            {item.title}
          </ThemedText>
          
          <ThemedText type="defaultSemiBold" style={styles.subtitle}>
            {item.subtitle}
          </ThemedText>
          
          <ThemedText style={styles.description}>
            {item.description}
          </ThemedText>
        </View>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8C42" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <ThemedText style={styles.skipText}>Bỏ qua</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.slidesContainer}>
        {onboardingData.map((item, index) => renderSlide(item, index))}
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentIndex > 0 && (
            <TouchableOpacity onPress={handlePrevious} style={styles.previousButton}>
              <IconSymbol name="chevron.left" size={20} color="#6B7280" />
              <Text style={styles.previousText}>Trước</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextButton, { backgroundColor: onboardingData[currentIndex].color }]}
          >
            <Text style={styles.nextText}>
              {currentIndex === onboardingData.length - 1 ? 'Bắt đầu' : 'Tiếp theo'}
            </Text>
            <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  slidesContainer: {
    flex: 1,
    position: 'relative',
  },
  slide: {
    position: 'absolute',
    width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconText: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#FF8C42',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FF8C42',
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
  },
  previousText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  nextText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 8,
  },
});
