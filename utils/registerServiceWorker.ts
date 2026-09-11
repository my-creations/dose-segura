import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getServiceWorkerUrl, normalizeWebBasePath } from '@/utils/pwaPaths';

function getBasePath() {
  return normalizeWebBasePath(Constants.expoConfig?.experiments?.baseUrl);
}

/**
 * Register the production static-export service worker (web only).
 * Skips native, SSR, and Expo web dev so local HMR is never intercepted.
 */
export function registerServiceWorker() {
  if (Platform.OS !== 'web') {
    return;
  }

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  // Metro / expo start — do not attach a production SW.
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return;
  }

  const basePath = getBasePath();
  const swUrl = getServiceWorkerUrl(basePath);

  const register = () => {
    navigator.serviceWorker
      .register(swUrl, { scope: `${basePath}/` })
      .then((registration) => {
        // Pick up new deploys on the next online visit without sticky stale shells.
        registration.update().catch(() => {
          // Ignore transient update check failures (offline, etc.).
        });
      })
      .catch((error) => {
        console.warn('[Dose Segura] Service worker registration failed', error);
      });
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}
