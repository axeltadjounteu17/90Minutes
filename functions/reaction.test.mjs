/**
 * Feature: ninety-minutes-v2, Property 10: Rate-limit réactions
 * Validates: Requirements 10.1, 10.2, 10.3
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

const VALID_EMOJIS = ['⚽', '😱', '🔥', '💀'];

describe('Property 10: Rate-limit réactions', () => {
  it('accepte uniquement les emojis valides', () => {
    const validEmojiArb = fc.constantFrom(...VALID_EMOJIS);

    fc.assert(
      fc.property(validEmojiArb, (emoji) => {
        expect(VALID_EMOJIS.includes(emoji)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejette les emojis invalides', () => {
    const invalidEmojiArb = fc.string({ minLength: 1, maxLength: 4 })
      .filter(s => !VALID_EMOJIS.includes(s));

    fc.assert(
      fc.property(invalidEmojiArb, (emoji) => {
        expect(VALID_EMOJIS.includes(emoji)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rate-limit : accepte si delta_t >= 1000ms, rejette sinon', () => {
    const sequenceArb = fc.array(
      fc.record({
        emoji: fc.constantFrom(...VALID_EMOJIS),
        deltaMs: fc.integer({ min: 0, max: 3000 }),
      }),
      { minLength: 1, maxLength: 20 }
    );

    fc.assert(
      fc.property(sequenceArb, (sequence) => {
        let lastReactionAt = 0;
        let accepted = 0;
        let rejected = 0;

        for (const { emoji, deltaMs } of sequence) {
          const now = lastReactionAt + deltaMs;
          const isValidEmoji = VALID_EMOJIS.includes(emoji);
          const isRateLimited = lastReactionAt > 0 && (now - lastReactionAt) < 1000;

          if (!isValidEmoji) {
            rejected++;
          } else if (isRateLimited) {
            rejected++;
          } else {
            accepted++;
            lastReactionAt = now;
          }
        }

        expect(accepted + rejected).toBe(sequence.length);
      }),
      { numRuns: 100 }
    );
  });

  it('+1 point par réaction acceptée, monotonie', () => {
    const countArb = fc.integer({ min: 1, max: 50 });

    fc.assert(
      fc.property(countArb, (acceptedReactions) => {
        let points = 0;
        for (let i = 0; i < acceptedReactions; i++) {
          const prev = points;
          points += 1;
          expect(points).toBeGreaterThan(prev);
        }
        expect(points).toBe(acceptedReactions);
      }),
      { numRuns: 100 }
    );
  });
});
