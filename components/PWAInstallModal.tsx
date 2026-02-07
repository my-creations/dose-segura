import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/utils/i18n';

interface PWAInstallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PWAInstallModal({ visible, onClose }: PWAInstallModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const steps = [
    {
      icon: 'share-outline' as const,
      text: i18n.t('settings.install.steps.share'),
    },
    {
      icon: 'add-circle-outline' as const,
      text: i18n.t('settings.install.steps.add'),
    },
    {
      icon: 'checkmark-circle-outline' as const,
      text: i18n.t('settings.install.steps.confirm'),
    },
  ];

  const description = i18n.t('settings.install.iosInstructions').split('\n')[0];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView} testID="pwa-install-modal">
        <View style={[styles.modalView, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <ThemedText style={styles.modalTitle}>
              {i18n.t('settings.install.iosTitle')}
            </ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton} testID="close-modal-button">
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.content}>
            <ThemedText style={styles.description} testID="pwa-install-description">
              {description}
            </ThemedText>

            <View style={styles.stepsContainer}>
              {steps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.lavender }]}>
                    <Ionicons name={step.icon} size={20} color={colors.tint} />
                  </View>
                  <ThemedText style={styles.stepText}>{step.text}</ThemedText>
                </View>
              ))}
            </View>
          </ScrollView>

          <Pressable
            testID="accept-instructions-button"
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={onClose}
          >
            <ThemedText style={[styles.actionButtonText, { color: colors.cardBackground }]}>
              {i18n.t('settings.install.dismiss')}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalView: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    opacity: 0.8,
  },
  stepsContainer: {
    gap: 20,
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Quicksand_500Medium',
  },
  actionButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
  },
});
