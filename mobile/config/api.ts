import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Kiểm tra xem có phải đang chạy trên Android Emulator không
 */
function isAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') return false;
  
  try {
    // Android Emulator thường có device name chứa "emulator" hoặc "sdk"
    const deviceName = Constants.deviceName || '';
    const isEmulator = 
      deviceName.toLowerCase().includes('emulator') ||
      deviceName.toLowerCase().includes('sdk') ||
      deviceName.toLowerCase().includes('google_sdk') ||
      // Hoặc check qua deviceId
      (Constants.deviceId && Constants.deviceId.includes('emulator'));
    
    return isEmulator;
  } catch (e) {
    return false;
  }
}

/**
 * Kiểm tra xem có phải đang chạy trên iOS Simulator không
 */
function isIOSSimulator(): boolean {
  if (Platform.OS !== 'ios') return false;
  
  try {
    // iOS Simulator có deviceId đặc biệt
    const deviceId = Constants.deviceId || '';
    return deviceId.includes('Simulator') || deviceId.includes('simulator');
  } catch (e) {
    return false;
  }
}

/**
 * Trả về IP của máy dev dựa trên Expo Constants (debuggerHost), nếu có
 * Bỏ qua Expo tunnel URLs (exp.direct) vì chúng không dùng được cho backend
 */
function getDevIpFromExpo(): string | null {
  try {
    // manifest có thể nằm ở manifest hoặc expoConfig tuỳ SDK
    // debuggerHost có dạng '192.168.1.198:19000'
    const manifest: any = (Constants as any).manifest || (Constants as any).expoConfig || null;
    const debuggerHost = 
      manifest?.debuggerHost || 
      manifest?.packagerOpts?.packagerHost || 
      Constants.expoConfig?.hostUri?.split(':')[0] ||
      null;
    
    console.log('🔍 Expo Constants:', {
      hasManifest: !!manifest,
      debuggerHost: debuggerHost,
      expoConfig: !!(Constants as any).expoConfig,
      hostUri: Constants.expoConfig?.hostUri
    });
    
    if (debuggerHost && typeof debuggerHost === 'string') {
      const ip = debuggerHost.split(':')[0];
      
      // Bỏ qua Expo tunnel URLs (exp.direct) - chúng không dùng được cho backend
      if (ip.includes('exp.direct') || ip.includes('tunnel')) {
        console.log('⚠️ Expo tunnel URL detected, skipping:', ip);
        return null;
      }
      
      // Chỉ chấp nhận IP addresses (192.168.x.x, 10.x.x.x, etc.)
      if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
        console.log('✅ Found IP from Expo:', ip);
        return ip;
      } else {
        console.log('⚠️ Invalid IP format, skipping:', ip);
        return null;
      }
    }
  } catch (e) {
    console.error('❌ Error getting IP from Expo:', e);
  }
  
  return null;
}

/**
 * Tự động resolve API base URL dựa trên môi trường
 * - Android Emulator: dùng 10.0.2.2 (IP đặc biệt để truy cập localhost của máy host)
 * - iOS Simulator: dùng localhost hoặc 127.0.0.1
 * - Expo Go / Thiết bị thật: lấy IP từ Expo Constants
 * - Fallback: localhost
 */
export function resolveApiBase(base: string): string {
  // 1. Android Emulator: luôn dùng 10.0.2.2 (ổn định nhất cho emulator)
  if (isAndroidEmulator()) {
    const resolved = base.replace(/localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.0\.2\.2/, '10.0.2.2');
    console.log('🤖 Android Emulator detected, forcing 10.0.2.2:', resolved);
    return resolved;
  }
  
  // 2. Kiểm tra iOS Simulator - dùng localhost
  if (isIOSSimulator()) {
    const resolved = base.replace(/192\.168\.\d+\.\d+|10\.0\.2\.2/, 'localhost');
    console.log('🍎 iOS Simulator detected, using:', resolved);
    return resolved;
  }
  
  // 3. Nếu base đã là IP LAN (192.168.x.x/10.x.x.x), giữ nguyên để dùng chung mạng Wi‑Fi
  if (/^(http(s)?:\/\/)?(192\.168|10\.)\.\d+\.\d+/.test(base)) {
    console.log('✅ Using provided LAN IP:', base);
    return base;
  }
  
  // 4. Nếu base chứa 'localhost' hoặc '127.0.0.1', thay bằng IP thật từ Expo
  if (/localhost|127\.0\.0\.1/.test(base)) {
    const ip = getDevIpFromExpo();
    if (ip) {
      const resolved = base.replace(/localhost|127\.0\.0\.1/, ip);
      console.log('✅ Resolved API Base from Expo:', resolved);
      return resolved;
    }
    
    // Nếu không tìm được IP từ Expo, giữ nguyên localhost
    // (có thể dùng cho iOS Simulator hoặc khi chạy trên cùng máy)
    console.log('⚠️ Không tìm thấy IP từ Expo, giữ nguyên:', base);
    return base;
  }

  // 5. Nếu base không chứa localhost, trả về nguyên bản
  console.log('✅ API Base không cần thay đổi:', base);
  return base;
}

/**
 * Default helper để lấy base URL - luôn dùng localhost để tự động resolve
 */
export function getDefaultApiBase(): string {
  return resolveApiBase('http://localhost:8080/api');
}
