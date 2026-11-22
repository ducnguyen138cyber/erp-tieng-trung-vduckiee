// Guest-only route timing, identical localhost servers and fixture responses.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const base=process.env.PERF_BASE_URL;
if(!base||new URL(base).hostname!=='127.0.0.1')throw new Error('Local fixture server required');
const out=process.env.PERF_ARTIFACT_DIR||'artifacts/screen-load';
await mkdir(out,{recursive:true});
const routes=[['home','#v865TodayFocus'],['msutong','.graded-hsk-page'],['hsk-study','#hskLesson .hsk-focus-tabs'],['roadmap','#hskRoadmapScreen'],['shadowing','.shadow-hanzi'],['daily','#dailyLearningPanel'],['review','#dailyLearningPanel'],['dictionary','#dailyDictionaryResults'],['vietnamese','#vietnameseScreen'],['games','#gamesScreen'],['matching','#gamesScreen'],['game-ranking','#gamesScreen'],['ranking','#leaderboard'],...['lessons','cards','dialogue','quiz','glossary','personal','community'].map(s=>['erp:'+s,'#'+s]),['profile','#dailyLearningPanel']];
const fixture='window.supabase={createClient(){const q=()=>new Proxy({},{get(o,k){if(k==="then")return ok=>Promise.resolve({data:[],error:null}).then(ok);return()=>q()}});return{auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:q,rpc:async()=>({data:[],error:null})}}}';
const browser=await chromium.launch();const results=[];
async function fresh(mobile){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1365,height:900},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(45000);
 await page.addInitScript(()=>{window.__routeLongTasks=[];try{new PerformanceObserver(list=>{for(const e of list.getEntries())window.__routeLongTasks.push({start:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true})}catch{}});
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='127.0.0.1')return r.continue();if(u.hostname==='cdn.jsdelivr.net'&&u.pathname.includes('/@supabase/'))return r.fulfill({contentType:'text/javascript',body:fixture});if(u.pathname==='/api/community-terms')return r.fulfill({headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:'{"terms":[]}'});return r.abort();});
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
 if(mobile){await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:160,downloadThroughput:200000,uploadThroughput:50000});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
 return{context,page,errors};
}
async function ready(page,screen,selector){
 await page.waitForFunction(({screen,selector})=>{
  const e=document.querySelector(selector);return window.VDuckieScreenRouter?.current()===screen&&e?.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&e.textContent.trim()&&getComputedStyle(document.body).visibility!=='hidden';
 },{screen,selector});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function record(page,errors,profile,screen,kind,run,action,selector){
 const start=Date.now(),offset=kind==='cold'?0:await page.evaluate(()=>performance.now()),errStart=errors.length;
 let error='';try{await action();await ready(page,screen,selector);}catch(e){error=String(e.message).slice(0,350);}
 const elapsedMs=Date.now()-start;
 const metrics=await page.evaluate(offset=>{const a=performance.getEntriesByType('resource').filter(x=>x.startTime>=offset),tasks=(window.__routeLongTasks||[]).filter(x=>x.start>=offset),summarize=x=>({path:new URL(x.name).pathname,bytes:x.transferSize,durationMs:Math.round(x.duration),startMs:Math.round(x.startTime-offset),initiator:x.initiatorType});return {requests:a.length,transferBytes:a.reduce((n,x)=>n+x.transferSize,0),longTasks:tasks.length,longTaskMs:Math.round(tasks.reduce((n,x)=>n+x.duration,0)),largest:[...a].sort((x,y)=>y.transferSize-x.transferSize).slice(0,8).map(summarize),slowest:[...a].sort((x,y)=>y.duration-x.duration).slice(0,8).map(summarize)}},offset).catch(()=>({}));
 const result={profile,screen,kind,run,elapsedMs,ok:!error,error,browserErrors:errors.slice(errStart),...metrics};results.push(result);console.log('VDUCKIE_SCREEN '+JSON.stringify(result));
}
try{
 for(const mobile of [false,true]){
  const profile=mobile?'mobile-4g':'desktop';
  // Cold direct opens: one diagnostic sample per route. Warm navigation:
  // three samples per route, each pass starts in a fresh guest context.
  for(const [screen,selector] of routes){const {context,page,errors}=await fresh(mobile);try{await record(page,errors,profile,screen,'cold',1,()=>page.goto(base+'?screen='+encodeURIComponent(screen),{waitUntil:'domcontentloaded'}),selector);}finally{await context.close();}}
  for(let run=1;run<=3;run++){
   const {context,page,errors}=await fresh(mobile);try{
    await page.goto(base+'?screen=home',{waitUntil:'domcontentloaded'});await ready(page,'home','#v865TodayFocus');
    for(const [screen,selector] of [...routes.slice(1),routes[0]])await record(page,errors,profile,screen,'warm',run,()=>page.evaluate(s=>window.VDuckieScreenRouter.navigate(s),screen),selector);
   }finally{await context.close();}
  }
 }
}finally{await writeFile(path.join(out,'routes.json'),JSON.stringify({method:'Cold direct route single sample, warm route median of three; guest fixture, Chromium, localhost; not production latency',results},null,2));await browser.close();}
if(results.some(x=>!x.ok||x.browserErrors.length))process.exitCode=1;
