/**
 * 90Minutes — ScoreHero Component
 * Largest element on the Match Dashboard screen.
 * Per frontend-architecture.md and design-system.md:
 * - Score digits: 64px Oswald bold
 * - Pulse animation on GOAL event (scale 1.0→1.2→1.0, 300ms)
 * - Orange glow on score change
 * - Team codes flanking the score
 * - Red pulsing LIVE dot when isLive=true
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS } from '../constants/spacing';
import { LiveIndicator } from './LiveIndicator';

interface ScoreHeroProps {
  /** Home team 3-letter code (e.g. "FCT") */
  homeCode: string;
  /** Guest team 3-letter code (e.g. "CLU") */
  guestCode: string;
  /** Home team score */
  homeScore: number;
  /** Guest team score */
  guestScore: number;
  /** Current match minute */
  matchMinute: number;
  /** Whether the match is currently live */
  isLive: boolean;
}

function ScoreHeroComponent({
  homeCode,
  guestCode,
  homeScore,
  guestScore,
  matchMinute,
  isLive,
}: ScoreHeroProps): React.JSX.Element {
  const { theme } = useTheme();
  const { user } = useAuth();
  const scale = useSharedValue(1);

  // Pulse animation when score changes (GOAL event)
  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(1.0, { duration: 150, easing: Easing.out(Easing.ease) }),
    );
  }, [homeScore, guestScore, scale]);

  const scoreAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      style={[styles.container, { backgroundColor: theme.bgElevated }]}
      accessibilityLabel={`Score: ${homeCode} ${homeScore}, ${guestCode} ${guestScore}`}
    >
      {/* LIVE indicator */}
      <View style={styles.liveRow}>
        <LiveIndicator isLive={isLive} />
        {isLive && (
          <View style={[styles.minuteBadge, { backgroundColor: theme.accentPrimary }]}>
            <Text style={[styles.minuteText, { color: theme.textOnAccent }]}>
              {matchMinute}'
            </Text>
          </View>
        )}
      </View>

      {/* Score display */}
      <View style={styles.scoreRow}>
        <Text style={[styles.teamCode, { color: theme.accentPrimary }]}>
          {homeCode}
        </Text>

        <Animated.View style={[styles.scoreContainer, scoreAnimStyle]}>
          <Text style={[styles.scoreDigit, { color: theme.textPrimary }]}>
            {homeScore}
          </Text>
          <Text style={[styles.scoreSeparator, { color: theme.textTertiary }]}>
            :
          </Text>
          <Text style={[styles.scoreDigit, { color: theme.textPrimary }]}>
            {guestScore}
          </Text>
        </Animated.View>

        <Text style={[styles.teamCode, { color: theme.accentPrimary }]}>
          {guestCode}
        </Text>
      </View>

      {/* Fan Name */}
      {user?.fanName && (
        <Text style={[styles.fanName, { color: theme.textSecondary }]}>
          {user.fanName}
        </Text>
      )}
    </View>
  );
}

export const ScoreHero = React.memo(ScoreHeroComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  minuteBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  minuteText: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  teamCode: {
    ...TYPOGRAPHY.headingLg,
    fontSize: 24,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreDigit: {
    ...TYPOGRAPHY.displayXl,
    fontSize: 44,
    fontWeight: '700',
  },
  scoreSeparator: {
    ...TYPOGRAPHY.displayXl,
    fontSize: 34,
    marginHorizontal: SPACING.xs,
  },
  fanName: {
    ...TYPOGRAPHY.bodySm,
    marginTop: 2,
    fontWeight: '600',
  },
});
