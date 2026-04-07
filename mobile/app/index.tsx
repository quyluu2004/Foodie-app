import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";

export default function IndexScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasSeenOnboarding, isLoading: onboardingLoading } = useOnboarding();

  useEffect(() => {
    if (authLoading || onboardingLoading) return;

    // Nếu chưa xem onboarding, hiển thị onboarding
    if (!hasSeenOnboarding) {
      router.replace("/onboarding");
      return;
    }

    // Nếu đã xem onboarding, kiểm tra auth
    if (isAuthenticated && user) {
      router.replace("/(tabs)");
    } else {
      router.replace("/auth");
    }
  }, [isAuthenticated, user, authLoading, hasSeenOnboarding, onboardingLoading]);

  return null;
}

