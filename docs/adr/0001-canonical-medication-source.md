# Use one canonical Medication source with generated projections

Dose Segura authors Medication data only in `data/meds.json`. A build-time Medication Artifact Module deterministically derives the committed Medications Index (`data/meds-index.json`) and lazy web Medications Full Data (`public/meds-full.json`), while CI rejects drift. We chose committed projections over runtime derivation to preserve fast Search and lazy web details, and over ignored build-only projections so fresh checkouts and direct Expo commands remain complete and reviewable.

## Consequences

Generated projections must never be edited directly. After reviewing a canonical Medication change, maintainers run `bun run generate:meds`; `bun run validate:meds` is read-only and fails for malformed canonical data or stale/missing projections. Native continues bundling canonical Medication Details, while web fetches the generated full-data asset separately.
