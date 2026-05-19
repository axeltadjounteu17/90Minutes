/**
 * Feature: ninety-minutes-v2, Property 12: Parser DFL round-trip
 * Validates: Requirements 14.1, 14.2, 14.3, 14.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parseEvent, prettyPrintEvent, VALID_TYPES } = require('./parser');

describe('Property 12: Parser DFL round-trip', () => {
  const dflEventArb = fc.record({
    type: fc.constantFrom(...VALID_TYPES),
    minute: fc.integer({ min: 0, max: 95 }),
    team: fc.constantFrom('FC Team', 'Club'),
    player: fc.oneof(
      fc.constant(''),
      fc.constant('A. Test'),
      fc.constant('M. Vier'),
    ),
  });

  it('parseEvent(prettyPrintEvent(e)) produces equivalent event', () => {
    fc.assert(
      fc.property(dflEventArb, (event) => {
        const xml = prettyPrintEvent(event);
        const result = parseEvent(xml);

        expect(result.ok).toBe(true);
        expect(result.value.type).toBe(event.type);
        expect(result.value.minute).toBe(event.minute);
        expect(result.value.team).toBe(event.team);
      }),
      { numRuns: 100 }
    );
  });

  it('fuzz XML returns {ok: false} for random strings', () => {
    const fuzzArb = fc.string({ minLength: 0, maxLength: 200 })
      .filter(s => !s.includes('<Type>') || !s.includes('</Type>'));

    fc.assert(
      fc.property(fuzzArb, (fuzz) => {
        const result = parseEvent(fuzz);
        expect(result.ok).toBe(false);
        expect(result.error).toBe('MALFORMED_XML');
      }),
      { numRuns: 100 }
    );
  });

  it('team is always FC Team or Club', () => {
    fc.assert(
      fc.property(dflEventArb, (event) => {
        const xml = prettyPrintEvent(event);
        const result = parseEvent(xml);
        if (result.ok) {
          expect(['FC Team', 'Club']).toContain(result.value.team);
        }
      }),
      { numRuns: 100 }
    );
  });
});
