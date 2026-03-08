import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/utils/i18n';

export function CookieConsentBanner() {
  const { isReady, status, acceptAll, rejectNonEssential } = useCookieConsent();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (Platform.OS !== 'web' || !isReady || status !== 'pending') {
    return null;
  }

  return (
    <View style={styles.overlay} testID="cookie-consent-modal">
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.lavender }]}>
        <ThemedText style={styles.title}>{i18n.t('cookies.title')}</ThemedText>
        <ThemedText style={styles.description}>{i18n.t('cookies.description')}</ThemedText>
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { borderColor: colors.lavender, backgroundColor: colors.background }]}
            onPress={rejectNonEssential}
            accessibilityLabel={i18n.t('cookies.reject')}
            testID="cookie-consent-reject"
          >
            <ThemedText style={styles.rejectLabel}>{i18n.t('cookies.reject')}</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { borderColor: colors.tint, backgroundColor: colors.tint }]}
            onPress={acceptAll}
            accessibilityLabel={i18n.t('cookies.accept')}
            testID="cookie-consent-accept"
          >
            <ThemedText style={styles.acceptLabel}>{i18n.t('cookies.accept')}</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  title: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  rejectLabel: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  acceptLabel: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#FFFFFF',
  },
});
