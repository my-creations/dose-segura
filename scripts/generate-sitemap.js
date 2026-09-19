#!/usr/bin/env node
/**
 * Generate dist/sitemap.xml from the shared SEO registry.
 *
 * Replaces the previously hand-maintained public/sitemap.xml, which listed app-internal
 * screens (`/favorites`, `/settings`) and omitted the actual content (`/terms`, the 120
 * medication pages). Entries match what `generate-route-meta.js` gives a real canonical URL.
 *
 * `/medication/<id>` pages are listed because `generateStaticParams` in the medication route
 * emits a real HTML file per medication, so each URL answers 200 on GitHub Pages. Procedure
 * detail pages are intentionally omitted: their titles are not available to the build (they
 * live in TS), so they would all share the site default title and read as duplicates.
 *
 * Runs from fix-web-build.js after public/ has been copied into dist/.
 */

const fs = require('node:fs');
const path = require('node:path');

const seoPages = require('../constants/seo-pages.json');
const medsIndex = require('../data/meds-index.json');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const SITE_URL = seoPages.site.siteUrl.replace(/\/$/, '');

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Absolute URL for a route path; the root keeps its trailing slash. */
function absoluteUrl(routePath) {
  const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return `${SITE_URL}${normalized}`;
}

function buildEntries() {
  const entries = [];

  for (const page of Object.values(seoPages.pages)) {
    if (page.noindex) {
      continue;
    }
    entries.push({ loc: absoluteUrl(page.path) });
  }

  const lastmod = medsIndex.lastUpdated;
  for (const id of Object.keys(medsIndex.medications).sort()) {
    entries.push({
      loc: absoluteUrl(`/medication/${id}`),
      lastmod,
    });
  }

  return entries;
}

function renderSitemap(entries) {
  const urls = entries
    .map(({ loc, lastmod }) => {
      const lastmodTag = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : '';
      return `  <url><loc>${escapeXml(loc)}</loc>${lastmodTag}</url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function generateSitemap({ distDir = DIST_DIR, quiet = false } = {}) {
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist directory not found: ${distDir}`);
  }

  const entries = buildEntries();
  const target = path.join(distDir, 'sitemap.xml');
  fs.writeFileSync(target, renderSitemap(entries), 'utf8');

  if (!quiet) {
    console.log(`🗺️  Sitemap written with ${entries.length} URLs`);
  }
  return entries;
}

if (require.main === module) {
  try {
    generateSitemap();
  } catch (error) {
    console.error('Error generating sitemap:', error.message);
    process.exit(1);
  }
}

module.exports = { generateSitemap, buildEntries, renderSitemap, absoluteUrl };
