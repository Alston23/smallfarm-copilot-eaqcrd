
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors, farmGreen, appleRed } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

export default function RecommendationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token, user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);

  const getRecommendations = async () => {
    setLoading(true);
    try {
      console.log('Requesting AI crop recommendations for user');
      const response = await fetch(`${BACKEND_URL}/api/ai/crop-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Received AI crop recommendations');
        setRecommendations(data);
      } else {
        throw new Error('Failed to get recommendations');
      }
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      Alert.alert('Error', error.message || 'Could not get recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Crop Recommendations',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="lightbulb.fill"
              android_material_icon_name="lightbulb"
              size={48}
              color={farmGreen}
            />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              AI-Powered Recommendations
            </Text>
            <Text style={[styles.infoDescription, { color: colors.icon }]}>
              Get personalized crop suggestions based on your farm history, location, market conditions, and community data
            </Text>
          </View>

          {!recommendations ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: farmGreen }]}
              onPress={getRecommendations}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="sparkles"
                    android_material_icon_name="auto-awesome"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.buttonText}>Get Recommendations</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              {recommendations.recommended_crops && recommendations.recommended_crops.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Recommended Crops
                  </Text>
                  {recommendations.recommended_crops.map((crop: any, index: number) => (
                    <View
                      key={index}
                      style={[styles.cropCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={[styles.iconBadge, { backgroundColor: `${farmGreen}20` }]}>
                        <IconSymbol
                          ios_icon_name="leaf.fill"
                          android_material_icon_name="eco"
                          size={24}
                          color={farmGreen}
                        />
                      </View>
                      <View style={styles.cropInfo}>
                        <Text style={[styles.cropName, { color: colors.text }]}>{crop.crop}</Text>
                        <Text style={[styles.cropReason, { color: colors.icon }]}>{crop.reason}</Text>
                        {crop.market_outlook && (
                          <Text style={[styles.cropMarket, { color: colors.icon }]}>
                            Market: {crop.market_outlook}
                          </Text>
                        )}
                        {crop.profitability_score && (
                          <Text style={[styles.cropScore, { color: farmGreen }]}>
                            Profitability: {crop.profitability_score}/10
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {recommendations.crops_to_avoid && recommendations.crops_to_avoid.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Crops to Avoid
                  </Text>
                  {recommendations.crops_to_avoid.map((crop: any, index: number) => (
                    <View
                      key={index}
                      style={[styles.cropCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={[styles.iconBadge, { backgroundColor: `${appleRed}20` }]}>
                        <IconSymbol
                          ios_icon_name="exclamationmark.triangle.fill"
                          android_material_icon_name="warning"
                          size={24}
                          color={appleRed}
                        />
                      </View>
                      <View style={styles.cropInfo}>
                        <Text style={[styles.cropName, { color: colors.text }]}>{crop.crop}</Text>
                        <Text style={[styles.cropReason, { color: colors.icon }]}>{crop.reason}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                onPress={getRecommendations}
                disabled={loading}
              >
                <IconSymbol
                  ios_icon_name="arrow.clockwise"
                  android_material_icon_name="refresh"
                  size={20}
                  color={colors.text}
                />
                <Text style={[styles.buttonText, { color: colors.text }]}>Refresh Recommendations</Text>
              </TouchableOpacity>
            </>
          )}
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
  infoCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cropCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 16,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropInfo: {
    flex: 1,
    gap: 4,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
  },
  cropReason: {
    fontSize: 14,
    lineHeight: 20,
  },
  cropMarket: {
    fontSize: 14,
  },
  cropScore: {
    fontSize: 14,
    fontWeight: '600',
  },
});
