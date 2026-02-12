
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

interface Schedule {
  id: string;
  field_bed: {
    name: string;
  };
  task_type: string;
  task_description: string;
  due_date: string;
  completed: boolean;
  weather_recommendation?: string;
  weather_priority?: string;
}

export default function ScheduleScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token, signOut } = useAuth();
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading schedules with weather data, filter:', filter);
      
      // Try to load schedules with weather recommendations first
      let url = `${BACKEND_URL}/api/schedules/with-weather`;
      let response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Fallback to regular schedules endpoint if with-weather doesn't exist yet
      if (!response.ok) {
        console.log('Falling back to regular schedules endpoint');
        url = filter === 'all' 
          ? `${BACKEND_URL}/api/schedules`
          : `${BACKEND_URL}/api/schedules?completed=${filter === 'completed'}`;
        
        response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      if (response.ok) {
        const data = await response.json();
        console.log(`Loaded ${data.length} schedules`);
        
        // Filter on frontend if needed
        let filteredData = data;
        if (filter !== 'all') {
          filteredData = data.filter((s: Schedule) => 
            filter === 'completed' ? s.completed : !s.completed
          );
        }
        
        setSchedules(filteredData);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      console.log('Toggling schedule completion:', id, completed);
      const response = await fetch(`${BACKEND_URL}/api/schedules/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        loadSchedules();
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const handleLogout = async () => {
    console.log('User logging out from schedule screen');
    await signOut();
    router.replace('/auth/login');
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return colors.icon;
    switch (priority.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return colors.icon;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Schedule</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Your farming tasks and reminders
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

      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === f ? farmGreen : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              console.log('User selected filter:', f);
              setFilter(f);
            }}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? '#fff' : colors.text },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={farmGreen} />
          </View>
        ) : schedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={64}
              color={colors.icon}
            />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No tasks scheduled
            </Text>
          </View>
        ) : (
          <>
            {schedules.map((schedule) => (
              <View
                key={schedule.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => toggleComplete(schedule.id, !schedule.completed)}
                >
                  <View
                    style={[
                      styles.checkboxInner,
                      {
                        backgroundColor: schedule.completed ? farmGreen : 'transparent',
                        borderColor: schedule.completed ? farmGreen : colors.border,
                      },
                    ]}
                  >
                    {schedule.completed && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={16}
                        color="#fff"
                      />
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.cardContent}>
                  <Text style={[styles.taskType, { color: colors.text }]}>
                    {schedule.task_type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Text style={[styles.taskDescription, { color: colors.icon }]}>
                    {schedule.task_description}
                  </Text>
                  
                  {schedule.weather_recommendation && (
                    <View
                      style={[
                        styles.weatherAlert,
                        {
                          backgroundColor: `${getPriorityColor(schedule.weather_priority)}15`,
                          borderColor: getPriorityColor(schedule.weather_priority),
                        },
                      ]}
                    >
                      <IconSymbol
                        ios_icon_name="cloud.sun.fill"
                        android_material_icon_name="cloud"
                        size={16}
                        color={getPriorityColor(schedule.weather_priority)}
                      />
                      <Text
                        style={[
                          styles.weatherText,
                          { color: getPriorityColor(schedule.weather_priority) },
                        ]}
                      >
                        {schedule.weather_recommendation}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.taskMeta}>
                    <Text style={[styles.fieldName, { color: colors.icon }]}>
                      {schedule.field_bed.name}
                    </Text>
                    <Text style={[styles.dueDate, { color: colors.icon }]}>
                      {new Date(schedule.due_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
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
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 16,
  },
  checkbox: {
    paddingTop: 2,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  taskType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  weatherAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  weatherText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldName: {
    fontSize: 12,
  },
  dueDate: {
    fontSize: 12,
  },
});
