import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PageMeta } from '@/components/PageMeta';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { pastelCardShadow } from '@/constants/Shadows';
import { PAGES } from '@/constants/Seo';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/utils/i18n';

const CONTACT_EMAIL = 'pmrobalo@gmail.com';

export default function TermsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const sections = [
    { titleKey: 'terms.purposeTitle', bodyKey: 'terms.purposeBody' },
    { titleKey: 'terms.responsibilityTitle', bodyKey: 'terms.responsibilityBody' },
    { titleKey: 'terms.calculationsTitle', bodyKey: 'terms.calculationsBody' },
    { titleKey: 'terms.liabilityTitle', bodyKey: 'terms.liabilityBody' },
  ] as const;

  return (
    <>
      <PageMeta {...PAGES.terms} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        testID="terms-screen"
      >
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <ThemedText type="defaultSemiBold" style={styles.lede}>
            {i18n.t('terms.lede')}
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
              {i18n.t('terms.contactTitle')}
            </ThemedText>
            <ThemedText style={styles.body}>{i18n.t('terms.contactBody')}</ThemedText>
            <Pressable
              testID="terms-contact-email"
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
