
import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import FloatingTabBar from '@/components/FloatingTabBar';
import { OfflineIndicator } from '@/components/OfflineIndicator';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <OfflineIndicator />
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} tabs={[
        {
          name: '(crops)',
          label: 'Crops',
          icon: 'eco',
          route: '/(tabs)/(crops)',
        },
        {
          name: 'fields',
          label: 'Fields',
          icon: 'grid-on',
          route: '/(tabs)/fields',
        },
        {
          name: 'schedule',
          label: 'Schedule',
          icon: 'calendar-today',
          route: '/(tabs)/schedule',
        },
        {
          name: 'inventory',
          label: 'Inventory',
          icon: 'inventory',
          route: '/(tabs)/inventory',
        },
        {
          name: 'equipment',
          label: 'Equipment',
          icon: 'agriculture',
          route: '/(tabs)/equipment',
        },
        {
          name: 'marketplace',
          label: 'Marketplace',
          icon: 'store',
          route: '/(tabs)/marketplace',
        },
        {
          name: 'more',
          label: 'More',
          icon: 'menu',
          route: '/(tabs)/more',
        },
      ]} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="(crops)" />
      <Tabs.Screen name="fields" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="equipment" />
      <Tabs.Screen name="marketplace" />
      <Tabs.Screen name="more" />
      </Tabs>
    </>
  );
}
