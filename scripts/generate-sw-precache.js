#!/usr/bin/env node
/**
 * Post-export: generate dist/sw.js with a precache manifest of hashed assets.
 * Invoked from run-web-export.js (after expo export) and again from
 * fix-web-build.js (after assets/node_modules → assets/libs) so paths stay correct.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { collectFiles } = require('./utils/fs-utils');

const DEFAULT_BASE_PATH = '/dose-segura';
const DEFAULT_DIST_DIR = path.join(__dirname, '..', 'dist');

const SKIP_FILE_NAMES = new Set(['.nojekyll', 'sw.js', 'sw-precache-manifest.json']);

/** Normalize experiments.baseUrl-style paths to `/dose-segura` (no trailing slash). */
function normalizeBasePath(basePath) {
  if (typeof basePath !== 'string' || !basePath.trim()) {
    return DEFAULT_BASE_PATH;
  }

  let normalized = basePath.trim();
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  return normalized.replace(/\/+$/, '') || DEFAULT_BASE_PATH;
}

/** Encode one URL path segment (keeps Expo `[id]` / `+not-found` filenames fetchable). */
function encodePathSegment(segment) {
  return encodeURIComponent(segment);
}

/** Join base path + relative dist path into a site URL path. */
function toPrecacheUrl(basePath, relativePath) {
  const base = normalizeBasePath(basePath);
  const relative = String(relativePath || '')
    .split(path.sep)
    .join('/')
    .replace(/^\/+/, '');

  if (!relative || relative === '.') {
    return `${base}/`;
  }

  const encoded = relative.split('/').filter(Boolean).map(encodePathSegment).join('/');

  return `${base}/${encoded}`;
}

/** SPA shell URL used as navigation fallback under the GitHub Pages base path. */
function getSpaFallbackUrl(basePath) {
  return toPrecacheUrl(basePath, 'index.html');
}

/**
 * Whether a file relative to dist should be precached for offline use.
 * Skips source maps, the SW itself, and VCS/GitHub Pages markers.
 */
function shouldPrecacheFile(relativePath) {
  const normalized = String(relativePath || '')
    .split(path.sep)
    .join('/');

  if (!normalized || normalized.endsWith('/')) {
    return false;
  }

  const baseName = normalized.split('/').pop();
  if (SKIP_FILE_NAMES.has(baseName)) {
    return false;
  }

  if (normalized.endsWith('.map')) {
    return false;
  }

  // Always keep shell, PWA chrome, fonts, icons, med catalog, and bundled assets.
  if (
    normalized === 'index.html' ||
    normalized === '404.html' ||
    normalized === 'manifest.json' ||
    normalized === 'meds-full.json' ||
    normalized === 'robots.txt' ||
    /\.(html|png|jpg|jpeg|webp|svg|ico|ttf|woff2?|css|js|json)$/i.test(normalized) ||
    normalized.startsWith('assets/') ||
    normalized.startsWith('fonts/')
  ) {
    return true;
  }

  return false;
}

/**
 * Build absolute URL paths to precache from a dist directory listing.
 * Always includes the SPA index URL even if only discovered as `/`.
 * @param {{ distDir: string, basePath?: string }} [options]
 * @returns {{ urls: string[], contentDigest: string }}
 */
function buildPrecacheManifest({ distDir, basePath = DEFAULT_BASE_PATH } = {}) {
  if (!distDir || !fs.existsSync(distDir)) {
    throw new Error(`dist directory not found: ${distDir || '(empty)'}`);
  }

  const base = normalizeBasePath(basePath);
  const urls = new Set();
  const contentHash = crypto.createHash('sha256');

  urls.add(toPrecacheUrl(base, 'index.html'));
  urls.add(`${base}/`);

  for (const absolutePath of collectFiles(distDir)) {
    const relativePath = path.relative(distDir, absolutePath);
    if (!shouldPrecacheFile(relativePath)) {
      continue;
    }
    urls.add(toPrecacheUrl(base, relativePath));
    // Fingerprint file bytes so unhashed payloads (meds-full.json, HTML shells)
    // bust CACHE_VERSION even when the URL list is unchanged.
    const normalized = relativePath.split(path.sep).join('/');
    contentHash.update(normalized);
    contentHash.update('\0');
    contentHash.update(fs.readFileSync(absolutePath));
    contentHash.update('\0');
  }

  return {
    urls: [...urls].sort((a, b) => a.localeCompare(b)),
    contentDigest: contentHash.digest('hex'),
  };
}

