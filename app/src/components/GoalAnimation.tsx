/**
 * 90Minutes — GoalAnimation
 * Séquence d'animation pour un but : flash → confetti → pulse gold → narration slide-in.
 * Durée totale ≤ 1500ms.
 *
 * Requirements: 7.1, 7.2, 7.3
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GoalAnimationProps {
  narrative?: string;
  score?: string;
  visible: boolean;
  onComplete?: () => void;
}

export function GoalAnimation({ narrative, score, visible, onComplete }: GoalAnimationProps): React.JSX.Element | null {
  const flashOpacity = useSharedValue(0);
  const confettiScale = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Phase 1: Flash blanc (0-200ms)
      flashOpacity.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      );

      // Phase 2: Confetti burst (200-600ms)
      confettiScale.value = withDelay(200,
        withSequence(
          withTiming(1.5, { duration: 200, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 200 }),
        )
      );

      // Phase 3: Score pulse gold (400-800ms)
      pulseScale.value = withDelay(400,
        withSequence(
          withTiming(1.3, { duration: 200, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 200 }),
        )
      );

      // Callback après 1500ms
      if (onComplete) {
        const timer = setTimeout(() => {
          runOnJS(onComplete)();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confettiScale.value }],
    opacity: confettiScale.value > 0 ? 1 : 0,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Flash blanc */}
      <Animated.View style={[styles.flash, flashStyle]} />

      {/* Confetti burst */}
      <Animated.View style={[styles.confettiContainer, confettiStyle]}>
        <Text style={styles.confetti}>🎉⚽🎊</Text>
      </Animated.View>

      {/* Score pulse */}
      {score && (
        <Animated.View style={[styles.scoreContainer, pulseStyle]}>
          <Text style={styles.scoreText}>{score}</Text>
        </Animated.View>
      )}

      {/* Narration slide-in (Phase 4: 800-1500ms) */}
      {narrative && (
        <Animated.View
          entering={SlideInRight.delay(800).duration(300)}
          exiting={FadeOut.delay(400)}
          style={styles.narrativeContainer}
        >
          <Text style={styles.narrativeText}>{narrative}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  confettiContainer: {
    position: 'absolute',
    top: '30%',
  },
  confetti: {
    fontSize: 48,
  },
  scoreContainer: {
    position: 'absolute',
    top: '40%',
  },
  scoreText: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FFB800', // Gold
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  narrativeContainer: {
    position: 'absolute',
    bottom: '25%',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingVertical: 12,
    maxWidth: SCREEN_WIDTH - 48,
  },
  narrativeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
