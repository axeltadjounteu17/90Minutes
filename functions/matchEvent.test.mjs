/**
 * Feature: ninety-minutes-v2, Property 8: Monotonie des points
 * Validates: Requirements 9.1, 9.2, 9.6
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { calculatePredictionPoints } = require('./utils');

describe('Property 8: Monotonie des points', () => {
  it('points never decrease through any sequence of scoring actions', () => {
    const actionArb = fc.oneof(
      fc.constant({ type: 'PREDICTION_FIRST' }),
      fc.constant({ type: 'PREDICTION_RESUB' }),
      fc.constant({ type: 'REACTION' }),
      fc.record({
        type: fc.constant('GOAL_SCORE'),
        prediction: fc.record({
          home: fc.integer({ min: 0, max: 99 }),
          away: fc.integer({ min: 0, max: 99 }),
        }),
        actual: fc.record({
          home: fc.integer({ min: 0, max: 99 }),
          away: fc.integer({ min: 0, max: 99 }),
        }),
      }),
    );

    const actionSequenceArb = fc.array(actionArb, { minLength: 1, maxLength: 50 });

    fc.assert(
      fc.property(actionSequenceArb, (actions) => {
        let points = 0;
        let hasPredicted = false;

        for (const action of actions) {
          const prevPoints = points;

          switch (action.type) {
            case 'PREDICTION_FIRST':
              if (!hasPredicted) {
                points += 5;
                hasPredicted = true;
              }
              break;
            case 'PREDICTION_RESUB':
              break;
            case 'REACTION':
              points += 1;
              break;
            case 'GOAL_SCORE':
              points += calculatePredictionPoints(action.prediction, action.actual);
              break;
          }

          expect(points).toBeGreaterThanOrEqual(prevPoints);
        }
      }),
      { numRuns: 100 }
    );
  });
});
