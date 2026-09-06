import React from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { pastelCardShadow } from '@/constants/Shadows';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/utils/i18n';

export type CalculationFieldProps = {
  question: string;
  hint?: string;
  value: string;
  onChangeText: (text: string) => void;
  unit: string;
  testID: string;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  inputRef?: React.Ref<TextInput>;
  optional?: boolean;
};

export function CalculationField({
  question,
  hint,
  value,
  onChangeText,
  unit,
  testID,
  returnKeyType = 'next',
  onSubmitEditing,
  onFocus,
  inputRef,
  optional = false,
}: CalculationFieldProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isLast = returnKeyType === 'done';

  return (
    <View style={styles.wrapper}>
      <ThemedText type="defaultSemiBold" style={styles.question}>
        {question}
      </ThemedText>
      {hint ? (
        <ThemedText type="caption" style={styles.hint}>
          {hint}
          {optional ? ` · ${i18n.t('calculations.optional')}` : ''}
        </ThemedText>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.lavender,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.textDark }]}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onFocus={onFocus}
          keyboardType="decimal-pad"
          inputMode="decimal"
          returnKeyType={returnKeyType}
          blurOnSubmit={isLast}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="0"
          placeholderTextColor={colors.icon}
          selectionColor={colors.tint}
          accessibilityLabel={question}
          testID={testID}
        />
        <View style={styles.unitSlot} pointerEvents="none">
          <ThemedText type="defaultSemiBold" style={[styles.unit, { color: colors.textDark }]}>
            {unit}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  question: {
    fontSize: 17,
    marginBottom: 4,
  },
  hint: {
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingLeft: 16,
    paddingRight: 12,
    minHeight: 60,
    width: '100%',
    ...pastelCardShadow,
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    fontSize: 24,
    fontFamily: 'Quicksand_600SemiBold',
    paddingVertical: 14,
    paddingRight: 8,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        width: '100%',
      } as Record<string, string>,
    }),
  },
  unitSlot: {
    width: 64,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  unit: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
});
