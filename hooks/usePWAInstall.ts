import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed or running as standalone
    if (typeof window !== 'undefined') {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone 
        || document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);

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

  const installApp = async () => {
    if (Platform.OS !== 'web') return;

    // iOS Detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIOS && !isStandalone) {
      setShowInstructions(true);
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
      setShowInstructions(true);
    }
  };

  return { isInstallable, isStandalone, showInstructions, setShowInstructions, installApp };
}
