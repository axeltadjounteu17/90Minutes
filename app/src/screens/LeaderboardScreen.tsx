/**
 * 90Minutes — Leaderboard Screen
 * Per frontend-architecture.md:
 * - Tabs: "Ma Room" | "Global"
 * - Podium top 3 with medals
 * - Scrollable list (FlatList)
 * - Current user row sticky at bottom
 */

import React, { useState, useCallback, useMemo } from 'react';
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
import { LeaderboardRow } from '../components/LeaderboardRow';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS, SAFE_AREA } from '../constants/spacing';
import type { PlayerScore } from '../types';

/** Color palette for avatar circles */
const AVATAR_COLORS = ['#FF6B00', '#D0021B', '#00C853', '#FF9900', '#9C27B0', '#2196F3'];

interface LeaderboardScreenProps {
  /** Sorted leaderboard data */
  leaderboard: PlayerScore[];
  /** Current user's ID */
  currentUserId: string;
}

export function LeaderboardScreen({
  leaderboard,
  currentUserId,
}: LeaderboardScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'room' | 'global'>('room');

  const myEntry = useMemo(
    () => leaderboard.find((p) => p.userId === currentUserId),
    [leaderboard, currentUserId],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: PlayerScore; index: number }) => (
      <LeaderboardRow
        rank={item.rank}
        fanName={item.fanName || item.username}
        points={item.points}
        avatarColor={AVATAR_COLORS[index % AVATAR_COLORS.length]}
        isMe={item.userId === currentUserId}
        previousRank={item.previousRank}
      />
    ),
    [currentUserId],
  );

  const keyExtractor = useCallback(
    (item: PlayerScore) => item.userId,
    [],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Title */}
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {t('leaderboard.title')}
      </Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'room' && { borderBottomColor: theme.accentPrimary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('room')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'room' ? theme.accentPrimary : theme.textTertiary },
            ]}
          >
            {t('leaderboard.my_room')}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'global' && { borderBottomColor: theme.accentPrimary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('global')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'global' ? theme.accentPrimary : theme.textTertiary },
            ]}
          >
            {t('leaderboard.global')}
          </Text>
        </Pressable>
      </View>

      {/* Leaderboard list */}
      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Sticky "Me" row at bottom */}
      {myEntry && (
        <View style={[styles.stickyMe, { backgroundColor: theme.bgElevated, borderTopColor: theme.border }]}>
          <LeaderboardRow
            rank={myEntry.rank}
            fanName={myEntry.fanName || myEntry.username}
            points={myEntry.points}
            avatarColor={theme.accentPrimary}
            isMe={true}
          />
        </View>
      )}
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.lg,
  },
  tab: {
    paddingBottom: SPACING.sm,
  },
  tabText: {
    ...TYPOGRAPHY.headingSm,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  stickyMe: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    paddingBottom: SAFE_AREA.bottom,
  },
});
