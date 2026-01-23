
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { authenticatedGet, authenticatedPost } from '@/utils/api';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface Planting {
  id: string;
  fieldBedName: string;
  plantingDate: string;
  harvestAmount: number;
  yieldPercentage: number;
  harvestDate: string;
}

interface YieldData {
  cropId: string;
  cropName: string;
  totalHarvest: number;
  averageYield: number;
  harvestCount: number;
  unit: string;
  plantings: Planting[];
}

export default function YieldChartScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [yieldData, setYieldData] = useState<YieldData[]>([]);
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadYieldData = useCallback(async () => {
    console.log('Loading yield data by crop');
    setLoading(true);
    try {
      const data = await authenticatedGet<YieldData[]>('/api/harvest/yield');
      console.log('Loaded yield data:', data.length, 'crops');
      setYieldData(data);
    } catch (error) {
      console.error('Error loading yield data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadYieldData();
  }, [loadYieldData]);

  const getBarWidth = (value: number, maxValue: number) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  };

  const maxHarvest = Math.max(...yieldData.map(d => d.totalHarvest), 1);
  const maxYield = Math.max(...yieldData.map(d => d.averageYield), 1);

  const exportReport = async (format: 'csv' | 'pdf') => {
    console.log(`User exporting harvest report as ${format}`);
    
    // Web fallback: file sharing not available
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'File export is not available on web. Please use the mobile app.');
      return;
    }
    
    setExporting(true);
    
    try {
      const { downloadUrl, filename } = await authenticatedPost<{ downloadUrl: string; filename: string }>(
        '/api/reports/export',
        {
          reportType: 'harvest',
          format,
        }
      );
      console.log('Report generated:', filename);

      // Download and share the file
      const fileUri = FileSystem.documentDirectory + filename;
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri);

      if (downloadResult.status === 200) {
        console.log('Report downloaded to:', downloadResult.uri);
        
        // Share the file
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadResult.uri);
        } else {
          Alert.alert('Success', `Report saved to ${downloadResult.uri}`);
        }
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', 'Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExport = () => {
    Alert.alert(
      'Export Harvest Report',
      'Choose export format',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export as CSV', onPress: () => exportReport('csv') },
        { text: 'Export as PDF', onPress: () => exportReport('pdf') },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Yield per Crop',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleExport}
              disabled={exporting || yieldData.length === 0}
              style={{ marginRight: 16 }}
            >
              <IconSymbol
                ios_icon_name="square.and.arrow.up"
                android_material_icon_name="share"
                size={24}
                color={exporting || yieldData.length === 0 ? '#999' : farmGreen}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Crop Yield Analysis
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
              Track harvest amounts and yield percentages for each crop
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: farmGreen }]}
            onPress={() => {
              console.log('User tapped Add Harvest Data button');
              router.push('/add-harvest');
            }}
          >
            <IconSymbol
              ios_icon_name="plus"
              android_material_icon_name="add"
              size={20}
              color="#fff"
            />
            <Text style={styles.addButtonText}>Add Harvest Data</Text>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={farmGreen} />
            </View>
          ) : yieldData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="chart.bar"
                android_material_icon_name="bar-chart"
                size={64}
                color={colors.icon}
              />
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                No harvest data yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                Add harvest data to see yield analysis
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Total Harvest by Crop
                </Text>
                {yieldData.map((crop, index) => (
                  <View key={index} style={styles.chartItem}>
                    <View style={styles.chartLabelRow}>
                      <Text style={[styles.chartLabel, { color: colors.text }]}>
                        {crop.cropName}
                      </Text>
                      <Text style={[styles.chartValue, { color: colors.text }]}>
                        {crop.totalHarvest.toFixed(1)} {crop.unit}
                      </Text>
                    </View>
                    <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.barFill,
                          { 
                            backgroundColor: farmGreen,
                            width: `${getBarWidth(crop.totalHarvest, maxHarvest)}%`
                          }
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Average Yield % by Crop
                </Text>
                {yieldData.map((crop, index) => (
                  <View key={index} style={styles.chartItem}>
                    <View style={styles.chartLabelRow}>
                      <Text style={[styles.chartLabel, { color: colors.text }]}>
                        {crop.cropName}
                      </Text>
                      <Text style={[styles.chartValue, { color: colors.text }]}>
                        {crop.averageYield.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.barFill,
                          { 
                            backgroundColor: farmGreen,
                            width: `${getBarWidth(crop.averageYield, maxYield)}%`
                          }
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Detailed Harvest Records
                </Text>
                {yieldData.map((crop, cropIndex) => (
                  <View key={cropIndex} style={styles.cropCard}>
                    <TouchableOpacity
                      style={[styles.cropHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        console.log('User toggled crop details:', crop.cropName);
                        setExpandedCrop(expandedCrop === crop.cropId ? null : crop.cropId);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cropHeaderLeft}>
                        <IconSymbol
                          ios_icon_name="leaf.fill"
                          android_material_icon_name="local-florist"
                          size={24}
                          color={farmGreen}
                        />
                        <View style={styles.cropHeaderText}>
                          <Text style={[styles.cropName, { color: colors.text }]}>
                            {crop.cropName}
                          </Text>
                          <Text style={[styles.cropStats, { color: colors.icon }]}>
                            {crop.harvestCount} harvest{crop.harvestCount !== 1 ? 's' : ''} • {crop.totalHarvest.toFixed(1)} {crop.unit} total
                          </Text>
                        </View>
                      </View>
                      <IconSymbol
                        ios_icon_name={expandedCrop === crop.cropId ? "chevron.up" : "chevron.down"}
                        android_material_icon_name={expandedCrop === crop.cropId ? "expand-less" : "expand-more"}
                        size={24}
                        color={colors.icon}
                      />
                    </TouchableOpacity>

                    {expandedCrop === crop.cropId && (
                      <View style={[styles.plantingsList, { backgroundColor: colors.card }]}>
                        {crop.plantings.map((planting, plantingIndex) => (
                          <View
                            key={plantingIndex}
                            style={[styles.plantingItem, { borderTopColor: colors.border }]}
                          >
                            <View style={styles.plantingRow}>
                              <Text style={[styles.plantingLabel, { color: colors.icon }]}>
                                Field/Bed:
                              </Text>
                              <Text style={[styles.plantingValue, { color: colors.text }]}>
                                {planting.fieldBedName}
                              </Text>
                            </View>
                            <View style={styles.plantingRow}>
                              <Text style={[styles.plantingLabel, { color: colors.icon }]}>
                                Planted:
                              </Text>
                              <Text style={[styles.plantingValue, { color: colors.text }]}>
                                {new Date(planting.plantingDate).toLocaleDateString()}
                              </Text>
                            </View>
                            {planting.harvestDate && (
                              <View style={styles.plantingRow}>
                                <Text style={[styles.plantingLabel, { color: colors.icon }]}>
                                  Harvested:
                                </Text>
                                <Text style={[styles.plantingValue, { color: colors.text }]}>
                                  {new Date(planting.harvestDate).toLocaleDateString()}
                                </Text>
                              </View>
                            )}
                            <View style={styles.plantingRow}>
                              <Text style={[styles.plantingLabel, { color: colors.icon }]}>
                                Harvest:
                              </Text>
                              <Text style={[styles.plantingValue, { color: farmGreen, fontWeight: '600' }]}>
                                {planting.harvestAmount} {crop.unit}
                              </Text>
                            </View>
                            <View style={styles.plantingRow}>
                              <Text style={[styles.plantingLabel, { color: colors.icon }]}>
                                Yield:
                              </Text>
                              <Text style={[styles.plantingValue, { color: farmGreen, fontWeight: '600' }]}>
                                {planting.yieldPercentage}%
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
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
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartItem: {
    marginBottom: 16,
  },
  chartLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  chartValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  barBackground: {
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
  },
  cropCard: {
    marginBottom: 12,
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cropHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cropHeaderText: {
    flex: 1,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cropStats: {
    fontSize: 14,
  },
  plantingsList: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  plantingItem: {
    padding: 16,
    borderTopWidth: 1,
  },
  plantingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  plantingLabel: {
    fontSize: 14,
  },
  plantingValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
