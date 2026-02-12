
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
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet } from '@/utils/api';

interface ConsumerListing {
  id: string;
  outlet: string;
  price: number;
  quantity: number;
  unit: string;
  cropName?: string;
}

interface OutletSales {
  outlet: string;
  totalRevenue: number;
  listingCount: number;
  averagePrice: number;
}

export default function SalesByOutletScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [loading, setLoading] = useState(true);
  const [outletSales, setOutletSales] = useState<OutletSales[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const loadSalesData = useCallback(async () => {
    console.log('Loading sales by outlet data');
    setLoading(true);
    try {
      const listings = await authenticatedGet<ConsumerListing[]>('/api/marketplace/consumer/listings');
      console.log('Loaded consumer listings:', listings.length);
      
      // Group by outlet
      const outletMap: Record<string, { total: number; count: number; prices: number[] }> = {};
      listings.forEach(listing => {
        const revenue = listing.price * listing.quantity;
        if (!outletMap[listing.outlet]) {
          outletMap[listing.outlet] = { total: 0, count: 0, prices: [] };
        }
        outletMap[listing.outlet].total += revenue;
        outletMap[listing.outlet].count += 1;
        outletMap[listing.outlet].prices.push(listing.price);
      });
      
      const salesData: OutletSales[] = Object.entries(outletMap).map(([outlet, data]) => ({
        outlet,
        totalRevenue: data.total,
        listingCount: data.count,
        averagePrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
      }));
      
      salesData.sort((a, b) => b.totalRevenue - a.totalRevenue);
      setOutletSales(salesData);
      
      const total = salesData.reduce((sum, outlet) => sum + outlet.totalRevenue, 0);
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
          title: 'Sales by Outlet',
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
                  ios_icon_name="storefront.fill"
                  android_material_icon_name="store"
                  size={48}
                  color="#fff"
                />
                <Text style={styles.totalLabel}>Total Sales Revenue</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalRevenue)}</Text>
                <Text style={styles.totalSubtext}>{outletSales.length} sales outlets</Text>
              </View>

              {/* Sales by Outlet */}
              {outletSales.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue by Outlet</Text>
                  {outletSales.map((outlet, index) => (
                    <View key={index} style={[styles.outletCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.outletHeader}>
                        <View style={styles.outletLeft}>
                          <IconSymbol
                            ios_icon_name="storefront.fill"
                            android_material_icon_name="store"
                            size={28}
                            color={farmGreen}
                          />
                          <View>
                            <Text style={[styles.outletName, { color: colors.text }]}>{outlet.outlet}</Text>
                            <Text style={[styles.outletSubtext, { color: colors.icon }]}>
                              {outlet.listingCount} {outlet.listingCount === 1 ? 'listing' : 'listings'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.outletRight}>
                          <Text style={[styles.outletRevenue, { color: farmGreen }]}>
                            {formatCurrency(outlet.totalRevenue)}
                          </Text>
                          <Text style={[styles.outletPercentage, { color: colors.icon }]}>
                            {getPercentage(outlet.totalRevenue)}% of total
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
                              width: `${getPercentage(outlet.totalRevenue)}%`
                            }
                          ]} 
                        />
                      </View>
                      
                      <View style={styles.outletStats}>
                        <View style={styles.statItem}>
                          <Text style={[styles.statLabel, { color: colors.icon }]}>Avg Price</Text>
                          <Text style={[styles.statValue, { color: colors.text }]}>
                            {formatCurrency(outlet.averagePrice)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="storefront"
                    android_material_icon_name="store"
                    size={64}
                    color={colors.icon}
                  />
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    No sales outlet data found
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                    Create consumer marketplace listings to track sales by outlet
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
  outletCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  outletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  outletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  outletName: {
    fontSize: 18,
    fontWeight: '600',
  },
  outletSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  outletRight: {
    alignItems: 'flex-end',
  },
  outletRevenue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  outletPercentage: {
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
  outletStats: {
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
