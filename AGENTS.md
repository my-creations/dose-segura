# AGENTS.md - Dose Segura Development Guide

This guide provides essential information for agentic coding agents working on the Dose Segura medication management app.

## Project Overview

**Dose Segura** is a React Native medication management application built with Expo SDK 54, TypeScript, and file-based routing via Expo Router. The app works completely offline with bundled medication data.

### Technology Stack
- **Framework**: Expo SDK 54+ with React Native 0.81.5
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Storage**: AsyncStorage for user preferences
- **Styling**: React Native StyleSheet with custom theming
- **Icons**: @expo/vector-icons (Ionicons)
- **Fonts**: Quicksand family via @expo-google-fonts/quicksand

## Build, Lint, and Test Commands

### Development
```bash
npm start          # Start Expo development server
npm run android    # Start on Android device/emulator
npm run ios        # Start on iOS device/simulator
npm run web        # Start web version
```

### Code Quality
```bash
npm run lint       # Run ESLint on project files
npm run lint:fix   # Auto-fix ESLint issues
npm run type-check # TypeScript type checking
npm run lint:meds  # Run ESLint on medication data
npm run lint:meds:fix # Auto-fix ESLint issues in medication data
```

### Data Extraction (Infarmed)
```bash
brew install poppler
node scripts/extract-infarmed-med.js <medId>
node scripts/parse-infarmed-text.js <medId> --best-match
```

### Testing
```bash
npm test           # Run Jest unit/integration tests
npm run test:watch # Run Jest tests in watch mode
npm run test:coverage # Run Jest tests with coverage
npm run test:single <test-file>  # Run single Jest test file
npm run e2e        # Run Playwright E2E tests
npm run e2e:ui     # Run Playwright E2E tests with UI
npm run test:all   # Run both Jest and Playwright tests
```

### Building
```bash
npm run build:web  # Export for web
npm run build:android # EAS build for Android
npm run build:ios  # EAS build for iOS
npm run deploy     # Deploy PWA to GitHub Pages
```

## Code Style Guidelines

### Import Organization
Always organize imports in this specific order:

```typescript
// 1. React/React Native imports
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// 2. Third-party library imports
import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from 'expo-router';

// 3. Local imports (use @ alias)
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useMedications } from '@/context/MedicationsContext';
import { Medication } from '@/types/medication';
```

### Component Patterns

#### Functional Components
- Use functional components with TypeScript interfaces
- Destructure props with default values
- Use early returns for loading/error states
- Export components as named exports

```typescript
interface MedicationCardProps {
  medication: Medication;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function MedicationCard({ 
  medication, 
  isFavorite = false, 
  onToggleFavorite 
}: MedicationCardProps) {
  // Early return for loading state
  if (!medication) return null;
  
  // Component logic
  return (
    <View style={styles.container}>
      {/* Component JSX */}
    </View>
  );
}
```

#### Custom Hooks
- Prefix with `use`
- Return consistent tuple or object patterns
- Include error boundaries for context hooks

```typescript
export function useMedications() {
  const context = useContext(MedicationsContext);
  if (context === undefined) {
    throw new Error("useMedications must be used within a MedicationsProvider");
  }
  return context;
}
```

### TypeScript Patterns

#### Type Definitions
- Use interfaces for object shapes
- Use union types for string literals
- Create generic components with prop interfaces

```typescript
// Interface for complex objects
interface Medication {
  id: string;
  name: string;
  dosage: string;
  category: MedicationCategory;
}

// Union types for enums
type MedicationCategory = 'analgesic' | 'antibiotic' | 'anti-inflammatory';

// Generic component props
interface ThemedComponentProps<T = {}> {
  children: React.ReactNode;
  style?: ViewStyle;
} & T
```

### Styling Conventions

#### Theme Usage
- Always use the theme hook for colors
- Support both light and dark themes
- Use consistent spacing and typography

```typescript
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export function Component() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      padding: 16,
    },
    text: {
      color: colors.text,
      fontFamily: 'Quicksand-Medium',
    }
  });
}
```

#### Design System
- **Colors**: Use Colors object from constants
- **Typography**: Quicksand font family (400, 500, 600, 700)
- **Spacing**: 16px margins, 8px gaps
- **Border Radius**: 16px for cards, 12px for badges

### File Naming Conventions
- **Components**: PascalCase (`MedicationCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useFavorites.ts`)
- **Types**: camelCase (`medication.ts`)
- **Constants**: PascalCase (`Colors.ts`)
- **Screens**: PascalCase (`MedicationDetail.tsx`)

### Error Handling Patterns

#### Context Error Boundaries
Always include error boundaries for context hooks:

```typescript
export function useCustomContext() {
  const context = useContext(CustomContext);
  if (context === undefined) {
    throw new Error("useCustomContext must be used within a CustomProvider");
  }
  return context;
}
```

#### Async Error Handling
Use try-catch-finally for async operations:

```typescript
const loadData = async () => {
  setIsLoading(true);
  try {
    const data = await AsyncStorage.getItem(KEY);
    // Process data
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### Performance Guidelines

#### Memoization
- Use `useMemo` for expensive computations
- Use `useCallback` for event handlers
- Memoize context values to prevent unnecessary re-renders

```typescript
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

