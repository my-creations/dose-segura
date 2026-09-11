# Medications catalog

Search the bundled injectable medication catalog by name or alias, open Medication Details, and see nursing-oriented sections (and the high-risk badge when flagged).

## Sub-features

- `catalog-home` shows the searchable home list (`home-screen`).
- `catalog-search` filters by name/alias (accent-insensitive).
- `catalog-open-detail` opens `/medication/<id>` with title and sections.
- `catalog-high-risk` shows `high-risk-badge` only when `highRisk` is true.
- `catalog-empty-search` shows the no-results empty state for a nonsense query.

## How to get to it (user POV)

- Land on the **Medicamentos** tab (default route `/`).
- Type into the search field placeholder `Pesquisar medicamento...`.
- Tap a medication card to open details.
- Deep-link to `/medication/<id>` (e.g. `/medication/bicarbonato-de-sodio`).

## Driving it with Playwright (`drive.mjs` / e2e)

Preconditions:

- Launch + Doctor green at `http://127.0.0.1:8091/`.
- Canonical data includes `bicarbonato-de-sodio` (see `data/meds.json`).

- **Open home.** `page.goto('/')`. `getByTestId('home-screen')` visible.
- **Search.** Fill `getByTestId('search-input')` with `Bicarb`. `getByTestId('medication-card-bicarbonato-de-sodio')` visible.
- **Open detail.** Click the card. URL matches `/medication/bicarbonato-de-sodio`; `medication-detail` and `medication-title` visible.
- **Proof.** `node .cursor/skills/verify-dose-segura/scripts/drive.mjs medications-catalog` → `evidence/medications-catalog/03-detail.png` shows the detail title.
- **Exhaustive contract (optional):** `E2E_PORT=8091 bunx playwright test -c e2e/playwright.config.ts e2e/tests/medication-catalog.e2e.ts --project="Desktop Chrome"` (long; Desktop Chrome only).

## Gotchas

- Production Pages URLs need the `/dose-segura/` prefix; local Expo does not.
- Empty sections are omitted from the DOM — assert absence with `toHaveCount(0)`, not hidden.
- Search is substring on name + aliases; use a distinctive fragment (`Bicarb`) to avoid ambiguous cards.
