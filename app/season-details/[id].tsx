
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, farmGreen, appleGreen, appleRed, farmYellow } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';
import { authenticatedGet, authenticatedPost } from '@/utils/api';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
}

interface CropEstimate {
  cropId: string;
  cropName: string;
  estimatedYield: number;
  estimatedPrice: number;
  estimatedRevenue: number;
  estimatedCosts: number;
  estimatedProfit: number;
  unit: string;
}

interface CropActual {
  cropId: string;
  cropName: string;
  actualYield: number;
  actualRevenue: number;
  actualCosts: number;
  actualProfit: number;
  varianceYield: number;
  varianceProfit: number;
  unit: string;
}

interface SeasonDetails {
  season: Season;
  estimates: CropEstimate[];
  actuals: CropActual[];
  currentProgress: {
    totalEstimatedProfit: number;
    totalActualProfit: number;
    totalCosts: number;
    totalRevenue: number;
  };
}

interface Crop {
  id: string;
  name: string;
}

export default function SeasonDetailsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();
  const { id } = useLocalSearchParams();

  const [details, setDetails] = useState<SeasonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [location, setLocation] = useState('');
  const [availableCrops, setAvailableCrops] = useState<Crop[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);

  const loadSeasonDetails = useCallback(async () => {
    console.log('Loading season details for:', id);
    try {
      const data = await authenticatedGet<SeasonDetails>(`/api/seasons/${id}`);
      console.log('Season details loaded');
      setDetails(data);
    } catch (error) {
      console.error('Error loading season details:', error);
      Alert.alert('Error', 'Failed to load season details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadCrops = useCallback(async () => {
    console.log('Loading available crops');
    try {
      const data = await authenticatedGet<Crop[]>('/api/crops');
      console.log('Crops loaded:', data.length);
      setAvailableCrops(data);
    } catch (error) {
      console.error('Error loading crops:', error);
    }
  }, []);

  useEffect(() => {
    loadSeasonDetails();
    loadCrops();
  }, [loadSeasonDetails, loadCrops]);

  const handleGenerateEstimates = async () => {
    console.log('User generating AI estimates for location:', location);
    
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter your location');
      return;
    }

    if (selectedCrops.length === 0) {
      Alert.alert('Error', 'Please select at least one crop');
      return;
    }

    setGenerating(true);
    try {
      const data = await authenticatedPost<{ estimates: any[] }>(`/api/seasons/${id}/estimates/generate`, {
        location,
        cropIds: selectedCrops,
      });
      console.log('Estimates generated:', data.estimates.length);
      
      Alert.alert('Success', 'AI-powered estimates generated successfully');
      setShowGenerateForm(false);
      setLocation('');
      setSelectedCrops([]);
      loadSeasonDetails();
    } catch (error) {
      console.error('Error generating estimates:', error);
      Alert.alert('Error', 'Failed to generate estimates');
    } finally {
      setGenerating(false);
    }
  };

  const toggleCropSelection = (cropId: string) => {
    console.log('User toggling crop selection:', cropId);
    setSelectedCrops(prev =>
      prev.includes(cropId)
        ? prev.filter(id => id !== cropId)
        : [...prev, cropId]
    );
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getVarianceColor = (variance: number) => {
    if (variance >= 0) return appleGreen;
    return appleRed;
  };

  const getVarianceIcon = (variance: number) => {
    if (variance >= 0) return 'trending-up';
    return 'trending-down';
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Season Details',
            headerBackTitle: 'Back',
          }}
        />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={farmGreen} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading season details...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!details) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Season Details',
            headerBackTitle: 'Back',
          }}
        />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text }]}>Season not found</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: details.season.name,
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Season Info */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: details.season.isActive ? appleGreen : colors.border }]}>
                <Text style={styles.statusBadgeText}>
                  {details.season.isActive ? 'Active' : 'Closed'}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Period:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(details.season.startDate)} - {details.season.endDate ? formatDate(details.season.endDate) : 'Ongoing'}
              </Text>
            </View>
            {details.season.notes && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Notes:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {details.season.notes}
                </Text>
              </View>
            )}
          </View>

          {/* Overall Progress */}
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Overall Progress</Text>
            
            <View style={styles.progressGrid}>
              <View style={styles.progressItem}>
                <Text style={[styles.progressLabel, { color: colors.icon }]}>Estimated Profit</Text>
                <Text style={[styles.progressValue, { color: colors.text }]}>
                  {formatCurrency(details.currentProgress.totalEstimatedProfit)}
                </Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={[styles.progressLabel, { color: colors.icon }]}>Actual Profit</Text>
                <Text style={[styles.progressValue, { color: details.currentProgress.totalActualProfit >= 0 ? appleGreen : appleRed }]}>
                  {formatCurrency(details.currentProgress.totalActualProfit)}
                </Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={[styles.progressLabel, { color: colors.icon }]}>Total Revenue</Text>
                <Text style={[styles.progressValue, { color: colors.text }]}>
                  {formatCurrency(details.currentProgress.totalRevenue)}
                </Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={[styles.progressLabel, { color: colors.icon }]}>Total Costs</Text>
                <Text style={[styles.progressValue, { color: colors.text }]}>
                  {formatCurrency(details.currentProgress.totalCosts)}
                </Text>
              </View>
            </View>
          </View>

          {/* Generate Estimates Button */}
          {details.season.isActive && (
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: farmGreen }]}
              onPress={() => setShowGenerateForm(!showGenerateForm)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="auto-awesome"
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.generateButtonText}>
                {showGenerateForm ? 'Cancel' : 'Generate AI Estimates'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Generate Estimates Form */}
          {showGenerateForm && (
            <View style={[styles.generateForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Your Location</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g., Portland, Oregon"
                placeholderTextColor={colors.icon}
                value={location}
                onChangeText={setLocation}
              />

              <Text style={[styles.formLabel, { color: colors.text }]}>Select Crops</Text>
              <ScrollView style={styles.cropsList} horizontal showsHorizontalScrollIndicator={false}>
                {availableCrops.map((crop) => (
                  <TouchableOpacity
                    key={crop.id}
                    style={[
                      styles.cropChip,
                      {
                        backgroundColor: selectedCrops.includes(crop.id) ? farmGreen : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => toggleCropSelection(crop.id)}
                  >
                    <Text
                      style={[
                        styles.cropChipText,
                        { color: selectedCrops.includes(crop.id) ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {crop.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: farmGreen }]}
                onPress={handleGenerateEstimates}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol
                      ios_icon_name="sparkles"
                      android_material_icon_name="auto-awesome"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.submitButtonText}>Generate with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Estimates vs Actuals by Crop */}
          <View style={styles.cropsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Estimates vs Actuals by Crop</Text>

            {details.estimates.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <IconSymbol
                  ios_icon_name="chart.bar"
                  android_material_icon_name="show-chart"
                  size={48}
                  color={colors.icon}
                />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  No estimates yet
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.icon }]}>
                  Generate AI-powered estimates to start tracking your season
                </Text>
              </View>
            ) : (
              details.estimates.map((estimate) => {
                const actual = details.actuals.find(a => a.cropId === estimate.cropId);
                
                return (
                  <View
                    key={estimate.cropId}
                    style={[styles.cropCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.cropName, { color: colors.text }]}>
                      {estimate.cropName}
                    </Text>

                    <View style={styles.cropStats}>
                      <View style={styles.statColumn}>
                        <Text style={[styles.statLabel, { color: colors.icon }]}>Estimated</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {estimate.estimatedYield.toFixed(1)} {estimate.unit}
                        </Text>
                        <Text style={[styles.statSubvalue, { color: colors.icon }]}>
                          {formatCurrency(estimate.estimatedPrice)}/{estimate.unit}
                        </Text>
                        <Text style={[styles.statProfit, { color: farmGreen }]}>
                          Profit: {formatCurrency(estimate.estimatedProfit)}
                        </Text>
                      </View>

                      <View style={styles.statDivider} />

                      <View style={styles.statColumn}>
                        <Text style={[styles.statLabel, { color: colors.icon }]}>Actual</Text>
                        {actual ? (
                          <>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                              {actual.actualYield.toFixed(1)} {actual.unit}
                            </Text>
                            <View style={styles.varianceRow}>
                              <IconSymbol
                                ios_icon_name={actual.varianceYield >= 0 ? 'arrow.up' : 'arrow.down'}
                                android_material_icon_name={getVarianceIcon(actual.varianceYield)}
                                size={16}
                                color={getVarianceColor(actual.varianceYield)}
                              />
                              <Text style={[styles.varianceText, { color: getVarianceColor(actual.varianceYield) }]}>
                                {Math.abs(actual.varianceYield).toFixed(1)}%
                              </Text>
                            </View>
                            <Text style={[styles.statProfit, { color: actual.actualProfit >= 0 ? appleGreen : appleRed }]}>
                              Profit: {formatCurrency(actual.actualProfit)}
                            </Text>
                          </>
                        ) : (
                          <Text style={[styles.noDataText, { color: colors.icon }]}>
                            No data yet
                          </Text>
                        )}
                      </View>
                    </View>

                    {actual && (
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                backgroundColor: farmGreen,
                                width: `${Math.min((actual.actualYield / estimate.estimatedYield) * 100, 100)}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.progressBarLabel, { color: colors.icon }]}>
                          {((actual.actualYield / estimate.estimatedYield) * 100).toFixed(1)}% of estimated yield
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  progressItem: {
    width: '47%',
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  generateForm: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  cropsList: {
    marginBottom: 16,
  },
  cropChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  cropChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cropsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  cropCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  cropStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statColumn: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#A1A1AA40',
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubvalue: {
    fontSize: 12,
    marginBottom: 8,
  },
  statProfit: {
    fontSize: 14,
    fontWeight: '600',
  },
  varianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  varianceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  progressBarContainer: {
    marginTop: 16,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
