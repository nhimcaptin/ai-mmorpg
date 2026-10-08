import { expect, it } from 'vitest';
import type { Runtime } from '../src/index.js';

it('supports deterministic clock and RNG fixtures without global mutation', () => {
  let time = 0;
  const samples = [0, 0.5, 0.999];
  const runtime: Runtime = { now: () => time, random: () => samples.shift()! };
  expect(runtime.now()).toBe(0);
  time = 1000;
  expect(runtime.now()).toBe(1000);
  expect([runtime.random(), runtime.random(), runtime.random()]).toEqual([0, 0.5, 0.999]);
});
