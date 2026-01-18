
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Platform } from "react-native";
import { authClient, storeWebBearerToken, BEARER_TOKEN_KEY } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// CRITICAL: Timeout for auth operations to prevent indefinite hanging
const AUTH_TIMEOUT_MS = 2000; // 2 seconds - must complete before app startup timeout

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Failed to open popup. Please allow popups."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success" && event.data?.token) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve(event.data.token);
      } else if (event.data?.type === "oauth-error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || "OAuth failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentication cancelled"));
      }
    }, 500);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    console.log("🔐 AuthContext: Starting user fetch with", AUTH_TIMEOUT_MS, "ms timeout");
    
    try {
      setLoading(true);
      
      // CRITICAL: Create a timeout promise that resolves (not rejects) after AUTH_TIMEOUT_MS
      // This ensures loading ALWAYS becomes false, preventing indefinite hanging
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn("⚠️ AuthContext: Auth check timed out after", AUTH_TIMEOUT_MS, "ms");
          resolve(null);
        }, AUTH_TIMEOUT_MS);
      });

      // Race between the actual auth check and the timeout
      const session = await Promise.race([
        authClient.getSession().catch((error) => {
          console.error("⚠️ AuthContext: getSession failed:", error);
          return null;
        }),
        timeoutPromise
      ]);

      if (session?.data?.user) {
        console.log("✅ AuthContext: User session found:", session.data.user.email);
        setUser(session.data.user as User);
        
        // Get token from storage
        try {
          if (Platform.OS === "web") {
            const storedToken = localStorage.getItem(BEARER_TOKEN_KEY);
            setToken(storedToken);
          } else {
            const storedToken = await authClient.getToken();
            setToken(storedToken?.token || null);
          }
        } catch (tokenError) {
          console.error("⚠️ AuthContext: Failed to get token:", tokenError);
          setToken(null);
        }
      } else {
        console.log("ℹ️ AuthContext: No user session found (timeout or no session)");
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error("⚠️ AuthContext: Failed to fetch user (defaulting to signed out):", error);
      setUser(null);
      setToken(null);
    } finally {
      // CRITICAL: Always set loading to false, even on error
      setLoading(false);
      console.log("🏁 AuthContext: User fetch complete, loading=false");
    }
  }, []);

  useEffect(() => {
    console.log("🚀 AuthContext: Initial mount, fetching user");
    fetchUser();
  }, [fetchUser]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("📧 Signing in with email:", email);
      await authClient.signIn.email({ email, password });
      await fetchUser();
    } catch (error) {
      console.error("❌ Email sign in failed:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log("📝 Signing up with email:", email);
      await authClient.signUp.email({
        email,
        password,
        name,
      });
      await fetchUser();
    } catch (error) {
      console.error("❌ Email sign up failed:", error);
      throw error;
    }
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    try {
      console.log(`🔗 Signing in with ${provider}`);
      if (Platform.OS === "web") {
        const token = await openOAuthPopup(provider);
        storeWebBearerToken(token);
        await fetchUser();
      } else {
        await authClient.signIn.social({
          provider,
          callbackURL: "/onboarding",
        });
        await fetchUser();
      }
    } catch (error) {
      console.error(`❌ ${provider} sign in failed:`, error);
      throw error;
    }
  };

  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithApple = () => signInWithSocial("apple");
  const signInWithGitHub = () => signInWithSocial("github");

  const signOut = async () => {
    try {
      console.log("👋 Signing out");
      await authClient.signOut();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error("❌ Sign out failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
