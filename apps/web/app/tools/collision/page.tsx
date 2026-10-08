'use client';
import { useMemo, useRef, useState } from 'react';
import { STARTER_MAP, STARTER_OBJECT_METADATA, STARTER_TILED_DATA, STARTER_REGISTRY, loadStarterMap, mapObjectSchema, OcclusionManager, vertices, type MapObject, type Point, type Footprint } from '@mmorpg/shared';

export default function CollisionEditor() {
  const [objects,setObjects]=useState<MapObject[]>(()=>STARTER_OBJECT_METADATA.map(o=>mapObjectSchema.parse(o)));
  const [selected,setSelected]=useState(objects[0]!.objectId);
  const [mode,setMode]=useState<'collision'|'occlusion'|'anchor'|'actors'>('collision');
  const [part,setPart]=useState(0),[adding,setAdding]=useState(false),[debug,setDebug]=useState(true);
  const [actors,setActors]=useState<(Point&{id:string})[]>([]);
  const [json,setJson]=useState(''),[message,setMessage]=useState('');
  const drag=useRef<number|null>(null);
  const object=objects.find(o=>o.objectId===selected)!;
  const shape=mode==='occlusion'?object.occlusionRegion:object.collisionFootprint[part];
  const manager=useMemo(()=>new OcclusionManager(objects),[objects]); manager.update(actors);
  function edit(change:(o:MapObject)=>void) { setObjects(current=>current.map(o=> {if(o.objectId!==selected)return o;const copy=structuredClone(o);change(copy);return copy;})); }
  function location(event:React.PointerEvent<SVGSVGElement>):Point {
    const svg=event.currentTarget,point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
    const transformed=point.matrixTransform(svg.getScreenCTM()!.inverse());return {x:Math.round(transformed.x),y:Math.round(transformed.y)};
  }
  function changePoint(point:Point,index:number) {
    edit(o=>{if(mode==='anchor'){o.sortingAnchor=point;return;}const source=mode==='occlusion'?o.occlusionRegion:o.collisionFootprint[part];if(!source)return;const next={points:vertices(source).map((p,i)=>i===index?point:p)};if(mode==='occlusion')o.occlusionRegion=next;else o.collisionFootprint[part]=next;});
  }
  function validate() { loadStarterMap(STARTER_TILED_DATA,STARTER_REGISTRY,objects); }
  function exportJson() {
    try {validate();const text=JSON.stringify(objects,null,2);setJson(text);const url=URL.createObjectURL(new Blob([text+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='object-metadata.json';a.click();URL.revokeObjectURL(url);setMessage('Đã xuất JSON. Chưa đổi collision của server.');} catch {setMessage('Metadata không hợp lệ: kiểm tra polygon tự cắt, fade hoặc bounds.');}
  }
  const line=(s:Footprint)=>vertices(s).map(p=>`${p.x},${p.y}`).join(' ');
  return <main><h1>Collision & occlusion editor</h1><p>Footprint ban đầu được đối chiếu asset, chưa có đường trắng tham chiếu. Trắng: collision; cyan: occlusion; vàng: sorting anchor. Kéo đỉnh để chỉnh. Editor chỉ xuất metadata; server tiếp tục dùng bản đã kiểm định.</p>
    <div className="toolbar"><select aria-label="Object" value={selected} onChange={e=>{setSelected(e.target.value);setPart(0);}}>{objects.map(o=><option key={o.objectId}>{o.objectId}</option>)}</select>
      <select aria-label="Geometry" value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="collision">Collision footprint</option><option value="occlusion">Occlusion region</option><option value="anchor">Sorting anchor</option><option value="actors">Thử local/remote</option></select>
      {mode==='collision' && <><select aria-label="Footprint part" value={part} onChange={e=>setPart(Number(e.target.value))}>{object.collisionFootprint.map((_,i)=><option key={i} value={i}>Phần {i+1}</option>)}</select><button onClick={()=>edit(o=>o.collisionFootprint.push({x:o.visualBounds.x+20,y:o.visualBounds.y+200,width:40,height:20}))}>Thêm AABB</button></>}
      <button onClick={()=>setDebug(!debug)}>Bật/tắt overlays</button><button onClick={()=>setAdding(!adding)} aria-pressed={adding}>Thêm đỉnh bằng click</button><button onClick={()=>{if(shape&&vertices(shape).length>3)edit(o=>{const next={points:vertices(shape).slice(0,-1)};if(mode==='occlusion')o.occlusionRegion=next;else o.collisionFootprint[part]=next;});}}>Xóa đỉnh cuối</button><button onClick={()=>setActors([])}>Xóa nhân vật thử</button><button onClick={exportJson}>Xuất JSON</button><a href="/starter">Xem multiplayer</a></div>
    <svg role="img" aria-label="Map geometry editor" viewBox={`0 0 ${STARTER_MAP.world.width} ${STARTER_MAP.world.height}`} style={{width:'100%',maxWidth:1000,touchAction:'none',background:'#162a30'}}
      onPointerDown={e=>{const p=location(e);if(mode==='actors')setActors(a=>[...a,{...p,id:a.length?'remote-'+a.length:'local'}]);else if(mode==='anchor')changePoint(p,0);else if(adding&&shape)edit(o=>{const next={points:[...vertices(shape),p]};if(mode==='occlusion')o.occlusionRegion=next;else o.collisionFootprint[part]=next;});}}
      onPointerMove={e=>{if(drag.current!==null)changePoint(location(e),drag.current);}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <image href={STARTER_MAP.ground} width={STARTER_MAP.world.width} height={STARTER_MAP.world.height}/>
      {STARTER_MAP.props.map(p=>{const o=objects.find(o=>o.objectId===p.id)!;return <image key={p.id} href={p.image} {...o.visualBounds} opacity={manager.target(p.id)}/>;})}
      {debug&&objects.map(o=><g key={o.objectId} fill="none" strokeWidth={o.objectId===selected?3:1}>
        {o.collisionFootprint.map((s,i)=><polygon key={i} points={line(s)} stroke="white"/>)}{o.occlusionRegion&&<polygon points={line(o.occlusionRegion)} stroke="cyan"/>}
        <path d={`M ${o.sortingAnchor.x-8} ${o.sortingAnchor.y} h 16 M ${o.sortingAnchor.x} ${o.sortingAnchor.y-8} v 16`} stroke="yellow"/>
      </g>)}
      {debug && (mode==='collision'||mode==='occlusion')&&shape&&vertices(shape).map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={6} fill="orange" onPointerDown={e=>{e.stopPropagation();drag.current=i;e.currentTarget.ownerSVGElement!.setPointerCapture(e.pointerId);}}/>)}
      {actors.map(a=><g key={a.id}><circle cx={a.x} cy={a.y} r={8} fill={a.id==='local'?'lime':'magenta'}/><text x={a.x+10} y={a.y} fill="white" fontSize={20}>{a.id}</text></g>)}
    </svg>
    <p>Đang chọn {selected}. Fade 0.4 / {object.fadeDurationMs}ms. Actor thử nằm ngoài mạng; không thay dữ liệu nhân vật thật.</p>
    <textarea aria-label="Metadata JSON" rows={8} style={{width:'100%'}} value={json} onChange={e=>setJson(e.target.value)}/>
    <button onClick={()=>{try{const values:unknown=JSON.parse(json);if(!Array.isArray(values))throw new Error();const parsed=values.map(v=>mapObjectSchema.parse(v));if(parsed.length!==objects.length||new Set(parsed.map(o=>o.objectId)).size!==objects.length||parsed.some(o=>!objects.some(p=>p.objectId===o.objectId)))throw new Error();setObjects(parsed);setMessage('Đã nhập vào preview editor.');}catch{setMessage('JSON không hợp lệ hoặc object ID không khớp.');}}}>Nhập JSON vào preview</button><p role="status">{message}</p>
  </main>;
}
