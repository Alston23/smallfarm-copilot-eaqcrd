
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';

export default function Index() {
  const { user, loading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      if (!loading && user) {
        try {
          const onboardingCompleted = await SecureStore.getItemAsync('onboarding_completed');
          setShouldShowOnboarding(onboardingCompleted !== 'true');
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setShouldShowOnboarding(false);
        }
      }
      setCheckingOnboarding(false);
    }
    checkOnboarding();
  }, [user, loading]);

  if (loading || checkingOnboarding) {
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

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (shouldShowOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/(crops)" />;
}
