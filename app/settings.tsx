
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsScreen() {
  const systemColorScheme = useColorScheme();
  const colors = Colors[systemColorScheme ?? 'light'];
  const { themeMode, setThemeMode, isDark } = useTheme();

  const handleThemeModeChange = (mode: 'light' | 'dark' | 'auto') => {
    console.log('User changed theme mode to:', mode);
    setThemeMode(mode);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Theme Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
            <Text style={[styles.sectionDescription, { color: colors.icon }]}>
              Dark mode is optimized for low-light farming conditions
            </Text>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.themeOption}
                onPress={() => handleThemeModeChange('light')}
                activeOpacity={0.7}
              >
                <View style={styles.themeOptionLeft}>
                  <IconSymbol
                    ios_icon_name="sun.max.fill"
                    android_material_icon_name="light-mode"
                    size={24}
                    color={themeMode === 'light' ? farmGreen : colors.icon}
                  />
                  <View style={styles.themeOptionText}>
                    <Text style={[styles.themeOptionTitle, { color: colors.text }]}>
                      Light Mode
                    </Text>
                    <Text style={[styles.themeOptionDescription, { color: colors.icon }]}>
                      Bright theme for daytime use
                    </Text>
                  </View>
                </View>
                {themeMode === 'light' && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={24}
                    color={farmGreen}
                  />
                )}
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={styles.themeOption}
                onPress={() => handleThemeModeChange('dark')}
                activeOpacity={0.7}
              >
                <View style={styles.themeOptionLeft}>
                  <IconSymbol
                    ios_icon_name="moon.fill"
                    android_material_icon_name="dark-mode"
                    size={24}
                    color={themeMode === 'dark' ? farmGreen : colors.icon}
                  />
                  <View style={styles.themeOptionText}>
                    <Text style={[styles.themeOptionTitle, { color: colors.text }]}>
                      Dark Mode
                    </Text>
                    <Text style={[styles.themeOptionDescription, { color: colors.icon }]}>
                      Easy on the eyes in low light
                    </Text>
                  </View>
                </View>
                {themeMode === 'dark' && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={24}
                    color={farmGreen}
                  />
                )}
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={styles.themeOption}
                onPress={() => handleThemeModeChange('auto')}
                activeOpacity={0.7}
              >
                <View style={styles.themeOptionLeft}>
                  <IconSymbol
                    ios_icon_name="circle.lefthalf.filled"
                    android_material_icon_name="brightness-auto"
                    size={24}
                    color={themeMode === 'auto' ? farmGreen : colors.icon}
                  />
                  <View style={styles.themeOptionText}>
                    <Text style={[styles.themeOptionTitle, { color: colors.text }]}>
                      Auto
                    </Text>
                    <Text style={[styles.themeOptionDescription, { color: colors.icon }]}>
                      Match system settings
                    </Text>
                  </View>
                </View>
                {themeMode === 'auto' && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={24}
                    color={farmGreen}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Current Theme Indicator */}
            <View style={[styles.currentThemeCard, { backgroundColor: isDark ? '#1f3810' : '#e8f5e9' }]}>
              <IconSymbol
                ios_icon_name={isDark ? 'moon.stars.fill' : 'sun.max.fill'}
                android_material_icon_name={isDark ? 'dark-mode' : 'light-mode'}
                size={20}
                color={farmGreen}
              />
              <Text style={[styles.currentThemeText, { color: isDark ? '#fff' : '#1f3810' }]}>
                Currently using {isDark ? 'dark' : 'light'} theme
              </Text>
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
            
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <IconSymbol
                    ios_icon_name="bell.fill"
                    android_material_icon_name="notifications"
                    size={24}
                    color={farmGreen}
                  />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      Low Stock Alerts
                    </Text>
                    <Text style={[styles.settingDescription, { color: colors.icon }]}>
                      Get notified when inventory is low
                    </Text>
                  </View>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => console.log('Toggle low stock alerts')}
                  trackColor={{ false: colors.border, true: farmGreen }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <IconSymbol
                    ios_icon_name="cube.box.fill"
                    android_material_icon_name="inventory"
                    size={24}
                    color={farmGreen}
                  />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      Storage Alerts
                    </Text>
                    <Text style={[styles.settingDescription, { color: colors.icon }]}>
                      Get notified when storage is running low
                    </Text>
                  </View>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => console.log('Toggle storage alerts')}
                  trackColor={{ false: colors.border, true: farmGreen }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <IconSymbol
                    ios_icon_name="cloud.sun.fill"
                    android_material_icon_name="cloud"
                    size={24}
                    color={farmGreen}
                  />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      Weather Alerts
                    </Text>
                    <Text style={[styles.settingDescription, { color: colors.icon }]}>
                      Get notified about weather changes
                    </Text>
                  </View>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => console.log('Toggle weather alerts')}
                  trackColor={{ false: colors.border, true: farmGreen }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: colors.icon }]}>Version</Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: colors.icon }]}>App Name</Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>SmallFarm Copilot</Text>
              </View>
            </View>
          </View>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  themeOptionText: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeOptionDescription: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 56,
  },
  currentThemeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  currentThemeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  aboutLabel: {
    fontSize: 16,
  },
  aboutValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
