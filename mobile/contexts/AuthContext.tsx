import React, { createContext, useContext, useReducer, useEffect } from "react";
import { Alert } from "react-native";
import { authAPI, storage } from "./api"; // Sử dụng axios API từ contexts/api.ts

// ---- Types ----
interface SocialLinks {
  email?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
  custom?: Array<{ label: string; url: string }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  gender?: string;
  birthDate?: string | Date;
  createdAt?: string | Date;
  socialLinks?: SocialLinks;
  role?: string; // 'user', 'creator', 'admin'
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshAuthState: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ---- Initial State ----
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

// ---- Reducer ----
type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: User };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case "LOGOUT":
      return { ...state, user: null, token: null, isAuthenticated: false, isLoading: false };
    case "UPDATE_USER":
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

// ---- Context ----
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---- Provider ----
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    refreshAuthState();
  }, []);

  const refreshAuthState = async () => {
    try {
      const token = await storage.getToken();
      const user = await storage.getUser();
      if (token && user) {
        dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    } catch (error) {
      console.error("Error restoring auth state:", error);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const res = await authAPI.login(email, password);
      const { user, token, refreshToken } = res.data;

      await storage.saveToken(token);
      await storage.saveUser(user);
      if (refreshToken) await storage.saveRefreshToken(refreshToken);

      dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Mật khẩu không đúng";
      Alert.alert("Đăng nhập thất bại", errorMessage);
      dispatch({ type: "SET_LOADING", payload: false });
      throw err; // Re-throw để login screen có thể xử lý
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const res = await authAPI.register(name, email, password);
      const { user, token, refreshToken } = res.data;

      await storage.saveToken(token);
      await storage.saveUser(user);
      if (refreshToken) await storage.saveRefreshToken(refreshToken);

      dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
    } catch (err: any) {
      Alert.alert("Đăng ký thất bại", err?.response?.data?.message || "Lỗi hệ thống");
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const logout = async () => {
    try {
      await storage.removeToken();
      await storage.removeUser();
      await storage.removeRefreshToken();
      dispatch({ type: "LOGOUT" });
    } catch (err) {
      console.error("❌ Lỗi khi đăng xuất:", err);
    }
  };

  const updateUser = (user: User) => {
    storage.saveUser(user);
    dispatch({ type: "UPDATE_USER", payload: user });
  };

  const refreshUser = async () => {
    try {
      if (!state.token) {
        console.log('⚠️ No token, cannot refresh user');
        return;
      }
      console.log('🔄 Refreshing user data from server...');
      const res = await authAPI.getCurrentUser();
      const user = res.data.user;
      console.log('📥 User data received:', {
        _id: user._id,
        name: user.name,
        role: user.role
      });
      await storage.saveUser(user);
      dispatch({ type: "UPDATE_USER", payload: user });
      console.log('✅ User data refreshed from server, role:', user.role);
    } catch (err: any) {
      console.error('❌ Error refreshing user:', err);
      // Không throw error để không làm gián đoạn app
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    refreshAuthState,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---- Hook tiện dùng ----
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
