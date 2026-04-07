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
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { premiumAPI } from '@/contexts/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const TOP_UP_AMOUNTS = [
  { amount: 100, label: '100 Xu', bonus: 0 },
  { amount: 500, label: '500 Xu', bonus: 50 },
  { amount: 1000, label: '1,000 Xu', bonus: 150 },
  { amount: 5000, label: '5,000 Xu', bonus: 1000 },
  { amount: 10000, label: '10,000 Xu', bonus: 2500 },
];

export default function TopUpScreen() {
  const { user } = useAuth();
  const [userCoins, setUserCoins] = useState(0);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isTopingUp, setIsTopingUp] = useState(false);

  useEffect(() => {
    loadUserCoins();
  }, []);

  const loadUserCoins = async () => {
    try {
      setLoadingCoins(true);
      const response = await premiumAPI.getMyCoins();
      setUserCoins(response.data.coins || 0);
    } catch (error: any) {
      console.error('❌ Lỗi load coins:', error);
    } finally {
      setLoadingCoins(false);
    }
  };

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (text: string) => {
    // Chỉ cho phép số
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    setSelectedAmount(null);
  };

  const handleTopUp = async () => {
    let amount = 0;

    if (selectedAmount) {
      amount = selectedAmount;
    } else if (customAmount) {
      amount = parseInt(customAmount);
    } else {
      Alert.alert('Thông báo', 'Vui lòng chọn hoặc nhập số lượng xu muốn nạp');
      return;
    }

    // Validate amount
    if (amount < 10) {
      Alert.alert('Thông báo', 'Số lượng xu tối thiểu là 10');
      return;
    }

    if (amount > 100000) {
      Alert.alert('Thông báo', 'Số lượng xu tối đa là 100,000');
      return;
    }

    Alert.alert(
      'Xác nhận nạp xu',
      `Bạn có chắc chắn muốn nạp ${amount.toLocaleString('vi-VN')} xu?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setIsTopingUp(true);
              const response = await premiumAPI.topUpCoins(amount);

              Alert.alert(
                'Thành công',
                `Bạn đã nạp thành công ${amount.toLocaleString('vi-VN')} xu!\nSố dư mới: ${response.data.coins.toLocaleString('vi-VN')} xu`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setUserCoins(response.data.coins);
                      setSelectedAmount(null);
                      setCustomAmount('');
                      router.back();
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('❌ Lỗi nạp xu:', error);
              const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi nạp xu';
              Alert.alert('Lỗi', errorMessage);
            } finally {
              setIsTopingUp(false);
            }
          },
        },
      ]
    );
  };

  const getBonusAmount = (amount: number) => {
    const option = TOP_UP_AMOUNTS.find((opt) => opt.amount === amount);
    return option?.bonus || 0;
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Nạp Xu</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Current Balance */}
            <View style={styles.balanceCard}>
              <LinearGradient
                colors={['#FF8C42', '#FF6B35', '#FF4757']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceGradient}
              >
                <View style={styles.balanceIconContainer}>
                  <View style={styles.coinIconContainer}>
                    <LinearGradient
                      colors={['#FFD700', '#FFA500', '#FF8C00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.coinIconGradient}
                    >
                      <Text style={styles.coinIconText}>₫</Text>
                    </LinearGradient>
                  </View>
                </View>
                <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
                {loadingCoins ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.balanceAmount}>
                    {userCoins.toLocaleString('vi-VN')} Xu
                  </Text>
                )}
              </LinearGradient>
            </View>

            {/* Quick Select Amounts */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Chọn gói nạp</ThemedText>
              <View style={styles.amountGrid}>
                {TOP_UP_AMOUNTS.map((option) => {
                  const isSelected = selectedAmount === option.amount;
                  const hasBonus = option.bonus > 0;
                  return (
                    <TouchableOpacity
                      key={option.amount}
                      style={[
                        styles.amountCard,
                        isSelected && styles.amountCardSelected,
                      ]}
                      onPress={() => handleSelectAmount(option.amount)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.amountValue,
                          isSelected && styles.amountValueSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {hasBonus && (
                        <View style={styles.bonusBadge}>
                          <Text style={styles.bonusText}>
                            +{option.bonus} Xu
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Custom Amount */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Hoặc nhập số lượng tùy chỉnh</ThemedText>
              <View style={styles.customAmountContainer}>
                <View style={styles.inputContainer}>
                  <Ionicons name="cash-outline" size={20} color="#FF8C42" style={styles.inputIcon} />
                  <TextInput
                    style={styles.customInput}
                    placeholder="Nhập số lượng xu (tối thiểu 10)"
                    placeholderTextColor="#999"
                    value={customAmount}
                    onChangeText={handleCustomAmountChange}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <Text style={styles.inputSuffix}>Xu</Text>
                </View>
                {customAmount && parseInt(customAmount) >= 10 && (
                  <Text style={styles.customAmountPreview}>
                    Bạn sẽ nạp: {parseInt(customAmount).toLocaleString('vi-VN')} Xu
                  </Text>
                )}
              </View>
            </View>

            {/* Top Up Button */}
            <TouchableOpacity
              style={[styles.topUpButton, isTopingUp && styles.topUpButtonDisabled]}
              onPress={handleTopUp}
              disabled={isTopingUp || (!selectedAmount && !customAmount)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isTopingUp || (!selectedAmount && !customAmount)
                    ? ['#CCCCCC', '#999999']
                    : ['#FF8C42', '#FF6B35']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.topUpButtonGradient}
              >
                {isTopingUp ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.topUpButtonText}>
                      Nạp{' '}
                      {selectedAmount
                        ? `${selectedAmount.toLocaleString('vi-VN')} Xu`
                        : customAmount
                          ? `${parseInt(customAmount || '0').toLocaleString('vi-VN')} Xu`
                          : 'Xu'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color="#FF8C42" />
              <Text style={styles.infoText}>
                • Số lượng xu tối thiểu: 10 Xu{'\n'}
                • Số lượng xu tối đa: 100,000 Xu{'\n'}
                • Xu sẽ được cộng vào tài khoản ngay sau khi nạp thành công
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF8C42',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  balanceCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceGradient: {
    padding: 24,
    alignItems: 'center',
  },
  balanceIconContainer: {
    marginBottom: 12,
  },
  coinIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  coinIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  coinIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontFamily: 'Inter_400Regular',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  amountCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderColor: '#FFFFFF',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  amountValueSelected: {
    fontSize: 18,
    fontWeight: '700',
  },
  bonusBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  bonusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Inter_700Bold',
  },
  customAmountContainer: {
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputIcon: {
    marginRight: 12,
  },
  customInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
  },
  inputSuffix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  customAmountPreview: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  topUpButton: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  topUpButtonDisabled: {
    opacity: 0.6,
  },
  topUpButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  topUpButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
});

