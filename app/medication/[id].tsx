import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { SectionContent, SectionTile } from '@/components/SectionTile';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors, SectionKey } from '@/constants/Colors';
import { useMedications } from '@/context/MedicationsContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFavorites } from '@/hooks/useFavorites';
import { MedicationSection, SECTION_LABELS } from '@/types/medication';

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
  const { getMedication } = useMedications();
  const { isFavorite, toggleFavorite } = useFavorites();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  
  // Platform detection
  const isWeb = Platform.OS === 'web';
  
  // Use 2 columns on wider screens (tablets, web)
  const isWideScreen = width >= 600;
  const numColumns = isWideScreen ? 2 : 1;

  const medication = getMedication(id);

  if (!medication) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="alert-circle" size={64} color={colors.icon} />
        <ThemedText style={styles.notFoundText}>Medicamento não encontrado</ThemedText>
        <Pressable style={[styles.backButton, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Voltar</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const favorite = isFavorite(medication.id);

  const sections: { key: MedicationSection; data: string[] }[] = [
    { key: 'classification', data: medication.classification },
    { key: 'compatibility', data: medication.compatibility },
    { key: 'presentationAndStorage', data: medication.presentationAndStorage },
    { key: 'preparation', data: medication.preparation },
    { key: 'administration', data: medication.administration },
    { key: 'stability', data: medication.stability },
    { key: 'contraindicationsAndPrecautions', data: medication.contraindicationsAndPrecautions },
    { key: 'nursingCare', data: medication.nursingCare },
  ];

  // Filter out empty sections
  const nonEmptySections = sections.filter(s => s.data.length > 0);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: medication.name,
          headerRight: isWeb ? undefined : () => (
            <Pressable onPress={() => toggleFavorite(medication.id)} hitSlop={10}>
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
            <ThemedText type="title" style={isWeb ? undefined : styles.name}>{medication.name}</ThemedText>
            {isWeb && (
              <Pressable onPress={() => toggleFavorite(medication.id)} hitSlop={10} style={styles.favoriteButtonWeb}>
                <Ionicons 
                  name={favorite ? 'heart' : 'heart-outline'} 
                  size={26} 
                  color={favorite ? colors.rose : colors.icon} 
                />
              </Pressable>
            )}
            {isWeb && medication.highRisk && (
              <View style={[styles.highRiskBadge, { backgroundColor: colors.coral }]}>
                <Ionicons name="warning" size={14} color="#fff" />
                <ThemedText style={styles.highRiskText}>Alto Risco</ThemedText>
              </View>
            )}
          </View>
          
          {((!isWeb && medication.highRisk) || medication.aliases.length > 0) && (
            <View style={styles.badgesRow}>
              {!isWeb && medication.highRisk && (
                <View style={[styles.highRiskBadge, { backgroundColor: colors.coral }]}>
                  <Ionicons name="warning" size={14} color="#fff" />
                  <ThemedText style={styles.highRiskText}>Alto Risco</ThemedText>
                </View>
              )}
              {medication.aliases.map((alias, index) => (
                <View key={index} style={[styles.aliasBadge, { backgroundColor: colors.lavender }]}>
                  <ThemedText style={[styles.aliasText, { color: colors.textDark }]}>{alias}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[
          styles.sectionsContainer, 
          isWideScreen && styles.sectionsGrid
        ]}>
          {nonEmptySections.map((section, index) => (
            <SectionTile
              key={section.key}
              title={SECTION_LABELS[section.key]}
              sectionKey={SECTION_KEY_MAP[section.key]}
              style={isWideScreen ? { width: (width - 48) / 2, marginBottom: 12 } : styles.sectionTile}
            >
              <SectionContent items={section.data} />
            </SectionTile>
          ))}
        </View>

        <View style={[styles.footer, { backgroundColor: colors.cream }]}>
          <ThemedText style={styles.disclaimer}>
            ⚠️ Esta informação é apenas para referência. Verifique sempre com a farmácia antes de administrar.
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
    shadowColor: '#E8A0BF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
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
