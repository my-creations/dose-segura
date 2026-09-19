/**
 * Guards the build-time SEO outputs: the HTML tag injector and the generated sitemap.
 * Both are plain CommonJS scripts, required here the same way other script tests do it.
 */
const { metaForFile } = require('../../scripts/generate-route-meta');
const { buildEntries, renderSitemap, absoluteUrl } = require('../../scripts/generate-sitemap');

const medsIndex = require('../../data/meds-index.json');
const seoPages = require('../../constants/seo-pages.json');

const SITE = seoPages.site.siteUrl.replace(/\/$/, '');
const medicationIds = Object.keys(medsIndex.medications);

describe('generate-route-meta metaForFile', () => {
  it('maps static route shells to their own canonical and title', () => {
    expect(metaForFile('privacy.html').path).toBe('/privacy');
    expect(metaForFile('privacy.html').title).toContain('privacidade');
    expect(metaForFile('terms.html').path).toBe('/terms');
    expect(metaForFile('terms.html').title).toContain('Termos');
    expect(metaForFile('procedure/catalog.html').path).toBe('/procedure/catalog');
  });

  it('maps index.html (and the (tabs) duplicate) to the home page', () => {
    expect(metaForFile('index.html').path).toBe('/');
    expect(metaForFile('(tabs)/index.html').path).toBe('/');
    expect(metaForFile('(tabs)/calculations.html').path).toBe('/calculations');
  });

  it('derives per-medication copy from data/meds-index.json', () => {
    const meta = metaForFile('medication/adenosina.html');

    expect(meta.path).toBe('/medication/adenosina');
    expect(meta.title).toBe(`${medsIndex.medications.adenosina.name} | Dose Segura`);
    expect(meta.description).not.toContain('{{');
    expect(meta.noindex).toBeUndefined();
  });

  it('never indexes error or tool screens', () => {
    expect(metaForFile('404.html').noindex).toBe(true);
    expect(metaForFile('+not-found.html').noindex).toBe(true);
    expect(metaForFile('_sitemap.html').noindex).toBe(true);
    expect(metaForFile('favorites.html').noindex).toBe(true);
    expect(metaForFile('settings.html').noindex).toBe(true);
    expect(metaForFile('medication/[id].html').noindex).toBe(true);
  });

  it('falls back to site defaults for shells without registered copy', () => {
    const meta = metaForFile('procedure/builtin-cateterismo-venoso-periferico.html');

    expect(meta.title).toBe(seoPages.site.defaultTitle);
    expect(meta.noindex).toBeUndefined();
    // Must not canonicalise to the homepage, or crawlers read it as a duplicate of `/`.
    expect(meta.path).toBe('/procedure/builtin-cateterismo-venoso-periferico');
  });

  it('canonicalises every shell to its own path, never to the root by accident', () => {
    const files = [
      'index.html',
      'privacy.html',
      'favorites.html',
      'procedure/catalog.html',
      'medication/adenosina.html',
      'procedure/builtin-assistencia-cvc.html',
      '(tabs)/settings.html',
    ];

    for (const file of files) {
      const { path: canonicalPath } = metaForFile(file);
      const expected = `/${file.replace(/^\(tabs\)\//, '').replace(/\.html$/, '')}`;
      expect(canonicalPath).toBe(expected === '/index' ? '/' : expected);
    }
  });

  it('uses forward slashes on nested paths regardless of platform separators', () => {
    expect(metaForFile(['medication', 'adenosina.html'].join('/')).path).toBe(
      '/medication/adenosina',
    );
  });
});

describe('generate-sitemap', () => {
  const entries = buildEntries();
  const locs = entries.map((entry: { loc: string }) => entry.loc);

  it('lists the root once, with a trailing slash', () => {
    expect(absoluteUrl('/')).toBe(`${SITE}/`);
    expect(locs.filter((loc: string) => loc === `${SITE}/`)).toHaveLength(1);
  });

  it('includes indexable static pages and legal pages', () => {
    expect(locs).toContain(`${SITE}/calculations`);
    expect(locs).toContain(`${SITE}/procedures`);
    expect(locs).toContain(`${SITE}/procedure/catalog`);
    expect(locs).toContain(`${SITE}/privacy`);
    expect(locs).toContain(`${SITE}/terms`);
  });

  it('excludes noindex tool screens', () => {
    expect(locs).not.toContain(`${SITE}/favorites`);
    expect(locs).not.toContain(`${SITE}/settings`);
    expect(locs).not.toContain(`${SITE}/procedure/form`);
    expect(locs).not.toContain(`${SITE}/404`);
  });

  it('lists every medication page with the dataset lastmod', () => {
    const medLocs = locs.filter((loc: string) => loc.includes('/medication/'));

    expect(medLocs).toHaveLength(medicationIds.length);
    for (const id of medicationIds) {
      expect(locs).toContain(`${SITE}/medication/${id}`);
    }
    const medEntry = entries.find((entry: { loc: string }) => entry.loc.includes('/medication/'));
    expect(medEntry.lastmod).toBe(medsIndex.lastUpdated);
  });

  it('renders well-formed XML with one url element per entry', () => {
    const xml = renderSitemap(entries);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect((xml.match(/<url>/g) || []).length).toBe(entries.length);
    expect((xml.match(/<\/url>/g) || []).length).toBe(entries.length);
    expect(xml).not.toContain('&');
  });
});
