import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const source = 'assets/maps/starter_village/tiled';
const target = 'packages/shared/src/starter-data.ts';
const publicRoot = 'apps/web/public/assets/maps/starter_village';
const registry = JSON.parse(fs.readFileSync('assets/maps/starter_village/registry.json', 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(source, 'map.embedded.tmj'), 'utf8'));
const metadata = JSON.parse(fs.readFileSync('assets/maps/starter_village/object-metadata.json', 'utf8'));
function geometryLayers(map) {
  let id=100;
  const objects=(field)=>metadata.flatMap(o=>(field==='collisionFootprint'?o[field]:o[field]?[o[field]]:[]).map((shape,i)=> {
    const base={id:id++,name:`${o.objectId}-${field}-${i}`,type:field,rotation:0,visible:true,properties:[{name:'objectId',type:'string',value:o.objectId}]};
    return 'points' in shape?{...base,x:0,y:0,width:0,height:0,polygon:shape.points}:{...base,...shape};
  }));
  const layers=map.layers.filter(l=>!['collision','occlusion','sorting-anchors'].includes(l.name));
  layers.push({id:3,name:'collision',type:'objectgroup',visible:false,opacity:1,x:0,y:0,objects:objects('collisionFootprint')});
  layers.push({id:5,name:'occlusion',type:'objectgroup',visible:false,opacity:1,x:0,y:0,objects:objects('occlusionRegion')});
  layers.push({id:6,name:'sorting-anchors',type:'objectgroup',visible:false,opacity:1,x:0,y:0,objects:metadata.map(o=>({id:id++,name:o.objectId,type:'sorting-anchor',point:true,...o.sortingAnchor,width:0,height:0}))});
  return {...map,layers,nextlayerid:7,nextobjectid:id};
}
if(process.argv.includes('--update-metadata')) {
  for(const name of ['map.embedded.tmj','map.tmj']) {
    const file=path.join(source,name);const map=JSON.parse(fs.readFileSync(file,'utf8'));fs.writeFileSync(file,JSON.stringify(geometryLayers(map),null,2)+'\n');
  }
  Object.assign(data,JSON.parse(fs.readFileSync(path.join(source,'map.embedded.tmj'),'utf8')));
}
const generated = '// Generated from official Tiled and authored object metadata; not Phase 1 fixture.\nexport const STARTER_TILED_DATA = ' + JSON.stringify(data, null, 2) + ';\nexport const STARTER_REGISTRY = ' + JSON.stringify(registry, null, 2) + ';\nexport const STARTER_OBJECT_METADATA = ' + JSON.stringify(metadata, null, 2) + ';\n';
if (process.argv.includes('--check')) {
  assert.deepEqual(data,geometryLayers(data),'Tiled collision/occlusion must agree with object metadata');
  assert.equal(fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n'), generated);
  for (const file of fs.readdirSync(path.join(source, 'images'))) assert.deepEqual(fs.readFileSync(path.join(source, 'images', file)), fs.readFileSync(path.join(publicRoot, 'images', file)));
  console.log(JSON.stringify({ status: 'PASS', check: 'Tiled/registry/generated TS/public image consistency' }));
  process.exit(0);
}
if(process.argv.includes('--update-metadata')) {
  fs.writeFileSync(target,generated);
  console.log('Updated embedded map/object metadata; art unchanged');
  process.exit(0);
}
if (fs.existsSync(target) || fs.existsSync(publicRoot)) throw new Error('Preserving existing runtime output');
fs.writeFileSync(target, generated);
fs.mkdirSync(publicRoot, { recursive: true });
fs.cpSync(path.join(source, 'images'), path.join(publicRoot, 'images'), { recursive: true, errorOnExist: true, force: false });
console.log('Starter Tiled data and real generated assets copied');
