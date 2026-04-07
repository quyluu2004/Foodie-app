import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// import * as StoreReview from 'expo-store-review'; // TODO: Cài đặt package này nếu cần

export default function AppRatingScreen() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleRateApp = async () => {
    try {
      // Fallback: Mở App Store/Play Store
      const storeUrl = Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/id123456789' // Thay bằng App ID thực tế
        : 'https://play.google.com/store/apps/details?id=com.foodie.mobile'; // Thay bằng package name thực tế
      
      Alert.alert(
        'Đánh giá ứng dụng',
        'Bạn có muốn mở cửa hàng ứng dụng để đánh giá Foodie không?',
        [
          { text: 'Để sau', style: 'cancel' },
          {
            text: 'Mở cửa hàng',
            onPress: () => {
              Linking.openURL(storeUrl).catch(() => {
                Alert.alert('Lỗi', 'Không thể mở cửa hàng ứng dụng');
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error requesting review:', error);
      Alert.alert('Lỗi', 'Không thể mở cửa hàng ứng dụng');
    }
  };

  const handleSubmitFeedback = () => {
    if (rating === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá');
      return;
    }

    // TODO: Gửi feedback lên backend
    Alert.alert(
      'Cảm ơn bạn!',
      'Cảm ơn bạn đã gửi phản hồi. Chúng tôi sẽ cải thiện ứng dụng dựa trên ý kiến của bạn.',
      [
        {
          text: 'Đánh giá trên cửa hàng',
          onPress: handleRateApp,
        },
        { text: 'Đóng', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8C42" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá ứng dụng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Rating Stars */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Bạn đánh giá ứng dụng như thế nào?</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={48}
                  color={star <= rating ? '#FFB800' : '#E5E7EB'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 5 && 'Tuyệt vời! 🎉'}
              {rating === 4 && 'Rất tốt! 👍'}
              {rating === 3 && 'Ổn! 😊'}
              {rating === 2 && 'Cần cải thiện 😔'}
              {rating === 1 && 'Không hài lòng 😞'}
            </Text>
          )}
        </View>

        {/* Feedback Form */}
        {rating > 0 && (
          <View style={styles.feedbackSection}>
            <Text style={styles.sectionTitle}>Chia sẻ ý kiến của bạn</Text>
            <Text style={styles.sectionDescription}>
              {rating >= 4
                ? 'Bạn thích điều gì ở Foodie? Chia sẻ với chúng tôi nhé!'
                : 'Chúng tôi rất muốn biết cách cải thiện ứng dụng. Hãy cho chúng tôi biết bạn nghĩ gì.'}
            </Text>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => {
                // TODO: Mở modal nhập feedback
                Alert.alert(
                  'Gửi phản hồi',
                  'Tính năng gửi phản hồi chi tiết đang được phát triển. Bạn có thể liên hệ với admin qua mục "Liên hệ với admin" trong cài đặt.',
                  [{ text: 'Đã hiểu', style: 'default' }]
                );
              }}
            >
              <Ionicons name="create-outline" size={20} color="#FF8C42" />
              <Text style={styles.feedbackButtonText}>Viết phản hồi</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Hành động nhanh</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleRateApp}>
            <View style={styles.actionIcon}>
              <Ionicons name="star" size={24} color="#FF8C42" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Đánh giá trên cửa hàng</Text>
              <Text style={styles.actionDescription}>
                Giúp Foodie phát triển bằng cách đánh giá trên App Store hoặc Google Play
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="share-social-outline" size={24} color="#FF8C42" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Chia sẻ với bạn bè</Text>
              <Text style={styles.actionDescription}>
                Giới thiệu Foodie cho bạn bè và người thân của bạn
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        {rating > 0 && (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFeedback}>
            <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FF8C42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 24,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FF8C42',
    fontFamily: 'Inter_500Medium',
    marginTop: 8,
  },
  feedbackSection: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF8C42',
    borderRadius: 8,
    gap: 8,
  },
  feedbackButtonText: {
    fontSize: 16,
    color: '#FF8C42',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF8C4220',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#FF8C42',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

