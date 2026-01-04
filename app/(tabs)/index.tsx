import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { MedicationCard } from '@/components/MedicationCard';
import { SearchBar } from '@/components/SearchBar';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useMedications } from '@/context/MedicationsContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFavorites } from '@/hooks/useFavorites';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { searchMedications, version, lastUpdated } = useMedications();
  const { isFavorite, toggleFavorite } = useFavorites();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const filteredMedications = searchMedications(searchQuery);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      
      <FlatList
        data={filteredMedications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MedicationCard
            medication={item}
            isFavorite={isFavorite(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText style={styles.emptyText}>
              {searchQuery 
                ? 'Nenhum medicamento encontrado'
                : 'Nenhum medicamento disponível'}
            </ThemedText>
          </View>
        }
        ListFooterComponent={
          <View style={[styles.footer, { backgroundColor: colors.cream }]}>
            <ThemedText type="caption" style={styles.footerText}>
              Versão {version} • Atualizado em {lastUpdated}
            </ThemedText>
            <ThemedText type="caption" style={styles.disclaimer}>
              Para referência apenas. Verificar sempre com a farmácia.
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 20,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
    opacity: 0.6,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  footerText: {
    marginBottom: 4,
  },
  disclaimer: {
    textAlign: 'center',
    opacity: 0.5,
  },
});
