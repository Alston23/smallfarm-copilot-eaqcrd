
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
import { Colors, farmGreen, appleRed } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorder_level?: number;
}

export default function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading inventory');
      const response = await fetch(`${BACKEND_URL}/api/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Loaded ${data.length} inventory items`);
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const isLowStock = (item: InventoryItem) => {
    return item.reorder_level && item.quantity <= item.reorder_level;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Inventory</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Track your farming supplies
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={farmGreen} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="cube.box.fill"
              android_material_icon_name="inventory"
              size={64}
              color={colors.icon}
            />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No inventory items yet
            </Text>
          </View>
        ) : (
          <>
            {items.map((item) => (
              <View
                key={item.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.itemCategory, { color: colors.icon }]}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </Text>
                  </View>
                  {isLowStock(item) && (
                    <View style={[styles.lowStockBadge, { backgroundColor: appleRed }]}>
                      <Text style={styles.lowStockText}>Low</Text>
                    </View>
                  )}
                </View>
                <View style={styles.quantityContainer}>
                  <Text style={[styles.quantity, { color: colors.text }]}>
                    {item.quantity} {item.unit}
                  </Text>
                  {item.reorder_level && (
                    <Text style={[styles.reorderLevel, { color: colors.icon }]}>
                      Reorder at: {item.reorder_level} {item.unit}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: farmGreen }]}
          onPress={() => {
            console.log('User tapped Add Inventory Item button');
            router.push('/add-inventory');
          }}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color="#fff"
          />
          <Text style={styles.addButtonText}>Add Inventory Item</Text>
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
    fontSize: 16,
    marginTop: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemCategory: {
    fontSize: 14,
    marginTop: 4,
  },
  lowStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowStockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  quantityContainer: {
    gap: 4,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
  },
  reorderLevel: {
    fontSize: 12,
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
