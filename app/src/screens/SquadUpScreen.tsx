/**
 * 90Minutes — SquadUp Screen
 * Remplace RoomSelectorScreen. Permet de créer ou rejoindre une room.
 *
 * Requirements: 2.5, 3.1, 3.2, 3.3, 3.4
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useRoom } from '../contexts/RoomContext';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS, SAFE_AREA } from '../constants/spacing';
import awsOutputs from '../constants/aws-outputs.json';

const HTTP_API = awsOutputs.NinetyMinutesStack.HttpApiEndpoint;

export function SquadUpScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { setActiveRoom } = useRoom();
  const router = useRouter();

  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${HTTP_API}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUserId: user.userId,
          ownerFanName: user.fanName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedCode(data.joinCode);
        // Copier dans le presse-papier
        await Clipboard.setStringAsync(data.joinCode);
        // Activer la room dans le context (sans changer d'onglet)
        setActiveRoom({ roomId: data.roomId, joinCode: data.joinCode });
      } else {
        Alert.alert('Erreur', data.error || 'Impossible de créer la room');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Connexion impossible au serveur');
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  const handleJoinRoom = useCallback(async () => {
    if (!user || joinCode.length < 6) return;
    setLoading(true);
    try {
      const res = await fetch(`${HTTP_API}/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinCode,
          userId: user.userId,
          fanName: user.fanName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveRoom({ roomId: data.roomId, joinCode: data.joinCode || joinCode });
      } else if (res.status === 400) {
        Alert.alert('Code invalide', 'Le code doit contenir 6 chiffres.');
      } else if (res.status === 404) {
        Alert.alert('Room introuvable', 'Aucune room avec ce code.');
      } else {
        Alert.alert('Erreur', data.error || 'Erreur inconnue');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Connexion impossible au serveur');
    } finally {
      setLoading(false);
    }
  }, [user, joinCode, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Text style={[styles.title, { color: theme.textPrimary }]}>Squad Up</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Crée ou rejoins une room pour vivre le match ensemble
      </Text>

      {/* Create Room Card */}
      <View style={[styles.card, { backgroundColor: theme.bgCard }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>🏟️ Créer une Room</Text>
        <Pressable
          style={[styles.button, { backgroundColor: theme.accentPrimary }]}
          onPress={handleCreateRoom}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '...' : 'Créer'}
          </Text>
        </Pressable>
        {createdCode && (
          <View style={styles.codeDisplay}>
            <Text style={[styles.codeLabel, { color: theme.textSecondary }]}>Code copié :</Text>
            <Text style={[styles.codeValue, { color: theme.accentPrimary }]}>{createdCode}</Text>
          </View>
        )}
      </View>

      {/* Join Room Card */}
      <View style={[styles.card, { backgroundColor: theme.bgCard }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>🤝 Rejoindre une Room</Text>
        <TextInput
          style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
          value={joinCode}
          onChangeText={setJoinCode}
          placeholder="000000"
          placeholderTextColor={theme.textTertiary}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Pressable
          style={[
            styles.button,
            { backgroundColor: joinCode.length === 6 ? theme.accentPrimary : theme.bgHover },
          ]}
          onPress={handleJoinRoom}
          disabled={joinCode.length < 6 || loading}
        >
          <Text style={[styles.buttonText, joinCode.length < 6 && { opacity: 0.5 }]}>
            {loading ? '...' : 'Rejoindre'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SAFE_AREA.top,
    paddingHorizontal: SPACING.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: SPACING.lg,
  },
  subtitle: {
    fontSize: 14,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  button: {
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: SPACING.md,
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  codeLabel: {
    fontSize: 14,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
  },
});
