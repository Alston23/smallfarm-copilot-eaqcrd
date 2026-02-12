
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';

const aiFeatures = [
  {
    id: 'diagnose',
    title: 'Plant Diagnosis',
    description: 'Identify plant issues with photos and descriptions',
    icon: 'local-hospital',
    iosIcon: 'cross.case.fill',
    route: '/ai/diagnose',
  },
  {
    id: 'recommendations',
    title: 'Crop Recommendations',
    description: 'Get AI-powered suggestions based on your data',
    icon: 'lightbulb',
    iosIcon: 'lightbulb.fill',
    route: '/ai/recommendations',
  },
  {
    id: 'advice',
    title: 'Farming Advice',
    description: 'Ask questions and get expert guidance',
    icon: 'chat',
    iosIcon: 'message.fill',
    route: '/ai/advice',
  },
];

export default function AIScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'AI Assistant',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="brain.head.profile"
              android_material_icon_name="psychology"
              size={64}
              color={farmGreen}
            />
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              AI-Powered Farming Assistant
            </Text>
            <Text style={[styles.heroDescription, { color: colors.icon }]}>
              Get intelligent insights, diagnose problems, and receive personalized recommendations for your farm
            </Text>
          </View>

          {aiFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                console.log('User tapped AI feature:', feature.title);
                router.push(feature.route as any);
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${farmGreen}20` }]}>
                <IconSymbol
                  ios_icon_name={feature.iosIcon}
                  android_material_icon_name={feature.icon}
                  size={32}
                  color={farmGreen}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.icon }]}>
                  {feature.description}
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={colors.icon}
              />
            </TouchableOpacity>
          ))}
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
  heroCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 14,
    marginTop: 4,
  },
});
