
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

export default function IncomeSummaryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    byCrop: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    byMonth: {} as Record<string, number>,
  });

  const loadIncomeData = useCallback(async () => {
    console.log('Loading income summary data');
    setLoading(true);
    try {
      const data = await authenticatedGet<FinancialTransaction[]>('/api/financial');
      console.log('Loaded financial data:', data.length, 'transactions');
      
      const incomeTransactions = data.filter(t => t.type === 'income');
      setTransactions(incomeTransactions);
      
      // Calculate summary
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Group by crop
      const byCrop: Record<string, number> = {};
      incomeTransactions.forEach(t => {
        if (t.cropName) {
          byCrop[t.cropName] = (byCrop[t.cropName] || 0) + t.amount;
        }
      });
      
      // Group by category
      const byCategory: Record<string, number> = {};
      incomeTransactions.forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      });
      
      // Group by month
      const byMonth: Record<string, number> = {};
      incomeTransactions.forEach(t => {
        const month = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        byMonth[month] = (byMonth[month] || 0) + t.amount;
      });
      
      setSummary({ totalIncome, byCrop, byCategory, byMonth });
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Income Summary',
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
                  ios_icon_name="dollarsign.circle.fill"
                  android_material_icon_name="attach-money"
                  size={48}
                  color="#fff"
                />
                <Text style={styles.totalLabel}>Total Income</Text>
                <Text style={styles.totalValue}>{formatCurrency(summary.totalIncome)}</Text>
              </View>

              {/* Income by Crop */}
              {Object.keys(summary.byCrop).length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Income by Crop</Text>
                  {Object.entries(summary.byCrop)
                    .sort(([, a], [, b]) => b - a)
                    .map(([crop, amount], index) => (
                      <View key={index} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.itemLeft}>
                          <IconSymbol
                            ios_icon_name="leaf.fill"
                            android_material_icon_name="local-florist"
                            size={24}
                            color={farmGreen}
                          />
                          <Text style={[styles.itemLabel, { color: colors.text }]}>{crop}</Text>
                        </View>
                        <Text style={[styles.itemValue, { color: farmGreen }]}>{formatCurrency(amount)}</Text>
                      </View>
                    ))}
                </View>
              )}

              {/* Income by Category */}
              {Object.keys(summary.byCategory).length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Income by Category</Text>
                  {Object.entries(summary.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount], index) => (
                      <View key={index} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.itemLeft}>
                          <IconSymbol
                            ios_icon_name="tag.fill"
                            android_material_icon_name="category"
                            size={24}
                            color={farmGreen}
                          />
                          <Text style={[styles.itemLabel, { color: colors.text }]}>{category}</Text>
                        </View>
                        <Text style={[styles.itemValue, { color: farmGreen }]}>{formatCurrency(amount)}</Text>
                      </View>
                    ))}
                </View>
              )}

              {/* Income by Month */}
              {Object.keys(summary.byMonth).length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Income by Month</Text>
                  {Object.entries(summary.byMonth)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([month, amount], index) => (
                      <View key={index} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.itemLeft}>
                          <IconSymbol
                            ios_icon_name="calendar"
                            android_material_icon_name="calendar-today"
                            size={24}
                            color={farmGreen}
                          />
                          <Text style={[styles.itemLabel, { color: colors.text }]}>{month}</Text>
                        </View>
                        <Text style={[styles.itemValue, { color: farmGreen }]}>{formatCurrency(amount)}</Text>
                      </View>
                    ))}
                </View>
              )}

              {transactions.length === 0 && (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="doc.text"
                    android_material_icon_name="description"
                    size={64}
                    color={colors.icon}
                  />
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    No income transactions found
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
