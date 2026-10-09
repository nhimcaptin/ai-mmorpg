import { test, expect, type Page } from '@playwright/test';
import { STARTER_MAP } from '@mmorpg/shared';
async function actors(page:Page) {return JSON.parse(await page.getByTestId('world').getAttribute('data-players')??'[]') as {id:string;x:number;y:number}[];}
async function local(page:Page) {const id=await page.getByTestId('world').getAttribute('data-local-id');return (await actors(page)).find(a=>a.id===id)!;}
async function props(page:Page) {return JSON.parse(await page.getByTestId('world').getAttribute('data-props')??'[]') as {id:string;alpha:number;target:number;depth:number}[];}
async function walk(page:Page,key:string,axis:'x'|'y',target:number) {
  await page.bringToFront();const from=(await local(page))[axis];
  await page.keyboard.down(key);
  try {await expect.poll(async()=>(await local(page))[axis],{intervals:[20],timeout:6000})[target<from?'toBeLessThanOrEqual':'toBeGreaterThanOrEqual'](target);}
  finally {await page.keyboard.up(key);}
  await page.waitForTimeout(200);
}
async function approach(page:Page,key:string,axis:'x'|'y',target:number) {
  await page.bringToFront();
  const from=(await local(page))[axis],sign=target<from?-1:1;
  // Atomic key presses release before trace/DOM polling; no teleport or test-only game hook.
  for(let step=0;step<30;step++) {
    const position=(await local(page))[axis];
    if(sign*(target-position)<=0) return;
    const delay=Math.min(200,Math.max(STARTER_MAP.world.tickMs*1.5,Math.abs(target-position)/STARTER_MAP.world.moveSpeed*1000));
    await page.keyboard.press(key,{delay});
    await page.waitForTimeout(STARTER_MAP.world.tickMs*2);
  }
  throw new Error(`Real keyboard approach did not reach ${axis}=${target}`);
}
async function fade(pages:Page[],id:string,target:number) {for(const p of pages)await expect.poll(async()=> (await props(p)).find(o=>o.id===id)!.alpha).toBeCloseTo(target,3);}
test('two clients aggregate house occlusion and preserve it until last actor leaves; disconnect/rejoin clears stale coverage',async({browser,baseURL})=>{
  test.setTimeout(60000);
  const a=await browser.newContext({baseURL}),b=await browser.newContext({baseURL});
  const first=await a.newPage(),second=await b.newPage(),errors:string[]=[];
  for(const p of [first,second]) {p.on('pageerror',e=>errors.push(e.message));await p.goto('/starter');await expect(p.getByTestId('world')).toHaveAttribute('data-status','connected');}
  await expect.poll(async()=>(await actors(first)).length).toBe(2);
  await first.evaluate(()=>{
    const host=document.querySelector('[data-testid=world]')!;
    const samples:number[]=[];
    (window as unknown as {fadeSamples:number[]}).fadeSamples=samples;
    new MutationObserver(()=>{const props=JSON.parse(host.getAttribute('data-props')??'[]') as {id:string;alpha:number}[];const prop=props.find(p=>p.id==='house-0');if(prop)samples.push(prop.alpha);}).observe(host,{attributes:true,attributeFilter:['data-props']});
  });
  await walk(first,'w','y',280);await walk(first,'a','x',260);
  await fade([first,second],'house-0',0.4); // second sees a remote character trigger fade.
  // Stable snapshots do not restart tweens or scan every prop for target changes.
  for(const page of [first,second]) await expect.poll(async()=>JSON.parse(await page.getByTestId('world').getAttribute('data-occlusion-work')??'{}').changed).toBe(0);
  expect(await first.evaluate(()=>(window as unknown as {fadeSamples:number[]}).fadeSamples.some(a=>a>0.4&&a<1))).toBe(true);
  await walk(second,'w','y',280);await walk(second,'a','x',260);
  await fade([first,second],'house-0',0.4);
  await first.getByRole('button',{name:'Collision debug'}).click();
  await expect(first.getByTestId('world')).toHaveAttribute('data-debug','true');
  await first.screenshot({path:'test-results/multiplayer-house-occlusion.png'});
  await walk(first,'d','x',624);await fade([first,second],'house-0',0.4);
  await second.getByRole('button',{name:'Ngắt kết nối'}).click();
  await expect.poll(async()=>(await actors(first)).length).toBe(1);
  await fade([first,second],'house-0',1);
  await second.reload();await expect(second.getByTestId('world')).toHaveAttribute('data-status','connected');
  await expect.poll(async()=>(await actors(first)).length).toBe(2);await fade([first,second],'house-0',1);
  await walk(second,'w','y',280);await walk(second,'a','x',260);await fade([first,second],'house-0',0.4);
  await walk(second,'d','x',624);await fade([first,second],'house-0',1);
  expect(errors).toEqual([]);await a.close();await b.close();
});
test('editor exposes independent geometry, draggable vertices, overlays and JSON validation',async({page})=>{
  await page.goto('/tools/collision');await expect(page.getByRole('heading')).toHaveText('Collision & occlusion editor');
  await expect(page.locator('svg circle')).toHaveCount(9);
  const before=await page.locator('svg circle').first().getAttribute('cx');
  const point=(await page.locator('svg circle').first().boundingBox())!;
  await page.mouse.move(point.x+point.width/2,point.y+point.height/2);await page.mouse.down();await page.mouse.move(point.x+point.width/2+8,point.y+point.height/2);await page.mouse.up();
  expect(await page.locator('svg circle').first().getAttribute('cx')).not.toBe(before);
  await page.getByLabel('Geometry',{exact:true}).selectOption('occlusion');await expect(page.locator('svg circle')).toHaveCount(9);
  await page.getByRole('button',{name:'Bật/tắt overlays'}).click();await expect(page.locator('svg polygon')).toHaveCount(0);
  await page.getByLabel('Metadata JSON').fill('[]');await page.getByRole('button',{name:'Nhập JSON vào preview'}).click();await expect(page.getByRole('status')).toContainText('không hợp lệ');
});
test('front-side actor is visible without fading the house; held input slides and replicates to observer',async({browser,baseURL})=>{
  test.setTimeout(45000);
  const a=await browser.newContext({baseURL}),b=await browser.newContext({baseURL});
  const first=await a.newPage(),observer=await b.newPage();
  await first.goto('/starter');await observer.goto('/starter');
  for(const p of [first,observer]) await expect(p.getByTestId('world')).toHaveAttribute('data-status','connected');
  await approach(first,'a','x',110);await approach(first,'w','y',360);
  await fade([first,observer],'house-0',1);
  const actor=await local(first);
  expect(actor.x).toBeGreaterThan(90);expect(actor.x).toBeLessThanOrEqual(110);
  expect(actor.y).toBeGreaterThan(340);expect(actor.y).toBeLessThanOrEqual(360);
  for(const p of [first,observer]) await expect.poll(async()=>{
    const visuals=JSON.parse(await p.getByTestId('world').getAttribute('data-rendering')??'[]') as {id:string;depth:number;alpha:number}[];
    return visuals.find(v=>v.id===actor.id)?.depth??0;
  }).toBeGreaterThan(400);
  await first.screenshot({path:'test-results/house-front-visible.png'});
  await first.goto('/');await observer.goto('/');
  await expect.poll(async()=>(await actors(first)).length).toBe(2);
  await first.bringToFront();await first.keyboard.down('d');
  await expect.poll(async()=>(await local(first)).x,{timeout:6000,intervals:[20]}).toBeGreaterThan(368);
  const blocked=await local(first);
  await expect.poll(async()=>Math.abs((await local(first)).y-blocked.y),{intervals:[20]}).toBeGreaterThan(16);
  await first.keyboard.up('d');
  await expect.poll(async()=>Math.abs((await actors(observer)).find(p=>p.id===blocked.id)!.y-blocked.y)).toBeGreaterThan(16);
  expect((await local(first)).x).toBeLessThanOrEqual(374);
  await a.close();await b.close();
});
