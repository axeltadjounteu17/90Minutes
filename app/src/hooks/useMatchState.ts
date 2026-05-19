/**
 * 90Minutes — useMatchState Hook
 * Manages the full match state from WebSocket messages.
 * Per frontend-architecture.md: consumes WebSocket messages and maintains
 * current score, events feed, leaderboard, and prediction state.
 */

import { useReducer, useCallback, useMemo } from 'react';
import {
  MatchEventType,
  MatchStatus,
  ConnectionStatus,
} from '../constants/enums';
import type {
  MatchState,
  MatchEvent,
  MatchInfo,
  PlayerScore,
  Prediction,
} from '../types';

/** Maximum events kept in the visible feed */
const MAX_EVENTS_IN_FEED = 50;

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

const initialState: MatchState = {
  status: ConnectionStatus.DISCONNECTED,
  matchInfo: null,
  currentScore: '0:0',
  matchMinute: 0,
  matchStatus: MatchStatus.WAITING,
  events: [],
  lastEvent: null,
  leaderboard: [],
  myPrediction: null,
  myPoints: 0,
};

type MatchAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'MATCH_START'; payload: MatchInfo }
  | { type: 'MATCH_EVENT'; payload: MatchEvent }
  | { type: 'LEADERBOARD_UPDATE'; payload: PlayerScore[] }
  | { type: 'PREDICTION_SUBMITTED'; payload: Prediction }
  | { type: 'POINTS_UPDATE'; payload: number }
  | { type: 'RESET' };

function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return { ...state, status: action.payload };

    case 'MATCH_START': {
      const kickoffEvent: MatchEvent = {
        type: MatchEventType.MATCH_START,
        matchMinute: 0,
        matchId: action.payload.matchId,
        timestamp: String(Date.now()),
        emoji: '⚽',
        title: 'Coup d\'envoi !',
        message: 'Le match commence !',
        triggersReaction: false,
        triggersPrediction: true,
      };
      return {
        ...state,
        matchInfo: action.payload,
        matchStatus: MatchStatus.LIVE,
        currentScore: '0:0',
        matchMinute: 0,
        events: [kickoffEvent],
      };
    }

    case 'MATCH_EVENT': {
      const event = action.payload;
      const newEvents = [event, ...state.events].slice(0, MAX_EVENTS_IN_FEED);

      let newScore = state.currentScore;
      let newStatus = state.matchStatus;
      let newMinute = event.matchMinute;

      if (event.score) {
        newScore = event.score;
      }
      if (event.finalScore) {
        newScore = event.finalScore;
      }

      if (String(event.type) === 'HALFTIME') {
        newStatus = MatchStatus.HALFTIME;
      } else if (String(event.type) === 'FULLTIME') {
        newStatus = MatchStatus.FINISHED;
      } else if (state.matchStatus === MatchStatus.HALFTIME && String(event.type) !== 'HALFTIME') {
        // Resume to live after halftime
        newStatus = MatchStatus.LIVE;
      }

      return {
        ...state,
        events: newEvents,
        lastEvent: event,
        currentScore: newScore,
        matchMinute: newMinute,
        matchStatus: newStatus,
      };
    }

    case 'LEADERBOARD_UPDATE':
      return { ...state, leaderboard: action.payload };

    case 'PREDICTION_SUBMITTED':
      return { ...state, myPrediction: action.payload };

    case 'POINTS_UPDATE':
      return { ...state, myPoints: action.payload };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseMatchStateReturn {
  /** Current match state */
  state: MatchState;
  /** Process a raw WebSocket message */
  handleMessage: (data: unknown) => void;
  /** Set connection status */
  setConnectionStatus: (status: ConnectionStatus) => void;
  /** Submit a prediction */
  submitPrediction: (prediction: Prediction) => void;
  /** Reset state */
  reset: () => void;
}

