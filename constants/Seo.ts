import seoPages from '@/constants/seo-pages.json';

type SiteConfig = typeof seoPages.site;
type RawPage = { path: string; title: string; description: string; noindex?: boolean };
type RawTemplate = { path: string; title: string; description: string };

const site = seoPages.site as SiteConfig;
const rawPages = seoPages.pages as Record<string, RawPage>;
const rawTemplates = seoPages.templates as Record<string, RawTemplate>;

/** Static pages plus the dynamic-route templates, looked up by the same keys. */
const rawMeta: Record<string, RawPage | RawTemplate> = { ...rawPages, ...rawTemplates };

export type PageMetaDefinition = {
  title: string;
  description: string;
  /** Route path used for the canonical URL, e.g. `/privacy`. */
  path: string;
  /** Tool/user-specific screens that add nothing to search results. */
  noindex?: boolean;
};

export const SEO = {
  siteName: site.siteName,
  siteUrl: site.siteUrl,
  defaultTitle: site.defaultTitle,
  defaultDescription: site.defaultDescription,
  defaultImage: `${site.siteUrl}${site.imagePath}`,
  imageAlt: site.imageAlt,
  imageWidth: site.imageWidth,
  imageHeight: site.imageHeight,
  locale: site.locale,
  twitterCard: site.twitterCard,
};

export function getCanonicalUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = SEO.siteUrl.endsWith('/') ? SEO.siteUrl.slice(0, -1) : SEO.siteUrl;
  return `${basePath}${normalizedPath === '/' ? '/' : normalizedPath}`;
}

function fillTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => values[key] ?? '');
}

function buildPage(key: string, values: Record<string, string> = {}): PageMetaDefinition {
  const page = rawMeta[key];
  if (!page) {
    throw new Error(`No SEO copy registered for "${key}" in constants/seo-pages.json`);
  }
  return {
    title: fillTemplate(page.title, values),
    description: fillTemplate(page.description, values),
    path: fillTemplate(page.path, values),
    ...('noindex' in page && page.noindex ? { noindex: true } : {}),
  };
}

/**
 * Per-route SEO copy, sourced from `constants/seo-pages.json` so the web build's static
 * head injection (`scripts/generate-route-meta.js`) and the runtime `<PageMeta>` can never
 * disagree about a page's title, description or canonical URL.
 */
export const PAGES = {
  home: buildPage('home'),
  calculations: buildPage('calculations'),
  favorites: buildPage('favorites'),
  procedures: buildPage('procedures'),
  settings: buildPage('settings'),
  procedureCatalog: buildPage('procedureCatalog'),
  procedureForm: buildPage('procedureForm'),
  privacy: buildPage('privacy'),
  terms: buildPage('terms'),
  notFound: {
    title: 'Página não encontrada | Dose Segura',
    description: 'Este caminho não existe na Dose Segura.',
    path: '/404',
    noindex: true,
  },
} as const satisfies Record<string, PageMetaDefinition>;

/** Medication detail pages are the app's main content, so they get their own copy. */
export function medicationPageMeta(input: {
  id: string;
  name: string;
  classification: readonly string[];
  highRisk: boolean;
}): PageMetaDefinition {
  const classes = input.classification.slice(0, 3).join(', ');
  return buildPage('medication', {
    id: input.id,
    name: input.name,
    classes: classes ? ` (${classes})` : '',
    risk: input.highRisk ? ' Medicamento de alto risco.' : '',
  });
}

export function procedurePageMeta(input: {
  id: string;
  title: string;
  materials: readonly string[];
  steps: readonly string[];
}): PageMetaDefinition {
  return buildPage('procedure', {
    id: input.id,
    title: input.title,
    materials: String(input.materials.length),
    steps: String(input.steps.length),
  });
}
