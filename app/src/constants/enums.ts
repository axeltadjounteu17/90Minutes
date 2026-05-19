/**
 * 90Minutes — Shared Enums
 * Per coding-standards.md: use enums for fixed sets of values
 */

export enum MatchEventType {
  GOAL = 'GOAL',
  CARD = 'CARD',
  YELLOW_CARD = 'YELLOW_CARD',
  RED_CARD = 'RED_CARD',
  HALFTIME = 'HALFTIME',
  FULLTIME = 'FULLTIME',
  SUBSTITUTION = 'SUBSTITUTION',
  OFFSIDE = 'OFFSIDE',
  MATCH_START = 'MATCH_START',
  FOUL = 'FOUL',
  SHOT_BLOCKED = 'SHOT_BLOCKED',
  KICKOFF_2ND = 'KICKOFF_2ND',
}

export enum MatchStatus {
  WAITING = 'waiting',
  LIVE = 'live',
  HALFTIME = 'halftime',
  FINISHED = 'finished',
}

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
}

export enum PredictionType {
  PRE_MATCH = 'pre-match',
  HALFTIME = 'halftime',
}

export enum ReactionEmoji {
  GOAL = '⚽',
  SHOCK = '😱',
  FIRE = '🔥',
  SKULL = '💀',
}
