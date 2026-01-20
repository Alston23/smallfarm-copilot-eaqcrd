import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="crops" name="(crops)">
        <Icon sf="leaf.fill" />
        <Label>Crops</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="fields" name="fields">
        <Icon sf="square.grid.3x3.fill" />
        <Label>Fields</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="schedule" name="schedule">
        <Icon sf="calendar" />
        <Label>Schedule</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="inventory" name="inventory">
        <Icon sf="shippingbox.fill" />
        <Label>Inventory</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="equipment" name="equipment">
        <Icon sf="wrench.and.screwdriver.fill" />
        <Label>Equipment</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="marketplace" name="marketplace">
        <Icon sf="storefront.fill" />
        <Label>Marketplace</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="more" name="more">
        <Icon sf="ellipsis.circle.fill" />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
