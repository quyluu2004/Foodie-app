import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { messageAPI, userAPI, authAPI, creatorRequestAPI, premiumAPI } from '@/contexts/api';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const menuItems = [
  {
    id: 1,
    title: 'Chỉnh sửa hồ sơ',
    icon: 'person.fill',
    color: '#FF8C42',
    description: 'Cập nhật thông tin cá nhân, ảnh đại diện và liên kết xã hội của bạn',
  },
  {
    id: 7,
    title: 'Đăng ký Creator',
    icon: 'star.fill',
    color: '#FF8C42',
    description: 'Đăng ký để trở thành Creator và chia sẻ công thức nấu ăn của bạn',
    isCreatorOnly: false,
  },
  {
    id: 12,
    title: 'Trang Creator',
    icon: 'chart.bar.fill',
    color: '#FF8C42',
    description: 'Xem thống kê và phân tích về công thức nấu ăn của bạn',
    isCreatorOnly: true,
  },
  {
    id: 2,
    title: 'Cài đặt thông báo',
    icon: 'bell.fill',
    color: '#FF8C42',
    description: 'Quản lý các thông báo về công thức mới, bình luận, lượt thích và hoạt động khác',
  },
  {
    id: 3,
    title: 'Lịch sử nấu ăn',
    icon: 'clock.fill',
    color: '#FF8C42',
    description: 'Xem lại các công thức bạn đã nấu, đánh giá và ghi chú cá nhân',
  },
  {
    id: 4,
    title: 'Đánh giá ứng dụng',
    icon: 'star.fill',
    color: '#FF8C42',
    description: 'Chia sẻ ý kiến của bạn về ứng dụng Foodie trên App Store hoặc Google Play',
  },
  {
    id: 5,
    title: 'Trợ giúp & Hỗ trợ',
    icon: 'questionmark.circle.fill',
    color: '#FF8C42',
    description: 'Tìm câu trả lời cho các câu hỏi thường gặp và hướng dẫn sử dụng ứng dụng',
  },
  {
    id: 8,
    title: 'Liên hệ với admin',
    icon: 'message.fill',
    color: '#FF8C42',
    description: 'Gửi tin nhắn trực tiếp cho đội ngũ hỗ trợ về vấn đề kỹ thuật hoặc góp ý',
  },
  {
    id: 11,
    title: 'Tin nhắn của tôi',
    icon: 'envelope.fill',
    color: '#FF8C42',
    description: 'Xem và quản lý tất cả tin nhắn bạn đã gửi và nhận được từ admin',
  },
  {
    id: 13,
    title: 'Lịch sử giao dịch',
    icon: 'receipt.fill',
    color: '#FF8C42',
    description: 'Xem lịch sử nạp xu, mua công thức premium và các giao dịch khác',
  },
  {
    id: 9,
    title: 'Đổi mật khẩu',
    icon: 'lock.fill',
    color: '#FF8C42',
    description: 'Thay đổi mật khẩu tài khoản để bảo mật thông tin cá nhân của bạn',
  },
  {
    id: 6,
    title: 'Về chúng tôi',
    icon: 'info.circle.fill',
    color: '#FF8C42',
    description: 'Tìm hiểu về Foodie, đội ngũ phát triển và các báo cáo về ứng dụng',
  },
];

