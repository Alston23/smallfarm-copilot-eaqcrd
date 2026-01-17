
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { useColorScheme } from "react-native";
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
import { SuperwallProvider, SuperwallLoading, SuperwallLoaded } from "expo-superwall";
import { ActivityIndicator, View } from "react-native";

SplashScreen.preventAutoHideAsync();

// Log backend URL at app startup for debugging
console.log('🌐 Backend URL:', Constants.expoConfig?.extra?.backendUrl);

// Superwall API keys - Replace with your actual keys from Superwall dashboard
const SUPERWALL_API_KEYS = {
  ios: process.env.EXPO_PUBLIC_SUPERWALL_IOS_API_KEY || "YOUR_IOS_API_KEY",
  android: process.env.EXPO_PUBLIC_SUPERWALL_ANDROID_API_KEY || "YOUR_ANDROID_API_KEY",
};

console.log('🔐 Superwall configured for platforms:', Object.keys(SUPERWALL_API_KEYS).filter(k => SUPERWALL_API_KEYS[k as keyof typeof SUPERWALL_API_KEYS] !== `YOUR_${k.toUpperCase()}_API_KEY`));

function AppContent() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

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
}
