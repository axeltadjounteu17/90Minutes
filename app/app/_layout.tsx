/**
 * 90Minutes — Root Layout
 * Per frontend-architecture.md: Root layout handles font loading and ThemeProvider.
 * Per theming.md: ThemeProvider wraps the entire app.
 * Per i18n-languages.md: i18n is initialized before rendering.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import { RoomProvider } from '../src/contexts/RoomContext';
import ToastContainer from '../src/components/ToastContainer';
import i18n from '../src/i18n';

/** Inner layout that uses theme context */
function RootLayoutInner(): React.JSX.Element {
  const { theme, isDark } = useTheme();
  const { hydrated } = useAuth();

  useEffect(() => {
    AsyncStorage.getItem('prefs.language').then((lang) => {
      if (lang) {
        i18n.changeLanguage(lang);
      }
    });
  }, []);

  // Bloquer le navigator tant que l'hydratation n'est pas terminée
  if (!hydrated) {
    return <View style={styles.loading} />;
  }

  return (
    <>
      <ToastContainer />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bgPrimary },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout(): React.JSX.Element {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RoomProvider>
          <ToastProvider>
            <RootLayoutInner />
          </ToastProvider>
        </RoomProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});
