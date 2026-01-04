# Dose Segura — Project Plan 💊

## Vision

A simple, good-looking mobile and web app that helps nurses quickly access medication administration information. Built with Expo for cross-platform support (iOS, Android, Web/PWA).

**Core Principle:** Offline-first. All medication data is bundled with the app — works instantly, anywhere, without internet.

---

## Target Users

- Hospital nurses
- Home care nurses
- Nursing students
- Pharmacists (secondary)

---

## Core Features

### MVP (Phase 1)

| Feature | Description |
|---------|-------------|
| **Medication Search** | Fast autocomplete search by drug name and aliases |
| **Drug Details View** | Display all fields: classification, compatibility, preparation, administration, stability, contraindications, nursing care |
| **Favorites** | Save frequently used medications |
| **Offline Mode** | 100% offline — data bundled with app |
| **PWA Support** | Installable on any device via browser |

### Phase 2

| Feature | Description |
|---------|-------------|
| **Barcode Scanner** | Scan medication packaging for instant lookup |
| **Dosage Calculator** | Weight-based (mg/kg) and drip rate calculations |
| **IV Compatibility Checker** | Check if two drugs can be mixed |
| **Dark Mode** | For night shift nurses |
| **Multi-language** | Portuguese / English toggle |

### Phase 3

| Feature | Description |
|---------|-------------|
| **User Accounts** | Sync favorites across devices |
| **Shift Notes** | Personal annotations per medication |
| **Push Notifications** | Drug recall alerts, updates |
| **Admin Panel** | Web interface to manage medication database |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 52+ |
| Language | TypeScript |
| Navigation | Expo Router |
| Styling | React Native StyleSheet |
| Storage | AsyncStorage (user preferences, favorites) |
| State | React Context |
| Icons | @expo/vector-icons |
| PWA | Expo web export |

---

## Offline-First Architecture

### Why Bundled JSON?

| ✅ Advantages | Details |
|--------------|---------|
| **100% Offline** | Works in basements, rural clinics, areas with poor signal |
| **Instant Load** | No network latency, data is already on device |
| **Simple Architecture** | No backend, no database, no sync logic |
| **Reliable** | No server downtime, no API failures |
| **Privacy** | No patient/usage data leaves the device |
| **Low Cost** | No hosting, no database, no API costs |

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│                    App Bundle                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │  data/meds.json (bundled at build time)         │ │
│  └─────────────────────────────────────────────────┘ │
│                        │                             │
│                        ▼                             │
│  ┌─────────────────────────────────────────────────┐ │
│  │  App loads JSON on startup                      │ │
│  │  → Store in memory (React Context)              │ │
│  └─────────────────────────────────────────────────┘ │
│                        │                             │
│                        ▼                             │
│  ┌─────────────────────────────────────────────────┐ │
│  │  AsyncStorage (for user data only)              │ │
│  │  → Favorites                                    │ │
│  │  → Recent searches                              │ │
│  │  → User preferences                             │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Data Update Strategy

- **Primary:** App store updates (guaranteed offline, simplest)
- **Future:** Optional "check for updates" button when online

---

## Data Architecture

### JSON Schema

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-04",
  "medications": {
    "medication-id": {
      "id": "medication-id",
      "name": "Medication Name",
      "aliases": ["Alternative Name 1", "Brand Name"],
      "highRisk": false,
      "classification": ["Category 1", "Category 2"],
      "compatibility": ["Compatible Solution 1"],
      "presentationAndStorage": ["Presentation info"],
      "preparation": ["Preparation instructions"],
      "administration": ["Administration routes and methods"],
      "stability": ["Stability information"],
      "contraindicationsAndPrecautions": ["Warning 1", "Warning 2"],
      "nursingCare": ["Care instruction 1", "Care instruction 2"]
    }
  }
}
```

### Field Descriptions

| Field | Purpose |
|-------|---------|
| `version` | Track data updates |
| `lastUpdated` | Display freshness to users |
| `id` | URL-safe identifier for routing |
| `name` | Properly formatted display name |
| `aliases` | Alternative names for better search |
| `highRisk` | Flag dangerous drugs (show warning badge) |

---

## Project Structure

```
dose-segura/
├── app/                    # Expo Router pages
│   ├── (tabs)/             # Tab navigation
│   │   ├── index.tsx       # Home/Search
│   │   ├── favorites.tsx   # Saved medications
│   │   └── _layout.tsx     # Tab bar config
│   ├── medication/
│   │   └── [id].tsx        # Medication detail page
│   └── _layout.tsx         # Root layout
├── components/             # Reusable UI components
│   ├── SearchBar.tsx
│   ├── MedicationCard.tsx
│   └── SectionAccordion.tsx
├── context/                # React Context providers
│   └── MedicationsContext.tsx
├── data/
│   └── meds.json           # Medication database
├── hooks/                  # Custom React hooks
│   ├── useMedications.ts
│   └── useFavorites.ts
├── types/                  # TypeScript types
│   └── medication.ts
├── utils/                  # Helper functions
│   └── search.ts
├── constants/              # Colors, sizes
│   └── Colors.ts
├── assets/                 # Images, fonts
├── app.json                # Expo config
└── package.json
```

---

## UI/UX Principles

1. **Speed First** — Nurses need info in seconds, not minutes
2. **Large Touch Targets** — Minimum 44x44pt for buttons
3. **High Contrast** — Readable in bright hospital lighting
4. **Collapsible Sections** — Don't overwhelm, let users expand what they need
5. **Visual Hierarchy** — Critical info (contraindications) highlighted in red/orange
6. **Offline Indicator** — Clear badge showing data version

---

## Development Roadmap

### Week 1-2: Foundation

- [ ] Initialize Expo project with TypeScript
- [ ] Set up Expo Router navigation
- [ ] Create basic UI components
- [ ] Import and parse meds.json
- [ ] Build medication list and detail screens

### Week 3-4: Core Features

- [ ] Implement search with autocomplete
- [ ] Add favorites functionality
- [ ] Set up AsyncStorage for persistence
- [ ] Style refinement

### Week 5-6: Polish & PWA

- [ ] Dark mode support
- [ ] Configure PWA (manifest, icons)
- [ ] Testing on iOS, Android, and Web
- [ ] Performance optimization

### Week 7-8: Beta & Feedback

- [ ] Deploy web version
- [ ] Build mobile apps (EAS Build)
- [ ] Gather feedback from nurses
- [ ] Iterate based on feedback

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Medical data accuracy | Add disclaimer: "Verify with pharmacy before administration" |
| Large medication database | Use indexed search, lazy loading |
| Cross-platform UI differences | Platform-specific tweaks where needed |

---

## Success Metrics

- Search to result: < 2 seconds
- App load time: < 3 seconds
- Offline availability: 100%
- User satisfaction: 4+ stars

---

## Disclaimer

This app is intended as a reference tool only. Always verify medication information with official sources and pharmacy before administration.

---

## License

To be determined
