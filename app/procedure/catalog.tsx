import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { pastelCardShadowStrong } from '@/constants/Shadows';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProcedures } from '@/hooks/useProcedures';
import i18n from '@/utils/i18n';

export default function ProcedureCatalogScreen() {
  const {
    catalogTemplates,
    addFromCatalog,
    isTemplateAdopted,
    isLoading,
    storageReady,
    lastError,
  } = useProcedures();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const primaryButtonBackground = isDark ? colors.tint : colors.sky;
  const primaryButtonLabel = isDark ? colors.background : colors.textDark;
  const canWrite = storageReady && !isLoading;

  const handleView = useCallback((templateId: string) => {
    router.push(`/procedure/${templateId}`);
  }, []);

  const handleAdd = useCallback(
    (templateId: string) => {
      if (!canWrite || isTemplateAdopted(templateId)) {
        return;
      }
      const adopted = addFromCatalog(templateId);
      if (adopted) {
        router.replace(`/procedure/${adopted.id}`);
      }
    },
    [addFromCatalog, canWrite, isTemplateAdopted],
  );

  return (
    <>
      <Stack.Screen options={{ title: i18n.t('navigation.procedureCatalog') }} />
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
        testID="procedure-catalog-screen"
      >
        <ThemedText type="caption" style={styles.hint}>
          {i18n.t('procedures.catalogHint')}
        </ThemedText>

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
          data={catalogTemplates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText>{i18n.t('procedures.catalogEmpty')}</ThemedText>
            </View>
          }
          renderItem={({ item }) => {
            const adopted = isTemplateAdopted(item.id);
            return (
              <View
                style={[styles.card, { backgroundColor: colors.cardBackground }]}
                testID={`catalog-template-${item.id}`}
              >
                <View style={styles.cardBody}>
                  <View style={styles.header}>
                    <ThemedText style={styles.title}>{item.title}</ThemedText>
                    <View style={[styles.badge, { backgroundColor: colors.lavender }]}>
                      <ThemedText style={[styles.badgeText, { color: colors.textDark }]}>
                        {i18n.t('procedures.builtinBadge')}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText type="caption">
                    {i18n.t('procedures.cardSummary', {
                      materials: item.materials.length,
                      steps: item.steps.length,
                    })}
                  </ThemedText>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.secondaryButton, { backgroundColor: colors.lavender }]}
                    onPress={() => handleView(item.id)}
                    accessibilityLabel={i18n.t('accessibility.viewCatalogTemplate', {
                      name: item.title,
                    })}
                    testID={`catalog-view-${item.id}`}
                  >
                    <Ionicons name="eye-outline" size={18} color={colors.textDark} />
                    <ThemedText style={[styles.buttonLabel, { color: colors.textDark }]}>
                      {i18n.t('procedures.viewTemplate')}
                    </ThemedText>
                  </Pressable>
                  {adopted ? (
                    <View
                      style={[styles.disabledButton, { backgroundColor: colors.mint + '55' }]}
                      testID={`catalog-already-added-${item.id}`}
                    >
                      <Ionicons name="checkmark-circle" size={18} color={colors.textDark} />
                      <ThemedText style={[styles.buttonLabel, { color: colors.textDark }]}>
                        {i18n.t('procedures.alreadyAdded')}
                      </ThemedText>
                    </View>
                  ) : (
                    <Pressable
                      style={[
                        styles.addButton,
                        {
                          backgroundColor: primaryButtonBackground,
                          opacity: canWrite ? 1 : 0.5,
                        },
                      ]}
                      disabled={!canWrite}
                      onPress={() => handleAdd(item.id)}
                      accessibilityLabel={i18n.t('accessibility.addCatalogTemplate', {
                        name: item.title,
                      })}
                      testID={`catalog-add-${item.id}`}
                    >
                      <Ionicons name="add-circle-outline" size={18} color={primaryButtonLabel} />
                      <ThemedText style={[styles.buttonLabel, { color: primaryButtonLabel }]}>
                        {i18n.t('procedures.addTemplate')}
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hint: {
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    lineHeight: 20,
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
  list: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...pastelCardShadowStrong,
  },
  cardBody: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Quicksand_600SemiBold',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Quicksand_500Medium',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
  },
  disabledButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
  },
  buttonLabel: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 15,
  },
});
