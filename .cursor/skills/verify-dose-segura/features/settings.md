# Definições

Settings shell for app info and (on mobile browsers) PWA install affordances. Desktop Chrome hides the install section.

## Sub-features

- `settings-open` shows `settings-screen` on `/settings`.
- `settings-install-mobile` shows `installation-section` / `install-button` on mobile projects only.
- `settings-install-desktop-hidden` keeps install UI hidden on Desktop Chrome.
- `settings-ios-modal` (iPhone project) shows themed install instructions when no beforeinstallprompt.

## How to get to it (user POV)

- Choose the **Definições** tab (or `/settings`).
- On a phone browser, use **Instalar** if shown.

## Driving it with Playwright (`drive.mjs` / e2e)

Preconditions:

- Launch + Doctor green.

- **Open.** Tab `/Definições/i` → `settings-screen` visible.
- **Proof (desktop shell).** `node .cursor/skills/verify-dose-segura/scripts/drive.mjs settings` → `evidence/settings/01-settings.png`.
- **Install matrix:** `e2e/tests/pwa-install.e2e.ts` across Desktop Chrome / iPhone / Pixel projects.

## Gotchas

- Install UI is **mobile-only** in e2e; do not fail a desktop proof because `install-button` is missing.
- True offline SW verification is **not** this feature — wait for PR #12 and a static `dist` serve with `/dose-segura/` base path.
