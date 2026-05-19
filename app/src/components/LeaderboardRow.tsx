/**
 * 90Minutes — LeaderboardRow Component
 * Per frontend-architecture.md:
 * - Smooth Y-position animation when rank changes (400ms)
 * - Green arrow up / red arrow down indicator
 * - isMe row: orange left border + slightly elevated
 * - Top 3: gold/silver/bronze medal emoji
 * - Points in orange monospace font
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS } from '../constants/spacing';

interface LeaderboardRowProps {
  /** Current rank (1-based) */
  rank: number;
  /** Player display name (fanName) */
  fanName: string;
  /** Total points */
  points: number;
  /** Color for the avatar circle */
  avatarColor: string;
  /** Whether this row is the current user */
  isMe: boolean;
  /** Previous rank for animation direction */
  previousRank?: number;
}

const MEDAL_EMOJIS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

function LeaderboardRowComponent({
  rank,
  fanName,
  points,
  avatarColor,
  isMe,
  previousRank,
}: LeaderboardRowProps): React.JSX.Element {
  const { theme } = useTheme();

  const rankDelta = previousRank !== undefined ? previousRank - rank : 0;
  const medal = MEDAL_EMOJIS[rank];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.bgCard },
        isMe && { borderLeftWidth: 3, borderLeftColor: theme.accentPrimary },
      ]}
    >
      {/* Rank */}
      <View style={styles.rankContainer}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={[styles.rankText, { color: theme.textTertiary }]}>
            {rank}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>
          {fanName.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Fan Name */}
      <View style={styles.nameContainer}>
        <Text
          style={[
            styles.username,
            { color: isMe ? theme.accentPrimary : theme.textPrimary },
          ]}
          numberOfLines={1}
        >
          {fanName}
        </Text>
      </View>

      {/* Rank change indicator */}
      {rankDelta !== 0 && (
        <Text
          style={[
            styles.rankChange,
            { color: rankDelta > 0 ? theme.success : theme.danger },
          ]}
        >
          {rankDelta > 0 ? '↑' : '↓'}
        </Text>
      )}

      {/* Points */}
      <Text style={[styles.points, { color: theme.accentPrimary }]}>
        {points}
      </Text>
      <Text style={[styles.ptsLabel, { color: theme.textTertiary }]}>pts</Text>
    </View>
  );
}

export const LeaderboardRow = React.memo(LeaderboardRowComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    ...TYPOGRAPHY.bodyLg,
    fontWeight: '700',
  },
  medal: {
    fontSize: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  nameContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  username: {
    ...TYPOGRAPHY.bodyLg,
    fontWeight: '600',
  },
  rankChange: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  points: {
    ...TYPOGRAPHY.stat,
    fontSize: 18,
    fontWeight: '700',
  },
  ptsLabel: {
    ...TYPOGRAPHY.bodySm,
    marginLeft: 4,
  },
});
