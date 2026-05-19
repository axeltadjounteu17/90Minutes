/**
 * 90Minutes — Splash / Entry Screen
 * Auto-redirects to onboarding (first time) or home (returning user).
 */

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { TYPOGRAPHY } from '../src/constants/typography';

export default function SplashScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;

    const timer = setTimeout(() => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [router, user, hydrated]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <Text style={styles.logo}>⚽</Text>
      <Text style={[styles.appName, { color: theme.textPrimary }]}>90Minutes</Text>
      <ActivityIndicator
        size="small"
        color={theme.accentPrimary}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    ...TYPOGRAPHY.displayLg,
    fontSize: 36,
  },
  spinner: {
    marginTop: 32,
  },
});
