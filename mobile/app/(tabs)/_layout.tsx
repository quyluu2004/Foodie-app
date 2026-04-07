import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Platform, TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import CreateModal from '@/components/CreateModal';

// Custom Tab Icon với animation đẹp
const AnimatedTabIcon = ({ 
  name, 
  focused, 
  size = 26 
}: { 
  name: keyof typeof Ionicons.glyphMap; 
  focused: boolean; 
  size?: number;
}) => {
  const scale = useSharedValue(focused ? 1.15 : 1);
  const opacity = useSharedValue(focused ? 1 : 0.5);
  const translateY = useSharedValue(focused ? -2 : 0);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, {
      damping: 12,
      stiffness: 200,
    });
    opacity.value = withTiming(focused ? 1 : 0.5, { duration: 250 });
    translateY.value = withSpring(focused ? -2 : 0, {
      damping: 12,
      stiffness: 200,
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons 
        name={name} 
        size={size} 
        color={focused ? '#FF8C42' : '#999'} 
      />
    </Animated.View>
  );
};

// Custom Create Button Component
const CreateTabButton = ({ onPress }: { onPress: () => void }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.createButtonContainer}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.createButton}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.createButtonInner, animatedStyle]}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [createModalVisible, setCreateModalVisible] = useState(false);

  return (
    <>
      <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#FF8C42',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarButton: route.name === 'create' ? undefined : HapticTab,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: 'Inter_600SemiBold',
          marginTop: -4,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -3,
          },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
          position: 'absolute',
        },
      })}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon name={focused ? "home" : "home-outline"} focused={focused} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Công thức',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon name={focused ? "restaurant" : "restaurant-outline"} focused={focused} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarButton: () => (
            <CreateTabButton onPress={() => setCreateModalVisible(true)} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Bài đăng',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon name={focused ? "images" : "images-outline"} focused={focused} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon name={focused ? "person" : "person-outline"} focused={focused} size={26} />
          ),
        }}
      />
      {/* Ẩn các tab không cần thiết nhưng giữ lại file để không ảnh hưởng chức năng */}
      <Tabs.Screen
        name="favorites"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
    </Tabs>
    <CreateModal
      visible={createModalVisible}
      onClose={() => setCreateModalVisible(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  createButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
  },
  createButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
