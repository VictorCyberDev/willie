import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import {
  createDemo,
  prepare,
  evidence,
  accept,
  gap,
  contribute,
  hash,
  sha256,
  canonical,
  replayEvents,
} from '../packages/domain/src/index';
const ready = () =>
  evidence(
    prepare(createDemo(), 'maya', 'victor', 1, 1000),
    'raid1',
    'maya',
    'victor',
    1100,
    1200,
  );
describe('authoritative handoff', () => {
  it('preserves state and creates immutable proof', () => {
    const s = ready(),
      next = accept(s, 'victor', 1, 1300);
    expect(next.custodian).toBe('victor');
    expect(next.version).toBe(2);
    expect(next.progress).toBe(s.progress);
    expect(next.passport).toHaveLength(2);
    expect(next.receipts).toHaveLength(1);
    expect(next.receipts[0].newStateHash).toBe(hash(next));
    expect(s.custodian).toBe('maya');
    expect(() => accept(next, 'victor', 2, 1400)).toThrow('INVALID_STATE');
  });
  it('deduplicates provider events', () => {
    const s = ready();
    expect(evidence(s, 'raid1', 'maya', 'victor', 1100, 1200)).toBe(s);
  });
  it('rejects wrong source destination version membership expiry and missing evidence', () => {
    expect(() => prepare(createDemo(), 'lex', 'victor', 1, 0)).toThrow();
    expect(() => prepare(createDemo(), 'maya', 'outsider', 1, 0)).toThrow();
    expect(() => prepare(createDemo(), 'maya', 'victor', 2, 0)).toThrow();
    expect(() => accept(ready(), 'lex', 1, 1300)).toThrow();
    expect(() => accept(ready(), 'victor', 2, 1300)).toThrow();
    expect(() => accept(ready(), 'victor', 1, 121000)).toThrow();
    expect(() =>
      accept(prepare(createDemo(), 'maya', 'victor', 1, 0), 'victor', 1, 1),
    ).toThrow();
  });
  it('unrelated raid never moves custody', () => {
    const s = evidence(
      prepare(createDemo(), 'maya', 'victor', 1, 0),
      'wrong',
      'maya',
      'lex',
      10,
      20,
    );
    expect(s.custodian).toBe('maya');
    expect(s.handoff?.status).toBe('PREPARED');
  });
  it('evidence gap freezes safely', () => {
    const s = gap(ready(), 1300);
    expect(s.handoff?.status).toBe('PAUSED');
    expect(() => accept(s, 'victor', 1, 1400)).toThrow();
    expect(s.custodian).toBe('maya');
  });
  it('expires provider evidence safely', () => {
    const s = evidence(
      prepare(createDemo(), 'maya', 'victor', 1, 0),
      'late',
      'maya',
      'victor',
      120000,
      120000,
    );
    expect(s.handoff?.status).toBe('ABORTED');
  });
  it('bounded unique contributions', () => {
    let s = createDemo();
    s = contribute(s, '1', 'user', '!charge', 1);
    expect(s.progress).toBe(2);
    s = contribute(s, '2', 'user', '!charge', 40000);
    expect(s.progress).toBe(2);
    expect(contribute(s, '2', 'user', '!charge', 80000)).toBe(s);
    for (let i = 0; i < 200; i++)
      s = contribute(s, 'u' + i, 'u' + i, '!charge', 80000);
    expect(s.progress).toBeLessThan(63);
  });
  it('canonical SHA-256 matches Node for unicode and boundary lengths', () => {
    for (const v of [
      '',
      'abc',
      'Willie 🔥',
      'x'.repeat(55),
      'y'.repeat(56),
      'z'.repeat(1000),
    ])
      expect(sha256(v)).toBe(createHash('sha256').update(v).digest('hex'));
    expect(canonical({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
  });
});

it('replays the actual ordered domain event ledger including contributions and proof', () => {
  let s = createDemo();
  s = contribute(s, 'charge', 'community', '!charge', 100);
  s = prepare(s, 'maya', 'victor', 1, 1000);
  s = evidence(s, 'native-shape-raid', 'maya', 'victor', 1100, 1200);
  s = accept(s, 'victor', 1, 1300);
  expect(replayEvents(createDemo(), s.events)).toEqual(s);
});
