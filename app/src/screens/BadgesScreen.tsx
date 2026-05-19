/**
 * 90Minutes — Badges / Achievements Screen
 * Per frontend-architecture.md:
 * - Header with unlocked count
 * - 2-column grid of badge cards
 * - Each badge: emoji, name, description, progress bar
 * - Unlocked badges glow orange, locked are greyed
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS, SAFE_AREA } from '../constants/spacing';

interface Badge {
  id: string;
  emoji: string;
  nameKey: string;
  descKey: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

interface BadgesScreenProps {
  /** User's unlocked badge IDs */
  unlockedBadges: string[];
  /** Go back handler */
  onClose?: () => void;
}

const ALL_BADGES_DATA: Omit<Badge, 'unlocked'>[] = [
  { id: 'sniper', emoji: '🎯', nameKey: 'badges.sniper', descKey: 'badges.sniper_desc' },
  { id: 'in_the_zone', emoji: '🔥', nameKey: 'badges.in_the_zone', descKey: 'badges.in_the_zone_desc' },
  { id: 'champion', emoji: '🏆', nameKey: 'badges.champion', descKey: 'badges.champion_desc' },
  { id: 'first_blood', emoji: '⚡', nameKey: 'badges.first_blood', descKey: 'badges.first_blood_desc' },
  { id: 'assidu', emoji: '👁️', nameKey: 'badges.assidu', descKey: 'badges.assidu_desc' },
  { id: 'squad_goals', emoji: '🤝', nameKey: 'badges.squad_goals', descKey: 'badges.squad_goals_desc' },
];

export function BadgesScreen({ unlockedBadges, onClose }: BadgesScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  const badges: Badge[] = ALL_BADGES_DATA.map((b) => ({
    ...b,
    unlocked: unlockedBadges.includes(b.id),
  }));

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const renderBadge = ({ item }: { item: Badge }) => (
    <View
      style={[
        styles.badgeCard,
        { backgroundColor: theme.bgCard },
        item.unlocked && styles.badgeUnlocked,
        !item.unlocked && { opacity: 0.5 },
      ]}
    >
      <Text style={styles.badgeEmoji}>{item.emoji}</Text>
      <Text
        style={[
          styles.badgeName,
          { color: item.unlocked ? theme.accentPrimary : theme.textDisabled },
        ]}
      >
        {t(item.nameKey)}
      </Text>
      <Text style={[styles.badgeDesc, { color: theme.textSecondary }]} numberOfLines={2}>
        {t(item.descKey)}
      </Text>
      {!item.unlocked && (
        <View style={[styles.lockIcon, { backgroundColor: theme.bgHover }]}>
          <Text style={styles.lockText}>🔒</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('badges.title')}
        </Text>
        {onClose && (
          <Text style={[styles.closeBtn, { color: theme.textSecondary }]} onPress={onClose}>
            ✕
          </Text>
        )}
      </View>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {t('badges.unlocked', { count: unlockedCount, total: badges.length })}
      </Text>

      <FlatList
        data={badges}
        renderItem={renderBadge}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SAFE_AREA.top,
  },
  title: {
    ...TYPOGRAPHY.displayLg,
    fontSize: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  closeBtn: {
    fontSize: 24,
    padding: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING['2xl'],
  },
  row: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  badgeCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  badgeUnlocked: {
    shadowColor: '#FF9900',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  badgeEmoji: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  badgeName: {
    ...TYPOGRAPHY.headingSm,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeDesc: {
    ...TYPOGRAPHY.bodySm,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  lockIcon: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    fontSize: 12,
  },
});
