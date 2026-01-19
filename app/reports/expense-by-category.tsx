
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

interface CategoryExpense {
  category: string;
  totalAmount: number;
  transactionCount: number;
  averageExpense: number;
}

export default function ExpenseByCategoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const loadExpenseData = useCallback(async () => {
    console.log('Loading expenses by category data');
    setLoading(true);
    try {
      const data = await authenticatedGet<FinancialTransaction[]>('/api/financial');
      console.log('Loaded financial data:', data.length, 'transactions');
      
      const expenseTransactions = data.filter(t => t.type === 'expense');
      
      // Group by category
      const categoryMap: Record<string, { total: number; count: number }> = {};
      expenseTransactions.forEach(t => {
        if (!categoryMap[t.category]) {
          categoryMap[t.category] = { total: 0, count: 0 };
        }
        categoryMap[t.category].total += t.amount;
        categoryMap[t.category].count += 1;
      });
      
      const expenseData: CategoryExpense[] = Object.entries(categoryMap).map(([category, data]) => ({
        category,
        totalAmount: data.total,
        transactionCount: data.count,
        averageExpense: data.total / data.count,
      }));
      
      expenseData.sort((a, b) => b.totalAmount - a.totalAmount);
      setCategoryExpenses(expenseData);
      
      const total = expenseData.reduce((sum, cat) => sum + cat.totalAmount, 0);
      setTotalExpenses(total);
    } catch (error) {
      console.error('Error loading expense data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenseData();
  }, [loadExpenseData]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getPercentage = (amount: number) => {
    if (totalExpenses === 0) return 0;
    return ((amount / totalExpenses) * 100).toFixed(1);
  };

  const getCategoryIcon = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('seed') || lowerCategory.includes('plant')) return 'local-florist';
    if (lowerCategory.includes('labor') || lowerCategory.includes('wage')) return 'work';
    if (lowerCategory.includes('equipment') || lowerCategory.includes('tool')) return 'build';
    if (lowerCategory.includes('fertilizer') || lowerCategory.includes('soil')) return 'grass';
    if (lowerCategory.includes('water') || lowerCategory.includes('irrigation')) return 'water-drop';
    if (lowerCategory.includes('fuel') || lowerCategory.includes('gas')) return 'local-gas-station';
    if (lowerCategory.includes('maintenance') || lowerCategory.includes('repair')) return 'construction';
    if (lowerCategory.includes('insurance')) return 'security';
    return 'category';
  };

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
              {/* Total Expenses Card */}
              <View style={[styles.totalCard, { backgroundColor: appleRed }]}>
                <IconSymbol
                  ios_icon_name="chart.pie.fill"
                  android_material_icon_name="pie-chart"
                  size={48}
                  color="#fff"
                />
                <Text style={styles.totalLabel}>Total Expenses</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalExpenses)}</Text>
                <Text style={styles.totalSubtext}>{categoryExpenses.length} categories</Text>
              </View>

              {/* Expenses by Category */}
              {categoryExpenses.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending by Category</Text>
                  {categoryExpenses.map((category, index) => (
                    <View key={index} style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.categoryHeader}>
                        <View style={styles.categoryLeft}>
                          <IconSymbol
                            ios_icon_name="tag.fill"
                            android_material_icon_name={getCategoryIcon(category.category)}
                            size={28}
                            color={appleRed}
                          />
                          <View>
                            <Text style={[styles.categoryName, { color: colors.text }]}>{category.category}</Text>
                            <Text style={[styles.categorySubtext, { color: colors.icon }]}>
                              {category.transactionCount} {category.transactionCount === 1 ? 'transaction' : 'transactions'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.categoryRight}>
                          <Text style={[styles.categoryAmount, { color: appleRed }]}>
                            {formatCurrency(category.totalAmount)}
                          </Text>
                          <Text style={[styles.categoryPercentage, { color: colors.icon }]}>
                            {getPercentage(category.totalAmount)}% of total
                          </Text>
                        </View>
                      </View>
                      
                      {/* Progress bar */}
                      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              backgroundColor: appleRed,
                              width: `${getPercentage(category.totalAmount)}%`
                            }
                          ]} 
                        />
                      </View>
                      
                      <View style={styles.categoryStats}>
                        <View style={styles.statItem}>
                          <Text style={[styles.statLabel, { color: colors.icon }]}>Avg Transaction</Text>
                          <Text style={[styles.statValue, { color: colors.text }]}>
                            {formatCurrency(category.averageExpense)}
                          </Text>
                        </View>
                      </View>
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
                  <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                    Add expense transactions to see spending by category
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
  categoryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
  },
  categorySubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryPercentage: {
    fontSize: 13,
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
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
