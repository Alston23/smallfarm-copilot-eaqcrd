
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors, farmGreen, appleRed } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet } from '@/utils/api';

interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  cropId?: string;
  cropName?: string;
}

export default function ProfitLossScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    byCrop: {} as Record<string, { income: number; expenses: number; profit: number }>,
    byMonth: {} as Record<string, { income: number; expenses: number; profit: number }>,
  });

  const loadProfitLossData = useCallback(async () => {
    console.log('Loading profit & loss data');
    setLoading(true);
    try {
      const data = await authenticatedGet<FinancialTransaction[]>('/api/financial');
      console.log('Loaded financial data:', data.length, 'transactions');
      
      const incomeTransactions = data.filter(t => t.type === 'income');
      const expenseTransactions = data.filter(t => t.type === 'expense');
      
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
      
      // Group by crop
      const byCrop: Record<string, { income: number; expenses: number; profit: number }> = {};
      incomeTransactions.forEach(t => {
        if (t.cropName) {
          if (!byCrop[t.cropName]) {
            byCrop[t.cropName] = { income: 0, expenses: 0, profit: 0 };
          }
          byCrop[t.cropName].income += t.amount;
        }
      });
      expenseTransactions.forEach(t => {
        if (t.cropName) {
          if (!byCrop[t.cropName]) {
            byCrop[t.cropName] = { income: 0, expenses: 0, profit: 0 };
          }
          byCrop[t.cropName].expenses += t.amount;
        }
      });
      Object.keys(byCrop).forEach(crop => {
        byCrop[crop].profit = byCrop[crop].income - byCrop[crop].expenses;
      });
      
      // Group by month
      const byMonth: Record<string, { income: number; expenses: number; profit: number }> = {};
      incomeTransactions.forEach(t => {
        const month = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!byMonth[month]) {
          byMonth[month] = { income: 0, expenses: 0, profit: 0 };
        }
        byMonth[month].income += t.amount;
      });
      expenseTransactions.forEach(t => {
        const month = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!byMonth[month]) {
          byMonth[month] = { income: 0, expenses: 0, profit: 0 };
        }
        byMonth[month].expenses += t.amount;
      });
      Object.keys(byMonth).forEach(month => {
        byMonth[month].profit = byMonth[month].income - byMonth[month].expenses;
      });
      
      setSummary({ totalIncome, totalExpenses, netProfit, profitMargin, byCrop, byMonth });
    } catch (error) {
      console.error('Error loading profit & loss data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfitLossData();
  }, [loadProfitLossData]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profit & Loss Statement',
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
              {/* Summary Cards */}
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, { backgroundColor: farmGreen }]}>
                  <IconSymbol
                    ios_icon_name="arrow.up.circle.fill"
                    android_material_icon_name="arrow-upward"
                    size={32}
                    color="#fff"
                  />
                  <Text style={styles.summaryLabel}>Income</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(summary.totalIncome)}</Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: appleRed }]}>
                  <IconSymbol
                    ios_icon_name="arrow.down.circle.fill"
                    android_material_icon_name="arrow-downward"
                    size={32}
                    color="#fff"
                  />
                  <Text style={styles.summaryLabel}>Expenses</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(summary.totalExpenses)}</Text>
                </View>
              </View>

              {/* Net Profit Card */}
              <View style={[styles.profitCard, { backgroundColor: summary.netProfit >= 0 ? farmGreen : appleRed }]}>
                <Text style={styles.profitLabel}>Net Profit</Text>
                <Text style={styles.profitValue}>{formatCurrency(summary.netProfit)}</Text>
                <Text style={styles.profitMargin}>
                  Profit Margin: {formatPercent(summary.profitMargin)}
                </Text>
              </View>

              {/* Profit by Crop */}
              {Object.keys(summary.byCrop).length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Profit by Crop</Text>
                  {Object.entries(summary.byCrop)
                    .sort(([, a], [, b]) => b.profit - a.profit)
                    .map(([crop, data], index) => (
                      <View key={index} style={[styles.cropCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.cropHeader}>
                          <IconSymbol
                            ios_icon_name="leaf.fill"
                            android_material_icon_name="local-florist"
                            size={24}
                            color={data.profit >= 0 ? farmGreen : appleRed}
                          />
                          <Text style={[styles.cropName, { color: colors.text }]}>{crop}</Text>
                        </View>
                        <View style={styles.cropDetails}>
                          <View style={styles.cropRow}>
                            <Text style={[styles.cropLabel, { color: colors.icon }]}>Income:</Text>
                            <Text style={[styles.cropValue, { color: farmGreen }]}>{formatCurrency(data.income)}</Text>
                          </View>
                          <View style={styles.cropRow}>
                            <Text style={[styles.cropLabel, { color: colors.icon }]}>Expenses:</Text>
                            <Text style={[styles.cropValue, { color: appleRed }]}>{formatCurrency(data.expenses)}</Text>
                          </View>
                          <View style={[styles.cropRow, styles.cropRowBorder, { borderTopColor: colors.border }]}>
                            <Text style={[styles.cropLabel, { color: colors.text, fontWeight: 'bold' }]}>Profit:</Text>
                            <Text style={[styles.cropValue, { color: data.profit >= 0 ? farmGreen : appleRed, fontWeight: 'bold' }]}>
                              {formatCurrency(data.profit)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                </View>
              )}

              {/* Profit by Month */}
              {Object.keys(summary.byMonth).length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Profit by Month</Text>
                  {Object.entries(summary.byMonth)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([month, data], index) => (
                      <View key={index} style={[styles.monthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.monthHeader}>
                          <IconSymbol
                            ios_icon_name="calendar"
                            android_material_icon_name="calendar-today"
                            size={20}
                            color={colors.icon}
                          />
                          <Text style={[styles.monthName, { color: colors.text }]}>{month}</Text>
                        </View>
                        <View style={styles.monthDetails}>
                          <Text style={[styles.monthLabel, { color: colors.icon }]}>
                            Income: <Text style={{ color: farmGreen }}>{formatCurrency(data.income)}</Text>
                          </Text>
                          <Text style={[styles.monthLabel, { color: colors.icon }]}>
                            Expenses: <Text style={{ color: appleRed }}>{formatCurrency(data.expenses)}</Text>
                          </Text>
                          <Text style={[styles.monthProfit, { color: data.profit >= 0 ? farmGreen : appleRed }]}>
                            {formatCurrency(data.profit)}
                          </Text>
                        </View>
                      </View>
                    ))}
                </View>
              )}

              {summary.totalIncome === 0 && summary.totalExpenses === 0 && (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="doc.text"
                    android_material_icon_name="description"
                    size={64}
                    color={colors.icon}
                  />
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    No financial data found
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    opacity: 0.9,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  profitCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  profitLabel: {
    color: '#fff',
    fontSize: 18,
    opacity: 0.9,
  },
  profitValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 8,
  },
  profitMargin: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cropCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cropName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cropDetails: {
    gap: 8,
  },
  cropRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropRowBorder: {
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
  },
  cropLabel: {
    fontSize: 14,
  },
  cropValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthName: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthDetails: {
    alignItems: 'flex-end',
  },
  monthLabel: {
    fontSize: 12,
  },
  monthProfit: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
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
