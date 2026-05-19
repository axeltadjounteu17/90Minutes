/**
 * 90Minutes — Theme Provider
 * Per theming.md: supports Dark (default), Light, and System preference.
 * NEVER hardcode colors — always use theme tokens via useTheme().
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../constants/theme';
import type { Theme } from '../constants/theme';

type ThemeName = 'dark' | 'light' | 'system';

interface ThemeContextType {
  /** Current resolved theme object */
  theme: Theme;
  /** User's theme preference */
  themeName: ThemeName;
  /** Whether the current resolved theme is dark */
  isDark: boolean;
  /** Set theme preference */
  setTheme: (name: ThemeName) => void;
  /** Toggle between dark and light */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  themeName: 'system',
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme();
  const [userPreference, setUserPreference] = useState<ThemeName>('system');

  const isDark = useMemo(() => {
    if (userPreference === 'system') {
      return systemScheme !== 'light';
    }
    return userPreference === 'dark';
  }, [userPreference, systemScheme]);

  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  const setTheme = useCallback((name: ThemeName) => {
    setUserPreference(name);
    // TODO: persist with AsyncStorage when installed
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const value = useMemo<ThemeContextType>(
    () => ({ theme, themeName: userPreference, isDark, setTheme, toggleTheme }),
    [theme, userPreference, isDark, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Hook to access current theme. Per theming.md: use this in every component. */
export const useTheme = (): ThemeContextType => useContext(ThemeContext);
