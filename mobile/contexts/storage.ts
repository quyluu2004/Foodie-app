import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const REFRESH_TOKEN_KEY = "refreshToken";

export const storage = {
  // --- Refresh Token ---
  async saveRefreshToken(token: string) {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('❌ Error saving refresh token:', error);
    }
  },
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('❌ Error getting refresh token:', error);
      return null;
    }
  },
  async removeRefreshToken() {
    try {
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('❌ Error removing refresh token:', error);
    }
  },
  async saveToken(token: string) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      console.log('✅ Token saved to storage');
    } catch (error) {
      console.error('❌ Error saving token:', error);
    }
  },
  async getToken() {
    try {
      // Thử lấy token từ key mới trước
      let token = await AsyncStorage.getItem(TOKEN_KEY);

      // Nếu không có, thử lấy từ key cũ (migration)
      if (!token) {
        const oldToken = await AsyncStorage.getItem('auth_token');
        if (oldToken) {
          console.log('🔄 Migrating token from old key to new key');
          await AsyncStorage.setItem(TOKEN_KEY, oldToken);
          await AsyncStorage.removeItem('auth_token');
          token = oldToken;
        }
      }

      console.log('🔑 Token retrieved from storage:', token ? 'Found' : 'Not found');
      return token;
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  },
  async saveUser(user: any) {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      console.log('✅ User saved to storage');
    } catch (error) {
      console.error('❌ Error saving user:', error);
    }
  },
  async getUser() {
    try {
      // Thử lấy user từ key mới trước
      let json = await AsyncStorage.getItem(USER_KEY);

      // Nếu không có, thử lấy từ key cũ (migration)
      if (!json) {
        const oldUser = await AsyncStorage.getItem('user_data');
        if (oldUser) {
          console.log('🔄 Migrating user from old key to new key');
          await AsyncStorage.setItem(USER_KEY, oldUser);
          await AsyncStorage.removeItem('user_data');
          json = oldUser;
        }
      }

      const user = json ? JSON.parse(json) : null;
      console.log('👤 User retrieved from storage:', user ? 'Found' : 'Not found');
      return user;
    } catch (error) {
      console.error('❌ Error getting user:', error);
      return null;
    }
  },
  async removeToken() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      console.log('✅ Token removed from storage');
    } catch (error) {
      console.error('❌ Error removing token:', error);
    }
  },
  async removeUser() {
    try {
      await AsyncStorage.removeItem(USER_KEY);
      console.log('✅ User removed from storage');
    } catch (error) {
      console.error('❌ Error removing user:', error);
    }
  },
  async clear() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, REFRESH_TOKEN_KEY]);
      console.log('✅ Storage cleared');
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
    }
  },
  // Dietary preferences
  async saveDietaryPreferences(preferences: { diets: string[]; ingredients: string[] }) {
    try {
      await AsyncStorage.setItem('dietary_preferences', JSON.stringify(preferences));
      console.log('✅ Dietary preferences saved');
    } catch (error) {
      console.error('❌ Error saving dietary preferences:', error);
    }
  },
  async getDietaryPreferences(): Promise<{ diets: string[]; ingredients: string[] } | null> {
    try {
      const json = await AsyncStorage.getItem('dietary_preferences');
      if (json) {
        return JSON.parse(json);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting dietary preferences:', error);
      return null;
    }
  },
};
