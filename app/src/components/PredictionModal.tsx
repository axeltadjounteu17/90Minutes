/**
 * 90Minutes — PredictionModal Component
 * Bottom sheet modal for score prediction.
 * Per frontend-architecture.md:
 * - Slides up 60% of screen
 * - Countdown timer in red badge (auto-closes at 0)
 * - Two score steppers with team colors
 * - Lock button with shake animation on submit
 * - Haptic success feedback on lock
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS, MIN_TOUCH_TARGET } from '../constants/spacing';

interface PredictionModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Home team 3-letter code */
  homeCode: string;
  /** Guest team 3-letter code */
  guestCode: string;
  /** Current score (null = pre-match, "1:0" = halftime) */
  currentScore?: string;
  /** Seconds until modal auto-closes */
  timeRemaining: number;
  /** Called when user locks prediction */
  onSubmit: (homeScore: number, awayScore: number) => void;
  /** Called when user dismisses */
  onDismiss: () => void;
}

export function PredictionModal({
  visible,
  homeCode,
  guestCode,
  currentScore,
  timeRemaining: initialTime,
  onSubmit,
  onDismiss,
}: PredictionModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [submitted, setSubmitted] = useState(false);

  // Shake animation for lock button
  const shakeX = useSharedValue(0);
  const lockScale = useSharedValue(1);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }, { scale: lockScale.value }],
  }));

  // Countdown timer
  useEffect(() => {
    if (!visible) {
      setTimeLeft(initialTime);
      setSubmitted(false);
      setHomeScore(0);
      setAwayScore(0);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, initialTime, onDismiss]);

  const handleLock = useCallback(() => {
    if (submitted) return;

    // Shake + scale animation on submit
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
    lockScale.value = withSequence(
      withSpring(0.95, { damping: 15, stiffness: 200 }),
      withSpring(1.05, { damping: 15, stiffness: 200 }),
      withSpring(1.0, { damping: 15, stiffness: 200 }),
    );

    setSubmitted(true);
    onSubmit(homeScore, awayScore);
  }, [submitted, homeScore, awayScore, onSubmit, shakeX, lockScale]);

  /** Format seconds as MM:SS */
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.bgElevated }]}>
          {/* Timer badge */}
          <View style={[styles.timerBadge, { backgroundColor: theme.danger }]}>
            <Text style={[styles.timerText, { color: '#FFFFFF' }]}>
              {t('prediction.time_remaining', { time: formatTime(timeLeft) })}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {currentScore ? t('prediction.halftime_title') : t('prediction.title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('prediction.subtitle')}
          </Text>

          {/* Score steppers */}
          {submitted ? (
            <View style={styles.submittedContainer}>
              <Text style={[styles.submittedText, { color: theme.success }]}>
                {t('prediction.submitted')}
              </Text>
              <Text style={[styles.submittedScore, { color: theme.textPrimary }]}>
                {homeScore} : {awayScore}
              </Text>
            </View>
          ) : (
            <View style={styles.steppersRow}>
              <ScoreStepper
                teamCode={homeCode}
                value={homeScore}
                onChange={setHomeScore}
                theme={theme}
              />
              <Text style={[styles.colonSeparator, { color: theme.textTertiary }]}>:</Text>
              <ScoreStepper
                teamCode={guestCode}
                value={awayScore}
                onChange={setAwayScore}
                theme={theme}
              />
            </View>
          )}

          {/* Lock button */}
          {!submitted && (
            <Animated.View style={shakeStyle}>
              <Pressable
                style={[styles.lockButton, { backgroundColor: theme.accentPrimary }]}
                onPress={handleLock}
                accessibilityLabel={t('prediction.lock')}
                accessibilityRole="button"
              >
                <Text style={[styles.lockText, { color: theme.textOnAccent }]}>
                  {t('prediction.lock')}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Skip link */}
          <Pressable onPress={onDismiss} style={styles.skipLink}>
            <Text style={[styles.skipText, { color: theme.textTertiary }]}>
              {submitted ? t('common.back') : t('prediction.skip')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** Individual score stepper (- / number / +) */
function ScoreStepper({
  teamCode,
  value,
  onChange,
  theme,
}: {
  teamCode: string;
  value: number;
  onChange: (v: number) => void;
  theme: ReturnType<typeof useTheme>['theme'];
}): React.JSX.Element {
  return (
    <View style={[styles.stepper, { backgroundColor: theme.bgCard }]}>
      <Text style={[styles.stepperTeam, { color: theme.accentPrimary }]}>
        {teamCode}
      </Text>
      <View style={styles.stepperControls}>
        <Pressable
          style={[styles.stepperBtn, { backgroundColor: theme.bgHover }]}
          onPress={() => onChange(Math.max(0, value - 1))}
          accessibilityLabel={`Diminuer score ${teamCode}`}
          accessibilityRole="button"
        >
          <Text style={[styles.stepperBtnText, { color: theme.accentPrimary }]}>−</Text>
        </Pressable>
        <Text style={[styles.stepperValue, { color: theme.textPrimary }]}>
          {value}
        </Text>
        <Pressable
          style={[styles.stepperBtn, { backgroundColor: theme.bgHover }]}
          onPress={() => onChange(Math.min(99, value + 1))}
          accessibilityLabel={`Augmenter score ${teamCode}`}
          accessibilityRole="button"
        >
          <Text style={[styles.stepperBtnText, { color: theme.accentPrimary }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING['2xl'],
    minHeight: '55%',
  },
  timerBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  timerText: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
  },
  title: {
    ...TYPOGRAPHY.headingLg,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  steppersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  colonSeparator: {
    ...TYPOGRAPHY.displayXl,
    fontSize: 40,
  },
  stepper: {
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    minWidth: 120,
  },
  stepperTeam: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.md,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepperBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 24,
    fontWeight: '700',
  },
  stepperValue: {
    ...TYPOGRAPHY.score,
    fontSize: 48,
    minWidth: 40,
    textAlign: 'center',
  },
  submittedContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  submittedText: {
    ...TYPOGRAPHY.headingSm,
    marginBottom: SPACING.md,
  },
  submittedScore: {
    ...TYPOGRAPHY.displayXl,
    fontSize: 56,
  },
  lockButton: {
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  lockText: {
    ...TYPOGRAPHY.headingSm,
    fontWeight: '700',
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  skipText: {
    ...TYPOGRAPHY.bodyMd,
  },
});
