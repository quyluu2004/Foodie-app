import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { reportAPI } from '@/contexts/api';

const REPORT_REASONS = [
  'Nội dung không phù hợp',
  'Spam hoặc quảng cáo',
  'Nội dung bạo lực',
  'Nội dung khiêu dâm',
  'Quấy rối hoặc bắt nạt',
  'Thông tin sai lệch',
  'Vi phạm bản quyền',
  'Khác',
];

export default function ReportScreen() {
  const { type, targetId } = useLocalSearchParams<{ type: string; targetId: string }>();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Lỗi', 'Vui lòng chọn lý do báo cáo');
      return;
    }

    if (!type || !targetId) {
      Alert.alert('Lỗi', 'Thông tin báo cáo không hợp lệ');
      return;
    }

    try {
      setSubmitting(true);
      await reportAPI.create({
        type: type as 'recipe' | 'post' | 'comment' | 'user',
        targetId: targetId,
        reason: selectedReason,
        description: description.trim(),
      });

      Alert.alert(
        'Thành công',
        'Báo cáo của bạn đã được gửi và đang chờ xử lý. Bạn có thể xem trong "Báo cáo của tôi".',
        [
          {
            text: 'Xem báo cáo',
            onPress: () => {
              router.back();
              // Navigate to my-reports after a short delay to ensure back navigation completes
              setTimeout(() => {
                router.push('/my-reports' as any);
              }, 300);
            },
          },
          {
            text: 'OK',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting report:', error);
      const errorMessage = error.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Báo cáo
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Chọn lý do báo cáo
            </ThemedText>
            <Text style={styles.sectionDescription}>
              Vui lòng chọn lý do phù hợp nhất để giúp chúng tôi xử lý báo cáo của bạn.
            </Text>

            <View style={styles.reasonsList}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonItem,
                    selectedReason === reason && styles.reasonItemSelected,
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <View style={styles.reasonItemContent}>
                    <View
                      style={[
                        styles.radioButton,
                        selectedReason === reason && styles.radioButtonSelected,
                      ]}
                    >
                      {selectedReason === reason && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.reasonText,
                        selectedReason === reason && styles.reasonTextSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Mô tả chi tiết (tùy chọn)
            </ThemedText>
            <Text style={styles.sectionDescription}>
              Cung cấp thêm thông tin chi tiết về vấn đề bạn gặp phải.
            </Text>

            <TextInput
              style={styles.descriptionInput}
              placeholder="Nhập mô tả chi tiết về vấn đề..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {description.length}/500 ký tự
            </Text>
          </View>

          <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={20} color="#FF9800" />
            <Text style={styles.warningText}>
              Báo cáo sai có thể dẫn đến hậu quả. Vui lòng chỉ báo cáo nội dung thực sự vi phạm.
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedReason || submitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  reasonsList: {
    gap: 8,
  },
  reasonItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 16,
  },
  reasonItemSelected: {
    borderColor: '#FF8C42',
    backgroundColor: '#FFF5F5',
  },
  reasonItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#FF8C42',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF8C42',
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  reasonTextSelected: {
    color: '#FF8C42',
    fontWeight: '600',
  },
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#FF8C42',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

