
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';

export default function ConsumerMarketplaceScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Consumer Marketplace',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="cart.fill"
              android_material_icon_name="store"
              size={48}
              color={farmGreen}
            />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Sell Your Produce
            </Text>
            <Text style={[styles.infoDescription, { color: colors.icon }]}>
              List your crops for sale to restaurants, farmers markets, roadside stands, CSA programs, and direct customers
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: farmGreen }]}
            onPress={() => {
              console.log('User tapped Create Listing button');
              router.push('/marketplace/consumer/create');
            }}
          >
            <IconSymbol
              ios_icon_name="plus"
              android_material_icon_name="add"
              size={20}
              color="#fff"
            />
            <Text style={styles.buttonText}>Create Listing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => {
              console.log('User tapped View My Listings button');
              // TODO: Implement my listings view
            }}
          >
            <IconSymbol
              ios_icon_name="list.bullet"
              android_material_icon_name="list"
              size={20}
              color={colors.text}
            />
            <Text style={[styles.buttonText, { color: colors.text }]}>View My Listings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => {
              console.log('User tapped View Orders button');
              // TODO: Implement orders view
            }}
          >
            <IconSymbol
              ios_icon_name="bag.fill"
              android_material_icon_name="shopping-bag"
              size={20}
              color={colors.text}
            />
            <Text style={[styles.buttonText, { color: colors.text }]}>View Orders</Text>
          </TouchableOpacity>
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
    marginBottom: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
