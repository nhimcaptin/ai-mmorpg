import { it, expect } from 'vitest';
import { StarterPreviewRoom, PlayerState, WorldState } from '../src/world-room.js';
import { PROTOCOL_VERSION } from '@mmorpg/shared';
import { canOccupy } from '@mmorpg/game-core';
it('server ticks reject crossing the house base and allow ground under the roof visual',()=>{
  const room=new StarterPreviewRoom();
  // Exercise the real collision tick; malformed position input is covered by multiplayer.test.
  room.onCreate();
  const state=room.state as WorldState;
  const player=new PlayerState();player.id='test';player.x=260;player.y=300;state.players.set('test',player);
  const inputs=(room as unknown as {inputs:Map<string,{intent:{version:typeof PROTOCOL_VERSION;sequence:number;x:number;y:number};receivedAt:number}>}).inputs;
  inputs.set('test',{intent:{version:PROTOCOL_VERSION,sequence:1,x:0,y:1},receivedAt:0});
  for(let i=0;i<100;i++) {room.tick(0);expect(canOccupy(player,room.world)).toBe(true);}
  expect(Math.abs(player.x-260)).toBeGreaterThan(10);
  player.x=624;player.y=200;inputs.set('test',{intent:{version:PROTOCOL_VERSION,sequence:2,x:-1,y:0},receivedAt:0});
  for(let i=0;i<50;i++)room.tick(0);
  expect(player.x).toBeLessThan(392);
  room.clock.clear();
});
