import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Medication } from '@/types/medication';

interface MedicationCardProps {
  medication: Medication;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function MedicationCard({ medication, isFavorite = false, onToggleFavorite }: MedicationCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isWeb = Platform.OS === 'web';

  const FavoriteButton = (
    <Pressable 
      onPress={(e) => {
        e?.stopPropagation?.();
        e?.preventDefault?.();
        onToggleFavorite?.();
      }}
      style={isWeb ? styles.favoriteButtonInline : styles.favoriteButton}
      hitSlop={10}
      accessibilityLabel="Favoritar medicamento"
      accessibilityHint="Alterna este medicamento como favorito"
      testID="favorite-button"
    >
      <Ionicons 
        name={isFavorite ? 'heart' : 'heart-outline'} 
        size={24} 
        color={isFavorite ? colors.rose : colors.icon} 
      />
    </Pressable>
  );

  return (
    <Link href={`/medication/${medication.id}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        accessibilityLabel={`Abrir medicamento ${medication.name}`}
        testID={`medication-card-${medication.id}`}
      >
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.content}>
            <View style={styles.header}>
              <ThemedText style={styles.name}>{medication.name}</ThemedText>
              {isWeb && FavoriteButton}
              {medication.highRisk && (
                <View style={[styles.highRiskBadge, { backgroundColor: colors.coral }]}>
                  <Ionicons name="warning" size={12} color="#fff" />
                  <ThemedText style={styles.highRiskText}>Alto Risco</ThemedText>
                </View>
              )}
            </View>
            
            <View style={styles.classificationContainer}>
              {medication.classification.slice(0, 2).map((cls, index) => (
                <View key={index} style={[styles.classificationBadge, { backgroundColor: colors.lavender }]}>
                  <ThemedText style={[styles.classificationText, { color: colors.textDark }]}>{cls}</ThemedText>
                </View>
              ))}
            </View>
            
            {medication.aliases.length > 0 && (
              <ThemedText type="caption" style={styles.aliases}>
                {medication.aliases.slice(0, 2).join(', ')}
                {medication.aliases.length > 2 && '...'}
              </ThemedText>
            )}
          </View>
          
          {!isWeb && FavoriteButton}
        </View>
      </Pressable>
    </Link>
  );
}

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
    ...Platform.select({
      ios: {
        shadowColor: '#E8A0BF',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 3px 8px rgba(232, 160, 191, 0.12)',
      },
    }),
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
  },
  highRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  highRiskText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Quicksand_600SemiBold',
  },
  classificationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  classificationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  classificationText: {
    fontSize: 12,
    fontFamily: 'Quicksand_500Medium',
  },
  aliases: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  favoriteButton: {
    padding: 8,
    marginRight: -4,
  },
  favoriteButtonInline: {
    padding: 4,
    marginLeft: 4,
  },
});
