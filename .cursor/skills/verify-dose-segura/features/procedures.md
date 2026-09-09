# Procedimentos

Nursing checklist list: user procedures (including one-time catalog seed of CVP + SNG), open detail, add from template catalog, create new. Educational — not hospital protocol; no medication doses.

## Sub-features

- `proc-list` shows **Procedimentos** with seeded catalog adoptions after first visit.
- `proc-open-detail` opens a checklist with materials / steps / attention.
- `proc-add-from-catalog` re-adds a deleted template via the FAB → catálogo flow.
- `proc-create` creates a user procedure from the form and lands on detail.

## How to get to it (user POV)

- Choose the **Procedimentos** tab (or `/procedures`).
- Tap a row (e.g. **Cateterismo venoso periférico**).
- Use the new (+) control → **Adicionar do catálogo** or create blank.

## Driving it with Playwright (`drive.mjs` / e2e)

Preconditions:

- Launch + Doctor green.
- Fresh browser context is enough; catalog migration seeds CVP/SNG once per storage profile.

- **Open tab.** Click `getByRole('tab', { name: /Procedimentos/i })`. `procedures-screen` visible; text **Cateterismo venoso periférico** and **Sondagem nasogástrica** visible.
- **Open detail.** Click CVP title. `procedure-detail`, `procedure-title`, materials/steps/attention regions visible; disclaimer visible.
- **Proof.** `node .cursor/skills/verify-dose-segura/scripts/drive.mjs procedures`.
- **Deeper flows:** `e2e/tests/procedures.e2e.ts` (delete + re-add from catalog, create form) — accept native `dialog` on delete.

## Gotchas

- After delete, the template is gone from the user list until re-added from the catalog; “Já adicionado” disables duplicates.
- Starters are cloned into user storage — edit/delete affordances appear on detail.
- Do not assert medication doses inside procedures; they are intentionally absent.
