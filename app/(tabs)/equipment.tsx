
import { useRouter } from 'expo-router';
import { Colors, farmGreen, appleRed } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import Constants from 'expo-constants';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';

interface Equipment {
  id: string;
  equipmentType: string;
  make: string;
  model: string;
  hours?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  serviceIntervalHours?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;

const EQUIPMENT_TYPE_INFO: Record<string, { icon: string; iosIcon: string; label: string }> = {
  tractor: { icon: 'agriculture', iosIcon: 'tractor', label: 'Tractors' },
  harvester: { icon: 'grass', iosIcon: 'leaf.fill', label: 'Harvesters' },
  planter: { icon: 'eco', iosIcon: 'leaf.arrow.circlepath', label: 'Planters' },
  implement: { icon: 'build', iosIcon: 'wrench.fill', label: 'Implements' },
  sprayer: { icon: 'water-drop', iosIcon: 'drop.fill', label: 'Sprayers' },
  other: { icon: 'category', iosIcon: 'square.grid.2x2', label: 'Other' },
};

export default function EquipmentScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['tractor', 'harvester', 'planter', 'implement', 'sprayer', 'other']));
  const router = useRouter();
  const colors = Colors[colorScheme ?? 'light'];

  const loadEquipment = useCallback(async () => {
    console.log('Loading equipment inventory');
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/equipment`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load equipment');
      }

      const data = await response.json();
      console.log('Equipment loaded:', data.length, 'items');
      setEquipment(data);
    } catch (error) {
      console.error('Error loading equipment:', error);
      Alert.alert('Error', 'Failed to load equipment inventory');
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const handleLogout = async () => {
    console.log('User logging out from equipment screen');
    await signOut();
    router.replace('/auth/login');
  };

  const toggleType = (type: string) => {
    console.log('User toggled equipment type:', type);
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const handleDeleteEquipment = (item: Equipment) => {
    console.log('User attempting to delete equipment:', item.make, item.model);
    Alert.alert(
      'Delete Equipment',
      `Are you sure you want to delete ${item.make} ${item.model}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('User confirmed delete equipment:', item.id);
            try {
              const response = await fetch(`${BACKEND_URL}/api/equipment/${item.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${user?.token}`,
                },
              });

              if (!response.ok) {
                throw new Error('Failed to delete equipment');
              }

              console.log('Equipment deleted successfully');
              loadEquipment();
            } catch (error) {
              console.error('Error deleting equipment:', error);
              Alert.alert('Error', 'Failed to delete equipment');
            }
          },
        },
      ]
    );
  };

  const isServiceDue = (item: Equipment): boolean => {
    if (!item.nextServiceDate) return false;
    const nextService = new Date(item.nextServiceDate);
    const now = new Date();
    const daysUntilService = Math.ceil((nextService.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilService <= 7;
  };

  const getServiceStatus = (item: Equipment): string | null => {
    if (!item.nextServiceDate) return null;
    const nextService = new Date(item.nextServiceDate);
    const now = new Date();
    const daysUntilService = Math.ceil((nextService.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilService < 0) {
      return `Service overdue by ${Math.abs(daysUntilService)} days`;
    } else if (daysUntilService <= 7) {
      return `Service due in ${daysUntilService} days`;
    }
    return null;
  };

  const groupedEquipment = equipment.reduce((acc, item) => {
    const type = item.equipmentType.toLowerCase();
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {} as Record<string, Equipment[]>);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
          <Text style={[styles.title, { color: colors.text }]}>Equipment</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <IconSymbol
              ios_icon_name="arrow.right.square.fill"
              android_material_icon_name="logout"
              size={24}
              color="#ef4444"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={farmGreen} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Equipment</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            {equipment.length} {equipment.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol
            ios_icon_name="arrow.right.square.fill"
            android_material_icon_name="logout"
            size={24}
            color="#ef4444"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {equipment.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="tractor"
              android_material_icon_name="agriculture"
              size={64}
              color={colors.icon}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Equipment Yet</Text>
            <Text style={[styles.emptyDescription, { color: colors.icon }]}>
              Add your first piece of equipment to start tracking maintenance and service intervals
            </Text>
          </View>
        ) : (
          <>
            {Object.entries(EQUIPMENT_TYPE_INFO).map(([type, info]) => {
              const items = groupedEquipment[type] || [];
              if (items.length === 0) return null;

              const isExpanded = expandedTypes.has(type);

              return (
                <View key={type} style={styles.typeSection}>
                  <TouchableOpacity
                    style={[styles.typeHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => toggleType(type)}
                  >
                    <View style={styles.typeHeaderLeft}>
                      <IconSymbol
                        ios_icon_name={info.iosIcon}
                        android_material_icon_name={info.icon}
                        size={24}
                        color={farmGreen}
                      />
                      <Text style={[styles.typeTitle, { color: colors.text }]}>
                        {info.label} ({items.length})
                      </Text>
                    </View>
                    <IconSymbol
                      ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
                      android_material_icon_name={isExpanded ? 'expand-less' : 'expand-more'}
                      size={24}
                      color={colors.icon}
                    />
                  </TouchableOpacity>

                  {isExpanded && items.map((item) => {
                    const serviceStatus = getServiceStatus(item);
                    const isDue = isServiceDue(item);

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.equipmentCard,
                          { backgroundColor: colors.card, borderColor: colors.border },
                          isDue && styles.serviceDueCard,
                        ]}
                      >
                        <View style={styles.equipmentHeader}>
                          <View style={styles.equipmentInfo}>
                            <Text style={[styles.equipmentName, { color: colors.text }]}>
                              {item.make} {item.model}
                            </Text>
                            {item.hours !== undefined && item.hours !== null && (
                              <Text style={[styles.equipmentHours, { color: colors.icon }]}>
                                {item.hours.toLocaleString()} hours
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteEquipment(item)}
                            style={styles.deleteButton}
                          >
                            <IconSymbol
                              ios_icon_name="trash.fill"
                              android_material_icon_name="delete"
                              size={20}
                              color={appleRed}
                            />
                          </TouchableOpacity>
                        </View>

                        {serviceStatus && (
                          <View style={[styles.serviceAlert, isDue && styles.serviceDueAlert]}>
                            <IconSymbol
                              ios_icon_name="exclamationmark.triangle.fill"
                              android_material_icon_name="warning"
                              size={16}
                              color={isDue ? '#ef4444' : '#f59e0b'}
                            />
                            <Text style={[styles.serviceAlertText, { color: isDue ? '#ef4444' : '#f59e0b' }]}>
                              {serviceStatus}
                            </Text>
                          </View>
                        )}

                        {item.serviceIntervalHours && (
                          <View style={styles.equipmentDetail}>
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>
                              Service Interval:
                            </Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              Every {item.serviceIntervalHours.toLocaleString()} hours
                            </Text>
                          </View>
                        )}

                        {item.lastServiceDate && (
                          <View style={styles.equipmentDetail}>
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>
                              Last Service:
                            </Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {new Date(item.lastServiceDate).toLocaleDateString()}
                            </Text>
                          </View>
                        )}

                        {item.nextServiceDate && (
                          <View style={styles.equipmentDetail}>
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>
                              Next Service:
                            </Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {new Date(item.nextServiceDate).toLocaleDateString()}
                            </Text>
                          </View>
                        )}

                        {item.notes && (
                          <View style={styles.equipmentDetail}>
                            <Text style={[styles.detailLabel, { color: colors.icon }]}>
                              Notes:
                            </Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {item.notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: farmGreen }]}
        onPress={() => {
          console.log('User tapped add equipment button');
          router.push('/add-equipment');
        }}
      >
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={28}
          color="#fff"
        />
      </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  typeSection: {
    marginBottom: 16,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  typeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  equipmentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    marginLeft: 8,
  },
  serviceDueCard: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  equipmentHours: {
    fontSize: 14,
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
  serviceAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    marginBottom: 8,
  },
  serviceDueAlert: {
    backgroundColor: '#fee2e2',
  },
  serviceAlertText: {
    fontSize: 14,
    fontWeight: '600',
  },
  equipmentDetail: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
