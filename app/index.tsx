
import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
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

  if (user && !user.onboarding_completed && user.show_onboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/crops" />;
}
