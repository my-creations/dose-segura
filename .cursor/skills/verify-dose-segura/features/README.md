# Dose Segura verification map

Maintained recipes for proving user-facing web/PWA behavior. Read this index, Launch + Doctor the app, then follow one feature file.

## Baseline preconditions

- Launch via `.cursor/skills/verify-dose-segura/scripts/launch.sh` (Expo web at `http://127.0.0.1:8091/` by default).
- Doctor must pass before Drive.
- UI language is Portuguese (`Strings.pt`): tabs **Medicamentos**, **Favoritos**, **Cálculos**, **Procedimentos**, **Definições**.
- Prefer `testID`s (`home-screen`, `search-input`, `medication-card-<id>`, …) and tab roles over coordinates.
- Never drive an instance you did not start with Launch.
- Production Pages uses base path `/dose-segura/`; local Expo web serves at `/`.

## Driving conventions

- Start each recipe from a fresh home load (`page.goto('/')`) unless the feature says otherwise.
- Mutations (favorites, user procedures) leave local storage dirty — clear via the UI path in the recipe, or accept a fresh browser context (what `drive.mjs` uses per run).
- Capture action + resulting state under `evidence/<feature-id>/`.
- Report unreachable paths with the attempted command and unmet precondition — do not claim a different entry point as the same proof.

## Out of scope until PR #12 merges

- **PWA offline / service worker** (`sw.js`, precache). Tracked in https://github.com/my-creations/dose-segura/pull/12. After merge, add a feature file and prove install + offline reload against a static `dist` server (not only Expo web).

## Features

- [Medications catalog](./medications-catalog.md) — search, open detail, sections/high-risk.
- [Cálculos](./calculations.md) — dose por peso and volume a aspirar.
- [Procedimentos](./procedures.md) — seeded checklists, detail, catalog add.
- [Favoritos](./favorites.md) — pin/unpin from home and Favoritos tab.
- [Definições](./settings.md) — settings shell; mobile install affordances.
