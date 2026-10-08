import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const source = 'assets/maps/starter_village/tiled';
const target = 'packages/shared/src/starter-data.ts';
const publicRoot = 'apps/web/public/assets/maps/starter_village';
const registry = JSON.parse(fs.readFileSync('assets/maps/starter_village/registry.json', 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(source, 'map.embedded.tmj'), 'utf8'));
const generated = '// Generated from the official Forge Tiled export; not Phase 1 fixture.\nexport const STARTER_TILED_DATA = ' + JSON.stringify(data, null, 2) + ';\nexport const STARTER_REGISTRY = ' + JSON.stringify(registry, null, 2) + ';\n';
if (process.argv.includes('--check')) {
  assert.equal(fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n'), generated);
  for (const file of fs.readdirSync(path.join(source, 'images'))) assert.deepEqual(fs.readFileSync(path.join(source, 'images', file)), fs.readFileSync(path.join(publicRoot, 'images', file)));
  console.log(JSON.stringify({ status: 'PASS', check: 'Tiled/registry/generated TS/public image consistency' }));
  process.exit(0);
}
if (fs.existsSync(target) || fs.existsSync(publicRoot)) throw new Error('Preserving existing runtime output');
fs.writeFileSync(target, generated);
fs.mkdirSync(publicRoot, { recursive: true });
fs.cpSync(path.join(source, 'images'), path.join(publicRoot, 'images'), { recursive: true, errorOnExist: true, force: false });
console.log('Starter Tiled data and real generated assets copied');
