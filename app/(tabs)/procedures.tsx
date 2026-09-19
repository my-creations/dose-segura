import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProcedureCard } from '@/components/ProcedureCard';
import { PageMeta } from '@/components/PageMeta';
import { SearchBar } from '@/components/SearchBar';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { PAGES } from '@/constants/Seo';
import { pastelCardShadowStrong } from '@/constants/Shadows';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProcedures } from '@/hooks/useProcedures';
import i18n from '@/utils/i18n';

export default function ProceduresScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
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
      <PageMeta {...PAGES.procedures} />
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
              <Ionicons name="clipboard-outline" size={48} color={colors.tintText} />
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
        onPress={() => setMenuOpen(true)}
        accessibilityLabel={i18n.t('accessibility.newProcedure')}
        testID="procedures-new-button"
      >
        <Ionicons name="add" size={28} color={primaryButtonLabel} />
        <ThemedText style={[styles.fabLabel, { color: primaryButtonLabel }]}>
          {i18n.t('procedures.new')}
        </ThemedText>
      </Pressable>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuOpen(false)}
          testID="procedures-add-menu-backdrop"
        >
          <Pressable
            style={[
              styles.menuSheet,
              {
                backgroundColor: colors.cardBackground,
                marginBottom: 80 + insets.bottom,
              },
            ]}
            onPress={(event) => event.stopPropagation()}
            testID="procedures-add-menu"
          >
            <ThemedText type="subtitle" style={styles.menuTitle}>
              {i18n.t('procedures.addMenuTitle')}
            </ThemedText>
            <Pressable
              style={[styles.menuOption, { backgroundColor: colors.sky + '33' }]}
              onPress={() => {
                setMenuOpen(false);
                router.push('/procedure/form');
              }}
              accessibilityLabel={i18n.t('accessibility.createProcedure')}
              testID="procedures-create-new"
            >
              <Ionicons name="create-outline" size={22} color={colors.textDark} />
              <ThemedText style={[styles.menuOptionLabel, { color: colors.textDark }]}>
                {i18n.t('procedures.createNew')}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.menuOption, { backgroundColor: colors.lavender + '55' }]}
              onPress={() => {
                setMenuOpen(false);
                router.push('/procedure/catalog');
              }}
              accessibilityLabel={i18n.t('accessibility.addFromCatalog')}
              testID="procedures-add-from-catalog"
            >
              <Ionicons name="library-outline" size={22} color={colors.textDark} />
              <ThemedText style={[styles.menuOptionLabel, { color: colors.textDark }]}>
                {i18n.t('procedures.addFromCatalog')}
              </ThemedText>
            </Pressable>
            <Pressable
              style={styles.menuCancel}
              onPress={() => setMenuOpen(false)}
              testID="procedures-add-menu-cancel"
            >
              <ThemedText style={{ color: colors.tintText }}>{i18n.t('common.cancel')}</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  menuSheet: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
    ...pastelCardShadowStrong,
  },
  menuTitle: {
    textAlign: 'center',
    marginBottom: 4,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  menuOptionLabel: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 15,
    flexShrink: 1,
  },
  menuCancel: {
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
});
