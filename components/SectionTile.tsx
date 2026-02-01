import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors, SECTION_COLORS, SectionKey } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SectionTileProps {
  title: string;
  sectionKey: SectionKey;
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function SectionTile({ title, sectionKey, children, style, testID }: SectionTileProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const sectionColors = SECTION_COLORS[colorScheme ?? 'light'];
  const backgroundColor = sectionColors[sectionKey] || colors.cardBackground;

  return (
    <View style={[styles.container, { backgroundColor }, style]} testID={testID}>
      <View style={styles.header}>
        <ThemedText type="sectionTitle" style={styles.title}>
          {title}
        </ThemedText>
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

// Helper component for displaying simple text content
interface SectionContentProps {
  text?: string;
  items?: string[];
}

export function SectionContent({ text, items }: SectionContentProps) {
  if (text) {
    return <ThemedText style={styles.text}>{text}</ThemedText>;
  }

  if (items && items.length > 0) {
    return (
      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.bullet} />
            <ThemedText style={styles.listText}>{item}</ThemedText>
          </View>
        ))}
      </View>
    );
  }

  return <ThemedText type="caption">Informação não disponível</ThemedText>;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#E8A0BF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 6px rgba(232, 160, 191, 0.1)',
      },
    }),
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  title: {
    opacity: 0.8,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: 8,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
