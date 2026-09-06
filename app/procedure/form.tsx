import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { pastelCardShadow } from '@/constants/Shadows';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProcedures } from '@/hooks/useProcedures';
import { sanitizeDraft, validateDraft } from '@/procedures/procedures';
import type { ProcedureDraft } from '@/types/procedure';
import i18n from '@/utils/i18n';

function withAtLeastOne(items: string[]): string[] {
  return items.length > 0 ? items : [''];
}

interface ListEditorProps {
  label: string;
  itemName: string;
  items: string[];
  onChange: (items: string[]) => void;
  testID: string;
  colors: (typeof Colors)['light'];
}

function ListEditor({ label, itemName, items, onChange, testID, colors }: ListEditorProps) {
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <ThemedText type="sectionTitle" style={styles.cardTitle}>
        {label}
      </ThemedText>
      {items.map((item, index) => (
        <View key={`${testID}-${index}`} style={styles.itemRow}>
          <TextInput
            style={[
              styles.itemInput,
              {
                color: colors.text,
                borderColor: colors.lavender,
                backgroundColor: colors.background,
              },
            ]}
            value={item}
            onChangeText={(text) => {
              const next = [...items];
              next[index] = text;
              onChange(next);
            }}
            placeholder={i18n.t('procedures.itemPlaceholder')}
            placeholderTextColor={colors.icon}
            accessibilityLabel={`${itemName} ${index + 1}`}
            testID={`${testID}-item-${index}`}
          />
          <Pressable
            onPress={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            accessibilityLabel={i18n.t('accessibility.removeListItem', {
              name: `${itemName} ${index + 1}`,
            })}
            testID={`${testID}-remove-${index}`}
            style={styles.removeButton}
            hitSlop={8}
          >
            <Ionicons name="close-circle-outline" size={22} color={colors.icon} />
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={() => onChange([...items, ''])}
        style={styles.addButton}
        accessibilityLabel={i18n.t('accessibility.addListItem')}
        testID={`${testID}-add`}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.tint} />
        <ThemedText style={[styles.addLabel, { color: colors.tint }]}>
          {i18n.t('procedures.addItem')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

export default function ProcedureFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getProcedure, createProcedure, updateProcedure, isLoading, storageReady, lastError } =
    useProcedures();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const primaryButtonBackground = isDark ? colors.tint : colors.sky;
  const primaryButtonLabel = isDark ? colors.background : colors.textDark;
  const existing = id ? getProcedure(id) : undefined;
  const isEditing = Boolean(existing && existing.source === 'user');
  const canWrite = storageReady && !isLoading;
  const hydratedRouteIdRef = useRef<string | null>(null);

  const [title, setTitle] = useState('');
  const [materials, setMaterials] = useState(['']);
  const [steps, setSteps] = useState(['']);
  const [attention, setAttention] = useState(['']);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) {
      return;
    }

    if (existing.source !== 'user') {
      router.replace(`/procedure/${existing.id}`);
      return;
    }

    if (hydratedRouteIdRef.current === existing.id) {
      return;
    }

    hydratedRouteIdRef.current = existing.id;
    setTitle(existing.title);
    setMaterials(withAtLeastOne(existing.materials));
    setSteps(withAtLeastOne(existing.steps));
    setAttention(withAtLeastOne(existing.attention));
  }, [existing]);

  const screenTitle = useMemo(
    () => (isEditing ? i18n.t('procedures.formEditTitle') : i18n.t('procedures.formCreateTitle')),
    [isEditing],
  );

  const handleSave = () => {
    if (!canWrite) {
      return;
    }

    const draft: ProcedureDraft = sanitizeDraft({ title, materials, steps, attention });
    if (validateDraft(draft)) {
      setError(i18n.t('procedures.validationTitle'));
      return;
    }

    setError(null);

    if (isEditing && existing) {
      const updated = updateProcedure(existing.id, draft);
      if (updated) {
        router.back();
      }
      return;
    }

    const created = createProcedure(draft);
    if (created) {
      router.replace(`/procedure/${created.id}`);
    }
  };

  if (id) {
    if (isLoading && !existing) {
      return (
        <>
          <Stack.Screen options={{ title: i18n.t('common.loading') }} />
          <View
            style={[styles.centered, { backgroundColor: colors.background }]}
            testID="procedure-form-loading"
          >
            <ThemedText>{i18n.t('common.loading')}</ThemedText>
          </View>
        </>
      );
    }

    if (!existing) {
      return (
        <>
          <Stack.Screen options={{ title: i18n.t('procedures.notFound') }} />
          <View
            style={[styles.centered, { backgroundColor: colors.background }]}
            testID="procedure-not-found"
          >
            <Ionicons name="alert-circle" size={64} color={colors.icon} />
            <ThemedText style={styles.notFoundText}>{i18n.t('procedures.notFound')}</ThemedText>
            <Pressable
              style={[styles.saveButton, { backgroundColor: primaryButtonBackground }]}
              onPress={() => router.replace('/procedures')}
              testID="procedure-not-found-back"
            >
              <ThemedText style={[styles.saveLabel, { color: primaryButtonLabel }]}>
                {i18n.t('common.back')}
              </ThemedText>
            </Pressable>
          </View>
        </>
      );
    }

    if (existing.source !== 'user') {
      return (
        <>
          <Stack.Screen options={{ title: i18n.t('common.loading') }} />
          <View style={[styles.centered, { backgroundColor: colors.background }]}>
            <ThemedText>{i18n.t('common.loading')}</ThemedText>
          </View>
        </>
      );
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: screenTitle }} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          testID="procedure-form"
        >
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <ThemedText type="sectionTitle" style={styles.cardTitle}>
              {i18n.t('procedures.titleLabel')}
            </ThemedText>
            <TextInput
              style={[
                styles.titleInput,
                {
                  color: colors.text,
                  borderColor: colors.lavender,
                  backgroundColor: colors.background,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder={i18n.t('procedures.titlePlaceholder')}
              placeholderTextColor={colors.icon}
              accessibilityLabel={i18n.t('procedures.titleLabel')}
              testID="procedure-form-title"
            />
            {error ? (
              <ThemedText
                style={[styles.error, { color: colors.textDark }]}
                testID="procedure-form-error"
              >
                {error}
              </ThemedText>
            ) : null}
          </View>

          {lastError ? (
            <View
              style={[styles.persistErrorBox, { backgroundColor: colors.coral + '20' }]}
              testID="procedure-form-persist-error"
            >
              <ThemedText style={[styles.persistErrorText, { color: colors.textDark }]}>
                {lastError}
              </ThemedText>
            </View>
          ) : null}

          <ListEditor
            label={i18n.t('procedures.materials')}
            itemName={i18n.t('procedures.materialItem')}
            items={materials}
            onChange={setMaterials}
            testID="procedure-form-materials"
            colors={colors}
          />
          <ListEditor
            label={i18n.t('procedures.steps')}
            itemName={i18n.t('procedures.stepItem')}
            items={steps}
            onChange={setSteps}
            testID="procedure-form-steps"
            colors={colors}
          />
          <ListEditor
            label={i18n.t('procedures.attention')}
            itemName={i18n.t('procedures.attentionItem')}
            items={attention}
            onChange={setAttention}
            testID="procedure-form-attention"
            colors={colors}
          />

          <ThemedText type="caption" style={styles.disclaimer}>
            {i18n.t('procedures.disclaimer')}
          </ThemedText>

          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: primaryButtonBackground, opacity: canWrite ? 1 : 0.5 },
            ]}
            onPress={handleSave}
            disabled={!canWrite}
            testID="procedure-form-save"
          >
            <ThemedText style={[styles.saveLabel, { color: primaryButtonLabel }]}>
              {i18n.t('procedures.save')}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...pastelCardShadow,
  },
  cardTitle: {
    marginBottom: 10,
  },
  titleInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
  },
  error: {
    marginTop: 8,
    fontFamily: 'Quicksand_500Medium',
  },
  persistErrorBox: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  persistErrorText: {
    fontFamily: 'Quicksand_500Medium',
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: 'Quicksand_500Medium',
  },
  removeButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 4,
    minHeight: 44,
  },
  addLabel: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 14,
  },
  disclaimer: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveLabel: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 16,
  },
});
