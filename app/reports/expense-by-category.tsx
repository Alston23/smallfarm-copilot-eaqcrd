
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors, farmGreen, appleRed } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet } from '@/utils/api';

interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

export default function ExpenseByCategoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [loading, setLoading] = useState(true);
  const [categoryExpenses, setCategoryExpenses] = useState<Record<string, number>>({});
  const [totalExpenses, setTotalExpenses] = useState(0);

  const loadExpenseData = useCallback(async () => {
    console.log('Loading expense by category data');
    setLoading(true);
    try {
      const data = await authenticatedGet<FinancialTransaction[]>('/api/financial');
      const expenses = data.filter(t => t.type === 'expense');
      
      const byCategory: Record<string, number> = {};
      expenses.forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      });
      
      setCategoryExpenses(byCategory);
      setTotalExpenses(expenses.reduce((sum, t) => sum + t.amount, 0));
    } catch (error) {
      console.error('Error loading expense data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenseData();
  }, [loadExpenseData]);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const getPercentage = (amount: number) => totalExpenses === 0 ? 0 : ((amount / totalExpenses) * 100).toFixed(1);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Expenses by Category',
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
              <View style={[styles.totalCard, { backgroundColor: appleRed }]}>
                <IconSymbol
                  ios_icon_name="chart.pie.fill"
                  android_material_icon_name="pie-chart"
                  size={48}
                  color="#fff"
                />
                <Text style={styles.totalLabel}>Total Expenses</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalExpenses)}</Text>
              </View>

              {Object.keys(categoryExpenses).length > 0 ? (
                <View style={styles.section}>
                  {Object.entries(categoryExpenses)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount], index) => (
                      <View key={index} style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.categoryHeader}>
                          <Text style={[styles.categoryName, { color: colors.text }]}>{category}</Text>
                          <Text style={[styles.categoryAmount, { color: appleRed }]}>{formatCurrency(amount)}</Text>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                          <View style={[styles.progressFill, { backgroundColor: appleRed, width: `${getPercentage(amount)}%` }]} />
                        </View>
                        <Text style={[styles.categoryPercentage, { color: colors.icon }]}>
                          {getPercentage(amount)}% of total expenses
                        </Text>
                      </View>
                    ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="chart.pie"
                    android_material_icon_name="pie-chart"
                    size={64}
                    color={colors.icon}
                  />
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    No expense data found
                  </Text>
                </View>
              )}
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
  totalCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 18,
    marginTop: 12,
    opacity: 0.9,
  },
  totalValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 8,
  },
  section: {
    gap: 12,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});
