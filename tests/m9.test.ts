import { it, expect } from 'vitest';
import {
  createDemo,
  contribute,
  prepare,
  evidence,
  accept,
} from '../packages/domain/src/index';
it('WILLIE-7 protected Wake Willie handoff replay preserves 62% and proof', () => {
  let s = createDemo();
  for (let i = 0; i < 108; i++)
    s = contribute(s, 'WILLIE-7:' + i, 'viewer' + i, '!charge', i);
  expect(s.progress).toBe(60.2);
  s = prepare(s, 'maya', 'victor', 1, 1000);
  s = evidence(s, 'WILLIE-7:raid', 'maya', 'victor', 1100, 1200);
  s = accept(s, 'victor', 1, 1300);
  expect(s.progress).toBe(60.2);
  expect(s.passport[1].custodian).toBe('victor');
  expect(s.receipts[0].evidenceClass).toBe('SIMULATED_JUDGE_REPLAY');
  s = contribute(s, 'destination', 'community-b', '!shield', 1400);
  expect(s.progress).toBe(62.2);
});
