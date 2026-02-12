
import React, { useState } from 'react';
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
import { useRouter, Stack } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

const IRRIGATION_TYPES = [
  { label: 'Drip Irrigation', value: 'drip' },
  { label: 'Sprinkler', value: 'sprinkler' },
  { label: 'Flood Irrigation', value: 'flood' },
  { label: 'Manual Watering', value: 'manual' },
  { label: 'None', value: 'none' },
];

const SOIL_TYPES = [
  { label: 'Clay', value: 'clay' },
  { label: 'Sandy', value: 'sandy' },
  { label: 'Loam', value: 'loam' },
  { label: 'Silt', value: 'silt' },
  { label: 'Peat', value: 'peat' },
  { label: 'Chalk', value: 'chalk' },
];

export default function AddFieldScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();

  const [name, setName] = useState('');
  const [type, setType] = useState<'field' | 'bed'>('field');
  const [sizeValue, setSizeValue] = useState('');
  const [sizeUnit, setSizeUnit] = useState<'sq_ft' | 'acres'>('sq_ft');
  const [irrigationType, setIrrigationType] = useState('');
  const [soilType, setSoilType] = useState('');
  const [loading, setLoading] = useState(false);

  const [showIrrigationDropdown, setShowIrrigationDropdown] = useState(false);
  const [showSoilDropdown, setShowSoilDropdown] = useState(false);

  const handleSubmit = async () => {
    console.log('User tapped Submit button to add field/bed');
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for your field or bed');
      return;
    }

    if (!sizeValue.trim() || isNaN(Number(sizeValue)) || Number(sizeValue) <= 0) {
      Alert.alert('Error', 'Please enter a valid size');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        name: name.trim(),
        type,
      };

      // Add size based on unit
      if (sizeUnit === 'sq_ft') {
        body.square_footage = Number(sizeValue);
      } else {
        body.acreage = Number(sizeValue);
      }

      // Add optional fields
      if (irrigationType) {
        body.irrigation_type = irrigationType;
      }
      if (soilType) {
        body.soil_type = soilType;
      }

      console.log('Submitting field/bed data:', body);

      const response = await fetch(`${BACKEND_URL}/api/fields-beds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Field/bed created successfully:', data);
        Alert.alert('Success', 'Field or bed added successfully!', [
          {
            text: 'OK',
            onPress: () => {
              console.log('Navigating back to fields screen');
              router.back();
            },
          },
        ]);
      } else {
        const error = await response.text();
        console.error('Error creating field/bed:', error);
        Alert.alert('Error', 'Failed to add field or bed. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting field/bed:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add Field or Bed',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., North Field, Raised Bed 1"
              placeholderTextColor={colors.icon}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Type *</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  type === 'field' && { backgroundColor: farmGreen, borderColor: farmGreen },
                ]}
                onPress={() => {
                  console.log('User selected type: field');
                  setType('field');
                }}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="square.grid.2x2"
                  android_material_icon_name="grid-on"
                  size={24}
                  color={type === 'field' ? '#fff' : colors.icon}
                />
                <Text style={[styles.typeText, { color: type === 'field' ? '#fff' : colors.text }]}>
                  Field
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  type === 'bed' && { backgroundColor: farmGreen, borderColor: farmGreen },
                ]}
                onPress={() => {
                  console.log('User selected type: bed');
                  setType('bed');
                }}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="square.fill"
                  android_material_icon_name="crop-square"
                  size={24}
                  color={type === 'bed' ? '#fff' : colors.icon}
                />
                <Text style={[styles.typeText, { color: type === 'bed' ? '#fff' : colors.text }]}>
                  Bed
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Size Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Size *</Text>
            <View style={styles.sizeContainer}>
              <TextInput
                style={[
                  styles.sizeInput,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="0"
                placeholderTextColor={colors.icon}
                value={sizeValue}
                onChangeText={setSizeValue}
                keyboardType="decimal-pad"
              />
              <View style={styles.unitContainer}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    { borderColor: colors.border },
                    sizeUnit === 'sq_ft' && { backgroundColor: farmGreen, borderColor: farmGreen },
                  ]}
                  onPress={() => {
                    console.log('User selected unit: sq ft');
                    setSizeUnit('sq_ft');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.unitText, { color: sizeUnit === 'sq_ft' ? '#fff' : colors.text }]}>
                    Sq Ft
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    { borderColor: colors.border },
                    sizeUnit === 'acres' && { backgroundColor: farmGreen, borderColor: farmGreen },
                  ]}
                  onPress={() => {
                    console.log('User selected unit: acres');
                    setSizeUnit('acres');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.unitText, { color: sizeUnit === 'acres' ? '#fff' : colors.text }]}>
                    Acres
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Irrigation Type Dropdown */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Irrigation Type</Text>
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                console.log('User tapped irrigation type dropdown');
                setShowIrrigationDropdown(!showIrrigationDropdown);
                setShowSoilDropdown(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.dropdownText, { color: irrigationType ? colors.text : colors.icon }]}>
                {irrigationType
                  ? IRRIGATION_TYPES.find((t) => t.value === irrigationType)?.label
                  : 'Select irrigation type'}
              </Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name={showIrrigationDropdown ? 'arrow-drop-up' : 'arrow-drop-down'}
                size={24}
                color={colors.icon}
              />
            </TouchableOpacity>
            {showIrrigationDropdown && (
              <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {IRRIGATION_TYPES.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: colors.border },
                      irrigationType === item.value && { backgroundColor: colors.background },
                    ]}
                    onPress={() => {
                      console.log('User selected irrigation type:', item.value);
                      setIrrigationType(item.value);
                      setShowIrrigationDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{item.label}</Text>
                    {irrigationType === item.value && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color={farmGreen}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Soil Type Dropdown */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Soil Type</Text>
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                console.log('User tapped soil type dropdown');
                setShowSoilDropdown(!showSoilDropdown);
                setShowIrrigationDropdown(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.dropdownText, { color: soilType ? colors.text : colors.icon }]}>
                {soilType ? SOIL_TYPES.find((t) => t.value === soilType)?.label : 'Select soil type'}
              </Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name={showSoilDropdown ? 'arrow-drop-up' : 'arrow-drop-down'}
                size={24}
                color={colors.icon}
              />
            </TouchableOpacity>
            {showSoilDropdown && (
              <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {SOIL_TYPES.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: colors.border },
                      soilType === item.value && { backgroundColor: colors.background },
                    ]}
                    onPress={() => {
                      console.log('User selected soil type:', item.value);
                      setSoilType(item.value);
                      setShowSoilDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{item.label}</Text>
                    {soilType === item.value && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color={farmGreen}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: farmGreen }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.7}
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
                <Text style={styles.submitButtonText}>Add Field or Bed</Text>
              </>
            )}
          </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sizeContainer: {
    gap: 12,
  },
  sizeInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  unitContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  unitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  unitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
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
