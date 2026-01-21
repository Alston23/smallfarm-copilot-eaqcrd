
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { farmGreen, farmGreenDark, farmGreenLight } from "@/constants/Colors";
import { IconSymbol } from "@/components/IconSymbol";
import * as SecureStore from 'expo-secure-store';

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const router = useRouter();
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, signInWithGitHub, loading: authLoading } =
    useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // CRITICAL FIX: Check auth AFTER screen is visible, don't block rendering
  useEffect(() => {
    console.log("🔍 Login screen: Checking if user is already authenticated (non-blocking)");
    
    async function checkAuthAndRedirect() {
      try {
        // Wait for auth context to finish loading
        if (authLoading) {
          console.log("⏳ Login screen: Auth still loading, waiting...");
          return;
        }

        // If user is authenticated, redirect to appropriate screen
        if (user) {
          console.log("✅ Login screen: User is authenticated, checking onboarding status");
          
          try {
            const onboardingCompleted = await SecureStore.getItemAsync('onboarding_completed');
            
            if (onboardingCompleted === 'true') {
              console.log("➡️ Login screen: Redirecting to main app");
              router.replace("/(tabs)/(crops)");
            } else {
              console.log("➡️ Login screen: Redirecting to onboarding");
              router.replace("/onboarding");
            }
          } catch (error) {
            console.error("⚠️ Login screen: Error checking onboarding, defaulting to main app:", error);
            router.replace("/(tabs)/(crops)");
          }
        } else {
          console.log("ℹ️ Login screen: No user authenticated, staying on login screen");
        }
      } catch (error) {
        console.error("❌ Login screen: Error checking auth:", error);
      }
    }

    checkAuthAndRedirect();
  }, [user, authLoading, router]);

  // CRITICAL FIX: Always render the login screen immediately
  // No loading state that blocks the UI

  const handleEmailAuth = async () => {
    console.log("User tapped email auth button", { mode, email });
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        console.log("Attempting sign in with email");
        await signInWithEmail(email, password);
        console.log("Sign in successful, navigating to onboarding");
        router.replace("/onboarding");
      } else {
        console.log("Attempting sign up with email");
        await signUpWithEmail(email, password, name);
        Alert.alert(
          "Success",
          "Account created! Please check your email to verify your account."
        );
        console.log("Sign up successful, navigating to onboarding");
        router.replace("/onboarding");
      }
    } catch (error: any) {
      console.log("Email auth error:", error);
      Alert.alert("Error", error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: "google" | "apple" | "github") => {
    console.log("User tapped social auth button:", provider);
    setLoading(true);
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else if (provider === "apple") {
        await signInWithApple();
      } else if (provider === "github") {
        await signInWithGitHub();
      }
      console.log("Social auth successful, navigating to onboarding");
      router.replace("/onboarding");
    } catch (error: any) {
      console.log("Social auth error:", error);
      Alert.alert("Error", error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <IconSymbol 
              ios_icon_name="leaf.fill" 
              android_material_icon_name="eco" 
              size={80} 
              color="#fff" 
            />
            <Text style={styles.appName}>SmallFarm Copilot</Text>
          </View>

          <Text style={styles.title}>
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </Text>

          {mode === "signup" && (
            <TextInput
              style={styles.input}
              placeholder="Name (optional)"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === "signin" ? "Sign In" : "Sign Up"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            <Text style={styles.switchModeText}>
              {mode === "signin"
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialAuth("google")}
            disabled={loading}
          >
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={() => handleSocialAuth("apple")}
            disabled={loading}
          >
            <Text style={[styles.socialButtonText, styles.appleButtonText]}>
              Continue with Apple
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: farmGreen,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    textAlign: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
    color: "#fff",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    color: "#000",
  },
  primaryButton: {
    height: 50,
    backgroundColor: farmGreenLight,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchModeButton: {
    marginTop: 16,
    alignItems: "center",
  },
  switchModeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#fff",
    fontSize: 14,
  },
  socialButton: {
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  socialButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  appleButton: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  appleButtonText: {
    color: "#fff",
  },
});
