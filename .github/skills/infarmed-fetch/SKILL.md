# Infarmed Fetch Skill

## Goal
Fetch RCM and FI PDFs from Infarmed (INFOMED) and store them under `infarmed/{medId}/` without modifying `data/meds.json`.

## Preconditions
- Use Playwright MCP in a fresh session.
- Be mindful of Infarmed usage conditions and rate limits.

## Folder Layout
- `infarmed/{medId}/meta.json`
- `infarmed/{medId}/rcm/{infarmedId}-rcm.pdf`
- `infarmed/{medId}/fi/{infarmedId}-fi.pdf`

## Workflow
1) Navigate to `https://extranet.infarmed.pt/INFOMED-fo/`.
2) Click `Pesquisa Avancada`.
3) Fill `Nome do Medicamento` with the search term (med name or DCI).
4) Prefer injectable-only results:
   - Set `Forma Farmacêutica` to an injectable form (e.g., "solução injetável", "emulsão injetável",
     "pó para solução injetável", "solução injetável ou para perfusão").
   - If needed, also set `Via de Administração` to `endovenosa` or `intramuscular`.
5) Click `Pesquisar`.
5) Parse rows from `#mainForm:dt-medicamentos_data tr` and score the best match.
   - Normalize by lowercasing, removing accents, and collapsing whitespace.
   - Prefer exact DCI matches, then name matches.
   - Penalize longer names and generic (MG) if you want branded default.
6) For the best row, extract:
   - `infarmedId`, `name`, `dci`, `form`, `dosage`, `holder`.
   - `rcmId` and `fiId` (link ids for docs).
7) Build a POST request using the page form state (JSF ViewState):
   - Collect `FormData` from `form#mainForm`.
   - Set `payload[rcmId] = rcmId` and POST to `pesquisa-avancada.xhtml`.
   - The response is the PDF body (`application/pdf`).
   - Repeat for `fiId`.
8) Save PDFs to the folder layout above.
9) Write `meta.json` with best match info and document metadata.
10) Extract text with Poppler and parse all sections:
    - `node scripts/extract-infarmed-med.js <medId>`
    - `node scripts/parse-infarmed-text.js <medId>`
11) Before proposing additions to `data/meds.json`, scan ALL existing fields for the med
    (not just the target section) to avoid duplication. Treat every candidate statement
    as potentially already present under a different key.
12) Check for inconsistencies in existing `data/meds.json` content versus Infarmed
    (e.g., conflicting storage times, dosage, reconstitution windows). Flag conflicts
    explicitly instead of silently overwriting.

## Notes
- The PDF is not a stable URL; it is returned by a session-based POST.
- The document link opens a new tab in the browser; the reliable approach is to POST with ViewState.

## Example Fields for meta.json
- `medId`, `searchTerm`, `retrievedAt` (ISO)
- `bestMatch`: `infarmedId`, `name`, `dci`, `form`, `dosage`, `holder`, `score`
- `documents`: `rcm`, `fi` with `status`, `contentType`, `url`, `file`, `size`

## Dedup Checklist
- Search for the statement across ALL fields for the med.
- If already present, do not add it again under a new section.
- If the statement exists in a different form, prefer the clearer wording and avoid duplicates.
## Style
- Avoid trailing periods at the end of sentences in `data/meds.json` list items
## Consistency Check
- Compare Infarmed dose, stability, preparation, and storage details with existing entries.
- If there is a conflict, call it out and request confirmation before changing.
