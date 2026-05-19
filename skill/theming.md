# 90Minutes — Theming (Dark & Light Mode)

## OVERVIEW

The app MUST support two themes: **Dark** (default) and **Light**.
The user can switch themes via Settings. The app must also respect the system OS preference on first launch.

Use React Native's `useColorScheme()` hook + a custom `ThemeProvider` context.

---

## THEME TOKENS

### Dark Theme (DEFAULT)

```typescript
const darkTheme = {
  name: 'dark',

  // Backgrounds
  bgPrimary: '#000000',        // Screen background (Adidas black)
  bgCard: '#111111',           // Card surfaces
  bgElevated: '#1A1A1A',      // Modals, elevated cards
  bgInput: '#1E1E1E',         // Input fields
  bgHover: '#2A2A2A',         // Press/hover states
  bgNavbar: '#000000',        // Bottom nav, headers

  // Text
  textPrimary: '#FFFFFF',      // Headings, main text
  textSecondary: '#999999',    // Subtitles, labels
  textTertiary: '#666666',     // Timestamps, metadata
  textDisabled: '#444444',     // Disabled states
  textOnAccent: '#000000',     // Text on orange buttons

  // Accents (SAME in both themes — brand identity)
  accentPrimary: '#FF9900',    // AWS Orange — CTAs, points, highlights
  accentSecondary: '#D0021B',  // Bundesliga Red — live, alerts, cards
  accentWarm: '#FF6B00',       // Pressed orange state

  // Semantic
  success: '#00C853',          // Connected, correct
  warning: '#FFC107',          // Yellow card, caution
  danger: '#D0021B',           // Red card, errors
  live: '#D0021B',             // Live indicator

  // Borders & Separators
  border: '#1A1A1A',           // Subtle borders
  separator: 'rgba(255,255,255,0.06)',

  // Shadows
  shadowCard: '0 2px 8px rgba(0, 0, 0, 0.4)',
  shadowElevated: '0 8px 32px rgba(0, 0, 0, 0.6)',
  glowOrange: '0 0 20px rgba(255, 153, 0, 0.3)',
  glowRed: '0 0 12px rgba(208, 2, 27, 0.5)',
};
```

### Light Theme

```typescript
const lightTheme = {
  name: 'light',

  // Backgrounds
  bgPrimary: '#F5F5F5',       // Screen background (warm light grey)
  bgCard: '#FFFFFF',           // Card surfaces (pure white)
  bgElevated: '#FFFFFF',       // Modals, elevated cards
  bgInput: '#F0F0F0',         // Input fields
  bgHover: '#E8E8E8',         // Press/hover states
  bgNavbar: '#FFFFFF',        // Bottom nav, headers

  // Text
  textPrimary: '#111111',      // Headings, main text (near black)
  textSecondary: '#666666',    // Subtitles, labels
  textTertiary: '#999999',     // Timestamps, metadata
  textDisabled: '#CCCCCC',     // Disabled states
  textOnAccent: '#000000',     // Text on orange buttons (SAME)

  // Accents (SAME — brand colors never change)
  accentPrimary: '#FF9900',    // AWS Orange
  accentSecondary: '#D0021B',  // Bundesliga Red
  accentWarm: '#FF6B00',       // Pressed orange

  // Semantic (SAME)
  success: '#00C853',
  warning: '#FFC107',
  danger: '#D0021B',
  live: '#D0021B',

  // Borders & Separators
  border: '#E0E0E0',
  separator: 'rgba(0,0,0,0.08)',

  // Shadows
  shadowCard: '0 2px 8px rgba(0, 0, 0, 0.08)',
  shadowElevated: '0 8px 32px rgba(0, 0, 0, 0.12)',
  glowOrange: '0 0 20px rgba(255, 153, 0, 0.2)',
  glowRed: '0 0 12px rgba(208, 2, 27, 0.3)',
};
```

---

## IMPLEMENTATION PATTERN

### ThemeProvider (React Context)

```typescript
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeName = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: typeof darkTheme;
  themeName: ThemeName;
  isDark: boolean;
  setTheme: (name: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>(/* ... */);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'dark' | 'light'
  const [userPreference, setUserPreference] = useState<ThemeName>('system');

  const isDark = userPreference === 'system'
    ? systemScheme === 'dark'
    : userPreference === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  // Persist user preference
  useEffect(() => {
    AsyncStorage.getItem('theme').then(saved => {
      if (saved) setUserPreference(saved as ThemeName);
    });
  }, []);

  const setTheme = (name: ThemeName) => {
    setUserPreference(name);
    AsyncStorage.setItem('theme', name);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName: userPreference, isDark, setTheme, toggleTheme: () => setTheme(isDark ? 'light' : 'dark') }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### Usage in Components

```typescript
// ✅ ALWAYS use theme tokens, NEVER hardcode colors
function MatchCard() {
  const { theme } = useTheme();

  return (
    <View style={{
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 16,
    }}>
      <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>
        FCT 2 : 1 CLU
      </Text>
      <Text style={{ color: theme.textSecondary }}>
        67' · En direct
      </Text>
    </View>
  );
}
```

---

## RULES

1. **NEVER hardcode colors** — always use `theme.tokenName`
2. **Accent colors NEVER change** between themes — #FF9900 and #D0021B stay the same
3. **Default is Dark** — matches Adidas brand identity
4. **System preference respected** on first launch
5. **Smooth transition** — use `LayoutAnimation` when theme switches
6. **StatusBar** adapts: `light-content` (dark theme) / `dark-content` (light theme)
7. **Navigation bar** adapts: black bg (dark) / white bg (light)
