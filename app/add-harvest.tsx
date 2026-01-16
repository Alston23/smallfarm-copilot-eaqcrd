
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface FieldBedCrop {
  id: string;
  fieldBed: {
    name: string;
  };
  crop: {
    name: string;
  };
  plantingDate: string;
}

const HARVEST_UNITS = [
  'lbs',
  'kg',
  'oz',
  'g',
  'bushels',
  'bunches',
  'heads',
  'units',
];

export default function AddHarvestScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [loadingPlantings, setLoadingPlantings] = useState(true);
  const [plantings, setPlantings] = useState<FieldBedCrop[]>([]);
  const [selectedPlanting, setSelectedPlanting] = useState<string>('');
  const [harvestAmount, setHarvestAmount] = useState('');
  const [harvestUnit, setHarvestUnit] = useState('lbs');
  const [yieldPercentage, setYieldPercentage] = useState('');
  const [harvestDate, setHarvestDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadPlantings = useCallback(async () => {
    console.log('Loading field bed crops for harvest input');
    setLoadingPlantings(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/fields-beds`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded fields/beds:', data.length);
        // Extract all plantings from fields/beds
        const allPlantings: FieldBedCrop[] = [];
        data.forEach((fieldBed: any) => {
          if (fieldBed.crops && fieldBed.crops.length > 0) {
            fieldBed.crops.forEach((crop: any) => {
              allPlantings.push({
                id: crop.id,
                fieldBed: { name: fieldBed.name },
                crop: { name: crop.crop.name },
                plantingDate: crop.planting_date,
              });
            });
          }
        });
        setPlantings(allPlantings);
        console.log('Total plantings available:', allPlantings.length);
      } else {
        console.error('Failed to load plantings:', response.status);
      }
    } catch (error) {
      console.error('Error loading plantings:', error);
    } finally {
      setLoadingPlantings(false);
    }
  }, [token]);

  useEffect(() => {
    loadPlantings();
  }, [loadPlantings]);

  const handleSubmit = async () => {
    console.log('User tapped Submit Harvest Data button');
    
    if (!selectedPlanting) {
      Alert.alert('Error', 'Please select a planting');
      return;
    }
    
    if (!harvestAmount || parseFloat(harvestAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid harvest amount');
      return;
    }
    
    if (!yieldPercentage || parseFloat(yieldPercentage) < 0 || parseFloat(yieldPercentage) > 100) {
      Alert.alert('Error', 'Please enter a valid yield percentage (0-100)');
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting harvest data:', {
        fieldBedCropId: selectedPlanting,
        harvestAmount,
        harvestUnit,
        yieldPercentage,
        harvestDate: harvestDate.toISOString(),
      });

      const response = await fetch(`${BACKEND_URL}/api/harvest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldBedCropId: selectedPlanting,
          harvestAmount,
          harvestUnit,
          yieldPercentage,
          harvestDate: harvestDate.toISOString(),
        }),
      });

      if (response.ok) {
        console.log('Harvest data submitted successfully');
        Alert.alert('Success', 'Harvest data recorded successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        const error = await response.text();
        console.error('Failed to submit harvest data:', response.status, error);
        Alert.alert('Error', 'Failed to record harvest data. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting harvest data:', error);
      Alert.alert('Error', 'Failed to record harvest data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add Harvest Data',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Record Harvest
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
              Enter harvest amount and yield percentage for your crop
            </Text>
          </View>

          {loadingPlantings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={farmGreen} />
            </View>
          ) : (
            <>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Select Planting *
                </Text>
                <ScrollView 
                  style={[styles.plantingList, { backgroundColor: colors.card, borderColor: colors.border }]}
                  contentContainerStyle={styles.plantingListContent}
                >
                  {plantings.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.icon }]}>
                      No plantings available. Add crops to fields/beds first.
                    </Text>
                  ) : (
                    plantings.map((planting, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.plantingOption,
                          { 
                            backgroundColor: selectedPlanting === planting.id ? farmGreen + '20' : 'transparent',
                            borderColor: selectedPlanting === planting.id ? farmGreen : colors.border,
                          }
                        ]}
                        onPress={() => {
                          console.log('User selected planting:', planting.crop.name, 'in', planting.fieldBed.name);
                          setSelectedPlanting(planting.id);
                        }}
                      >
                        <View style={styles.plantingOptionContent}>
                          <Text style={[styles.plantingCropName, { color: colors.text }]}>
                            {planting.crop.name}
                          </Text>
                          <Text style={[styles.plantingDetails, { color: colors.icon }]}>
                            {planting.fieldBed.name} • Planted {new Date(planting.plantingDate).toLocaleDateString()}
                          </Text>
                        </View>
                        {selectedPlanting === planting.id && (
                          <IconSymbol
                            ios_icon_name="checkmark.circle.fill"
                            android_material_icon_name="check-circle"
                            size={24}
                            color={farmGreen}
                          />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Harvest Amount *
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter harvest amount"
                  placeholderTextColor={colors.icon}
                  value={harvestAmount}
                  onChangeText={setHarvestAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Unit *
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.unitScroll}
                  contentContainerStyle={styles.unitScrollContent}
                >
                  {HARVEST_UNITS.map((unit, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.unitButton,
                        {
                          backgroundColor: harvestUnit === unit ? farmGreen : colors.card,
                          borderColor: harvestUnit === unit ? farmGreen : colors.border,
                        }
                      ]}
                      onPress={() => {
                        console.log('User selected unit:', unit);
                        setHarvestUnit(unit);
                      }}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          { color: harvestUnit === unit ? '#fff' : colors.text }
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Yield Percentage (0-100) *
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter yield percentage"
                  placeholderTextColor={colors.icon}
                  value={yieldPercentage}
                  onChangeText={setYieldPercentage}
                  keyboardType="decimal-pad"
                />
                <Text style={[styles.helpText, { color: colors.icon }]}>
                  Percentage of expected yield achieved (e.g., 85 for 85%)
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Harvest Date *
                </Text>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    console.log('User tapped harvest date picker');
                    setShowDatePicker(true);
                  }}
                >
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={20}
                    color={colors.icon}
                  />
                  <Text style={[styles.dateButtonText, { color: colors.text }]}>
                    {harvestDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={harvestDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      console.log('User selected harvest date:', selectedDate.toLocaleDateString());
                      setHarvestDate(selectedDate);
                    }
                  }}
                />
              )}

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: farmGreen }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.submitButtonText}>Record Harvest</Text>
                  </>
                )}
              </TouchableOpacity>
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
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  helpText: {
    fontSize: 14,
    marginTop: 8,
  },
  plantingList: {
    maxHeight: 300,
    borderRadius: 12,
    borderWidth: 1,
  },
  plantingListContent: {
    padding: 8,
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
  },
  plantingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  plantingOptionContent: {
    flex: 1,
  },
  plantingCropName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  plantingDetails: {
    fontSize: 14,
  },
  unitScroll: {
    marginHorizontal: -4,
  },
  unitScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