export default function SettingsScreen() {
  const { logout, user, refreshUser, updateUser } = useAuth();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showCreatorRequestModal, setShowCreatorRequestModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Update isPrivate when user changes
  useEffect(() => {
    setIsPrivate(user?.isPrivate || false);
  }, [user?.isPrivate]);

  // Initialize creator request data when user changes
  useEffect(() => {
    if (user) {
      setCreatorRequestData({
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        experience: '',
        specialties: [],
        socialLinks: {
          facebook: user.socialLinks?.facebook || '',
          instagram: user.socialLinks?.instagram || '',
          youtube: user.socialLinks?.youtube || '',
          website: user.socialLinks?.website || '',
        },
        motivation: '',
      });
    }
  }, [user]);

  // Contact Admin states
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Change Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Creator Request states
  const [creatorRequestData, setCreatorRequestData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    experience: '',
    specialties: [] as string[],
    socialLinks: {
      facebook: user?.socialLinks?.facebook || '',
      instagram: user?.socialLinks?.instagram || '',
      youtube: user?.socialLinks?.youtube || '',
      website: user?.socialLinks?.website || '',
    },
    motivation: '',
  });
  const [specialtyInput, setSpecialtyInput] = useState('');

  const handleMenuPress = (itemId: number) => {
    switch (itemId) {
      case 1:
        router.push('/edit-profile' as any);
        break;
      case 2:
        router.push('/notifications-settings' as any);
        break;
      case 3:
        router.push('/cooking-history' as any);
        break;
      case 4:
        router.push('/app-rating' as any);
        break;
      case 5:
        router.push('/help-support' as any);
        break;
      case 6:
        router.push('/about-us' as any);
        break;
      case 8:
        setShowContactModal(true);
        break;
      case 7:
        // Kiểm tra nếu đã là creator
        if (user?.role === 'creator' || user?.role === 'admin') {
          Alert.alert('Thông báo', 'Bạn đã là Creator rồi!');
          return;
        }
        // Kiểm tra xem có request pending không
        checkExistingRequest();
        break;
      case 12:
        router.push('/creator-dashboard' as any);
        break;
      case 9:
        setShowChangePasswordModal(true);
        break;
      case 11:
        router.push('/my-messages' as any);
        break;
      case 13:
        router.push('/transaction-history' as any);
        break;
      default:
        break;
    }
  };

  const handleSendContact = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tiêu đề và nội dung tin nhắn');
      return;
    }

    try {
      setLoading(true);
      await messageAPI.sendMessage(contactSubject.trim(), contactMessage.trim(), 'general');
      Alert.alert('Thành công', 'Tin nhắn đã được gửi cho admin. Chúng tôi sẽ phản hồi sớm nhất có thể.');
      setContactSubject('');
      setContactMessage('');
      setShowContactModal(false);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    try {
      setLoading(true);
      await userAPI.changePassword(currentPassword, newPassword);
      Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePasswordModal(false);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpecialty = () => {
    if (specialtyInput.trim() && !creatorRequestData.specialties.includes(specialtyInput.trim())) {
      setCreatorRequestData({
        ...creatorRequestData,
        specialties: [...creatorRequestData.specialties, specialtyInput.trim()],
      });
      setSpecialtyInput('');
    }
  };

  const handleRemoveSpecialty = (index: number) => {
    setCreatorRequestData({
      ...creatorRequestData,
      specialties: creatorRequestData.specialties.filter((_, i) => i !== index),
    });
  };

  const checkExistingRequest = async () => {
    try {
      const response = await creatorRequestAPI.getMyRequest();
      const request = response.data?.request;
      
      // Kiểm tra nếu có request pending
      if (request && request.status === 'pending') {
        Alert.alert(
          'Thông báo',
          'Bạn đã có yêu cầu đang chờ xử lý. Vui lòng đợi admin xem xét.'
        );
        return;
      }
      
      // Kiểm tra nếu có request đã được duyệt
      if (request && request.status === 'approved') {
        Alert.alert('Thông báo', 'Bạn đã là Creator rồi!');
        return;
      }
      
      // Không có request hoặc đã bị từ chối → mở modal để tạo request mới
      setShowCreatorRequestModal(true);
    } catch (error: any) {
      // Nếu có lỗi, vẫn mở modal (user có thể thử gửi request)
      console.log('Info: No existing creator request found');
      setShowCreatorRequestModal(true);
    }
  };

  const handleSubmitCreatorRequest = async () => {
    if (!creatorRequestData.fullName || !creatorRequestData.email || !creatorRequestData.motivation) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Email, Lý do)');
      return;
    }

    if (creatorRequestData.motivation.trim().length < 20) {
      Alert.alert('Lỗi', 'Lý do muốn trở thành creator phải có ít nhất 20 ký tự');
      return;
    }

    try {
      setLoading(true);
      await creatorRequestAPI.createRequest(creatorRequestData);
      Alert.alert(
        'Thành công',
        'Yêu cầu đăng ký creator đã được gửi thành công. Admin sẽ xem xét và phản hồi sớm nhất có thể.'
      );
      setShowCreatorRequestModal(false);
      // Reset form
      setCreatorRequestData({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        experience: '',
        specialties: [],
        socialLinks: {
          facebook: user?.socialLinks?.facebook || '',
          instagram: user?.socialLinks?.instagram || '',
          youtube: user?.socialLinks?.youtube || '',
          website: user?.socialLinks?.website || '',
        },
        motivation: '',
      });
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
      router.replace('/auth');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        await doLogout();
      }
    } else {
      Alert.alert(
        'Đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng xuất', style: 'destructive', onPress: doLogout },
        ]
      );
    }
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
        <ThemedText type="title" style={styles.headerTitle}>
          Cài đặt
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {/* Privacy Toggle - First Item */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            disabled={true}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FF8C4220' }]}>
              <Ionicons name="lock-closed" size={24} color="#FF8C42" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Tài khoản riêng tư</Text>
              <Text style={styles.menuDescription} numberOfLines={1}>
                Chỉ người theo dõi mới có thể xem bài đăng và hoạt động của bạn
              </Text>
            </View>
            {savingPrivacy ? (
              <ActivityIndicator size="small" color="#FF8C42" />
            ) : (
              <Switch
                value={isPrivate}
                onValueChange={async (value) => {
                  try {
                    setSavingPrivacy(true);
                    setIsPrivate(value);
                    await authAPI.updateProfile({ isPrivate: value });
                    if (updateUser) {
                      updateUser({ ...user, isPrivate: value });
                    }
                  } catch (error: any) {
                    console.error('❌ Error updating privacy:', error);
                    Alert.alert('Lỗi', 'Không thể cập nhật chế độ riêng tư');
                    setIsPrivate(!value); // Revert on error
                  } finally {
                    setSavingPrivacy(false);
                  }
                }}
                trackColor={{ false: '#E0E0E0', true: '#FF8C42' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E0E0E0"
              />
            )}
          </TouchableOpacity>

          {/* Other Menu Items */}
          {menuItems.map((item, index) => {
            // Ẩn "Đăng ký Creator" nếu đã là creator
            if (item.id === 7 && (user?.role === 'creator' || user?.role === 'admin')) {
              return null;
            }
            // Chỉ hiển thị "Trang Creator" nếu là creator
            if (item.isCreatorOnly && user?.role !== 'creator' && user?.role !== 'admin') {
              return null;
            }
            
            return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <IconSymbol name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.menuDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Foodie v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Contact Admin Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Liên hệ với admin</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Tiêu đề *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tiêu đề tin nhắn"
                value={contactSubject}
                onChangeText={setContactSubject}
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Nội dung *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập nội dung tin nhắn"
                value={contactMessage}
                onChangeText={setContactMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={[styles.modalButton, loading && styles.modalButtonDisabled]}
                onPress={handleSendContact}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Gửi tin nhắn</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Mật khẩu hiện tại *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Mật khẩu mới *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Xác nhận mật khẩu mới *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={[styles.modalButton, loading && styles.modalButtonDisabled]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Đổi mật khẩu</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Creator Request Modal */}
      <Modal
        visible={showCreatorRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreatorRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đăng ký Creator</Text>
              <TouchableOpacity onPress={() => setShowCreatorRequestModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
              <Text style={styles.infoText}>
                Điền đầy đủ thông tin để đăng ký trở thành Creator. Admin sẽ xem xét và phản hồi sớm nhất có thể.
              </Text>

              <Text style={styles.label}>Họ và tên *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập họ và tên đầy đủ"
                value={creatorRequestData.fullName}
                onChangeText={(text) => setCreatorRequestData({ ...creatorRequestData, fullName: text })}
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập email"
                value={creatorRequestData.email}
                onChangeText={(text) => setCreatorRequestData({ ...creatorRequestData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số điện thoại (tùy chọn)"
                value={creatorRequestData.phone}
                onChangeText={(text) => setCreatorRequestData({ ...creatorRequestData, phone: text })}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Giới thiệu bản thân</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Giới thiệu ngắn gọn về bản thân (tùy chọn)"
                value={creatorRequestData.bio}
                onChangeText={(text) => setCreatorRequestData({ ...creatorRequestData, bio: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Kinh nghiệm nấu ăn</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Chia sẻ kinh nghiệm nấu ăn của bạn (tùy chọn)"
                value={creatorRequestData.experience}
                onChangeText={(text) => setCreatorRequestData({ ...creatorRequestData, experience: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Chuyên môn</Text>
              <View style={styles.specialtyContainer}>
                <View style={styles.specialtyInputRow}>
                  <TextInput
                    style={[styles.input, styles.specialtyInput]}
                    placeholder="Nhập chuyên môn (ví dụ: Món Việt, Bánh ngọt)"
                    value={specialtyInput}
                    onChangeText={setSpecialtyInput}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddSpecialty}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                {creatorRequestData.specialties.length > 0 && (
                  <View style={styles.specialtyTags}>
                    {creatorRequestData.specialties.map((specialty, index) => (
                      <View key={index} style={styles.specialtyTag}>
                        <Text style={styles.specialtyTagText}>{specialty}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveSpecialty(index)}
                          style={styles.removeSpecialtyButton}
                        >
                          <Ionicons name="close-circle" size={16} color="#FF8C42" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <Text style={styles.label}>Liên kết mạng xã hội (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Facebook URL"
                value={creatorRequestData.socialLinks.facebook}
                onChangeText={(text) =>
                  setCreatorRequestData({
                    ...creatorRequestData,
                    socialLinks: { ...creatorRequestData.socialLinks, facebook: text },
                  })
                }
                keyboardType="url"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Instagram URL"
                value={creatorRequestData.socialLinks.instagram}
                onChangeText={(text) =>
                  setCreatorRequestData({
                    ...creatorRequestData,
                    socialLinks: { ...creatorRequestData.socialLinks, instagram: text },
                  })
                }
                keyboardType="url"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="YouTube URL"
                value={creatorRequestData.socialLinks.youtube}
                onChangeText={(text) =>
                  setCreatorRequestData({
                    ...creatorRequestData,
                    socialLinks: { ...creatorRequestData.socialLinks, youtube: text },
                  })
                }
                keyboardType="url"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Website URL"
                value={creatorRequestData.socialLinks.website}
                onChangeText={(text) =>
                  setCreatorRequestData({
                    ...creatorRequestData,
                    socialLinks: { ...creatorRequestData.socialLinks, website: text },
                  })
                }
                keyboardType="url"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Lý do muốn trở thành Creator *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Giải thích lý do bạn muốn trở thành Creator (tối thiểu 20 ký tự)"
                value={creatorRequestData.motivation}
                onChangeText={(text) => setCreatorRequestData({ ...creatorRequestData, motivation: text })}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={[styles.modalButton, loading && styles.modalButtonDisabled]}
                onPress={handleSubmitCreatorRequest}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Gửi yêu cầu</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  menuTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  logoutContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#FF8C42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Poppins_700Bold',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
  modalButton: {
    backgroundColor: '#FF8C42',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  specialtyContainer: {
    marginBottom: 16,
  },
  specialtyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specialtyInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#FF8C42',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialtyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  specialtyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8C4220',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  specialtyTagText: {
    color: '#FF8C42',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  removeSpecialtyButton: {
    padding: 2,
  },
});

