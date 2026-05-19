/**
 * 90Minutes — mapEventToToast
 * Convertit un DFL_Event en ToastEvent pour affichage.
 *
 * Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9
 */

import type { ToastStyle } from '../contexts/ToastContext';

interface DFLEvent {
  type: string;
  narrative?: string;
  score?: string;
  emoji?: string;
  message?: string;
  title?: string;
  matchMinute?: number;
}

interface ToastEventInput {
  type: string;
  style: ToastStyle;
  durationMs: number;
  title: string;
  narrative?: string;
  emoji?: string;
  score?: string;
}

/**
 * Table de mapping DFL_Event type → style + durée
 */
const EVENT_MAPPING: Record<string, { style: ToastStyle; durationMs: number; emoji: string }> = {
  GOAL: { style: 'gradient-orange', durationMs: 5000, emoji: '⚽' },
  YELLOW_CARD: { style: 'solid-yellow', durationMs: 3000, emoji: '🟡' },
  RED_CARD: { style: 'solid-red', durationMs: 4000, emoji: '🔴' },
  HALFTIME: { style: 'solid-dark-blue', durationMs: 7000, emoji: '⏱️' },
  FULLTIME: { style: 'solid-green', durationMs: 5000, emoji: '🏁' },
  SUBSTITUTION: { style: 'lateral', durationMs: 3000, emoji: '🔄' },
  OFFSIDE: { style: 'minimal-bar', durationMs: 2000, emoji: '🚩' },
};

/**
 * Convertit un événement DFL en objet ToastEvent prêt à être pushé.
 */
export function mapEventToToast(event: DFLEvent): ToastEventInput {
  const mapping = EVENT_MAPPING[event.type] || {
    style: 'lateral' as ToastStyle,
    durationMs: 3000,
    emoji: '⚽',
  };

  return {
    type: event.type,
    style: mapping.style,
    durationMs: mapping.durationMs,
    title: event.narrative || event.message || event.title || event.type,
    narrative: event.narrative,
    emoji: event.emoji || mapping.emoji,
    score: event.score,
  };
}

// Export pour les tests
export { EVENT_MAPPING };
