import { Ionicons } from '@expo/vector-icons';
import { Link, Stack } from 'expo-router';
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

  return (
    <>
      <Stack.Screen options={{ title: i18n.t('notFound.title') }} />
      <ThemedView style={styles.container} testID="not-found-screen">
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            backgroundColor: ICON_CIRCLE_BG[colorScheme],
          }}
        >
          <Ionicons name="medkit-outline" size={48} color={colors.rose} />
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
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="link"
            style={{
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 16,
              minWidth: 200,
              alignItems: 'center',
              backgroundColor: colors.tint,
            }}
            testID="not-found-home-link"
          >
            <ThemedText type="defaultSemiBold" style={{ color: colors.cardBackground }}>
              {i18n.t('notFound.goHome')}
            </ThemedText>
          </Pressable>
        </Link>
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
    marginBottom: 28,
  },
});
