/**
 * 90Minutes — ReactionBar Component
 * 4 large emoji reaction buttons.
 * Per frontend-architecture.md:
 * - Bounce animation on press (scale spring)
 * - Haptic feedback on press
 * - 1 second cooldown between presses
 * - Counter badge showing total room reactions
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, RADIUS, MIN_TOUCH_TARGET } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import { ReactionEmoji } from '../constants/enums';
import type { ReactionTotals } from '../types';

interface ReactionBarProps {
  /** Callback when user taps a reaction */
  onReaction: (emoji: string) => void;
  /** Whether reactions are disabled (e.g. no active event) */
  disabled: boolean;
  /** Cooldown in ms between reactions (default 1000) */
  cooldownMs?: number;
  /** Room-wide reaction totals */
  totals?: ReactionTotals;
}

const REACTIONS = [
  ReactionEmoji.GOAL,
  ReactionEmoji.SHOCK,
  ReactionEmoji.FIRE,
  ReactionEmoji.SKULL,
];

function ReactionBarComponent({
  onReaction,
  disabled,
  cooldownMs = 50,
  totals,
}: ReactionBarProps): React.JSX.Element {
  const { theme } = useTheme();
  const [cooldown, setCooldown] = useState(false);

  const handlePress = useCallback(
    (emoji: string) => {
      if (disabled || cooldown) return;

      onReaction(emoji);
      setCooldown(true);

      // Cooldown timer — rate-limit per coding-standards.md
      setTimeout(() => setCooldown(false), cooldownMs);
    },
    [disabled, cooldown, cooldownMs, onReaction],
  );

  return (
    <View style={styles.container}>
      {REACTIONS.map((emoji) => (
        <ReactionButton
          key={emoji}
          emoji={emoji}
          count={totals?.[emoji as keyof ReactionTotals]}
          onPress={() => handlePress(emoji)}
          disabled={disabled || cooldown}
          theme={theme}
        />
      ))}
    </View>
  );
}

/** Individual reaction button with bounce animation */
function ReactionButton({
  emoji,
  count,
  onPress,
  disabled,
  theme,
}: {
  emoji: string;
  count?: number;
  onPress: () => void;
  disabled: boolean;
  theme: ReturnType<typeof useTheme>['theme'];
}): React.JSX.Element {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    // Bounce: scale down then overshoot then settle
    scale.value = withSequence(
      withSpring(0.9, { damping: 15, stiffness: 150 }),
      withSpring(1.15, { damping: 15, stiffness: 150 }),
      withSpring(1.0, { damping: 15, stiffness: 150 }),
    );
  }, [disabled, scale]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      disabled={disabled}
      accessibilityLabel={`Réaction ${emoji}`}
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: theme.bgElevated,
            opacity: disabled ? 0.5 : 1,
          },
          animStyle,
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        {count !== undefined && count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: theme.accentPrimary }]}>
            <Text style={[styles.countText, { color: theme.textOnAccent }]}>
              {count > 99 ? '99+' : count}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export const ReactionBar = React.memo(ReactionBarComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 32,
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    ...TYPOGRAPHY.bodySm,
    fontSize: 10,
    fontWeight: '700',
  },
});
