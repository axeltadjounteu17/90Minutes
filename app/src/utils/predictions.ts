/**
 * 90Minutes — Prediction History Manager
 * Persists and calculates predictions points locally in AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PastPrediction {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  type: string;
  timestamp: number;
  finalScore?: string;
  pointsEarned?: number;
  status: 'pending' | 'correct' | 'wrong';
}

const STORAGE_KEY = '90minutes_predictions_history';

export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  // 1. Exact match
  if (predictedHome === actualHome && predictedAway === actualAway) return 100;

  // 2. Correct winner (sign of diff)
  const predDiff = predictedHome - predictedAway;
  const actualDiff = actualHome - actualAway;
  if (
    (predDiff > 0 && actualDiff > 0) ||
    (predDiff < 0 && actualDiff < 0) ||
    (predDiff === 0 && actualDiff === 0)
  ) {
    return 30;
  }

  // 3. Correct goal difference
  if (predDiff === actualDiff) return 20;

  // 4. Correct total goals
  if (predictedHome + predictedAway === actualHome + actualAway) return 10;

  return 0;
}

export async function getPredictionsHistory(): Promise<PastPrediction[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function savePrediction(
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  type: string
): Promise<void> {
  const history = await getPredictionsHistory();
  
  // Exclude duplicate prediction for this match & type
  const filtered = history.filter((p) => !(p.matchId === matchId && p.type === type));
  
  const newPrediction: PastPrediction = {
    matchId,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    type,
    timestamp: Date.now(),
    status: 'pending',
  };
  
  filtered.unshift(newPrediction);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function updatePredictionResult(
  matchId: string,
  actualHome: number,
  actualAway: number
): Promise<{ points: number; wasCorrect: boolean } | null> {
  const history = await getPredictionsHistory();
  let changed = false;
  let result: { points: number; wasCorrect: boolean } | null = null;

  const updatedHistory = history.map((pred) => {
    if (pred.matchId === matchId && pred.status === 'pending') {
      const points = calculatePoints(pred.homeScore, pred.awayScore, actualHome, actualAway);
      pred.finalScore = `${actualHome}:${actualAway}`;
      pred.pointsEarned = points;
      pred.status = points > 0 ? 'correct' : 'wrong';
      changed = true;
      result = { points, wasCorrect: points > 0 };
    }
    return pred;
  });

  if (changed) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  }
  return result;
}
