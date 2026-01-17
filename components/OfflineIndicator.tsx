
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from './IconSymbol';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('Network state changed:', state.isConnected);
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: '#fbbf24' }]}>
      <IconSymbol
        ios_icon_name="wifi.slash"
        android_material_icon_name="wifi-off"
        size={16}
        color="#92400e"
      />
      <Text style={styles.text}>Offline Mode - Changes will sync when online</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
  },
});
