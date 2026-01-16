
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
import { useRouter } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

const categories = [
  { id: 'vegetables', label: 'Vegetables', icon: 'eco', iosIcon: 'leaf.fill' },
  { id: 'fruits', label: 'Fruits', icon: 'apple', iosIcon: 'apple.logo' },
  { id: 'herbs', label: 'Herbs', icon: 'spa', iosIcon: 'sparkles' },
  { id: 'flowers', label: 'Flowers', icon: 'local-florist', iosIcon: 'flower.fill' },
];

interface Crop {
  id: string;
  name: string;
  category: string;
  is_custom?: boolean;
  isCustom?: boolean;
}

export default function CropsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();
  
  const [selectedCategory, setSelectedCategory] = useState('vegetables');
  const [searchQuery, setSearchQuery] = useState('');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCrops = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading crops for category:', selectedCategory, 'search:', searchQuery);
      const url = `${BACKEND_URL}/api/crops`;
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Loaded ${data.length} total crops from backend`);
        
        // Filter by category and search query on the frontend
        let filteredCrops = data.filter((crop: Crop) => 
          crop.category === selectedCategory
        );
        
        if (searchQuery) {
          filteredCrops = filteredCrops.filter((crop: Crop) =>
            crop.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        console.log(`Filtered to ${filteredCrops.length} crops for ${selectedCategory}`);
        setCrops(filteredCrops);
      } else {
        console.error('Failed to load crops:', response.status);
        Alert.alert('Error', 'Failed to load crops. Please try again.');
      }
    } catch (error) {
      console.error('Error loading crops:', error);
      Alert.alert('Error', 'Failed to load crops. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, token]);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Crop Library</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Browse and learn about different crops
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.icon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search crops..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              {
                backgroundColor: selectedCategory === category.id ? farmGreen : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              console.log('User selected category:', category.id);
              setSelectedCategory(category.id);
            }}
          >
            <IconSymbol
              ios_icon_name={category.iosIcon}
              android_material_icon_name={category.icon}
              size={24}
              color={selectedCategory === category.id ? '#fff' : colors.text}
            />
            <Text
              style={[
                styles.categoryText,
                { color: selectedCategory === category.id ? '#fff' : colors.text },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={farmGreen} />
          </View>
        ) : crops.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="leaf.fill"
              android_material_icon_name="eco"
              size={64}
              color={colors.icon}
            />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              {searchQuery ? 'No crops found' : 'No crops available'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.countContainer}>
              <Text style={[styles.countText, { color: colors.icon }]}>
                {crops.length} {selectedCategory} available
              </Text>
            </View>
            {crops.map((crop, index) => (
              <TouchableOpacity
                key={`${crop.id}-${index}`}
                style={[styles.cropCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  console.log('User tapped crop:', crop.name, 'ID:', crop.id);
                  router.push(`/(tabs)/(crops)/${crop.id}`);
                }}
              >
                <View style={styles.cropInfo}>
                  <Text style={[styles.cropName, { color: colors.text }]}>{crop.name}</Text>
                  {(crop.is_custom || crop.isCustom) && (
                    <View style={[styles.customBadge, { backgroundColor: farmGreen }]}>
                      <Text style={styles.customBadgeText}>Custom</Text>
                    </View>
                  )}
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.icon}
                />
              </TouchableOpacity>
            ))}
          </>
        )}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: farmGreen }]}
          onPress={() => {
            console.log('User tapped Add Custom Crop button');
            router.push('/(tabs)/(crops)/add-custom');
          }}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color="#fff"
          />
          <Text style={styles.addButtonText}>Add Custom Crop</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  categoriesScroll: {
    maxHeight: 100,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
    fontSize: 16,
    marginTop: 16,
  },
  countContainer: {
    marginBottom: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cropInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
  },
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  customBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
