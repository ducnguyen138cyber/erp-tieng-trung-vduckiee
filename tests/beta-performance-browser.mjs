// Identical baseline/candidate browser experiment. No production writes or private sessions.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(process.env.BETA_ROOT||'.'),out=path.resolve(process.env.BETA_OUT||'artifacts/beta-performance/after');
const enforce=process.env.BETA_ENFORCE==='1';await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost');const f=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();try{res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'}).end(await readFile(f));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
const fixture=`(()=>{const listeners=[],rankWaiters=[];let owner='A';const rows=Array.from({length:8},(_,i)=>({rank:i+1,display_name:'Học viên '+(i+1),avatar_url:'',total_exp:1500-i*100,period_exp:i+1}));const session=()=>owner?{user:{id:owner,email:'qa@example.invalid',user_metadata:{full_name:'Người kiểm thử '+owner}},access_token:'fixture'}:null;const state=window.__beta={calls:[],fail:false,empty:false,hold:new URLSearchParams(location.search).has('betaHold'),releaseRank(){state.hold=false;rankWaiters.splice(0).forEach(fn=>fn())},setUser(id){owner=id;listeners.forEach(fn=>fn(id?'SIGNED_IN':'SIGNED_OUT',session()))}};const q=()=>new Proxy({},{get:(o,k)=>k==='then'?(ok,bad)=>Promise.resolve({data:[],error:null}).then(ok,bad):()=>q()});window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:session()},error:null}),onAuthStateChange(fn){listeners.push(fn);return {data:{subscription:{unsubscribe(){}}}}},signOut:async()=>{state.setUser('');return {error:null}}},from:q,rpc:async(name,args)=>{const user=owner;state.calls.push({name,args,user});await new Promise(r=>setTimeout(r,/get_my_exp|get_leaderboard|get_my_rank/.test(name)?650:20));if(state.hold&&/get_leaderboard|get_my_rank/.test(name))await new Promise(r=>rankWaiters.push(r));if(state.fail&&/get_leaderboard|get_my_rank/.test(name))return {error:{message:'fixture offline'},data:null};return {error:null,data:name==='get_my_exp'?(user==='B'?90:1500):name==='get_leaderboard'?(state.empty?[]:rows):name==='get_my_rank'?[{...rows[0],rank:101,total_exp:user==='B'?90:1500}]:[]}}}}}})();`;
const report={method:'Same runner, local HTTP, mocked Supabase boundary with 650ms ranking/EXP latency. Three cold runs per viewport, SW blocked. Chromium lab only; not production/iPhone.',profiles:[],interactions:[],baselineIssues:[],failures:[]};
const browser=await chromium.launch();
try{
 for(const width of [1440,390]){
  for(let run=1;run<=3;run++){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390,serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(20000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:fixture}));
   await page.route('https://*.supabase.co/**',r=>r.abort());
   await page.addInitScript(()=>{
    function observe(){
     if(window.__betaMetrics)return;
     const m=window.__betaMetrics={cls:0,longTasks:0,longTaskMs:0,shifts:[],accountValues:[],accountMutations:0,readyMs:null};
     try{new PerformanceObserver(list=>{for(const e of list.getEntries()){if(!e.hadRecentInput){m.cls+=e.value;m.shifts.push({value:e.value,ids:(e.sources||[]).map(s=>s.node?.id||s.node?.className||'')})}}}).observe({type:'layout-shift',buffered:true})}catch{}
     try{new PerformanceObserver(list=>{for(const e of list.getEntries()){m.longTasks++;m.longTaskMs+=e.duration}}).observe({type:'longtask',buffered:true})}catch{}
     let frame;
     function sample(){
      const home=document.querySelector('#v865HomeShell');
      if(m.readyMs===null&&window.__VDUCKIE_EXPERIENCE_V86_READY__&&window.VDuckieScreenRouter&&home?.getBoundingClientRect().height&&getComputedStyle(document.body).visibility!=='hidden')m.readyMs=performance.now();
      const text=document.querySelector('.v91-account-trigger')?.textContent?.trim();if(text&&m.accountValues.at(-1)!==text)m.accountValues.push(text);
      frame=requestAnimationFrame(sample);
     }sample();
     new MutationObserver(records=>{m.accountMutations+=records.filter(r=>r.target.closest?.('#expHeaderAccount,.v91-account-trigger')).length}).observe(document,{childList:true,subtree:true});
     window.__betaStop=()=>cancelAnimationFrame(frame);
    }
    observe();document.addEventListener('DOMContentLoaded',observe,{once:true});
   });
   const cdp=await context.newCDPSession(page);if(width===390){await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:500000,uploadThroughput:100000});}
   await page.goto(base,{waitUntil:'domcontentloaded'});
   try{await page.waitForFunction(()=>window.__VDUCKIE_EXPERIENCE_V86_READY__&&window.VDuckieScreenRouter&&document.querySelector('#expMiniList .v90-mini-row'));}catch(error){
    if(enforce)throw error;
    report.baselineIssues.push({width,run,issue:'Baseline boot did not settle within the existing deadline',error:error.message});
    console.log('BASELINE_ISSUE',width,run,error.message);await context.close();continue;
   }
   await page.waitForTimeout(1000);
   const metric=await page.evaluate(()=>{const r=performance.getEntriesByType('resource');return {...window.__betaMetrics,resources:r.length,scriptResources:r.filter(x=>/\.js(?:\?|$)/.test(x.name)).length,transferBytes:r.reduce((s,x)=>s+(x.transferSize||0),0),rankingRequests:window.__beta.calls.filter(x=>/get_my_exp|get_leaderboard|get_my_rank/.test(x.name)),dailySummaries:document.querySelectorAll("#homeHub .daily-today").length,overflow:document.documentElement.scrollWidth>innerWidth+1}});
   report.profiles.push({width,run,...metric,errors});
   if(run===1){try{
    await page.screenshot({path:path.join(out,`${width}-home.png`),fullPage:true});
    await page.locator('header.top').screenshot({path:path.join(out,`${width}-exp.png`)});
    await page.goto(base+'?screen=ranking&betaHold=1');
    await page.waitForFunction(()=>document.querySelector('.v91-account-trigger')?.textContent.includes('Level 4'));
    const pendingGeometry=await page.locator('#expPodium').boundingBox();
    await page.screenshot({path:path.join(out,`${width}-ranking-loading.png`),fullPage:true});
    await page.evaluate(()=>window.__beta.releaseRank());await page.locator('#expLeaderboardList .exp-row').first().waitFor();
    const resolvedGeometry=await page.locator('#expPodium').boundingBox();
    report.interactions.push({width,podiumLoadingHeight:pendingGeometry?.height??0,podiumResolvedHeight:resolvedGeometry?.height??0});
    if(enforce)assert.ok(Math.abs(pendingGeometry.height-resolvedGeometry.height)<=1,'podium loading reserves the final height');
    if(enforce){
     assert.equal(await page.locator('#hsk').isVisible(),false,'ranking cannot stack with a late HSK mount');
     await page.evaluate(()=>{document.querySelector('#hsk').classList.remove('hidden');document.body.setAttribute('data-current-area','hsk')});
     assert.equal(await page.locator('#hsk').isVisible(),false,'route CSS prevents a wrong frame before reconciliation');
     try{await page.waitForFunction(()=>document.querySelector('#hsk').classList.contains('hidden'));}catch(error){
      console.log('ROUTE_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>({route:window.VDuckieScreenRouter.current(),url:location.href,body:document.body.dataset,observer:!!document.querySelector('.study-center').__vduckieScreenObserver,hskParent:document.querySelector('#hsk').parentElement.outerHTML.slice(0,250),roots:['hsk','leaderboard','homeHub'].map(id=>({id,cls:document.getElementById(id).className,rect:document.getElementById(id).getBoundingClientRect().toJSON()}))}))));throw error;
     }
    }
    await page.screenshot({path:path.join(out,`${width}-ranking.png`),fullPage:true});
    // A real tab click must preserve resolved content while revalidating.
    const before=await page.locator('#expLeaderboardList').textContent();
    const tabStart=Date.now();await page.locator('[data-exp-period=total]').click();
    const tabMs=Date.now()-tabStart;
    const during=await page.locator('#expLeaderboardList').textContent();
    if(enforce)assert.equal(during,before,'tab click cannot replace confirmed rows with loading');
    await page.reload();await page.waitForFunction(()=>window.__beta);await page.evaluate(()=>window.__beta.releaseRank());await page.locator('#expLeaderboardList .exp-row').first().waitFor();
    if(enforce){
     await page.evaluate(()=>{window.__beta.fail=true;window.VDuckieEXPBoard.invalidate()});
     await page.locator('[data-exp-period=total]').click();await page.locator('[data-exp-retry-board]').waitFor();
     await page.evaluate(()=>window.__beta.fail=false);await page.locator('[data-exp-retry-board]').click();await page.locator('#expLeaderboardList .exp-row').first().waitFor();
     await page.evaluate(()=>{window.__beta.empty=true;window.VDuckieEXPBoard.invalidate()});await page.locator('[data-exp-period=total]').click();await page.locator('#expLeaderboardList').filter({hasText:'Chưa có dữ liệu EXP'}).waitFor();
     await page.evaluate(()=>{window.__beta.empty=false;window.VDuckieEXPBoard.invalidate()});await page.locator('[data-exp-period=total]').click();await page.locator('#expLeaderboardList .exp-row').first().waitFor();
    }
    await page.evaluate(()=>window.__beta.setUser('B'));await page.waitForFunction(()=>document.querySelector('.v91-account-trigger')?.textContent.includes('90 EXP'));
    if(enforce)await page.waitForFunction(()=>document.querySelectorAll('#expMiniList .v90-mini-row').length===5);
    await page.evaluate(()=>window.__beta.setUser(''));await page.waitForFunction(()=>!document.querySelector('.v91-account-trigger')||document.querySelector('.v91-account-trigger').hidden);
    // Search and detail close on actual app, touch-size and focus checks.
    await page.goto(base);const input=page.locator('#vsearchInput');await input.waitFor();const searchStart=Date.now();await input.fill('努力');
    await page.locator('[data-vsearch-result]').first().waitFor();
    const searchMs=Date.now()-searchStart;
    await page.locator('[data-vsearch-result]').first().click();
    await page.locator('#vsearchDetail').waitFor();
    const closeStart=Date.now();await page.locator('[data-vsearch-close]').click();
    try{await page.locator('#vsearchDetail').waitFor({state:'detached'});}catch(error){
     if(enforce)throw error;
     report.baselineIssues.push({width,issue:'Physical search detail X did not dismiss',error:error.message});
    }
    report.interactions.push({width,rankingTabMs:tabMs,searchResultsMs:searchMs,detailCloseMs:Date.now()-closeStart,method:'Playwright action + visible state, wall-clock; lab only'});
    await page.screenshot({path:path.join(out,`${width}-search.png`),fullPage:true});
    if(enforce&&width===390)assert.ok(await input.evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=16));
   }catch(error){
    // The old app is a diagnostic control with known render-loop/close bugs.
    // Keep its failure in the report and continue independent cold samples;
    // candidate interactions remain strict and retain the same deadline.
    if(enforce)throw error;
    report.baselineIssues.push({width,run,issue:'Baseline interaction did not settle',error:error.message});
    console.log('BASELINE_ISSUE',width,run,error.message);
   }}
   if(enforce){assert.deepEqual(errors,[]);assert.equal(metric.overflow,false);if(width===390)assert.equal(metric.dailySummaries,1,'one mobile Today summary');assert.equal(metric.accountValues.some(v=>/·\s*0\s*EXP/.test(v)),false,'no fake zero EXP');assert.ok(metric.rankingRequests.filter(c=>c.name==='get_my_exp').length<=1,'EXP read once at boot');assert.ok(metric.rankingRequests.filter(c=>c.name==='get_leaderboard').length<=1,'shared ranking snapshot');}
   await context.close();console.log(`BETA ${width} run ${run}: ready=${Math.round(metric.readyMs)}ms CLS=${metric.cls.toFixed(4)} longTasks=${metric.longTasks} accountMutations=${metric.accountMutations}`);
  }
 }
}catch(e){report.failures.push(e.stack);throw e;}finally{await writeFile(path.join(out,'metrics.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(r=>server.close(r));}
