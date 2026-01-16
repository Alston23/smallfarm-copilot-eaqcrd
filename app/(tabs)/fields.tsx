
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
import { useRouter } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface FieldBed {
  id: string;
  name: string;
  type: string;
  size_value: number;
  size_unit: string;
  crop?: {
    id: string;
    name: string;
  };
  planting_date?: string;
}

export default function FieldsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();
  
  const [fieldsBeds, setFieldsBeds] = useState<FieldBed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFieldsBeds();
  }, []);

  const loadFieldsBeds = async () => {
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
        setFieldsBeds(data);
      }
    } catch (error) {
      console.error('Error loading fields/beds:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Fields & Beds</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Manage your growing spaces
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={farmGreen} />
          </View>
        ) : fieldsBeds.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="square.grid.2x2"
              android_material_icon_name="grid-on"
              size={64}
              color={colors.icon}
            />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No fields or beds yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.icon }]}>
              Add your first growing space to get started
            </Text>
          </View>
        ) : (
          <>
            {fieldsBeds.map((item) => (
              <View
                key={item.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardHeader}>
                  <IconSymbol
                    ios_icon_name={item.type === 'field' ? 'square.grid.2x2' : 'square.fill'}
                    android_material_icon_name={item.type === 'field' ? 'grid-on' : 'crop-square'}
                    size={32}
                    color={farmGreen}
                  />
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.cardType, { color: colors.icon }]}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {item.size_value} {item.size_unit}
                    </Text>
                  </View>
                </View>
                {item.crop && (
                  <View style={[styles.cropInfo, { backgroundColor: colors.background }]}>
                    <Text style={[styles.cropLabel, { color: colors.icon }]}>Growing:</Text>
                    <Text style={[styles.cropName, { color: colors.text }]}>{item.crop.name}</Text>
                  </View>
                )}
              </View>
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
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
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
    fontWeight: '600',
    marginTop: 16,
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
    gap: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardType: {
    fontSize: 14,
    marginTop: 4,
  },
  cropInfo: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  cropLabel: {
    fontSize: 14,
  },
  cropName: {
    fontSize: 14,
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
