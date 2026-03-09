import { ScrollViewStyleReset } from 'expo-router/html';

import { Colors } from '@/constants/Colors';
import { SEO, getCanonicalUrl } from '@/constants/Seo';
import { THEME_STORAGE_KEY } from '@/constants/Theme';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  const assetBasePath = process.env.NODE_ENV === 'production' ? '/dose-segura' : '';
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SEO.siteName,
        url: SEO.siteUrl,
        inLanguage: 'pt-PT',
        description: SEO.defaultDescription,
      },
      {
        '@type': 'SoftwareApplication',
        name: SEO.siteName,
        applicationCategory: 'MedicalApplication',
        operatingSystem: 'Web, iOS, Android',
        url: SEO.siteUrl,
        description: SEO.defaultDescription,
      },
    ],
  };

  const initialThemeScript = `
    (function() {
      var mode = 'system';
      try {
        var storedTheme = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          mode = storedTheme;
        }
      } catch (error) {}

      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var resolvedTheme = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
      var backgroundColor = resolvedTheme === 'dark'
        ? ${JSON.stringify(Colors.dark.background)}
        : ${JSON.stringify(Colors.light.background)};

      document.documentElement.setAttribute('data-theme', resolvedTheme);
      document.documentElement.style.colorScheme = resolvedTheme;

      var themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', backgroundColor);
      }

      if (document.body) {
        document.body.style.backgroundColor = backgroundColor;
      }
    })();
  `;

  return (
    <html lang="pt-PT">
      <head>
        <title>{SEO.defaultTitle}</title>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content={SEO.defaultDescription} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={getCanonicalUrl('/')} />

        {/* PWA Configuration */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Dose Segura" />
        <meta name="theme-color" content="#E8A0BF" />
        <meta property="og:locale" content="pt_PT" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SEO.siteName} />
        <meta property="og:title" content={SEO.defaultTitle} />
        <meta property="og:description" content={SEO.defaultDescription} />
        <meta property="og:url" content={getCanonicalUrl('/')} />
        <meta property="og:image" content={SEO.defaultImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO.defaultTitle} />
        <meta name="twitter:description" content={SEO.defaultDescription} />
        <meta name="twitter:image" content={SEO.defaultImage} />
        {/* Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href={`${assetBasePath}/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${assetBasePath}/favicon-32.png`} />
        <link rel="manifest" href={`${assetBasePath}/manifest.json`} />
        <link rel="alternate" hrefLang="pt-PT" href={getCanonicalUrl('/')} />
        <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground(assetBasePath) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

function responsiveBackground(assetBasePath: string) {
  return `
@font-face {
  font-family: 'Quicksand_400Regular';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('${assetBasePath}/fonts/Quicksand_400Regular.ttf') format('truetype');
}

@font-face {
  font-family: 'Quicksand_500Medium';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('${assetBasePath}/fonts/Quicksand_500Medium.ttf') format('truetype');
}

@font-face {
  font-family: 'Quicksand_600SemiBold';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('${assetBasePath}/fonts/Quicksand_600SemiBold.ttf') format('truetype');
}

@font-face {
  font-family: 'Quicksand_700Bold';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('${assetBasePath}/fonts/Quicksand_700Bold.ttf') format('truetype');
}

html,
body {
  background-color: ${Colors.light.background};
}

html[data-theme="dark"],
html[data-theme="dark"] body {
  background-color: ${Colors.dark.background};
}

@media (prefers-color-scheme: dark) {
  html:not([data-theme]),
  body {
    background-color: ${Colors.dark.background};
  }
}`;
}
