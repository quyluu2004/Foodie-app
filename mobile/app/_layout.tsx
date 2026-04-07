import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ChatUnreadProvider } from "@/contexts/ChatUnreadContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <OnboardingProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <ChatUnreadProvider>
            <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="avatar-picker" options={{ headerShown: false }} />
            <Stack.Screen name="register-complete" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="create-recipe" options={{ headerShown: false }} />
            <Stack.Screen name="create-post" options={{ headerShown: false }} />
            <Stack.Screen name="post-detail" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
            <Stack.Screen name="saved-recipes-stats" options={{ headerShown: false }} />
            <Stack.Screen name="my-posts" options={{ headerShown: false }} />
            <Stack.Screen name="activity-stats" options={{ headerShown: false }} />
            <Stack.Screen name="followers-list" options={{ headerShown: false }} />
            <Stack.Screen name="following-list" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="report" options={{ headerShown: false }} />
            <Stack.Screen name="my-reports" options={{ headerShown: false }} />
            <Stack.Screen name="likes-received-list" options={{ headerShown: false }} />
            <Stack.Screen name="comments-received-list" options={{ headerShown: false }} />
            <Stack.Screen name="user-profile" options={{ headerShown: false }} />
            <Stack.Screen name="ai-chat" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
            </ChatUnreadProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </OnboardingProvider>
  );
}
