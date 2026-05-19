/**
 * 90Minutes — TypeScript Interfaces
 * Per coding-standards.md: interfaces over types for object shapes
 */

import { MatchEventType, MatchStatus, ConnectionStatus } from '../constants/enums';

/** KPI data attached to GOAL events */
export interface EventKPIs {
  xG: number;
  playerSpeed: number;
  goalZone: number;
  pressure: number;
  distanceToGoal?: number;
}

/** A single match event received via WebSocket */
export interface MatchEvent {
  type: MatchEventType;
  matchMinute: number;
  matchId: string;
  timestamp: string;
  emoji: string;
  title: string;
  message: string;
  score?: string;
  finalScore?: string;
  kpis?: EventKPIs;
  narrative?: string;
  triggersReaction: boolean;
  triggersPrediction: boolean;
}

/** Static match metadata */
export interface MatchInfo {
  matchId: string;
  homeTeam: string;
  homeCode: string;
  guestTeam: string;
  guestCode: string;
  stadium: string;
  capacity: string;
}

/** Player score in leaderboard */
export interface PlayerScore {
  userId: string;
  username: string;
  points: number;
  rank: number;
  reactions?: number;
  previousRank?: number;
}

/** Score prediction */
export interface Prediction {
  homeScore: number;
  awayScore: number;
  type: 'pre-match' | 'halftime';
  locked: boolean;
}

/** Full match state managed by WebSocket context */
export interface MatchState {
  status: ConnectionStatus;
  matchInfo: MatchInfo | null;
  currentScore: string;
  matchMinute: number;
  matchStatus: MatchStatus;
  events: MatchEvent[];
  lastEvent: MatchEvent | null;
  leaderboard: PlayerScore[];
  myPrediction: Prediction | null;
  myPoints: number;
}

/** Reaction totals for a room */
export interface ReactionTotals {
  '⚽': number;
  '😱': number;
  '🔥': number;
  '💀': number;
}

/** User profile */
export interface UserProfile {
  userId: string;
  username: string;
  email?: string;
  totalPoints: number;
  matchesWatched: number;
  correctPredictions: number;
  badges: string[];
}
