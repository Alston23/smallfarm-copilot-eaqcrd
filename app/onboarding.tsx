
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    icon: 'eco',
    iosIcon: 'leaf.fill',
    title: 'Welcome to SmallFarm Copilot',
    description: 'Your all-in-one farming companion for managing crops, schedules, inventory, and more.',
  },
  {
    icon: 'calendar-today',
    iosIcon: 'calendar',
    title: 'Smart Scheduling',
    description: 'Get automated task schedules based on your crops and planting dates. Never miss a fertilization or harvest window.',
  },
  {
    icon: 'inventory',
    iosIcon: 'cube.box.fill',
    title: 'Track Everything',
    description: 'Manage your inventory, track finances, and get AI-powered market predictions for better planning.',
  },
  {
    icon: 'store',
    iosIcon: 'cart.fill',
    title: 'Marketplace',
    description: 'Sell your produce directly to customers and trade equipment with other farmers in the community.',
  },
  {
    icon: 'psychology',
    iosIcon: 'brain.head.profile',
    title: 'AI-Powered Insights',
    description: 'Diagnose plant issues, get crop recommendations, and receive expert farming advice powered by AI.',
  },
];

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [currentPage, setCurrentPage] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleNext = () => {
    console.log('User tapped Next button on onboarding page', currentPage + 1);
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    console.log('User skipped onboarding, dont show again:', dontShowAgain);
    try {
      if (dontShowAgain) {
        await SecureStore.setItemAsync('onboarding_completed', 'true');
        console.log('Onboarding preference saved to SecureStore');
      }
      router.replace('/(tabs)/(crops)');
    } catch (error) {
      console.error('Error saving onboarding preference:', error);
      router.replace('/(tabs)/(crops)');
    }
  };

  const handleComplete = async () => {
    console.log('User completed onboarding, dont show again:', dontShowAgain);
    try {
      if (dontShowAgain) {
        await SecureStore.setItemAsync('onboarding_completed', 'true');
        console.log('Onboarding preference saved to SecureStore');
      }
      router.replace('/(tabs)/(crops)');
    } catch (error) {
      console.error('Error saving onboarding preference:', error);
      router.replace('/(tabs)/(crops)');
    }
  };

  const currentData = onboardingData[currentPage];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <IconSymbol
            ios_icon_name={currentData.iosIcon}
            android_material_icon_name={currentData.icon}
            size={100}
            color={farmGreen}
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {currentData.title}
        </Text>
        
        <Text style={[styles.description, { color: colors.icon }]}>
          {currentData.description}
        </Text>

        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentPage ? farmGreen : colors.border,
                  width: index === currentPage ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setDontShowAgain(!dontShowAgain)}
        >
          <View style={[styles.checkbox, { borderColor: colors.border }]}>
            {dontShowAgain && (
              <IconSymbol
                ios_icon_name="checkmark"
                android_material_icon_name="check"
                size={16}
                color={farmGreen}
              />
            )}
          </View>
          <Text style={[styles.checkboxLabel, { color: colors.icon }]}>
            Don&apos;t show this again
          </Text>
        </TouchableOpacity>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.skipButton, { borderColor: colors.border }]}
            onPress={handleSkip}
          >
            <Text style={[styles.skipButtonText, { color: colors.text }]}>
              Skip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: farmGreen }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentPage === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  pagination: {
    flexDirection: 'row',
    marginTop: 48,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    padding: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
