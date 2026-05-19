/**
 * 90Minutes — Profile Screen
 * Per frontend-architecture.md:
 * - Large avatar with initials
 * - Stats row: Matches, Correct Predictions, Total Points
 * - "My Badges" grid (3 columns)
 * - "See all" link to Badges screen
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
import { TYPOGRAPHY } from '../contexts/../constants/typography';
import { SPACING, RADIUS, SAFE_AREA } from '../contexts/../constants/spacing';
import type { UserProfile } from '../types';
import type { PastPrediction } from '../utils/predictions';

interface ProfileScreenProps {
  /** User profile data */
  profile: UserProfile;
  /** Navigate to badges screen */
  onViewBadges: () => void;
  /** Navigate to settings */
  onOpenSettings: () => void;
  /** Past predictions history */
  predictions?: PastPrediction[];
  /** Logout handler */
  onLogout?: () => void;
  /** Delete account handler */
  onDeleteAccount?: () => void;
}

/** Badge display data */
const BADGE_MAP: Record<string, { emoji: string; key: string }> = {
  sniper: { emoji: '🎯', key: 'badges.sniper' },
  in_the_zone: { emoji: '🔥', key: 'badges.in_the_zone' },
  champion: { emoji: '🏆', key: 'badges.champion' },
  first_blood: { emoji: '⚡', key: 'badges.first_blood' },
  assidu: { emoji: '👁️', key: 'badges.assidu' },
  squad_goals: { emoji: '🤝', key: 'badges.squad_goals' },
};

const ALL_BADGES = Object.keys(BADGE_MAP);

