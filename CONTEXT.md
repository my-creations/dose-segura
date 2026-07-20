# Dose Segura

Offline-first reference app for Portuguese healthcare professionals administering medications. Bundled medication data, searchable catalog, favorites, and Infarmed-sourced detail sections — not a prescribing or dosing calculator.

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

### Data sources

**Medications Index**:
Bundled JSON of Medication Summaries (`meds-index.json`) loaded eagerly for list and search.
_Avoid_: Manifest, toc, lightweight db

**Medications Full Data**:
Complete Medications dataset (`meds.json` / `meds-full.json`) providing Medication Details on demand.
_Avoid_: Payload, dump, bulk file

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
