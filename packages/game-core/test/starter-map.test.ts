import { expect, it } from 'vitest';
import { STARTER_MAP } from '@mmorpg/shared';
import { canOccupy, move } from '../src/index.js';
it('spawn and paths are walkable; buildings and tree roots block the same AABB used by server', () => {
  const world = STARTER_MAP.world;
  expect(canOccupy(world.spawn, world)).toBe(true);
  for (const input of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) expect(move(world.spawn, input, 0.2, world)).not.toEqual(world.spawn);
  expect(canOccupy({ x: 260, y: 200 }, world)).toBe(true); // Roof visual is walkable ground behind the house.
  expect(canOccupy({ x: 260, y: 375 }, world)).toBe(false);
  expect(canOccupy({ x: 300, y: 729 }, world)).toBe(false); // Inside the user-reviewed tree root footprint.
  expect(canOccupy({ x: 300, y: 624 }, world)).toBe(true);
  let position={x:624,y:375};
  for(let i=0;i<100;i++) {position=move(position,{x:-1,y:0},0.05,world);expect(canOccupy(position,world)).toBe(true);}
  expect(position.x).toBeLessThan(360); // Held input now follows the base instead of stopping forever.
  expect(move({ x: 624, y: 200 }, { x: -1, y: 0 }, 2, world).x).toBeLessThan(392);
});
it('multiple footprint AABBs preserve walkable gaps and delayed ticks cannot tunnel through polygons',()=>{
  const world={...STARTER_MAP.world,collisionPolygons:[],obstacles:[{x:100,y:100,width:30,height:30},{x:180,y:100,width:30,height:30}]};
  expect(canOccupy({x:155,y:115},world)).toBe(true);
  expect(canOccupy({x:115,y:115},world)).toBe(false);
  expect(canOccupy(move({x:260,y:300},{x:0,y:1},10,STARTER_MAP.world),STARTER_MAP.world)).toBe(true);
});
