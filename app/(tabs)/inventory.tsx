
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
  Alert,
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
  subcategory?: string;
  quantity: number;
  unit: string;
  reorder_level?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const CATEGORY_INFO: Record<string, { icon: string; iosIcon: string; label: string }> = {
  fertilizer: { icon: 'eco', iosIcon: 'leaf.fill', label: 'Fertilizer' },
  seeds: { icon: 'spa', iosIcon: 'sparkles', label: 'Seeds' },
  transplants: { icon: 'local-florist', iosIcon: 'flower.fill', label: 'Transplants' },
  'value-add-materials': { icon: 'inventory', iosIcon: 'shippingbox.fill', label: 'Value-Add Materials' },
  tools: { icon: 'build', iosIcon: 'wrench.fill', label: 'Tools' },
  other: { icon: 'category', iosIcon: 'square.grid.2x2.fill', label: 'Other' },
};

export default function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token, signOut } = useAuth();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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
        setInventory(data);
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

  const handleLogout = async () => {
    console.log('User logging out from inventory screen');
    await signOut();
    router.replace('/auth/login');
  };

  const isLowStock = (item: InventoryItem) => {
    if (!item.reorder_level) return false;
    return item.quantity <= item.reorder_level;
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDeleteItem = (item: InventoryItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting inventory item:', item.id);
              const response = await fetch(`${BACKEND_URL}/api/inventory/${item.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                loadInventory();
              }
            } catch (error) {
              console.error('Error deleting item:', error);
            }
          },
        },
      ]
    );
  };

  const groupedInventory = inventory.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Inventory</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Track your farming supplies
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
        ) : inventory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="shippingbox.fill"
              android_material_icon_name="inventory"
              size={64}
              color={colors.icon}
            />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No inventory items yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.icon }]}>
              Add your first item to start tracking
            </Text>
          </View>
        ) : (
          <>
            {Object.entries(groupedInventory).map(([category, items]) => {
              const categoryInfo = CATEGORY_INFO[category] || CATEGORY_INFO.other;
              const isExpanded = expandedCategories.has(category);
              const lowStockCount = items.filter(isLowStock).length;

              return (
                <View key={category} style={styles.categorySection}>
                  <TouchableOpacity
                    style={[styles.categoryHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => toggleCategory(category)}
                  >
                    <View style={styles.categoryHeaderLeft}>
                      <IconSymbol
                        ios_icon_name={categoryInfo.iosIcon}
                        android_material_icon_name={categoryInfo.icon}
                        size={24}
                        color={farmGreen}
                      />
                      <Text style={[styles.categoryTitle, { color: colors.text }]}>
                        {categoryInfo.label}
                      </Text>
                      <View style={[styles.countBadge, { backgroundColor: farmGreen }]}>
                        <Text style={styles.countBadgeText}>{items.length}</Text>
                      </View>
                      {lowStockCount > 0 && (
                        <View style={[styles.lowStockBadge, { backgroundColor: appleRed }]}>
                          <Text style={styles.lowStockBadgeText}>
                            {lowStockCount} low
                          </Text>
                        </View>
                      )}
                    </View>
                    <IconSymbol
                      ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
                      android_material_icon_name={isExpanded ? 'expand-less' : 'expand-more'}
                      size={24}
                      color={colors.icon}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.categoryItems}>
                      {items.map((item) => (
                        <View
                          key={item.id}
                          style={[
                            styles.itemCard,
                            {
                              backgroundColor: colors.card,
                              borderColor: isLowStock(item) ? appleRed : colors.border,
                            },
                          ]}
                        >
                          <View style={styles.itemContent}>
                            <View style={styles.itemHeader}>
                              <Text style={[styles.itemName, { color: colors.text }]}>
                                {item.name}
                              </Text>
                              {isLowStock(item) && (
                                <View style={[styles.lowStockIndicator, { backgroundColor: appleRed }]}>
                                  <Text style={styles.lowStockText}>LOW</Text>
                                </View>
                              )}
                            </View>
                            {item.subcategory && (
                              <Text style={[styles.itemSubcategory, { color: colors.icon }]}>
                                {item.subcategory}
                              </Text>
                            )}
                            <Text style={[styles.itemQuantity, { color: colors.text }]}>
                              {item.quantity} {item.unit}
                            </Text>
                            {item.notes && (
                              <Text style={[styles.itemNotes, { color: colors.icon }]}>
                                {item.notes}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteItem(item)}
                          >
                            <IconSymbol
                              ios_icon_name="trash.fill"
                              android_material_icon_name="delete"
                              size={20}
                              color={appleRed}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: farmGreen }]}
          onPress={() => {
            console.log('User tapped Add Inventory button');
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
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lowStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowStockBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryItems: {
    marginTop: 8,
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  lowStockIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowStockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  itemSubcategory: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemNotes: {
    fontSize: 12,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
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
