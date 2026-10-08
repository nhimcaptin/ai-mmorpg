import type { Direction, Position, WorldConfig } from '@mmorpg/shared';
import { footprintOverlapsRect, vertices } from '@mmorpg/shared';
export type { Runtime } from './runtime.js';
export * from './numeric.js';

export function directionFor(x: number, y: number, previous: Direction): Direction {
  if (!x && !y) return previous;
  // Vertical ưu tiên khi hai thành phần bằng nhau, chỉ ảnh hưởng animation.
  return Math.abs(y) >= Math.abs(x) ? (y > 0 ? 'S' : 'N') : (x > 0 ? 'E' : 'W');
}
export function canOccupy(position: Position, world: WorldConfig): boolean {
  const { halfWidth: w, halfHeight: h } = world.footprint;
  if (position.x - w < 0 || position.y - h < 0 || position.x + w > world.width || position.y + h > world.height) return false;
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return false;
  const rect={x:position.x-w,y:position.y-h,width:2*w,height:2*h};
  return ![...world.obstacles,...world.collisionPolygons??[]].some(shape=>footprintOverlapsRect(shape,rect));
}
export function move(position: Position, input: Position, seconds: number, world: WorldConfig): Position {
  if (!Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(input.x) || !Number.isFinite(input.y)) throw new Error('Invalid movement');
  const length = Math.hypot(input.x, input.y);
  if (!length) return { ...position };
  const distance = world.moveSpeed * seconds;
  // Substeps prevent crossing thin collision shapes on delayed ticks.
  const steps = Math.max(1, Math.ceil(distance / Math.min(world.footprint.halfWidth, world.footprint.halfHeight)));
  const dx = input.x / length * distance / steps, dy = input.y / length * distance / steps;
  const result = { ...position };
  for (let i = 0; i < steps; i++) {
    const direct={x:result.x+dx,y:result.y+dy};
    if(canOccupy(direct,world)) {Object.assign(result,direct);continue;}
    const start={...result};
    const nextX = { x: result.x + dx, y: result.y };
    if (canOccupy(nextX, world)) result.x = nextX.x;
    const nextY = { x: result.x, y: result.y + dy };
    if (canOccupy(nextY, world)) result.y = nextY.y;
    if(Math.hypot(result.x-start.x,result.y-start.y)>1e-8) continue;
    const candidates:{x:number;y:number;score:number;distance:number}[]=[];
    const blocked={x:direct.x-world.footprint.halfWidth,y:direct.y-world.footprint.halfHeight,width:2*world.footprint.halfWidth,height:2*world.footprint.halfHeight};
    const stride=Math.hypot(dx,dy);
    for(const shape of [...world.obstacles,...world.collisionPolygons??[]]) {
      if(!footprintOverlapsRect(shape,blocked)) continue;
      const points=vertices(shape);
      for(let j=0;j<points.length;j++) {
        const a=points[j]!,b=points[(j+1)%points.length]!,ex=b.x-a.x,ey=b.y-a.y,len=Math.hypot(ex,ey);
        const tx=ex/len,ty=ey/len,projection=dx*tx+dy*ty;
        const t=Math.max(0,Math.min(1,((start.x-a.x)*ex+(start.y-a.y)*ey)/(len*len)));
        const distance=Math.hypot(start.x-a.x-t*ex,start.y-a.y-t*ey);
        const sign=Math.abs(projection)>1e-8?Math.sign(projection):(Math.hypot(start.x-a.x,start.y-a.y)<=Math.hypot(start.x-b.x,start.y-b.y)?-1:1);
        for(const direction of Math.abs(projection)>1e-8?[sign]:[sign,-sign]) {
          const x=tx*stride*direction,y=ty*stride*direction;
          if(canOccupy({x:start.x+x,y:start.y+y},world)) candidates.push({x,y,score:(x*dx+y*dy)/(stride*stride),distance});
        }
      }
    }
    candidates.sort((a,b)=>a.distance-b.distance || b.score-a.score);
    const slide=candidates[0];if(slide) {result.x+=slide.x;result.y+=slide.y;}
  }
  return result;
}
