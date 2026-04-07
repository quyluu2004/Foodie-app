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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const faqItems = [
  {
    id: 1,
    question: 'Làm thế nào để đăng công thức?',
    answer: 'Để đăng công thức, bạn cần:\n1. Nhấn vào nút "+" ở thanh điều hướng dưới cùng\n2. Chọn "Tạo công thức"\n3. Điền đầy đủ thông tin: tên món, nguyên liệu, các bước nấu\n4. Thêm ảnh món ăn\n5. Chọn danh mục phù hợp\n6. Nhấn "Đăng" để gửi công thức\n\nCông thức của bạn sẽ được admin duyệt trước khi hiển thị công khai.',
  },
  {
    id: 2,
    question: 'Cách lưu công thức yêu thích?',
    answer: 'Để lưu công thức:\n1. Mở công thức bạn muốn lưu\n2. Nhấn vào biểu tượng bookmark (dấu trang) ở góc trên bên phải\n3. Công thức đã lưu sẽ xuất hiện trong mục "Lưu trữ" > "Lưu công thức" trong hồ sơ của bạn\n\nBạn có thể xem lại các công thức đã lưu bất cứ lúc nào.',
  },
  {
    id: 3,
    question: 'Làm sao để thay đổi thông tin cá nhân?',
    answer: 'Để thay đổi thông tin cá nhân:\n1. Vào mục "Hồ sơ" (biểu tượng người ở thanh điều hướng)\n2. Nhấn vào biểu tượng chỉnh sửa ở góc trên\n3. Cập nhật thông tin bạn muốn thay đổi\n4. Nhấn "Lưu" để hoàn tất\n\nBạn có thể thay đổi: tên, ảnh đại diện, giới thiệu, và các liên kết xã hội.',
  },
  {
    id: 4,
    question: 'Xử lý sự cố đăng nhập như thế nào?',
    answer: 'Nếu gặp vấn đề khi đăng nhập:\n1. Kiểm tra kết nối internet của bạn\n2. Đảm bảo email và mật khẩu đúng\n3. Thử đăng nhập lại sau vài phút\n4. Nếu quên mật khẩu, nhấn "Quên mật khẩu" ở màn hình đăng nhập\n5. Nếu vẫn không được, liên hệ với admin qua mục "Liên hệ với admin" trong cài đặt',
  },
  {
    id: 5,
    question: 'Làm thế nào để báo cáo nội dung không phù hợp?',
    answer: 'Để báo cáo nội dung không phù hợp:\n1. Mở công thức hoặc bài đăng bạn muốn báo cáo\n2. Nhấn vào biểu tượng cờ (flag) ở góc trên\n3. Chọn lý do báo cáo\n4. Thêm mô tả chi tiết (nếu cần)\n5. Nhấn "Gửi báo cáo"\n\nBáo cáo của bạn sẽ được admin xem xét và xử lý trong thời gian sớm nhất.',
  },
  {
    id: 6,
    question: 'Cách xóa tài khoản?',
    answer: 'Để xóa tài khoản:\n1. Vào "Cài đặt" > "Thông tin tài khoản"\n2. Cuộn xuống và nhấn "Xóa tài khoản"\n3. Xác nhận lại quyết định của bạn\n\nLưu ý: Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.',
  },
];

const guideItems = [
  {
    id: 1,
    title: 'Hướng dẫn tạo công thức',
    icon: 'restaurant-outline',
    description: 'Tìm hiểu cách tạo và chia sẻ công thức nấu ăn của bạn',
  },
  {
    id: 2,
    title: 'Quản lý công thức đã lưu',
    icon: 'bookmark-outline',
    description: 'Cách lưu, xem và quản lý các công thức yêu thích',
  },
  {
    id: 3,
    title: 'Tương tác với cộng đồng',
    icon: 'people-outline',
    description: 'Cách bình luận, thích và chia sẻ với cộng đồng Foodie',
  },
  {
    id: 4,
    title: 'Cài đặt thông báo',
    icon: 'notifications-outline',
    description: 'Tùy chỉnh thông báo để không bỏ lỡ hoạt động quan trọng',
  },
];

export default function HelpSupportScreen() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleContactSupport = async () => {
    try {
      // Lấy hoặc tạo conversation với admin
      const response = await chatAPI.getOrCreateAdminConversation();
      const adminData = response.data?.data;
      const admin = response.data?.admin;
      
      if (admin && admin._id) {
        // Navigate đến chat screen với admin
        router.push({
          pathname: '/chat',
          params: {
            userId: admin._id,
            userName: admin.name || 'Admin',
          },
        });
      } else {
        // Fallback: nếu không lấy được admin, vẫn navigate với userId từ conversation
        const adminId = adminData?.participants?.find((p: any) => p.role === 'admin')?._id;
        if (adminId) {
          router.push({
            pathname: '/chat',
            params: {
              userId: adminId,
              userName: 'Admin',
            },
          });
        } else {
          Alert.alert('Lỗi', 'Không thể kết nối với admin. Vui lòng thử lại sau.');
        }
      }
    } catch (error: any) {
      console.error('Error connecting to admin:', error);
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Không thể kết nối với admin. Vui lòng thử lại sau.'
      );
    }
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@foodie.app?subject=Yêu cầu hỗ trợ').catch(() => {
      // Fallback nếu không thể mở email
    });
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
        <Text style={styles.headerTitle}>Trợ giúp & Hỗ trợ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Guides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hướng dẫn nhanh</Text>
          <View style={styles.guidesGrid}>
            {guideItems.map((guide) => (
              <TouchableOpacity
                key={guide.id}
                style={styles.guideCard}
                onPress={() => {
                  // TODO: Mở màn hình hướng dẫn chi tiết
                }}
              >
                <View style={styles.guideIcon}>
                  <Ionicons name={guide.icon as any} size={32} color="#FF8C42" />
                </View>
                <Text style={styles.guideTitle}>{guide.title}</Text>
                <Text style={styles.guideDescription}>{guide.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
          {faqItems.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqItem}
              onPress={() => toggleFaq(faq.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6B7280"
                />
              </View>
              {expandedFaq === faq.id && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liên hệ hỗ trợ</Text>
          
          <TouchableOpacity style={styles.contactCard} onPress={handleContactSupport}>
            <View style={styles.contactIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FF8C42" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Liên hệ với admin</Text>
              <Text style={styles.contactDescription}>
                Gửi tin nhắn trực tiếp cho đội ngũ hỗ trợ
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={24} color="#FF8C42" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Email hỗ trợ</Text>
              <Text style={styles.contactDescription}>support@foodie.app</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <View style={styles.contactInfo}>
            <Text style={styles.contactInfoTitle}>Thông tin liên hệ</Text>
            <View style={styles.contactInfoItem}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.contactInfoText}>Hotline: 1900-xxxx</Text>
            </View>
            <View style={styles.contactInfoItem}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.contactInfoText}>Giờ làm việc: 8:00 - 18:00 (T2-CN)</Text>
            </View>
          </View>
        </View>
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 16,
  },
  guidesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  guideCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guideIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF8C4220',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  guideDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter_500Medium',
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  contactCard: {
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
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF8C4220',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  contactInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  contactInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  contactInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  contactInfoText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
});

