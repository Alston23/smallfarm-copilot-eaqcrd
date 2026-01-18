
import { useEffect, useState, useRef } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import * as SecureStore from 'expo-secure-store';

// CRITICAL: Hard timeout to prevent indefinite hanging on splash screen
const STARTUP_TIMEOUT_MS = 2500; // 2.5 seconds - MUST navigate by this time

export default function Index() {
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log("🚀 Index: App startup initiated");
    
    // CRITICAL TIMEOUT: Force navigation after STARTUP_TIMEOUT_MS no matter what
    const forceNavigationTimeout = setTimeout(() => {
      if (!hasNavigated.current) {
        console.warn("⚠️ TIMEOUT: Forcing navigation after", STARTUP_TIMEOUT_MS, "ms");
        
        // If we have a user by timeout, go to main app
        // Otherwise, go to login
        const fallbackDestination = user ? "/(tabs)/(crops)" : "/auth/login";
        console.log("🚨 TIMEOUT: Navigating to", fallbackDestination);
        
        setDestination(fallbackDestination);
        setIsReady(true);
        hasNavigated.current = true;
      }
    }, STARTUP_TIMEOUT_MS);

    // Async function to check auth and onboarding
    async function determineDestination() {
      try {
        console.log("🔍 Index: Checking auth state...", { loading, hasUser: !!user });
        
        // Wait for auth to finish loading (with timeout protection from AuthContext)
        if (loading) {
          console.log("⏳ Index: Waiting for auth to complete...");
          return; // Will be called again when loading changes
        }

        // No user = go to login
        if (!user) {
          console.log("➡️ Index: No user found, navigating to login");
          if (!hasNavigated.current) {
            setDestination("/auth/login");
            setIsReady(true);
            hasNavigated.current = true;
            clearTimeout(forceNavigationTimeout);
          }
          return;
        }

        // User exists - check onboarding status
        console.log("✅ Index: User authenticated, checking onboarding...");
        
        try {
          const onboardingCompleted = await Promise.race([
            SecureStore.getItemAsync('onboarding_completed'),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)) // 1s timeout for SecureStore
          ]);
          
          console.log("📋 Index: Onboarding status:", onboardingCompleted);
          
          if (!hasNavigated.current) {
            if (onboardingCompleted === 'true') {
              console.log("➡️ Index: Onboarding complete, navigating to main app");
              setDestination("/(tabs)/(crops)");
            } else {
              console.log("➡️ Index: Onboarding needed, navigating to onboarding");
              setDestination("/onboarding");
            }
            setIsReady(true);
            hasNavigated.current = true;
            clearTimeout(forceNavigationTimeout);
          }
        } catch (error) {
          console.error("⚠️ Index: Error checking onboarding (defaulting to main app):", error);
          if (!hasNavigated.current) {
            setDestination("/(tabs)/(crops)");
            setIsReady(true);
            hasNavigated.current = true;
            clearTimeout(forceNavigationTimeout);
          }
        }
      } catch (error) {
        console.error("❌ Index: Critical error in startup flow:", error);
        // On any error, default to login screen
        if (!hasNavigated.current) {
          setDestination("/auth/login");
          setIsReady(true);
          hasNavigated.current = true;
          clearTimeout(forceNavigationTimeout);
        }
      }
    }

    determineDestination();

    return () => {
      console.log("🧹 Index: Cleanup");
      clearTimeout(forceNavigationTimeout);
    };
  }, [user, loading]);

  // Show loading screen while determining destination
  if (!isReady || !destination) {
    console.log("⏳ Index: Showing splash screen...", { isReady, destination });
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

  // Navigate to determined destination
  console.log("🎯 Index: Navigating to:", destination);
  return <Redirect href={destination as any} />;
}
