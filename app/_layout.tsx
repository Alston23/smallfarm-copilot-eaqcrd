
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { useColorScheme, Platform, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SystemBars } from "react-native-edge-to-edge";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Constants from "expo-constants";

// CRITICAL FIX: Prevent auto-hide so we can control when to hide it
SplashScreen.preventAutoHideAsync();

// Log backend URL at app startup for debugging
console.log('🌐 Backend URL:', Constants.expoConfig?.extra?.backendUrl);

function AppContent() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    console.log("🎨 AppContent: Fonts loaded status:", loaded);
    
    if (loaded) {
      console.log("✅ AppContent: Fonts loaded, hiding splash screen immediately");
      // CRITICAL FIX: Hide splash screen as soon as fonts are loaded
      // Don't wait for auth or any other checks
      SplashScreen.hideAsync().catch((error) => {
        console.warn("⚠️ Failed to hide splash screen:", error);
      });
    }
  }, [loaded]);

  // CRITICAL FIX: Don't block rendering while fonts load
  // Return null only if fonts aren't loaded yet (keeps splash visible)
  if (!loaded) {
    console.log("⏳ AppContent: Waiting for fonts to load...");
    return null;
  }

  console.log("✅ AppContent: Rendering app navigation");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <SystemBars style={colorScheme === "dark" ? "light" : "dark"} />
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="auth/register" />
              <Stack.Screen name="auth/forgot-password" />
              <Stack.Screen name="auth-popup" />
              <Stack.Screen name="auth-callback" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </AuthProvider>
        </NavigationThemeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  // Check if we're in a development build or Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';
  
  console.log('📱 RootLayout: Running in:', isExpoGo ? 'Expo Go (Superwall disabled)' : 'Development Build (Superwall enabled)');

  // Only use Superwall if we're NOT in Expo Go
  if (!isExpoGo && Platform.OS !== 'web') {
    try {
      // Dynamically import Superwall only when needed
      const { SuperwallProvider, SuperwallLoading, SuperwallLoaded } = require("expo-superwall");
      
      const SUPERWALL_API_KEYS = {
        ios: process.env.EXPO_PUBLIC_SUPERWALL_IOS_API_KEY || "YOUR_IOS_API_KEY",
        android: process.env.EXPO_PUBLIC_SUPERWALL_ANDROID_API_KEY || "YOUR_ANDROID_API_KEY",
      };

      console.log('🔐 Superwall configured for platforms:', Object.keys(SUPERWALL_API_KEYS).filter(k => SUPERWALL_API_KEYS[k as keyof typeof SUPERWALL_API_KEYS] !== `YOUR_${k.toUpperCase()}_API_KEY`));

      return (
        <SuperwallProvider
          apiKeys={SUPERWALL_API_KEYS}
          onConfigurationError={(error) => {
            console.error('❌ Superwall configuration failed:', error);
          }}
        >
          <SuperwallLoading>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#4CAF50" />
            </View>
          </SuperwallLoading>
          <SuperwallLoaded>
            <AppContent />
          </SuperwallLoaded>
        </SuperwallProvider>
      );
    } catch (error) {
      console.warn('⚠️ Superwall not available, running without subscription features:', error);
    }
  }

  // Fallback: Run without Superwall (for Expo Go and web)
  console.log('✅ RootLayout: Running without Superwall');
  return <AppContent />;
}
