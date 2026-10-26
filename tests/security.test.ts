import { describe, it, expect } from 'vitest';
import {
  createDemo,
  prepare,
  evidence,
  accept,
  abort,
  gap,
  contribute,
  pause,
  resume,
  hash,
} from '../packages/domain/src/index';
const armed = () => prepare(createDemo(), 'maya', 'victor', 1, 1000);
const verified = () => evidence(armed(), 'raid', 'maya', 'victor', 1100, 1200);
describe('failure and adversarial domain acceptance', () => {
  it('old event is consumed once without applying evidence', () => {
    const s = evidence(armed(), 'old', 'maya', 'victor', 900, 1200);
    expect(s.handoff?.status).toBe('PREPARED');
    expect(evidence(s, 'old', 'maya', 'victor', 1100, 1300)).toBe(s);
  });
  it('future timestamp cannot authorize receive', () => {
    expect(
      evidence(armed(), 'future', 'maya', 'victor', 9000, 1200).handoff?.status,
    ).toBe('PREPARED');
  });
  it('wrong source is harmless', () => {
    expect(
      evidence(armed(), 'wrong-source', 'lex', 'victor', 1100, 1200).handoff
        ?.status,
    ).toBe('PREPARED');
  });
  it('wrong target is harmless', () => {
    expect(
      evidence(armed(), 'wrong-target', 'maya', 'lex', 1100, 1200).handoff
        ?.status,
    ).toBe('PREPARED');
  });
  it('receive expiry does not change custody', () => {
    const s = verified();
    expect(() => accept(s, 'victor', 1, 121000)).toThrow('HANDOFF_EXPIRED');
    expect(s.custodian).toBe('maya');
  });
  it('decline/abort is terminal', () => {
    const s = abort(verified(), 'maya', 1300);
    expect(() => accept(s, 'victor', 1, 1400)).toThrow('INVALID_STATE');
    expect(s.custodian).toBe('maya');
  });
  it('abort by outsider denied', () => {
    expect(() => abort(armed(), 'lex', 1100)).toThrow('UNAUTHORIZED_SOURCE');
  });
  it('cannot prepare concurrent active handoffs', () => {
    expect(() => prepare(armed(), 'maya', 'lex', 1, 1100)).toThrow(
      'HANDOFF_ACTIVE',
    );
  });
  it('committed history never rewrites', () => {
    const s = accept(verified(), 'victor', 1, 1300),
      before = structuredClone(s);
    expect(() => abort(s, 'victor', 1400)).toThrow();
    expect(gap(s, 1400)).toEqual(before);
  });
  it('campaign pause blocks receive and contribution', () => {
    let s = pause(verified(), 1300);
    expect(() => accept(s, 'victor', 1, 1400)).toThrow('CAMPAIGN_PAUSED');
    s = contribute(s, 'paused', 'user', '!charge', 1500);
    expect(s.progress).toBe(0);
    expect(resume(s, 1600).handoff?.status).toBe('PAUSED');
  });
  it('large raid count has no input to domain authority', () => {
    expect(armed().custodian).toBe('maya');
    expect(() => accept(armed(), 'victor', 1, 1100)).toThrow('INVALID_STATE');
  });
  it('chat spam never multiplies same viewer', () => {
    let s = createDemo();
    for (let i = 0; i < 1000; i++)
      s = contribute(s, 'spam' + i, 'spammer', '!charge', i * 40000);
    expect(s.progress).toBe(2);
  });
  it('unknown chat never persists raw text', () => {
    const s = contribute(
      createDemo(),
      'unknown',
      'u',
      '<script>alert(1)</script>',
      1,
    );
    expect(s.progress).toBe(0);
    expect(JSON.stringify(s)).not.toContain('<script>');
    expect(
      s.events.filter((e) => e.type === 'CONTRIBUTION_ACCEPTED'),
    ).toHaveLength(0);
  });
  it('state hash detects progress and custodian mutation', () => {
    const s = createDemo();
    expect(hash({ ...s, progress: 1 })).not.toBe(hash(s));
    expect(hash({ ...s, custodian: 'lex' })).not.toBe(hash(s));
  });
});
