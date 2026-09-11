import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getServiceWorkerUrl, normalizeWebBasePath } from '@/utils/pwaPaths';

/** How often long-lived tabs/PWAs re-check for a new service worker. */
export const SERVICE_WORKER_UPDATE_INTERVAL_MS = 45 * 60 * 1000;

/** sessionStorage flag so stale-chunk recovery reloads at most once per tab session. */
export const STALE_CHUNK_RECOVERY_STORAGE_KEY = 'dose-segura:stale-expo-chunk-recovery';

/** Must match the message type posted by dist/sw.js on hashed `_expo/static` 404s. */
export const STALE_EXPO_CHUNK_MESSAGE = 'STALE_EXPO_CHUNK';

let reloadOnceGuard = false;
let suppressControllerChangeReload = false;

function getBasePath() {
  return normalizeWebBasePath(Constants.expoConfig?.experiments?.baseUrl);
}

/** Single-flight reload shared by controllerchange and stale-chunk recovery. */
export function scheduleControlledReload(reload: () => void): boolean {
  if (reloadOnceGuard) {
    return false;
  }
  reloadOnceGuard = true;
  reload();
  return true;
}

/** Test helper — reset module guards between Jest cases. */
export function resetServiceWorkerReloadGuardsForTests(): void {
  reloadOnceGuard = false;
  suppressControllerChangeReload = false;
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
 * Also skips while stale-chunk recovery is unregistering (avoids double reload).
 */
export function createControllerChangeReloader(options: {
  hadController: boolean;
  reload: () => void;
}): () => void {
  return () => {
    if (suppressControllerChangeReload || !options.hadController) {
      return;
    }
    scheduleControlledReload(options.reload);
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

export function isExpoStaticJsUrl(url: string, basePath = getBasePath()): boolean {
  try {
    const parsed = new URL(url, 'https://dose-segura.local');
    const base = normalizeWebBasePath(basePath);
    const path = parsed.pathname;
    const underStatic = path === `${base}/_expo/static` || path.startsWith(`${base}/_expo/static/`);
    return underStatic && /\.js$/i.test(path);
  } catch {
    return false;
  }
}

function hasRecoveredThisSession(storage: Pick<Storage, 'getItem' | 'setItem'> | null): boolean {
  if (!storage) {
    return false;
  }
  try {
    return Boolean(storage.getItem(STALE_CHUNK_RECOVERY_STORAGE_KEY));
  } catch {
    return false;
  }
}

function markRecoveredThisSession(storage: Pick<Storage, 'getItem' | 'setItem'> | null): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(STALE_CHUNK_RECOVERY_STORAGE_KEY, String(Date.now()));
  } catch {
    // Private mode / blocked storage — still attempt a one-shot reload via memory guard.
  }
}

export type StaleChunkRecoveryDeps = {
  reload: () => void;
  online?: boolean;
  sessionStorage?: Pick<Storage, 'getItem' | 'setItem'> | null;
  getRegistrations?: () => Promise<readonly ServiceWorkerRegistration[]>;
  cachesKeys?: () => Promise<string[]>;
  deleteCache?: (key: string) => Promise<boolean>;
};

/**
 * Unregister SW, delete Cache Storage entries, and reload once.
 * Used when an online `_expo/static/*.js` request 404s after a Pages deploy
 * left the installed app on deleted hashed chunks.
 */
export async function recoverFromStaleExpoChunk(deps: StaleChunkRecoveryDeps): Promise<boolean> {
  const online = deps.online ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);
  if (!online) {
    return false;
  }

  const storage =
    deps.sessionStorage === undefined
      ? typeof globalThis !== 'undefined' &&
        typeof (globalThis as { sessionStorage?: Storage }).sessionStorage !== 'undefined'
        ? (globalThis as { sessionStorage: Storage }).sessionStorage
        : null
      : deps.sessionStorage;

  if (hasRecoveredThisSession(storage)) {
    return false;
  }
  markRecoveredThisSession(storage);

  // Prevent controllerchange (from unregister) from scheduling a second reload.
  suppressControllerChangeReload = true;

  try {
    const getRegistrations =
      deps.getRegistrations ??
      (() => {
        const nav = (globalThis as { navigator?: Navigator }).navigator;
        return nav?.serviceWorker ? nav.serviceWorker.getRegistrations() : Promise.resolve([]);
      });
    const registrations = await getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch {
    // Continue — cache purge + reload still help when unregister fails.
  }

  try {
    const cachesKeys =
      deps.cachesKeys ??
      (() => {
        const cacheStorage = (globalThis as { caches?: CacheStorage }).caches;
        return cacheStorage ? cacheStorage.keys() : Promise.resolve([]);
      });
    const deleteCache =
      deps.deleteCache ??
      ((key: string) => {
        const cacheStorage = (globalThis as { caches?: CacheStorage }).caches;
        return cacheStorage ? cacheStorage.delete(key) : Promise.resolve(false);
      });
    const keys = await cachesKeys();
    await Promise.all(keys.map((key) => deleteCache(key)));
  } catch {
    // Continue to reload even if cache purge fails.
  }

  return scheduleControlledReload(deps.reload);
}

function watchForStaleExpoChunkMessages(reload: () => void): void {
  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type !== STALE_EXPO_CHUNK_MESSAGE) {
      return;
    }
    void recoverFromStaleExpoChunk({ reload });
  });
}

/**
 * Capture-phase script/resource errors for `_expo/static/*.js` — covers cases
 * where the SW did not control the request or the client saw the failure first.
 */
export function createStaleExpoChunkErrorHandler(options: {
  reload: () => void;
  basePath?: string;
  online?: boolean;
  recovery?: Omit<StaleChunkRecoveryDeps, 'reload' | 'online'>;
}): (event: Event) => void {
  return (event: Event) => {
    const nav = (globalThis as { navigator?: Navigator }).navigator;
    const online = options.online ?? (nav ? nav.onLine : true);
    if (!online) {
      return;
    }
    const target = event.target;
    if (!target || typeof (target as HTMLScriptElement).src !== 'string') {
      return;
    }
    const src = (target as HTMLScriptElement).src;
    if (!isExpoStaticJsUrl(src, options.basePath ?? getBasePath())) {
      return;
    }
    return recoverFromStaleExpoChunk({
      reload: options.reload,
      online,
      ...options.recovery,
    });
  };
}

/**
 * Register the production static-export service worker (web only).
 * Skips native, SSR, and Expo web dev so local HMR is never intercepted.
 * On update, activates the new worker and reloads once so installed PWAs
 * pick up deploys without closing the app.
 * On online hashed-chunk 404s, purges SW/caches and reloads once.
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
  const reload = () => {
    window.location.reload();
  };
  const onControllerChange = createControllerChangeReloader({
    hadController,
    reload,
  });
  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
  watchForStaleExpoChunkMessages(reload);
  window.addEventListener('error', createStaleExpoChunkErrorHandler({ reload, basePath }), true);

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
