# Testing Documentation

This document outlines the testing strategy, tools, and best practices for the Dose Segura application.

## Overview

We employ a multi-layered testing strategy to ensure application stability and correctness:

1.  **Unit & Integration Tests**: Validates individual components, hooks, and utility functions using Jest and React Native Testing Library.
2.  **Snapshot Tests**: Ensures UI consistency for base components.
3.  **End-to-End (E2E) Tests**: Simulates real user flows across Web, Android, and iOS using Playwright.

## Technology Stack

| Type | Tool | Purpose |
|------|------|---------|
| **Runner** | [Jest](https://jestjs.io/) | Test runner and assertion library. |
| **Component** | [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) | Testing React components in a way that resembles how software is used. |
| **E2E** | [Playwright](https://playwright.dev/) | Automation testing for Web and Mobile Web views. |
| **Mocks** | Jest Mocks | Mocking native modules and external dependencies. |

## Directory Structure

```
dose-segura/
├── __tests__/                  # Unit and Integration tests
│   ├── components/             # Component tests (logic & interaction)
│   ├── hooks/                  # Custom hook tests
│   └── utils/                  # Utility function tests
├── components/
│   └── __tests__/              # Snapshot tests (colocated with components)
├── e2e/                        # End-to-End tests
│   ├── tests/                  # Playwright spec files
│   └── playwright.config.ts    # Playwright configuration
└── data/                       # Static data (verified via linting)
```

## Running Tests

### Unit & Integration Tests

Run all Jest tests:
```bash
npm run test
```

Watch mode (re-runs on file change):
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

### End-to-End Tests

**Prerequisites**:
Ensure Playwright browsers are installed:
```bash
npx playwright install
```

Run E2E tests (headless):
```bash
npm run e2e
```
*Note: This command automatically starts the web server (`npm run web`) on port 8081.*

Run E2E tests with UI (debug mode):
```bash
npm run e2e:ui
```

## Writing Tests

### 1. Component Tests
We use **React Native Testing Library (RNTL)**. Focus on testing user interactions and accessible outputs rather than implementation details.

**Pattern:**
*   Render the component.
*   Use `getByText` for visible content.
*   Use `getByTestId` for specific interactive elements if text is ambiguous or dynamic.
*   Fire events using `fireEvent`.

**Example (`__tests__/components/MedicationCard.test.tsx`):**
```typescript
import { fireEvent, render } from '@testing-library/react-native';
import { MedicationCard } from '@/components/MedicationCard';

it('calls onToggleFavorite when favorite button is pressed', () => {
  const onToggleFavorite = jest.fn();
  const { getByTestId } = render(
    <MedicationCard
      medication={mockMedication}
      onToggleFavorite={onToggleFavorite}
    />
  );

  const favoriteButton = getByTestId('favorite-button');
  fireEvent.press(favoriteButton);
  expect(onToggleFavorite).toHaveBeenCalledTimes(1);
});
```

### 2. Hook Tests
Hooks often rely on Context providers. We create a test harness or wrapper to provide the necessary context.

**Example (`__tests__/hooks/useFavorites.test.tsx`):**
```typescript
import { render, waitFor } from '@testing-library/react-native';
import { FavoritesProvider, useFavorites } from '@/context/FavoritesContext';

function renderWithProvider(onReady) {
  function TestHarness() {
    const context = useFavorites();
    // Pass context out to test scope
    useEffect(() => { onReady(context); }, [context]);
    return null;
  }
  render(<FavoritesProvider><TestHarness /></FavoritesProvider>);
}
```

### 3. End-to-End (E2E) Tests
We use **Playwright**. While Playwright is primarily a web automation tool, we use it to test the Expo Web build, which shares the vast majority of logic with native platforms.

**Key Rule**: Always use `testID` props in your React Native code, and select them in Playwright using `page.getByTestId()`.

**Example (`e2e/tests/core-flow.spec.ts`):**
```typescript
test('searches for a medication', async ({ page }) => {
  await page.goto('/');
  
  // Select using testID defined in React Native component
  const searchInput = page.getByTestId('search-input');
  await searchInput.fill('Aspirin');
  
  await expect(page.getByTestId('medication-card-aspirin')).toBeVisible();
});

#### Responsive Layout Testing
We use Playwright's viewport resizing capabilities to verify that the app adapts correctly to different screen sizes (e.g., stacking vertically on mobile vs. side-by-side grids on desktop).

**Example (`e2e/tests/responsive-layout.spec.ts`):**
```typescript
test('mobile: sections stack vertically', async ({ page }) => {
  // Simulate iPhone viewport
  await page.setViewportSize({ width: 375, height: 812 });
  
  const box1 = await page.getByTestId('section-1').boundingBox();
  const box2 = await page.getByTestId('section-2').boundingBox();
  
  // Verify vertical stacking
  expect(box2.y).toBeGreaterThanOrEqual(box1.y + box1.height);
});
```

## Best Practices

### Test IDs (`testID`)
To ensure selectors work consistently across **Jest** (Unit) and **Playwright** (E2E), we use the `testID` prop on React Native components.

*   **Source Code**:
    ```tsx
    <Pressable testID="favorite-button" ... />
    ```
*   **Jest**:
    ```ts
    getByTestId('favorite-button')
    ```
*   **Playwright**:
    ```ts
    page.getByTestId('favorite-button')
    ```

**Note**: Expo Web automatically converts `testID` props into `data-testid` HTML attributes, allowing Playwright to find them.

### Mocking
Mock native dependencies that don't exist in the test environment.

**Common Mocks (`jest.setup.js` or inside test files):**
```typescript
// Mock Async Storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Color Scheme
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));
```

### Snapshot Testing
Use sparingly for dumb components to catch unintended UI regressions.
```javascript
it(`renders correctly`, () => {
  const tree = renderer.create(<MonoText>Snapshot!</MonoText>).toJSON();
  expect(tree).toMatchSnapshot();
});
```

## Troubleshooting

### Playwright Connection Refused
If `npm run e2e` fails with `net::ERR_CONNECTION_REFUSED`:
1.  Ensure the `webServer` config in `playwright.config.ts` matches the port Expo is running on (default `8081`).
2.  Increase the `timeout` in `playwright.config.ts` if the initial build takes too long.
3.  Ensure no other process is blocking port `8081`.

### Jest: "SyntaxError: Unexpected token export"
This usually means a `node_module` is not being transformed. Add the package to `transformIgnorePatterns` in `package.json` (or jest config).

Current configuration handles `expo-modules`, `react-native`, etc.
```json
"transformIgnorePatterns": [
  "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
]
```
