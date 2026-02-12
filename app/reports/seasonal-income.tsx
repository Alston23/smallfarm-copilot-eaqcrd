
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

export default function SeasonalIncomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Seasonal Income',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={[styles.placeholderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="calendar.badge.clock"
              android_material_icon_name="calendar-today"
              size={64}
              color={farmGreen}
            />
            <Text style={[styles.placeholderTitle, { color: colors.text }]}>
              Seasonal Income Report
            </Text>
            <Text style={[styles.placeholderDescription, { color: colors.icon }]}>
              Track income trends across seasons and months, including:
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color={farmGreen}
                />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Monthly income breakdown
                </Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color={farmGreen}
                />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Seasonal revenue patterns
                </Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color={farmGreen}
                />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Peak earning periods
                </Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color={farmGreen}
                />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Year-over-year comparisons
                </Text>
              </View>
            </View>
            <Text style={[styles.placeholderNote, { color: colors.icon }]}>
              Income data is automatically tracked from your financial transactions. Add more transactions to see detailed seasonal trends.
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
    marginBottom: 24,
    lineHeight: 24,
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  placeholderNote: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
