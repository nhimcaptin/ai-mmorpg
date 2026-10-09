import { boundaryDistance, containsPoint, rearBoundaryY, shapeBounds, type Bounds, type MapObject, type Point } from './geometry.js';
export interface VisibleActor extends Point { id: string }
/** Static grid, fed only the actors permitted in the client's current area snapshot. */
export class OcclusionManager {
  private cells = new Map<string, MapObject[]>();
  private covered = new Map<string, Set<string>>();
  private active = new Set<string>();
  private changed = new Set<string>();
  private candidateChecks = 0;
  get changedObjectIds(): ReadonlySet<string> { return this.changed; }
  get lastCandidateChecks() { return this.candidateChecks; }
  readonly objects: Map<string, MapObject>;
  constructor(objects: MapObject[], private cellSize = 128) {
    this.objects = new Map(objects.map(o=>[o.objectId,o]));
    for(const object of objects) if(object.occlusionRegion) {
      const b=shapeBounds(object.occlusionRegion);
      for(let x=Math.floor(b.x/cellSize);x<=Math.floor((b.x+b.width)/cellSize);x++)
        for(let y=Math.floor(b.y/cellSize);y<=Math.floor((b.y+b.height)/cellSize);y++) {
          const key=`${x},${y}`,list=this.cells.get(key)??[];list.push(object);this.cells.set(key,list);
        }
    }
  }
  update(actors: VisibleActor[]): ReadonlySet<string> {
    this.candidateChecks = 0;
    const next=new Map<string,Set<string>>();
    for(const actor of actors) {
      const previous=this.covered.get(actor.id),ids=new Set<string>();
      for(const object of this.cells.get(`${Math.floor(actor.x/this.cellSize)},${Math.floor(actor.y/this.cellSize)}`)??[]) {
        this.candidateChecks++;
        const region=object.occlusionRegion!;
        // Ground footprint's rear envelope and authored region describe behind-object coverage.
        // Enter inside an inset; retain only within the original region (no outside fade).
        const rear=rearBoundaryY(object,actor.x),inset=previous?.has(object.objectId)?0:object.boundaryInset;
        if(actor.y<rear-inset && containsPoint(region,actor) && (previous?.has(object.objectId) || boundaryDistance(region,actor)>=object.boundaryInset)) ids.add(object.objectId);
      }
      next.set(actor.id,ids);
    }
    this.covered=next;
    const active=new Set([...next.values()].flatMap(ids=>[...ids]));
    this.changed=new Set([...this.active,...active].filter(id=>this.active.has(id)!==active.has(id)));
    this.active=active;
    return this.active;
  }
  clear() { this.changed=new Set(this.active); this.covered.clear(); this.active.clear(); this.candidateChecks=0; }
  actorDepth(actor: Point, body?: Bounds) {
    let depth=actor.y+0.1;
    for(const object of this.visibleObjects(body??{x:actor.x,y:actor.y,width:1,height:1})) {
      const b=object.visualBounds;
      const intersects=body?body.x<b.x+b.width && body.x+body.width>b.x:actor.x>=b.x && actor.x<=b.x+b.width;
      if(intersects && actor.y>=b.y && actor.y<=b.y+b.height && actor.y>=rearBoundaryY(object,actor.x)) depth=Math.max(depth,object.sortingAnchor.y+0.1);
    }
    return depth;
  }
  target(objectId: string) { return this.active.has(objectId) ? this.objects.get(objectId)!.fadeOpacity : 1; }
  visibleObjects(viewport: Bounds): MapObject[] {
    const ids=new Set<MapObject>();
    for(let x=Math.floor(viewport.x/this.cellSize);x<=Math.floor((viewport.x+viewport.width)/this.cellSize);x++)
      for(let y=Math.floor(viewport.y/this.cellSize);y<=Math.floor((viewport.y+viewport.height)/this.cellSize);y++)
        for(const object of this.cells.get(`${x},${y}`)??[]) ids.add(object);
    return [...ids];
  }
}
