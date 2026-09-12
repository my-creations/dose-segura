# Dose Segura

Offline-first reference app for Portuguese healthcare professionals administering medications. Bundled medication data, searchable catalog, favorites, Infarmed-sourced detail sections, modular nursing procedure checklists (user list + template catalog), and a guided pediatric dose calculation aid — not a prescribing or dosing calculator.

## Language

### Catalog

**Medication**:
A drug entry identified by a stable string id, with a display name, aliases, high-risk flag, and nursing-oriented detail sections.
_Avoid_: Drug, product, medicine entry, item

**Medication Summary**:
The lightweight list projection of a Medication (id, name, aliases, highRisk, classification) used for search results, home, and favorites.
_Avoid_: Preview, teaser, list item, card model

**Medication Details**:
The full Medication record including all detail sections, loaded on demand after the summary is known.
_Avoid_: Full med, expanded medication, RCM dump

**Medication Catalog**:
The in-app collection of all Medications available for search and lookup, backed by bundled index + full data. Deep module behind `search` / `getSummary` / `getDetails`.
_Avoid_: Database, pharmacy, inventory, repository (when meaning the domain collection)

**KeyValueStore**:
Seam for reading and writing string preferences (Favorites List, Theme Mode). Native and web each supply an adapter.
_Avoid_: Storage service, persistence layer, AsyncStorage (when meaning the seam)

**Medication Id**:
Stable string key for a Medication (e.g. `acetilcisteina`), used across favorites, routes, and data files.
_Avoid_: Slug, key, code (unqualified)

**Alias**:
An alternate name or abbreviation for a Medication that participates in search (e.g. brand or common short form).
_Avoid_: Synonym, tag, keyword

**High-Risk Medication**:
A Medication flagged `highRisk` for elevated attention during administration.
_Avoid_: Dangerous drug, alert med, critical medication

### Sections

**Medication Section**:
One named block of nursing-oriented guidance on a Medication (classification, compatibility, presentation and storage, preparation, administration, stability, contraindications and precautions, nursing care).
_Avoid_: Field, chapter, tab, category (when meaning a detail block)

**Section Tile**:
UI presentation of one non-empty Medication Section on the detail screen.
_Avoid_: Card (when meaning a section), accordion panel

### Search & Favorites

**Search**:
Accent-insensitive, case-insensitive substring match over Medication name and Aliases against the catalog index.
_Avoid_: Filter, query engine, full-text search

**Favorite**:
A user-pinned Medication Id kept in local persistence for quick access.
_Avoid_: Bookmark, starred item, saved med

**Favorites List**:
The ordered collection of Favorite Medication Ids currently persisted for the user.
_Avoid_: Wishlist, pins

### Procedures

**Procedure**:
A nursing checklist (title, materials, steps, and points of attention) used as an educational reference — either adopted from the Template Catalog or authored by the user. Not a hospital protocol and not a dosing tool.
_Avoid_: Protocol, guideline, SOP, care plan (when meaning this in-app checklist)

**Procedure Template** (catalog):
A read-only model Procedure shipped in bundled data (`source: 'builtin'`, e.g. CVP, SNG, injectáveis, SC/IM, flush/remoção CVP, medicação por SNG, IV push/bolus, sondagem vesical, assistência CVC/linha arterial). Templates are not auto-listed in the Procedures List; the user opts in via “Adicionar do catálogo”, which clones the template into a User Procedure with `originId` set to the template id. Storage never overwrites templates.
_Avoid_: Built-in Procedure (legacy), default, system procedure (when meaning the catalog entry)

**User Procedure**:
An editable Procedure owned by the user and persisted locally (KeyValueStore). Users create, edit, delete, duplicate, and re-add these (including former catalog adoptions after delete).
_Avoid_: Custom checklist, personal protocol, saved template

**Template Catalog**:
The in-app collection of Procedure Templates available to adopt. The picker hides or disables templates already present in the Procedures List (match by `originId` or title) with “Já adicionado”.
_Avoid_: Library (unqualified), procedures list (when meaning the catalog)

**Procedures List**:
The searchable view of User Procedures only (what the user has added or created). Does not auto-include Procedure Templates.
_Avoid_: Catalog (when meaning this user list), combined builtins+users list

**Catalog migration** (`@dose_segura_procedures_catalog_v1`):
One-time upgrade seed: when the flag is absent, missing catalog templates are adopted into user storage so existing installs keep CVP/SNG after templates stop being auto-merged. After the flag is set, delete + re-add from the catalog works without re-seeding.
_Avoid_: Soft reset, builtins merge

**User Procedures Workspace**:
The deep module that owns the Procedures List lifecycle for User Procedures: load/parse, catalog migration seed, optimistic create/update/delete/duplicate/adopt, CAS full-list reconcile persist, and web multi-tab `storage` sync. `ProceduresContext` is only a thin React adapter that holds a workspace instance and mirrors its snapshot for screens.
_Avoid_: Repository, storage service, persistence layer, procedures service (when meaning this workspace)

### Data sources

**Canonical Medications Data**:
The sole authoritative authored collection of Medication records from which every app representation is derived.
_Avoid_: Master database, source dump, generated projection

**Medications Index**:
The generated collection of Medication Summaries projected from Canonical Medications Data for list and Search use.
_Avoid_: Manifest, toc, lightweight db, authored source

**Medications Full Data**:
The complete Medication Details representation derived from Canonical Medications Data.
_Avoid_: Payload, dump, bulk file, independently authored copy

**Infarmed**:
Portuguese medicines authority (INFOMED) whose RCM and FI documents feed the offline data pipeline.
_Avoid_: FDA, EMA (as stand-ins), regulator (unqualified)

**RCM**:
Resumo das Características do Medicamento — SmPC-style professional document downloaded from Infarmed.
_Avoid_: SmPC (in user-facing or domain docs unless translating), datasheet

**FI**:
Folheto Informativo — patient information leaflet downloaded from Infarmed.
_Avoid_: PIL, package insert (unless translating)

**Infarmed Pipeline**:
Download → extract → parse flow that turns Infarmed RCM/FI PDFs into structured text for manual review before catalog updates.
_Avoid_: Scraper (alone), ETL (unqualified), import job

### App shell

**Theme Mode**:
User preference among light, dark, or system for appearance.
_Avoid_: Color scheme preference (when meaning the stored choice), skin

**Resolved Theme**:
The concrete light or dark appearance after resolving Theme Mode against the OS setting.
_Avoid_: Active scheme, effective mode

**PWA Install**:
Web-only flow offering install-to-home-screen when the browser exposes an install prompt or platform instructions.
_Avoid_: Native install, app store install

**Dose Calculation Aid**:
A guided helper for regra de três, volume to draw, and mg/kg arithmetic. Substitutes the entered numbers into a visible formula. Mode facade (schemas, label keys, and dispatch) lives behind `doseCalculations`. Not a prescribing calculator and not a keypad calculator.
_Avoid_: Dosing calculator, prescription tool, calculator keypad
