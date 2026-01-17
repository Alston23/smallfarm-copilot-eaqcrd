
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Platform,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/IconSymbol';
import { Colors, farmGreen } from '@/constants/Colors';
import { usePlacement, useUser } from 'expo-superwall';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription: string;
  featureBenefits: string[];
  featureIcon: string;
  featureIosIcon: string;
}

export default function SubscriptionModal({
  visible,
  onClose,
  featureName,
  featureDescription,
  featureBenefits,
  featureIcon,
  featureIosIcon,
}: SubscriptionModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { subscriptionStatus } = useUser();
  
  const { registerPlacement, state: placementState } = usePlacement({
    onError: (err) => {
      console.error('❌ Paywall Error:', err);
      Alert.alert('Error', 'Unable to load subscription options. Please try again.');
    },
    onPresent: (info) => {
      console.log('✅ Paywall Presented:', info);
    },
    onDismiss: (info, result) => {
      console.log('📱 Paywall Dismissed:', info, 'Result:', result);
      if (result === 'purchased' || result === 'restored') {
        Alert.alert(
          'Success!',
          'You now have access to all premium features.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    },
  });

  const handleSubscribe = async () => {
    console.log('🔐 User tapped Subscribe button for:', featureName);
    console.log('📊 Current subscription status:', subscriptionStatus?.status);
    
    try {
      await registerPlacement({
        placement: 'premium_features',
        feature() {
          console.log('✅ Feature unlocked! User has access to:', featureName);
          Alert.alert(
            'Welcome to Premium!',
            `You now have access to ${featureName} and all other premium features.`,
            [{ text: 'Get Started', onPress: onClose }]
          );
        },
      });
    } catch (error) {
      console.error('❌ Error registering placement:', error);
      Alert.alert('Error', 'Unable to show subscription options. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={onClose}
          />
        </BlurView>
        
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="close"
              size={28}
              color={colors.icon}
            />
          </TouchableOpacity>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${farmGreen}20` }]}>
              <IconSymbol
                ios_icon_name={featureIosIcon}
                android_material_icon_name={featureIcon}
                size={48}
                color={farmGreen}
              />
            </View>

            <View style={styles.lockBadge}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={16}
                color="#fff"
              />
              <Text style={styles.lockText}>Premium Feature</Text>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Subscribe to Unlock {featureName}
            </Text>

            <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
              This feature requires a premium subscription to access all its powerful capabilities.
            </Text>

            <View style={[styles.descriptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                What is {featureName}?
              </Text>
              <Text style={[styles.descriptionText, { color: colors.icon }]}>
                {featureDescription}
              </Text>
            </View>

            <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Why You&apos;ll Love This Feature
              </Text>
              {featureBenefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={20}
                    color={farmGreen}
                  />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>

            <View style={[styles.pricingCard, { backgroundColor: `${farmGreen}15`, borderColor: farmGreen }]}>
              <Text style={[styles.pricingTitle, { color: colors.text }]}>
                Premium Subscription
              </Text>
              <View style={styles.priceRow}>
                <Text style={[styles.priceAmount, { color: farmGreen }]}>
                  $12.99
                </Text>
                <Text style={[styles.pricePeriod, { color: colors.icon }]}>
                  /month
                </Text>
              </View>
              <Text style={[styles.pricingFeatures, { color: colors.icon }]}>
                • Access to all premium features{'\n'}
                • AI-powered insights and recommendations{'\n'}
                • Advanced financial reports{'\n'}
                • Marketplace access{'\n'}
                • Weather forecasting{'\n'}
                • Priority support
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.subscribeButton, { backgroundColor: farmGreen }]}
              onPress={handleSubscribe}
            >
              <Text style={styles.subscribeButtonText}>Subscribe Now - $12.99/month</Text>
              <IconSymbol
                ios_icon_name="arrow.right.circle.fill"
                android_material_icon_name="arrow-forward"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            <Text style={[styles.disclaimer, { color: colors.icon }]}>
              Cancel anytime. Works on iOS, Android, and web.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 20,
  },
  lockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  descriptionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  benefitsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  pricingCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 24,
    alignItems: 'center',
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  pricePeriod: {
    fontSize: 18,
    marginLeft: 4,
  },
  pricingFeatures: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'left',
    width: '100%',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 8,
    marginBottom: 12,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
});
