
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
import { Stack, useRouter } from 'expo-router';
import { Colors, farmGreen, appleGreen, appleRed } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { authenticatedGet, authenticatedPost } from '@/utils/api';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

interface SeasonProgress {
  estimates: {
    totalYield: number;
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
  };
  actuals: {
    totalYield: number;
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
  };
  progress: {
    yieldPercentage: number;
    revenuePercentage: number;
    profitPercentage: number;
  };
}

export default function SeasonManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonDate, setNewSeasonDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newSeasonNotes, setNewSeasonNotes] = useState('');
  const [activeSeasonProgress, setActiveSeasonProgress] = useState<SeasonProgress | null>(null);

  const loadSeasons = useCallback(async () => {
    console.log('Loading seasons');
    try {
      const data = await authenticatedGet<Season[]>('/api/seasons');
      console.log('Seasons loaded:', data.length);
      setSeasons(data);

      // Load progress for active season
      const activeSeason = data.find((s: Season) => s.isActive);
      if (activeSeason) {
        loadSeasonProgress(activeSeason.id);
      }
    } catch (error) {
      console.error('Error loading seasons:', error);
      Alert.alert('Error', 'Failed to load seasons');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSeasonProgress = async (seasonId: string) => {
    console.log('Loading season progress for:', seasonId);
    try {
      const data = await authenticatedGet<SeasonProgress>(`/api/seasons/${seasonId}/progress`);
      console.log('Season progress loaded');
      setActiveSeasonProgress(data);
    } catch (error) {
      console.error('Error loading season progress:', error);
    }
  };

  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);

  const handleCreateSeason = async () => {
    console.log('User creating new season:', newSeasonName);
    
    if (!newSeasonName.trim()) {
      Alert.alert('Error', 'Please enter a season name');
      return;
    }

    setCreating(true);
    try {
      const newSeason = await authenticatedPost<Season>('/api/seasons', {
        name: newSeasonName,
        startDate: newSeasonDate.toISOString(),
        notes: newSeasonNotes || undefined,
      });
      console.log('Season created:', newSeason.id);
      
      Alert.alert('Success', 'New season created successfully');
      setShowCreateForm(false);
      setNewSeasonName('');
      setNewSeasonNotes('');
      setNewSeasonDate(new Date());
      loadSeasons();
    } catch (error) {
      console.error('Error creating season:', error);
      Alert.alert('Error', 'Failed to create season');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseSeason = (season: Season) => {
    console.log('User closing season:', season.name);
    
    Alert.alert(
      'Close Season',
      `Are you sure you want to close "${season.name}"? This will finalize all actuals and you won't be able to add more data to this season.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Season',
          style: 'destructive',
          onPress: async () => {
            try {
              await authenticatedPost(`/api/seasons/${season.id}/close`, {});
              console.log('Season closed successfully');
              Alert.alert('Success', 'Season closed successfully');
              loadSeasons();
            } catch (error) {
              console.error('Error closing season:', error);
              Alert.alert('Error', 'Failed to close season');
            }
          },
        },
      ]
    );
  };

  const handleViewSeasonDetails = (season: Season) => {
    console.log('User viewing season details:', season.name);
    router.push(`/season-details/${season.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Season Management',
            headerBackTitle: 'Back',
          }}
        />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={farmGreen} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading seasons...</Text>
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
          title: 'Season Management',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Farm Seasons
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
              Manage your growing seasons and track yield estimates vs actuals
            </Text>
          </View>

          {/* Active Season Progress */}
          {activeSeasonProgress && (
            <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.progressHeader}>
                <IconSymbol
                  ios_icon_name="chart.bar.fill"
                  android_material_icon_name="show-chart"
                  size={24}
                  color={farmGreen}
                />
                <Text style={[styles.progressTitle, { color: colors.text }]}>
                  Current Season Progress
                </Text>
              </View>

              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Text style={[styles.progressLabel, { color: colors.icon }]}>Estimated Profit</Text>
                  <Text style={[styles.progressValue, { color: colors.text }]}>
                    {formatCurrency(activeSeasonProgress.estimates.totalProfit)}
                  </Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={[styles.progressLabel, { color: colors.icon }]}>Actual Profit</Text>
                  <Text style={[styles.progressValue, { color: activeSeasonProgress.actuals.totalProfit >= 0 ? appleGreen : appleRed }]}>
                    {formatCurrency(activeSeasonProgress.actuals.totalProfit)}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: farmGreen,
                        width: `${Math.min(activeSeasonProgress.progress.profitPercentage, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressPercentage, { color: colors.text }]}>
                  {activeSeasonProgress.progress.profitPercentage.toFixed(1)}% of estimate
                </Text>
              </View>

              <View style={styles.progressDetails}>
                <View style={styles.progressDetailRow}>
                  <Text style={[styles.progressDetailLabel, { color: colors.icon }]}>Revenue:</Text>
                  <Text style={[styles.progressDetailValue, { color: colors.text }]}>
                    {formatCurrency(activeSeasonProgress.actuals.totalRevenue)} / {formatCurrency(activeSeasonProgress.estimates.totalRevenue)}
                  </Text>
                </View>
                <View style={styles.progressDetailRow}>
                  <Text style={[styles.progressDetailLabel, { color: colors.icon }]}>Costs:</Text>
                  <Text style={[styles.progressDetailValue, { color: colors.text }]}>
                    {formatCurrency(activeSeasonProgress.actuals.totalCosts)} / {formatCurrency(activeSeasonProgress.estimates.totalCosts)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Create Season Button */}
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: farmGreen }]}
            onPress={() => setShowCreateForm(!showCreateForm)}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.createButtonText}>
              {showCreateForm ? 'Cancel' : 'Create New Season'}
            </Text>
          </TouchableOpacity>

          {/* Create Season Form */}
          {showCreateForm && (
            <View style={[styles.createForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Season Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g., 2024 Spring Season"
                placeholderTextColor={colors.icon}
                value={newSeasonName}
                onChangeText={setNewSeasonName}
              />

              <Text style={[styles.formLabel, { color: colors.text }]}>Start Date</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {formatDate(newSeasonDate.toISOString())}
                </Text>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={20}
                  color={colors.icon}
                />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={newSeasonDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setNewSeasonDate(selectedDate);
                    }
                  }}
                />
              )}

              <Text style={[styles.formLabel, { color: colors.text }]}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Add any notes about this season..."
                placeholderTextColor={colors.icon}
                value={newSeasonNotes}
                onChangeText={setNewSeasonNotes}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: farmGreen }]}
                onPress={handleCreateSeason}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Season</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Seasons List */}
          <View style={styles.seasonsList}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>All Seasons</Text>
            
            {seasons.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={48}
                  color={colors.icon}
                />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  No seasons yet
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.icon }]}>
                  Create your first season to start tracking yields and profits
                </Text>
              </View>
            ) : (
              seasons.map((season) => (
                <View
                  key={season.id}
                  style={[styles.seasonCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.seasonHeader}>
                    <View style={styles.seasonTitleRow}>
                      <Text style={[styles.seasonName, { color: colors.text }]}>
                        {season.name}
                      </Text>
                      {season.isActive && (
                        <View style={[styles.activeBadge, { backgroundColor: appleGreen }]}>
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.seasonDates, { color: colors.icon }]}>
                      {formatDate(season.startDate)} - {season.endDate ? formatDate(season.endDate) : 'Ongoing'}
                    </Text>
                    {season.notes && (
                      <Text style={[styles.seasonNotes, { color: colors.icon }]}>
                        {season.notes}
                      </Text>
                    )}
                  </View>

                  <View style={styles.seasonActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.background }]}
                      onPress={() => handleViewSeasonDetails(season)}
                    >
                      <IconSymbol
                        ios_icon_name="chart.bar"
                        android_material_icon_name="assessment"
                        size={20}
                        color={farmGreen}
                      />
                      <Text style={[styles.actionButtonText, { color: farmGreen }]}>
                        View Details
                      </Text>
                    </TouchableOpacity>

                    {season.isActive && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.background }]}
                        onPress={() => handleCloseSeason(season)}
                      >
                        <IconSymbol
                          ios_icon_name="checkmark.circle"
                          android_material_icon_name="check-circle"
                          size={20}
                          color={appleRed}
                        />
                        <Text style={[styles.actionButtonText, { color: appleRed }]}>
                          Close Season
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
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
  header: {
    marginBottom: 24,
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
  progressCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressStat: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBar: {
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    textAlign: 'center',
  },
  progressDetails: {
    gap: 8,
  },
  progressDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDetailLabel: {
    fontSize: 14,
  },
  progressDetailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createForm: {
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
  },
  textArea: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  seasonsList: {
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
  seasonCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  seasonHeader: {
    marginBottom: 16,
  },
  seasonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  seasonName: {
    fontSize: 18,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  seasonDates: {
    fontSize: 14,
    marginBottom: 4,
  },
  seasonNotes: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  seasonActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
