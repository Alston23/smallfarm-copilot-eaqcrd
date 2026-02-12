
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
import React from 'react';
import { BlurView } from 'expo-blur';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import Constants from 'expo-constants';

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
  
  // Check if Superwall is available
  const isExpoGo = Constants.appOwnership === 'expo';
  const superwallAvailable = !isExpoGo && Platform.OS !== 'web';

  // Try to get Superwall hooks if available - hooks must be called unconditionally
  let superwallUser: any = null;
  let placement: any = null;
  
  try {
    if (superwallAvailable) {
      // Dynamic import for Superwall
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const superwall = require('expo-superwall');
      // eslint-disable-next-line react-hooks/rules-of-hooks
      superwallUser = superwall.useUser();
      // eslint-disable-next-line react-hooks/rules-of-hooks
      placement = superwall.usePlacement('premium_features');
    }
  } catch (error) {
    console.warn('⚠️ Superwall hooks not available:', error);
  }

  const handleSubscribe = async () => {
    console.log('🔔 User tapped Subscribe button for:', featureName);

    if (!superwallAvailable) {
      // Show message for Expo Go users
      Alert.alert(
        'Subscription Not Available',
        'Subscriptions are only available in the production app. This is a development preview.\n\nIn the full app, you would be able to subscribe to unlock all premium features.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!placement) {
      Alert.alert(
        'Subscription Setup Required',
        'Subscription system is being configured. Please try again later.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('🚀 Presenting Superwall paywall for placement: premium_features');
      await placement.present();
      console.log('✅ Paywall presented successfully');
    } catch (error) {
      console.error('❌ Error presenting paywall:', error);
      Alert.alert(
        'Subscription Error',
        'Unable to load subscription options. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={styles.blurContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="cancel"
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Feature icon */}
            <View style={[styles.iconContainer, { backgroundColor: farmGreen + '20' }]}>
              <IconSymbol
                ios_icon_name={featureIosIcon}
                android_material_icon_name={featureIcon}
                size={48}
                color={farmGreen}
              />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              Unlock {featureName}
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: colors.text }]}>
              {featureDescription}
            </Text>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                Why Subscribe?
              </Text>
              {featureBenefits.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
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

            {/* Subscribe button */}
            <TouchableOpacity
              style={[styles.subscribeButton, { backgroundColor: farmGreen }]}
              onPress={handleSubscribe}
            >
              <Text style={styles.subscribeButtonText}>
                {superwallAvailable ? 'Subscribe Now' : 'View Subscription Info'}
              </Text>
            </TouchableOpacity>

            {/* Development notice */}
            {!superwallAvailable && (
              <View style={[styles.devNotice, { backgroundColor: colors.text + '10' }]}>
                <IconSymbol
                  ios_icon_name="info.circle"
                  android_material_icon_name="info"
                  size={16}
                  color={colors.text}
                />
                <Text style={[styles.devNoticeText, { color: colors.text }]}>
                  {isExpoGo 
                    ? 'Subscriptions available in production app'
                    : 'Subscriptions available on iOS and Android'}
                </Text>
              </View>
            )}

            {/* Terms */}
            <Text style={[styles.terms, { color: colors.text }]}>
              By subscribing, you agree to our Terms of Service and Privacy Policy.
              Subscription automatically renews unless cancelled.
            </Text>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  scrollContent: {
    paddingTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    opacity: 0.8,
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  subscribeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  devNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  devNoticeText: {
    fontSize: 12,
    opacity: 0.7,
  },
  terms: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 16,
  },
});
