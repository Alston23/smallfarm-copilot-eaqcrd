
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
}

export default function ScheduleScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => {
    loadSchedules();
  }, [filter]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      console.log('Loading schedules, filter:', filter);
      const url = filter === 'all' 
        ? `${BACKEND_URL}/api/schedules`
        : `${BACKEND_URL}/api/schedules?completed=${filter === 'completed'}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Loaded ${data.length} schedules`);
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Schedule</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Your farming tasks and reminders
        </Text>
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
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
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
