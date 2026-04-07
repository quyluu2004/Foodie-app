import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreateModal({ visible, onClose }: CreateModalProps) {
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(30)).current;
  const option1Opacity = React.useRef(new Animated.Value(0)).current;
  const option1TranslateX = React.useRef(new Animated.Value(-10)).current;
  const option2Opacity = React.useRef(new Animated.Value(0)).current;
  const option2TranslateX = React.useRef(new Animated.Value(-10)).current;

  React.useEffect(() => {
    if (visible) {
      // Reset values
      scaleAnim.setValue(0.85);
      translateYAnim.setValue(25);
      opacityAnim.setValue(0);
      option1Opacity.setValue(0);
      option1TranslateX.setValue(-8);
      option2Opacity.setValue(0);
      option2TranslateX.setValue(-8);

      // Backdrop fade in
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Menu appear animation with spring
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Stagger animation for options
        Animated.parallel([
          Animated.timing(option1Opacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.spring(option1TranslateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 7,
          }),
        ]).start();

        setTimeout(() => {
          Animated.parallel([
            Animated.timing(option2Opacity, {
              toValue: 1,
              duration: 180,
              useNativeDriver: true,
            }),
            Animated.spring(option2TranslateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 80,
              friction: 7,
            }),
          ]).start();
        }, 60);
      });
    } else {
      // Close animation
      Animated.parallel([
        Animated.timing(option1Opacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(option2Opacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.85,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: 25,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [visible]);

  const handleCreateRecipe = () => {
    onClose();
    setTimeout(() => {
      router.push('/create-recipe');
    }, 200);
  };

  const handleCreatePost = () => {
    onClose();
    setTimeout(() => {
      router.push('/create-post');
    }, 200);
  };

  const menuStyle = {
    transform: [
      { scale: scaleAnim },
      { translateY: translateYAnim },
    ],
    opacity: opacityAnim,
  };

  const backdropStyle = {
    opacity: backdropOpacity,
  };

  // Calculate position - appear from center bottom (near the + button)
  const menuPosition = {
    position: 'absolute' as const,
    bottom: Platform.OS === 'ios' ? 100 : 80, // Above tab bar
    alignSelf: 'center' as const,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, backdropStyle]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View style={[styles.menuContainer, menuPosition, menuStyle]}>
          {/* Options */}
          <View style={styles.optionsContainer}>
            <Animated.View
              style={{
                opacity: option1Opacity,
                transform: [{ translateX: option1TranslateX }],
              }}
            >
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleCreateRecipe}
                activeOpacity={0.7}
              >
                <Ionicons name="restaurant-outline" size={22} color="#1F2937" style={styles.optionIcon} />
                <Text style={styles.optionText}>Đăng công thức</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.divider} />

            <Animated.View
              style={{
                opacity: option2Opacity,
                transform: [{ translateX: option2TranslateX }],
              }}
            >
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleCreatePost}
                activeOpacity={0.7}
              >
                <Ionicons name="images-outline" size={22} color="#1F2937" style={styles.optionIcon} />
                <Text style={styles.optionText}>Đăng bài đăng</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minWidth: 200,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  optionsContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 48,
  },
  optionIcon: {
    marginRight: 12,
    width: 24,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
    marginHorizontal: 12,
  },
});

