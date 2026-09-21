import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PWAInstallModal } from '@/components/PWAInstallModal';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { pastelCardShadow } from '@/constants/Shadows';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import i18n from '@/utils/i18n';

/**
 * First-run install prompt for the PWA.
 *
 * Shown on the home screen while the app is installable and not already installed, until the
 * user dismisses it (persisted — we never ask again) or installs it. Renders nothing on native.
 */
export function PWAInstallBanner() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isBannerVisible, installApp, dismissBanner, showInstructions, setShowInstructions } =
    usePWAInstall();

  if (!isBannerVisible) {
    return null;
  }

  return (
    <>
      <View
        style={[styles.banner, { backgroundColor: colors.cardBackground }]}
        testID="pwa-install-banner"
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.mint }]}>
          <Ionicons name="download-outline" size={20} color={colors.textDark} />
        </View>

        <View style={styles.content}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {i18n.t('settings.install.banner.title')}
          </ThemedText>
          <ThemedText type="caption">{i18n.t('settings.install.banner.body')}</ThemedText>
        </View>

        <Pressable
          onPress={installApp}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('settings.install.banner.cta')}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: colors.tint },
            pressed && { opacity: 0.85 },
          ]}
          testID="pwa-install-banner-install"
        >
          <ThemedText type="defaultSemiBold" style={{ color: colors.onTint }}>
            {i18n.t('settings.install.banner.cta')}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={dismissBanner}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('settings.install.banner.dismiss')}
          hitSlop={10}
          style={styles.dismiss}
          testID="pwa-install-banner-dismiss"
        >
          <Ionicons name="close" size={20} color={colors.icon} />
        </Pressable>
      </View>

      <PWAInstallModal visible={showInstructions} onClose={() => setShowInstructions(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    ...pastelCardShadow,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
  },
  cta: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  dismiss: {
    padding: 2,
  },
});
