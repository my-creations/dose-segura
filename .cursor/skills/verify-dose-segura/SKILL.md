---
name: verify-dose-segura
description: "Drive Dose Segura's web/PWA the way a nurse would — Expo Router tabs, medication catalog, cálculos, procedimentos, favorites, settings. Use when proving UI behavior, after web/PWA changes, or before trusting a Pages deploy."
---

# Verify Dose Segura (web / PWA)

Primary surface: **web** via Expo Router (`bun run web`). Native Expo exists but this skill prioritizes the browser/PWA path that ships to GitHub Pages (`https://my-creations.github.io/dose-segura/`, base path `/dose-segura/` in production).

Local verification Launch uses the **Expo web dev server**, which serves at `/` (no `/dose-segura/` prefix). Playwright e2e in `e2e/` does the same. Do not drive the live Pages URL for proofs unless the feature map explicitly says so.

Harness: **Playwright** (`@playwright/test` already in the repo) plus the helpers under `.cursor/skills/verify-dose-segura/scripts/`. Prefer `testID`s and tab accessible names from `constants/Strings.ts` — the e2e suite already encodes them.

**Isolation:** default verification port is `8091` so it does not collide with a developer's Expo on `8081`. Never attach to an instance you did not start with Launch. Never kill by process name.

**Offline / service worker:** not on `master` as of this skill. PR [#12](https://github.com/my-creations/dose-segura/pull/12) (`perf/pwa-offline-cache`) adds `sw.js` + precache. When that merges, extend the feature map with a PWA offline entry and re-prove; until then treat offline SW as **out of scope** for this skill.

## Launch

From the repo root:

```bash
.cursor/skills/verify-dose-segura/scripts/launch.sh
```

- Starts `bun run web -- --port 8091` (override with `VERIFY_PORT`).
- Writes `.cursor/skills/verify-dose-segura/.run/state.env` (`PID`, `PORT`, `HOST`, `LOG_FILE`).
- Ready when `http://127.0.0.1:8091/` returns HTTP 200 (timeout 120s).
- Refuses a second launch while that PID is alive.

Teardown is Cleanup (below), not Ctrl-C by guesswork.

Optional: full e2e suite still works independently via `bun run e2e` (its config defaults to port `8081` and may reuse an existing server when not in CI).

## Doctor

```bash
.cursor/skills/verify-dose-segura/scripts/doctor.sh
```

Read-only. Passes only if:

1. `state.env` exists and `PID` is alive.
2. `http://$HOST:$PORT/` returns 200 and the body looks like Dose Segura.
3. `package.json` `"name"` is `dose-segura`.

Run Doctor before the first Drive, after any failed Drive, and whenever the UI looks wedged. A Doctor failure caused by a dead Launch → Cleanup, then Launch again.

## Drive

Map recipes live in `features/`. Prefer the skill helper (connects to the Launch instance, writes evidence):

```bash
node .cursor/skills/verify-dose-segura/scripts/drive.mjs calculations
# also: medications-catalog | procedures | favorites | settings
```

Stable handles (from e2e / components):

| Surface       | Handle                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Home          | `getByTestId('home-screen')`, `getByTestId('search-input')`                                       |
| Med card      | `getByTestId('medication-card-<id>')`, favorite heart `favorite-button`                           |
| Detail        | `medication-detail`, `medication-title`, `section-<key>`, `high-risk-badge`                       |
| Tabs          | `getByRole('tab', { name: /Medicamentos\|Favoritos\|Cálculos\|Procedimentos\|Definições/i })`     |
| Cálculos      | `calculations-screen`, `calculation-input-*`, `calculation-mode-volume`, `calculation-result*`    |
| Procedimentos | `procedures-screen`, `procedure-detail`, `procedures-new-button`, catalog `catalog-add-builtin-*` |
| Settings      | `settings-screen`, mobile-only `installation-section` / `install-button`                          |

Alternative: reuse repo Playwright specs against the Launch port:

```bash
E2E_PORT=8091 bunx playwright test -c e2e/playwright.config.ts \
  e2e/tests/calculations.e2e.ts --project="Desktop Chrome"
```

(`reuseExistingServer` is true locally, so the config will not start a second Expo if `8091` is already up.)

Drive the **user path** (tabs, search, forms). Do not call internal stores or seed AsyncStorage to fake success unless a feature recipe says that is the only seam.

## Evidence

Directory (survives Cleanup):

```text
.cursor/skills/verify-dose-segura/evidence/<feature-id>/
```

`drive.mjs` writes for each step: `NN-label.png`, `NN-label.aria.txt`, `NN-label.meta.json`, plus `PASS.json` on success.

Proof standards:

- Exercise the real UI path (tab → fill → visible result), not unit mocks.
- Capture **action and resulting state** (e.g. inputs filled + result card), not only the final screen.
- Side effects that matter here are mostly local (`AsyncStorage` favorites/procedures). Prove them with a second user-facing view (Favorites tab, reopen procedure), not by reading storage keys.
- Runtime `pageerror` / console errors during Drive fail the proof.
- `.run/` is scratch; **never** store proofs only there.

After Cleanup, confirm `evidence/<feature>/` still exists and still contains the PNGs / `PASS.json`.

## Cleanup

```bash
.cursor/skills/verify-dose-segura/scripts/cleanup.sh
```

- Kills **only** the PID recorded in `state.env` (then SIGKILL that same PID if needed).
- Deletes `.run/` scratch (`state.env`, logs).
- **Does not** delete `evidence/`.

Run Cleanup after every verification session and after failed Launch/Drive iterations so ports are not stranded.

## Helpers

All under `.cursor/skills/verify-dose-segura/scripts/` (executable):

| Script       | Role                                                     |
| ------------ | -------------------------------------------------------- |
| `launch.sh`  | Start Expo web; write `.run/state.env`; wait until ready |
| `doctor.sh`  | Read-only health of that instance                        |
| `drive.mjs`  | Drive one mapped feature; write `evidence/<feature>/`    |
| `cleanup.sh` | Stop Launch PID; keep evidence                           |

Env knobs: `VERIFY_PORT` (default `8091`), `VERIFY_HOST` (default `127.0.0.1`), `VERIFY_RUN_DIR`, `VERIFY_READY_TIMEOUT_SEC` (default `120`).

## Feature map

See [`features/README.md`](features/README.md). Start with one feature per run unless maintaining the whole map via `/maintain-verification-skill`.
