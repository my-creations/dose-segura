import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { SectionContent, SectionTile } from '@/components/SectionTile';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors, SectionKey } from '@/constants/Colors';
import { pastelCardShadowStrong } from '@/constants/Shadows';
import { useMedications } from '@/context/MedicationsContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFavorites } from '@/hooks/useFavorites';
import { MedicationSection } from '@/types/medication';
import i18n from '@/utils/i18n';

// Map MedicationSection to SectionKey for colors
const SECTION_KEY_MAP: Record<MedicationSection, SectionKey> = {
  classification: 'classification',
  compatibility: 'compatibility',
  presentationAndStorage: 'presentationAndStorage',
  preparation: 'preparation',
  administration: 'administration',
  stability: 'stability',
  contraindicationsAndPrecautions: 'contraindicationsAndPrecautions',
  nursingCare: 'nursingCare',
};

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMedicationDetails, getMedicationSummary } = useMedications();
  const { isFavorite, toggleFavorite } = useFavorites();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const [medication, setMedication] = useState<Awaited<ReturnType<typeof getMedicationDetails>>>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const medicationSummary = id ? getMedicationSummary(id) : undefined;
  const displayMedication = medication ?? medicationSummary;
  
  // Platform detection
  const isWeb = Platform.OS === 'web';
  
  // Use 2 columns on wider screens (tablets, web)
  const isWideScreen = width >= 600;
  const numColumns = isWideScreen ? 2 : 1;

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
        const nextMedication = await getMedicationDetails(id);

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
  }, [getMedicationDetails, id]);

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
      <ThemedView style={styles.centered}>
        <Ionicons name="alert-circle" size={64} color={colors.icon} />
        <ThemedText style={styles.notFoundText}>
          {loadFailed ? i18n.t('common.medicationLoadError') : i18n.t('common.medicationNotFound')}
        </ThemedText>
        <Pressable style={[styles.backButton, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>{i18n.t('common.back')}</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const favorite = isFavorite(displayMedication.id);

  const sections: { key: MedicationSection; data: string[] }[] = medication
    ? [
        { key: 'classification', data: medication.classification },
        { key: 'compatibility', data: medication.compatibility },
        { key: 'presentationAndStorage', data: medication.presentationAndStorage },
        { key: 'preparation', data: medication.preparation },
        { key: 'administration', data: medication.administration },
        { key: 'stability', data: medication.stability },
        { key: 'contraindicationsAndPrecautions', data: medication.contraindicationsAndPrecautions },
        { key: 'nursingCare', data: medication.nursingCare },
      ]
    : [];

  // Filter out empty sections
  const nonEmptySections = sections.filter(s => s.data.length > 0);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: displayMedication.name,
          headerRight: isWeb ? undefined : () => (
            <Pressable onPress={() => toggleFavorite(displayMedication.id)} hitSlop={10} testID="favorite-toggle">
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={24}
                color={favorite ? colors.rose : colors.icon}
              />
            </Pressable>
          ),
        }} 
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.titleRow}>
            <ThemedText type="title" style={isWeb ? undefined : styles.name} testID="medication-title">
              {displayMedication.name}
            </ThemedText>
            {isWeb && (
              <Pressable onPress={() => toggleFavorite(displayMedication.id)} hitSlop={10} style={styles.favoriteButtonWeb} testID="favorite-toggle">
                <Ionicons
                  name={favorite ? 'heart' : 'heart-outline'}
                  size={26}
                  color={favorite ? colors.rose : colors.icon}
                />
              </Pressable>
            )}
            {isWeb && displayMedication.highRisk && (
              <View style={[styles.highRiskBadge, { backgroundColor: colors.coral }]}>
                <Ionicons name="warning" size={14} color="#fff" />
                <ThemedText style={styles.highRiskText}>{i18n.t('common.highRisk')}</ThemedText>
              </View>
            )}
          </View>
          
          {((!isWeb && displayMedication.highRisk) || displayMedication.aliases.length > 0) && (
            <View style={styles.badgesRow}>
              {!isWeb && displayMedication.highRisk && (
                <View style={[styles.highRiskBadge, { backgroundColor: colors.coral }]}>
                  <Ionicons name="warning" size={14} color="#fff" />
                  <ThemedText style={styles.highRiskText}>{i18n.t('common.highRisk')}</ThemedText>
                </View>
              )}
              {displayMedication.aliases.map((alias, index) => (
                <View key={index} style={[styles.aliasBadge, { backgroundColor: colors.lavender }]}>
                  <ThemedText style={[styles.aliasText, { color: colors.textDark }]}>{alias}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>

        {medication ? (
          <View style={[
            styles.sectionsContainer,
            isWideScreen && styles.sectionsGrid
          ]}>
            {nonEmptySections.map((section) => (
              <SectionTile
                key={section.key}
                title={i18n.t(`medication.sections.${section.key}`)}
                sectionKey={SECTION_KEY_MAP[section.key]}
                style={isWideScreen ? { width: (width - (isWeb ? 68 : 48)) / 2, marginBottom: 12 } : styles.sectionTile}
                testID={`section-${section.key}`}
              >
                <SectionContent items={section.data} />
              </SectionTile>
            ))}
          </View>
        ) : null}

        <View style={[styles.footer, { backgroundColor: colors.cream }]}>
          <ThemedText style={styles.disclaimer}>
            {i18n.t('medication.disclaimer')}
          </ThemedText>
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
