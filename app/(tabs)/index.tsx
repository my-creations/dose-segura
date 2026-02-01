import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { MedicationCard } from '@/components/MedicationCard';
import { SearchBar } from '@/components/SearchBar';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useMedications } from '@/context/MedicationsContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFavorites } from '@/hooks/useFavorites';
import i18n from '@/utils/i18n';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { searchMedications, version, lastUpdated } = useMedications();
  const { isFavorite, toggleFavorite } = useFavorites();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const filteredMedications = searchMedications(searchQuery);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="home-screen">
      <SearchBar 
        value={searchQuery} 
        onChangeText={setSearchQuery} 
        placeholder={i18n.t('home.searchPlaceholder')}
      />
      
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
                ? i18n.t('home.noResults')
                : i18n.t('home.noData')}
            </ThemedText>
          </View>
        }
        ListFooterComponent={
          <View style={[styles.footer, { backgroundColor: colors.cream }]}>
            <ThemedText type="caption" style={styles.footerText}>
              {i18n.t('common.version', { version, date: lastUpdated })}
            </ThemedText>
            <ThemedText type="caption" style={styles.disclaimer}>
              {i18n.t('common.disclaimer')}
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
