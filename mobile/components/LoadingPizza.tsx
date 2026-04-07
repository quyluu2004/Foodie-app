import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

interface LoadingPizzaProps {
  size?: number;
  color?: string;
  showText?: boolean;
}

export default function LoadingPizza({
  size = 80,
  color = '#FF8C42',
  showText = false
}: LoadingPizzaProps) {
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Animation cho việc ăn pizza (progress từ 0 đến 1, lặp lại)
    progress.value = withRepeat(
      withTiming(1, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Animation xoay nhẹ để tạo hiệu ứng sống động
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  // Style cho pizza container với xoay nhẹ
  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  // Style cho mask che dần từ trên xuống (phần đã bị ăn)
  const maskStyle = useAnimatedStyle(() => {
    // Điều chỉnh mask để che phủ tốt hơn
    const maskHeight = interpolate(progress.value, [0, 1], [0, size]);
    return {
      height: maskHeight,
    };
  });

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: size, height: size }]}>
        <Animated.View style={[containerStyle, { width: size, height: size }]}>
          {/* Pizza Image */}
          <Image
            source={require('../assets/images/pizza-loading.png')}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
            resizeMode="contain"
          />

          {/* Mask overlay - phần bị che (đã ăn) từ trên xuống */}
          <Animated.View
            style={[
              styles.mask,
              maskStyle,
              {
                width: size,
                backgroundColor: '#FFFFFF', // Màu nền (giả sử nền app là trắng)
                // Nếu nền app không phải trắng, cần pass prop backgroundColor vào
              },
            ]}
          />
        </Animated.View>
      </View>
      {showText && (
        <Text style={styles.loadingText}>Đang tải...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mask: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
});

