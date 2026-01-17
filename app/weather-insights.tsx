
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
  precipitation: number;
}

interface WeatherAlert {
  type: string;
  severity: string;
  description: string;
  date: string;
}

interface WeatherData {
  location: string;
  current: {
    temp: number;
    condition: string;
    humidity: number;
  };
  forecast: WeatherForecast[];
  alerts: WeatherAlert[];
}

interface WeatherRecommendation {
  schedule_id: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
}

interface AnalysisData {
  insights: string;
  recommendations: WeatherRecommendation[];
}

export default function WeatherInsightsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token, signOut } = useAuth();
  
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeWeatherImpact = useCallback(async (weather: WeatherData) => {
    try {
      console.log('Analyzing weather impact on schedules');
      
      // First, get schedules
      const schedulesResponse = await fetch(`${BACKEND_URL}/api/schedules`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (schedulesResponse.ok) {
        const schedules = await schedulesResponse.json();
        console.log('Loaded schedules for analysis:', schedules.length);
        
        // Analyze with AI
        const analysisResponse = await fetch(`${BACKEND_URL}/api/weather/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            location: weather.location,
            schedules: schedules.map((s: any) => ({
              id: s.id,
              task_type: s.task_type,
              due_date: s.due_date,
              crop_name: s.field_bed?.name || 'Unknown',
            })),
          }),
        });

        if (analysisResponse.ok) {
          const analysis = await analysisResponse.json();
          console.log('Weather analysis complete:', analysis);
          setAnalysisData(analysis);
          
          // Update schedules with recommendations
          for (const rec of analysis.recommendations) {
            await fetch(`${BACKEND_URL}/api/schedules/${rec.schedule_id}/weather`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                weather_recommendation: rec.recommendation,
                weather_priority: rec.priority,
              }),
            });
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing weather impact:', error);
    }
  }, [token]);

  const loadWeatherData = useCallback(async () => {
    try {
      console.log('Loading weather forecast');
      const response = await fetch(`${BACKEND_URL}/api/weather/forecast`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Weather data loaded:', data);
        setWeatherData(data);
        
        // Load schedules and analyze weather impact
        await analyzeWeatherImpact(data);
      } else {
        console.error('Failed to load weather data:', response.status);
        setError('Unable to load weather data. Please try again.');
      }
    } catch (error) {
      console.error('Error loading weather data:', error);
      setError('Unable to connect to the server. Please check your internet connection.');
    }
  }, [token, analyzeWeatherImpact]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await loadWeatherData();
    setLoading(false);
  }, [loadWeatherData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  }, [loadWeatherData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    console.log('User logging out from weather insights');
    await signOut();
    router.replace('/auth/login');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#3b82f6';
      default:
        return colors.icon;
    }
  };

  const getPriorityColor = (priority: string) => {
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

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain')) return 'cloud';
    if (lower.includes('sun') || lower.includes('clear')) return 'wb-sunny';
    if (lower.includes('cloud')) return 'cloud';
    if (lower.includes('snow')) return 'ac-unit';
    if (lower.includes('storm')) return 'flash-on';
    return 'cloud';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              console.log('User tapped back button');
              router.back();
            }}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Weather Insights</Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              AI-powered weather forecasts
            </Text>
          </View>
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={farmGreen}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={farmGreen} />
            <Text style={[styles.loadingText, { color: colors.icon }]}>
              Loading weather data...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={64}
              color="#ff9500"
            />
            <Text style={[styles.errorText, { color: colors.text }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: farmGreen }]}
              onPress={loadData}
            >
              <IconSymbol
                ios_icon_name="arrow.clockwise"
                android_material_icon_name="refresh"
                size={20}
                color="#fff"
              />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : weatherData ? (
          <>
            {/* Current Weather */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location-on"
                  size={20}
                  color={farmGreen}
                />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {weatherData.location}
                </Text>
              </View>
              <View style={styles.currentWeather}>
                <View style={styles.tempContainer}>
                  <Text style={[styles.tempLarge, { color: colors.text }]}>
                    {Math.round(weatherData.current.temp)}°
                  </Text>
                  <Text style={[styles.condition, { color: colors.icon }]}>
                    {weatherData.current.condition}
                  </Text>
                </View>
                <View style={styles.humidityContainer}>
                  <IconSymbol
                    ios_icon_name="drop.fill"
                    android_material_icon_name="water-drop"
                    size={20}
                    color={colors.icon}
                  />
                  <Text style={[styles.humidity, { color: colors.icon }]}>
                    {weatherData.current.humidity}% humidity
                  </Text>
                </View>
              </View>
            </View>

            {/* Weather Alerts */}
            {weatherData.alerts && weatherData.alerts.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Weather Alerts
                </Text>
                {weatherData.alerts.map((alert, index) => (
                  <View
                    key={index}
                    style={[
                      styles.alertCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: getSeverityColor(alert.severity),
                        borderLeftWidth: 4,
                      },
                    ]}
                  >
                    <View style={styles.alertHeader}>
                      <IconSymbol
                        ios_icon_name="exclamationmark.triangle.fill"
                        android_material_icon_name="warning"
                        size={24}
                        color={getSeverityColor(alert.severity)}
                      />
                      <View style={styles.alertHeaderText}>
                        <Text style={[styles.alertType, { color: colors.text }]}>
                          {alert.type.toUpperCase()}
                        </Text>
                        <Text style={[styles.alertDate, { color: colors.icon }]}>
                          {new Date(alert.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.alertDescription, { color: colors.text }]}>
                      {alert.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 7-Day Forecast */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                7-Day Forecast
              </Text>
              {weatherData.forecast.map((day, index) => (
                <View
                  key={index}
                  style={[styles.forecastCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.forecastLeft}>
                    <Text style={[styles.forecastDate, { color: colors.text }]}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <View style={styles.forecastCondition}>
                      <IconSymbol
                        ios_icon_name="cloud.fill"
                        android_material_icon_name={getWeatherIcon(day.condition)}
                        size={20}
                        color={colors.icon}
                      />
                      <Text style={[styles.forecastConditionText, { color: colors.icon }]}>
                        {day.condition}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.forecastRight}>
                    <Text style={[styles.forecastTemp, { color: colors.text }]}>
                      {Math.round(day.high)}° / {Math.round(day.low)}°
                    </Text>
                    {day.precipitation > 0 && (
                      <Text style={[styles.forecastPrecip, { color: colors.icon }]}>
                        {Math.round(day.precipitation)}% rain
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* AI Insights */}
            {analysisData && (
              <>
                <View style={[styles.insightsCard, { backgroundColor: farmGreen }]}>
                  <View style={styles.insightsHeader}>
                    <IconSymbol
                      ios_icon_name="brain.head.profile"
                      android_material_icon_name="psychology"
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.insightsTitle}>AI Insights</Text>
                  </View>
                  <Text style={styles.insightsText}>
                    {analysisData.insights}
                  </Text>
                </View>

                {analysisData.recommendations.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Recommendations
                    </Text>
                    {analysisData.recommendations.map((rec, index) => (
                      <View
                        key={index}
                        style={[
                          styles.recommendationCard,
                          {
                            backgroundColor: colors.card,
                            borderColor: getPriorityColor(rec.priority),
                            borderLeftWidth: 4,
                          },
                        ]}
                      >
                        <View style={styles.recommendationHeader}>
                          <View
                            style={[
                              styles.priorityBadge,
                              { backgroundColor: getPriorityColor(rec.priority) },
                            ]}
                          >
                            <Text style={styles.priorityText}>
                              {rec.priority.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.recommendationText, { color: colors.text }]}>
                          {rec.recommendation}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        ) : null}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
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
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  currentWeather: {
    gap: 12,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  tempLarge: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  condition: {
    fontSize: 20,
  },
  humidityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  humidity: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  alertHeaderText: {
    flex: 1,
  },
  alertType: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertDate: {
    fontSize: 14,
    marginTop: 2,
  },
  alertDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  forecastCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  forecastLeft: {
    flex: 1,
  },
  forecastDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  forecastCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forecastConditionText: {
    fontSize: 14,
  },
  forecastRight: {
    alignItems: 'flex-end',
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: '600',
  },
  forecastPrecip: {
    fontSize: 12,
    marginTop: 4,
  },
  insightsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  insightsText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#fff',
  },
  recommendationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  recommendationHeader: {
    marginBottom: 8,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
