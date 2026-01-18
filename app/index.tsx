
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import * as SecureStore from 'expo-secure-store';

// Maximum time to wait before forcing navigation (prevents indefinite hanging)
const STARTUP_TIMEOUT_MS = 3000; // 3 seconds

export default function Index() {
  const { user, loading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [forceNavigation, setForceNavigation] = useState(false);

  // Safety timeout: Force navigation after STARTUP_TIMEOUT_MS to prevent hanging
  useEffect(() => {
    console.log("⏱️ Index: Starting startup timeout protection");
    
    const timeoutId = setTimeout(() => {
      console.warn("⚠️ Index: Startup timeout reached! Forcing navigation to prevent hanging.");
      setForceNavigation(true);
      setCheckingOnboarding(false);
    }, STARTUP_TIMEOUT_MS);

    return () => {
      console.log("🧹 Index: Cleaning up startup timeout");
      clearTimeout(timeoutId);
    };
  }, []);

  // Check onboarding status when auth loading completes
  useEffect(() => {
    async function checkOnboarding() {
      console.log("🔍 Index: Checking onboarding status", { loading, user: user?.email });
      
      if (!loading) {
        if (user) {
          try {
            const onboardingCompleted = await SecureStore.getItemAsync('onboarding_completed');
            console.log("📋 Index: Onboarding status:", onboardingCompleted === 'true' ? 'completed' : 'not completed');
            setShouldShowOnboarding(onboardingCompleted !== 'true');
          } catch (error) {
            console.error("⚠️ Index: Error checking onboarding status (defaulting to completed):", error);
            setShouldShowOnboarding(false);
          }
        } else {
          console.log("ℹ️ Index: No user, skipping onboarding check");
        }
        setCheckingOnboarding(false);
      }
    }
    
    checkOnboarding();
  }, [user, loading]);

  // Show loading screen while checking auth and onboarding
  if ((loading || checkingOnboarding) && !forceNavigation) {
    console.log("⏳ Index: Still loading...", { loading, checkingOnboarding, forceNavigation });
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: farmGreen }}>
        <IconSymbol 
          ios_icon_name="leaf.fill" 
          android_material_icon_name="eco" 
          size={80} 
          color="#fff" 
        />
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
        <Text style={{ color: '#fff', fontSize: 18, marginTop: 16, fontWeight: '600' }}>
          SmallFarm Copilot
        </Text>
      </View>
    );
  }

  // If timeout forced navigation and we still don't have user data, go to login
  if (forceNavigation && !user) {
    console.log("🚨 Index: Timeout forced navigation to login (no user available)");
    return <Redirect href="/auth/login" />;
  }

  // If timeout forced navigation and we have user, skip onboarding check and go to main app
  if (forceNavigation && user) {
    console.log("🚨 Index: Timeout forced navigation to main app (user exists)");
    return <Redirect href="/(tabs)/(crops)" />;
  }

  // Normal flow: No user -> login
  if (!user) {
    console.log("➡️ Index: No user, redirecting to login");
    return <Redirect href="/auth/login" />;
  }

  // Normal flow: User needs onboarding
  if (shouldShowOnboarding) {
    console.log("➡️ Index: User needs onboarding");
    return <Redirect href="/onboarding" />;
  }

  // Normal flow: User authenticated and onboarded -> main app
  console.log("➡️ Index: User authenticated and onboarded, redirecting to main app");
  return <Redirect href="/(tabs)/(crops)" />;
}
