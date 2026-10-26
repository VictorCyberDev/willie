import { it, expect } from 'vitest';
import fc from 'fast-check';
import {
  createDemo,
  prepare,
  evidence,
  accept,
  gap,
  hash,
  replay,
  type ReplayAction,
} from '../packages/domain/src/index';
it('10,000 adversarial sequences preserve single custody and deterministic replay', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer({ min: 0, max: 6 }), { maxLength: 50 }),
      (ops) => {
        let s = createDemo();
        let at = 1000;
        for (const [i, op] of ops.entries()) {
          at += 100;
          const previous = s;
          try {
            if (op === 0)
              s = prepare(
                s,
                s.custodian,
                s.members.find((x) => x !== s.custodian)!,
                s.version,
                at,
              );
            if (op === 1 && s.handoff)
              s = evidence(
                s,
                'e' + i,
                s.handoff.source,
                s.handoff.destination,
                at,
                at,
              );
            if (op === 2 && s.handoff)
              s = accept(s, s.handoff.destination, s.version, at);
            if (op === 3) s = gap(s, at);
            if (op === 4 && s.handoff) s = accept(s, 'outsider', s.version, at);
            if (op === 5 && s.handoff)
              s = evidence(
                s,
                'wrong' + i,
                'outsider',
                s.handoff.destination,
                at,
                at,
              );
            if (op === 6 && s.handoff)
              s = accept(s, s.handoff.destination, s.version - 1, at);
          } catch {
            expect(s).toBe(previous);
          }
          expect(s.members).toContain(s.custodian);
          expect(s.version).toBe(s.receipts.length + 1);
          expect(new Set(s.receipts.map((x) => x.handoffId)).size).toBe(
            s.receipts.length,
          );
          expect(s.passport).toHaveLength(s.version);
          expect(s.progress).toBeGreaterThanOrEqual(0);
          expect(s.progress).toBeLessThanOrEqual(100);
        }
        const actions: ReplayAction[] = [
          {
            kind: 'prepare',
            source: 'maya',
            destination: 'victor',
            version: 1,
            now: 1,
          },
          {
            kind: 'evidence',
            id: 'fixed',
            source: 'maya',
            destination: 'victor',
            at: 2,
            now: 3,
          },
          { kind: 'accept', destination: 'victor', version: 1, now: 4 },
        ];
        expect(hash(replay(createDemo(), actions))).toBe(
          hash(replay(createDemo(), actions)),
        );
      },
    ),
    { numRuns: 10000 },
  );
}, 30000);
