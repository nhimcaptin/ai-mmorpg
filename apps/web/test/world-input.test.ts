import { expect, it } from 'vitest';
import { acceptsWorldInput, MovementKeys } from '../app/world-input';
it('blocks unfocused windows and focus owned by text or panels, including nested descendants', () => {
  expect(acceptsWorldInput(false, null)).toBe(false);
  expect(acceptsWorldInput(true, null)).toBe(true);
  const focused = { closest: (selector: string) => selector.includes('[data-block-world-input]') ? {} as Element : null };
  expect(acceptsWorldInput(true, focused)).toBe(false);
  expect(acceptsWorldInput(true, { closest: () => null })).toBe(true);
});
it('releases and focus loss stop intent without a renderer update; opposing and diagonal keys stay bounded', () => {
  const keys = new MovementKeys();
  keys.key('KeyD', true, true); expect(keys.intent(true)).toEqual({x:1,y:0});
  keys.key('KeyW', true, true); expect(keys.intent(true)).toEqual({x:1,y:-1});
  keys.key('KeyA', true, true); expect(keys.intent(true)).toEqual({x:0,y:-1});
  keys.key('KeyD', false, true); keys.key('KeyA', false, true); keys.key('KeyW', false, true);
  expect(keys.intent(true)).toEqual({x:0,y:0});
  keys.key('KeyS', true, true); expect(keys.intent(false)).toEqual({x:0,y:0});
  expect(keys.intent(true)).toEqual({x:0,y:0});
  expect(keys.key('KeyX', true, true)).toBe(false);
  keys.key('KeyD', true, false); expect(keys.intent(true)).toEqual({x:0,y:0});
});
