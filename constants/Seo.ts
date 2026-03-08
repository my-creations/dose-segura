export const SEO = {
  siteName: 'Dose Segura',
  siteUrl: 'https://my-creations.github.io/dose-segura',
  defaultTitle: 'Dose Segura | Guia rápido de medicamentos para enfermagem',
  defaultDescription:
    'Consulte informação essencial sobre medicamentos injetáveis, compatibilidade, preparação, administração e cuidados de enfermagem na app Dose Segura.',
  defaultImage: 'https://my-creations.github.io/dose-segura/icon.png',
};

export function getCanonicalUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = SEO.siteUrl.endsWith('/') ? SEO.siteUrl.slice(0, -1) : SEO.siteUrl;
  return `${basePath}${normalizedPath === '/' ? '' : normalizedPath}`;
}
