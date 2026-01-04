# Expo Guide for React Developers 🚀

A practical guide to Expo for developers who know React and JavaScript but are new to React Native and mobile development.

---

## Table of Contents

1. [What is Expo?](#what-is-expo)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [React vs React Native](#react-vs-react-native)
6. [Styling](#styling)
7. [Navigation](#navigation)
8. [Storing Data](#storing-data)
9. [Building for Web (PWA)](#building-for-web-pwa)
10. [Building for Mobile](#building-for-mobile)
11. [Common Gotchas](#common-gotchas)
12. [Useful Resources](#useful-resources)

---

## What is Expo?

Expo is a platform built on top of React Native that makes mobile (and web) development much easier.

### React vs Expo Comparison

| React (Web) | Expo (Mobile + Web) |
|-------------|---------------------|
| Runs in browser | Runs on iOS, Android, and Web |
| Uses HTML elements (`<div>`, `<span>`) | Uses native components (`<View>`, `<Text>`) |
| CSS for styling | StyleSheet (similar to CSS-in-JS) |
| React Router | Expo Router (file-based, like Next.js) |

### Why Expo over plain React Native?

- ✅ No Xcode or Android Studio setup needed to start
- ✅ One command to run on all platforms
- ✅ Built-in libraries (camera, notifications, etc.)
- ✅ Easy OTA (over-the-air) updates
- ✅ EAS Build for app store deployment
- ✅ Web support out of the box

---

## Prerequisites

Before starting, make sure you have:

### Required

1. **Node.js 18+**
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **npm or yarn** — Comes with Node

3. **Expo Go app** — Install on your phone
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

4. **VS Code** with these extensions:
   - ES7+ React/Redux/React-Native snippets
   - Expo Tools
   - Prettier

### Optional (for later)

- **Xcode** (Mac only) — For iOS simulator
- **Android Studio** — For Android emulator

---

## Getting Started

### Create a New Project

```bash
# Create new project with tabs template
npx create-expo-app@latest my-app --template tabs

# Navigate into project
cd my-app

# Start development server
npx expo start
```

### Running Your App

After `npx expo start`, you'll see a QR code in the terminal:

| Platform | How to Run |
|----------|------------|
| **Phone** | Scan QR code with Expo Go app |
| **Web** | Press `w` in terminal |
| **iOS Simulator** | Press `i` (requires Xcode on Mac) |
| **Android Emulator** | Press `a` (requires Android Studio) |

### Hot Reloading

When you save a file, the app automatically refreshes. No need to restart!

---

## Project Structure

```
my-app/
├── app/                    # 📱 Your screens (pages)
│   ├── (tabs)/             # Tab navigation group
│   │   ├── index.tsx       # First tab (home)
│   │   ├── two.tsx         # Second tab
│   │   └── _layout.tsx     # Tab bar configuration
│   ├── modal.tsx           # Modal screen
│   ├── _layout.tsx         # Root layout (applies to all)
│   └── +not-found.tsx      # 404 page
├── assets/                 # 🖼️ Images, fonts
├── components/             # 🧩 Reusable components
├── constants/              # 🎨 Colors, sizes
├── hooks/                  # 🪝 Custom hooks
├── app.json                # ⚙️ Expo configuration
├── package.json            # 📦 Dependencies
└── tsconfig.json           # TypeScript config
```

### File-based Routing (Expo Router)

Just like Next.js, files in `app/` become routes:

| File | Route |
|------|-------|
| `app/index.tsx` | `/` (home) |
| `app/settings.tsx` | `/settings` |
| `app/medication/[id].tsx` | `/medication/123` (dynamic) |
| `app/(tabs)/index.tsx` | `/` (inside tab layout) |

### Special Files

| File | Purpose |
|------|---------|
| `_layout.tsx` | Wraps child routes (like a layout component) |
| `+not-found.tsx` | Shown for unknown routes |
| `(folder)` | Groups routes without affecting URL |

---

## React vs React Native

### Components Mapping

```jsx
// ❌ React (Web)
<div className="container">
  <h1>Hello</h1>
  <p>World</p>
  <button onClick={handleClick}>Click</button>
</div>

// ✅ React Native (Expo)
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
  <Text>World</Text>
  <Pressable onPress={handleClick}>
    <Text>Click</Text>
  </Pressable>
</View>
```

### Common Component Mapping

| Web (React) | Mobile (Expo) | Notes |
|-------------|---------------|-------|
| `<div>` | `<View>` | Container element |
| `<p>`, `<span>`, `<h1>` | `<Text>` | ALL text must be in Text! |
| `<img>` | `<Image>` | Requires width/height |
| `<button>` | `<Pressable>` | Or `<TouchableOpacity>` |
| `<input>` | `<TextInput>` | For text inputs |
| `<ul>`, `<li>` | `<FlatList>` | For lists (optimized) |
| `<a>` | `<Link>` | From expo-router |
| `<scroll>` | `<ScrollView>` | Scrollable container |

### Key Differences

1. **All text must be in `<Text>`**
   ```jsx
   // ❌ Wrong - will crash!
   <View>Hello World</View>
   
   // ✅ Correct
   <View><Text>Hello World</Text></View>
   ```

2. **No CSS classes** — Use `style` prop with objects

3. **No CSS inheritance** — Styles don't cascade to children

4. **Flexbox by default** — And `flexDirection: 'column'` by default

---

## Styling

### StyleSheet.create()

```jsx
import { StyleSheet, View, Text } from 'react-native';

export default function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
      <Text style={[styles.text, styles.bold]}>Multiple styles</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
  bold: {
    fontWeight: 'bold',
  },
});
```

### Key Styling Differences from CSS

| CSS | React Native | Notes |
|-----|--------------|-------|
| `font-size: 16px` | `fontSize: 16` | No units, camelCase |
| `background-color` | `backgroundColor` | camelCase |
| `margin: 10px 20px` | `marginVertical: 10, marginHorizontal: 20` | No shorthand |
| `border: 1px solid red` | `borderWidth: 1, borderColor: 'red'` | Separate properties |
| `box-shadow` | `shadowColor, shadowOffset, shadowOpacity` | iOS only, use `elevation` for Android |
| `flexDirection: row` | `flexDirection: 'column'` | Default is column! |

### Inline Styles

```jsx
<View style={{ padding: 10, backgroundColor: 'blue' }}>
  <Text style={{ color: 'white' }}>Inline</Text>
</View>
```

### Combining Styles

```jsx
// Array of styles (later styles override earlier)
<Text style={[styles.text, styles.bold, { color: 'red' }]}>
  Combined
</Text>
```

### Platform-Specific Styles

```jsx
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
});
```

---

## Navigation

### Basic Navigation with Link

```jsx
import { Link } from 'expo-router';

export default function Home() {
  return (
    <View>
      {/* Simple link */}
      <Link href="/settings">
        <Text>Go to Settings</Text>
      </Link>
      
      {/* Link with params */}
      <Link href="/medication/123">
        <Text>View Medication</Text>
      </Link>
      
      {/* Link styled as button */}
      <Link href="/about" asChild>
        <Pressable style={styles.button}>
          <Text>About</Text>
        </Pressable>
      </Link>
    </View>
  );
}
```

### Programmatic Navigation

```jsx
import { router } from 'expo-router';

// Navigate forward
router.push('/settings');

// Navigate with params
router.push('/medication/123');

// Go back
router.back();

// Replace current screen (no back)
router.replace('/home');

// Navigate and reset history
router.dismissAll();
```

### Reading URL Parameters

```jsx
// File: app/medication/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function MedicationDetail() {
  const { id } = useLocalSearchParams();
  
  return (
    <View>
      <Text>Medication ID: {id}</Text>
    </View>
  );
}
```

### Tab Navigation Layout

```jsx
// File: app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

## Storing Data

### AsyncStorage (Key-Value Storage)

Perfect for simple data like favorites and preferences.

```bash
npx expo install @react-native-async-storage/async-storage
```

```jsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data
const saveFavorites = async (favorites) => {
  try {
    await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving:', error);
  }
};

// Load data
const loadFavorites = async () => {
  try {
    const data = await AsyncStorage.getItem('favorites');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading:', error);
    return [];
  }
};

// Remove data
const clearFavorites = async () => {
  await AsyncStorage.removeItem('favorites');
};
```

### Custom Hook Example

```jsx
// hooks/useFavorites.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const data = await AsyncStorage.getItem('favorites');
    if (data) setFavorites(JSON.parse(data));
  };

  const addFavorite = async (id: string) => {
    const updated = [...favorites, id];
    setFavorites(updated);
    await AsyncStorage.setItem('favorites', JSON.stringify(updated));
  };

  const removeFavorite = async (id: string) => {
    const updated = favorites.filter(f => f !== id);
    setFavorites(updated);
    await AsyncStorage.setItem('favorites', JSON.stringify(updated));
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
```

---

## Building for Web (PWA)

### 1. Configure app.json

```json
{
  "expo": {
    "name": "My App",
    "slug": "my-app",
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### 2. Run on Web

```bash
# Development
npx expo start --web

# Or press 'w' after npx expo start
```

### 3. Build for Production

```bash
npx expo export --platform web
```

This creates a `dist/` folder ready for deployment.

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd dist
vercel
```

### 5. Add PWA Support

Create `public/manifest.json`:

```json
{
  "name": "Dose Segura",
  "short_name": "DoseSegura",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0066cc",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Building for Mobile

### 1. Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### 2. Configure EAS

```bash
eas build:configure
```

This creates `eas.json` with build profiles.

### 3. Development Build

For testing with Expo dev client:

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### 4. Production Build

For app store submission:

```bash
# iOS (requires Apple Developer account)
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### 5. Submit to App Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

---

## Essential Commands

```bash
# Start development server
npx expo start

# Start with cache cleared (fixes bugs)
npx expo start --clear

# Install a library (always use this!)
npx expo install <package-name>

# Check for issues
npx expo-doctor

# Upgrade Expo SDK
npx expo install expo@latest

# Export for web
npx expo export --platform web

# Build with EAS
eas build --platform all
```

---

## Common Gotchas

### 1. Text Not Showing

```jsx
// ❌ Crashes!
<View>Hello</View>

// ✅ Works
<View><Text>Hello</Text></View>
```

### 2. Use `npx expo install`

```bash
# ❌ May cause version conflicts
npm install some-package

# ✅ Installs compatible version
npx expo install some-package
```

### 3. Images Need Dimensions

```jsx
// ❌ Won't show
<Image source={require('./image.png')} />

// ✅ Works
<Image 
  source={require('./image.png')} 
  style={{ width: 100, height: 100 }}
/>
```

### 4. FlatList vs ScrollView

```jsx
// ❌ Bad for long lists (renders all items)
<ScrollView>
  {items.map(item => <Item key={item.id} />)}
</ScrollView>

// ✅ Good for long lists (virtualized)
<FlatList
  data={items}
  renderItem={({ item }) => <Item item={item} />}
  keyExtractor={item => item.id}
/>
```

### 5. Keyboard Covering Input

```jsx
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView 
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  <TextInput placeholder="Type here" />
</KeyboardAvoidingView>
```

### 6. Safe Area (Notches)

```jsx
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={{ flex: 1 }}>
  {/* Content won't be hidden by notch */}
</SafeAreaView>
```

---

## Useful Resources

### Official Documentation

- 📚 [Expo Docs](https://docs.expo.dev) — Main documentation
- 🗺️ [Expo Router](https://docs.expo.dev/router/introduction/) — Navigation
- 📦 [Expo SDK](https://docs.expo.dev/versions/latest/) — All APIs

### Learning

- 🎮 [Expo Snack](https://snack.expo.dev) — Online playground
- 🎬 [Expo YouTube](https://www.youtube.com/@expo_dev) — Video tutorials
- 📖 [React Native Docs](https://reactnative.dev/docs/getting-started)

### Finding Libraries

- 🔍 [React Native Directory](https://reactnative.directory) — Curated packages
- 💬 [Expo Discord](https://chat.expo.dev) — Community help

### Tools

- 🎨 [Expo Icons](https://icons.expo.fyi) — Icon browser
- 📱 [Expo Go](https://expo.dev/client) — Test on device

---

## Quick Reference

### Import Cheatsheet

```jsx
// Core components
import { View, Text, Image, ScrollView, FlatList } from 'react-native';
import { Pressable, TouchableOpacity } from 'react-native';
import { TextInput, StyleSheet, Platform } from 'react-native';

// Navigation
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Stack, Tabs } from 'expo-router';

// Icons
import { Ionicons } from '@expo/vector-icons';

// Safe area
import { SafeAreaView } from 'react-native-safe-area-context';

// Storage
import AsyncStorage from '@react-native-async-storage/async-storage';
```

### Style Cheatsheet

```jsx
const styles = StyleSheet.create({
  // Centering
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow (Android)
    elevation: 3,
  },
  
  // Button
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Input
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
```

---

## Next Steps for Dose Segura

1. ✅ Read through this guide
2. Run `npx expo start` and explore the starter code
3. Modify the home tab to display a list
4. Create a detail screen with dynamic routing
5. Add AsyncStorage for favorites
6. Test on web with `w` key

Good luck! 🏥💊
