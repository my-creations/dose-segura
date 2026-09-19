import React from 'react';
import { Platform } from 'react-native';

import { SEO, getCanonicalUrl, type PageMetaDefinition } from '@/constants/Seo';

type PageMetaProps = PageMetaDefinition & {
  /** Absolute URL; defaults to the site-wide social preview image. */
  image?: string;
  /** Absolute URL for the page; overrides the canonical derived from `path`. */
  canonical?: string;
};

function setMetaTag(attribute: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * Applies this route's SEO tags to the document.
 *
 * Static HTML for every route already carries the correct tags — they are injected at build
 * time by `scripts/generate-route-meta.js`, because Expo Router's static export here emits
 * client-only shells and `expo-router/head` never reaches the exported HTML.
 *
 * This component keeps those tags correct during in-app navigation (client-side routing does
 * not re-fetch a document), by updating the existing elements in place. `document.title` and a
 * single `link[rel=canonical]` are mutated rather than appended, so no duplicates are created.
 * No-op on native.
 */
export function PageMeta({ title, description, path, noindex, image, canonical }: PageMetaProps) {
  const url = canonical ?? getCanonicalUrl(path);
  const socialImage = image ?? SEO.defaultImage;
  const robots = noindex ? 'noindex,follow' : 'index,follow';

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', robots);
    setCanonical(url);

    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', SEO.siteName);
    setMetaTag('property', 'og:locale', SEO.locale);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:image', socialImage);
    setMetaTag('property', 'og:image:width', String(SEO.imageWidth));
    setMetaTag('property', 'og:image:height', String(SEO.imageHeight));
    setMetaTag('property', 'og:image:alt', SEO.imageAlt);

    setMetaTag('name', 'twitter:card', SEO.twitterCard);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', socialImage);
    setMetaTag('name', 'twitter:image:alt', SEO.imageAlt);
  }, [title, description, robots, url, socialImage]);

  return null;
}
