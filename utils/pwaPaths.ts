/**
 * Pure helpers for Dose Segura web base-path + offline shell URLs.
 * Kept separate from the SW generator so Jest can cover them without Node fs.
 */

export const DOSE_SEGURA_BASE_PATH = '/dose-segura';

export function normalizeWebBasePath(basePath?: string | null) {
  if (typeof basePath !== 'string' || !basePath.trim()) {
    return DOSE_SEGURA_BASE_PATH;
  }

  let normalized = basePath.trim();
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  return normalized.replace(/\/+$/, '') || DOSE_SEGURA_BASE_PATH;
}

export function toWebAssetUrl(basePath: string | null | undefined, relativePath: string) {
  const base = normalizeWebBasePath(basePath);
  const relative = relativePath.replace(/^\/+/, '').split('\\').join('/');
  if (!relative) {
    return `${base}/`;
  }
  return `${base}/${relative}`;
}

export function getOfflineSpaShellUrl(basePath?: string | null) {
  return toWebAssetUrl(basePath, 'index.html');
}

export function getServiceWorkerUrl(basePath?: string | null) {
  return toWebAssetUrl(basePath, 'sw.js');
}
