import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve('assets/maps/starter_village');
const target = path.join(root, 'map-bundle.json');
if ([target, path.join(root, 'registry.json'), path.join(root, 'generation.json')].some(file => fs.existsSync(file))) throw new Error('Preserving existing starter output');
const pack = JSON.parse(fs.readFileSync(path.join(root, 'props-clean/prop-pack.json'), 'utf8'));
const objects = [], rects = [];
for (const [kind, x, y] of [['house', 260, 400], ['house', 990, 400], ['house', 260, 1070], ['tree', 990, 1040], ['tree', 300, 750], ['tree', 1010, 700]]) {
  const asset = pack.accepted.find(item => item.label === kind);
  if (!asset) throw new Error('Missing accepted prop');
  const anchor = asset.anchor_px;
  if (!anchor) throw new Error('Missing anchor');
  const [width, height] = asset.output_size.map(value => value * 0.5);
  const left = x - anchor[0] * 0.5, top = y - anchor[1] * 0.5;
  const collider = kind === 'house' ? [left, top, width, height] : [x - 18, y - 12, 36, 24];
  rects.push(collider);
  objects.push({ id: `${kind}-${objects.length}`, prop: kind, kind, x, y, scale: 0.5,
    image: `props-clean/${asset.image}`, anchor_px: anchor, sortY: y,
    solid: false, footprint: { shape: 'none' }, occupant_policy: 'y_sort',
    runtimeCollision: collider, occlusionRect: kind === 'tree' ? [left, top, width, Math.max(0, y - top - 20)] : null });
}
const bundle = { schema: 'generate2dmap.map_bundle.v2', id: 'starter_village', name: 'Starter Village', tile_size: 32,
  world: { width: 1254, height: 1254, unit: 'px' },
  layers: [{ name: 'terrain', kind: 'image', image: 'raw/terrain.png', offset: [0, 0] }, { name: 'props', kind: 'objects' }],
  objects, collision: { actorRadius: 12, ySquash: 1, rects }, nav: { cell: 6 },
  spawns: [{ id: 'starter_respawn_01', x: 624, y: 624, facing: 'S' }],
  anchors: { paths: { point: [624, 624], slots: [[624, 96], [96, 624]], approach: [] } },
  art_source: 'host_image', placeholder: false,
  provenance: { tool: 'build-starter-map', version: '1', params: { unit: 32, artSource: 'host_image' }, inputs: [], route: 'host_image', model: 'not exposed by host tool', estimateUsd: null,
    note: 'Original terrain and props generated in Codex Client; retained raw originals. Runtime movement parameters inherited unchanged; not new balance. Spawn at plaza-center walkable cell.' } };
fs.writeFileSync(path.join(root, 'registry.json'), JSON.stringify({"areas": [{"id": "area_01", "mapId": "starter_village", "zone": "SAFE", "bounds": [0, 0, 1254, 1254]}], "runtime": {"moveSpeed": 160, "tickMs": 50, "inputTimeoutMs": 250, "footprint": {"halfWidth": 10, "halfHeight": 6}, "renderScale": 0.9, "zoomMin": 0.5, "zoomMax": 1.5}}, null, 2) + '\n');
fs.writeFileSync(target, JSON.stringify(bundle, null, 2) + '\n');
const hashes = Object.fromEntries(['raw/terrain.png', 'raw/props-first.png', 'raw/props.png'].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
fs.writeFileSync(path.join(root, 'generation.json'), JSON.stringify({ route: 'host_image', status: 'generated-not-yet-integrated', hashes, propsRepairAttempts: 1 }, null, 2) + '\n');
console.log(target);
