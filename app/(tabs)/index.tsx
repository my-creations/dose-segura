import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, View } from 'react-native';

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
  const { search, version, lastUpdated } = useMedications();
  const { favorites, toggleFavorite } = useFavorites();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isWeb = Platform.OS === 'web';
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredMedications = useMemo(
    () => search(deferredSearchQuery),
    [deferredSearchQuery, search],
  );
  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);

  const handleToggleFavorite = useCallback(
    (id: string) => {
      toggleFavorite(id);
    },
    [toggleFavorite],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredMedications)[number] }) => (
      <MedicationCard
        medication={item}
        isFavorite={favoriteIds.has(item.id)}
        onToggleFavorite={handleToggleFavorite}
      />
    ),
    [favoriteIds, handleToggleFavorite],
  );

  const keyExtractor = useCallback((item: (typeof filteredMedications)[number]) => item.id, []);
  const shouldRenderAllWebItems = isWeb && filteredMedications.length <= 150;
  const webRenderCount = shouldRenderAllWebItems ? Math.max(filteredMedications.length, 1) : 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="home-screen">
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={i18n.t('home.searchPlaceholder')}
      />

      <FlatList
        data={filteredMedications}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        initialNumToRender={isWeb ? webRenderCount : 12}
        maxToRenderPerBatch={isWeb ? webRenderCount : 10}
        windowSize={isWeb ? 15 : 7}
        updateCellsBatchingPeriod={isWeb ? 0 : 16}
        removeClippedSubviews={!isWeb}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText style={styles.emptyText}>
              {searchQuery ? i18n.t('home.noResults') : i18n.t('home.noData')}
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
