import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { pastelCardShadowStrong } from '@/constants/Shadows';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/utils/i18n';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = i18n.t('home.searchPlaceholder'),
}: SearchBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const showIcon = Platform.OS !== 'web';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.cardBackground, borderColor: colors.lavender },
      ]}
    >
      {showIcon ? (
        <Ionicons name="search" size={20} color={colors.tint} style={styles.icon} />
      ) : null}
      <TextInput
        style={[styles.input, { color: colors.text, backgroundColor: 'transparent' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.icon}
        selectionColor={colors.tint}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        testID="search-input"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    ...pastelCardShadowStrong,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
    paddingVertical: 2,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
});
