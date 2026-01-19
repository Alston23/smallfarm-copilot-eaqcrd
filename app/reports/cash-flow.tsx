
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

interface MonthlyFlow {
  month: string;
  income: number;
  expenses: number;
  netFlow: number;
}

export default function CashFlowScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [monthlyFlow, setMonthlyFlow] = useState<MonthlyFlow[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
  });

  const loadCashFlowData = useCallback(async () => {
    console.log('Loading cash flow data');
    setLoading(true);
    try {
      const data = await authenticatedGet<FinancialTransaction[]>('/api/financial');
      console.log('Loaded financial data:', data.length, 'transactions');
      
      // Group by month
      const monthMap: Record<string, { income: number; expenses: number }> = {};
      data.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        if (!monthMap[monthLabel]) {
          monthMap[monthLabel] = { income: 0, expenses: 0 };
        }
        
        if (t.type === 'income') {
          monthMap[monthLabel].income += t.amount;
        } else {
          monthMap[monthLabel].expenses += t.amount;
        }
      });
      
      const flowData: MonthlyFlow[] = Object.entries(monthMap).map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        netFlow: data.income - data.expenses,
      }));
      
      // Sort by date (most recent first)
      flowData.sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateB.getTime() - dateA.getTime();
      });
      
      setMonthlyFlow(flowData);
      
      const totalIncome = flowData.reduce((sum, m) => sum + m.income, 0);
      const totalExpenses = flowData.reduce((sum, m) => sum + m.expenses, 0);
      setSummary({
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
      });
    } catch (error) {
      console.error('Error loading cash flow data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCashFlowData();
  }, [loadCashFlowData]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Cash Flow Statement',
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
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: farmGreen }]}>
                  <IconSymbol
                    ios_icon_name="arrow.up.circle.fill"
                    android_material_icon_name="arrow-upward"
                    size={32}
                    color="#fff"
                  />
                  <Text style={styles.summaryLabel}>Total Income</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(summary.totalIncome)}</Text>
                </View>
                
                <View style={[styles.summaryCard, { backgroundColor: appleRed }]}>
                  <IconSymbol
                    ios_icon_name="arrow.down.circle.fill"
                    android_material_icon_name="arrow-downward"
                    size={32}
                    color="#fff"
                  />
                  <Text style={styles.summaryLabel}>Total Expenses</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(summary.totalExpenses)}</Text>
                </View>
              </View>

              {/* Net Cash Flow Card */}
              <View style={[
                styles.netFlowCard, 
                { backgroundColor: summary.netCashFlow >= 0 ? farmGreen : appleRed }
              ]}>
                <IconSymbol
                  ios_icon_name="chart.line.uptrend.xyaxis"
                  android_material_icon_name="trending-up"
                  size={48}
                  color="#fff"
                />
                <Text style={styles.netFlowLabel}>Net Cash Flow</Text>
                <Text style={styles.netFlowValue}>{formatCurrency(summary.netCashFlow)}</Text>
                <Text style={styles.netFlowSubtext}>
                  {summary.netCashFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
                </Text>
              </View>

              {/* Monthly Cash Flow */}
              {monthlyFlow.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Cash Flow</Text>
                  {monthlyFlow.map((month, index) => (
                    <View key={index} style={[styles.monthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.monthHeader}>
                        <View style={styles.monthLeft}>
                          <IconSymbol
                            ios_icon_name="calendar"
                            android_material_icon_name="calendar-today"
                            size={24}
                            color={colors.text}
                          />
                          <Text style={[styles.monthName, { color: colors.text }]}>{month.month}</Text>
                        </View>
                        <Text style={[
                          styles.monthNetFlow,
                          { color: month.netFlow >= 0 ? farmGreen : appleRed }
                        ]}>
                          {month.netFlow >= 0 ? '+' : ''}{formatCurrency(month.netFlow)}
                        </Text>
                      </View>
                      
                      <View style={styles.monthDetails}>
                        <View style={styles.detailRow}>
                          <View style={styles.detailLeft}>
                            <View style={[styles.detailDot, { backgroundColor: farmGreen }]} />
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>Income</Text>
                          </View>
                          <Text style={[styles.detailValue, { color: farmGreen }]}>
                            {formatCurrency(month.income)}
                          </Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                          <View style={styles.detailLeft}>
                            <View style={[styles.detailDot, { backgroundColor: appleRed }]} />
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>Expenses</Text>
                          </View>
                          <Text style={[styles.detailValue, { color: appleRed }]}>
                            {formatCurrency(month.expenses)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="chart.line.uptrend.xyaxis"
                    android_material_icon_name="show-chart"
                    size={64}
                    color={colors.icon}
                  />
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    No cash flow data found
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                    Add income and expense transactions to see cash flow analysis
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 13,
    marginTop: 8,
    opacity: 0.9,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  netFlowCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  netFlowLabel: {
    color: '#fff',
    fontSize: 18,
    marginTop: 12,
    opacity: 0.9,
  },
  netFlowValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 8,
  },
  netFlowSubtext: {
    color: '#fff',
    fontSize: 16,
    marginTop: 4,
    opacity: 0.8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  monthCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  monthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthName: {
    fontSize: 18,
    fontWeight: '600',
  },
  monthNetFlow: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
