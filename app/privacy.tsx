import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { PageMeta } from '@/components/PageMeta';
import { Colors } from '@/constants/Colors';
import { pastelCardShadow } from '@/constants/Shadows';
import { PAGES } from '@/constants/Seo';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/utils/i18n';

const CONTACT_EMAIL = 'pmrobalo@gmail.com';

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const sections = [
    { titleKey: 'privacy.offlineTitle', bodyKey: 'privacy.offlineBody' },
    { titleKey: 'privacy.localDataTitle', bodyKey: 'privacy.localDataBody' },
    { titleKey: 'privacy.analyticsTitle', bodyKey: 'privacy.analyticsBody' },
    { titleKey: 'privacy.hostingTitle', bodyKey: 'privacy.hostingBody' },
  ] as const;

  return (
    <>
      <PageMeta {...PAGES.privacy} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        testID="privacy-screen"
      >
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <ThemedText type="defaultSemiBold" style={styles.lede}>
            {i18n.t('privacy.lede')}
          </ThemedText>

          {sections.map((section) => (
            <View key={section.titleKey} style={styles.sectionBlock}>
              <ThemedText type="defaultSemiBold" style={styles.sectionHeading}>
                {i18n.t(section.titleKey)}
              </ThemedText>
              <ThemedText style={styles.body}>{i18n.t(section.bodyKey)}</ThemedText>
            </View>
          ))}

          <View style={styles.sectionBlock}>
            <ThemedText type="defaultSemiBold" style={styles.sectionHeading}>
              {i18n.t('privacy.contactTitle')}
            </ThemedText>
            <ThemedText style={styles.body}>{i18n.t('privacy.contactBody')}</ThemedText>
            <Pressable
              testID="privacy-contact-email"
              accessibilityRole="link"
              accessibilityLabel={i18n.t('accessibility.openContact')}
              onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
              style={({ pressed }) => [styles.emailLink, pressed && { opacity: 0.7 }]}
            >
              <ThemedText type="link">{CONTACT_EMAIL}</ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    ...pastelCardShadow,
  },
  lede: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 15,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
  emailLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
});
