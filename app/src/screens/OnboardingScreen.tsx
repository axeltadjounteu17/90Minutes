/**
 * 90Minutes — Onboarding Screen (3 slides)
 * Per frontend-architecture.md:
 * - 3 slides: Live match, Predict score, React together
 * - Skip, Next, Get Started buttons
 * - Pagination dots
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS } from '../constants/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  /** Navigate to auth/login screen */
  onComplete: () => void;
}

interface Slide {
  emoji: string;
  titleKey: string;
  descKey: string;
}

const SLIDES: Slide[] = [
  { emoji: '⚽', titleKey: 'onboarding.slide1_title', descKey: 'onboarding.slide1_desc' },
  { emoji: '🎯', titleKey: 'onboarding.slide2_title', descKey: 'onboarding.slide2_desc' },
  { emoji: '🔥', titleKey: 'onboarding.slide3_title', descKey: 'onboarding.slide3_desc' },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLastSlide = currentSlide === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [isLastSlide, onComplete]);

  const slide = SLIDES[currentSlide];

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Skip button */}
      <Pressable style={styles.skipButton} onPress={onComplete}>
        <Text style={[styles.skipText, { color: theme.textTertiary }]}>
          {t('onboarding.skip')}
        </Text>
      </Pressable>

      {/* Slide content */}
      <View style={styles.slideContent}>
        <Text style={styles.slideEmoji}>{slide.emoji}</Text>
        <Text style={[styles.slideTitle, { color: theme.textPrimary }]}>
          {t(slide.titleKey)}
        </Text>
        <Text style={[styles.slideDesc, { color: theme.textSecondary }]}>
          {t(slide.descKey)}
        </Text>
      </View>

      {/* Pagination dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === currentSlide ? theme.accentPrimary : theme.textDisabled,
                width: i === currentSlide ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Next / Get Started button */}
      <Pressable
        style={[styles.nextButton, { backgroundColor: theme.accentPrimary }]}
        onPress={handleNext}
        accessibilityRole="button"
      >
        <Text style={[styles.nextText, { color: theme.textOnAccent }]}>
          {isLastSlide ? t('onboarding.start') : t('onboarding.next')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
    padding: SPACING.sm,
  },
  skipText: {
    ...TYPOGRAPHY.bodyMd,
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  slideEmoji: {
    fontSize: 80,
    marginBottom: SPACING.xl,
  },
  slideTitle: {
    ...TYPOGRAPHY.displayLg,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  slideDesc: {
    ...TYPOGRAPHY.bodyLg,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING['2xl'],
    marginBottom: SPACING.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg,
  },
  nextText: {
    ...TYPOGRAPHY.headingSm,
    fontWeight: '700',
  },
});
