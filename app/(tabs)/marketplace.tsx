
import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import SubscriptionModal from '@/components/SubscriptionModal';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import Constants from 'expo-constants';

interface MarketplaceOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  iosIcon: string;
  route: string;
  fullDescription: string;
  benefits: string[];
}

const MARKETPLACE_OPTIONS: MarketplaceOption[] = [
  {
    id: 'consumer',
    title: 'Consumer Marketplace',
    description: 'Sell your crops directly to customers',
    icon: 'shopping-cart',
    iosIcon: 'cart.fill',
    route: '/marketplace/consumer',
    fullDescription: 'List your farm products for sale to customers. Manage your crop listings, set prices, upload photos, and track sales all in one place.',
    benefits: [
      'List crops with photos and descriptions',
      'Set custom prices and quantities',
      'Track sales and revenue',
      'Manage multiple sales outlets (farmers market, CSA, etc.)',
      'Professional product listings to attract customers',
    ],
  },
  {
    id: 'equipment',
    title: 'Equipment Marketplace',
    description: 'Buy, sell, and trade farm equipment',
    icon: 'build',
    iosIcon: 'wrench.and.screwdriver.fill',
    route: '/marketplace/equipment',
    fullDescription: 'Connect with other farmers to buy, sell, or trade equipment. List your equipment with detailed specifications, photos, and pricing to reach interested buyers.',
    benefits: [
      'List equipment with photos and specifications',
      'Include make, model, hours, and condition',
      'Set asking price or mark as trade',
      'Browse equipment from other farmers',
      'Direct messaging with interested buyers',
    ],
  },
];

export default function MarketplaceScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFeature, setSelectedFeature] = useState<MarketplaceOption | null>(null);

  // Check if Superwall is available
  const isExpoGo = Constants.appOwnership === 'expo';
  const superwallAvailable = !isExpoGo && Platform.OS !== 'web';

  // Try to get Superwall user if available
  let superwallUser: any = null;
  try {
    if (superwallAvailable) {
      // Dynamic import for Superwall
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useUser } = require('expo-superwall');
      // eslint-disable-next-line react-hooks/rules-of-hooks
      superwallUser = useUser();
    }
  } catch (error) {
    console.warn('⚠️ Superwall user hook not available:', error);
  }

  // 🔓 PAYWALL BYPASS: Always allow access for development
  const hasSubscription = true; // Bypass paywall

  const handleMarketplacePress = (option: MarketplaceOption) => {
    console.log('User tapped marketplace option:', option.title);
    
    // 🔓 PAYWALL BYPASS: Always navigate to the route
    console.log('✅ Navigating to:', option.route, '(paywall bypassed)');
    router.push(option.route as any);
  };

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Marketplace</Text>
        </View>

        {/* Development banner */}
        {!superwallAvailable && (
          <View style={[styles.devBanner, { backgroundColor: farmGreen + '20' }]}>
            <IconSymbol
              ios_icon_name="info.circle"
              android_material_icon_name="info"
              size={20}
              color={farmGreen}
            />
            <Text style={[styles.devBannerText, { color: farmGreen }]}>
              {isExpoGo 
                ? 'Development Mode: All features unlocked'
                : 'All features unlocked'}
            </Text>
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Info card */}
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <IconSymbol
              ios_icon_name="storefront.fill"
              android_material_icon_name="store"
              size={48}
              color={farmGreen}
            />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Farm Marketplace
            </Text>
            <Text style={[styles.infoDescription, { color: colors.icon }]}>
              Connect with customers and other farmers. Sell your crops, buy and trade equipment, and grow your farm business.
            </Text>
          </View>

          {/* Marketplace options */}
          <View style={styles.optionsSection}>
            {MARKETPLACE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleMarketplacePress(option)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: farmGreen + '20' }]}>
                  <IconSymbol
                    ios_icon_name={option.iosIcon}
                    android_material_icon_name={option.icon}
                    size={32}
                    color={farmGreen}
                  />
                </View>
                
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.icon }]}>
                    {option.description}
                  </Text>
                  
                  {/* Benefits preview */}
                  <View style={styles.benefitsPreview}>
                    {option.benefits.slice(0, 2).map((benefit, index) => (
                      <View key={index} style={styles.benefitRow}>
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check-circle"
                          size={16}
                          color={farmGreen}
                        />
                        <Text style={[styles.benefitText, { color: colors.icon }]}>
                          {benefit}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron-right"
                  size={24}
                  color={colors.icon}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Premium features info */}
          <View style={[styles.premiumInfo, { backgroundColor: farmGreen + '10' }]}>
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={24}
              color={farmGreen}
            />
            <Text style={[styles.premiumText, { color: colors.text }]}>
              Marketplace features help you increase farm revenue and reduce equipment costs through direct sales and peer-to-peer trading.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Subscription modal - kept for reference but won't be shown */}
      {selectedFeature && (
        <SubscriptionModal
          visible={!!selectedFeature}
          onClose={() => setSelectedFeature(null)}
          featureName={selectedFeature.title}
          featureDescription={selectedFeature.fullDescription}
          featureBenefits={selectedFeature.benefits}
          featureIcon={selectedFeature.icon}
          featureIosIcon={selectedFeature.iosIcon}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  devBannerText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  benefitsPreview: {
    gap: 6,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  premiumInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 12,
    gap: 12,
  },
  premiumText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
