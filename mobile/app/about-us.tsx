import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const teamMembers = [
  {
    id: 1,
    name: 'Đội ngũ Foodie',
    role: 'Phát triển & Vận hành',
    description: 'Đội ngũ tận tâm với sứ mệnh mang ẩm thực Việt Nam đến gần hơn với mọi người',
  },
];

const features = [
  {
    id: 1,
    icon: 'restaurant-outline',
    title: 'Khám phá công thức',
    description: 'Hàng nghìn công thức nấu ăn đa dạng từ khắp mọi miền đất nước',
  },
  {
    id: 2,
    icon: 'people-outline',
    title: 'Cộng đồng nấu ăn',
    description: 'Kết nối với những người yêu thích nấu ăn, chia sẻ kinh nghiệm và mẹo vặt',
  },
  {
    id: 3,
    icon: 'bookmark-outline',
    title: 'Lưu trữ yêu thích',
    description: 'Lưu lại những công thức yêu thích để xem lại bất cứ lúc nào',
  },
  {
    id: 4,
    icon: 'star-outline',
    title: 'Đánh giá & Nhận xét',
    description: 'Chia sẻ đánh giá và nhận xét để giúp cộng đồng tìm được công thức phù hợp',
  },
];

const stats = [
  { label: 'Công thức', value: '1000+', icon: 'restaurant' },
  { label: 'Người dùng', value: '10K+', icon: 'people' },
  { label: 'Đánh giá', value: '5K+', icon: 'star' },
  { label: 'Bài đăng', value: '500+', icon: 'images' },
];

export default function AboutUsScreen() {
  const handleContactAdmin = async () => {
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

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // Handle error
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
        <Text style={styles.headerTitle}>Về chúng tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo & Title */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🍜</Text>
            </View>
          </View>
          <Text style={styles.appName}>Foodie</Text>
          <Text style={styles.appTagline}>Khám phá ẩm thực Việt Nam</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={32} color="#FF8C42" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>
          <Text style={styles.sectionText}>
            Foodie là ứng dụng nấu ăn được thiết kế để giúp bạn khám phá và chia sẻ những công thức nấu ăn tuyệt vời của Việt Nam. 
            Chúng tôi tin rằng ẩm thực là cầu nối kết nối mọi người, và mỗi món ăn đều có một câu chuyện riêng.
          </Text>
          <Text style={styles.sectionText}>
            Với Foodie, bạn có thể tìm kiếm hàng nghìn công thức từ khắp mọi miền đất nước, lưu lại những món yêu thích, 
            chia sẻ kinh nghiệm nấu ăn với cộng đồng, và khám phá những món ăn mới mỗi ngày.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tính năng nổi bật</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature) => (
              <View key={feature.id} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={32} color="#FF8C42" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mission & Vision */}
        <View style={styles.section}>
          <View style={styles.missionCard}>
            <Ionicons name="flag-outline" size={32} color="#FF8C42" />
            <Text style={styles.missionTitle}>Sứ mệnh</Text>
            <Text style={styles.missionText}>
              Bảo tồn và phát huy giá trị ẩm thực Việt Nam, tạo nên một cộng đồng yêu thích nấu ăn 
              nơi mọi người có thể chia sẻ, học hỏi và thưởng thức những món ăn tuyệt vời.
            </Text>
          </View>

          <View style={styles.missionCard}>
            <Ionicons name="eye-outline" size={32} color="#FF8C42" />
            <Text style={styles.missionTitle}>Tầm nhìn</Text>
            <Text style={styles.missionText}>
              Trở thành nền tảng hàng đầu về ẩm thực Việt Nam, nơi mọi người có thể dễ dàng tìm kiếm, 
              học hỏi và chia sẻ những công thức nấu ăn truyền thống và hiện đại.
            </Text>
          </View>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đội ngũ</Text>
          {teamMembers.map((member) => (
            <View key={member.id} style={styles.teamCard}>
              <View style={styles.teamAvatar}>
                <Ionicons name="people" size={40} color="#FF8C42" />
              </View>
              <Text style={styles.teamName}>{member.name}</Text>
              <Text style={styles.teamRole}>{member.role}</Text>
              <Text style={styles.teamDescription}>{member.description}</Text>
            </View>
          ))}
        </View>

        {/* Contact & Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liên hệ & Liên kết</Text>
          
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => handleOpenLink('mailto:support@foodie.app')}
          >
            <Ionicons name="mail-outline" size={24} color="#FF8C42" />
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Email hỗ trợ</Text>
              <Text style={styles.linkSubtitle}>support@foodie.app</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => router.push('/help-support')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#FF8C42" />
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Trợ giúp & Hỗ trợ</Text>
              <Text style={styles.linkSubtitle}>Câu hỏi thường gặp và hướng dẫn</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={handleContactAdmin}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FF8C42" />
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Liên hệ với admin</Text>
              <Text style={styles.linkSubtitle}>Gửi tin nhắn trực tiếp</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Foodie v1.0.0</Text>
          <Text style={styles.copyrightText}>
            © 2024 Foodie. Tất cả quyền được bảo lưu.
          </Text>
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
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FF8C42',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 50,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
    opacity: 0.9,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginTop: -20,
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Poppins_700Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF8C4220',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  missionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 12,
    marginBottom: 8,
  },
  missionText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  teamCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  teamAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF8C4220',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  teamRole: {
    fontSize: 14,
    color: '#FF8C42',
    fontFamily: 'Inter_500Medium',
    marginBottom: 12,
  },
  teamDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  linkCard: {
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
  linkContent: {
    flex: 1,
    marginLeft: 16,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  linkSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },
});

