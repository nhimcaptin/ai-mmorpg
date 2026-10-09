import { expect, it } from 'vitest';
import { OcclusionManager, STARTER_MAP, STARTER_OBJECT_METADATA, mapObjectSchema, polygonSchema, footprintOverlapsRect, rearBoundaryY } from '../src/index.js';
const house=STARTER_MAP.props.find(p=>p.id==='house-0')!;
const behind={id:'local',x:260,y:280};
it('only changed aggregate targets need rendering; disconnect and rejoin publish the right transitions',()=>{
  const manager=new OcclusionManager([house]);
  manager.update([behind]);expect([...manager.changedObjectIds]).toEqual([house.objectId]);
  for (const actors of [[behind],[behind,{...behind,id:'remote'}],[{...behind,id:'remote'}]]) {
    manager.update(actors);expect(manager.changedObjectIds.size).toBe(0);expect(manager.target(house.objectId)).toBe(0.4);
  }
  manager.clear();expect([...manager.changedObjectIds]).toEqual([house.objectId]);expect(manager.target(house.objectId)).toBe(1);
  manager.update([]);expect(manager.changedObjectIds.size).toBe(0);
  manager.update([behind]);expect([...manager.changedObjectIds]).toEqual([house.objectId]);
  manager.update([]);expect([...manager.changedObjectIds]).toEqual([house.objectId]);
});
it('distant technical objects do not increase per-actor spatial candidate checks',()=>{
  const far=Array.from({length:1000},(_,i)=>({...house,objectId:`technical-${i}`,occlusionRegion:{x:10000+i*512,y:10000,width:100,height:100}}));
  const small=new OcclusionManager([house]),large=new OcclusionManager([house,...far]);
  small.update([behind]);large.update([behind]);
  expect(large.lastCandidateChecks).toBe(small.lastCandidateChecks);expect(large.lastCandidateChecks).toBe(1);
  expect([...large.changedObjectIds]).toEqual([house.objectId]);
  large.update([behind]);expect(large.changedObjectIds.size).toBe(0);
});
it('front of an angled base remains opaque and actor renders in front, even above the global anchor',()=>{
  const manager=new OcclusionManager([house]);
  const front={id:'local',x:150,y:325};
  expect(front.y).toBeLessThan(house.sortingAnchor.y);expect(front.y).toBeGreaterThan(rearBoundaryY(house,front.x));
  manager.update([front]);expect(manager.target(house.id)).toBe(1);expect(manager.actorDepth(front)).toBeGreaterThan(house.sortingAnchor.y);
  expect(manager.actorDepth({x:110,y:330},{x:70,y:240,width:100,height:115})).toBeGreaterThan(house.sortingAnchor.y);
  manager.update([front,behind]);expect(manager.target(house.id)).toBe(0.4); // Remote actor behind still counts.
});
it('all authorized local/remote actors contribute, removal of one cannot reveal another',()=>{
  const a=new OcclusionManager(STARTER_MAP.props),b=new OcclusionManager(STARTER_MAP.props);
  for(const actors of [[behind],[behind,{...behind,id:'remote'}],[{...behind,id:'remote'}],[]]) {
    a.update(actors);b.update([...actors].reverse());
    expect(a.target(house.id)).toBe(actors.length?0.4:1);
    expect(a.target(house.id)).toBe(b.target(house.id));
  }
});
it('nearby, transparent corners, front-of-anchor and unrelated objects do not fade',()=>{
  const manager=new OcclusionManager(STARTER_MAP.props);
  manager.update([{id:'corner',x:house.x+2,y:house.y+2},{id:'front',x:260,y:410},{id:'nearby',x:420,y:280}]);
  for(const object of STARTER_MAP.props) expect(manager.target(object.id)).toBe(1);
});
it('Schmitt inset prevents boundary jitter; disconnect/reconnect snapshots do not retain stale actors',()=>{
  const object=mapObjectSchema.parse({...STARTER_OBJECT_METADATA[0],occlusionRegion:{x:200,y:200,width:100,height:100}});
  const manager=new OcclusionManager([object]);
  manager.update([{id:'one',x:200.5,y:250}]);expect(manager.target(house.id)).toBe(1);
  manager.update([{id:'one',x:204,y:250}]);expect(manager.target(house.id)).toBe(0.4);
  for(const x of [200.5,202.5,200.2,203]) {manager.update([{id:'one',x,y:250}]);expect(manager.target(house.id)).toBe(0.4);}
  manager.update([{id:'one',x:199.9,y:250}]);expect(manager.target(house.id)).toBe(1);
  manager.update([behind]);manager.clear();expect(manager.target(house.id)).toBe(1);
  manager.update([{...behind,id:'reconnected'}]);expect(manager.target(house.id)).toBe(0.4);
  manager.update([]);expect(manager.target(house.id)).toBe(1);
});
it('supports concave polygons/multiple AABB; boundary touch and invalid polygons fail appropriately',()=>{
  const concave={points:[{x:0,y:0},{x:20,y:0},{x:20,y:10},{x:10,y:10},{x:10,y:20},{x:0,y:20}]};
  expect(footprintOverlapsRect(concave,{x:12,y:12,width:3,height:3})).toBe(false);
  expect(footprintOverlapsRect(concave,{x:5,y:5,width:30,height:30})).toBe(true);
  expect(footprintOverlapsRect(concave,{x:20,y:0,width:10,height:10})).toBe(false);
  expect(polygonSchema.safeParse({points:[{x:0,y:0},{x:20,y:20},{x:0,y:20},{x:20,y:0}]}).success).toBe(false);
  expect(mapObjectSchema.safeParse({...STARTER_OBJECT_METADATA[0],fadeDurationMs:300}).success).toBe(false);
  const manager=new OcclusionManager(STARTER_MAP.props);
  expect(manager.visibleObjects({x:0,y:0,width:400,height:410}).map(o=>o.objectId)).toContain('house-0');
});