const handlePress = useCallback(() => {
  // Handle press
}, [dependency]);
```

#### List Optimization
- Use `FlatList` for long lists
- Implement `keyExtractor` for unique keys
- Use `getItemLayout` when possible for performance

### Testing Guidelines

#### Unit & Integration Tests (Jest)
- Place tests in `__tests__` directories
- Use descriptive test names
- Test component behavior, not implementation

```typescript
// components/__tests__/MedicationCard-test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MedicationCard } from '../MedicationCard';

describe('MedicationCard', () => {
  it('renders medication information correctly', () => {
    const medication = { id: '1', name: 'Aspirin', dosage: '100mg' };
    const { getByText } = render(<MedicationCard medication={medication} />);
    
    expect(getByText('Aspirin')).toBeTruthy();
    expect(getByText('100mg')).toBeTruthy();
  });
});
```

#### E2E Tests (Playwright)
- Place tests in `e2e/tests/` directory
- Use `testID` props for reliable selectors (maps to `data-testid` on web)
- **Structure**:
  - Use `test.describe` to group tests
  - Use `test.beforeEach` for navigation and setup
  - Use `test.step` to group logical actions within a test
  - Add blank lines between invocations/declarations for readability
- **Selectors**:
  - Scope queries to root screen elements to avoid ambiguity (e.g., `page.getByTestId('home-screen').getByTestId(...)`)
- **Variables**:
  - Inline constants if used only once
  - Define constants at the top of the file if used multiple times

```typescript
import { expect, test } from '@playwright/test';

test.describe('Feature Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('performs a specific action', async ({ page }) => {
    await test.step('Perform step 1', async () => {
      const input = page.getByTestId('search-input');

      await expect(input).toBeVisible();
      await input.fill('Query');
    });

    await test.step('Verify result', async () => {
      // Inline selector usage for single use
      await page.getByTestId('submit-button').click();

      await expect(page.getByTestId('result-card')).toBeVisible();
    });
  });
});
```

### Architecture Guidelines

#### File Structure
```
app/                    # Expo Router pages
├── (tabs)/            # Tab navigation screens
├── medication/[id].tsx # Dynamic routes
└── _layout.tsx        # Root layout with providers

components/            # Reusable UI components
context/              # React Context providers
hooks/                # Custom React hooks
types/                # TypeScript definitions
constants/           # Colors and app constants
data/                # Static JSON data
infarmed/             # PDFs and extracted RCM/FI data
scripts/              # Extraction and parsing scripts
```

#### State Management
- Use React Context for global state
- Create custom hooks for context access
- Store user preferences in AsyncStorage
- Keep medication data in bundled JSON files

### Platform-Specific Considerations

#### Web vs Mobile
- Use `Platform.OS` for platform-specific logic but prefer `useSafeAreaInsets` for layout spacing
- Adjust UI for different screen sizes
- Consider touch target sizes (minimum 44px)
- Test on all target platforms

#### PWA & Web Specifics
- **Safe Area**: Use `react-native-safe-area-context` instead of hardcoded heights. PWA on iOS has a home indicator just like native apps.
  ```typescript
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  const insets = useSafeAreaInsets();
  // height: 60 + insets.bottom
  ```
- **Input Styles**: Web inputs often have default outlines and backgrounds that conflict with app design.
  ```typescript
  ...Platform.select({
    web: { outlineStyle: 'none' } as any
  })
  ```
- **GitHub Pages**: Remember that GitHub Pages ignores `_` prefixed folders. The deploy script handles this by renaming `_expo` to `expo_assets`.

#### Accessibility
- Use accessibilityLabel for screen readers
- Ensure proper contrast ratios
- Provide large touch targets
- Use semantic HTML elements on web

### Common Patterns to Follow

#### Search Implementation
```typescript
const filteredMedications = useMemo(() => {
  if (!searchQuery) return medications;
  
  const normalizedQuery = searchQuery.toLowerCase().normalize('NFD');
  return medications.filter(med => 
    med.name.toLowerCase().normalize('NFD').includes(normalizedQuery)
  );
}, [medications, searchQuery]);
```

#### Navigation Patterns
```typescript
// Use Expo Router for navigation
import { Link } from 'expo-router';

// Dynamic routes
<Link href={`/medication/${medication.id}`}>
  <Text>{medication.name}</Text>
</Link>
```

### Development Workflow

1. **Always run type checking** before committing
2. **Test on multiple platforms** (iOS, Android, Web)
3. **Follow the established file structure**
4. **Use consistent naming conventions**
5. **Implement proper error handling**
6. **Consider performance implications**
7. **Maintain accessibility standards**

### Things to Avoid

- Don't use class components (use functional components)
- Don't ignore TypeScript errors
- Don't hardcode colors (use the theme system)
- Don't use inline styles (use StyleSheet)
- Don't forget error boundaries for context
- Don't use `any` type (use proper TypeScript types)
- Don't commit without testing

This guide should be followed consistently to maintain code quality and ensure a smooth development experience across the Dose Segura codebase.
