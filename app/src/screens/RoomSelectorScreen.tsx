/**
 * 90Minutes — Room Selector Screen
 * Per frontend-architecture.md:
 * - Match header card with teams + score
 * - List of available rooms
 * - Each room: name, fan count, JOIN button
 * - FAB: "+ Create Room"
 */

import React, { useCallback } from 'react';
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
import { LiveIndicator } from '../components/LiveIndicator';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS, SAFE_AREA, MIN_TOUCH_TARGET } from '../constants/spacing';

interface Room {
  id: string;
  name: string;
  fanCount: number;
  isActive: boolean;
}

interface RoomSelectorScreenProps {
  /** Home team name */
  homeTeam: string;
  /** Guest team name */
  guestTeam: string;
  /** Current score (if live) */
  currentScore?: string;
  /** Whether match is live */
  isLive: boolean;
  /** Available rooms */
  rooms: Room[];
  /** Join a room */
  onJoinRoom: (roomId: string) => void;
  /** Create a new room */
  onCreateRoom: () => void;
  /** Go back */
  onBack: () => void;
}

export function RoomSelectorScreen({
  homeTeam,
  guestTeam,
  currentScore,
  isLive,
  rooms,
  onJoinRoom,
  onCreateRoom,
  onBack,
}: RoomSelectorScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  const renderRoom = useCallback(
    ({ item }: { item: Room }) => (
      <View style={[styles.roomCard, { backgroundColor: theme.bgCard }]}>
        <View style={styles.roomInfo}>
          <Text style={[styles.roomName, { color: theme.textPrimary }]}>
            {item.name}
          </Text>
          <Text style={[styles.roomFans, { color: theme.textSecondary }]}>
            {t('room.fans', { count: item.fanCount })}
          </Text>
        </View>
        <Pressable
          style={[styles.joinButton, { backgroundColor: theme.accentPrimary }]}
          onPress={() => onJoinRoom(item.id)}
          accessibilityLabel={`${t('room.join')} ${item.name}`}
          accessibilityRole="button"
        >
          <Text style={[styles.joinText, { color: theme.textOnAccent }]}>
            {t('room.join')}
          </Text>
        </Pressable>
      </View>
    ),
    [theme, t, onJoinRoom],
  );

  const keyExtractor = useCallback((item: Room) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <Text style={[styles.backArrow, { color: theme.textPrimary }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('room.title')}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Match card */}
      <View style={[styles.matchCard, { backgroundColor: theme.bgElevated }]}>
        <View style={styles.matchRow}>
          <Text style={[styles.matchTeam, { color: theme.textPrimary }]}>{homeTeam}</Text>
          {currentScore && (
            <Text style={[styles.matchScore, { color: theme.accentPrimary }]}>
              {currentScore}
            </Text>
          )}
          <Text style={[styles.matchTeam, { color: theme.textPrimary }]}>{guestTeam}</Text>
        </View>
        {isLive && (
          <View style={styles.liveRow}>
            <LiveIndicator isLive={true} />
          </View>
        )}
      </View>

      {/* Section title */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {t('room.available')}
      </Text>

      {/* Room list */}
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={keyExtractor}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
            {t('room.empty')}
          </Text>
        }
      />

      {/* FAB: Create Room */}
      <Pressable
        style={[styles.fab, { backgroundColor: theme.accentPrimary }]}
        onPress={onCreateRoom}
        accessibilityLabel={t('room.create')}
        accessibilityRole="button"
      >
        <Text style={[styles.fabText, { color: theme.textOnAccent }]}>+ {t('room.create')}</Text>
      </Pressable>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '700',
    width: 32,
  },
  headerTitle: {
    ...TYPOGRAPHY.headingSm,
  },
  matchCard: {
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchTeam: {
    ...TYPOGRAPHY.headingMd,
    flex: 1,
  },
  matchScore: {
    ...TYPOGRAPHY.score,
    fontSize: 28,
    marginHorizontal: SPACING.md,
  },
  liveRow: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    ...TYPOGRAPHY.bodyLg,
    fontWeight: '600',
  },
  roomFans: {
    ...TYPOGRAPHY.bodySm,
    marginTop: 2,
  },
  joinButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  joinText: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMd,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  fab: {
    position: 'absolute',
    bottom: SAFE_AREA.bottom + SPACING.md,
    right: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    elevation: 4,
  },
  fabText: {
    ...TYPOGRAPHY.label,
    fontSize: 13,
  },
});
