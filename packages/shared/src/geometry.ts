import { z } from 'zod';
export interface Point { x: number; y: number }
export interface Bounds extends Point { width: number; height: number }
const finite = z.number().finite();
export const pointSchema = z.object({ x: finite, y: finite }).strict();
export const boundsSchema = pointSchema.extend({ width: finite.positive(), height: finite.positive() }).strict();
export interface Polygon { points: Point[] }
export type Footprint = Bounds | Polygon;
export function cross(a: Point, b: Point, p: Point) { return (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x); }
function onSegment(a: Point, b: Point, p: Point) { return Math.abs(cross(a,b,p)) < 1e-8 && p.x >= Math.min(a.x,b.x) && p.x <= Math.max(a.x,b.x) && p.y >= Math.min(a.y,b.y) && p.y <= Math.max(a.y,b.y); }
function segmentsIntersect(a: Point,b: Point,c: Point,d: Point) {
  return (cross(a,b,c)*cross(a,b,d)<0 && cross(c,d,a)*cross(c,d,b)<0) || onSegment(a,b,c) || onSegment(a,b,d) || onSegment(c,d,a) || onSegment(c,d,b);
}
export function validPolygon(points: Point[]) {
  if (points.length < 3 || Math.abs(points.reduce((s,p,i)=> { const q=points[(i+1)%points.length]!; return s+p.x*q.y-q.x*p.y; },0)) < 1e-6) return false;
  for(let i=0;i<points.length;i++) {
    const a=points[i]!,b=points[(i+1)%points.length]!;
    if(a.x===b.x && a.y===b.y) return false;
    for(let j=i+1;j<points.length;j++) {
      if(j===i+1 || (i===0 && j===points.length-1)) continue;
      if(segmentsIntersect(a,b,points[j]!,points[(j+1)%points.length]!)) return false;
    }
  }
  return true;
}
export const polygonSchema = z.object({ points: z.array(pointSchema).min(3).max(128) }).strict().refine(p=>validPolygon(p.points),'Invalid or self-intersecting polygon');
export const footprintSchema = z.union([boundsSchema,polygonSchema]);
export function vertices(shape: Footprint): Point[] { return 'points' in shape ? shape.points : [{x:shape.x,y:shape.y},{x:shape.x+shape.width,y:shape.y},{x:shape.x+shape.width,y:shape.y+shape.height},{x:shape.x,y:shape.y+shape.height}]; }
export function shapeBounds(shape: Footprint): Bounds {
  if(!('points' in shape)) return shape;
  const xs=shape.points.map(p=>p.x),ys=shape.points.map(p=>p.y);
  return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
}
export function containsPoint(shape: Footprint,p: Point) {
  const points=vertices(shape); let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++) {
    const a=points[i]!,b=points[j]!;
    if(onSegment(a,b,p)) return true;
    if((a.y>p.y)!==(b.y>p.y) && p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) inside=!inside;
  }
  return inside;
}
export function boundaryDistance(shape: Footprint,p: Point) {
  const points=vertices(shape);
  return Math.min(...points.map((a,i)=>{const b=points[(i+1)%points.length]!,dx=b.x-a.x,dy=b.y-a.y; const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}));
}
/** Positive-area overlap; touching a boundary remains walkable. Concave simple polygons supported. */
export function footprintOverlapsRect(shape: Footprint,rect: Bounds) {
  const b=shapeBounds(shape);
  if(b.x>=rect.x+rect.width || b.x+b.width<=rect.x || b.y>=rect.y+rect.height || b.y+b.height<=rect.y) return false;
  if(!('points' in shape)) return true;
  // Clip each edge to the open rectangle, then test corners/interior.
  const corners=vertices(rect);
  if(corners.some(p=>containsPoint(shape,p) && boundaryDistance(shape,p)>1e-8)) return true;
  if(shape.points.some(p=>p.x>rect.x && p.x<rect.x+rect.width && p.y>rect.y && p.y<rect.y+rect.height)) return true;
  for(let i=0;i<shape.points.length;i++) {
    const a=shape.points[i]!,c=shape.points[(i+1)%shape.points.length]!;
    let lo=0,hi=1;
    for(const [origin,delta,min,max] of [[a.x,c.x-a.x,rect.x,rect.x+rect.width],[a.y,c.y-a.y,rect.y,rect.y+rect.height]]) {
      if(delta===0) {if(origin!<=min! || origin!>=max!) {hi=-1;break;}}
      else {const t1=(min!-origin!)/delta!,t2=(max!-origin!)/delta!;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));}
    }
    if(hi>lo) {const t=(lo+hi)/2,p={x:a.x+(c.x-a.x)*t,y:a.y+(c.y-a.y)*t};if(p.x>rect.x && p.x<rect.x+rect.width && p.y>rect.y && p.y<rect.y+rect.height)return true;}
  }
  return containsPoint(shape,{x:rect.x+rect.width/2,y:rect.y+rect.height/2});
}
export const mapObjectSchema = z.object({
  objectId:z.string().min(1), visualBounds:boundsSchema, collisionFootprint:z.array(footprintSchema),
  occlusionRegion:footprintSchema.nullable(), sortingAnchor:pointSchema,
  fadeOpacity:z.literal(0.4), fadeDurationMs:z.number().min(150).max(200), boundaryInset:finite.nonnegative()
}).strict();
export type MapObject = z.infer<typeof mapObjectSchema>;
