
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface User {
  id: string;
  email: string;
  name: string;
  location?: string;
  onboarding_completed: boolean;
  show_onboarding: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, location?: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateOnboarding: (completed: boolean, showAgain: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('auth_token');
      const storedUser = await SecureStore.getItemAsync('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('User attempting login with email:', email);
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    console.log('Login successful for user:', data.user.email);
    
    await SecureStore.setItemAsync('auth_token', data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string, location?: string) => {
    console.log('User attempting registration with email:', email);
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, location }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    console.log('Registration successful for user:', data.user.email);
    
    await SecureStore.setItemAsync('auth_token', data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    console.log('User logging out');
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    console.log('User requesting password reset for email:', email);
    const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset failed');
    }
  };

  const updateOnboarding = async (completed: boolean, showAgain: boolean) => {
    if (!user) return;
    
    console.log('Updating onboarding status:', { completed, showAgain });
    // Update locally since backend doesn't have this endpoint yet
    const updatedUser = {
      ...user,
      onboarding_completed: completed,
      show_onboarding: showAgain,
    };
    await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    if (!token || !user) return;
    
    // Refresh user data from storage
    const storedUser = await SecureStore.getItemAsync('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        updateOnboarding,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
