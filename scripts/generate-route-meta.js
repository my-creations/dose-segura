#!/usr/bin/env node
/**
 * Inject per-route SEO tags into the exported HTML shells.
 *
 * Expo Router's static export here emits client-only shells: the screen tree is never
 * server-rendered, so `expo-router/head` cannot contribute tags to the exported HTML. The
 * `+html.tsx` document therefore declares no SEO tags at all and this script writes exactly
 * one title/description/canonical/robots/Open Graph/Twitter set per page, derived from
 * `constants/seo-pages.json` (the same registry the runtime <PageMeta> reads).
 *
 * Runs from fix-web-build.js after the export and after public/ has been copied.
 */

const fs = require('node:fs');
const path = require('node:path');

const seoPages = require('../constants/seo-pages.json');
const medsIndex = require('../data/meds-index.json');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const BASE_PATH = '/dose-segura';
const BLOCK_START = '<!-- seo:start -->';
const BLOCK_END = '<!-- seo:end -->';

/** Pages that exist as a route but should never be indexed. */
const NOINDEX_FILES = new Set(['404.html', '+not-found.html', '_sitemap.html', 'modal.html']);

const site = seoPages.site;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fillTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => values[key] ?? '');
}

function canonicalUrl(routePath) {
  const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;
  const base = site.siteUrl.endsWith('/') ? site.siteUrl.slice(0, -1) : site.siteUrl;
  return `${base}${normalized === '/' ? '/' : normalized}`;
}

/** `path -> page meta` lookup for the static routes declared in the registry. */
const STATIC_BY_FILE = new Map();
for (const page of Object.values(seoPages.pages)) {
  const file = page.path === '/' ? 'index.html' : `${page.path.replace(/^\//, '')}.html`;
  STATIC_BY_FILE.set(file, page);
}

const NOT_FOUND_META = {
  path: '/404',
  title: 'Página não encontrada | Dose Segura',
  description: 'Este caminho não existe na Dose Segura.',
  noindex: true,
};

function defaultMeta(overrides = {}) {
  return {
    path: '/',
    title: site.defaultTitle,
    description: site.defaultDescription,
    ...overrides,
  };
}

/** Route path implied by an exported file, e.g. `procedure/foo.html` -> `/procedure/foo`. */
function selfCanonicalPath(posix) {
  const withoutPrefix = posix.startsWith('(tabs)/') ? posix.slice('(tabs)/'.length) : posix;
  const withoutExtension = withoutPrefix.replace(/\.html$/, '');
  return withoutExtension === 'index' || withoutExtension === '' ? '/' : `/${withoutExtension}`;
}

/**
 * Resolve the meta for an exported file. Strips the `(tabs)/` group prefix so those duplicate
 * artifacts inherit the metadata of the real route.
 */
function metaForFile(relativePath) {
  const posix = relativePath.split(path.sep).join('/');

  if (posix === '404.html' || posix === '+not-found.html') {
    return NOT_FOUND_META;
  }

  if (NOINDEX_FILES.has(posix)) {
    return defaultMeta({ path: selfCanonicalPath(posix), noindex: true });
  }

  // /medication/<id>.html — the app's main content pages.
  if (posix.startsWith('medication/')) {
    const id = posix.slice('medication/'.length, -'.html'.length);
    const summary = medsIndex.medications[id];
    if (!summary) {
      // The `[id].html` template artifact is never requested by a real URL.
      return defaultMeta({ noindex: true });
    }
    const classes = summary.classification.slice(0, 3).join(', ');
    const template = seoPages.templates.medication;
    const values = {
      id,
      name: summary.name,
      classes: classes ? ` (${classes})` : '',
      risk: summary.highRisk ? ' Medicamento de alto risco.' : '',
    };
    return {
      path: fillTemplate(template.path, values),
      title: fillTemplate(template.title, values),
      description: fillTemplate(template.description, values),
    };
  }

  // /procedure/<id>.html — template titles live in TS (procedures/builtin.ts), which the build
  // scripts cannot read, so these stay on the site defaults. The runtime <PageMeta> sets the
  // per-template title once the app hydrates. They still canonicalise to their own URL so that
  // a crawler never reads them as duplicates of the homepage.
  const lookupKey = posix.startsWith('(tabs)/') ? posix.slice('(tabs)/'.length) : posix;
  const page = STATIC_BY_FILE.get(lookupKey);
  if (page) {
    return page;
  }

  // Any other shell canonicalises to its own path rather than to the site root.
  return defaultMeta({ path: selfCanonicalPath(posix) });
}

function renderTags(meta) {
  const url = canonicalUrl(meta.path);
  const image = `${site.siteUrl}${site.imagePath}`;
  const lines = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}"/>`,
    `<link rel="canonical" href="${escapeHtml(url)}"/>`,
    `<meta name="robots" content="${meta.noindex ? 'noindex,follow' : 'index,follow'}"/>`,
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:site_name" content="${escapeHtml(site.siteName)}"/>`,
    `<meta property="og:locale" content="${escapeHtml(site.locale)}"/>`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}"/>`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}"/>`,
    `<meta property="og:url" content="${escapeHtml(url)}"/>`,
    `<meta property="og:image" content="${escapeHtml(image)}"/>`,
    `<meta property="og:image:width" content="${site.imageWidth}"/>`,
    `<meta property="og:image:height" content="${site.imageHeight}"/>`,
    `<meta property="og:image:alt" content="${escapeHtml(site.imageAlt)}"/>`,
    `<meta name="twitter:card" content="${escapeHtml(site.twitterCard)}"/>`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}"/>`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}"/>`,
    `<meta name="twitter:image" content="${escapeHtml(image)}"/>`,
    `<meta name="twitter:image:alt" content="${escapeHtml(site.imageAlt)}"/>`,
  ];
  return `${BLOCK_START}${lines.join('')}${BLOCK_END}`;
}

/** Remove any previously injected or hand-written SEO tags so the result is exactly one set. */
function stripSeo(html) {
  const withoutBlock = html.replace(new RegExp(`${BLOCK_START}[\\s\\S]*?${BLOCK_END}`, 'g'), '');
  return withoutBlock
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<meta\s+name="robots"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '');
}

function inject(html, tags) {
  const cleaned = stripSeo(html);
  if (!cleaned.includes('</head>')) {
    throw new Error('exported HTML has no </head> to inject into');
  }
  return cleaned.replace('</head>', `${tags}</head>`);
}

function collectHtmlFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(full, acc);
    } else if (entry.name.endsWith('.html')) {
      acc.push(full);
    }
  }
  return acc;
}

function generateRouteMeta({ distDir = DIST_DIR, quiet = false } = {}) {
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist directory not found: ${distDir}`);
  }

  const files = collectHtmlFiles(distDir);
  let updated = 0;
  let noindexed = 0;

  for (const file of files) {
    const relative = path.relative(distDir, file);
    const meta = metaForFile(relative);
    const html = fs.readFileSync(file, 'utf8');
    const next = inject(html, renderTags(meta));
    if (next !== html) {
      fs.writeFileSync(file, next, 'utf8');
      updated += 1;
    }
    if (meta.noindex) {
      noindexed += 1;
    }
  }

  if (!quiet) {
    console.log(`🏷️  Route metadata injected into ${updated} HTML files (${noindexed} noindex)`);
  }
  return { updated, noindexed, total: files.length };
}

if (require.main === module) {
  try {
    generateRouteMeta();
  } catch (error) {
    console.error('Error generating route metadata:', error.message);
    process.exit(1);
  }
}

module.exports = { generateRouteMeta, metaForFile, canonicalUrl, BASE_PATH };
