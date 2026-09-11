# Cálculos

Guided pediatric-style helpers for regra de três: dose by weight, volume to draw, and mg/kg. Educational aid only — not a prescribing calculator; disclaimer must stay visible with results.

## Sub-features

- `calc-open` opens the **Cálculos** tab (`calculations-screen`).
- `calc-dose-by-weight` computes patient dose from reference dose/weight + patient weight.
- `calc-volume` switches to volume mode and computes mL from prescribed dose ÷ concentration.
- `calc-guard-zero` hides results and shows an error for zero/negative inputs.
- `calc-disclaimer` keeps the educational disclaimer visible with a valid result.

## How to get to it (user POV)

- Choose the **Cálculos** tab in the bottom tab bar.
- Or open `/calculations`.

## Driving it with Playwright (`drive.mjs` / e2e)

Preconditions:

- Launch + Doctor green.
- Start from home or go directly to `/calculations`.

- **Open tab.** Click `getByRole('tab', { name: /Cálculos/i })`. `calculations-screen` visible; URL `/calculations`.
- **Dose by weight.** Fill `calculation-input-dose-ref`=`100`, `calculation-input-weight-ref`=`70`, `calculation-input-patient-weight`=`7.5`. `calculation-result-value` contains `10,7143` (pt decimal comma); unit `mg`; formula mentions the inputs.
- **Volume mode.** Click `calculation-mode-volume`. Fill `calculation-input-prescribed-dose`=`15`, `calculation-input-concentration`=`5`. Result value `3`, unit `mL`.
- **Proof.** `node .cursor/skills/verify-dose-segura/scripts/drive.mjs calculations` → `evidence/calculations/02-dose-by-weight.png` and `03-volume.png`.
- **Suite mirror:** `e2e/tests/calculations.e2e.ts`.

## Gotchas

- Locale formatting uses comma decimals (`10,7143`), not dots — assert flexibly or match pt-PT.
- Empty or zero inputs must **not** show `calculation-result`.
- There is no numeric keypad chrome; fill the text inputs (chips/fields) directly.
