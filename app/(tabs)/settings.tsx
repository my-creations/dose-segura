import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useMedications } from '@/context/MedicationsContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function SettingsScreen() {
  const { version, lastUpdated, medications } = useMedications();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <ThemedText type="sectionTitle" style={styles.sectionTitle}>Informações da Base de Dados</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: colors.lavender }]}>
              <Ionicons name="document-text" size={18} color={colors.textDark} />
            </View>
            <ThemedText style={styles.label}>Versão</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.value}>{version}</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.lavender }]} />
          <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: colors.mint }]}>
              <Ionicons name="calendar" size={18} color={colors.textDark} />
            </View>
            <ThemedText style={styles.label}>Última atualização</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.value}>{lastUpdated}</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.lavender }]} />
          <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: colors.peach }]}>
              <Ionicons name="medical" size={18} color={colors.textDark} />
            </View>
            <ThemedText style={styles.label}>Total de medicamentos</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.value}>{medications.length}</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="sectionTitle" style={styles.sectionTitle}>Sobre</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <ThemedText style={styles.aboutText}>
            Dose Segura é uma aplicação de referência para auxiliar profissionais de saúde 
            na administração de medicamentos.
          </ThemedText>
          <View style={[styles.warningBox, { backgroundColor: colors.coral + '20' }]}>
            <Ionicons name="warning" size={20} color={colors.coral} />
            <ThemedText style={[styles.warningText, { color: colors.textDark }]}>
              Esta aplicação é apenas para referência. Verifique sempre a informação com 
              fontes oficiais e a farmácia antes de administrar qualquer medicamento.
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="sectionTitle" style={styles.sectionTitle}>Aplicação</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: colors.sky }]}>
              <Ionicons name="phone-portrait" size={18} color={colors.textDark} />
            </View>
            <ThemedText style={styles.label}>Versão da app</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.value}>1.0.0</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.lavender }]} />
          <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: colors.lilac }]}>
              <Ionicons name="cloud-offline" size={18} color={colors.textDark} />
            </View>
            <ThemedText style={styles.label}>Modo</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.value}>100% Offline</ThemedText>
          </View>
        </View>
      </View>
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
    shadowColor: '#E8A0BF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
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
});
