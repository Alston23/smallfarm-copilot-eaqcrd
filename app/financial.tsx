
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors, farmGreen, appleRed } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';
import { authenticatedGet } from '@/utils/api';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

export default function FinancialScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
    profit: 0,
  });

  const loadFinancialSummary = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading financial summary');
      const data = await authenticatedGet<any[]>('/api/financial');
      console.log('Loaded financial summary');
      // Calculate summary from financial records
      const totalIncome = data.filter((r: any) => r.type === 'income').reduce((sum: number, r: any) => sum + r.amount, 0);
      const totalExpenses = data.filter((r: any) => r.type === 'expense').reduce((sum: number, r: any) => sum + r.amount, 0);
      setSummary({
        total_income: totalIncome,
        total_expenses: totalExpenses,
        profit: totalIncome - totalExpenses,
      });
    } catch (error) {
      console.error('Error loading financial summary:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinancialSummary();
  }, [loadFinancialSummary]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Financial Reports',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={farmGreen} />
            </View>
          ) : (
            <>
              <View style={[styles.summaryCard, { backgroundColor: farmGreen }]}>
                <Text style={styles.summaryLabel}>Net Profit</Text>
                <Text style={styles.summaryValue}>
                  ${summary.profit.toFixed(2)}
                </Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <IconSymbol
                    ios_icon_name="arrow.up.circle.fill"
                    android_material_icon_name="arrow-upward"
                    size={32}
                    color={farmGreen}
                  />
                  <Text style={[styles.statLabel, { color: colors.icon }]}>Income</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    ${summary.total_income.toFixed(2)}
                  </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <IconSymbol
                    ios_icon_name="arrow.down.circle.fill"
                    android_material_icon_name="arrow-downward"
                    size={32}
                    color={appleRed}
                  />
                  <Text style={[styles.statLabel, { color: colors.icon }]}>Expenses</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    ${summary.total_expenses.toFixed(2)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: farmGreen }]}
                onPress={() => {
                  console.log('User tapped Add Transaction button');
                  router.push('/add-transaction');
                }}
              >
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.buttonText}>Add Transaction</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => {
                  console.log('User tapped View Detailed Reports button');
                  router.push('/financial-reports');
                }}
              >
                <IconSymbol
                  ios_icon_name="doc.text.fill"
                  android_material_icon_name="description"
                  size={20}
                  color={colors.text}
                />
                <Text style={[styles.buttonText, { color: colors.text }]}>View Detailed Reports</Text>
              </TouchableOpacity>
            </>
          )}
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
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  summaryCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
