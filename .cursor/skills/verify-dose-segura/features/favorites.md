# Favoritos

Pin medications from the home list (heart control) and review them on the **Favoritos** tab. Persistence is local (`AsyncStorage`); prove via the Favoritos UI, not storage keys.

## Sub-features

- `fav-add` toggles favorite on a home medication card.
- `fav-list` shows the medication on `/favorites`.
- `fav-remove` unpins from Favoritos and restores the empty state when none remain.

## How to get to it (user POV)

- On **Medicamentos**, tap the heart on a card.
- Open the **Favoritos** tab.
- Tap the heart again on the Favoritos card to remove.

## Driving it with Playwright (`drive.mjs` / e2e)

Preconditions:

- Launch + Doctor green.
- Prefer a fresh browser context so prior favorites do not leak.

- **Search + pin.** Fill search `Bicarb`. On `home-screen` → `medication-card-bicarbonato-de-sodio` → click `favorite-button`.
- **Open Favoritos.** Tab `/Favoritos/i` → URL `/favorites`; card visible inside `favorites-screen`.
- **Unpin.** Click `favorite-button` on that card; empty title `Sem favoritos` appears when list empty.
- **Proof.** `node .cursor/skills/verify-dose-segura/scripts/drive.mjs favorites`.
- **Suite mirror:** `e2e/tests/favorites.e2e.ts`.

## Gotchas

- Scope the card with `home-screen` or `favorites-screen` — both can mount similar testIDs during tab transitions.
- A filled heart alone is weak proof; confirm the Favoritos tab list (second view).
