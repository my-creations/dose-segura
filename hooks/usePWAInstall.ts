import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { keyValueStore } from '@/storage/keyValueStore';
import i18n from '@/utils/i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
}

declare global {
  interface Window {
    /** Stashed by the inline script in `app/+html.tsx` before React mounts. */
    __doseSeguraInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

/** Set once the user dismisses the first-run install banner; we never ask again. */
export const PWA_INSTALL_BANNER_KEY = '@dose_segura_pwa_install_banner_v1';
const DISMISSED_VALUE = 'dismissed';

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [hasReadBannerPreference, setHasReadBannerPreference] = useState(false);

  useEffect(() => {
    // Check if already installed or running as standalone
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');

      setIsStandalone(isStandaloneMode);

      // Chrome may have fired the event before this effect ran; the inline script in
      // +html.tsx stashes it so the prompt is not lost.
      const earlyPrompt = window.__doseSeguraInstallPrompt;
      if (earlyPrompt) {
        setDeferredPrompt(earlyPrompt);
        setIsInstallable(true);
      }

      const handleBeforeInstallPrompt = (event: Event) => {
        // Prevent the mini-infobar from appearing on mobile
        event.preventDefault();
        // Stash the event so it can be triggered later.
        setDeferredPrompt(event as BeforeInstallPromptEvent);
        // Update UI notify the user they can install the PWA
        setIsInstallable(true);
      };

      const handleAppInstalled = () => {
        setIsStandalone(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        console.log('PWA was installed');
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  // Read the dismissal flag before deciding whether to show the banner, so it never flashes
  // for someone who already dismissed it. Storage can throw (private mode), hence the guard.
  useEffect(() => {
    let active = true;

    keyValueStore
      .getItem(PWA_INSTALL_BANNER_KEY)
      .then((value) => {
        if (active) {
          setIsBannerDismissed(value === DISMISSED_VALUE);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setHasReadBannerPreference(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const dismissBanner = useCallback(async () => {
    setIsBannerDismissed(true);
    try {
      await keyValueStore.setItem(PWA_INSTALL_BANNER_KEY, DISMISSED_VALUE);
    } catch {
      // Persisting is best-effort: the banner still hides for this session.
    }
  }, []);

  const installApp = async () => {
    if (Platform.OS !== 'web') return;

    if (isIOSDevice()) {
      if (!isStandalone) {
        setShowInstructions(true);
      }
      return;
    }

    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);

      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else if (!isStandalone) {
      // Fallback for browsers that don't support beforeinstallprompt or if it hasn't fired yet
      Alert.alert(i18n.t('settings.install.error'));
    }
  };

  // Chromium signals installability with `beforeinstallprompt`; iOS Safari never fires it and
  // needs the "Add to Home Screen" walkthrough instead. Desktop browsers that support neither
  // (Firefox, desktop Safari) get no banner rather than a dead end.
  const canInstall = isInstallable || (Platform.OS === 'web' && isIOSDevice() && !isStandalone);

  const isBannerVisible =
    Platform.OS === 'web' &&
    hasReadBannerPreference &&
    !isStandalone &&
    !isBannerDismissed &&
    canInstall;

  return {
    isInstallable,
    isStandalone,
    showInstructions,
    setShowInstructions,
    installApp,
    isBannerVisible,
    dismissBanner,
  };
}
