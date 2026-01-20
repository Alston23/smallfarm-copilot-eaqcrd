
import React from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';

export default function YieldRevenueScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Yield vs Revenue', headerBackTitle: 'Back' }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.comingSoonContainer}>
            <IconSymbol ios_icon_name="chart.bar.xaxis" android_material_icon_name="agriculture" size={80} color={farmGreen} />
            <Text style={[styles.comingSoonTitle, { color: colors.text }]}>Yield vs Revenue</Text>
            <Text style={[styles.comingSoonText, { color: colors.icon }]}>
              Compare crop yields to revenue generated for profitability insights.
            </Text>
            <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Coming Soon:</Text>
              <Text style={[styles.featureItem, { color: colors.icon }]}>• Yield amounts by crop</Text>
              <Text style={[styles.featureItem, { color: colors.icon }]}>• Revenue per pound/unit</Text>
              <Text style={[styles.featureItem, { color: colors.icon }]}>• Yield efficiency analysis</Text>
              <Text style={[styles.featureItem, { color: colors.icon }]}>• Price per unit trends</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  comingSoonContainer: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  comingSoonTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 24, marginBottom: 12, textAlign: 'center' },
  comingSoonText: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  featureCard: { width: '100%', padding: 20, borderRadius: 12, borderWidth: 1 },
  featureTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  featureItem: { fontSize: 15, lineHeight: 28 },
});
