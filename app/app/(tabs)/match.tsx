/**
 * 90Minutes — Match Tab Route
 * Si pas de room active : SquadUpScreen (créer/rejoindre).
 * Sinon : MatchDashboard branché au WebSocket + bouton Lancer la démo.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SquadUpScreen } from '../../src/screens/SquadUpScreen';
import { MatchDashboard } from '../../src/screens/MatchDashboard';
import { PredictionModal } from '../../src/components/PredictionModal';
import { useMatchState } from '../../src/hooks/useMatchState';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRoom } from '../../src/contexts/RoomContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ConnectionStatus, MatchEventType, MatchStatus } from '../../src/constants/enums';
import { SPACING, RADIUS, SAFE_AREA } from '../../src/constants/spacing';
import { TYPOGRAPHY } from '../../src/constants/typography';
import { savePrediction, updatePredictionResult } from '../../src/utils/predictions';
import awsOutputs from '../../src/constants/aws-outputs.json';

const WS_URL = awsOutputs.NinetyMinutesStack.WebSocketURL;
const HTTP_API = awsOutputs.NinetyMinutesStack.HttpApiEndpoint;

export default function MatchRoute(): React.JSX.Element {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { activeRoom, clearRoom } = useRoom();
  const { state: matchState, handleMessage, setConnectionStatus, submitPrediction } = useMatchState();

  const [showPrediction, setShowPrediction] = useState(false);
  const [demoStarting, setDemoStarting] = useState(false);

  // Si pas encore dans une room → écran SquadUp
  if (!activeRoom) {
    return <SquadUpScreen />;
  }

  return (
    <RoomLiveView
      roomId={activeRoom.roomId}
      joinCode={activeRoom.joinCode}
      userId={user?.userId ?? 'guest'}
      username={user?.fanName ?? 'Fan'}
      matchState={matchState}
      handleMessage={handleMessage}
      setConnectionStatus={setConnectionStatus}
      submitPrediction={submitPrediction as any}
      showPrediction={showPrediction}
      setShowPrediction={setShowPrediction}
      demoStarting={demoStarting}
      setDemoStarting={setDemoStarting}
      onLeaveRoom={clearRoom}
      theme={theme}
    />
  );
}

/**
 * View interne qui ne se monte que lorsqu'une room est active.
 * On la sépare pour pouvoir appeler les hooks de manière conditionnelle
 * (sinon le hook useWebSocket s'exécuterait avec une roomId vide).
 */
