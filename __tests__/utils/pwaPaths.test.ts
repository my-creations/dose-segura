import {
  DOSE_SEGURA_BASE_PATH,
  getOfflineSpaShellUrl,
  getServiceWorkerUrl,
  normalizeWebBasePath,
  toWebAssetUrl,
} from '@/utils/pwaPaths';

describe('pwaPaths', () => {
  it('normalizes the GitHub Pages base path', () => {
    expect(normalizeWebBasePath(undefined)).toBe(DOSE_SEGURA_BASE_PATH);
    expect(normalizeWebBasePath('/dose-segura/')).toBe('/dose-segura');
    expect(normalizeWebBasePath('dose-segura')).toBe('/dose-segura');
  });

  it('builds asset, shell, and service worker URLs', () => {
    expect(toWebAssetUrl('/dose-segura', 'meds-full.json')).toBe('/dose-segura/meds-full.json');
    expect(getOfflineSpaShellUrl('/dose-segura')).toBe('/dose-segura/index.html');
    expect(getServiceWorkerUrl('/dose-segura')).toBe('/dose-segura/sw.js');
  });
});
