import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';

export default function AppNavigator() {
  const { hasSeenOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for 2.5 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (showSplash || onboardingLoading || authLoading) return;

    if (!hasSeenOnboarding) {
      router.replace('/onboarding');
    } else if (!isAuthenticated) {
      router.replace('/auth');
    } else {
      router.replace('/(tabs)');
    }
  }, [hasSeenOnboarding, isAuthenticated, onboardingLoading, authLoading, showSplash]);

  // Show splash screen
  if (showSplash) {
    router.replace('/splash');
    return null;
  }

  // Show loading while checking onboarding and auth status
  if (onboardingLoading || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#FF8C42" />
      </View>
    );
  }

  return null;
}
