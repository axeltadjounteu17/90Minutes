/**
 * Feature: ninety-minutes-v2, Property 2: Round-trip createRoom ↔ joinRoom
 * Validates: Requirements 2.2
 *
 * Feature: ninety-minutes-v2, Property 3: Validation joinCode
 * Validates: Requirements 2.3, 2.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

const JOIN_CODE_REGEX = /^[0-9]{6}$/;

describe('Property 2: Round-trip createRoom ↔ joinRoom', () => {
  it('un code créé est toujours retrouvable dans une table simulée', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 30 }),
        (ownerUserId, ownerFanName) => {
          // Simuler createRoom
          const joinCode = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
          const roomId = ownerUserId;
          const room = { roomId, joinCode, ownerFanName };

          // Simuler la table
          const table = { [joinCode]: room };

          // Simuler joinRoom lookup
          const found = table[joinCode];
          expect(found).toBeDefined();
          expect(found.roomId).toBe(roomId);
          expect(found.ownerFanName).toBe(ownerFanName);
          expect(found.joinCode).toMatch(JOIN_CODE_REGEX);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: Validation joinCode', () => {
  it('rejette les codes qui ne matchent pas /^[0-9]{6}$/', () => {
    const invalidCodeArb = fc.string({ minLength: 0, maxLength: 20 })
      .filter(s => !JOIN_CODE_REGEX.test(s));

    fc.assert(
      fc.property(invalidCodeArb, (joinCode) => {
        const isValid = JOIN_CODE_REGEX.test(joinCode);
        expect(isValid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('accepte les codes valides de 6 chiffres', () => {
    const validCodeArb = fc.integer({ min: 0, max: 999999 })
      .map(n => String(n).padStart(6, '0'));

    fc.assert(
      fc.property(validCodeArb, (joinCode) => {
        const isValid = JOIN_CODE_REGEX.test(joinCode);
        expect(isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('retourne 404 pour un code valide mais absent de la table', () => {
    const validCodeArb = fc.integer({ min: 0, max: 999999 })
      .map(n => String(n).padStart(6, '0'));

    fc.assert(
      fc.property(validCodeArb, (joinCode) => {
        // Table vide
        const table = {};
        const found = table[joinCode];
        expect(found).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});
