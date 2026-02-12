
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import SubscriptionModal from '@/components/SubscriptionModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import Constants from 'expo-constants';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iosIcon: string;
  route?: string;
  requiresSubscription: boolean;
  fullDescription: string;
  benefits: string[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'season-management',
    title: 'Season Management',
    description: 'Track estimated vs actual yields and profits by season',
    icon: 'calendar-today',
    iosIcon: 'calendar.badge.clock',
    route: '/season-management',
    requiresSubscription: false,
    fullDescription: 'Manage your growing seasons with AI-powered yield and profit estimates. Track actual performance against estimates throughout the season and close out seasons to save historical data.',
    benefits: [
      'AI-powered market price estimates for your location',
      'Track estimated vs actual yields by crop',
      'Monitor profit margins in real-time',
      'Close out seasons and save historical data',
      'Compare season performance year-over-year',
    ],
  },
  {
    id: 'weather',
    title: 'Weather Insights',
    description: 'AI-powered weather analysis and recommendations',
    icon: 'wb-sunny',
    iosIcon: 'cloud.sun.fill',
    route: '/weather-insights',
    requiresSubscription: true,
    fullDescription: 'Get AI-powered weather insights tailored to your farm. Receive alerts about upcoming weather events and personalized recommendations for your scheduled tasks.',
    benefits: [
      'Real-time weather forecasts for your location',
      'AI analysis of weather impact on your crops',
      'Smart recommendations for task scheduling',
      'Severe weather alerts and warnings',
      'Historical weather data and trends',
    ],
  },
  {
    id: 'yield',
    title: 'Yield Charts',
    description: 'Track and analyze crop yields over time',
    icon: 'bar-chart',
    iosIcon: 'chart.bar.fill',
    route: '/yield-chart',
    requiresSubscription: true,
    fullDescription: 'Visualize your farm\'s productivity with detailed yield charts. Track harvest amounts, compare crop performance, and identify trends to optimize your farming strategy.',
    benefits: [
      'Visual charts of crop yields over time',
      'Compare performance across different crops',
      'Identify your most productive crops',
      'Export yield data as CSV or PDF reports',
      'Track yield percentages and trends',
    ],
  },
  {
    id: 'financial',
    title: 'Financial Reports',
    description: 'Comprehensive financial tracking and reporting',
    icon: 'attach-money',
    iosIcon: 'dollarsign.circle.fill',
    route: '/financial-reports',
    requiresSubscription: true,
    fullDescription: 'Manage your farm finances with detailed reports. Track income, expenses, profit margins, and generate professional financial statements for tax purposes.',
    benefits: [
      'Income and expense tracking',
      'Profit and loss statements',
      'Cash flow analysis',
      'Tax-ready financial reports',
      'Export reports as CSV or PDF',
    ],
  },
  {
    id: 'storage',
    title: 'Storage Management',
    description: 'Monitor storage capacity and inventory alerts',
    icon: 'storage',
    iosIcon: 'archivebox.fill',
    route: '/storage-management',
    requiresSubscription: true,
    fullDescription: 'Optimize your storage space with smart inventory management. Get alerts when items are running low or when storage is reaching capacity.',
    benefits: [
      'Real-time storage capacity monitoring',
      'Low stock alerts for critical items',
      'Storage optimization recommendations',
      'Track inventory across multiple locations',
      'Prevent overstocking and waste',
    ],
  },
  {
    id: 'ai',
    title: 'AI Assistant',
    description: 'Get farming advice, diagnose issues, and more',
    icon: 'psychology',
    iosIcon: 'brain.head.profile',
    route: '/ai',
    requiresSubscription: true,
    fullDescription: 'Access your personal AI farming assistant. Get expert advice, diagnose plant diseases, receive crop recommendations, and ask any farming-related questions.',
    benefits: [
      'Expert farming advice on demand',
      'Plant disease diagnosis from photos',
      'Personalized crop recommendations',
      'Pest identification and treatment advice',
      'Answer any farming questions instantly',
    ],
  },
];

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [selectedFeature, setSelectedFeature] = useState<MenuItem | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'inactive'>('inactive');

  // Check if Superwall is available
  const isExpoGo = Constants.appOwnership === 'expo';
  const superwallAvailable = !isExpoGo && Platform.OS !== 'web';

  // Try to get Superwall user if available - hooks must be called unconditionally
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

  useEffect(() => {
    console.log('📊 More screen - Subscription status:', subscriptionStatus);
    console.log('👤 Superwall user:', superwallUser);
    
    // Check if user has active subscription
    if (superwallUser?.subscriptions && superwallUser.subscriptions.length > 0) {
      const hasActiveSubscription = superwallUser.subscriptions.some(
        (sub: any) => sub.isActive
      );
      setSubscriptionStatus(hasActiveSubscription ? 'active' : 'inactive');
    }
  }, [subscriptionStatus, superwallUser]);

  const handleLogout = async () => {
    console.log('🚪 User tapped Logout button');
    await signOut();
    router.replace('/auth/login');
  };

  const handleMenuItemPress = (item: MenuItem) => {
    console.log('📱 User tapped menu item:', item.title);
    
    // 🔓 PAYWALL BYPASS: Always navigate to the route, ignore subscription requirement
    if (item.route) {
      console.log('✅ Navigating to:', item.route, '(paywall bypassed)');
      router.push(item.route as any);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>More</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <IconSymbol
            ios_icon_name="rectangle.portrait.and.arrow.right"
            android_material_icon_name="logout"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Subscription status banner */}
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

      {subscriptionStatus === 'active' && superwallAvailable && (
        <View style={[styles.subscriptionBanner, { backgroundColor: farmGreen + '20' }]}>
          <IconSymbol
            ios_icon_name="checkmark.seal.fill"
            android_material_icon_name="verified"
            size={24}
            color={farmGreen}
          />
          <Text style={[styles.subscriptionText, { color: farmGreen }]}>
            Premium Active
          </Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Menu items */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={() => handleMenuItemPress(item)}
            >
              <View style={[styles.iconCircle, { backgroundColor: farmGreen + '20' }]}>
                <IconSymbol
                  ios_icon_name={item.iosIcon}
                  android_material_icon_name={item.icon}
                  size={24}
                  color={farmGreen}
                />
              </View>
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemHeader}>
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  {/* 🔓 PAYWALL BYPASS: Removed premium badge display */}
                </View>
                <Text style={[styles.menuItemDescription, { color: colors.text }]}>
                  {item.description}
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* User info */}
        <View style={[styles.userSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.userEmail, { color: colors.text }]}>
            {user?.email || 'Not logged in'}
          </Text>
        </View>
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
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
  subscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  subscriptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  menuSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  menuItemTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  menuItemDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  userSection: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  userEmail: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});
