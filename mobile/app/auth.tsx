import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import { messageAPI, userAPI, authAPI } from '../contexts/api';
import { Ionicons } from '@expo/vector-icons';
import LoadingPizza from '../components/LoadingPizza';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { storage } from '../contexts/storage';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // States for Forgot Password
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordName, setForgotPasswordName] = useState('');
  const [forgotPasswordReason, setForgotPasswordReason] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  // States for Contact Admin
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);

  // States for Admin Messages (Bell icon)
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const { login, register } = useAuth();

  // Google OAuth Configuration
  // Sử dụng https://auth.expo.io (Expo proxy) - mặc dù deprecated nhưng vẫn hoạt động với Expo Go
  // Google Cloud Console chỉ chấp nhận HTTPS URIs cho Web Client ID, không chấp nhận exp://
  // Force sử dụng https://auth.expo.io để tránh redirect_uri_mismatch
  const redirectUri = 'https://auth.expo.io';
  
  // Log redirect URI để debug
  useEffect(() => {
    console.log('═══════════════════════════════════════');
    console.log('🔗 REDIRECT URI ĐƯỢC SỬ DỤNG:');
    console.log('   ', redirectUri);
    console.log('═══════════════════════════════════════');
    console.log('📋 Đảm bảo URI này đã có trong Google Cloud Console');
    console.log('📋 Web Client ID: 788618099954-2hovbh2gdu0tv91mouudhqsaelueud62.apps.googleusercontent.com');
    console.log('📋 iOS Client ID: 788618099954-evo38rgfj57lhq0btu5qpr2suls8qqob.apps.googleusercontent.com');
    console.log('📋 Nếu vẫn lỗi, đợi 5-10 phút để Google cập nhật');
    console.log('═══════════════════════════════════════');
  }, []);
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '788618099954-2hovbh2gdu0tv91mouudhqsaelueud62.apps.googleusercontent.com',
    androidClientId: '788618099954-hsmqvjmg229dgos35h5u6m4ulq28akb4.apps.googleusercontent.com',
    iosClientId: '788618099954-evo38rgfj57lhq0btu5qpr2suls8qqob.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    redirectUri: redirectUri, // Force sử dụng https://auth.expo.io
  });

  // Xử lý response từ Google OAuth
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleAuthSuccess(response);
    } else if (response?.type === 'error') {
      Alert.alert('Lỗi', 'Không thể đăng nhập bằng Google');
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (response: any) => {
    try {
      setGoogleLoading(true);
      
      // expo-auth-session trả về idToken trong response.params.id_token
      const idToken = response.params?.id_token;
      
      if (idToken) {
        // Gửi idToken đến backend
        const res = await authAPI.googleAuth(idToken);
        const { user, token } = res.data;

        // Lưu token và user data
        await storage.saveToken(token);
        await storage.saveUser(user);

        // Đăng nhập thành công
        Alert.alert('Thành công', 'Đăng ký/Đăng nhập bằng Google thành công!');
        router.replace('/(tabs)');
      } else {
        throw new Error('Không thể lấy idToken từ Google');
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đăng ký bằng Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      
      if (!request) {
        Alert.alert('Lỗi', 'Google OAuth chưa sẵn sàng. Vui lòng thử lại sau.');
        setGoogleLoading(false);
        return;
      }
      
      await promptAsync();
    } catch (error) {
      console.error('Google sign in error:', error);
      Alert.alert('Lỗi', 'Không thể mở Google đăng nhập. Vui lòng thử lại.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (!isLogin && !name) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên của bạn');
      return;
    }

    try {
      setLoading(true);
      
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Lỗi', error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email đã đăng ký');
      return;
    }

    try {
      setForgotPasswordLoading(true);
      await userAPI.requestPasswordReset(
        forgotPasswordEmail.trim(),
        forgotPasswordReason.trim() || undefined,
        forgotPasswordName.trim() || undefined
      );
      Alert.alert(
        'Thành công',
        'Yêu cầu đặt lại mật khẩu đã được gửi cho admin. Vui lòng kiểm tra email hoặc liên hệ với admin để nhận mật khẩu mới.'
      );
      setForgotPasswordEmail('');
      setForgotPasswordName('');
      setForgotPasswordReason('');
      setShowForgotPasswordModal(false);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleContactAdmin = async () => {
    if (!contactEmail.trim() || !contactName.trim() || !contactSubject.trim() || !contactMessage.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setContactLoading(true);
      await messageAPI.sendMessage(
        contactSubject.trim(),
        contactMessage.trim(),
        'general',
        contactEmail.trim(),
        contactName.trim()
      );
      Alert.alert('Thành công', 'Tin nhắn đã được gửi cho admin. Chúng tôi sẽ phản hồi sớm nhất có thể.');
      setContactEmail('');
      setContactName('');
      setContactSubject('');
      setContactMessage('');
      setShowContactModal(false);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setContactLoading(false);
    }
  };

  // Load messages by email (for bell icon)
  const loadMessagesByEmail = async (userEmail: string) => {
    if (!userEmail.trim()) return;

    try {
      setLoadingMessages(true);
      const response = await messageAPI.getMessagesByEmail(userEmail.trim());
      const messages = response.data?.data || [];
      // Chỉ lấy tin nhắn đã có phản hồi từ admin
      const repliedMessages = messages.filter((msg: any) => msg.adminReply && msg.adminReply.trim());
      setAdminMessages(repliedMessages);
      setUnreadCount(repliedMessages.length);
    } catch (error: any) {
      // Không hiển thị lỗi nếu không có tin nhắn
      setAdminMessages([]);
      setUnreadCount(0);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Check for new messages when email changes
  useEffect(() => {
    if (email.trim()) {
      loadMessagesByEmail(email.trim());
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        loadMessagesByEmail(email.trim());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [email]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerSpacer} />
            <TouchableOpacity
              style={styles.bellButtonHeader}
              onPress={async () => {
                if (email.trim()) {
                  try {
                    const response = await messageAPI.getMessagesByEmail(email.trim());
                    const messages = response.data?.data || [];
                    const repliedMessages = messages.filter((msg: any) => msg.adminReply && msg.adminReply.trim());
                    if (repliedMessages.length > 0) {
                      setAdminMessages(repliedMessages);
                      setUnreadCount(repliedMessages.length);
                      setShowMessagesModal(true);
                    } else {
                      Alert.alert('Thông báo', 'Chưa có thông báo nào từ admin cho email này.');
                    }
                  } catch (error: any) {
                    Alert.alert('Thông báo', 'Chưa có thông báo nào từ admin cho email này.');
                  }
                } else {
                  Alert.alert('Thông báo', 'Vui lòng nhập email trước để xem thông báo từ admin');
                }
              }}
            >
              <Ionicons name="notifications-outline" size={24} color="#FF8C42" />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Foodie</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Chào mừng trở lại!' : 'Tham gia cộng đồng của chúng tôi'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tên</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nhập tên của bạn"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập email của bạn"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Nhập mật khẩu của bạn"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>


          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Đang tải...' : (isLogin ? 'Đăng nhập' : 'Đăng ký bằng Email')}
            </Text>
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => setShowForgotPasswordModal(true)}
            >
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              if (isLogin) {
                // Chuyển đến màn hình đăng ký đầy đủ
                router.push('/register');
              } else {
                setIsLogin(true);
              }
            }}
          >
            <Text style={styles.switchText}>
              {isLogin 
                ? "Chưa có tài khoản? Đăng ký" 
                : "Đã có tài khoản? Đăng nhập"
              }
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            style={[styles.googleButton, (loading || googleLoading) && styles.googleButtonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <Ionicons name="logo-google" size={20} color="#4285F4" />
            )}
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Đang xử lý...' : 'Đăng nhập bằng Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactAdminButton}
            onPress={() => setShowContactModal(true)}
          >
            <Ionicons name="mail-outline" size={18} color="#FF8C42" />
            <Text style={styles.contactAdminText}>Liên hệ với admin</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForgotPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quên mật khẩu</Text>
              <TouchableOpacity onPress={() => setShowForgotPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Nhập email đã đăng ký tài khoản của bạn. Admin sẽ xác nhận và gửi mật khẩu mới cho bạn.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email đã đăng ký *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email của bạn"
                  value={forgotPasswordEmail}
                  onChangeText={setForgotPasswordEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tên của bạn (tùy chọn)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên của bạn"
                  value={forgotPasswordName}
                  onChangeText={setForgotPasswordName}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Lý do (tùy chọn)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Nhập lý do yêu cầu đặt lại mật khẩu"
                  value={forgotPasswordReason}
                  onChangeText={setForgotPasswordReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalButton, forgotPasswordLoading && styles.modalButtonDisabled]}
                onPress={handleForgotPassword}
                disabled={forgotPasswordLoading}
              >
                {forgotPasswordLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Gửi yêu cầu</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
              <Text style={styles.modalDescription}>
                Gửi tin nhắn cho admin để được hỗ trợ. Vui lòng điền thông tin của bạn.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email của bạn *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email của bạn"
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tên của bạn *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên của bạn"
                  value={contactName}
                  onChangeText={setContactName}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tiêu đề *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tiêu đề tin nhắn"
                  value={contactSubject}
                  onChangeText={setContactSubject}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
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
              </View>

              <TouchableOpacity
                style={[styles.modalButton, contactLoading && styles.modalButtonDisabled]}
                onPress={handleContactAdmin}
                disabled={contactLoading}
              >
                {contactLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Gửi tin nhắn</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Admin Messages Modal */}
      <Modal
        visible={showMessagesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMessagesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông báo từ admin</Text>
              <TouchableOpacity onPress={() => setShowMessagesModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {loadingMessages ? (
                <View style={styles.emptyMessagesContainer}>
                  <LoadingPizza size={100} color="#FF8C42" showText={true} />
                </View>
              ) : adminMessages.length === 0 ? (
                <View style={styles.emptyMessagesContainer}>
                  <Ionicons name="notifications-outline" size={48} color="#CCCCCC" />
                  <Text style={styles.emptyMessagesText}>Chưa có thông báo nào từ admin</Text>
                </View>
              ) : (
                <View style={styles.messagesList}>
                  {adminMessages.map((message: any) => (
                    <View key={message._id} style={styles.messageCard}>
                      <View style={styles.messageCardHeader}>
                        <Text style={styles.messageCardSubject}>{message.subject}</Text>
                        <Text style={styles.messageCardDate}>
                          {new Date(message.createdAt).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                      <Text style={styles.messageCardContent}>{message.message}</Text>
                      {message.adminReply && (
                        <View style={styles.adminReplyBox}>
                          <View style={styles.adminReplyHeader}>
                            <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                            <Text style={styles.adminReplyLabel}>Phản hồi từ admin:</Text>
                            <Text style={styles.adminReplyDate}>
                              {new Date(message.repliedAt).toLocaleDateString('vi-VN')}
                            </Text>
                          </View>
                          <Text style={styles.adminReplyText}>{message.adminReply}</Text>
                          {message.type === 'password_reset' && (
                            <View style={styles.passwordResetAlert}>
                              <Ionicons name="key" size={20} color="#F44336" />
                              <Text style={styles.passwordResetText}>
                                Mật khẩu mới đã được gửi trong phản hồi ở trên
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 24,
  },
  headerSpacer: {
    flex: 1,
  },
  bellButtonHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F5',
    borderWidth: 1.5,
    borderColor: '#FF8C42',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#FF8C42',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#FF8C42',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#FF8C42',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    textDecorationLine: 'underline',
  },
  registerEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C42',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    gap: 8,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  registerEmailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  forgotPasswordButton: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    color: '#FF8C42',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  contactAdminButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#FF8C42',
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  contactAdminText: {
    color: '#FF8C42',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 10,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
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
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
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
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF8C42',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  emptyMessagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyMessagesText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  messagesList: {
    gap: 12,
  },
  messageCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageCardSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  messageCardDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageCardContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  adminReplyBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#34D399',
    marginTop: 8,
  },
  adminReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  adminReplyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  adminReplyDate: {
    fontSize: 11,
    color: '#047857',
    marginLeft: 'auto',
  },
  adminReplyText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  passwordResetAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    gap: 8,
  },
  passwordResetText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
    flex: 1,
  },
});

