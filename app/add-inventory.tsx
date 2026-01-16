
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
import { useAuth } from '@/contexts/AuthContext';
import { Colors, farmGreen } from '@/constants/Colors';
import { useRouter, Stack } from 'expo-router';
import Constants from 'expo-constants';
import { IconSymbol } from '@/components/IconSymbol';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

// Inventory categories with their subcategories
const INVENTORY_CATEGORIES = {
  fertilizer: {
    label: 'Fertilizer',
    icon: 'science',
    subcategories: [
      'Nitrogen Fertilizer',
      'Phosphorus Fertilizer',
      'Potassium Fertilizer',
      'Organic Compost',
      'Manure',
      'Fish Emulsion',
      'Bone Meal',
      'Blood Meal',
      'Liquid Fertilizer',
      'Granular Fertilizer',
      'Other',
    ],
  },
  seeds: {
    label: 'Seeds',
    icon: 'spa',
    subcategories: [
      'Vegetable Seeds',
      'Fruit Seeds',
      'Herb Seeds',
      'Flower Seeds',
      'Cover Crop Seeds',
      'Microgreen Seeds',
      'Sprouting Seeds',
      'Other',
    ],
  },
  transplants: {
    label: 'Transplants',
    icon: 'local-florist',
    useCrops: true,
    subcategories: [],
  },
  value_add_materials: {
    label: 'Value-Add Materials',
    icon: 'inventory',
    subcategories: [
      'Boxes',
      'Crates',
      'Flower Wraps',
      'Bouquet Sleeves',
      'Labels',
      'Stickers',
      'Bags',
      'Containers',
      'Twist Ties',
      'Rubber Bands',
      'Packaging Tape',
      'Other',
    ],
  },
  pesticides: {
    label: 'Pesticides & Pest Control',
    icon: 'bug-report',
    subcategories: [
      'Organic Pesticide',
      'Insecticide',
      'Fungicide',
      'Herbicide',
      'Neem Oil',
      'Diatomaceous Earth',
      'Beneficial Insects',
      'Traps',
      'Other',
    ],
  },
  tools: {
    label: 'Tools & Equipment',
    icon: 'build',
    subcategories: [
      'Hand Tools',
      'Power Tools',
      'Pruning Shears',
      'Hoes',
      'Rakes',
      'Shovels',
      'Wheelbarrows',
      'Gloves',
      'Other',
    ],
  },
  packaging: {
    label: 'Packaging Supplies',
    icon: 'inventory-2',
    subcategories: [
      'Plastic Bags',
      'Paper Bags',
      'Cardboard Boxes',
      'Clamshells',
      'Pint Containers',
      'Quart Containers',
      'Mesh Bags',
      'Other',
    ],
  },
  irrigation_supplies: {
    label: 'Irrigation Supplies',
    icon: 'water-drop',
    subcategories: [
      'Drip Tape',
      'Drip Emitters',
      'Sprinkler Heads',
      'Hoses',
      'Fittings',
      'Valves',
      'Timers',
      'Filters',
      'Other',
    ],
  },
  soil_amendments: {
    label: 'Soil Amendments',
    icon: 'landscape',
    subcategories: [
      'Lime',
      'Sulfur',
      'Gypsum',
      'Peat Moss',
      'Vermiculite',
      'Perlite',
      'Biochar',
      'Mycorrhizae',
      'Other',
    ],
  },
  other: {
    label: 'Other Supplies',
    icon: 'category',
    subcategories: ['Other'],
  },
};

const UNITS = [
  'lbs',
  'kg',
  'oz',
  'g',
  'gallons',
  'liters',
  'bags',
  'boxes',
  'units',
  'pieces',
  'rolls',
  'bottles',
  'packets',
];

const TRANSPLANT_UNITS = ['individual plants', 'trays'];

interface Crop {
  id: string;
  name: string;
  category: string;
}

