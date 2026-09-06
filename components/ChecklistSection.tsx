import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { pastelCardShadow } from '@/constants/Shadows';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ChecklistSectionProps {
  title: string;
  items: string[];
  numbered?: boolean;
  accent?: 'mint' | 'sky' | 'peach';
  testID?: string;
}

export function ChecklistSection({
  title,
  items,
  numbered = false,
  accent = 'mint',
  testID,
}: ChecklistSectionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors[accent] }]} testID={testID}>
      <ThemedText type="sectionTitle" style={styles.title}>
        {title}
      </ThemedText>
      <View style={styles.list}>
        {items.map((item, index) => (
          <View
            key={`${index}-${item}`}
            style={styles.row}
            testID={testID ? `${testID}-item-${index}` : undefined}
          >
            {numbered ? (
              <ThemedText style={[styles.number, { color: colors.textDark }]}>
                {index + 1}.
              </ThemedText>
            ) : (
              <View style={[styles.bullet, { backgroundColor: colors.textDark }]} />
            )}
            <ThemedText style={styles.text}>{item}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: 12,
    ...pastelCardShadow,
  },
  title: {
    marginBottom: 8,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  number: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 14,
    minWidth: 22,
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Quicksand_500Medium',
  },
});
