import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsSettingsScreen() {
  const [recipeNotifications, setRecipeNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [likeNotifications, setLikeNotifications] = useState(true);
  const [followNotifications, setFollowNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');

  const handleSave = () => {
    // TODO: Lưu cài đặt vào backend
    router.back();
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
        <Text style={styles.headerTitle}>Cài đặt thông báo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Thông báo công thức */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant-outline" size={24} color="#FF8C42" />
            <Text style={styles.sectionTitle}>Thông báo công thức</Text>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Công thức mới</Text>
              <Text style={styles.settingDescription}>
                Nhận thông báo khi có công thức mới được đăng
              </Text>
            </View>
            <Switch
              value={recipeNotifications}
              onValueChange={setRecipeNotifications}
              trackColor={{ false: '#E5E7EB', true: '#FF8C42' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Thông báo tương tác */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart-outline" size={24} color="#FF8C42" />
            <Text style={styles.sectionTitle}>Thông báo tương tác</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Bình luận</Text>
              <Text style={styles.settingDescription}>
                Nhận thông báo khi có người bình luận vào bài viết của bạn
              </Text>
            </View>
            <Switch
              value={commentNotifications}
              onValueChange={setCommentNotifications}
              trackColor={{ false: '#E5E7EB', true: '#FF8C42' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Lượt thích</Text>
              <Text style={styles.settingDescription}>
                Nhận thông báo khi có người thích bài viết của bạn
              </Text>
            </View>
            <Switch
              value={likeNotifications}
              onValueChange={setLikeNotifications}
              trackColor={{ false: '#E5E7EB', true: '#FF8C42' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Theo dõi</Text>
              <Text style={styles.settingDescription}>
                Nhận thông báo khi có người theo dõi bạn
              </Text>
            </View>
            <Switch
              value={followNotifications}
              onValueChange={setFollowNotifications}
              trackColor={{ false: '#E5E7EB', true: '#FF8C42' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Thông báo hệ thống */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={24} color="#FF8C42" />
            <Text style={styles.sectionTitle}>Thông báo hệ thống</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Thông báo từ hệ thống</Text>
              <Text style={styles.settingDescription}>
                Nhận thông báo về cập nhật, bảo trì và thông tin quan trọng
              </Text>
            </View>
            <Switch
              value={systemNotifications}
              onValueChange={setSystemNotifications}
              trackColor={{ false: '#E5E7EB', true: '#FF8C42' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Giờ yên tĩnh */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="moon-outline" size={24} color="#FF8C42" />
            <Text style={styles.sectionTitle}>Giờ yên tĩnh</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Bật giờ yên tĩnh</Text>
              <Text style={styles.settingDescription}>
                Tắt thông báo trong khoảng thời gian bạn chỉ định
              </Text>
            </View>
            <Switch
              value={quietHoursEnabled}
              onValueChange={setQuietHoursEnabled}
              trackColor={{ false: '#E5E7EB', true: '#FF8C42' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {quietHoursEnabled && (
            <View style={styles.timeContainer}>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Từ</Text>
                <TouchableOpacity style={styles.timeButton}>
                  <Text style={styles.timeText}>{quietHoursStart}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Đến</Text>
                <TouchableOpacity style={styles.timeButton}>
                  <Text style={styles.timeText}>{quietHoursEnd}</Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Lưu cài đặt</Text>
        </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Poppins_600SemiBold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingVertical: 16,
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FAFAFA',
  },
  timeText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Inter_400Regular',
  },
  saveButton: {
    backgroundColor: '#FF8C42',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