export default function AddInventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();

  const [step, setStep] = useState<'category' | 'details'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [name, setName] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('lbs');
  const [reorderLevel, setReorderLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // For transplants
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<string>('');

  const loadCrops = useCallback(async () => {
    setLoadingCrops(true);
    try {
      console.log('Loading crops for transplants');
      // /api/crops is now a public endpoint, no authentication required
      const response = await fetch(`${BACKEND_URL}/api/crops`);

      if (response.ok) {
        const data = await response.json();
        console.log(`Loaded ${data.length} crops`);
        setCrops(data);
      } else {
        console.error('Failed to load crops:', response.status, await response.text());
        Alert.alert('Error', 'Failed to load crops. Please try again.');
      }
    } catch (error) {
      console.error('Error loading crops:', error);
      Alert.alert('Error', 'Failed to load crops. Please check your connection.');
    } finally {
      setLoadingCrops(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory === 'transplants') {
      loadCrops();
      setUnit('individual plants');
    }
  }, [selectedCategory, loadCrops]);

  const handleCategorySelect = (category: string) => {
    console.log('User selected inventory category:', category);
    setSelectedCategory(category);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (selectedCategory === 'transplants' && !selectedCrop) {
      Alert.alert('Error', 'Please select a crop');
      return;
    }

    if (!name.trim() && selectedCategory !== 'transplants') {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (!quantity.trim() || isNaN(parseFloat(quantity))) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    console.log('User tapped Save Inventory Item button', {
      name,
      category: selectedCategory,
      subcategory,
      quantity,
      unit,
    });

    setLoading(true);
    try {
      const itemName = selectedCategory === 'transplants' 
        ? crops.find(c => c.id === selectedCrop)?.name || name
        : name.trim();

      const body = {
        name: itemName,
        category: selectedCategory,
        subcategory: subcategory || undefined,
        quantity,
        unit,
        reorderLevel: reorderLevel ? reorderLevel : undefined,
        notes: notes.trim() || undefined,
      };

      console.log('Submitting inventory item:', body);

      const response = await fetch(`${BACKEND_URL}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        console.log('Inventory item created successfully');
        Alert.alert('Success', 'Inventory item added successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        const error = await response.text();
        console.error('Failed to create inventory item:', error);
        Alert.alert('Error', 'Failed to add inventory item');
      }
    } catch (error) {
      console.error('Error creating inventory item:', error);
      Alert.alert('Error', 'Failed to add inventory item');
    } finally {
      setLoading(false);
    }
  };

  const isTransplants = selectedCategory === 'transplants';
  const availableUnits = isTransplants ? TRANSPLANT_UNITS : UNITS;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: step === 'category' ? 'Select Category' : 'Add Item Details',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {step === 'category' ? (
          <>
            <Text style={[styles.instruction, { color: colors.icon }]}>
              What type of item are you adding to inventory?
            </Text>

            {Object.entries(INVENTORY_CATEGORIES).map(([key, category]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => handleCategorySelect(key)}
              >
                <View style={[styles.iconCircle, { backgroundColor: farmGreen + '20' }]}>
                  <IconSymbol
                    ios_icon_name="cube.box.fill"
                    android_material_icon_name={category.icon}
                    size={28}
                    color={farmGreen}
                  />
                </View>
                <Text style={[styles.categoryLabel, { color: colors.text }]}>
                  {category.label}
                </Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron-right"
                  size={24}
                  color={colors.icon}
                />
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <View style={[styles.selectedCategory, { backgroundColor: colors.card }]}>
              <IconSymbol
                ios_icon_name="cube.box.fill"
                android_material_icon_name={
                  INVENTORY_CATEGORIES[selectedCategory as keyof typeof INVENTORY_CATEGORIES]
                    ?.icon || 'inventory'
                }
                size={24}
                color={farmGreen}
              />
              <Text style={[styles.selectedCategoryText, { color: colors.text }]}>
                {
                  INVENTORY_CATEGORIES[selectedCategory as keyof typeof INVENTORY_CATEGORIES]
                    ?.label
                }
              </Text>
              <TouchableOpacity
                onPress={() => {
                  console.log('User tapped Change Category button');
                  setStep('category');
                  setSelectedCrop('');
                  setName('');
                }}
              >
                <Text style={[styles.changeButton, { color: farmGreen }]}>Change</Text>
              </TouchableOpacity>
            </View>

            {isTransplants ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Select Crop *</Text>
                  {loadingCrops ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color={farmGreen} />
                      <Text style={[styles.loadingText, { color: colors.icon }]}>
                        Loading crops...
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.cropScroll}
                    >
                      {crops.map((crop) => (
                        <TouchableOpacity
                          key={crop.id}
                          style={[
                            styles.cropChip,
                            {
                              backgroundColor:
                                selectedCrop === crop.id ? farmGreen : colors.card,
                              borderColor: selectedCrop === crop.id ? farmGreen : colors.border,
                            },
                          ]}
                          onPress={() => {
                            console.log('User selected crop:', crop.name);
                            setSelectedCrop(crop.id);
                            setName(crop.name);
                          }}
                        >
                          <Text
                            style={[
                              styles.cropText,
                              { color: selectedCrop === crop.id ? '#fff' : colors.text },
                            ]}
                          >
                            {crop.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Item Name *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g., 10-10-10 Fertilizer"
                    placeholderTextColor={colors.icon}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Type/Subcategory</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.subcategoryScroll}
                  >
                    {INVENTORY_CATEGORIES[
                      selectedCategory as keyof typeof INVENTORY_CATEGORIES
                    ]?.subcategories.map((sub) => (
                      <TouchableOpacity
                        key={sub}
                        style={[
                          styles.subcategoryChip,
                          {
                            backgroundColor:
                              subcategory === sub ? farmGreen : colors.card,
                            borderColor: subcategory === sub ? farmGreen : colors.border,
                          },
                        ]}
                        onPress={() => {
                          console.log('User selected subcategory:', sub);
                          setSubcategory(sub);
                        }}
                      >
                        <Text
                          style={[
                            styles.subcategoryText,
                            { color: subcategory === sub ? '#fff' : colors.text },
                          ]}
                        >
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Quantity *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Unit *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.unitScroll}
                >
                  {availableUnits.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.unitChip,
                        {
                          backgroundColor: unit === u ? farmGreen : colors.card,
                          borderColor: unit === u ? farmGreen : colors.border,
                        },
                      ]}
                      onPress={() => {
                        console.log('User selected unit:', u);
                        setUnit(u);
                      }}
                    >
                      <Text
                        style={[
                          styles.unitText,
                          { color: unit === u ? '#fff' : colors.text },
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Reorder Level (Optional)
              </Text>
              <Text style={[styles.helperText, { color: colors.icon }]}>
                Get notified when quantity falls below this level
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                ]}
                value={reorderLevel}
                onChangeText={setReorderLevel}
                placeholder="e.g., 10"
                placeholderTextColor={colors.icon}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional details about this item..."
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: farmGreen },
                loading && styles.submitButtonDisabled,
              ]}
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
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.submitButtonText}>Add to Inventory</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 100,
  },
  instruction: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  selectedCategoryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  changeButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  subcategoryScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  subcategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  subcategoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cropScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  cropChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  cropText: {
    fontSize: 14,
    fontWeight: '500',
  },
  unitScroll: {
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
