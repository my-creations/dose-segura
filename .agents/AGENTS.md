# AGENTS.md - Dose Segura Development Guide

Dose Segura is a React Native medication management app built with Expo SDK 54, TypeScript, and Expo Router. Works offline with bundled medication data.

## Commands

### Development

```bash
bun run start          # Expo dev server
bun run android    # Android device/emulator
bun run ios        # iOS device/simulator
bun run web        # Web version
```

### Code Quality

```bash
bun run lint           # ESLint (minimal - mainly validates data/meds.json)
bun run lint:fix       # Auto-fix ESLint
bun run format         # Prettier write (spacing, newlines)
bun run format:check   # Prettier check only
bun run type-check     # TypeScript checking
bun run lint:meds      # ESLint on canonical medication data (key sort)
bun run lint:meds:fix  # Auto-fix canonical medication data
bun run generate:meds  # Regenerate index + lazy web artifact from data/meds.json
bun run validate:meds  # Validate canonical source + exact generated artifacts
```

Pre-commit (Husky): `lint-staged` (Prettier on staged files) → `type-check` → `test`.

### CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `master`:

```bash
# quality job
bun install --frozen-lockfile            # HUSKY=0
bun run lint
bun run lint:meds
bun run validate:meds
bun run type-check
bun run test -- --ci --coverage=false

# separate e2e job after quality
bunx playwright install --with-deps chromium webkit
bun run e2e
```

The exhaustive 120-Medication rendering contract runs only on Desktop Chrome. Navigation and responsive smoke coverage run on desktop and mobile browser profiles. On pushes to `master`, a final deploy job runs `bun run deploy` after quality and E2E pass, publishing the `dist/` export to the `gh-pages` branch.

### Medication Data Ownership

`data/meds.json` is the only authored Medication source. Never edit `data/meds-index.json` or `public/meds-full.json` directly; they are deterministic generated artifacts.

```bash
# After reviewing/editing data/meds.json
bun run generate:meds
bun run validate:meds
```

The Medications Index stays eagerly bundled for Search; web Medication Details remain a separate lazy-loaded asset.

### Infarmed documents (RCM/FI)

Do **not** click through INFOMED in a browser or via Playwright MCP. Fetch with:

```bash
bun run infarmed:fetch -- <medId>
```

Outputs land in `infarmed/{medId}/`. After a human/agent review of ATC/match, propose `data/meds.json` edits using `node scripts/meds-formatter.js` (there is no meds-formatter skill file). See `.agents/skills/infarmed-fetch/SKILL.md`.

### Testing

```bash
bun run test               # Jest unit/integration tests
bun run test -- path/to/test.ts    # Run specific test file
bun run test:watch     # Jest watch mode
bun run test:coverage  # Jest with coverage
bun run e2e            # Playwright E2E tests
bun run e2e:ui         # Playwright E2E with UI
bun run test:all       # Jest + Playwright
```

### Build/Deploy

```bash
bun run build:web      # Export for web
bun run build:android  # EAS build Android
bun run build:ios      # EAS build iOS
bun run deploy         # Deploy PWA to GitHub Pages
bun run verify:deploy  # Confirm public artifact matches generated web data
```

## Code Style

### Import Order

1. React/React Native (`react`, `react-native`)
2. Third-party libraries (`@expo/vector-icons`, `expo-router`)
3. Local imports with `@` alias (`@/components`, `@/constants`, `@/context`, `@/types`)

### Component Patterns

- Use functional components with TypeScript interfaces
- Destructure props with default values
- Use early returns for loading/error states
- Named exports

```typescript
interface Props {
  medication: Medication;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function MedicationCard({ medication, isFavorite = false, onToggleFavorite }: Props) {
  if (!medication) return null;
  return <View style={styles.container}>...</View>;
}
```

### Custom Hooks

- Prefix with `use`
- Include error boundaries for context hooks

```typescript
export function useMedications() {
  const context = useContext(MedicationsContext);
  if (!context) throw new Error('useMedications must be used within MedicationsProvider');
  return context;
}
```

### TypeScript

- Use interfaces for object shapes
- Use union types for string literals
- Avoid `any` type

### Styling

- Use theme hook: `const colors = Colors[useColorScheme() ?? 'light']`
- Use StyleSheet, avoid inline styles
- Quicksand font family (400, 500, 600, 700)
- 16px margins, 8px gaps, 16px border radius for cards

### File Naming

- Components: PascalCase (`MedicationCard.tsx`)
- Hooks: `useXxx.ts`
- Types: camelCase (`medication.ts`)
- Constants: PascalCase (`Colors.ts`)

### Error Handling

- Context hooks: throw if used outside provider
- Async: try-catch-finally with loading state

### Performance

- Use `useMemo` for expensive computations
- Use `useCallback` for event handlers
- Use `FlatList` with `keyExtractor` for lists

## Testing

### Jest

- Tests in `__tests__` directories or files named `*.test.ts` / `*.spec.ts`
- Use `testID` props for selectors
- Jest uses `jest-expo` preset with @testing-library
- Module alias `@/*` maps to project root
- E2E tests in `e2e/` are ignored by Jest

### Playwright E2E

- Tests in `e2e/tests/`
- Use `testID` props (maps to `data-testid` on web)
- Scope queries: `page.getByTestId('home-screen').getByTestId(...)`
- Use `test.describe`, `test.beforeEach`, `test.step`

## Architecture

### File Structure

```text
app/              # Expo Router pages (tabs, dynamic routes)
components/       # Reusable UI
context/          # React Context providers
hooks/            # Custom hooks
types/            # TypeScript definitions
constants/        # Colors, app constants
data/             # Static JSON medication data
infarmed/         # PDFs and extracted RCM/FI data
scripts/          # Extraction/parsing scripts
```

### State Management

- React Context for global state
- AsyncStorage for user preferences
- Bundled JSON for medication data

## Platform Considerations

### Web/Mobile

- Use `useSafeAreaInsets` for layout (not hardcoded heights)
- Use `Platform.select` for web-specific styles
- Minimum 44px touch targets
- GitHub Pages ignores `_` prefix (deploy script renames `_expo` to `expo_assets`)

### Accessibility

- Use `accessibilityLabel`
- Ensure contrast ratios
- Large touch targets

## Workflow

1. Run type checking before committing
2. Test on iOS, Android, and Web
3. Follow file structure and naming conventions
4. Implement proper error handling

## Avoid

- Class components
- TypeScript errors
- Hardcoded colors
- Inline styles
- Missing context error boundaries
- `any` type
- Committing without testing

## Tech Stack

- Expo SDK 54 with Expo Router 6
- React 19 + React Native 0.81
- TypeScript ~5.9
- Jest + @testing-library for unit tests
- Playwright for E2E tests
