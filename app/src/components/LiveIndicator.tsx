/**
 * 90Minutes — LiveIndicator Component
 * Red pulsing dot with "LIVE" text.
 * Per design-system.md: infinite pulse opacity 0.4→1.0, 1500ms.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY } from '../constants/typography';

interface LiveIndicatorProps {
  /** Whether the match is currently live */
  isLive: boolean;
  /** Optional: show as green "connected" variant */
  variant?: 'live' | 'connected';
}

function LiveIndicatorComponent({ isLive, variant = 'live' }: LiveIndicatorProps): React.JSX.Element | null {
  const { theme } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isLive) {
      opacity.value = withRepeat(
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      opacity.value = 1;
    }
  }, [isLive, opacity]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isLive) return null;

  const dotColor = variant === 'connected' ? theme.success : theme.live;

  return (
    <View
      style={styles.container}
      accessibilityLabel={variant === 'connected' ? 'Connecté' : 'Match en direct'}
    >
      <Animated.View style={[styles.dot, { backgroundColor: dotColor }, dotStyle]} />
      <Text style={[styles.text, { color: theme.textPrimary }]}>
        {variant === 'connected' ? 'CONNECTED' : 'LIVE'}
      </Text>
    </View>
  );
}

export const LiveIndicator = React.memo(LiveIndicatorComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
  },
});
