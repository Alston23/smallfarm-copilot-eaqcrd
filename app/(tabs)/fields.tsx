
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface FieldBed {
  id: string;
  name: string;
  type: 'field' | 'bed';
  square_footage?: number;
  acreage?: number;
  irrigation_type?: string;
  soil_type?: string;
  created_at: string;
}

export default function FieldsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token, signOut } = useAuth();
  
  const [fields, setFields] = useState<FieldBed[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFields = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading fields and beds');
      const response = await fetch(`${BACKEND_URL}/api/fields-beds`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Loaded ${data.length} fields/beds`);
        setFields(data);
      }
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const handleLogout = async () => {
    console.log('User logging out from fields screen');
    await signOut();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Fields & Beds</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Manage your growing areas
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

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={farmGreen} />
          </View>
        ) : fields.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="grid.fill"
              android_material_icon_name="grid-on"
              size={64}
              color={colors.icon}
            />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No fields or beds yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.icon }]}>
              Add your first growing area to get started
            </Text>
          </View>
        ) : (
          <>
            {fields.map((field) => (
              <TouchableOpacity
                key={field.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  console.log('User tapped field:', field.name);
                  router.push(`/field-details/${field.id}`);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <IconSymbol
                    ios_icon_name={field.type === 'field' ? 'grid.fill' : 'square.grid.2x2.fill'}
                    android_material_icon_name={field.type === 'field' ? 'grid-on' : 'grid-view'}
                    size={24}
                    color={farmGreen}
                  />
                  <Text style={[styles.fieldName, { color: colors.text }]}>
                    {field.name}
                  </Text>
                  <View style={[styles.typeBadge, { backgroundColor: farmGreen }]}>
                    <Text style={styles.typeBadgeText}>
                      {field.type.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  {field.acreage && (
                    <Text style={[styles.detailText, { color: colors.icon }]}>
                      📏 {field.acreage} acres
                    </Text>
                  )}
                  {field.square_footage && (
                    <Text style={[styles.detailText, { color: colors.icon }]}>
                      📏 {field.square_footage} sq ft
                    </Text>
                  )}
                  {field.irrigation_type && (
                    <Text style={[styles.detailText, { color: colors.icon }]}>
                      💧 {field.irrigation_type}
                    </Text>
                  )}
                  {field.soil_type && (
                    <Text style={[styles.detailText, { color: colors.icon }]}>
                      🌱 {field.soil_type}
                    </Text>
                  )}
                </View>
                <View style={styles.cardFooter}>
                  <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.icon} />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: farmGreen }]}
          onPress={() => {
            console.log('User tapped Add Field/Bed button');
            router.push('/add-field');
          }}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color="#fff"
          />
          <Text style={styles.addButtonText}>Add Field or Bed</Text>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
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
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  fieldName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
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
