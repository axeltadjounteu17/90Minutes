/**
 * 90Minutes — Leaderboard Tab Route
 * Branché sur GET /leaderboard?roomId=… (initial load)
 * + WebSocket LEADERBOARD_UPDATE (temps réel).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LeaderboardScreen } from '../../src/screens/LeaderboardScreen';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRoom } from '../../src/contexts/RoomContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { TYPOGRAPHY } from '../../src/constants/typography';
import { SPACING, SAFE_AREA } from '../../src/constants/spacing';
import awsOutputs from '../../src/constants/aws-outputs.json';
import type { PlayerScore } from '../../src/types';

const HTTP_API = awsOutputs.NinetyMinutesStack.HttpApiEndpoint;
const WS_URL = awsOutputs.NinetyMinutesStack.WebSocketURL;

interface BackendPlayer {
  fanName?: string;
  username?: string;
  userId?: string;
  points?: number;
  joinedAt?: number;
}

function normalize(items: BackendPlayer[]): PlayerScore[] {
  return items
    .map((p, i) => ({
      userId: p.userId ?? p.fanName ?? `p${i}`,
      username: p.fanName || p.username || 'Anonyme',
      points: p.points ?? 0,
      rank: i + 1,
    }))
    .sort((a, b) => b.points - a.points)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

export default function LeaderboardRoute(): React.JSX.Element {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { activeRoom } = useRoom();
  const [leaderboard, setLeaderboard] = useState<PlayerScore[]>([]);

  // Charge initiale via HTTP
  useEffect(() => {
    if (!activeRoom?.roomId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${HTTP_API}/leaderboard?roomId=${encodeURIComponent(activeRoom.roomId)}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.leaderboard)) {
          setLeaderboard(normalize(data.leaderboard));
        }
      } catch {
        // silencieux : l'utilisateur reverra une liste vide
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeRoom?.roomId]);

  // Mises à jour temps réel via WS
  const handleMessage = useCallback((data: unknown) => {
    if (typeof data !== 'object' || data === null) return;
    const msg = data as Record<string, unknown>;
    if (msg.type === 'LEADERBOARD_UPDATE' && Array.isArray(msg.leaderboard)) {
      setLeaderboard(normalize(msg.leaderboard as BackendPlayer[]));
    }
  }, []);

  useWebSocket({
    url: WS_URL,
    roomId: activeRoom?.roomId ?? '',
    userId: user?.userId ?? 'guest',
    username: user?.fanName ?? 'Fan',
    onMessage: handleMessage,
    enabled: Boolean(activeRoom?.roomId),
  });

  if (!activeRoom) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.bgPrimary }]}>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
          Pas encore dans une room
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Va dans l'onglet Match pour créer ou rejoindre une Squad. Le classement
          s'affichera ici dès que tu auras rejoint une room.
        </Text>
      </View>
    );
  }

  return (
    <LeaderboardScreen
      leaderboard={leaderboard}
      currentUserId={user?.userId ?? ''}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    paddingTop: SAFE_AREA.top,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    ...TYPOGRAPHY.headingMd,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMd,
    textAlign: 'center',
  },
});
