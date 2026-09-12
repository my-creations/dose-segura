import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { CalculationField } from '@/components/CalculationField';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { pastelCardShadow } from '@/constants/Shadows';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  CALCULATION_MODES,
  fieldSchemasForMode,
  formatDecimal,
  run,
  type CalculationMode,
} from '@/utils/doseCalculations';
import i18n from '@/utils/i18n';

export default function CalculationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [mode, setMode] = useState<CalculationMode>('dose-by-weight');
  const [values, setValues] = useState<Record<string, string>>({});
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const fields = useMemo(() => fieldSchemasForMode(mode), [mode]);
  const result = useMemo(() => run(mode, values), [mode, values]);

  const handleChangeMode = (next: CalculationMode) => {
    if (next === mode) {
      return;
    }
    setMode(next);
    setValues({});
    setFocusedKey(null);
    Keyboard.dismiss();
  };

  const handleSubmit = (key: string) => {
    const index = fields.findIndex((field) => field.key === key);
    const next = fields[index + 1];
    if (next) {
      inputRefs.current[next.key]?.focus();
      return;
    }
    Keyboard.dismiss();
  };

  const handleSeguinte = () => {
    const currentIndex = focusedKey ? fields.findIndex((field) => field.key === focusedKey) : -1;
    const next =
      fields[currentIndex + 1] ??
      fields.find((field) => !field.optional && !(values[field.key] ?? '').trim());
    if (next) {
      inputRefs.current[next.key]?.focus();
      return;
    }
    Keyboard.dismiss();
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="calculations-screen"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.intro}>
            <View style={[styles.introIcon, { backgroundColor: colors.mint + '55' }]}>
              <Ionicons name="calculator-outline" size={32} color={colors.tint} />
            </View>
            <ThemedText type="caption" style={styles.introText}>
              {i18n.t('calculations.intro')}
            </ThemedText>
          </View>

          <View style={styles.modes} testID="calculation-modes">
            {CALCULATION_MODES.map((item) => {
              const selected = mode === item.id;
              return (
                <Pressable
                  key={item.id}
                  testID={item.testID}
                  onPress={() => handleChangeMode(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.tint + '28' : colors.cardBackground,
                      borderColor: selected ? colors.tint : colors.lavender,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.chipLabel,
                      selected && {
                        color: colors.textDark,
                        fontFamily: 'Quicksand_600SemiBold',
                      },
                    ]}
                  >
                    {i18n.t(item.labelKey)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {fields.map((field, index) => (
            <CalculationField
              key={`${mode}-${field.key}`}
              question={i18n.t(field.questionKey)}
              hint={i18n.t(field.hintKey)}
              unit={i18n.t(field.unitKey)}
              testID={field.testID}
              value={values[field.key] ?? ''}
              onChangeText={(text) =>
                setValues((current) => ({
                  ...current,
                  [field.key]: text,
                }))
              }
              returnKeyType={index === fields.length - 1 ? 'done' : 'next'}
              onSubmitEditing={() => handleSubmit(field.key)}
              onFocus={() => setFocusedKey(field.key)}
              optional={field.optional}
              inputRef={(node) => {
                inputRefs.current[field.key] = node;
              }}
            />
          ))}

          <Pressable
            testID="calculation-next-button"
            onPress={handleSeguinte}
            style={({ pressed }) => [
              styles.nextButton,
              {
                backgroundColor: colorScheme === 'dark' ? colors.tint : colors.sky,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{ color: colorScheme === 'dark' ? colors.background : colors.textDark }}
            >
              {i18n.t('calculations.next')}
            </ThemedText>
          </Pressable>

          {result.ok ? (
            <View
              testID="calculation-result"
              style={[styles.resultCard, { backgroundColor: colors.cardBackground }]}
            >
              <ThemedText type="caption" style={styles.resultLabel}>
                {i18n.t(result.primaryLabelKey)}
              </ThemedText>
              <View style={styles.resultValueRow}>
                <ThemedText
                  testID="calculation-result-value"
                  style={[styles.resultValue, { color: colors.textDark }]}
                >
                  {formatDecimal(result.value)}
                </ThemedText>
                <ThemedText
                  testID="calculation-result-unit"
                  type="subtitle"
                  style={{ color: colors.textDark }}
                >
                  {result.unit}
                </ThemedText>
              </View>
              <ThemedText testID="calculation-result-formula" type="caption" style={styles.formula}>
                {result.formula}
              </ThemedText>
              {result.secondary && result.secondaryLabelKey ? (
                <View style={styles.secondaryResult}>
                  <ThemedText type="caption" style={styles.resultLabel}>
                    {i18n.t(result.secondaryLabelKey)}
                  </ThemedText>
                  <View style={styles.resultValueRow}>
                    <ThemedText
                      testID="calculation-result-volume"
                      style={[styles.resultValue, { color: colors.textDark }]}
                    >
                      {formatDecimal(result.secondary.value)}
                    </ThemedText>
                    <ThemedText type="subtitle" style={{ color: colors.textDark }}>
                      {result.secondary.unit}
                    </ThemedText>
                  </View>
                  <ThemedText type="caption" style={styles.formula}>
                    {result.secondary.formula}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : result.error !== 'empty' ? (
            <View
              testID="calculation-error"
              style={[styles.errorBox, { backgroundColor: colors.coral + '20' }]}
            >
              <Ionicons name="alert-circle-outline" size={20} color={colors.coral} />
              <ThemedText style={[styles.errorText, { color: colors.textDark }]}>
                {i18n.t(`calculations.errors.${result.error}`)}
              </ThemedText>
            </View>
          ) : null}
        </ScrollView>

        <View
          testID="calculation-disclaimer"
          style={[styles.disclaimer, { backgroundColor: colors.coral + '20' }]}
        >
          <Ionicons name="warning" size={20} color={colors.coral} />
          <ThemedText style={[styles.disclaimerText, { color: colors.textDark }]}>
            {i18n.t('calculations.disclaimer')}
          </ThemedText>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  intro: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  introIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  introText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  modes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: 14,
    fontFamily: 'Quicksand_500Medium',
  },
  nextButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 20,
  },
  resultCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    ...pastelCardShadow,
  },
  resultLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 36,
    lineHeight: 42,
    fontFamily: 'Quicksand_700Bold',
  },
  formula: {
    lineHeight: 20,
  },
  secondaryResult: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C5DFF8',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
