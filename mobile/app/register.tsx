import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { authAPI } from '../contexts/api';
import { storage } from '../contexts/storage';

WebBrowser.maybeCompleteAuthSession();

/** Chỉ giữ số, tối đa 8 chữ số (DDMMYYYY), tự chèn / → DD/MM/YYYY */
function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

/** Parse DD/MM/YYYY → Date hợp lệ hoặc null */
function parseDDMMYYYY(s: string): Date | null {
  const m = s.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (year < 1900 || year > 2100) return null;
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const d = new Date(year, mm - 1, dd);
  if (d.getFullYear() !== year || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

function birthDateStringToISO(display: string): string | null {
  const d = parseDDMMYYYY(display);
  return d ? d.toISOString() : null;
}

// Validation schema
const validationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .required('Vui lòng nhập họ và tên')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(80, 'Họ và tên không quá 80 ký tự')
    .matches(
      /^[\p{L}\s'.-]+$/u,
      'Họ và tên chỉ gồm chữ cái, khoảng trắng và dấu . - \''
    ),
  email: Yup.string()
    .trim()
    .email('Email không hợp lệ')
    .max(254, 'Email quá dài')
    .required('Vui lòng nhập email'),
  password: Yup.string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .matches(
      /^(?=.*\p{L})(?=.*\d).{8,}$/u,
      'Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số'
    )
    .required('Vui lòng nhập mật khẩu'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
  phone: Yup.string()
    .trim()
    .matches(/^0\d{9,10}$/, 'Số điện thoại phải bắt đầu bằng 0, gồm 10 hoặc 11 số')
    .required('Vui lòng nhập số điện thoại'),
  bio: Yup.string().trim().max(200, 'Giới thiệu không được quá 200 ký tự'),
  gender: Yup.string()
    .oneOf(['Nam', 'Nữ', 'Khác'], 'Vui lòng chọn giới tính')
    .required('Vui lòng chọn giới tính'),
  birthDate: Yup.string()
    .trim()
    .test('format-or-empty', 'Nhập đủ ngày theo DD/MM/YYYY (ví dụ 15/08/2004)', (v) => {
      if (!v || v.length === 0) return true;
      return /^\d{2}\/\d{2}\/\d{4}$/.test(v);
    })
    .test('valid-date', 'Ngày sinh không hợp lệ', (v) => {
      if (!v || v.length === 0) return true;
      return parseDDMMYYYY(v) !== null;
    })
    .test('not-future', 'Ngày sinh không được trong tương lai', (v) => {
      if (!v || v.length === 0) return true;
      const d = parseDDMMYYYY(v);
      if (!d) return false;
      return d <= new Date();
    })
    .test('min-age', 'Bạn phải từ 5 tuổi trở lên', (v) => {
      if (!v || v.length === 0) return true;
      const d = parseDDMMYYYY(v);
      if (!d) return false;
      const min = new Date();
      min.setFullYear(min.getFullYear() - 5);
      return d <= min;
    })
    .test('max-age', 'Năm sinh không hợp lý', (v) => {
      if (!v || v.length === 0) return true;
      const d = parseDDMMYYYY(v);
      if (!d) return false;
      const max = new Date();
      max.setFullYear(max.getFullYear() - 120);
      return d >= max;
    }),
});

interface FormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  bio: string;
  gender: string;
  /** Chuỗi hiển thị DD/MM/YYYY, có thể để trống */
  birthDate: string;
}

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google OAuth Configuration
  // Sử dụng https://auth.expo.io (Expo proxy) - mặc dù deprecated nhưng vẫn hoạt động với Expo Go
  // Google Cloud Console chỉ chấp nhận HTTPS URIs cho Web Client ID
  const redirectUri = 'https://auth.expo.io';
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '788618099954-2hovbh2gdu0tv91mouudhqsaelueud62.apps.googleusercontent.com',
    androidClientId: '788618099954-hsmqvjmg229dgos35h5u6m4ulq28akb4.apps.googleusercontent.com',
    iosClientId: '788618099954-evo38rgfj57lhq0btu5qpr2suls8qqob.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    redirectUri: redirectUri,
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

        // Đăng ký thành công
        Alert.alert('Thành công', 'Đăng ký bằng Google thành công!');
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

  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const formOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    logoOpacity.value = withTiming(1, { duration: 800 });

    setTimeout(() => {
      formTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
      formOpacity.value = withTiming(1, { duration: 600 });
    }, 300);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
      opacity: logoOpacity.value,
    };
  });

  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: formTranslateY.value }],
      opacity: formOpacity.value,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const initialValues: FormValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: '',
    gender: '',
    birthDate: '',
  };

  const handleSubmit = (values: FormValues) => {
    buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
      buttonScale.value = withSpring(1);
    });

    // Chuyển sang màn hình chọn avatar
    router.push({
      pathname: '/avatar-picker',
      params: {
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        bio: values.bio,
        gender: values.gender,
        birthDate: values.birthDate.trim()
          ? birthDateStringToISO(values.birthDate.trim()) || ''
          : '',
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#E53E3E" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View style={[styles.header, logoAnimatedStyle]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Ionicons name="restaurant" size={50} color="white" />
          </View>
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.subtitle}>Tạo tài khoản để bắt đầu</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue,
              values,
              errors,
              touched,
              isSubmitting,
            }) => (
              <>
                {/* Name */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Họ và tên *</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.name && touched.name && styles.inputError,
                    ]}
                  >
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Nhập họ và tên"
                      placeholderTextColor="#999"
                      value={values.name}
                      onChangeText={handleChange('name')}
                      onBlur={handleBlur('name')}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.name && touched.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email *</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.email && touched.email && styles.inputError,
                    ]}
                  >
                    <Ionicons name="mail-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Nhập email"
                      placeholderTextColor="#999"
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.email && touched.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                {/* Phone */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Số điện thoại *</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.phone && touched.phone && styles.inputError,
                    ]}
                  >
                    <Ionicons name="call-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Nhập số điện thoại"
                      placeholderTextColor="#999"
                      value={values.phone}
                      onChangeText={(t) =>
                        setFieldValue('phone', t.replace(/\D/g, '').slice(0, 11))
                      }
                      onBlur={handleBlur('phone')}
                      keyboardType="phone-pad"
                      maxLength={11}
                    />
                  </View>
                  {errors.phone && touched.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}
                </View>

                {/* Password */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Mật khẩu *</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.password && touched.password && styles.inputError,
                    ]}
                  >
                    <Ionicons name="lock-closed-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Nhập mật khẩu"
                      placeholderTextColor="#999"
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="password"
                      textContentType="password"
                      spellCheck={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && touched.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Xác nhận mật khẩu *</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.confirmPassword &&
                        touched.confirmPassword &&
                        styles.inputError,
                    ]}
                  >
                    <Ionicons name="lock-closed-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Nhập lại mật khẩu"
                      placeholderTextColor="#999"
                      value={values.confirmPassword}
                      onChangeText={handleChange('confirmPassword')}
                      onBlur={handleBlur('confirmPassword')}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="password"
                      textContentType="password"
                      spellCheck={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}
                </View>

                {/* Gender */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Giới tính *</Text>
                  <View style={styles.genderContainer}>
                    {['Nam', 'Nữ', 'Khác'].map((gender) => (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.genderButton,
                          values.gender === gender && styles.genderButtonActive,
                        ]}
                        onPress={() => setFieldValue('gender', gender)}
                      >
                        <Text
                          style={[
                            styles.genderButtonText,
                            values.gender === gender && styles.genderButtonTextActive,
                          ]}
                        >
                          {gender}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.gender && touched.gender && (
                    <Text style={styles.errorText}>{errors.gender}</Text>
                  )}
                </View>

                {/* Birth Date — nhập tay DD/MM/YYYY */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Ngày sinh</Text>
                  <Text style={styles.inputHint}>Tùy chọn — định dạng DD/MM/YYYY (ví dụ 15/08/2004)</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.birthDate && touched.birthDate && styles.inputError,
                    ]}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#999"
                      value={values.birthDate}
                      onChangeText={(t) => setFieldValue('birthDate', formatBirthDateInput(t))}
                      onBlur={handleBlur('birthDate')}
                      keyboardType="number-pad"
                      maxLength={10}
                      autoCorrect={false}
                    />
                  </View>
                  {errors.birthDate && touched.birthDate && (
                    <Text style={styles.errorText}>{errors.birthDate}</Text>
                  )}
                </View>

                {/* Bio */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Giới thiệu ngắn</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      styles.textAreaWrapper,
                      errors.bio && touched.bio && styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      placeholder="Giới thiệu về bản thân (tùy chọn)"
                      placeholderTextColor="#999"
                      value={values.bio}
                      onChangeText={handleChange('bio')}
                      onBlur={handleBlur('bio')}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                  {errors.bio && touched.bio && (
                    <Text style={styles.errorText}>{errors.bio}</Text>
                  )}
                </View>

                {/* Submit Button */}
                <Animated.View style={buttonAnimatedStyle}>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      isSubmitting && styles.submitButtonDisabled,
                    ]}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.submitButtonText}>
                      {isSubmitting ? 'Đang xử lý...' : 'Tiếp tục'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Hoặc</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Login Button */}
                <TouchableOpacity
                  style={[styles.googleButton, (isSubmitting || googleLoading) && styles.googleButtonDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={isSubmitting || googleLoading}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#4285F4" />
                  ) : (
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                  )}
                  <Text style={styles.googleButtonText}>
                    {googleLoading ? 'Đang xử lý...' : 'Đăng ký bằng Google'}
                  </Text>
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Đã có tài khoản? </Text>
                  <TouchableOpacity onPress={() => router.replace('/auth')}>
                    <Text style={styles.loginLink}>Đăng nhập</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Formik>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E53E3E',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 8,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F56565',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
    minHeight: '60%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
    marginTop: -4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputError: {
    borderColor: '#E53E3E',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  placeholderText: {
    color: '#999',
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    marginLeft: 0,
  },
  eyeButton: {
    padding: 5,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#E53E3E',
    borderColor: '#E53E3E',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#E53E3E',
    fontWeight: '600',
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
    marginBottom: 20,
    gap: 10,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
});
