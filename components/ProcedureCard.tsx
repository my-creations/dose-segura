import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { pastelCardShadowStrong } from '@/constants/Shadows';
import { useColorScheme } from '@/hooks/useColorScheme';
import { isCatalogOrigin } from '@/procedures/procedures';
import type { Procedure } from '@/types/procedure';
import i18n from '@/utils/i18n';

interface ProcedureCardProps {
  procedure: Procedure;
}

function ProcedureCardComponent({ procedure }: ProcedureCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const showCatalogBadge = isCatalogOrigin(procedure);
  const [pressed, setPressed] = React.useState(false);
  const badgeBackground = showCatalogBadge ? colors.lavender : colors.mint;
  const badgeLabel = showCatalogBadge
    ? i18n.t('procedures.builtinBadge')
    : i18n.t('procedures.userBadge');

  return (
    <Link href={`/procedure/${procedure.id}`} asChild>
      <Pressable
        // Link + asChild merges styles with an object spread (Radix Slot), so this child needs a
        // flat style object: a style function becomes `{}` and is silently dropped on web.
        // Pressed feedback therefore comes from state instead of a style callback.
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={StyleSheet.flatten([styles.container, pressed && styles.pressed])}
        accessibilityLabel={i18n.t('accessibility.openProcedure', { name: procedure.title })}
        testID={`procedure-card-${procedure.id}`}
      >
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.content}>
            <View style={styles.header}>
              <ThemedText style={styles.name}>{procedure.title}</ThemedText>
              <View style={[styles.badge, { backgroundColor: badgeBackground }]}>
                <ThemedText style={[styles.badgeText, { color: colors.textDark }]}>
                  {badgeLabel}
                </ThemedText>
              </View>
            </View>
            <ThemedText type="caption">
              {i18n.t('procedures.cardSummary', {
                materials: procedure.materials.length,
                steps: procedure.steps.length,
              })}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export const ProcedureCard = React.memo(ProcedureCardComponent);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    ...pastelCardShadowStrong,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  name: {
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
});
