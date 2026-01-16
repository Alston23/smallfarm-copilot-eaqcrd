
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Platform,
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
  row_spacing: string;
  plant_spacing: string;
  soil_ph_min: number;
  soil_ph_max: number;
  days_to_maturity: number;
  planting_depth: string;
  sun_requirements: string;
  water_requirements: string;
  common_pests: string;
  common_diseases: string;
  fertilizer_schedule: string;
  harvest_tips: string;
  is_custom: boolean;
}

export default function CropDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  
  const [crop, setCrop] = useState<CropDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCropDetail();
  }, [id]);

  const loadCropDetail = async () => {
    setLoading(true);
    try {
      console.log('Loading crop detail for id:', id);
      const response = await fetch(`${BACKEND_URL}/api/crops/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded crop detail:', data.name);
        setCrop(data);
      } else {
        console.error('Failed to load crop detail:', response.status);
      }
    } catch (error) {
      console.error('Error loading crop detail:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={[styles.errorText, { color: colors.text }]}>Crop not found</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={[styles.infoValue, { color: colors.text }]}>{crop.row_spacing}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Plant Spacing:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{crop.plant_spacing}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Planting Depth:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{crop.planting_depth}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Days to Maturity:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{crop.days_to_maturity} days</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Growing Conditions</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Soil pH:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {crop.soil_ph_min} - {crop.soil_ph_max}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Sun Requirements:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{crop.sun_requirements}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>Water Requirements:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{crop.water_requirements}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fertilizer Schedule</Text>
          <Text style={[styles.sectionText, { color: colors.text }]}>{crop.fertilizer_schedule}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Common Pests</Text>
          <Text style={[styles.sectionText, { color: colors.text }]}>{crop.common_pests}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Common Diseases</Text>
          <Text style={[styles.sectionText, { color: colors.text }]}>{crop.common_diseases}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Harvest Tips</Text>
          <Text style={[styles.sectionText, { color: colors.text }]}>{crop.harvest_tips}</Text>
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
  },
  errorText: {
    fontSize: 16,
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
