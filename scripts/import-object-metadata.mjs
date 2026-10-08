import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadStarterMap, STARTER_TILED_DATA, STARTER_REGISTRY } from '../packages/shared/dist/index.js';
const file=process.argv[2];
if(!file) throw new Error('Usage: node scripts/import-object-metadata.mjs <exported-json> (build shared first)');
const value=JSON.parse(fs.readFileSync(file,'utf8'));
// Strict full map validation before writing; no endpoint or runtime mutation.
loadStarterMap(STARTER_TILED_DATA,STARTER_REGISTRY,value);
fs.writeFileSync('assets/maps/starter_village/object-metadata.json',JSON.stringify(value,null,2)+'\n');
execFileSync(process.execPath,['scripts/build-starter-runtime.mjs','--update-metadata'],{stdio:'inherit'});