export function ProfileScreen({
  profile,
  onViewBadges,
  onOpenSettings,
  predictions = [],
  onLogout,
  onDeleteAccount,
}: ProfileScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: theme.accentPrimary }]}>
          <Text style={[styles.avatarText, { color: theme.textOnAccent }]}>
            {profile.username.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Username */}
        <Text style={[styles.username, { color: theme.textPrimary }]}>
          {profile.username}
        </Text>
        <Pressable onPress={onOpenSettings}>
          <Text style={[styles.editLink, { color: theme.accentPrimary }]}>
            {t('profile.edit')}
          </Text>
        </Pressable>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            label={t('profile.matches_watched')}
            value={String(profile.matchesWatched)}
            theme={theme}
          />
          <StatCard
            label={t('profile.correct_predictions')}
            value={String(profile.correctPredictions)}
            theme={theme}
          />
          <StatCard
            label={t('profile.total_points')}
            value={String(profile.totalPoints)}
            theme={theme}
          />
        </View>

        {/* Badges section */}
        <View style={styles.badgesHeader}>
          <Text style={[styles.badgesTitle, { color: theme.textPrimary }]}>
            {t('profile.my_badges')}
          </Text>
          <Pressable onPress={onViewBadges}>
            <Text style={[styles.seeAll, { color: theme.accentPrimary }]}>
              {t('profile.see_all')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.badgesGrid}>
          {ALL_BADGES.map((badgeId) => {
            const badge = BADGE_MAP[badgeId];
            if (!badge) return null;
            const unlocked = profile.badges.includes(badgeId);
            return (
              <View
                key={badgeId}
                style={[
                  styles.badgeItem,
                  { backgroundColor: theme.bgCard },
                  !unlocked && { opacity: 0.4 },
                ]}
              >
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text
                  style={[styles.badgeName, { color: unlocked ? theme.accentPrimary : theme.textDisabled }]}
                  numberOfLines={1}
                >
                  {t(badge.key)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Predictions History */}
        <View style={styles.predictionsHeader}>
          <Text style={[styles.predictionsTitle, { color: theme.textPrimary }]}>
            Vos Pronostics 🔮
          </Text>
        </View>

        {(!predictions || predictions.length === 0) ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.bgCard }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Aucune prédiction pour l'instant. Rejoignez un match pour soumettre vos scores !
            </Text>
          </View>
        ) : (
          <View style={styles.predictionsList}>
            {predictions.map((item, index) => (
              <View key={`${item.matchId}-${item.type}-${index}`} style={[styles.predictionCard, { backgroundColor: theme.bgCard }]}>
                <View style={styles.predHeader}>
                  <Text style={[styles.predRoom, { color: theme.textSecondary }]}>
                    Salon: {item.matchId}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === 'correct'
                          ? '#28A745'
                          : item.status === 'wrong'
                            ? '#DC3545'
                            : '#FF9900'
                    }
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {item.status === 'correct' ? 'SUCCÈS' : item.status === 'wrong' ? 'ÉCHEC' : 'EN COURS'}
                    </Text>
                  </View>
                </View>

                <View style={styles.predTeamsRow}>
                  <Text style={[styles.teamName, { color: theme.textPrimary }]}>
                    ⚽ {item.homeTeam} vs {item.awayTeam}
                  </Text>
                  <Text style={[styles.predType, { color: theme.accentPrimary }]}>
                    ({item.type === 'halftime' ? 'Mi-temps' : 'Avant-match'})
                  </Text>
                </View>

                <View style={styles.predDetails}>
                  <Text style={[styles.predTextLabel, { color: theme.textSecondary }]}>
                    Pronostic : <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{item.homeScore} - {item.awayScore}</Text>
                  </Text>
                  {item.finalScore && (
                    <Text style={[styles.predTextLabel, { color: theme.textSecondary }]}>
                      Score Final : <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{item.finalScore}</Text>
                    </Text>
                  )}
                </View>

                {item.status !== 'pending' && (
                  <View style={styles.rewardRow}>
                    <Text style={[styles.rewardPoints, { color: item.status === 'correct' ? '#28A745' : theme.textSecondary }]}>
                      {item.status === 'correct' ? `🏆 +${item.pointsEarned || 0} Points` : '0 Point'}
                    </Text>
                    {item.status === 'correct' && (
                      <Text style={styles.rewardGift}>
                        🎁 Cadeau débloqué !
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Actions ── */}
        <Pressable
          style={[styles.settingsBtn, { backgroundColor: theme.bgCard }]}
          onPress={onOpenSettings}
        >
          <Text style={[styles.settingsBtnText, { color: theme.textPrimary }]}>⚙️  Paramètres</Text>
        </Pressable>

        {onLogout && (
          <Pressable
            style={[styles.logoutBtn, { borderColor: theme.accentPrimary }]}
            onPress={onLogout}
          >
            <Text style={[styles.logoutBtnText, { color: theme.accentPrimary }]}>🚪  Se déconnecter</Text>
          </Pressable>
        )}

        {onDeleteAccount && (
          <Pressable
            style={[styles.deleteBtn, { borderColor: '#DC3545' }]}
            onPress={onDeleteAccount}
          >
            <Text style={styles.deleteBtnText}>🗑️  Supprimer mon compte</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>['theme'];
}): React.JSX.Element {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.bgCard }]}>
      <Text style={[styles.statValue, { color: theme.accentPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SAFE_AREA.top,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING['2xl'],
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  username: {
    ...TYPOGRAPHY.headingLg,
    marginTop: SPACING.md,
  },
  editLink: {
    ...TYPOGRAPHY.bodyMd,
    marginTop: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    width: '100%',
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.stat,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    ...TYPOGRAPHY.bodySm,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  badgesTitle: {
    ...TYPOGRAPHY.label,
  },
  seeAll: {
    ...TYPOGRAPHY.bodyMd,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    width: '100%',
  },
  badgeItem: {
    width: '31%',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  badgeName: {
    ...TYPOGRAPHY.bodySm,
    fontWeight: '600',
    textAlign: 'center',
  },
  predictionsHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  predictionsTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 16,
    fontWeight: '700',
  },
  predictionsList: {
    width: '100%',
    gap: SPACING.sm,
  },
  predictionCard: {
    width: '100%',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  predHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  predRoom: {
    ...TYPOGRAPHY.bodySm,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  predTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginVertical: SPACING.xs,
  },
  teamName: {
    ...TYPOGRAPHY.bodyMd,
    fontWeight: '600',
  },
  predType: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  predDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  predTextLabel: {
    ...TYPOGRAPHY.bodySm,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  rewardPoints: {
    ...TYPOGRAPHY.bodySm,
    fontWeight: '700',
  },
  rewardGift: {
    ...TYPOGRAPHY.bodySm,
    color: '#FFCC00',
    fontWeight: '600',
  },
  emptyCard: {
    width: '100%',
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMd,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  settingsBtn: {
    width: '100%',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  settingsBtnText: {
    ...TYPOGRAPHY.bodyLg,
    fontWeight: '600',
  },
  logoutBtn: {
    width: '100%',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  logoutBtnText: {
    ...TYPOGRAPHY.bodyLg,
    fontWeight: '700',
  },
  deleteBtn: {
    width: '100%',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  deleteBtnText: {
    ...TYPOGRAPHY.bodyLg,
    fontWeight: '700',
    color: '#DC3545',
  },
});