function RoomLiveView(props: {
  roomId: string;
  joinCode?: string;
  userId: string;
  username: string;
  matchState: ReturnType<typeof useMatchState>['state'];
  handleMessage: (data: unknown) => void;
  setConnectionStatus: (s: ConnectionStatus) => void;
  submitPrediction: (prediction: { homeScore: number; awayScore: number; predictionType: string }) => void;
  showPrediction: boolean;
  setShowPrediction: (v: boolean) => void;
  demoStarting: boolean;
  setDemoStarting: (v: boolean) => void;
  onLeaveRoom: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}): React.JSX.Element {
  const {
    roomId, joinCode, userId, username, matchState, handleMessage,
    setConnectionStatus, submitPrediction, showPrediction, setShowPrediction,
    demoStarting, setDemoStarting, onLeaveRoom, theme,
  } = props;

  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; left: number }[]>([]);

  const handleIncomingMessage = useCallback((data: any) => {
    handleMessage(data);
    if (data && data.type === 'REACTION') {
      const id = Date.now() + Math.random();
      const left = 15 + Math.random() * 70;
      setFloatingEmojis(prev => [...prev, { id, emoji: data.emoji, left }]);
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(item => item.id !== id));
      }, 2000);
    }
  }, [handleMessage]);

  const { status, sendReaction, sendPrediction } = useWebSocket({
    url: WS_URL,
    roomId,
    userId,
    username,
    onMessage: handleIncomingMessage,
    enabled: true,
  });

  // Synchroniser le statut WS vers le state du match
  useEffect(() => {
    setConnectionStatus(status);
  }, [status, setConnectionStatus]);

  const handleReaction = useCallback(
    (emoji: string) => {
      sendReaction({ roomId, emoji });
      const id = Date.now() + Math.random();
      const left = 15 + Math.random() * 70;
      setFloatingEmojis(prev => [...prev, { id, emoji, left }]);
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(item => item.id !== id));
      }, 2000);
    },
    [sendReaction, roomId],
  );

  const [hasFinishedChecked, setHasFinishedChecked] = useState(false);

  useEffect(() => {
    if (matchState.matchStatus === MatchStatus.FINISHED && !hasFinishedChecked) {
      setHasFinishedChecked(true);
      const [finalHome, finalAway] = matchState.currentScore.split(':').map(Number);
      if (finalHome !== undefined && finalAway !== undefined && !isNaN(finalHome) && !isNaN(finalAway)) {
        updatePredictionResult(roomId, finalHome, finalAway).then((result) => {
          if (result) {
            const { points, wasCorrect } = result;
            if (wasCorrect) {
              Alert.alert(
                '🎉 Prédiction Réussie ! 🏆',
                `Félicitations ! Ton flair a payé.\n\n🏆 Score final : ${matchState.currentScore}\n⭐ Points gagnés : +${points} pts\n🎁 Cadeau débloqué : Badge "Sniper de la Room" !\n\nRetrouve l'historique dans ton Profil.`,
                [{ text: 'Génial !', style: 'default' }]
              );
            } else {
              Alert.alert(
                '🏁 Match terminé !',
                `Le score final est de ${matchState.currentScore}.\n\nTa prédiction n'était pas exacte cette fois-ci.\n🍀 Retente ta chance au prochain match !`,
                [{ text: 'D\'accord', style: 'cancel' }]
              );
            }
          }
        });
      }
    } else if (matchState.matchStatus !== MatchStatus.FINISHED) {
      setHasFinishedChecked(false);
    }
  }, [matchState.matchStatus, matchState.currentScore, roomId, hasFinishedChecked]);

  const handlePredictionSubmit = useCallback(
    (home: number, away: number) => {
      const predType = matchState.matchStatus.toString() === 'halftime' ? 'halftime' : 'pre-match';
      sendPrediction({
        roomId,
        homeScore: home,
        awayScore: away,
        predictionType: predType,
      });
      // Save locally to AsyncStorage history
      const homeTeam = matchState.matchInfo?.homeCode || 'FCT';
      const awayTeam = matchState.matchInfo?.guestCode || 'CLU';
      savePrediction(roomId, homeTeam, awayTeam, home, away, predType);

      // Persist prediction in local state
      submitPrediction({ homeScore: home, awayScore: away, predictionType: predType });
      setShowPrediction(false);
    },
    [sendPrediction, submitPrediction, roomId, matchState.matchStatus, matchState.matchInfo, setShowPrediction],
  );

  const handleStartDemo = useCallback(async () => {
    setDemoStarting(true);
    try {
      const res = await fetch(`${HTTP_API}/start-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        Alert.alert('Démo', data.error || `Erreur ${res.status}`);
      }
    } catch (err: any) {
      Alert.alert('Démo', err?.message || 'Connexion impossible');
    } finally {
      // Le replay tourne ~28s côté Lambda. On débloque le bouton après 30s.
      setTimeout(() => setDemoStarting(false), 30000);
    }
  }, [roomId, setDemoStarting]);

  const matchInProgress =
    matchState.events.length > 0 || matchState.matchInfo !== null;

  // Tant qu'aucun événement n'est arrivé, on affiche un panneau d'accueil
  // avec le code de la room et le bouton "Lancer la démo".
  if (!matchInProgress) {
    return (
      <View style={[styles.preMatch, { backgroundColor: theme.bgPrimary }]}>
        <Pressable onPress={onLeaveRoom} style={styles.leaveBtn}>
          <Text style={[styles.leaveText, { color: theme.textSecondary }]}>← Quitter</Text>
        </Pressable>

        <Text style={[styles.preTitle, { color: theme.textPrimary }]}>Room rejointe ✓</Text>
        {joinCode && (
          <View style={[styles.codeBox, { backgroundColor: theme.bgCard }]}>
            <Text style={[styles.codeLabel, { color: theme.textSecondary }]}>
              Code à partager
            </Text>
            <Text style={[styles.codeValue, { color: theme.accentPrimary }]}>
              {joinCode}
            </Text>
          </View>
        )}

        <Text style={[styles.statusLine, { color: theme.textSecondary }]}>
          {status === ConnectionStatus.CONNECTED
            ? '🟢 Connecté en temps réel'
            : status === ConnectionStatus.RECONNECTING
              ? '🟡 Reconnexion...'
              : '⚪ Connexion en cours'}
        </Text>

        <Pressable
          style={[
            styles.demoBtn,
            {
              backgroundColor: demoStarting ? theme.bgHover : theme.accentPrimary,
              opacity: demoStarting ? 0.6 : 1,
            },
          ]}
          onPress={handleStartDemo}
          disabled={demoStarting}
        >
          {demoStarting ? (
            <View style={styles.demoBtnInner}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.demoBtnText}>Démo en cours…</Text>
            </View>
          ) : (
            <Text style={styles.demoBtnText}>▶ LANCER LA DÉMO</Text>
          )}
        </Pressable>

        <Text style={[styles.helpText, { color: theme.textTertiary }]}>
          La démo rejoue 10 événements (buts, cartons, mi-temps) avec narration
          IA Nova en direct. Durée ~30 secondes.
        </Text>
      </View>
    );
  }

  return (
    <>
      <MatchDashboard
        matchState={matchState}
        onReaction={handleReaction}
        onOpenPrediction={() => setShowPrediction(true)}
        floatingEmojis={floatingEmojis}
      />
      <PredictionModal
        visible={showPrediction}
        homeCode={matchState.matchInfo?.homeCode || 'FCT'}
        guestCode={matchState.matchInfo?.guestCode || 'CLU'}
        timeRemaining={60}
        onSubmit={handlePredictionSubmit}
        onDismiss={() => setShowPrediction(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  preMatch: {
    flex: 1,
    paddingTop: SAFE_AREA.top,
    paddingHorizontal: SPACING.md,
  },
  leaveBtn: {
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
  },
  leaveText: {
    ...TYPOGRAPHY.bodyMd,
  },
  preTitle: {
    ...TYPOGRAPHY.displayLg,
    fontSize: 28,
    marginTop: SPACING.lg,
  },
  codeBox: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  codeLabel: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.sm,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 8,
  },
  statusLine: {
    ...TYPOGRAPHY.bodyMd,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  demoBtn: {
    marginTop: SPACING.xl,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  helpText: {
    ...TYPOGRAPHY.bodySm,
    textAlign: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
});
