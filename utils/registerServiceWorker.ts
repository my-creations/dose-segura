import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getServiceWorkerUrl, normalizeWebBasePath } from '@/utils/pwaPaths';

/** How often long-lived tabs/PWAs re-check for a new service worker. */
export const SERVICE_WORKER_UPDATE_INTERVAL_MS = 45 * 60 * 1000;

function getBasePath() {
  return normalizeWebBasePath(Constants.expoConfig?.experiments?.baseUrl);
}

/** Ask a waiting worker to activate immediately (pairs with SW message listener). */
export function promptWaitingWorkerToActivate(
  registration: Pick<ServiceWorkerRegistration, 'waiting'>,
): void {
  const waiting = registration.waiting;
  if (!waiting) {
    return;
  }
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Classic controllerchange → reload-once handler.
 * Skips reload when this page never had a controller (first SW install)
 * so the initial visit is not double-loaded.
 */
export function createControllerChangeReloader(options: {
  hadController: boolean;
  reload: () => void;
}): () => void {
  let refreshing = false;
  return () => {
    if (!options.hadController || refreshing) {
      return;
    }
    refreshing = true;
    options.reload();
  };
}

/**
 * When a new worker finishes installing and is waiting, nudge it to activate.
 * Live SW already calls skipWaiting() on install; this covers residual waiting cases.
 */
export function watchRegistrationForWaitingWorker(registration: ServiceWorkerRegistration): void {
  promptWaitingWorkerToActivate(registration);

  registration.addEventListener('updatefound', () => {
    const installing = registration.installing;
    if (!installing) {
      return;
    }
    installing.addEventListener('statechange', () => {
      if (installing.state === 'installed') {
        promptWaitingWorkerToActivate(registration);
      }
    });
  });
}

function scheduleRegistrationUpdateChecks(registration: ServiceWorkerRegistration): void {
  const checkForUpdate = () => {
    registration.update().catch(() => {
      // Ignore transient update check failures (offline, etc.).
    });
  };

  // Immediate check on register (existing behavior).
  checkForUpdate();

  window.setInterval(checkForUpdate, SERVICE_WORKER_UPDATE_INTERVAL_MS);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdate();
    }
  });

  window.addEventListener('focus', checkForUpdate);
}

/**
 * Register the production static-export service worker (web only).
 * Skips native, SSR, and Expo web dev so local HMR is never intercepted.
 * On update, activates the new worker and reloads once so installed PWAs
 * pick up deploys without closing the app.
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
  const hadController = Boolean(navigator.serviceWorker.controller);
  const onControllerChange = createControllerChangeReloader({
    hadController,
    reload: () => {
      window.location.reload();
    },
  });
  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

  const register = () => {
    navigator.serviceWorker
      .register(swUrl, { scope: `${basePath}/` })
      .then((registration) => {
        watchRegistrationForWaitingWorker(registration);
        scheduleRegistrationUpdateChecks(registration);
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
