
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
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import SubscriptionModal from '@/components/SubscriptionModal';

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

const menuItems: MenuItem[] = [
  {
    id: 'settings',
    title: 'Settings',
    description: 'App preferences and dark mode',
    icon: 'settings',
    iosIcon: 'gear',
    route: '/settings',
    requiresSubscription: false,
    fullDescription: '',
    benefits: [],
  },
  {
    id: 'weather',
    title: 'Weather Insights',
    description: 'AI-powered weather forecasts and farming recommendations',
    icon: 'cloud',
    iosIcon: 'cloud.sun.fill',
    route: '/weather-insights',
    requiresSubscription: true,
    fullDescription: 'Weather Insights provides AI-powered weather forecasting specifically designed for farmers. Get detailed 14-day forecasts, severe weather alerts, and intelligent recommendations that connect weather patterns to your farming schedule. The system analyzes upcoming conditions and automatically suggests actions like harvesting before frost, delaying planting due to heavy rain, or preparing for drought conditions.',
    benefits: [
      'Protect your crops from unexpected weather events with early warnings',
      'Optimize planting and harvesting schedules based on weather patterns',
      'Reduce crop loss by up to 30% with proactive weather-based decisions',
      'Get AI recommendations that connect weather to your specific schedule',
      'Access historical weather data to plan for seasonal patterns',
      'Receive frost alerts with enough time to protect sensitive crops',
    ],
  },
  {
    id: 'financial',
    title: 'Financial Reports',
    description: 'Track income, expenses, and profits',
    icon: 'attach-money',
    iosIcon: 'dollarsign.circle.fill',
    route: '/financial',
    requiresSubscription: true,
    fullDescription: 'Financial Reports gives you complete visibility into your farm&apos;s financial health. Track all income from crop sales, monitor expenses across categories like seeds, equipment, and labor, and see your profit margins in real-time. Generate professional reports for tax season, loan applications, or business planning. Export data to CSV or PDF for your accountant or records.',
    benefits: [
      'Know your exact profit margins for each crop and season',
      'Make data-driven decisions about which crops are most profitable',
      'Simplify tax preparation with organized financial records',
      'Track expenses by category to identify cost-saving opportunities',
      'Generate professional reports for banks and investors',
      'Export financial data in multiple formats for easy sharing',
    ],
  },
  {
    id: 'marketplace-consumer',
    title: 'Consumer Marketplace',
    description: 'Sell produce to customers',
    icon: 'store',
    iosIcon: 'cart.fill',
    route: '/marketplace/consumer',
    requiresSubscription: true,
    fullDescription: 'Consumer Marketplace connects you directly with local customers who want fresh, farm-to-table produce. List your available crops, set prices, manage orders, and coordinate pickups or deliveries. Build a loyal customer base, receive reviews, and grow your direct-to-consumer sales channel. Perfect for farmers markets, CSA programs, or farm stands.',
    benefits: [
      'Increase revenue by selling directly to consumers without middlemen',
      'Build lasting relationships with customers who value local food',
      'Set your own prices and keep 100% of the profit',
      'Manage orders and inventory in one convenient place',
      'Receive customer reviews to build trust and reputation',
      'Coordinate pickups and deliveries with built-in scheduling',
    ],
  },
  {
    id: 'marketplace-equipment',
    title: 'Equipment Marketplace',
    description: 'Buy, sell, and trade equipment',
    icon: 'build',
    iosIcon: 'wrench.and.screwdriver.fill',
    route: '/marketplace/equipment',
    requiresSubscription: true,
    fullDescription: 'Equipment Marketplace is your hub for buying, selling, and trading farm equipment with other farmers. List equipment you no longer need, browse available machinery, and connect with sellers in your area. Save thousands by buying used equipment in good condition, or recoup costs by selling items you&apos;ve upgraded. Includes secure messaging, photos, and detailed equipment specifications.',
    benefits: [
      'Save up to 50% by purchasing quality used equipment',
      'Sell equipment you no longer need to fund new purchases',
      'Connect with trusted farmers in your local community',
      'View detailed specs, photos, and maintenance history',
      'Negotiate prices and arrange viewings through secure messaging',
      'Find rare or specialized equipment that&apos;s hard to source new',
    ],
  },
  {
    id: 'ai',
    title: 'AI Assistant',
    description: 'Get AI-powered farming insights',
    icon: 'psychology',
    iosIcon: 'brain.head.profile',
    route: '/ai',
    requiresSubscription: true,
    fullDescription: 'AI Assistant is your personal farming expert available 24/7. Ask questions about crop diseases, pest identification, soil health, planting techniques, or any farming challenge you face. Upload photos for instant diagnosis of plant problems. Get personalized recommendations based on your specific crops, location, and growing conditions. It&apos;s like having an agricultural extension agent in your pocket.',
    benefits: [
      'Get instant answers to farming questions without waiting for experts',
      'Identify crop diseases and pests from photos in seconds',
      'Receive personalized advice tailored to your specific farm',
      'Learn best practices for organic and sustainable farming',
      'Troubleshoot problems before they become major issues',
      'Access expert knowledge without expensive consultations',
    ],
  },
];

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<MenuItem | null>(null);

  const handleLogout = async () => {
    console.log('User logging out from more screen');
    await signOut();
    router.replace('/auth/login');
  };

  const handleMenuItemPress = (item: MenuItem) => {
    console.log('User tapped menu item:', item.title);
    
    if (item.requiresSubscription) {
      // Show subscription modal
      setSelectedFeature(item);
      setModalVisible(true);
    } else {
      // Navigate to the screen
      if (item.route) {
        router.push(item.route as any);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 48 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>More</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Additional features and settings
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

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconSymbol
            ios_icon_name="person.circle.fill"
            android_material_icon_name="account-circle"
            size={48}
            color={farmGreen}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.icon }]}>{user?.email}</Text>
            {user?.location && (
              <Text style={[styles.profileLocation, { color: colors.icon }]}>
                📍 {user.location}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Features</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleMenuItemPress(item)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconWrapper}>
                  <IconSymbol
                    ios_icon_name={item.iosIcon}
                    android_material_icon_name={item.icon}
                    size={24}
                    color={farmGreen}
                  />
                  {item.requiresSubscription && (
                    <View style={styles.lockBadge}>
                      <IconSymbol
                        ios_icon_name="lock.fill"
                        android_material_icon_name="lock"
                        size={10}
                        color="#fff"
                      />
                    </View>
                  )}
                </View>
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.menuItemDescription, { color: colors.icon }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={colors.icon}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {selectedFeature && (
        <SubscriptionModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedFeature(null);
          }}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  profileCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  profileLocation: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  iconWrapper: {
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuItemDescription: {
    fontSize: 14,
    marginTop: 2,
  },
});
