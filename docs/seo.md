# SEO architecture (web/PWA)

The web build is a client-rendered Expo Router SPA on GitHub Pages. Two facts drive the design:

1. **Expo Router's static export here emits client-only shells.** The screen tree is never
   server-rendered: every exported `.html` contains the same document shell and the router
   resolves the path in the browser. Verified: `dist/privacy.html` contains no screen copy.
2. **`expo-router/head` therefore cannot reach the exported HTML.** Its output exists only in
   the live DOM after hydration, and tags it appends at runtime would sit _next to_ any static
   tags rather than replace them (duplicate `<title>`).

So SEO tags are written once at build time, and a runtime component keeps them correct while
the user navigates inside the app.

## Pieces

| Piece                            | Role                                                                                                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constants/seo-pages.json`       | Single source of page copy: site config, static routes, and `{{token}}` templates for `/medication/{{id}}` and `/procedure/{{id}}`. Read by both TS and the Node build scripts.          |
| `constants/Seo.ts`               | Typed access to the registry: `SEO`, `PAGES`, `getCanonicalUrl`, `medicationPageMeta`, `procedurePageMeta`.                                                                              |
| `scripts/generate-route-meta.js` | Rewrites the `<head>` of every exported HTML file: exactly one `title`, `description`, `canonical`, `robots` plus Open Graph/Twitter tags. Strips prior tags first, so it is idempotent. |
| `scripts/generate-sitemap.js`    | Emits `dist/sitemap.xml`: indexable static routes + every medication page, with `lastmod` from `data/meds-index.json`.                                                                   |
| `components/PageMeta.tsx`        | Rendered by every route. Updates the existing tags in place during client-side navigation (`document.title`, `meta[...]`, one `link[rel=canonical]`). No-op on native.                   |
| `app/+html.tsx`                  | Declares **no** SEO tags — only PWA chrome, icons, the theme bootstrap and viewport.                                                                                                     |

## Static generation

`app/medication/[id].tsx` and `app/procedure/[id].tsx` export `generateStaticParams()`, so the
export writes a real HTML file per medication (120) and per catalog template (12). Without this
the dynamic URLs have no file on GitHub Pages and answer with `404.html` **and a 404 status**,
which keeps the app's main content out of search results.

## Rules to keep this working

- Add or change page copy in `constants/seo-pages.json`, never in `+html.tsx`.
- Every new route must render `<PageMeta>`; `__tests__/seo/route-meta.test.ts` fails otherwise.
- `/favorites`, `/settings`, `/procedure/form` and error pages are `noindex` and excluded from
  the sitemap; the tests assert both lists so a route cannot end up in one but not the other.
- Generated dynamic-route shells are excluded from the service-worker precache
  (`isGeneratedDynamicShell` in `scripts/generate-sw-precache.js`): they are byte-identical
  client-only shells, and offline navigation already falls back to the precached SPA shell.
  Precaching them took the manifest from 96 to 228 URLs.
- Procedure detail pages keep site-default tags in the static HTML because their titles live in
  TS (`procedures/builtin.ts`) and the build scripts only read JSON. The runtime `<PageMeta>`
  sets the real title once the app hydrates.

## Verifying a build

```bash
bun run build:web
# every page has exactly one title/description/canonical
grep -c '<title' dist/privacy.html
# sitemap contents
grep -c '<loc>' dist/sitemap.xml
```
