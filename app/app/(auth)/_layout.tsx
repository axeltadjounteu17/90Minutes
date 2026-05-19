/**
 * 90Minutes — Auth Stack Layout
 * Contains onboarding and login screens.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function AuthLayout(): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bgPrimary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
