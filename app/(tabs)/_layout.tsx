
import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import FloatingTabBar from '@/components/FloatingTabBar';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} tabs={[
        {
          name: '(crops)',
          title: 'Crops',
          icon: 'eco',
          iosIcon: 'leaf.fill',
          href: '/(tabs)/(crops)',
        },
        {
          name: 'fields',
          title: 'Fields',
          icon: 'grid-on',
          iosIcon: 'square.grid.2x2',
          href: '/(tabs)/fields',
        },
        {
          name: 'schedule',
          title: 'Schedule',
          icon: 'calendar-today',
          iosIcon: 'calendar',
          href: '/(tabs)/schedule',
        },
        {
          name: 'inventory',
          title: 'Inventory',
          icon: 'inventory',
          iosIcon: 'cube.box.fill',
          href: '/(tabs)/inventory',
        },
        {
          name: 'more',
          title: 'More',
          icon: 'menu',
          iosIcon: 'ellipsis.circle.fill',
          href: '/(tabs)/more',
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
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
