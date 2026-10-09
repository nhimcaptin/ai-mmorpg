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
let browser;const errors=[];const checks=[];const httpErrors=[];
try{browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.previewReady===true);
  const snapshot=()=>page.locator('canvas').evaluate(c=>c.toDataURL());const full=await snapshot();
  for(const n of ['HairBack','HairFront','Top','Bottom','Shoes']){const cb=page.locator(`[data-layer="${n}"]`);await cb.uncheck();
    if(await snapshot()===full)throw new Error(`${n}: toggle had no effect`);checks.push(`${n}:OFF`);
    await cb.check();if(await snapshot()!==full)throw new Error(`${n}: restore mismatch`);checks.push(`${n}:RESTORE`);}
  await page.locator('#nohair').click();if(await snapshot()===full)throw new Error('No Hair group ineffective');checks.push('NoHair:OFF');
  await page.locator('#full').click();if(await snapshot()!==full)throw new Error('No Hair restore mismatch');checks.push('NoHair:RESTORE');
  await page.locator('#body').click();const bodyMatches=await page.locator('canvas').evaluate(async canvas=>{
    const image=new Image();image.src='layers/Body.png';await image.decode();const expected=document.createElement('canvas');expected.width=expected.height=128;
    const ctx=expected.getContext('2d');ctx.drawImage(image,0,0);const a=ctx.getImageData(0,0,128,128).data,b=canvas.getContext('2d').getImageData(0,0,128,128).data;
    return a.every((value,i)=>value===b[i]);
  });if(!bodyMatches)throw new Error('Body Only differs from independent Body');checks.push('BodyOnly:exact');
  await page.locator('#full').click();if(await snapshot()!==full)throw new Error('Body Only restore mismatch');checks.push('BodyOnly:RESTORE');
  const dimensions=await page.locator('canvas').evaluate(c=>[c.width,c.height]);if(String(dimensions)!=='128,128')throw new Error('canvas size');
  checks.push('canvas128');if(errors.length)throw new Error(errors.join('\n'));
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  if(httpErrors.length)throw new Error(JSON.stringify(httpErrors));
  await page.screenshot({path:resolve(base,'browser-preview.png'),fullPage:true});
  const result={status:'PASS',checks,errors,httpErrors,assetStatus:'PENDING_USER_APPROVAL',scope:'offline preview only; not gameplay E2E'};
  await writeFile(resolve(base,'browser-report.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
