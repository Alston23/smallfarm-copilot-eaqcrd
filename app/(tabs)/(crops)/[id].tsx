
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface CropDetail {
  id: string;
  name: string;
  category: string;
  row_spacing?: string;
  rowSpacing?: string;
  plant_spacing?: string;
  plantSpacing?: string;
  soil_ph?: string;
  soilPh?: string;
  soil_ph_min?: number;
  soil_ph_max?: number;
  days_to_maturity?: number;
  daysToMaturity?: number;
  planting_depth?: string;
  plantingDepth?: string;
  sun_requirements?: string;
  sun_requirement?: string;
  sunRequirement?: string;
  water_requirements?: string;
  water_requirement?: string;
  waterRequirement?: string;
  common_pests?: string;
  commonPests?: string;
  common_diseases?: string;
  commonDiseases?: string;
  fertilizer_schedule?: string;
  fertilizerSchedule?: string;
  harvest_tips?: string;
  harvestTips?: string;
  is_custom?: boolean;
  isCustom?: boolean;
}

export default function CropDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  
  const [crop, setCrop] = useState<CropDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCropDetail = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading crop detail for id:', id);
      
      // Fetch all crops since there's no individual crop endpoint
      const response = await fetch(`${BACKEND_URL}/api/crops`);

      if (response.ok) {
        const allCrops = await response.json();
        console.log(`Loaded ${allCrops.length} total crops, searching for id:`, id);
        
        // Find the specific crop by ID
        const foundCrop = allCrops.find((c: any) => String(c.id) === String(id));
        
        if (foundCrop) {
          console.log('Found crop detail:', foundCrop.name);
          setCrop(foundCrop);
        } else {
          console.error('Crop not found with id:', id);
          Alert.alert('Error', 'Crop not found. It may have been deleted.');
          setCrop(null);
        }
      } else {
        console.error('Failed to load crops:', response.status, await response.text());
        Alert.alert('Error', 'Failed to load crop details. Please try again.');
      }
    } catch (error) {
      console.error('Error loading crop detail:', error);
      Alert.alert('Error', 'Failed to load crop details. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCropDetail();
  }, [loadCropDetail]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={farmGreen} />
        </View>
      </SafeAreaView>
    );
  }

  if (!crop) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle"
            android_material_icon_name="warning"
            size={64}
            color={colors.icon}
          />
          <Text style={[styles.errorText, { color: colors.text }]}>Crop not found</Text>
          <TouchableOpacity
            style={[styles.backButtonError, { backgroundColor: farmGreen }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Helper function to get field value (handles both snake_case and camelCase)
  const getField = (snakeCase: any, camelCase: any) => snakeCase || camelCase || 'N/A';

  const rowSpacing = getField(crop.row_spacing, crop.rowSpacing);
  const plantSpacing = getField(crop.plant_spacing, crop.plantSpacing);
  const soilPh = getField(crop.soil_ph, crop.soilPh);
  const daysToMaturity = getField(crop.days_to_maturity, crop.daysToMaturity);
  const plantingDepth = getField(crop.planting_depth, crop.plantingDepth);
  const sunRequirement = getField(crop.sun_requirements || crop.sun_requirement, crop.sunRequirement);
  const waterRequirement = getField(crop.water_requirements || crop.water_requirement, crop.waterRequirement);
  const commonPests = getField(crop.common_pests, crop.commonPests);
  const commonDiseases = getField(crop.common_diseases, crop.commonDiseases);
  const fertilizerSchedule = getField(crop.fertilizer_schedule, crop.fertilizerSchedule);
  const harvestTips = getField(crop.harvest_tips, crop.harvestTips);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {crop.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <IconSymbol
              ios_icon_name="leaf.fill"
              android_material_icon_name="eco"
              size={32}
              color={farmGreen}
            />
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cropName, { color: colors.text }]}>{crop.name}</Text>
              <Text style={[styles.cropCategory, { color: colors.icon }]}>
                {crop.category.charAt(0).toUpperCase() + crop.category.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Planting Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Row Spacing:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{rowSpacing} inches</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Plant Spacing:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{plantSpacing} inches</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Planting Depth:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{plantingDepth} inches</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Days to Maturity:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{daysToMaturity} days</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Growing Conditions</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Soil pH:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{soilPh}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Sun Requirements:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{sunRequirement}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Water Requirements:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{waterRequirement}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fertilizer Schedule</Text>
          <Text style={[styles.sectionText, { color: colors.text }]}>{fertilizerSchedule}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Common Pests</Text>
          <Text style={[styles.sectionText, { color: colors.text }]}>{commonPests}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Common Diseases</Text>
          <Text style={[styles.sectionText, { color: colors.text }]}>{commonDiseases}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Harvest Tips</Text>
          <Text style={[styles.sectionText, { color: colors.text }]}>{harvestTips}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonError: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cropName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cropCategory: {
    fontSize: 16,
    marginTop: 4,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
