// Real UI input against the full app; service fixtures never write production data.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),out='artifacts/ux-screen-audit',report=[],failures=[];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(data);}catch{if(!res.headersSent)res.writeHead(404);res.end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}/`;
await mkdir(out,{recursive:true});
const routes=[['home','#homeHub','[data-home]'],['msutong','.graded-hsk-page','[data-daily-nav="msutong"]'],['shadowing','.shadow-hanzi','[data-daily-nav="shadowing"]'],['daily','#dailyLearningPanel','[data-daily-nav="daily"]'],['review','#dailyLearningPanel','[data-daily-nav="review"]'],['dictionary','#dailyLearningPanel','[data-daily-nav="dictionary"]'],['vietnamese','#vietnameseScreen','[data-daily-nav="vietnamese"]'],['games','#gamesScreen','[data-daily-nav="games"]'],['ranking','#leaderboard','[data-exp-nav="ranking"]'],...['lessons','cards','dialogue','quiz','glossary','personal','community'].map(s=>['erp:'+s,'#'+s,'[data-view="'+s+'"]']),['profile','#dailyLearningPanel','[data-daily-nav="profile"]']];
try{
 for(const [name,type,sizes] of [['chromium',chromium,[[1440,950],[390,850],[320,850],[768,950],[844,390]]],['webkit',webkit,[[390,850]]]]){
  const browser=await type.launch();
  try{for(const [width,height] of sizes){
   const context=await browser.newContext({viewport:{width,height},isMobile:width<951,hasTouch:width<951,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
   let communityFailure=true;
   page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:'window.supabase={createClient(){const q=()=>new Proxy({},{get(o,k){if(k==="then")return ok=>Promise.resolve({data:[],error:null}).then(ok);return()=>q()}});return{auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:q,rpc:async()=>({data:[],error:null})}}}'}));
   await page.route('https://*.supabase.co/**',r=>r.abort());
   await page.route('https://erp-tieng-trung.vduckie.chatgpt.site/api/community-terms',r=>r.fulfill({status:communityFailure?503:200,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:JSON.stringify(communityFailure?{error:'fixture unavailable'}:{terms:[]})}));
   await page.goto(base+'?screen=home');
   await page.waitForFunction(()=>window.VDuckieScreenRouter&&window.__VDUCKIE_EXPERIENCE_V86_READY__&&window.VDuckieHeaderSearch);
   await page.waitForFunction(()=>[...document.querySelectorAll('link[rel="stylesheet"]')].every(e=>e.sheet));
   async function menu(selector){
    if(width<=980&&await page.locator('#mobileMenu').getAttribute('aria-expanded')!=='true')await page.locator('#mobileMenu').click();
    await page.locator('#studySidebar '+selector).click();
    if(width<=980)await page.waitForFunction(()=>document.querySelector('#studySidebar').getBoundingClientRect().right<=1&&!document.body.classList.contains('vd-menu-open'),null,{timeout:5000});
   }
   async function sample(id,work){
    const start=Date.now();try{const evidence=await work();console.log('AUDIT PASS',name,width,id);report.push({engine:name,width,height,id,pass:true,elapsedMs:Date.now()-start,...evidence});}
    catch(e){failures.push({engine:name,width,height,id,error:e.message});console.error('AUDIT FAILURE',JSON.stringify(failures.at(-1)));await page.screenshot({path:`${out}/${name}-${width}-${id.replaceAll(':','-')}-FAIL.png`});}await writeFile(out+'/checkpoint.json',JSON.stringify({report,failures},null,2));
   }
   for(const [screen,target,selector] of routes){
    await sample('route-'+screen,async()=>{
     await menu(selector);await page.locator(target).waitFor({state:'visible'});
     await page.waitForFunction(s=>window.VDuckieScreenRouter.current()===s,screen);
     assert.equal(new URL(page.url()).searchParams.get('screen'),screen);
     if(screen==='shadowing'){
      await page.waitForFunction(()=>document.title==='Luyện nghe Shadowing — VDuckie');
      await page.reload();await page.locator(target).waitFor({state:'visible'});
      await page.waitForFunction(()=>document.title==='Luyện nghe Shadowing — VDuckie');
     }
     const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,headings:[...document.querySelectorAll('main h1,main h2')].filter(e=>e.getClientRects().length).map(e=>e.textContent.trim()).slice(0,5)}));
     assert(geometry.overflow<=2,'document horizontal overflow '+JSON.stringify(geometry));
     const content=(await page.locator(target).innerText()).trim();assert(content.length>0,'destination must contain useful content');
     await page.screenshot({path:`${out}/${name}-${width}-${screen.replaceAll(':','-')}.png`});
     await page.locator(target).evaluate(e=>e.scrollIntoView({block:'end'}));
     return {screen,...geometry,contentLength:content.length};
    });
   }
   await sample('daily-footer',async()=>{
    await menu('[data-daily-nav="daily"]');
    for(const step of ['intro','writing','context']){
     const next=page.locator('#dailyLearningPanel [data-session-next]');await next.scrollIntoViewIfNeeded();
     const hit=await next.evaluate(e=>{const r=e.getBoundingClientRect(),at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{clickable:e===at||e.contains(at),button:r.toJSON(),blockedBy:at?.outerHTML.slice(0,180)}});
     assert(hit.clickable,'Daily '+step+' footer blocked '+JSON.stringify(hit));
     await page.screenshot({path:`${out}/${name}-${width}-daily-${step}-footer.png`});await next.click();
    }
    await page.locator('#dailyLearningPanel [data-session-exit]').click();
   });
   await sample('community-error-retry',async()=>{
    await menu('[data-view="community"]');await page.locator('#communityTerms').filter({hasText:'Chưa tải được'}).waitFor();
    communityFailure=false;await page.locator('#refreshCommunity').click();
    await page.locator('#communityTerms').filter({hasText:'Chưa có từ nào'}).waitFor();
    assert.doesNotMatch(await page.locator('#communityTerms').innerText(),/Đang tải/);
   });
   await sample('panel-exit',async()=>{
    for(const screen of ['profile','dictionary','review','daily']){
     await menu('[data-daily-nav="'+screen+'"]');await page.locator('#dailyLearningPanel [data-session-exit]').first().click();
     await page.waitForFunction(()=>window.VDuckieScreenRouter.current()==='home');await page.locator('#homeHub').waitFor({state:'visible'});
     assert.equal(new URL(page.url()).searchParams.get('screen'),'home');
    }
   });
   await sample('hsk56-card-entry',async()=>{
    for(const level of [5,6]){
     await page.locator('#brandHome').click();await page.locator('#v865TodayFocus').waitFor();
     const toggle=page.locator('[data-v865-action="toggle-discover"]');if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
     const card=page.locator('#v865HomeRoadmap [data-v865-level="'+level+'"]');assert.equal(await card.count(),1);
     await card.click();await card.click();await page.locator('#hskLesson .hsk-focus-tabs').waitFor();
     await page.waitForFunction(n=>window.VDuckieHskProfessionalRuntime?.getState().selectedLevel===n,level);
     assert.equal(new URL(page.url()).searchParams.get('screen'),'hsk-study');
     // Leaving a lesson must remove its query state from unrelated screens.
     await menu('[data-daily-nav="review"]');
     for(const key of ['hskLevel','hskLesson','hskView','hskTab','hskAssessment'])assert.equal(new URL(page.url()).searchParams.has(key),false,key);
    }
   });
   await sample('search-close-and-navigation',async()=>{
    await page.locator('#brandHome').click();const input=page.locator('#vsearchInput');await input.click();await input.fill('努力');
    await page.locator('[data-vsearch-result="0"]').waitFor();
    if(width>=951){
     await menu('[data-daily-nav="review"]');assert.equal(await page.locator('#vsearchList').isVisible(),false,'search cannot cover destination screen');
     await input.click();await input.fill('努力');await page.locator('[data-vsearch-result="0"]').waitFor();
    }
    await page.locator('[data-vsearch-result="0"]').click();await page.locator('#vsearchTitle').waitFor();
    const detail=page.locator('.vsearch-detail');await detail.evaluate(e=>e.scrollTop=e.scrollHeight);
    const close=page.locator('[data-vsearch-close]');const hit=await close.evaluate(e=>{const r=e.getBoundingClientRect();return{width:r.width,height:r.height,top:r.top,bottom:r.bottom,points:[.2,.5,.8].map(p=>{const at=document.elementFromPoint(r.x+r.width*p,r.y+r.height*p);return e===at||e.contains(at)})}});
    assert(hit.width>=44&&hit.height>=44,'close target minimum size');assert(hit.top>=0&&hit.bottom<=height,'close remains visible at bottom of detail');assert(hit.points.every(Boolean),'close must receive input');
    await page.screenshot({path:`${out}/${name}-${width}-detail-close.png`});await close.click();assert.equal(await page.locator('#vsearchDetail').count(),0);
    if(width<951)await page.locator('[data-vsearch-dismiss]').click();
    await menu('[data-daily-nav="daily"]');await page.locator('#dailyLearningPanel').waitFor({state:'visible'});
    assert.equal(await page.locator('#appShell').evaluate(e=>e.inert),false,'no background input lock after navigation');
    return {hit};
   });
   assert.deepEqual(errors,[],'uncaught app errors');await context.close();
  }}finally{await browser.close();}
 }
}finally{await writeFile(out+'/report.json',JSON.stringify({report,failures,limits:['Guest fixtures; no live writes, OTP, microphone, physical keyboard or installed OS PWA','Route sweep measures basic layout and navigation, not completion of all matrix conditions','Elapsed timings include automation and are not input latency measurements']},null,2));server.closeAllConnections();await new Promise(done=>server.close(done));}
assert.deepEqual(failures,[],'UX audit cases');console.log('PASS',report.length,'responsive full-app audit cases');
