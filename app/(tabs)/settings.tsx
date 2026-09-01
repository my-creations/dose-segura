import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { PWAInstallModal } from '@/components/PWAInstallModal';
import { Colors } from '@/constants/Colors';
import { pastelCardShadow } from '@/constants/Shadows';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { useMedications } from '@/context/MedicationsContext';
import { ThemeMode, useTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import i18n from '@/utils/i18n';

export default function SettingsScreen() {
  const { version, lastUpdated, medications } = useMedications();
  const { themeMode, setThemeMode } = useTheme();
  const { isReady, status, acceptAll, rejectNonEssential } = useCookieConsent();
  const { isStandalone, installApp, showInstructions, setShowInstructions } = usePWAInstall();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isMobileWeb, setIsMobileWeb] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
      return;
    }

    setIsMobileWeb(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const shouldShowInstall = isMobileWeb && !isStandalone;
  const advertisingCookiesEnabled = status === 'accepted';
  const isDarkMode = (colorScheme ?? 'light') === 'dark';
  const switchTrackOffColor = isDarkMode ? '#6B7280' : colors.lavender;
  const switchTrackOnColor = isDarkMode ? '#FF8FB0' : colors.tint;
  const switchThumbColor = isDarkMode ? '#FFFFFF' : colors.cardBackground;

  const renderThemeOption = (
    mode: ThemeMode,
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
  ) => {
    const isSelected = themeMode === mode;
    return (
      <Pressable
        style={[styles.themeOption, isSelected && { backgroundColor: colors.tint + '20' }]}
        onPress={() => setThemeMode(mode)}
      >
        <View style={styles.themeOptionContent}>
          <Ionicons name={icon} size={20} color={isSelected ? colors.tint : colors.text} />
          <ThemedText
            style={[
              styles.themeOptionLabel,
              isSelected && { color: colors.tint, fontFamily: 'Quicksand_600SemiBold' },
            ]}
          >
            {label}
          </ThemedText>
        </View>
        {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.tint} />}
      </Pressable>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="settings-screen"
    >
      <View style={styles.section}>
        <ThemedText type="sectionTitle" style={styles.sectionTitle}>
          {i18n.t('settings.appearance')}
        </ThemedText>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, padding: 8 }]}>
          {renderThemeOption('system', i18n.t('settings.themes.system'), 'phone-portrait-outline')}
          <View style={[styles.divider, { backgroundColor: colors.lavender, marginVertical: 4 }]} />
          {renderThemeOption('light', i18n.t('settings.themes.light'), 'sunny-outline')}
          <View style={[styles.divider, { backgroundColor: colors.lavender, marginVertical: 4 }]} />
          {renderThemeOption('dark', i18n.t('settings.themes.dark'), 'moon-outline')}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="sectionTitle" style={styles.sectionTitle}>
          {i18n.t('settings.databaseInfo')}
        </ThemedText>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: colors.lavender }]}>
              <Ionicons name="document-text" size={18} color={colors.textDark} />
            </View>
            <ThemedText style={styles.label}>{i18n.t('settings.labels.version')}</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.value}>
              {version}
            </ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.lavender }]} />
          <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: colors.mint }]}>
              <Ionicons name="calendar" size={18} color={colors.textDark} />
            </View>
            <ThemedText style={styles.label}>{i18n.t('settings.labels.lastUpdated')}</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.value}>
              {lastUpdated}
            </ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.lavender }]} />
          <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: colors.peach }]}>
              <Ionicons name="medical" size={18} color={colors.textDark} />
            </View>
            <ThemedText style={styles.label}>
              {i18n.t('settings.labels.totalMedications')}
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.value}>
              {medications.length}
            </ThemedText>
          </View>
        </View>
      </View>

      {shouldShowInstall && (
        <View style={styles.section} testID="installation-section">
          <ThemedText type="sectionTitle" style={styles.sectionTitle}>
            {i18n.t('settings.install.sectionTitle')}
          </ThemedText>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Pressable
              testID="install-button"
              style={({ pressed }) => [
                styles.installButton,
                { backgroundColor: colors.tint },
                pressed && { opacity: 0.8 },
              ]}
              onPress={installApp}
            >
              <Ionicons name="download-outline" size={20} color={colors.cardBackground} />
              <ThemedText style={[styles.installButtonText, { color: colors.cardBackground }]}>
                {i18n.t('settings.install.button')}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      )}

      {Platform.OS === 'web' && isReady && (
        <View style={styles.section} testID="privacy-section">
          <ThemedText type="sectionTitle" style={styles.sectionTitle}>
            {i18n.t('settings.privacy')}
          </ThemedText>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <ThemedText style={styles.aboutText}>
              {i18n.t('settings.cookies.description')}
            </ThemedText>
            <View style={[styles.warningBox, { backgroundColor: colors.lavender + '25' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textDark} />
              <View style={styles.cookieStatusContent}>
                <ThemedText style={[styles.cookieStatusLabel, { color: colors.textDark }]}>
                  {i18n.t('settings.cookies.currentStatus')}
                </ThemedText>
                <ThemedText style={[styles.cookieStatusValue, { color: colors.textDark }]}>
                  {i18n.t(`settings.cookies.status.${status}`)}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.cookieToggleRow, { backgroundColor: colors.lavender + '20' }]}>
              <View style={styles.cookieToggleText}>
                <ThemedText style={styles.cookieToggleTitle}>
                  {i18n.t('settings.cookies.toggleLabel')}
                </ThemedText>
                <ThemedText style={styles.cookieToggleSubtitle} testID="cookie-toggle-status">
                  {advertisingCookiesEnabled
                    ? i18n.t('settings.cookies.status.accepted')
                    : i18n.t('settings.cookies.status.rejected')}
                </ThemedText>
                <ThemedText style={styles.cookieToggleHint}>
                  {i18n.t('settings.cookies.toggleHelp')}
                </ThemedText>
              </View>
              <Switch
                testID="cookie-advertising-toggle"
                value={advertisingCookiesEnabled}
                onValueChange={(enabled) => {
                  if (enabled) {
                    acceptAll();
                    return;
                  }
                  rejectNonEssential();
                }}
                trackColor={{ false: switchTrackOffColor, true: switchTrackOnColor }}
                thumbColor={switchThumbColor}
                ios_backgroundColor={switchTrackOffColor}
              />
            </View>
            <ThemedText style={styles.cookieSupportNote}>
              {i18n.t('settings.cookies.supportNote')}
            </ThemedText>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <ThemedText type="sectionTitle" style={styles.sectionTitle}>
          {i18n.t('settings.about')}
        </ThemedText>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <ThemedText style={styles.aboutText}>{i18n.t('settings.aboutText')}</ThemedText>
          <View style={[styles.warningBox, { backgroundColor: colors.coral + '20' }]}>
            <Ionicons name="warning" size={20} color={colors.coral} />
            <ThemedText style={[styles.warningText, { color: colors.textDark }]}>
              {i18n.t('settings.warningText')}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="sectionTitle" style={styles.sectionTitle}>
          {i18n.t('settings.application')}
        </ThemedText>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: colors.sky }]}>
              <Ionicons name="phone-portrait" size={18} color={colors.textDark} />
            </View>
            <ThemedText style={styles.label}>{i18n.t('settings.labels.appVersion')}</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.value}>
              1.0.0
            </ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.lavender }]} />
          <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: colors.lilac }]}>
              <Ionicons name="cloud-offline" size={18} color={colors.textDark} />
            </View>
            <ThemedText style={styles.label}>{i18n.t('settings.labels.mode')}</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.value}>
              {i18n.t('settings.labels.offlineMode')}
            </ThemedText>
          </View>
        </View>
      </View>

      <PWAInstallModal visible={showInstructions} onClose={() => setShowInstructions(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    ...pastelCardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontSize: 15,
  },
  value: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.5,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  cookieStatusContent: {
    flex: 1,
  },
  cookieStatusLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  cookieStatusValue: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    marginTop: 2,
  },
  cookieToggleRow: {
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
    marginBottom: 4,
  },
  cookieToggleText: {
    flex: 1,
  },
  cookieToggleTitle: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
  },
  cookieToggleSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    opacity: 0.8,
  },
  cookieToggleHint: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    opacity: 0.75,
  },
  cookieSupportNote: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    opacity: 0.8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeOptionLabel: {
    fontSize: 15,
  },
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  installButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
  },
});
