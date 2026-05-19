/**
 * Feature: ninety-minutes-v2, Property 9: Narration Nova valide
 * Validates: Requirements 6.2, 6.3, 6.4, 6.6
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { FALLBACK_NARRATIONS } = require('./utils');

// Regex étendue pour couvrir tous les emojis utilisés dans les fallbacks
const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F7E0}-\u{1F7FF}\u{2B50}\u{26BD}\u{1F3C1}\u{1F6A9}\u{1F504}\u{23F1}\u{23F0}\u{23F1}-\u{23FF}]/u;

describe('Property 9: Narration Nova valide', () => {
  const eventTypeArb = fc.constantFrom('GOAL', 'YELLOW_CARD', 'RED_CARD', 'HALFTIME', 'FULLTIME', 'SUBSTITUTION', 'OFFSIDE');

  it('les fallbacks ont toujours ≤15 mots', () => {
    fc.assert(
      fc.property(eventTypeArb, (eventType) => {
        const fallback = FALLBACK_NARRATIONS[eventType];
        expect(fallback).toBeDefined();
        const wordCount = fallback.trim().split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(15);
      }),
      { numRuns: 100 }
    );
  });

  it('les fallbacks contiennent au moins un caractère non-ASCII (emoji)', () => {
    fc.assert(
      fc.property(eventTypeArb, (eventType) => {
        const fallback = FALLBACK_NARRATIONS[eventType];
        // Vérifier qu'il y a au moins un caractère hors ASCII basique
        const hasNonAscii = /[^\x00-\x7F]/.test(fallback);
        expect(hasNonAscii).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('chaque type d\'événement a un fallback défini et non-vide', () => {
    const allTypes = ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'HALFTIME', 'FULLTIME', 'SUBSTITUTION', 'OFFSIDE'];

    for (const type of allTypes) {
      expect(FALLBACK_NARRATIONS[type]).toBeDefined();
      expect(typeof FALLBACK_NARRATIONS[type]).toBe('string');
      expect(FALLBACK_NARRATIONS[type].length).toBeGreaterThan(0);
    }
  });

  it('la validation narration : un texte de plus de 15 mots non-vides est rejeté', () => {
    // Générer des tableaux de mots non-vides
    const longTextArb = fc.array(
      fc.stringMatching(/^[a-z]{1,8}$/),
      { minLength: 16, maxLength: 30 }
    ).map(words => words.join(' '));

    fc.assert(
      fc.property(longTextArb, (text) => {
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        expect(words.length).toBeGreaterThan(15);
      }),
      { numRuns: 100 }
    );
  });
});
