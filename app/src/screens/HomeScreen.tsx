/**
 * 90Minutes — Home / Lobby Screen
 * Per frontend-architecture.md:
 * - Header with avatar + points badge
 * - "EN DIRECT" section with live match card
 * - "À VENIR" section with upcoming matches
 * - Bottom tab navigation
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { LiveIndicator } from '../components/LiveIndicator';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS, SAFE_AREA } from '../constants/spacing';

interface HomeScreenProps {
  /** Current user's username */
  username: string;
  /** Current user's total points */
  totalPoints: number;
  /** Navigate to room selector for a match */
  onSelectMatch: (matchId: string) => void;
}

export function HomeScreen({
  username,
  totalPoints,
  onSelectMatch,
}: HomeScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: theme.accentPrimary }]}>
            <Text style={[styles.avatarText, { color: theme.textOnAccent }]}>
              {username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.username, { color: theme.textPrimary }]}>
            {username}
          </Text>
        </View>
        <View style={[styles.pointsBadge, { backgroundColor: theme.accentPrimary }]}>
          <Text style={[styles.pointsText, { color: theme.textOnAccent }]}>
            {totalPoints} pts
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* LIVE NOW section */}
        <Text style={[styles.sectionTitle, { color: theme.accentSecondary }]}>
          {t('home.live')}
        </Text>

        <Pressable
          style={[styles.matchCard, { backgroundColor: theme.bgElevated }]}
          onPress={() => onSelectMatch('DFL-MAT-111111')}
          accessibilityRole="button"
        >
          <View style={styles.matchCardHeader}>
            <LiveIndicator isLive={true} />
            <Text style={[styles.fansCount, { color: theme.textSecondary }]}>
              {t('home.fans_connected', { count: 12 })}
            </Text>
          </View>

          <View style={styles.matchTeams}>
            <Text style={[styles.teamName, { color: theme.textPrimary }]}>FC Team</Text>
            <Text style={[styles.matchScore, { color: theme.accentPrimary }]}>5 : 0</Text>
            <Text style={[styles.teamName, { color: theme.textPrimary }]}>Club</Text>
          </View>

          <View style={[styles.matchAccent, { backgroundColor: theme.accentPrimary }]} />
        </Pressable>

        {/* UPCOMING section */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: SPACING.xl }]}>
          {t('home.upcoming')}
        </Text>

        {/* Placeholder upcoming matches */}
        {['Match 2', 'Match 3'].map((name, i) => (
          <View
            key={i}
            style={[styles.upcomingCard, { backgroundColor: theme.bgCard }]}
          >
            <Text style={[styles.upcomingTeams, { color: theme.textPrimary }]}>
              {name}
            </Text>
            <Text style={[styles.upcomingTime, { color: theme.textTertiary }]}>
              {t('home.kickoff_at', { time: '20:30' })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SAFE_AREA.top,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  username: {
    ...TYPOGRAPHY.headingSm,
  },
  pointsBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  pointsText: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING['2xl'],
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.md,
  },
  matchCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    overflow: 'hidden',
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  fansCount: {
    ...TYPOGRAPHY.bodySm,
  },
  matchTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    ...TYPOGRAPHY.headingMd,
    flex: 1,
  },
  matchScore: {
    ...TYPOGRAPHY.score,
    fontSize: 36,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  matchAccent: {
    height: 2,
    marginTop: SPACING.md,
    borderRadius: 1,
  },
  upcomingCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  upcomingTeams: {
    ...TYPOGRAPHY.bodyLg,
    fontWeight: '600',
  },
  upcomingTime: {
    ...TYPOGRAPHY.bodySm,
    marginTop: SPACING.xs,
  },
});
