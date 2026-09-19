import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { SEO } from '@/constants/Seo';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/utils/i18n';

/** Soft rose circle fill — explicit rgba (RN-web mishandles hex+alpha like `#E8A0BF20`). */
const ICON_CIRCLE_BG = {
  light: 'rgba(232, 160, 191, 0.125)',
  dark: 'rgba(92, 58, 70, 0.35)',
} as const;

export default function NotFoundScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const requestedPath = usePathname();
  const canGoBack = router.canGoBack();

  return (
    <>
      <Stack.Screen options={{ title: i18n.t('notFound.title') }} />
      <ThemedView style={styles.container} testID="not-found-screen">
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: ICON_CIRCLE_BG[colorScheme],
            },
          ]}
        >
          <Ionicons name="compass-outline" size={48} color={colors.tintText} />
        </View>
        <ThemedText type="caption" style={styles.brand}>
          {SEO.siteName}
        </ThemedText>
        <ThemedText type="title" style={styles.title} testID="not-found-title">
          {i18n.t('notFound.title')}
        </ThemedText>
        <ThemedText type="default" style={styles.message}>
          {i18n.t('notFound.message')}
        </ThemedText>
        {requestedPath ? (
          <View
            style={[styles.pathChip, { backgroundColor: colors.lavender + '55' }]}
            testID="not-found-path"
          >
            <ThemedText type="caption" style={styles.pathLabel}>
              {i18n.t('notFound.requestedPathLabel')}
            </ThemedText>
            <ThemedText
              style={styles.pathValue}
              testID="not-found-path-value"
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {requestedPath}
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.actions}>
          <Link href="/" asChild>
            <Pressable
              accessibilityRole="link"
              // Link + asChild merges styles with an object spread (Radix Slot), so this child
              // must receive a flat style object. A style array becomes `{0: ..., 1: ...}` and
              // crashes RN-web with "Failed to set an indexed property [0] on CSSStyleDeclaration".
              style={StyleSheet.flatten([styles.primaryButton, { backgroundColor: colors.tint }])}
              testID="not-found-home-link"
            >
              <ThemedText type="defaultSemiBold" style={{ color: colors.onTint }}>
                {i18n.t('notFound.goHome')}
              </ThemedText>
            </Pressable>
          </Link>
          {canGoBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18n.t('notFound.goBack')}
              onPress={() => router.back()}
              style={[styles.secondaryButton, { borderColor: colors.lavender }]}
              testID="not-found-back-button"
            >
              <Ionicons name="arrow-back" size={18} color={colors.text} />
              <ThemedText type="defaultSemiBold">{i18n.t('notFound.goBack')}</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  brand: {
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 360,
    marginBottom: 20,
  },
  pathChip: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
    maxWidth: 360,
    alignItems: 'center',
    gap: 2,
  },
  pathLabel: {
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  pathValue: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    minWidth: 160,
  },
});