function createCacheVersion(urls, contentDigest = '') {
  const hash = crypto
    .createHash('sha256')
    .update(urls.join('\n'))
    .update('\n')
    .update(contentDigest)
    .digest('hex')
    .slice(0, 12);
  return `dose-segura-${hash}`;
}

function encodePathnameSegments(pathname) {
  return String(pathname || '')
    .split('/')
    .map((segment) => {
      if (!segment) {
        return segment;
      }
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join('/');
}

/** True for Expo hashed bundles under `/_expo/static/` (lazy route chunks, etc.). */
function isExpoStaticAssetPath(pathname, basePath = DEFAULT_BASE_PATH) {
  const base = normalizeBasePath(basePath);
  const path = String(pathname || '');
  return path === `${base}/_expo/static` || path.startsWith(`${base}/_expo/static/`);
}

function isExpoStaticJsPath(pathname, basePath = DEFAULT_BASE_PATH) {
  return isExpoStaticAssetPath(pathname, basePath) && /\.js$/i.test(String(pathname || ''));
}

function renderServiceWorker({ basePath, cacheVersion, precacheUrls }) {
  const base = normalizeBasePath(basePath);
  const fallbackUrl = getSpaFallbackUrl(base);
  const urlsLiteral = JSON.stringify(precacheUrls, null, 2);

  return `/* Generated by scripts/generate-sw-precache.js — do not edit by hand. */
/* eslint-disable no-restricted-globals */
const CACHE_VERSION = ${JSON.stringify(cacheVersion)};
const BASE_PATH = ${JSON.stringify(base)};
const SPA_FALLBACK = ${JSON.stringify(fallbackUrl)};
const PRECACHE_URLS = ${urlsLiteral};
const STALE_EXPO_CHUNK_MESSAGE = 'STALE_EXPO_CHUNK';

let staleChunkRecoveryNotified = false;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(url);
          } catch (error) {
            console.warn('[Dose Segura SW] precache failed', url, error);
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

// Client can nudge activation if a worker is still waiting (belt-and-suspenders
// alongside skipWaiting() during install).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isAppNavigation(request, url) {
  if (request.mode === 'navigate') {
    return true;
  }
  return (
    request.method === 'GET' &&
    request.headers.get('accept') &&
    request.headers.get('accept').includes('text/html') &&
    (url.pathname === BASE_PATH || url.pathname.startsWith(BASE_PATH + '/'))
  );
}

/** Encode each path segment so Expo \`[id]\` / \`+not-found\` filenames match GitHub Pages. */
function encodePathnameSegments(pathname) {
  return String(pathname || '')
    .split('/')
    .map((segment) => {
      if (!segment) {
        return segment;
      }
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join('/');
}

function toEncodedAssetUrl(url) {
  const encodedPathname = encodePathnameSegments(url.pathname);
  return url.origin + encodedPathname + url.search;
}

function isExpoStaticAsset(url) {
  return (
    url.pathname === BASE_PATH + '/_expo/static' ||
    url.pathname.startsWith(BASE_PATH + '/_expo/static/')
  );
}

function isExpoStaticJs(url) {
  return isExpoStaticAsset(url) && /\\.js$/i.test(url.pathname);
}

async function matchCachedAsset(request, url) {
  const direct = await caches.match(request);
  if (direct) {
    return direct;
  }

  const encodedUrl = toEncodedAssetUrl(url);
  if (encodedUrl !== request.url) {
    const encoded = await caches.match(encodedUrl);
    if (encoded) {
      return encoded;
    }
  }

  // Some browsers expose decoded \`[id]\` in request.url while precache used %5Bid%5D.
  if (url.pathname.includes('%')) {
    try {
      const decodedPath = decodeURIComponent(url.pathname);
      if (decodedPath !== url.pathname) {
        const decodedUrl = url.origin + decodedPath + url.search;
        const decoded = await caches.match(decodedUrl);
        if (decoded) {
          return decoded;
        }
      }
    } catch {
      // ignore malformed percent-encoding
    }
  }

  return undefined;
}

async function notifyStaleExpoChunk(assetUrl) {
  if (staleChunkRecoveryNotified) {
    return;
  }
  staleChunkRecoveryNotified = true;
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  await Promise.all(
    clients.map((client) =>
      client.postMessage({ type: STALE_EXPO_CHUNK_MESSAGE, url: assetUrl }),
    ),
  );
}

async function fetchAssetFromNetwork(request, url) {
  const encodedUrl = toEncodedAssetUrl(url);
  // Prefer percent-encoded segments for Expo static files (GitHub Pages + [id] filenames).
  const candidates = [];
  if (isExpoStaticAsset(url) && encodedUrl !== request.url) {
    candidates.push(encodedUrl);
  }
  candidates.push(request);

  let networkResponse;
  let lastError;
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);
      networkResponse = response;
      if (response && response.ok) {
        break;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (!networkResponse) {
    throw lastError || new Error('[Dose Segura SW] network fetch failed');
  }

  if (networkResponse.ok) {
    const cache = await caches.open(CACHE_VERSION);
    const cacheKey = isExpoStaticAsset(url) ? encodedUrl : request;
    cache.put(cacheKey, networkResponse.clone());
  } else if (networkResponse.status === 404 && isExpoStaticJs(url)) {
    // Online deploy moved hashed chunks; do not keep clients on a broken graph.
    await notifyStaleExpoChunk(url.href);
  }

  return networkResponse;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (!(url.pathname === BASE_PATH || url.pathname.startsWith(BASE_PATH + '/'))) {
    return;
  }

  if (isAppNavigation(request, url)) {
    event.respondWith(
      (async () => {
        try {
          // Network-first for navigations. Never write arbitrary route HTML into
          // SPA_FALLBACK — deep Expo static routes can return different shells
          // than /index.html and would poison offline fallback.
          return await fetch(request);
        } catch (error) {
          // Always serve the precached SPA shell for same-origin app navigations.
          const cached =
            (await caches.match(SPA_FALLBACK)) ||
            (await caches.match(BASE_PATH + '/')) ||
            (await caches.match(BASE_PATH + '/index.html'));
          if (cached) {
            return cached;
          }
          throw error;
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await matchCachedAsset(request, url);
      if (cached) {
        return cached;
      }

      try {
        return await fetchAssetFromNetwork(request, url);
      } catch (error) {
        const fallbackCached = await matchCachedAsset(request, url);
        if (fallbackCached) {
          return fallbackCached;
        }
        throw error;
      }
    })(),
  );
});
`;
}

/**
 * @param {{ distDir?: string, basePath?: string }} [options]
 */
function generateServiceWorker({ distDir = DEFAULT_DIST_DIR, basePath = DEFAULT_BASE_PATH } = {}) {
  const { urls: precacheUrls, contentDigest } = buildPrecacheManifest({ distDir, basePath });
  const cacheVersion = createCacheVersion(precacheUrls, contentDigest);
  const swSource = renderServiceWorker({ basePath, cacheVersion, precacheUrls });
  const swPath = path.join(distDir, 'sw.js');
  const manifestPath = path.join(distDir, 'sw-precache-manifest.json');

  fs.writeFileSync(swPath, swSource, 'utf8');
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify({ basePath: normalizeBasePath(basePath), cacheVersion, urls: precacheUrls }, null, 2)}\n`,
    'utf8',
  );

  console.log(
    `🛰️  Generated service worker (${precacheUrls.length} precache URLs, cache ${cacheVersion})`,
  );

  return { swPath, manifestPath, cacheVersion, precacheUrls };
}

module.exports = {
  DEFAULT_BASE_PATH,
  normalizeBasePath,
  encodePathSegment,
  encodePathnameSegments,
  toPrecacheUrl,
  getSpaFallbackUrl,
  shouldPrecacheFile,
  buildPrecacheManifest,
  createCacheVersion,
  isExpoStaticAssetPath,
  isExpoStaticJsPath,
  renderServiceWorker,
  generateServiceWorker,
};

if (require.main === module) {
  try {
    generateServiceWorker();
  } catch (error) {
    console.error('Failed to generate service worker:', error.message);
    process.exit(1);
  }
}
