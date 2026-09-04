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
  calculateDoseByWeight,
  calculateMgPerKg,
  calculateVolumeToDraw,
  formatDecimal,
  type CalculationMode,
  type DoseCalculationResult,
} from '@/utils/doseCalculations';
import i18n from '@/utils/i18n';

type FieldConfig = {
  key: string;
  question: string;
  hint: string;
  unit: string;
  testID: string;
  optional?: boolean;
};

const MODES: { id: CalculationMode; labelKey: string; testID: string }[] = [
  {
    id: 'dose-by-weight',
    labelKey: 'calculations.modes.doseByWeight',
    testID: 'calculation-mode-dose-by-weight',
  },
  {
    id: 'volume',
    labelKey: 'calculations.modes.volume',
    testID: 'calculation-mode-volume',
  },
  {
    id: 'mg-per-kg',
    labelKey: 'calculations.modes.mgPerKg',
    testID: 'calculation-mode-mg-per-kg',
  },
];

function fieldsForMode(mode: CalculationMode): FieldConfig[] {
  if (mode === 'volume') {
    return [
      {
        key: 'prescribedDose',
        question: i18n.t('calculations.volume.prescribedDoseQuestion'),
        hint: i18n.t('calculations.volume.prescribedDoseHint'),
        unit: i18n.t('calculations.units.mg'),
        testID: 'calculation-input-prescribed-dose',
      },
      {
        key: 'concentration',
        question: i18n.t('calculations.volume.concentrationQuestion'),
        hint: i18n.t('calculations.volume.concentrationHint'),
        unit: i18n.t('calculations.units.mgPerMl'),
        testID: 'calculation-input-concentration',
      },
    ];
  }

  if (mode === 'mg-per-kg') {
    return [
      {
        key: 'dosePerKg',
        question: i18n.t('calculations.mgPerKg.dosePerKgQuestion'),
        hint: i18n.t('calculations.mgPerKg.dosePerKgHint'),
        unit: i18n.t('calculations.units.mgPerKg'),
        testID: 'calculation-input-dose-per-kg',
      },
      {
        key: 'patientWeight',
        question: i18n.t('calculations.mgPerKg.patientWeightQuestion'),
        hint: i18n.t('calculations.mgPerKg.patientWeightHint'),
        unit: i18n.t('calculations.units.kg'),
        testID: 'calculation-input-patient-weight',
      },
      {
        key: 'concentration',
        question: i18n.t('calculations.mgPerKg.concentrationQuestion'),
        hint: i18n.t('calculations.mgPerKg.concentrationHint'),
        unit: i18n.t('calculations.units.mgPerMl'),
        testID: 'calculation-input-concentration',
        optional: true,
      },
    ];
  }

  return [
    {
      key: 'doseRef',
      question: i18n.t('calculations.doseByWeight.doseRefQuestion'),
      hint: i18n.t('calculations.doseByWeight.doseRefHint'),
      unit: i18n.t('calculations.units.mg'),
      testID: 'calculation-input-dose-ref',
    },
    {
      key: 'weightRef',
      question: i18n.t('calculations.doseByWeight.weightRefQuestion'),
      hint: i18n.t('calculations.doseByWeight.weightRefHint'),
      unit: i18n.t('calculations.units.kg'),
      testID: 'calculation-input-weight-ref',
    },
    {
      key: 'patientWeight',
      question: i18n.t('calculations.doseByWeight.patientWeightQuestion'),
      hint: i18n.t('calculations.doseByWeight.patientWeightHint'),
      unit: i18n.t('calculations.units.kg'),
      testID: 'calculation-input-patient-weight',
    },
  ];
}

function compute(mode: CalculationMode, values: Record<string, string>): DoseCalculationResult {
  if (mode === 'volume') {
    return calculateVolumeToDraw({
      prescribedDose: values.prescribedDose ?? '',
      concentration: values.concentration ?? '',
    });
  }
  if (mode === 'mg-per-kg') {
    return calculateMgPerKg({
      dosePerKg: values.dosePerKg ?? '',
      patientWeight: values.patientWeight ?? '',
      concentration: values.concentration ?? '',
    });
  }
  return calculateDoseByWeight({
    doseRef: values.doseRef ?? '',
    weightRef: values.weightRef ?? '',
    patientWeight: values.patientWeight ?? '',
  });
}

function resultLabelForMode(mode: CalculationMode): string {
  if (mode === 'volume') {
    return i18n.t('calculations.volume.resultLabel');
  }
  if (mode === 'mg-per-kg') {
    return i18n.t('calculations.mgPerKg.resultLabel');
  }
  return i18n.t('calculations.doseByWeight.resultLabel');
}

export default function CalculationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [mode, setMode] = useState<CalculationMode>('dose-by-weight');
  const [values, setValues] = useState<Record<string, string>>({});
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const fields = useMemo(() => fieldsForMode(mode), [mode]);
  const result = useMemo(() => compute(mode, values), [mode, values]);

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
              <Ionicons name="pulse-outline" size={32} color={colors.tint} />
            </View>
            <ThemedText type="caption" style={styles.introText}>
              {i18n.t('calculations.intro')}
            </ThemedText>
          </View>

          <View style={styles.modes} testID="calculation-modes">
            {MODES.map((item) => {
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
              question={field.question}
              hint={field.hint}
              unit={field.unit}
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
                {resultLabelForMode(mode)}
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
              {result.secondary ? (
                <View style={styles.secondaryResult}>
                  <ThemedText type="caption" style={styles.resultLabel}>
                    {i18n.t('calculations.mgPerKg.volumeLabel')}
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
