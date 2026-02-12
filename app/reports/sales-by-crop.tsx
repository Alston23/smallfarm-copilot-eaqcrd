
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

interface CropSales {
  cropName: string;
  totalRevenue: number;
  transactionCount: number;
  averageSale: number;
}

export default function SalesByCropScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [cropSales, setCropSales] = useState<CropSales[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const loadSalesData = useCallback(async () => {
    console.log('Loading sales by crop data');
    setLoading(true);
    try {
      const data = await authenticatedGet<FinancialTransaction[]>('/api/financial');
      console.log('Loaded financial data:', data.length, 'transactions');
      
      const incomeTransactions = data.filter(t => t.type === 'income' && t.cropName);
      
      // Group by crop
      const cropMap: Record<string, { total: number; count: number }> = {};
      incomeTransactions.forEach(t => {
        if (t.cropName) {
          if (!cropMap[t.cropName]) {
            cropMap[t.cropName] = { total: 0, count: 0 };
          }
          cropMap[t.cropName].total += t.amount;
          cropMap[t.cropName].count += 1;
        }
      });
      
      const salesData: CropSales[] = Object.entries(cropMap).map(([cropName, data]) => ({
        cropName,
        totalRevenue: data.total,
        transactionCount: data.count,
        averageSale: data.total / data.count,
      }));
      
      salesData.sort((a, b) => b.totalRevenue - a.totalRevenue);
      setCropSales(salesData);
      
      const total = salesData.reduce((sum, crop) => sum + crop.totalRevenue, 0);
      setTotalRevenue(total);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getPercentage = (amount: number) => {
    if (totalRevenue === 0) return 0;
    return ((amount / totalRevenue) * 100).toFixed(1);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Sales by Crop',
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
              {/* Total Revenue Card */}
              <View style={[styles.totalCard, { backgroundColor: farmGreen }]}>
                <IconSymbol
                  ios_icon_name="chart.bar.fill"
                  android_material_icon_name="bar-chart"
                  size={48}
                  color="#fff"
                />
                <Text style={styles.totalLabel}>Total Crop Revenue</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalRevenue)}</Text>
                <Text style={styles.totalSubtext}>{cropSales.length} crops sold</Text>
              </View>

              {/* Sales by Crop */}
              {cropSales.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue by Crop</Text>
                  {cropSales.map((crop, index) => (
                    <View key={index} style={[styles.cropCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.cropHeader}>
                        <View style={styles.cropLeft}>
                          <IconSymbol
                            ios_icon_name="leaf.fill"
                            android_material_icon_name="local-florist"
                            size={28}
                            color={farmGreen}
                          />
                          <View>
                            <Text style={[styles.cropName, { color: colors.text }]}>{crop.cropName}</Text>
                            <Text style={[styles.cropSubtext, { color: colors.icon }]}>
                              {crop.transactionCount} {crop.transactionCount === 1 ? 'sale' : 'sales'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.cropRight}>
                          <Text style={[styles.cropRevenue, { color: farmGreen }]}>
                            {formatCurrency(crop.totalRevenue)}
                          </Text>
                          <Text style={[styles.cropPercentage, { color: colors.icon }]}>
                            {getPercentage(crop.totalRevenue)}% of total
                          </Text>
                        </View>
                      </View>
                      
                      {/* Progress bar */}
                      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              backgroundColor: farmGreen,
                              width: `${getPercentage(crop.totalRevenue)}%`
                            }
                          ]} 
                        />
                      </View>
                      
                      <View style={styles.cropStats}>
                        <View style={styles.statItem}>
                          <Text style={[styles.statLabel, { color: colors.icon }]}>Avg Sale</Text>
                          <Text style={[styles.statValue, { color: colors.text }]}>
                            {formatCurrency(crop.averageSale)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="chart.bar"
                    android_material_icon_name="bar-chart"
                    size={64}
                    color={colors.icon}
                  />
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    No crop sales data found
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                    Add income transactions with crop information to see sales by crop
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
  cropCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cropLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
  },
  cropSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  cropRight: {
    alignItems: 'flex-end',
  },
  cropRevenue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cropPercentage: {
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
  cropStats: {
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
