import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const base=fileURLToPath(new URL('.',import.meta.url));
const server=createServer(async(req,res)=>{
  try{const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'preview.html';
    const path=resolve(base,relative);if(!path.startsWith(base.endsWith(sep)?base:base+sep)){res.writeHead(403);res.end();return;}
    const types={'.png':'image/png','.json':'application/json','.html':'text/html; charset=utf-8'};
    res.setHeader('Content-Type',types[extname(path)]||'text/plain');res.end(await readFile(path));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;const errors=[];const checks=[];
try{browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.previewReady===true);
  const snapshot=()=>page.locator('canvas').evaluate(c=>c.toDataURL());const full=await snapshot();
  for(const n of ['Hair','Top','Bottom','Shoes']){const cb=page.locator(`[data-layer="${n}"]`);await cb.uncheck();
    if(await snapshot()===full)throw new Error(`${n}: toggle had no effect`);checks.push(`${n}:OFF`);
    await cb.check();if(await snapshot()!==full)throw new Error(`${n}: restore mismatch`);checks.push(`${n}:RESTORE`);}
  const dimensions=await page.locator('canvas').evaluate(c=>[c.width,c.height]);if(String(dimensions)!=='128,128')throw new Error('canvas size');
  checks.push('canvas128');if(errors.length)throw new Error(errors.join('\n'));
  await page.screenshot({path:resolve(base,'browser-preview.png'),fullPage:true});
  const result={status:'PASS',checks,errors,assetStatus:'BLOCKED',scope:'offline preview only; not gameplay E2E'};
  await writeFile(resolve(base,'browser-report.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
