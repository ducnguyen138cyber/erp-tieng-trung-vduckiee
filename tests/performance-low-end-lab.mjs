// P1 public production load audit. Network and CPU throttling are LAB emulation,
// not evidence from a physical low-end phone or an authenticated account.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const target=process.env.PERF_BASE_URL||'https://vduckie.pages.dev/';
const root=path.resolve(process.env.PERF_ARTIFACT_DIR||'artifacts/performance');
await mkdir(root,{recursive:true});
const browser=await chromium.launch({headless:true});
const profiles=[
 {name:'desktop-baseline',viewport:{width:1365,height:900},mobile:false,cpu:1,latency:0,down:0,up:0},
 {name:'mobile-4g-low-end',viewport:{width:390,height:844},mobile:true,cpu:4,latency:160,down:200000,up:50000}
];
const output={capturedAt:new Date().toISOString(),target,mode:target.includes('127.0.0.1')?'guest-local-Chromium':'guest-production-Chromium',limitations:[
 'Chromium CPU and network throttling emulate a slower device; no physical mobile device was measured.',
 'CI localhost comparisons do not reproduce Cloudflare hosting or a Vietnamese mobile network; production audit runs originate in GitHub Actions.',
 'No real login/session/Google OAuth or private Supabase account data is accessed.',
 'One cold run per profile is diagnostic only; not an SLO nor a representative percentile.'
],profiles:[]};
try{
  for(const profile of profiles){
    const context=await browser.newContext({viewport:profile.viewport,isMobile:profile.mobile,hasTouch:profile.mobile,
      deviceScaleFactor:profile.mobile?2:1,serviceWorkers:'block'});
    const page=await context.newPage();page.setDefaultTimeout(90000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.__perfLcp=0;window.__perfCls=0;window.__perfShifts=[];
      try{new PerformanceObserver(list=>{for(const item of list.getEntries())window.__perfLcp=item.startTime;})
        .observe({type:'largest-contentful-paint',buffered:true});}catch(e){}
      try{new PerformanceObserver(list=>{for(const item of list.getEntries()){
        if(!item.hadRecentInput){
          window.__perfCls+=item.value;
          if(window.__perfShifts.length<12)window.__perfShifts.push({
            value:Math.round(item.value*1000)/1000,
            sources:(item.sources||[]).slice(0,4).map(s=>{
              const node=s.node;
              return node?{tag:node.tagName||'',id:node.id||'',className:
                typeof node.className==='string'?node.className.slice(0,100):'',
                before:s.previousRect?[s.previousRect.x,s.previousRect.y,s.previousRect.width,s.previousRect.height].map(Math.round):null,
                after:s.currentRect?[s.currentRect.x,s.currentRect.y,s.currentRect.width,s.currentRect.height].map(Math.round):null}:null;
            })
          });
        }}})
        .observe({type:'layout-shift',buffered:true});}catch(e){}
    });
    const cdp=await context.newCDPSession(page);
    await cdp.send('Network.enable');
    if(profile.down>0)await cdp.send('Network.emulateNetworkConditions',{
      offline:false,latency:profile.latency,downloadThroughput:profile.down,uploadThroughput:profile.up
    });
    if(profile.cpu>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpu});
    const started=Date.now();let reachable=true,navigationError='';
    try{
      await page.goto(target,{waitUntil:'domcontentloaded',timeout:90000});
      // The bootstrap document already contains #homeHub while showing
      // "Đang mở VDuckie". Wait for actual dashboard initialization/paint.
      await page.waitForFunction(()=>{
        const home=document.querySelector('#homeHub');
        const shell=document.querySelector('#v865HomeShell');
        return Boolean(window.__VDUCKIE_EXPERIENCE_V86_READY__ && home && shell &&
          !home.classList.contains('hidden') && home.getBoundingClientRect().width>0 &&
          shell.getBoundingClientRect().height>0);
      },undefined,{timeout:90000});
      await page.waitForTimeout(400);
    }catch(error){reachable=false;navigationError=String(error.message||error).slice(0,350);}
    const observed=Date.now()-started;
    const data=await page.evaluate(()=>{
      const n=performance.getEntriesByType('navigation')[0],p=performance.getEntriesByType('paint');
      const fcp=p.find(x=>x.name==='first-contentful-paint');
      const entries=performance.getEntriesByType('resource');
      const sum=entries.reduce((s,x)=>s+(x.transferSize||0),0);
      return{title:document.title,homeVisible:!!(document.querySelector('#homeHub')&&
          !document.querySelector('#homeHub').classList.contains('hidden')&&
          window.__VDUCKIE_EXPERIENCE_V86_READY__),
        fcpMs:fcp?Math.round(fcp.startTime):null,lcpMs:window.__perfLcp?Math.round(window.__perfLcp):null,
        cls:Math.round((window.__perfCls||0)*1000)/1000,
        domContentLoadedMs:n?Math.round(n.domContentLoadedEventEnd):null,
        loadEventMs:n?Math.round(n.loadEventEnd):null,resources:entries.length,
        reportedTransferBytes:sum,
        scriptResources:entries.filter(x=>/\.js(?:\?|$)/i.test(x.name)).length,
        largestResources:entries.filter(x=>x.transferSize>0).sort((a,b)=>b.transferSize-a.transferSize)
          .slice(0,12).map(x=>({path:new URL(x.name).pathname,bytes:x.transferSize,
            durationMs:Math.round(x.duration)})),
        authSdkPresent:Boolean(window.supabase && window.VDuckieCloud),
        strokeDataEager:Boolean(window.HSK_HANZI_DATA),
        layoutShifts:(window.__perfShifts||[]).slice(0,12)};
    }).catch(()=>({}));
    await page.screenshot({path:path.join(root,profile.name+'.png'),fullPage:true}).catch(()=>{});
    output.profiles.push({profile:profile.name,emulatedCpuSlowdown:profile.cpu,
      emulatedLatencyMs:profile.latency,emulatedDownloadBytesPerSec:profile.down,
      observedHomeMs:observed,reachable,navigationError,metrics:data,uncaughtErrors:errors.slice(0,8)});
    console.log('VDUCKIE_PERFORMANCE '+JSON.stringify(output.profiles.at(-1)));
    await context.close();
  }
}finally{await browser.close();}
await writeFile(path.join(root,'audit.json'),JSON.stringify(output,null,2)+'\n');
if(output.profiles.some(x=>!x.reachable))process.exitCode=1;
