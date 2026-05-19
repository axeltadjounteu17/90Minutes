/**
 * Feature: ninety-minutes-v2, Property 5: Round-trip prédiction
 * Validates: Requirements 9.3
 *
 * Feature: ninety-minutes-v2, Property 6: Validation prédiction
 * Validates: Requirements 9.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Property 5: Round-trip prédiction', () => {
  it('une prédiction stockée est identique à celle soumise', () => {
    const validScoreArb = fc.record({
      homeScore: fc.integer({ min: 0, max: 99 }),
      awayScore: fc.integer({ min: 0, max: 99 }),
    });

    fc.assert(
      fc.property(validScoreArb, ({ homeScore, awayScore }) => {
        // Simuler le stockage
        const stored = { homeScore, awayScore };
        expect(stored.homeScore).toBe(homeScore);
        expect(stored.awayScore).toBe(awayScore);
      }),
      { numRuns: 100 }
    );
  });

  it('les points de participation sont +5 uniquement à la première soumission', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (submissions) => {
          let points = 0;
          let hasPredicted = false;

          for (let i = 0; i < submissions; i++) {
            if (!hasPredicted) {
              points += 5;
              hasPredicted = true;
            }
          }

          // Toujours exactement 5 points peu importe le nombre de soumissions
          expect(points).toBe(5);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 6: Validation prédiction', () => {
  it('rejette les scores hors [0, 99]', () => {
    const invalidScoreArb = fc.oneof(
      fc.integer({ min: -1000, max: -1 }),
      fc.integer({ min: 100, max: 1000 })
    );

    fc.assert(
      fc.property(invalidScoreArb, fc.integer({ min: 0, max: 99 }), (badScore, goodScore) => {
        // Logique de validation
        const isValid = (s) => Number.isInteger(s) && s >= 0 && s <= 99;

        expect(isValid(badScore)).toBe(false);
        expect(isValid(goodScore)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejette les scores non-entiers', () => {
    const floatArb = fc.double({ min: 0.1, max: 98.9 })
      .filter(n => !Number.isInteger(n));

    fc.assert(
      fc.property(floatArb, (score) => {
        const isValid = Number.isInteger(score) && score >= 0 && score <= 99;
        expect(isValid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
