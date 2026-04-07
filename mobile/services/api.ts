import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveApiBase, getDefaultApiBase } from '../config/api';

// API Configuration
// Dùng localhost để tự động resolve IP dựa trên môi trường
// - Android Emulator: tự động chuyển thành 10.0.2.2
// - iOS Simulator: giữ nguyên localhost
// - Expo Go / Thiết bị thật: tự động lấy IP từ Expo Constants
const API_BASE = resolveApiBase('http://localhost:8080/api');


// Helper function để handle API responses
const handleResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

// Authentication API
export const authAPI = {
  // Register user
  register: async (email: string, password: string, name: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });
    return handleResponse(response);
  },

  // Login user
  login: async (email: string, password: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },
};

// Recipes API
export const recipesAPI = {
  // Get all recipes with pagination and filtering
  getAll: async (page: number = 1, limit: number = 10, search: string = '', category: string = ''): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { q: search }),
      ...(category && { category }),
    });
    
    const response = await fetch(`${API_BASE}/recipes?${params}`);
    return handleResponse(response);
  },

  // Get single recipe
  getById: async (id: string | number): Promise<any> => {
    const response = await fetch(`${API_BASE}/recipes/${id}`);
    return handleResponse(response);
  },

  // Create new recipe
  create: async (recipeData: Record<string, any>, imageUri?: string | null, token?: string): Promise<any> => {
    const formData = new FormData();

    // Add text fields
    Object.keys(recipeData).forEach(key => {
      if (key === 'ingredients' || key === 'steps') {
        formData.append(key, JSON.stringify(recipeData[key]));
      } else {
        formData.append(key, recipeData[key]);
      }
    });

    // Add image if provided
    if (imageUri) {
      // React Native expects an object with uri, name, type
      // TypeScript DOM types don't accept this shape for FormData.append, so we keep it as-is.
      (formData as any).append('image', {
        uri: imageUri,
        name: 'recipe.jpg',
        type: 'image/jpeg',
      });
    }

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/recipes`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return handleResponse(response);
  },

  // Update recipe
  update: async (id: string | number, recipeData: Record<string, any>, imageUri?: string | null, token?: string): Promise<any> => {
    const formData = new FormData();

    // Add text fields
    Object.keys(recipeData).forEach(key => {
      if (key === 'ingredients' || key === 'steps') {
        formData.append(key, JSON.stringify(recipeData[key]));
      } else {
        formData.append(key, recipeData[key]);
      }
    });

    // Add image if provided
    if (imageUri) {
      (formData as any).append('image', {
        uri: imageUri,
        name: 'recipe.jpg',
        type: 'image/jpeg',
      });
    }

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/recipes/${id}`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    return handleResponse(response);
  },

  // Delete recipe
  delete: async (id: string | number, token?: string): Promise<any> => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/recipes/${id}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse(response);
  },
};

// Favorites API
export const favoritesAPI = {
  // Toggle favorite
  toggle: async (recipeId: string | number, token?: string): Promise<any> => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/favorites/toggle/${recipeId}`, {
      method: 'POST',
      headers,
    });
    return handleResponse(response);
  },

  // Get user favorites
  getAll: async (token?: string): Promise<any> => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/favorites`, {
      headers,
    });
    return handleResponse(response);
  },
};

// Storage helper
export const storage = {
  // Save token
  saveToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  // Get token
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Remove token
  removeToken: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // Save user data
  saveUser: async (user: Record<string, any>): Promise<void> => {
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  // Get user data
  getUser: async (): Promise<Record<string, any> | null> => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // Remove user data
  removeUser: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('user_data');
    } catch (error) {
      console.error('Error removing user:', error);
    }
  },
};
