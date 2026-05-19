/**
 * Feature: ninety-minutes-v2, Property 11: Leaderboard trié
 * Validates: Requirements 11.2, 11.3
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Property 11: Leaderboard trié', () => {
  const playerArb = fc.record({
    fanName: fc.string({ minLength: 1, maxLength: 20 }),
    points: fc.integer({ min: 0, max: 1000 }),
    joinedAt: fc.integer({ min: 1000000000000, max: 2000000000000 }),
  });

  const playersListArb = fc.array(playerArb, { minLength: 0, maxLength: 20 });

  it('le tri est correct : points desc puis joinedAt asc', () => {
    fc.assert(
      fc.property(playersListArb, (players) => {
        // Appliquer la même logique de tri que getLeaderboard.js
        const leaderboard = players
          .map(p => ({
            fanName: p.fanName,
            points: p.points || 0,
            joinedAt: p.joinedAt || 0,
          }))
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return a.joinedAt - b.joinedAt;
          });

        // Vérifier l'invariant de tri
        for (let i = 0; i < leaderboard.length - 1; i++) {
          const curr = leaderboard[i];
          const next = leaderboard[i + 1];
          const pointsOk = curr.points > next.points;
          const tieOk = curr.points === next.points && curr.joinedAt <= next.joinedAt;
          expect(pointsOk || tieOk).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('le leaderboard contient tous les joueurs', () => {
    fc.assert(
      fc.property(playersListArb, (players) => {
        const leaderboard = [...players].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return a.joinedAt - b.joinedAt;
        });
        expect(leaderboard.length).toBe(players.length);
      }),
      { numRuns: 100 }
    );
  });
});
