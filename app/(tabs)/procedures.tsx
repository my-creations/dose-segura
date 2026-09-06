import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProcedureCard } from '@/components/ProcedureCard';
import { SearchBar } from '@/components/SearchBar';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProcedures } from '@/hooks/useProcedures';
import i18n from '@/utils/i18n';

export default function ProceduresScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { search, isLoading, lastError } = useProcedures();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const primaryButtonBackground = isDark ? colors.tint : colors.sky;
  const primaryButtonLabel = isDark ? colors.background : colors.textDark;
  const insets = useSafeAreaInsets();
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const procedures = useMemo(() => search(deferredSearchQuery), [deferredSearchQuery, search]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ThemedText>{i18n.t('common.loading')}</ThemedText>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="procedures-screen"
    >
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={i18n.t('procedures.searchPlaceholder')}
        testID="procedures-search-input"
      />

      {lastError ? (
        <View
          style={[styles.persistErrorBox, { backgroundColor: colors.coral + '20' }]}
          testID="procedures-persist-error"
        >
          <ThemedText style={[styles.persistError, { color: colors.textDark }]}>
            {lastError}
          </ThemedText>
        </View>
      ) : null}

      <FlatList
        data={procedures}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProcedureCard procedure={item} />}
        contentContainerStyle={[
          styles.list,
          procedures.length === 0 && styles.emptyList,
          { paddingBottom: 88 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.sky + '20' }]}>
              <Ionicons name="clipboard-outline" size={48} color={colors.tint} />
            </View>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              {searchQuery ? i18n.t('procedures.noResults') : i18n.t('procedures.emptyTitle')}
            </ThemedText>
            <ThemedText type="caption" style={styles.emptyText}>
              {searchQuery ? i18n.t('procedures.noResultsHint') : i18n.t('procedures.emptyMessage')}
            </ThemedText>
          </View>
        }
      />

      <Pressable
        style={[
          styles.fab,
          { backgroundColor: primaryButtonBackground, bottom: 20 + insets.bottom },
        ]}
        onPress={() => router.push('/procedure/form')}
        accessibilityLabel={i18n.t('accessibility.newProcedure')}
        testID="procedures-new-button"
      >
        <Ionicons name="add" size={28} color={primaryButtonLabel} />
        <ThemedText style={[styles.fabLabel, { color: primaryButtonLabel }]}>
          {i18n.t('procedures.new')}
        </ThemedText>
      </Pressable>
    </View>
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
  },
  list: {
    paddingVertical: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  persistErrorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  persistError: {
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
  },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 28,
    elevation: 4,
  },
  fabLabel: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 14,
  },
});
