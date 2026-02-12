
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
  { id: 'fruits', label: 'Fruits', icon: 'local-florist', iosIcon: 'apple.logo' },
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
  const { token, signOut } = useAuth();
  
  const [selectedCategory, setSelectedCategory] = useState('vegetables');
  const [searchQuery, setSearchQuery] = useState('');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCrops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading crops for category:', selectedCategory, 'search:', searchQuery);
      const url = `${BACKEND_URL}/api/crops`;
      
      // Don't require authentication for browsing crops
      const response = await fetch(url);

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
        const errorText = await response.text();
        console.error('Failed to load crops:', response.status, errorText);
        setError(`Unable to load crops (Error ${response.status}). The backend is being updated, please try again in a moment.`);
        setCrops([]);
      }
    } catch (error) {
      console.error('Error loading crops:', error);
      setError('Unable to connect to the server. Please check your internet connection and try again.');
      setCrops([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    console.log('Category or search changed, reloading crops');
    loadCrops();
  }, [loadCrops]);

  const handleLogout = async () => {
    console.log('User logging out from crops screen');
    await signOut();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Crop Library</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Browse and learn about different crops
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <IconSymbol
            ios_icon_name="arrow.right.square.fill"
            android_material_icon_name="logout"
            size={24}
            color="#ef4444"
          />
        </TouchableOpacity>
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
            onChangeText={(text) => {
              console.log('User searching for:', text);
              setSearchQuery(text);
            }}
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
              setSearchQuery(''); // Clear search when changing category
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
            <Text style={[styles.loadingText, { color: colors.icon }]}>
              Loading {selectedCategory}...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={64}
              color="#ff9500"
            />
            <Text style={[styles.errorText, { color: colors.text }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: farmGreen }]}
              onPress={() => {
                console.log('User tapped retry button');
                loadCrops();
              }}
            >
              <IconSymbol
                ios_icon_name="arrow.clockwise"
                android_material_icon_name="refresh"
                size={20}
                color="#fff"
              />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
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
              {searchQuery ? `No ${selectedCategory} found matching "${searchQuery}"` : `No ${selectedCategory} available yet`}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.icon }]}>
              {searchQuery ? 'Try a different search term' : 'Check back soon or add a custom crop'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.countContainer}>
              <Text style={[styles.countText, { color: colors.icon }]}>
                {crops.length} {selectedCategory} {searchQuery ? `matching "${searchQuery}"` : 'available'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
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
    paddingRight: 40,
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
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
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
