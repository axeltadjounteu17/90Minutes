/**
 * 90Minutes — ToastContainer
 * Affiche les toasts en haut de l'écran avec animations et haptics.
 *
 * Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useToast, ToastEvent, ToastStyle } from '../contexts/ToastContext';

// ─────────────────────────────────────────
// Couleurs par style
// ─────────────────────────────────────────

const STYLE_COLORS: Record<ToastStyle, { bg: string; text: string }> = {
  'gradient-orange': { bg: '#FF6B00', text: '#FFFFFF' },
  'solid-yellow': { bg: '#FFB800', text: '#0A0A0A' },
  'solid-red': { bg: '#E3001B', text: '#FFFFFF' },
  'solid-dark-blue': { bg: '#1A237E', text: '#FFFFFF' },
  'solid-green': { bg: '#2E7D32', text: '#FFFFFF' },
  'lateral': { bg: '#333333', text: '#FFFFFF' },
  'minimal-bar': { bg: '#555555', text: '#FFFFFF' },
};

function ToastCard({ toast }: { toast: ToastEvent }) {
  const colors = STYLE_COLORS[toast.style] || STYLE_COLORS['lateral'];

  // Haptics pour RED_CARD — natif uniquement (Haptics ne fonctionne pas sur le web)
  React.useEffect(() => {
    if (toast.type === 'RED_CARD' && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {
        // ignore : pas de support haptique sur cet appareil
      });
    }
  }, [toast.type]);

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.card, { backgroundColor: colors.bg }]}
    >
      <Text style={[styles.emoji]}>{toast.emoji || '⚽'}</Text>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{toast.title}</Text>
        {toast.narrative && (
          <Text style={[styles.narrative, { color: colors.text }]} numberOfLines={2}>
            {toast.narrative}
          </Text>
        )}
      </View>
      {toast.score && (
        <Text style={[styles.score, { color: colors.text }]}>{toast.score}</Text>
      )}
    </Animated.View>
  );
}

export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emoji: {
    fontSize: 24,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  narrative: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  score: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
});
