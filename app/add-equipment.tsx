
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { Colors, farmGreen } from '@/constants/Colors';
import React, { useState } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;

const EQUIPMENT_TYPES = [
  { value: 'tractor', label: 'Tractor' },
  { value: 'harvester', label: 'Harvester' },
  { value: 'planter', label: 'Planter' },
  { value: 'implement', label: 'Implement' },
  { value: 'sprayer', label: 'Sprayer' },
  { value: 'other', label: 'Other' },
];

export default function AddEquipmentScreen() {
  const [equipmentType, setEquipmentType] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [hours, setHours] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState<Date | null>(null);
  const [nextServiceDate, setNextServiceDate] = useState<Date | null>(null);
  const [serviceIntervalHours, setServiceIntervalHours] = useState('');
  const [notes, setNotes] = useState('');
  const [showLastServicePicker, setShowLastServicePicker] = useState(false);
  const [showNextServicePicker, setShowNextServicePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSubmit = async () => {
    console.log('User submitting new equipment');

    if (!equipmentType) {
      Alert.alert('Error', 'Please select an equipment type');
      return;
    }

    if (!make.trim()) {
      Alert.alert('Error', 'Please enter the equipment make');
      return;
    }

    if (!model.trim()) {
      Alert.alert('Error', 'Please enter the equipment model');
      return;
    }

    try {
      setSubmitting(true);

      const body: any = {
        equipmentType,
        make: make.trim(),
        model: model.trim(),
      };

      if (hours.trim()) {
        body.hours = parseFloat(hours);
      }

      if (lastServiceDate) {
        body.lastServiceDate = lastServiceDate.toISOString();
      }

      if (nextServiceDate) {
        body.nextServiceDate = nextServiceDate.toISOString();
      }

      if (serviceIntervalHours.trim()) {
        body.serviceIntervalHours = parseFloat(serviceIntervalHours);
      }

      if (notes.trim()) {
        body.notes = notes.trim();
      }

      console.log('Submitting equipment data:', body);

      const response = await fetch(`${BACKEND_URL}/api/equipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add equipment');
      }

      console.log('Equipment added successfully');
      Alert.alert('Success', 'Equipment added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error adding equipment:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add equipment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add Equipment',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Equipment Type *</Text>
          <View style={styles.typeGrid}>
            {EQUIPMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  equipmentType === type.value && styles.typeButtonSelected,
                ]}
                onPress={() => {
                  console.log('User selected equipment type:', type.label);
                  setEquipmentType(type.value);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: colors.text },
                    equipmentType === type.value && styles.typeButtonTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Make *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="e.g., John Deere, Case IH, New Holland"
            placeholderTextColor={colors.icon}
            value={make}
            onChangeText={setMake}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Model *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="e.g., 5075E, Magnum 340, T7.315"
            placeholderTextColor={colors.icon}
            value={model}
            onChangeText={setModel}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Hours (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Current equipment hours"
            placeholderTextColor={colors.icon}
            value={hours}
            onChangeText={setHours}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Service Interval Hours (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Hours between services (e.g., 250)"
            placeholderTextColor={colors.icon}
            value={serviceIntervalHours}
            onChangeText={setServiceIntervalHours}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Last Service Date (Optional)</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowLastServicePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dateButtonText, { color: lastServiceDate ? colors.text : colors.icon }]}>
              {lastServiceDate ? lastServiceDate.toLocaleDateString() : 'Select date'}
            </Text>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={20}
              color={colors.icon}
            />
          </TouchableOpacity>
          {showLastServicePicker && (
            <DateTimePicker
              value={lastServiceDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowLastServicePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  console.log('User selected last service date:', selectedDate);
                  setLastServiceDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Next Service Date (Optional)</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowNextServicePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dateButtonText, { color: nextServiceDate ? colors.text : colors.icon }]}>
              {nextServiceDate ? nextServiceDate.toLocaleDateString() : 'Select date'}
            </Text>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={20}
              color={colors.icon}
            />
          </TouchableOpacity>
          {showNextServicePicker && (
            <DateTimePicker
              value={nextServiceDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowNextServicePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  console.log('User selected next service date:', selectedDate);
                  setNextServiceDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
            placeholder="Additional notes about this equipment"
            placeholderTextColor={colors.icon}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: farmGreen }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Equipment</Text>
          )}
        </TouchableOpacity>
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeButtonSelected: {
    backgroundColor: farmGreen,
    borderColor: farmGreen,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  dateButtonText: {
    fontSize: 16,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
