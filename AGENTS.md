# AGENTS.md - Dose Segura Development Guide

Dose Segura is a React Native medication management app built with Expo SDK 54, TypeScript, and Expo Router. Works offline with bundled medication data.

## Commands

### Development
```bash
npm start          # Expo dev server
npm run android    # Android device/emulator
npm run ios        # iOS device/simulator
npm run web        # Web version
```

### Code Quality

```bash
npm run lint           # ESLint (minimal - mainly validates data/meds.json)
npm run lint:fix       # Auto-fix ESLint
npm run type-check     # TypeScript checking
npm run lint:meds      # ESLint on medication data
npm run lint:meds:fix  # Auto-fix medication data
```

### Testing
```bash
npm test               # Jest unit/integration tests
npm test -- path/to/test.ts    # Run specific test file
npm run test:watch     # Jest watch mode
npm run test:coverage  # Jest with coverage
npm run e2e            # Playwright E2E tests
npm run e2e:ui         # Playwright E2E with UI
npm run test:all       # Jest + Playwright
```

### Build/Deploy
```bash
npm run build:web      # Export for web
npm run build:android  # EAS build Android
npm run build:ios      # EAS build iOS
npm run deploy         # Deploy PWA to GitHub Pages
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
  if (!context) throw new Error("useMedications must be used within MedicationsProvider");
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
```
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
