import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  buildPrecacheManifest,
  createCacheVersion,
  generateServiceWorker,
  getSpaFallbackUrl,
  normalizeBasePath,
  renderServiceWorker,
  shouldPrecacheFile,
  toPrecacheUrl,
} from '../../scripts/generate-sw-precache';

describe('generate-sw-precache helpers', () => {
  it('normalizes base paths for GitHub Pages', () => {
    expect(normalizeBasePath('/dose-segura')).toBe('/dose-segura');
    expect(normalizeBasePath('/dose-segura/')).toBe('/dose-segura');
    expect(normalizeBasePath('dose-segura')).toBe('/dose-segura');
    expect(normalizeBasePath('')).toBe('/dose-segura');
    expect(normalizeBasePath(undefined as unknown as string)).toBe('/dose-segura');
  });

  it('builds precache URLs under the base path', () => {
    expect(toPrecacheUrl('/dose-segura', 'meds-full.json')).toBe('/dose-segura/meds-full.json');
    expect(toPrecacheUrl('/dose-segura/', 'assets/entry.js')).toBe('/dose-segura/assets/entry.js');
    expect(toPrecacheUrl('/dose-segura', '')).toBe('/dose-segura/');
    expect(toPrecacheUrl('/dose-segura', '_expo/static/js/web/[id]-abc.js')).toBe(
      '/dose-segura/_expo/static/js/web/%5Bid%5D-abc.js',
    );
    expect(toPrecacheUrl('/dose-segura', '_expo/static/js/web/+not-found-abc.js')).toBe(
      '/dose-segura/_expo/static/js/web/%2Bnot-found-abc.js',
    );
    expect(getSpaFallbackUrl('/dose-segura')).toBe('/dose-segura/index.html');
  });

  it('selects shell, fonts, icons, catalog, and hashed assets for precache', () => {
    expect(shouldPrecacheFile('index.html')).toBe(true);
    expect(shouldPrecacheFile('404.html')).toBe(true);
    expect(shouldPrecacheFile('procedures.html')).toBe(true);
    expect(shouldPrecacheFile('manifest.json')).toBe(true);
    expect(shouldPrecacheFile('meds-full.json')).toBe(true);
    expect(shouldPrecacheFile('fonts/Quicksand_400Regular.ttf')).toBe(true);
    expect(shouldPrecacheFile('icon-192.png')).toBe(true);
    expect(shouldPrecacheFile('assets/entry-abc123.js')).toBe(true);
    expect(shouldPrecacheFile('assets/libs/chunk.css')).toBe(true);
    expect(shouldPrecacheFile('assets/entry-abc123.js.map')).toBe(false);
    expect(shouldPrecacheFile('sw.js')).toBe(false);
    expect(shouldPrecacheFile('.nojekyll')).toBe(false);
  });

  it('builds a sorted precache manifest from a fake dist tree', () => {
    const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dose-sw-'));
    try {
      fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
      fs.mkdirSync(path.join(distDir, 'fonts'), { recursive: true });
      fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>');
      fs.writeFileSync(path.join(distDir, 'meds-full.json'), '{}');
      fs.writeFileSync(path.join(distDir, 'manifest.json'), '{}');
      fs.writeFileSync(path.join(distDir, 'assets', 'app.js'), 'console.log(1)');
      fs.writeFileSync(path.join(distDir, 'assets', 'app.js.map'), '{}');
      fs.writeFileSync(path.join(distDir, 'fonts', 'Quicksand_400Regular.ttf'), 'font');
      fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
      fs.writeFileSync(path.join(distDir, 'sw.js'), 'old');

      const { urls, contentDigest } = buildPrecacheManifest({ distDir, basePath: '/dose-segura' });

      expect(urls).toContain('/dose-segura/');
      expect(urls).toContain('/dose-segura/index.html');
      expect(urls).toContain('/dose-segura/meds-full.json');
      expect(urls).toContain('/dose-segura/manifest.json');
      expect(urls).toContain('/dose-segura/assets/app.js');
      expect(urls).toContain('/dose-segura/fonts/Quicksand_400Regular.ttf');
      expect(urls).not.toContain('/dose-segura/assets/app.js.map');
      expect(urls).not.toContain('/dose-segura/sw.js');
      expect(urls).not.toContain('/dose-segura/.nojekyll');
      expect([...urls].sort()).toEqual(urls);
      expect(contentDigest).toMatch(/^[a-f0-9]{64}$/);
    } finally {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
  });

  it('writes sw.js with base-path SPA fallback and cache version', () => {
    const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dose-sw-gen-'));
    try {
      fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>');
      fs.writeFileSync(path.join(distDir, 'meds-full.json'), '{}');

      const result = generateServiceWorker({ distDir, basePath: '/dose-segura' });
      const swSource = fs.readFileSync(result.swPath, 'utf8');

      expect(result.precacheUrls).toContain('/dose-segura/meds-full.json');
      expect(swSource).toContain('const BASE_PATH = "/dose-segura"');
      expect(swSource).toContain('const SPA_FALLBACK = "/dose-segura/index.html"');
      expect(swSource).toContain(result.cacheVersion);
      expect(swSource).toContain('skipWaiting');
      expect(swSource).toContain('clients.claim');
      expect(swSource).toContain("event.data.type === 'SKIP_WAITING'");
      expect(fs.existsSync(result.manifestPath)).toBe(true);
    } finally {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
  });

  it('does not overwrite SPA_FALLBACK with arbitrary navigation HTML', () => {
    const swSource = renderServiceWorker({
      basePath: '/dose-segura',
      cacheVersion: 'dose-segura-test',
      precacheUrls: ['/dose-segura/', '/dose-segura/index.html'],
    });

    expect(swSource).toContain('const SPA_FALLBACK = "/dose-segura/index.html"');
    // Offline navigations must always resolve to the precached shell index.
    expect(swSource).toContain('caches.match(SPA_FALLBACK)');
    // Successful navigations must not cache.put into SPA_FALLBACK (route HTML poisoning).
    expect(swSource).not.toMatch(/cache\.put\(\s*SPA_FALLBACK\s*,/);

    // Isolate the navigation fetch handler: offline path must not fall back to the
    // requested deep-route URL (which could be non-index HTML).
    const navHandler = swSource.match(
      /if \(isAppNavigation\(request, url\)\) \{[\s\S]*?return;\n  \}/,
    )?.[0];
    expect(navHandler).toBeTruthy();
    expect(navHandler).not.toMatch(/caches\.match\(\s*request\s*\)/);
    expect(navHandler).toContain('caches.match(SPA_FALLBACK)');
  });

  it('busts cacheVersion when meds-full.json content changes with the same URL list', () => {
    const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dose-sw-bust-'));
    try {
      fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>');
      fs.writeFileSync(path.join(distDir, 'meds-full.json'), '{"v":1}');

      const first = generateServiceWorker({ distDir, basePath: '/dose-segura' });
      fs.writeFileSync(path.join(distDir, 'meds-full.json'), '{"v":2}');
      const second = generateServiceWorker({ distDir, basePath: '/dose-segura' });

      expect(first.precacheUrls).toEqual(second.precacheUrls);
      expect(first.cacheVersion).not.toEqual(second.cacheVersion);
      expect(createCacheVersion(first.precacheUrls, 'aaa')).not.toEqual(
        createCacheVersion(first.precacheUrls, 'bbb'),
      );
    } finally {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
  });
});