export function useMatchState(): UseMatchStateReturn {
  const [state, dispatch] = useReducer(matchReducer, initialState);

  const setConnectionStatus = useCallback((status: ConnectionStatus) => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
  }, []);

  const submitPrediction = useCallback((prediction: Prediction) => {
    dispatch({ type: 'PREDICTION_SUBMITTED', payload: prediction });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  /**
   * Process a raw WebSocket message and dispatch the appropriate action.
   * Validates message structure before processing per coding-standards.md.
   */
  const handleMessage = useCallback((data: unknown) => {
    if (typeof data !== 'object' || data === null) return;

    const msg = data as Record<string, unknown>;
    const msgType = msg.type as string | undefined;

    if (!msgType) return;

    switch (msgType) {
      case 'MATCH_START': {
        const info = msg.matchInfo as Record<string, unknown> | undefined;
        if (info) {
          dispatch({
            type: 'MATCH_START',
            payload: {
              matchId: String(info.matchId ?? ''),
              homeTeam: String(info.homeTeam ?? ''),
              homeCode: String(info.homeCode ?? ''),
              guestTeam: String(info.guestTeam ?? ''),
              guestCode: String(info.guestCode ?? ''),
              stadium: String(info.stadium ?? ''),
              capacity: String(info.capacity ?? ''),
            },
          });
        }
        break;
      }

      case 'MATCH_EVENT': {
        // Fallback for old format
        const event = msg.event as Record<string, unknown> | undefined;
        if (event) {
          dispatch({
            type: 'MATCH_EVENT',
            payload: {
              type: event.type as MatchEventType,
              matchMinute: Number(event.matchMinute ?? 0),
              matchId: String(event.matchId ?? ''),
              timestamp: String(event.timestamp ?? ''),
              emoji: String(event.emoji ?? ''),
              title: String(event.title ?? ''),
              message: String(event.message ?? ''),
              score: event.score as string | undefined,
              finalScore: event.finalScore as string | undefined,
              kpis: event.kpis as MatchEvent['kpis'],
              narrative: event.narrative as string | undefined,
              triggersReaction: Boolean(event.triggersReaction),
              triggersPrediction: Boolean(event.triggersPrediction),
            },
          });
        }
        break;
      }

      case 'GOAL':
      case 'YELLOW_CARD':
      case 'RED_CARD':
      case 'SUBSTITUTION':
      case 'HALFTIME':
      case 'FULLTIME':
      case 'FOUL':
      case 'SHOT_BLOCKED':
      case 'KICKOFF_2ND': {
        // Map direct DFL events from startDemo.js to MatchEvent
        let emoji = '⚽';
        let title = String(msg.message || '');
        if (msgType === 'GOAL') { emoji = '⚽'; title = `BUT — ${msg.message || ''}`; }
        else if (msgType === 'YELLOW_CARD') { emoji = '🟡'; title = `Carton jaune — ${msg.message || ''}`; }
        else if (msgType === 'RED_CARD') { emoji = '🔴'; title = `Carton rouge — ${msg.message || ''}`; }
        else if (msgType === 'SUBSTITUTION') { emoji = '🔄'; title = `Changement — ${msg.message || ''}`; }
        else if (msgType === 'HALFTIME') { emoji = '⏱️'; title = 'Mi-temps'; }
        else if (msgType === 'FULLTIME') { emoji = '🏁'; title = 'Fin du match'; }
        else if (msgType === 'FOUL') { emoji = '⚠️'; }
        else if (msgType === 'SHOT_BLOCKED') { emoji = '🛡️'; }

        dispatch({
          type: 'MATCH_EVENT',
          payload: {
            type: msgType as MatchEventType,
            matchMinute: Number(msg.matchMinute ?? 0),
            matchId: String(msg.matchId ?? ''),
            timestamp: String(Date.now()),
            emoji,
            title,
            message: String(msg.message || ''),
            score: msg.score as string | undefined,
            finalScore: msg.finalScore as string | undefined,
            kpis: undefined,
            narrative: msg.narration as string | undefined,
            triggersReaction: true,
            triggersPrediction: msgType === 'HALFTIME',
          },
        });
        break;
      }

      case 'LEADERBOARD_UPDATE': {
        const leaderboard = msg.leaderboard as PlayerScore[] | undefined;
        if (Array.isArray(leaderboard)) {
          dispatch({ type: 'LEADERBOARD_UPDATE', payload: leaderboard });
        }
        break;
      }

      case 'PREDICTION_RESULT': {
        // Points are included in leaderboard updates
        break;
      }

      default:
        // Unknown message type — ignore per coding-standards.md
        break;
    }
  }, []);

  return { state, handleMessage, setConnectionStatus, submitPrediction, reset };
}
