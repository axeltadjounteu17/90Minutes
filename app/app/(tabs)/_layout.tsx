/**
 * 90Minutes — Bottom Tab Layout
 * Per frontend-architecture.md: 4 tabs (Home, Match, Leaderboard, Profile)
 * Per design-system.md: icon-only tabs, orange active, grey inactive, small orange dot
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function TabLayout(): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bgNavbar,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.accentPrimary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="football" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
