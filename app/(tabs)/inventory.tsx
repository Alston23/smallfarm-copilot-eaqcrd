
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

const CATEGORY_INFO: Record<string, { label: string; icon: string }> = {
  fertilizer: { label: 'Fertilizer', icon: 'science' },
  seeds: { label: 'Seeds', icon: 'spa' },
  transplants: { label: 'Transplants', icon: 'local-florist' },
  value_add_materials: { label: 'Value-Add Materials', icon: 'inventory' },
  pesticides: { label: 'Pesticides & Pest Control', icon: 'bug-report' },
  tools: { label: 'Tools & Equipment', icon: 'build' },
  packaging: { label: 'Packaging Supplies', icon: 'inventory-2' },
  irrigation_supplies: { label: 'Irrigation Supplies', icon: 'water-drop' },
  soil_amendments: { label: 'Soil Amendments', icon: 'landscape' },
  other: { label: 'Other Supplies', icon: 'category' },
};

export default function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading inventory');
      const response = await fetch(`${BACKEND_URL}/api/inventory`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Loaded ${data.length} inventory items`);
        setItems(data);
        // Expand all categories by default
        const categories = new Set(data.map((item: InventoryItem) => item.category));
        setExpandedCategories(categories);
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

  const toggleCategory = (category: string) => {
    console.log('User toggled category:', category);
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('User confirmed delete for item:', item.id);
            try {
              const response = await fetch(`${BACKEND_URL}/api/inventory/${item.id}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok) {
                console.log('Item deleted successfully');
                loadInventory();
              } else {
                Alert.alert('Error', 'Failed to delete item');
              }
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // Calculate total items and low stock count
  const totalItems = items.length;
  const lowStockCount = items.filter(isLowStock).length;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Inventory</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          {totalItems} items
          {lowStockCount > 0 && ` • ${lowStockCount} low stock`}
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
            <Text style={[styles.emptySubtext, { color: colors.icon }]}>
              Tap the button below to add your first item
            </Text>
          </View>
        ) : (
          <>
            {Object.entries(groupedItems).map(([category, categoryItems]) => {
              const categoryInfo = CATEGORY_INFO[category] || {
                label: category,
                icon: 'category',
              };
              const isExpanded = expandedCategories.has(category);
              const lowStockInCategory = categoryItems.filter(isLowStock).length;

              return (
                <View key={category} style={styles.categorySection}>
                  <TouchableOpacity
                    style={[
                      styles.categoryHeader,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={() => toggleCategory(category)}
                  >
                    <View style={styles.categoryHeaderLeft}>
                      <View
                        style={[styles.categoryIconCircle, { backgroundColor: farmGreen + '20' }]}
                      >
                        <IconSymbol
                          ios_icon_name="cube.box.fill"
                          android_material_icon_name={categoryInfo.icon}
                          size={20}
                          color={farmGreen}
                        />
                      </View>
                      <View style={styles.categoryHeaderText}>
                        <Text style={[styles.categoryTitle, { color: colors.text }]}>
                          {categoryInfo.label}
                        </Text>
                        <Text style={[styles.categoryCount, { color: colors.icon }]}>
                          {categoryItems.length} items
                          {lowStockInCategory > 0 && ` • ${lowStockInCategory} low`}
                        </Text>
                      </View>
                    </View>
                    <IconSymbol
                      ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
                      android_material_icon_name={
                        isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'
                      }
                      size={24}
                      color={colors.icon}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.categoryItems}>
                      {categoryItems.map((item) => (
                        <View
                          key={item.id}
                          style={[
                            styles.itemCard,
                            { backgroundColor: colors.card, borderColor: colors.border },
                          ]}
                        >
                          <View style={styles.itemHeader}>
                            <View style={styles.itemInfo}>
                              <Text style={[styles.itemName, { color: colors.text }]}>
                                {item.name}
                              </Text>
                              {item.subcategory && (
                                <Text style={[styles.itemSubcategory, { color: colors.icon }]}>
                                  {item.subcategory}
                                </Text>
                              )}
                            </View>
                            <View style={styles.itemActions}>
                              {isLowStock(item) && (
                                <View style={[styles.lowStockBadge, { backgroundColor: appleRed }]}>
                                  <Text style={styles.lowStockText}>Low</Text>
                                </View>
                              )}
                              <TouchableOpacity
                                onPress={() => handleDeleteItem(item)}
                                style={styles.deleteButton}
                              >
                                <IconSymbol
                                  ios_icon_name="trash"
                                  android_material_icon_name="delete"
                                  size={20}
                                  color={appleRed}
                                />
                              </TouchableOpacity>
                            </View>
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

                          {item.notes && (
                            <Text style={[styles.itemNotes, { color: colors.icon }]}>
                              {item.notes}
                            </Text>
                          )}
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
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryHeaderText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryItems: {
    marginTop: 8,
    gap: 8,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubcategory: {
    fontSize: 13,
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lowStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowStockText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  quantityContainer: {
    gap: 4,
  },
  quantity: {
    fontSize: 15,
    fontWeight: '600',
  },
  reorderLevel: {
    fontSize: 12,
  },
  itemNotes: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
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
