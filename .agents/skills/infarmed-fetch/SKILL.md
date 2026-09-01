---
name: infarmed-fetch
description: Fetch RCM and FI PDFs from Infarmed (INFOMED) for a given medication via the project CLI, store them under infarmed/{medId}/, then review ATC/match before proposing data/meds.json edits. Use when retrieving or updating medication documents from Infarmed. Do not drive INFOMED in a browser or via Playwright MCP.
---

# Infarmed Fetch Skill

## When to use

Retrieving or updating RCM/FI documents from Infarmed for a medication id (`medId`).

## Command

Do **not** open INFOMED in a browser or walk this skill via Playwright MCP. Run the existing CLI:

```bash
bun run infarmed:fetch -- <medId>
```

This downloads RCM/FI into `infarmed/{medId}/`, then extract+parse via `scripts/meds.js`.

Equivalent:

```bash
node scripts/meds.js fetch <medId>
```

## After the CLI

1. Review `infarmed/{medId}/meta.json`: confirm ATC / DCI / pharmaceutical form match the catalog medication (injectable or perfusion, not a supplement or wrong salt).
2. Review extracted and parsed sections before proposing `data/meds.json` edits.
3. Format and style those edits with `node scripts/meds-formatter.js` (there is no meds-formatter skill file).
