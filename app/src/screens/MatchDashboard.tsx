/**
 * 90Minutes — Live Match Dashboard Screen ⭐
 * The core screen of the app. Per frontend-architecture.md:
 * - ScoreHero at top with LIVE indicator
 * - AI narration below score
 * - Scrollable event feed (FlatList, max 10 events)
 * - ReactionBar at bottom
 * - Floating PREDICT button
 *
 * Per i18n-languages.md: all text via t('key')
 * Per theming.md: all colors via useTheme()
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { ScoreHero } from '../components/ScoreHero';
import { EventCard } from '../components/EventCard';
import { ReactionBar } from '../components/ReactionBar';
import { LiveIndicator } from '../components/LiveIndicator';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS, SAFE_AREA } from '../constants/spacing';
import { MatchStatus, ConnectionStatus } from '../constants/enums';
import type { MatchEvent, MatchState } from '../types';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface MatchDashboardProps {
  /** Full match state from useMatchState */
  matchState: MatchState;
  /** Send a reaction emoji */
  onReaction: (emoji: string) => void;
  /** Open prediction modal */
  onOpenPrediction: () => void;
  /** Floating emojis currently active */
  floatingEmojis?: { id: number; emoji: string; left: number }[];
}

export function MatchDashboard({
  matchState,
  onReaction,
  onOpenPrediction,
  floatingEmojis = [],
}: MatchDashboardProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  const isLive = matchState.matchStatus === MatchStatus.LIVE
    || matchState.matchStatus === MatchStatus.HALFTIME;

  const isConnected = matchState.status === ConnectionStatus.CONNECTED;

  // Parse score into home/guest numbers
  const [homeScore, guestScore] = useMemo(() => {
    const parts = matchState.currentScore.split(':').map(Number);
    return [parts[0] ?? 0, parts[1] ?? 0];
  }, [matchState.currentScore]);

  /** Render a single event card in the feed */
  const renderEvent = useCallback(
    ({ item, index }: { item: MatchEvent; index: number }) => (
      <EventCard
        type={item.type}
        emoji={item.emoji}
        title={item.title}
        message={item.message}
        matchMinute={item.matchMinute}
        kpis={item.kpis}
        narrative={item.narrative}
        isNew={index === 0}
      />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: MatchEvent, index: number) => `${item.type}-${item.matchMinute}-${index}`,
    [],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Connection status bar */}
      {!isConnected && (
        <View style={[styles.reconnectBar, { backgroundColor: theme.accentPrimary }]}>
          <Text style={[styles.reconnectText, { color: theme.textOnAccent }]}>
            {t('match.reconnecting')}
          </Text>
        </View>
      )}

      {/* Header with connection indicator */}
      <View style={styles.header}>
        <LiveIndicator isLive={isLive} />
        <LiveIndicator isLive={isConnected} variant="connected" />
      </View>

      {/* Score Hero */}
      {matchState.matchInfo && (
        <ScoreHero
          homeCode={matchState.matchInfo.homeCode}
          guestCode={matchState.matchInfo.guestCode}
          homeScore={homeScore}
          guestScore={guestScore}
          matchMinute={matchState.matchMinute}
          isLive={isLive}
        />
      )}

      {/* Event Feed */}
      <FlatList
        data={matchState.events}
        renderItem={renderEvent}
        keyExtractor={keyExtractor}
        style={styles.eventList}
        contentContainerStyle={styles.eventListContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom section: Predict button + Reactions */}
      <View style={[styles.bottomSection, { backgroundColor: theme.bgPrimary }]}>
        {/* Predict button */}
        <Pressable
          style={[styles.predictButton, { backgroundColor: theme.accentPrimary }]}
          onPress={onOpenPrediction}
          accessibilityLabel={t('prediction.title')}
          accessibilityRole="button"
        >
          <Text style={[styles.predictText, { color: theme.textOnAccent }]}>
            {t('prediction.lock')}
          </Text>
        </Pressable>

        {/* Reaction bar */}
        <ReactionBar
          onReaction={onReaction}
          disabled={false}
          cooldownMs={50}
        />
      </View>

      {/* Floating Emojis Overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {floatingEmojis.map((item) => (
          <FloatingEmoji key={item.id} emoji={item.emoji} left={item.left} />
        ))}
      </View>
    </View>
  );
}

/** Rising and fading floating emoji reaction animation */
function FloatingEmoji({ emoji, left }: { emoji: string; left: number }): React.JSX.Element {
  const y = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);

  React.useEffect(() => {
    y.value = withTiming(-250, { duration: 1500, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(0, { duration: 1500, easing: Easing.in(Easing.quad) });
    scale.value = withTiming(1.3, { duration: 400, easing: Easing.out(Easing.back(1.5)) });
  }, [y, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    bottom: 100,
    left: `${left}%`,
    transform: [{ translateY: y.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: 32 }}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SAFE_AREA.top,
  },
  reconnectBar: {
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  reconnectText: {
    ...TYPOGRAPHY.bodySm,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  narrativeBanner: {
    marginHorizontal: SPACING.md,
    marginTop: 4,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9900',
  },
  narrativeText: {
    ...TYPOGRAPHY.bodyMd,
    fontStyle: 'italic',
  },
  eventList: {
    flex: 1,
    marginTop: 4,
  },
  eventListContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  bottomSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SAFE_AREA.bottom,
  },
  predictButton: {
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  predictText: {
    ...TYPOGRAPHY.headingSm,
    fontWeight: '700',
  },
});
