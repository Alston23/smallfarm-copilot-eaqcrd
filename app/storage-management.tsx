
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

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface StorageInfo {
  coldStorageCapacity: number;
  coldStorageUsed: number;
  dryStorageCapacity: number;
  dryStorageUsed: number;
  coldStoragePercentage: number;
  dryStoragePercentage: number;
}

export default function StorageManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storage, setStorage] = useState<StorageInfo>({
    coldStorageCapacity: 0,
    coldStorageUsed: 0,
    dryStorageCapacity: 0,
    dryStorageUsed: 0,
    coldStoragePercentage: 0,
    dryStoragePercentage: 0,
  });

  const [coldCapacity, setColdCapacity] = useState('');
  const [coldUsed, setColdUsed] = useState('');
  const [dryCapacity, setDryCapacity] = useState('');
  const [dryUsed, setDryUsed] = useState('');

  const loadStorage = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading storage information');
      // Fetch current storage capacity and usage
      const response = await fetch(`${BACKEND_URL}/api/inventory/storage`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Storage data loaded:', data);
        setStorage(data);
        setColdCapacity(data.coldStorageCapacity?.toString() || '');
        setColdUsed(data.coldStorageUsed?.toString() || '');
        setDryCapacity(data.dryStorageCapacity?.toString() || '');
        setDryUsed(data.dryStorageUsed?.toString() || '');
      }
    } catch (error) {
      console.error('Error loading storage:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleRecalculate = async () => {
    console.log('User recalculating storage from inventory');
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/inventory/storage/recalculate`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Storage recalculated:', data);
        Alert.alert('Success', 'Storage has been recalculated based on your current inventory');
        loadStorage();
      } else {
        throw new Error('Failed to recalculate storage');
      }
    } catch (error) {
      console.error('Error recalculating storage:', error);
      Alert.alert('Error', 'Failed to recalculate storage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorage();
  }, [loadStorage]);

  const handleSave = async () => {
    console.log('User saving storage information');
    setSaving(true);
    try {
      // Update storage capacity and usage in the database
      const response = await fetch(`${BACKEND_URL}/api/inventory/storage`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coldStorageCapacity: coldCapacity ? parseFloat(coldCapacity) : 0,
          coldStorageUsed: coldUsed ? parseFloat(coldUsed) : 0,
          dryStorageCapacity: dryCapacity ? parseFloat(dryCapacity) : 0,
          dryStorageUsed: dryUsed ? parseFloat(dryUsed) : 0,
        }),
      });

      if (response.ok) {
        console.log('Storage information saved successfully');
        Alert.alert('Success', 'Storage information updated');
        loadStorage();
      } else {
        throw new Error('Failed to save storage information');
      }
    } catch (error) {
      console.error('Error saving storage:', error);
      Alert.alert('Error', 'Failed to save storage information');
    } finally {
      setSaving(false);
    }
  };

  const getStorageColor = (percentage: number) => {
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 75) return '#f59e0b';
    return farmGreen;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: true, title: 'Storage Management' }} />
        <ActivityIndicator size="large" color={farmGreen} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Storage Management' }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={[styles.description, { color: colors.icon }]}>
            Track your cold and dry storage capacity to get alerts when storage is running low.
          </Text>

          {/* Cold Storage */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <IconSymbol ios_icon_name="snowflake" android_material_icon_name="ac-unit" size={24} color={farmGreen} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Cold Storage</Text>
            </View>

            {storage.coldStorageCapacity > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${storage.coldStoragePercentage}%`,
                        backgroundColor: getStorageColor(storage.coldStoragePercentage),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.text }]}>
                  {storage.coldStorageUsed} / {storage.coldStorageCapacity} cu ft ({storage.coldStoragePercentage.toFixed(0)}%)
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Capacity (cubic feet)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={coldCapacity}
                onChangeText={setColdCapacity}
                placeholder="0"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Currently Used (cubic feet)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={coldUsed}
                onChangeText={setColdUsed}
                placeholder="0"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Dry Storage */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <IconSymbol ios_icon_name="cube.box.fill" android_material_icon_name="inventory" size={24} color={farmGreen} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Dry Storage</Text>
            </View>

            {storage.dryStorageCapacity > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${storage.dryStoragePercentage}%`,
                        backgroundColor: getStorageColor(storage.dryStoragePercentage),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.text }]}>
                  {storage.dryStorageUsed} / {storage.dryStorageCapacity} cu ft ({storage.dryStoragePercentage.toFixed(0)}%)
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Capacity (cubic feet)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={dryCapacity}
                onChangeText={setDryCapacity}
                placeholder="0"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Currently Used (cubic feet)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={dryUsed}
                onChangeText={setDryUsed}
                placeholder="0"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Alerts Info */}
          <View style={[styles.alertCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol ios_icon_name="bell.fill" android_material_icon_name="notifications" size={24} color={farmGreen} />
            <Text style={[styles.alertText, { color: colors.text }]}>
              You&apos;ll receive alerts when storage reaches 75% and 90% capacity
            </Text>
          </View>

          {/* Auto-Update Info */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={24} color={farmGreen} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Storage automatically updates when you add inventory items or record harvests. Use the recalculate button if storage seems incorrect.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: farmGreen }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Save Storage Capacity</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.recalculateButton, { backgroundColor: colors.card, borderColor: farmGreen }]}
            onPress={handleRecalculate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={farmGreen} />
            ) : (
              <>
                <IconSymbol ios_icon_name="arrow.clockwise" android_material_icon_name="refresh" size={24} color={farmGreen} />
                <Text style={[styles.recalculateButtonText, { color: farmGreen }]}>Recalculate from Inventory</Text>
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
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
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
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recalculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
  },
  recalculateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
