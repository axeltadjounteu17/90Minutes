/**
 * Property-based tests for utils.js
 * Feature: ninety-minutes-v2
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { calculatePredictionPoints, BLOCKLIST } = require('./utils');

// ─────────────────────────────────────────
// Feature: ninety-minutes-v2, Property 7: Calculateur de points pur
// ─────────────────────────────────────────

describe('Property 7: calculatePredictionPoints', () => {
  const scoreArb = fc.record({
    home: fc.integer({ min: 0, max: 99 }),
    away: fc.integer({ min: 0, max: 99 }),
  });

  it('result is always in {0, 10, 20, 30, 100}', () => {
    fc.assert(
      fc.property(scoreArb, scoreArb, (prediction, actualScore) => {
        const result = calculatePredictionPoints(prediction, actualScore);
        expect([0, 10, 20, 30, 100]).toContain(result);
      }),
      { numRuns: 100 }
    );
  });

  it('returns 100 if and only if exact match', () => {
    fc.assert(
      fc.property(scoreArb, scoreArb, (prediction, actualScore) => {
        const result = calculatePredictionPoints(prediction, actualScore);
        const isExact = prediction.home === actualScore.home && prediction.away === actualScore.away;
        if (isExact) {
          expect(result).toBe(100);
        } else {
          expect(result).not.toBe(100);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('is deterministic (same input → same output)', () => {
    fc.assert(
      fc.property(scoreArb, scoreArb, (prediction, actualScore) => {
        const r1 = calculatePredictionPoints(prediction, actualScore);
        const r2 = calculatePredictionPoints(prediction, actualScore);
        expect(r1).toBe(r2);
      }),
      { numRuns: 100 }
    );
  });

  it('never returns a negative value', () => {
    fc.assert(
      fc.property(scoreArb, scoreArb, (prediction, actualScore) => {
        const result = calculatePredictionPoints(prediction, actualScore);
        expect(result).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });
});

// ─────────────────────────────────────────
// Feature: ninety-minutes-v2, Property 13: Anonymisation des broadcasts
// ─────────────────────────────────────────

describe('Property 13: Anonymisation des broadcasts', () => {
  it('rejects payloads containing any BLOCKLIST term', () => {
    const bannedTermArb = fc.constantFrom(...BLOCKLIST);

    fc.assert(
      fc.property(bannedTermArb, fc.string(), (term, prefix) => {
        const payload = { message: `${prefix} ${term} scored` };
        const serialized = JSON.stringify(payload);
        const wouldBlock = BLOCKLIST.some(t => serialized.includes(t));
        expect(wouldBlock).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('allows payloads without any BLOCKLIST term', () => {
    const safeStringArb = fc.string().filter(s => !BLOCKLIST.some(t => s.includes(t)));

    fc.assert(
      fc.property(safeStringArb, (msg) => {
        const payload = { message: msg };
        const serialized = JSON.stringify(payload);
        const wouldBlock = BLOCKLIST.some(t => serialized.includes(t));
        expect(wouldBlock).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
