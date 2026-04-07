import { Alert } from 'react-native';
import { VI } from '../constants/strings';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ErrorHandler {
  static handleApiError(error: any): string {
    console.error('API Error:', error);
    
    // Network error
    if (!error.response) {
      return VI.networkError;
    }
    
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    switch (status) {
      case 401:
        return VI.authError;
      case 403:
        return 'Bạn không có quyền thực hiện hành động này';
      case 404:
        return 'Không tìm thấy dữ liệu';
      case 429:
        // Rate limiting error - hiển thị message từ server hoặc message mặc định
        return message || 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.';
      case 422:
        return message || VI.validationError;
      case 500:
        return 'Lỗi máy chủ. Vui lòng thử lại sau';
      default:
        return message || 'Có lỗi xảy ra. Vui lòng thử lại';
    }
  }
  
  static showErrorAlert(error: any, customMessage?: string) {
    const message = customMessage || this.handleApiError(error);
    Alert.alert(VI.error, message);
  }
  
  static showSuccessAlert(message: string) {
    Alert.alert(VI.success, message);
  }
  
  static showConfirmAlert(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) {
    Alert.alert(
      title,
      message,
      [
        {
          text: VI.cancel,
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'OK',
          onPress: onConfirm,
        },
      ]
    );
  }
}

export default ErrorHandler;




