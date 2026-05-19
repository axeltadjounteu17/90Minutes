/**
 * 90Minutes — EventCard Component
 * Displays a single match event in the feed.
 * Per frontend-architecture.md:
 * - Slides in from bottom when new (250ms)
 * - Left: emoji in colored circle
 * - Center: title + message
 * - Right: minute badge
 * - GOAL cards show KPI chips + AI narrative
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS } from '../constants/spacing';
import { MatchEventType } from '../constants/enums';
import type { EventKPIs } from '../types';

interface EventCardProps {
  /** Event type */
  type: MatchEventType;
  /** Emoji icon */
  emoji: string;
  /** Event title (e.g. "BUUUUT ! 1:0") */
  title: string;
  /** Event description */
  message: string;
  /** Match minute */
  matchMinute: number;
  /** KPI data for GOAL events */
  kpis?: EventKPIs;
  /** AI-generated narration from Bedrock */
  narrative?: string;
  /** Whether this is a newly received event (triggers animation) */
  isNew?: boolean;
}

function EventCardComponent({
  type,
  emoji,
  title,
  message,
  matchMinute,
  kpis,
  narrative,
  isNew = false,
}: EventCardProps): React.JSX.Element {
  const { theme } = useTheme();
  const translateY = useSharedValue(isNew ? 50 : 0);
  const cardOpacity = useSharedValue(isNew ? 0 : 1);

  useEffect(() => {
    if (isNew) {
      translateY.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      });
      cardOpacity.value = withTiming(1, { duration: 250 });
    }
  }, [isNew, translateY, cardOpacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: cardOpacity.value,
  }));

  /** Accent color for the emoji circle based on event type */
  const accentColor =
    type === MatchEventType.GOAL
      ? theme.accentPrimary
      : (type === MatchEventType.YELLOW_CARD || type === MatchEventType.CARD)
        ? '#FFCC00'
        : type === MatchEventType.RED_CARD
          ? '#FF3B30'
          : theme.textTertiary;

  const isGoal = type === MatchEventType.GOAL;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.bgCard },
        isGoal && { borderLeftWidth: 3, borderLeftColor: theme.accentPrimary },
        animStyle,
      ]}
    >
      <View style={styles.row}>
        {/* Emoji circle */}
        <View style={[styles.emojiCircle, { borderColor: accentColor }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
        </View>

        {/* Minute badge */}
        <View style={[styles.minuteBadge, { backgroundColor: theme.bgHover }]}>
          <Text style={[styles.minuteText, { color: theme.textSecondary }]}>
            {matchMinute}'
          </Text>
        </View>
      </View>

      {/* KPI chips for GOAL events */}
      {isGoal && kpis && (
        <View style={styles.kpiRow}>
          <KPIChip label="xG" value={kpis.xG.toFixed(2)} theme={theme} />
          <KPIChip label="Vitesse" value={`${kpis.playerSpeed.toFixed(0)}km/h`} theme={theme} />
          <KPIChip label="Zone" value={String(kpis.goalZone)} theme={theme} />
        </View>
      )}

      {/* AI Narrative */}
      {narrative && (
        <View style={[styles.narrativeContainer, { borderLeftColor: theme.accentPrimary }]}>
          <Text style={[styles.narrativeLabel, { color: theme.textTertiary }]}>🤖 IA</Text>
          <Text style={[styles.narrativeText, { color: theme.textPrimary }]}>{narrative}</Text>
        </View>
      )}
    </Animated.View>
  );
}

/** Small KPI chip displayed inside GOAL EventCards */
function KPIChip({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>['theme'];
}): React.JSX.Element {
  return (
    <View style={[styles.kpiChip, { backgroundColor: theme.bgHover }]}>
      <Text style={[styles.kpiLabel, { color: theme.textTertiary }]}>{label}</Text>
      <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

export const EventCard = React.memo(EventCardComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  emoji: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.headingSm,
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    ...TYPOGRAPHY.bodyMd,
    marginTop: 2,
  },
  minuteBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.sm,
  },
  minuteText: {
    ...TYPOGRAPHY.bodySm,
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    marginLeft: 60,
  },
  kpiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  kpiLabel: {
    ...TYPOGRAPHY.bodySm,
    fontSize: 10,
  },
  kpiValue: {
    ...TYPOGRAPHY.stat,
    fontSize: 12,
    fontWeight: '700',
  },
  narrativeContainer: {
    marginTop: SPACING.sm,
    marginLeft: 60,
    borderLeftWidth: 3,
    paddingLeft: SPACING.sm,
  },
  narrativeLabel: {
    ...TYPOGRAPHY.bodySm,
    fontSize: 10,
    marginBottom: 2,
  },
  narrativeText: {
    ...TYPOGRAPHY.bodyMd,
    fontStyle: 'italic',
  },
});
