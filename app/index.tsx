
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// CRITICAL FIX: Force immediate navigation to login screen
// Do NOT wait for auth, onboarding, or any async checks
// This prevents the app from hanging on splash screen in production

export default function Index() {
  useEffect(() => {
    console.log("🚀 Index: App startup - immediately navigating to login");
    
    // Release splash screen immediately
    SplashScreen.hideAsync().catch((error) => {
      console.warn("⚠️ Failed to hide splash screen:", error);
    });
  }, []);

  // ALWAYS redirect to login screen immediately
  // Auth checks will happen AFTER the login screen is visible
  console.log("➡️ Index: Redirecting to login screen");
  return <Redirect href="/auth/login" />;
}
