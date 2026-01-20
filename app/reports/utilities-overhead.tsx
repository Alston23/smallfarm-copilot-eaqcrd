
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';

export default function UtilitiesOverheadScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Utilities & Overhead',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={[styles.placeholderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="bolt.fill"
              android_material_icon_name="home"
              size={64}
              color={farmGreen}
            />
            <Text style={[styles.placeholderTitle, { color: colors.text }]}>
              Utilities & Overhead Report
            </Text>
            <Text style={[styles.placeholderDescription, { color: colors.icon }]}>
              Track water, electricity, insurance, and other overhead costs. Add these expenses to your financial transactions with categories like "Utilities", "Insurance", or "Overhead" to populate this report.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  placeholderCard: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
