/**
 * 90Minutes — LaunchLiveButton
 * Bouton pour démarrer la démo match. Visible uniquement si gameState.status === 'WAITING'.
 *
 * Requirements: 5.1, 5.2, 5.4, 5.5
 */

import React, { useState, useCallback } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { SPACING, RADIUS } from '../constants/spacing';
import awsOutputs from '../constants/aws-outputs.json';

const HTTP_API = awsOutputs.NinetyMinutesStack.HttpApiEndpoint;

interface LaunchLiveButtonProps {
  roomId: string;
  gameStatus: string;
}

export function LaunchLiveButton({ roomId, gameStatus }: LaunchLiveButtonProps): React.JSX.Element | null {
  const { theme } = useTheme();
  const { push } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLaunch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${HTTP_API}/start-demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {}),
        },
        body: JSON.stringify({ roomId }),
      });

      if (res.status === 202) {
        push({
          type: 'INFO',
          style: 'solid-green',
          durationMs: 3000,
          title: 'Match lancé !',
          emoji: '🚀',
        });
      } else {
        push({
          type: 'ERROR',
          style: 'solid-red',
          durationMs: 4000,
          title: 'Démo indisponible',
          emoji: '❌',
        });
      }
    } catch {
      push({
        type: 'ERROR',
        style: 'solid-red',
        durationMs: 4000,
        title: 'Démo indisponible',
        emoji: '❌',
      });
    } finally {
      setLoading(false);
    }
  }, [roomId, user, push]);

  // Visible uniquement si le match n'a pas encore commencé
  if (gameStatus !== 'WAITING' && gameStatus !== 'waiting') return null;

  return (
    <Pressable
      style={[styles.button, { backgroundColor: theme.accentPrimary }]}
      onPress={handleLaunch}
      disabled={loading}
    >
      <Text style={styles.buttonText}>
        {loading ? '⏳ Lancement...' : '🎬 Lancer le Match'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
