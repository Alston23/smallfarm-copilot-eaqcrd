
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
import { Colors, farmGreen } from '@/constants/Colors';
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

interface MonthlyIncome {
  month: string;
  income: number;
  transactionCount: number;
}

export default function SeasonalIncomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState<MonthlyIncome[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);

  const loadIncomeData = useCallback(async () => {
    console.log('Loading seasonal income data');
    setLoading(true);
    try {
      const data = await authenticatedGet<FinancialTransaction[]>('/api/financial');
      console.log('Loaded financial data:', data.length, 'transactions');
      
      const incomeTransactions = data.filter(t => t.type === 'income');
      
      // Group by month
      const monthMap: Record<string, { income: number; count: number }> = {};
      incomeTransactions.forEach(t => {
        const date = new Date(t.date);
        const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        if (!monthMap[monthLabel]) {
          monthMap[monthLabel] = { income: 0, count: 0 };
        }
        
        monthMap[monthLabel].income += t.amount;
        monthMap[monthLabel].count += 1;
      });
      
      const incomeData: MonthlyIncome[] = Object.entries(monthMap).map(([month, data]) => ({
        month,
        income: data.income,
        transactionCount: data.count,
      }));
      
      // Sort by date (most recent first)
      incomeData.sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateB.getTime() - dateA.getTime();
      });
      
      setMonthlyIncome(incomeData);
      
      const total = incomeData.reduce((sum, m) => sum + m.income, 0);
      setTotalIncome(total);
    } catch (error) {
      console.error('Error loading income data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncomeData();
  }, [loadIncomeData]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getMaxIncome = () => {
    if (monthlyIncome.length === 0) return 0;
    return Math.max(...monthlyIncome.map(m => m.income));
  };

  const getBarWidth = (income: number) => {
    const maxIncome = getMaxIncome();
    if (maxIncome === 0) return 0;
    return (income / maxIncome) * 100;
  };

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
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={farmGreen} />
            </View>
          ) : (
            <>
              {/* Total Income Card */}
              <View style={[styles.totalCard, { backgroundColor: farmGreen }]}>
                <IconSymbol
                  ios_icon_name="calendar.badge.plus"
                  android_material_icon_name="calendar-today"
                  size={48}
                  color="#fff"
                />
                <Text style={styles.totalLabel}>Total Income</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalIncome)}</Text>
                <Text style={styles.totalSubtext}>{monthlyIncome.length} months tracked</Text>
              </View>

              {/* Monthly Income Chart */}
              {monthlyIncome.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Income Trends</Text>
                  {monthlyIncome.map((month, index) => (
                    <View key={index} style={[styles.monthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.monthHeader}>
                        <View style={styles.monthLeft}>
                          <IconSymbol
                            ios_icon_name="calendar"
                            android_material_icon_name="event"
                            size={24}
                            color={colors.text}
                          />
                          <View>
                            <Text style={[styles.monthName, { color: colors.text }]}>{month.month}</Text>
                            <Text style={[styles.monthSubtext, { color: colors.icon }]}>
                              {month.transactionCount} {month.transactionCount === 1 ? 'transaction' : 'transactions'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.monthIncome, { color: farmGreen }]}>
                          {formatCurrency(month.income)}
                        </Text>
                      </View>
                      
                      {/* Bar chart */}
                      <View style={[styles.barContainer, { backgroundColor: colors.border }]}>
                        <View 
                          style={[
                            styles.barFill, 
                            { 
                              backgroundColor: farmGreen,
                              width: `${getBarWidth(month.income)}%`
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={64}
                    color={colors.icon}
                  />
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    No seasonal income data found
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                    Add income transactions to see seasonal trends
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
  totalSubtext: {
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
  },
  monthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  monthName: {
    fontSize: 18,
    fontWeight: '600',
  },
  monthSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  monthIncome: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  barContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
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
