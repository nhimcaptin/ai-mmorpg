import { expect, it } from 'vitest';
import { FOUNDATION_WORLD } from '@mmorpg/shared';
import { canOccupy, move } from '../src/index.js';
it('held cardinal input follows a straight wall, stays bounded in speed and stops when released',()=>{
  const world={...FOUNDATION_WORLD,obstacles:[{x:200,y:100,width:120,height:80}],collisionPolygons:[]};
  let p={x:248,y:190},side=false;
  for(let i=0;i<30;i++) {
    const next=move(p,{x:0,y:-1},0.05,world);
    expect(canOccupy(next,world)).toBe(true);expect(Math.hypot(next.x-p.x,next.y-p.y)).toBeLessThanOrEqual(8.00001);
    side ||= Math.abs(next.x-248)>10;p=next;
  }
  expect(side).toBe(true);expect(move(p,{x:0,y:0},0.05,world)).toEqual(p);
});
it('slides along a sloped polygon and cannot escape into a second blocking footprint',()=>{
  const world={...FOUNDATION_WORLD,obstacles:[{x:320,y:0,width:20,height:640}],collisionPolygons:[{points:[{x:200,y:160},{x:320,y:200},{x:320,y:300},{x:200,y:300}]}]};
  let p={x:260,y:160};
  for(let i=0;i<30;i++) {const next=move(p,{x:0,y:1},0.05,world);expect(canOccupy(next,world)).toBe(true);expect(Math.hypot(next.x-p.x,next.y-p.y)).toBeLessThanOrEqual(8.00001);p=next;}
  expect(Math.abs(p.x-260)).toBeGreaterThan(20);
});
