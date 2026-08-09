import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { SectionContent, SectionTile } from '@/components/SectionTile';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { sectionI18nKey, sectionsOf } from '@/catalog/medicationSections';
import { Colors } from '@/constants/Colors';
import { pastelCardShadowStrong } from '@/constants/Shadows';
import { useMedications } from '@/context/MedicationsContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFavorites } from '@/hooks/useFavorites';
import { Medication } from '@/types/medication';
import i18n from '@/utils/i18n';

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDetails, getSummary } = useMedications();
  const { isFavorite, toggleFavorite } = useFavorites();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const [medication, setMedication] = useState<Medication | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const medicationSummary = id ? getSummary(id) : undefined;
  const displayMedication = medication ?? medicationSummary;

  // Platform detection
  const isWeb = Platform.OS === 'web';

  // Use 2 columns on wider screens (tablets, web)
  const isWideScreen = width >= 600;

  useEffect(() => {
    let isMounted = true;

    async function loadMedication() {
      if (!id) {
        if (isMounted) {
          setMedication(undefined);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const nextMedication = await getDetails(id);

        if (isMounted) {
          setMedication(nextMedication);
          setLoadFailed(false);
        }
      } catch (error) {
        console.error('Failed to load medication details:', error);

        if (isMounted) {
          setMedication(undefined);
          setLoadFailed(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMedication();

    return () => {
      isMounted = false;
    };
  }, [getDetails, id]);

  if (isLoading && !displayMedication) {
    return (
      <>
        <Stack.Screen options={{ title: i18n.t('common.loading') }} />
        <ThemedView style={styles.centered}>
          <ThemedText>{i18n.t('common.loading')}</ThemedText>
        </ThemedView>
      </>
    );
  }

  if (!displayMedication) {
    return (
      <ThemedView style={styles.centered} testID="medication-not-found">
        <Ionicons name="alert-circle" size={64} color={colors.icon} />
        <ThemedText style={styles.notFoundText}>
          {loadFailed ? i18n.t('common.medicationLoadError') : i18n.t('common.medicationNotFound')}
        </ThemedText>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.tint }]}
          onPress={() => router.replace('/')}
          testID="medication-not-found-back"
        >
          <ThemedText style={styles.backButtonText}>{i18n.t('common.back')}</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const favorite = isFavorite(displayMedication.id);
  const nonEmptySections = medication ? sectionsOf(medication) : [];

  return (
    <>
      <Stack.Screen
        options={{
          title: displayMedication.name,
          headerRight: isWeb
            ? undefined
            : () => (
                <Pressable
                  onPress={() => toggleFavorite(displayMedication.id)}
                  hitSlop={10}
                  testID="favorite-toggle"
                >
                  <Ionicons
                    name={favorite ? 'heart' : 'heart-outline'}
                    size={24}
                    color={favorite ? colors.rose : colors.icon}
                  />
                </Pressable>
              ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        testID="medication-detail"
      >
        <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.titleRow}>
            <ThemedText
              type="title"
              style={isWeb ? undefined : styles.name}
              testID="medication-title"
            >
              {displayMedication.name}
            </ThemedText>
            {isWeb && (
              <Pressable
                onPress={() => toggleFavorite(displayMedication.id)}
                hitSlop={10}
                style={styles.favoriteButtonWeb}
                testID="favorite-toggle"
              >
                <Ionicons
                  name={favorite ? 'heart' : 'heart-outline'}
                  size={26}
                  color={favorite ? colors.rose : colors.icon}
                />
              </Pressable>
            )}
            {isWeb && displayMedication.highRisk && (
              <View
                style={[styles.highRiskBadge, { backgroundColor: colors.coral }]}
                testID="high-risk-badge"
              >
                <Ionicons name="warning" size={14} color="#fff" />
                <ThemedText style={styles.highRiskText}>{i18n.t('common.highRisk')}</ThemedText>
              </View>
            )}
          </View>

          {((!isWeb && displayMedication.highRisk) || displayMedication.aliases.length > 0) && (
            <View style={styles.badgesRow} testID="medication-aliases">
              {!isWeb && displayMedication.highRisk && (
                <View
                  style={[styles.highRiskBadge, { backgroundColor: colors.coral }]}
                  testID="high-risk-badge"
                >
                  <Ionicons name="warning" size={14} color="#fff" />
                  <ThemedText style={styles.highRiskText}>{i18n.t('common.highRisk')}</ThemedText>
                </View>
              )}
              {displayMedication.aliases.map((alias, index) => (
                <View
                  key={index}
                  style={[styles.aliasBadge, { backgroundColor: colors.lavender }]}
                  testID={`medication-alias-${index}`}
                >
                  <ThemedText style={[styles.aliasText, { color: colors.textDark }]}>
                    {alias}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>

        {medication ? (
          <View
            style={[styles.sectionsContainer, isWideScreen && styles.sectionsGrid]}
            testID="medication-sections"
          >
            {nonEmptySections.map((section) => (
              <SectionTile
                key={section.key}
                title={i18n.t(sectionI18nKey(section.key))}
                sectionKey={section.key}
                style={
                  isWideScreen
                    ? { width: (width - (isWeb ? 68 : 48)) / 2, marginBottom: 12 }
                    : styles.sectionTile
                }
                testID={`section-${section.key}`}
              >
                <SectionContent items={section.data} testID={`section-${section.key}`} />
              </SectionTile>
            ))}
          </View>
        ) : null}

        <View
          style={[styles.footer, { backgroundColor: colors.cream }]}
          testID="medication-disclaimer"
        >
          <ThemedText style={styles.disclaimer}>{i18n.t('medication.disclaimer')}</ThemedText>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  notFoundText: {
    fontSize: 18,
    fontFamily: 'Quicksand_500Medium',
    opacity: 0.6,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
  },
  header: {
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    ...pastelCardShadowStrong,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  name: {
    flex: 1,
  },
  highRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  highRiskText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Quicksand_600SemiBold',
  },
  favoriteButtonWeb: {
    padding: 4,
    marginLeft: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  aliasBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  aliasText: {
    fontSize: 13,
    fontFamily: 'Quicksand_500Medium',
  },
  sectionsContainer: {
    padding: 16,
    gap: 12,
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  sectionTile: {
    width: '100%',
  },
  footer: {
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
  },
  disclaimer: {
    fontSize: 13,
    fontFamily: 'Quicksand_500Medium',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
});
