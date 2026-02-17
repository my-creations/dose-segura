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
   - **Crucial:** Verify the Pharmacological Class or ATC code to avoid mismatched indications (e.g., supplement vs. chelator).
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
    - `node scripts/meds.js extract <medId>`
    - `node scripts/meds.js parse <medId>`
    - **Cleaning:** During extraction, strip JSF artifacts and Infarmed approval stamps (e.g., "APROVADO EM...", "INFARMED").
11) When proposing additions to `data/meds.json`, follow the deduplication and style rules from the `meds-formatter` skill.
    - Use `node scripts/meds.js suggest-merge <medId>` (if available) to assist in identifying overlaps.
12) Identify and flag conflicts according to the `meds-formatter` skill.

## Formatting & Style
- For ALL updates, additions, or validations involving `data/meds.json`, **you MUST follow the rules defined in the `meds-formatter` skill**.
- This includes rules for technical names, units, mathematical symbols, administration routes, and safety regarding acronyms.

## Notes
- The PDF is not a stable URL; it is returned by a session-based POST.
- The document link opens a new tab in the browser; the reliable approach is to POST with ViewState.

## Example Fields for meta.json
- `medId`, `searchTerm`, `retrievedAt` (ISO)
- `bestMatch`: `infarmedId`, `name`, `dci`, `form`, `dosage`, `holder`, `score`, `atcCode` (if available)
- `documents`: `rcm`, `fi` with `status`, `contentType`, `url`, `file`, `size`
