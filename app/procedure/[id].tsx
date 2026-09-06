import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ChecklistSection } from '@/components/ChecklistSection';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { pastelCardShadow } from '@/constants/Shadows';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProcedures } from '@/hooks/useProcedures';
import i18n from '@/utils/i18n';

export default function ProcedureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProcedure, duplicateProcedure, deleteProcedure, isLoading, lastError } =
    useProcedures();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const primaryButtonBackground = isDark ? colors.tint : colors.sky;
  const primaryButtonLabel = isDark ? colors.background : colors.textDark;
  const procedure = id ? getProcedure(id) : undefined;

  const handleDuplicate = useCallback(() => {
    if (!id) {
      return;
    }

    const copy = duplicateProcedure(id);
    if (copy) {
      router.replace(`/procedure/${copy.id}`);
    }
  }, [duplicateProcedure, id]);

  const handleDelete = useCallback(() => {
    if (!procedure || procedure.source !== 'user') {
      return;
    }

    const confirmAndDelete = () => {
      deleteProcedure(procedure.id);
      router.back();
    };

    const message = i18n.t('procedures.deleteMessage', { title: procedure.title });

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        confirmAndDelete();
      }
      return;
    }

    Alert.alert(i18n.t('procedures.deleteTitle'), message, [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      { text: i18n.t('procedures.delete'), style: 'destructive', onPress: confirmAndDelete },
    ]);
  }, [deleteProcedure, procedure]);

  if (isLoading && !procedure) {
    return (
      <>
        <Stack.Screen options={{ title: i18n.t('common.loading') }} />
        <ThemedView style={styles.centered}>
          <ThemedText>{i18n.t('common.loading')}</ThemedText>
        </ThemedView>
      </>
    );
  }

  if (!procedure) {
    return (
      <ThemedView style={styles.centered} testID="procedure-not-found">
        <Ionicons name="alert-circle" size={64} color={colors.icon} />
        <ThemedText style={styles.notFoundText}>{i18n.t('procedures.notFound')}</ThemedText>
        <Pressable
          style={[styles.actionButton, { backgroundColor: primaryButtonBackground }]}
          onPress={() => router.replace('/procedures')}
          testID="procedure-not-found-back"
        >
          <ThemedText style={[styles.actionButtonText, { color: primaryButtonLabel }]}>
            {i18n.t('common.back')}
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const isBuiltin = procedure.source === 'builtin';

  return (
    <>
      <Stack.Screen options={{ title: procedure.title }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        testID="procedure-detail"
      >
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

        <View style={styles.header}>
          <ThemedText type="title" style={styles.title} testID="procedure-title">
            {procedure.title}
          </ThemedText>
          <View
            style={[styles.badge, { backgroundColor: isBuiltin ? colors.lavender : colors.mint }]}
            testID={isBuiltin ? 'procedure-builtin-badge' : 'procedure-user-badge'}
          >
            <ThemedText style={[styles.badgeText, { color: colors.textDark }]}>
              {isBuiltin ? i18n.t('procedures.builtinBadge') : i18n.t('procedures.userBadge')}
            </ThemedText>
          </View>
        </View>

        {isBuiltin ? (
          <ThemedText type="caption" style={styles.readOnly}>
            {i18n.t('procedures.readOnly')}
          </ThemedText>
        ) : null}

        <ChecklistSection
          title={i18n.t('procedures.materials')}
          items={procedure.materials}
          accent="mint"
          testID="procedure-materials"
        />
        <ChecklistSection
          title={i18n.t('procedures.steps')}
          items={procedure.steps}
          numbered
          accent="sky"
          testID="procedure-steps"
        />
        <ChecklistSection
          title={i18n.t('procedures.attention')}
          items={procedure.attention}
          accent="peach"
          testID="procedure-attention"
        />

        <View style={[styles.disclaimer, { backgroundColor: colors.cream }]}>
          <ThemedText type="caption" style={styles.disclaimerText}>
            {i18n.t('procedures.disclaimer')}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.sky }]}
            onPress={handleDuplicate}
            testID="procedure-duplicate"
          >
            <Ionicons name="copy-outline" size={18} color={colors.textDark} />
            <ThemedText style={[styles.actionLabel, { color: colors.textDark }]}>
              {i18n.t('procedures.duplicate')}
            </ThemedText>
          </Pressable>

          {isBuiltin ? null : (
            <>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.lavender }]}
                onPress={() =>
                  router.push({ pathname: '/procedure/form', params: { id: procedure.id } })
                }
                testID="procedure-edit"
              >
                <Ionicons name="create-outline" size={18} color={colors.textDark} />
                <ThemedText style={[styles.actionLabel, { color: colors.textDark }]}>
                  {i18n.t('procedures.edit')}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.coral }]}
                onPress={handleDelete}
                testID="procedure-delete"
              >
                <Ionicons name="trash-outline" size={18} color={colors.textDark} />
                <ThemedText style={[styles.actionLabel, { color: colors.textDark }]}>
                  {i18n.t('procedures.delete')}
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  persistErrorBox: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  persistError: {
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  title: {
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
  readOnly: {
    marginBottom: 16,
  },
  disclaimer: {
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
    ...pastelCardShadow,
  },
  disclaimerText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionLabel: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 15,
  },
  actionButtonText: {
    fontFamily: 'Quicksand_600SemiBold',
  },
  notFoundText: {
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
});
