// A/B the shipped renderer and current renderer in the SAME Chromium/4x CPU/full app.
// Real keyboard events; EXP and auth network boundaries only are mocked.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),out=path.join(root,'artifacts/typing-performance');await mkdir(out,{recursive:true});
const baseline='b60fc4c73c56a5e24a7c26b9d309a718a681c181';
const old={js:execFileSync('git',['show',baseline+':assets/games/typing-game.js'],{encoding:'utf8'}),css:execFileSync('git',['show',baseline+':assets/games/typing-game.css'],{encoding:'utf8'})};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(await readFile(file));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch(),results=[];
const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s]/g,'');
const quantile=(a,p)=>a.length?[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*p))]:0;
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  for(const mode of (viewport.width===1440?['easy','medium','hard']:['hard'])){
   for(const variant of ['baseline','optimized']){
    const name=viewport.width+'-'+mode+'-'+variant;console.log(name+': starting A/B sample');const record=viewport.width===1440&&mode==='hard';
    const context=await browser.newContext({viewport,serviceWorkers:'block',...(record?{recordVideo:{dir:out,size:viewport}}:{})}),page=await context.newPage();
    page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    if(variant==='baseline'){
     await page.route('**/assets/games/typing-game.js*',r=>r.fulfill({contentType:'text/javascript',body:old.js}));
     await page.route('**/assets/games/typing-game.css*',r=>r.fulfill({contentType:'text/css',body:old.css}));
    }
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:`window.supabase={createClient(){const q=()=>new Proxy({}, {get(o,k){if(k==='then')return ok=>Promise.resolve({data:[],error:null}).then(ok);return ()=>q()}});return {auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:q,rpc:async()=>({data:[],error:null})}}};`}));
    await page.route('https://*.supabase.co/**',r=>r.abort());
    await page.addInitScript(()=>{
     Math.random=()=>.05;
     window.__perf={active:false,frames:[],long:[],observers:{},last:0};
     const Native=window.MutationObserver;
     window.MutationObserver=class extends Native{
      constructor(callback){const source=(new Error().stack||'unknown').split('\n').find(s=>s.includes('/assets/'))||'inline';
       super((records,observer)=>{const p=window.__perf;if(!p?.active)return callback(records,observer);
        const start=performance.now();try{return callback(records,observer);}finally{
         const entry=p.observers[source]||(p.observers[source]={calls:0,ms:0,records:0});entry.calls++;entry.records+=records.length;entry.ms+=performance.now()-start;
        }
       });
      }
     };
     new PerformanceObserver(list=>{if(window.__perf.active)window.__perf.long.push(...list.getEntries().map(e=>e.duration));}).observe({type:'longtask'});
     function frame(now){const p=window.__perf;if(p.active){if(p.last)p.frames.push(now-p.last);p.last=now;}else p.last=0;requestAnimationFrame(frame);}requestAnimationFrame(frame);
    });
    const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Performance.enable');
    await page.goto(base+'?screen=games');await page.locator('[data-game-action=choose]').click();
    await page.locator('[data-level="4"]:not([disabled])').click();await page.locator('[data-mode='+mode+']').click();
    await page.evaluate(()=>{window.VDuckieEXP={...window.VDuckieEXP,awardWordMastery:async()=>({awarded:false,exp_awarded:0,reason:'duplicate'})};});
    await page.locator('[data-game-action=start]').click();await page.locator('.tg-meteor.is-target').waitFor();await page.waitForTimeout(1200);
    await page.evaluate(()=>{window.__perf.active=true;});const before=(await cdp.send('Performance.getMetrics')).metrics;
    const geometry=await page.locator('.tg-meteor.is-target').boundingBox();await page.waitForTimeout(1500);
    const later=await page.locator('.tg-meteor.is-target').boundingBox();assert.ok(later.y>geometry.y,'meteors fall through real viewport');
    if(variant==='optimized'){
     const duration=await page.locator('.tg-meteor.is-target').evaluate(n=>n.getAnimations()[0].effect.getTiming().duration);
     assert.ok(Math.abs(duration-({easy:12,medium:9,hard:6}[mode])*1000)<100,'compositor owns mode-specific fall');
    }
    let completed=0,letters=0;const started=Date.now();
    while(Date.now()-started<16000){
     const target=page.locator('.tg-meteor.is-target .tg-word>span');await target.waitFor({timeout:4000});const answer=normalize(await target.textContent());
     const input=page.locator('#typingPinyin'),wrong=answer[0]==='x'?'q':'x';
     const scoreBefore=Number(await page.locator('[data-score]').textContent());
     await input.pressSequentially(wrong+answer,{delay:32});
     assert.ok(Number(await page.locator('[data-score]').textContent())>scoreBefore,'word must actually complete under load');letters+=answer.length;completed++;
    }
    await page.evaluate(()=>{window.__perf.active=false;});const perf=await page.evaluate(()=>window.__perf),after=(await cdp.send('Performance.getMetrics')).metrics;
    const delta=key=>(after.find(x=>x.name===key)?.value||0)-(before.find(x=>x.name===key)?.value||0);
    const observers=Object.entries(perf.observers).map(([source,v])=>({source,...v})).sort((a,b)=>b.ms-a.ms);
    const result={name,viewport,mode,variant,cpuThrottle:4,completed,letters,frameCount:perf.frames.length,
     frameMs:{p50:quantile(perf.frames,.5),p95:quantile(perf.frames,.95),p99:quantile(perf.frames,.99),max:Math.max(...perf.frames)},
     framesOver33ms:perf.frames.filter(n=>n>33.5).length,framesOver50ms:perf.frames.filter(n=>n>50.5).length,
     longTasks:perf.long.length,longTaskMs:perf.long.reduce((a,b)=>a+b,0),
     scriptMs:delta('ScriptDuration')*1000,layoutMs:delta('LayoutDuration')*1000,styleMs:delta('RecalcStyleDuration')*1000,
     observerCalls:observers.reduce((a,b)=>a+b.calls,0),observerMs:observers.reduce((a,b)=>a+b.ms,0),observers};
    results.push(result);await writeFile(path.join(out,'performance-results.json'),JSON.stringify({baselineCommit:baseline,results},null,2));console.log(JSON.stringify(result));assert.deepEqual(errors,[]);
     // The intentionally slow legacy baseline is a reference sample, not a
     // throughput acceptance gate. Keep strict gameplay throughput for the
     // optimized variant and require a real, non-trivial baseline sample.
     const minCompleted=variant==='optimized'?8:5;
     assert.ok(completed>=minCompleted&&perf.frames.length>150,
       `${name}: ${completed} words (minimum ${minCompleted}), ${perf.frames.length} frames`);
    if(variant==='optimized'){
     assert.equal(await page.locator('.tg-effects').evaluate(n=>n.childElementCount),80);
     await page.screenshot({path:path.join(out,name+'.png')});
     // Pause freezes the actual compositor fall as well as physics; resume restarts it.
     await page.locator('.tg-meteor.is-target').waitFor();await page.locator('[data-game-action=pause]').click();
     const paused=await page.locator('.tg-meteor.is-target').boundingBox();await page.waitForTimeout(650);
     const still=await page.locator('.tg-meteor.is-target').boundingBox();assert.ok(Math.abs(paused.y-still.y)<.1);
     await page.locator('[data-game-action=resume]').click();await page.waitForTimeout(300);
     assert.ok((await page.locator('.tg-meteor.is-target').boundingBox()).y>still.y);
    }
    await page.getByRole('button',{name:'Thoát trò chơi',exact:true}).click();
    assert.equal(await page.locator('.tg-overlay').count(),0);const video=page.video();await context.close();
    if(video)await video.saveAs(path.join(out,'hard-'+variant+'-gameplay.webm'));
   }
  }
 }
 await writeFile(path.join(out,'performance-results.json'),JSON.stringify({baselineCommit:baseline,notes:'Headless Chromium, 4x CPU. Frame intervals reflect main-thread rAF, not a physical display FPS guarantee. Full app observers retained; reward RPC mocked.',results},null,2));
 // Performance.getMetrics ScriptDuration includes WHOLE-PAGE JavaScript,
 // including the dashboard, learning observers and simulated input; it is
 // not exclusively the typing game's scripting time. Keep an evidence-based
 // whole-page CPU gate plus independent frame/observer improvement gates.
 for(const optimized of results.filter(r=>r.variant==='optimized')){
  const original=results.find(r=>r.viewport.width===optimized.viewport.width&&r.mode===optimized.mode&&r.variant==='baseline');
  assert.ok(original,'missing matching baseline: '+optimized.name);
  assert.ok(optimized.scriptMs<original.scriptMs*.9,'whole-page scripting must improve at least 10%: '+optimized.name);
  assert.ok(optimized.frameMs.p95<original.frameMs.p95,'p95 frame duration must improve: '+optimized.name);
  assert.ok(optimized.observerCalls<original.observerCalls*.4,'gameplay must substantially stop waking global observers: '+optimized.name);
 }
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await browser.close();}
process.exit(0);
