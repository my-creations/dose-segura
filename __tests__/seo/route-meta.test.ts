import fs from 'node:fs';
import path from 'node:path';

import { SEO, PAGES, getCanonicalUrl, medicationPageMeta } from '@/constants/Seo';

const APP_DIR = path.join(__dirname, '..', '..', 'app');
const EXEMPT = new Set(['_layout.tsx', '_layout.native.tsx', '+html.tsx']);

function routeFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routeFiles(full, acc);
    } else if (entry.name.endsWith('.tsx') && !EXEMPT.has(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Every routable screen must render <PageMeta>.
 *
 * The exported HTML gets its tags from `scripts/generate-route-meta.js` at build time, but the
 * runtime component is what keeps them correct during in-app navigation. A route that forgets
 * it silently inherits the previous page's title in the browser tab.
 */
describe('route metadata coverage', () => {
  it('every route renders <PageMeta>', () => {
    const missing = routeFiles(APP_DIR)
      .filter((file) => !fs.readFileSync(file, 'utf8').includes('<PageMeta'))
      .map((file) => path.relative(path.join(__dirname, '..', '..'), file));

    expect(missing).toEqual([]);
  });
});

describe('SEO registry', () => {
  it('gives every static page a unique canonical URL and title', () => {
    const pages = Object.values(PAGES);
    const canonicals = pages.map((page) => getCanonicalUrl(page.path));
    const titles = pages.map((page) => page.title);

    expect(new Set(canonicals).size).toBe(canonicals.length);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('root canonical keeps its trailing slash and matches the sitemap form', () => {
    expect(getCanonicalUrl('/')).toBe(`${SEO.siteUrl}/`);
    expect(getCanonicalUrl('/privacy')).toBe(`${SEO.siteUrl}/privacy`);
  });

  it('marks tool screens as noindex and content pages as indexable', () => {
    expect(PAGES.favorites.noindex).toBe(true);
    expect(PAGES.settings.noindex).toBe(true);
    expect(PAGES.procedureForm.noindex).toBe(true);
    expect(PAGES.notFound.noindex).toBe(true);

    expect(PAGES.privacy.noindex).toBeUndefined();
    expect(PAGES.terms.noindex).toBeUndefined();
    expect(PAGES.home.noindex).toBeUndefined();
    expect(PAGES.calculations.noindex).toBeUndefined();
    expect(PAGES.procedures.noindex).toBeUndefined();
    expect(PAGES.procedureCatalog.noindex).toBeUndefined();
  });

  it('builds medication copy from the summary', () => {
    const meta = medicationPageMeta({
      id: 'adenosina',
      name: 'Adenosina',
      classification: ['Antiarrítmico'],
      highRisk: true,
    });

    expect(meta.title).toBe('Adenosina | Dose Segura');
    expect(meta.path).toBe('/medication/adenosina');
    expect(meta.description).toContain('Adenosina');
    expect(meta.description).toContain('(Antiarrítmico)');
    expect(meta.description).toContain('alto risco');
    expect(meta.description).not.toContain('{{');
  });

  it('leaves no unfilled placeholders in any registered copy', () => {
    for (const page of [
      ...Object.values(PAGES),
      medicationPageMeta({
        id: 'x',
        name: 'X',
        classification: ['Y'],
        highRisk: false,
      }),
    ]) {
      expect(`${page.title}${page.description}${page.path}`).not.toContain('{{');
    }
  });
});
