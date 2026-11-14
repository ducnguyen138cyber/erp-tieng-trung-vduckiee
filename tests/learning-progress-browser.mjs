// Two browser devices, two isolated fixture identities. No production Auth or DB writes.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),out=path.join(root,'artifacts/learning-progress');await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=(process.env.LEARNING_PREVIEW_URL||'http://127.0.0.1:'+server.address().port+'/').replace(/\/?$/,'/');
const sdk=await readFile('tests/fixtures/learning-auth-sdk.js','utf8'),browser=await chromium.launch();
const A='00000000-0000-4000-8000-000000000111',B='00000000-0000-4000-8000-000000000222',KEY='vduckie-hsk-study-journey-v1';
const rows=new Map(),evidence={scope:'Two browser devices and two mocked auth identities; REST concurrency emulator. SQL RLS is tested separately, not real Supabase password sessions.',base,checks:[],errors:[],navigations:{},writes:0,conflicts:0};let revision=0;
async function backend(route){
 const req=route.request().postDataJSON(),single=req.single;let data=[],error=null;
 if(req.table==='user_words'){
  const owner=req.owner;if(![A,B].includes(owner))error={code:'42501',message:'not authenticated'};
  else if(req.op==='select')data=[...rows.values()].filter(r=>r.user_id===owner&&Object.entries(req.filters).every(([k,v])=>r[k]===v)).map(r=>structuredClone(r));
  else for(const payload of req.rows||[]){
   if(payload.user_id!==owner){error={code:'42501',message:'owner mismatch'};break;}
   const id=owner+'|'+payload.word_key,old=rows.get(id);
   if(req.op==='insert'&&old){error={code:'23505',message:'duplicate'};evidence.conflicts++;break;}
   if(req.op==='update'&&(!old||Object.entries(req.filters).some(([k,v])=>old[k]!==v))){evidence.conflicts++;continue;}
   const row={...old,...payload,updated_at:String(++revision)};rows.set(id,row);data.push(structuredClone(row));evidence.writes++;
  }
 }
 await route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({data:single?(data[0]||null):data,error})});
}
const contexts=[];
async function device(name,viewport,legacy){
 const context=await browser.newContext({viewport,isMobile:name==='mobile',hasTouch:name==='mobile',serviceWorkers:'allow'});contexts.push(context);await context.tracing.start({screenshots:true,snapshots:true});
 await context.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:sdk}));
 await context.route('https://learning-fixture.supabase.co/**',backend);
 await context.route('https://*.supabase.co/**',async r=>{if(r.request().url().includes('learning-fixture'))return backend(r);return r.fulfill({contentType:'application/json',body:'[]'});});
 if(legacy)await context.addInitScript(({key})=>{if(location.protocol==='https:'||location.protocol==='http:')if(!localStorage.getItem('__learning_fixture_seeded')){localStorage.setItem(key,JSON.stringify({version:1,lessons:{legacy_guest:{level:1,completedAt:123}},reviews:{'3:努力':{level:3,lessonId:'hsk3-lesson-01',hanzi:'努力',pinyin:'nǔlì',meaningVi:'cố gắng',weak:true,stage:4,correct:9,lastAt:Date.now()-2*86400000,nextAt:1}}}));localStorage.setItem('__learning_fixture_seeded','1');}}, {key:KEY});
 const page=await context.newPage();evidence.navigations[name]=0;page.on('framenavigated',frame=>{if(frame===page.mainFrame())evidence.navigations[name]++;});page.setDefaultTimeout(20000);page.on('pageerror',e=>evidence.errors.push(name+': '+e.message));
 await page.goto(base+'?screen=hsk&hskLevel=1&hskLesson=hsk1-lesson-01&area=hsk#hsk');await ready(page);
 return {page,context,name};
}
async function ready(page){await page.locator('[data-focus-stage="words"]').waitFor();await page.waitForFunction(()=>window.VDuckieAccountSyncUtils?.identity()==='00000000-0000-4000-8000-000000000111');await flush(page);await page.waitForFunction(()=>!!window.VDuckieHskStudyJourney);const expected=new URL(page.url()).searchParams.get('hskLesson');if(expected)await page.waitForFunction(id=>window.VDuckieHskStudyFlow?.getCurrent()?.lessonId===id,expected);}
async function memory(page){const value=await page.waitForFunction(()=>window.VDuckieHskStudyJourney?.wordStats());return value.jsonValue();}
async function flush(page){await page.evaluate(async()=>{await window.VDuckieAccountSyncUtils.flush();});}
async function lesson(page,level,id){await page.goto(base+`?screen=hsk&hskLevel=${level}&hskLesson=${id}&area=hsk#hsk`);await ready(page);}
async function journal(page){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}'),KEY);}
try{
 const desktop=await device('desktop',{width:1440,height:900},true),mobile=await device('mobile',{width:390,height:844},false),p=desktop.page,q=mobile.page;
 // A warm, stale executable must be refreshed on this load without touching progress.
 await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await ready(p);
 evidence.staleCache=await p.evaluate(async()=>{
  const url=document.querySelector('script[src*="assets/daily-learning-v2.js"]').src;
  const keys=await caches.keys(),name=keys.find(key=>key.endsWith('-static')&&key.startsWith('vduckie-pwa-'));
  if(!name)throw new Error('Current static cache is missing');
  const cache=await caches.open(name),before=localStorage.getItem('vduckie-hsk-study-journey-v1');
  await cache.put(url,new Response('/* stale-learning-fixture */',{headers:{'content-type':'text/javascript'}}));
  const body=await (await fetch(url)).text(),stored=await (await cache.match(url)).text();
  return {url,refreshed:body.includes('function dailyPlan(')&&!body.includes('stale-learning-fixture'),cacheUpdated:stored===body,progressPreserved:before===localStorage.getItem('vduckie-hsk-study-journey-v1')};
 });
 assert.equal(evidence.staleCache.refreshed,true);assert.equal(evidence.staleCache.cacheUpdated,true);assert.equal(evidence.staleCache.progressPreserved,true);
 evidence.checks.push('online load replaces stale Daily executable cache without changing saved progress');
 const desktopNavigations=evidence.navigations.desktop;await p.locator('[data-focus-panel="words"] [data-hsk-content-done]').click();
 await p.locator('[data-focus-next]').first().click();
 await lesson(q,2,'hsk2-lesson-15');await q.locator('[data-focus-panel="words"] [data-hsk-content-done]').click();
 await Promise.all([flush(p),flush(q)]);await flush(p);await flush(q);
 for(const page of [p,q]){const j=await journal(page);assert.equal(j.lessons.legacy_guest.completedAt,123);assert.ok(j.lessons['hsk1-lesson-01'].content.words);assert.ok(j.lessons['hsk2-lesson-15'].content.words);assert.equal((await memory(page)).remembered,0);}
 assert.equal(evidence.navigations.desktop,desktopNavigations,'background progress sync cannot reload the active lesson');
 evidence.checks.push('two devices merge independent lesson progress, preserve old completion and do not reload the active lesson');
 await p.locator('[data-hsk-review-open]:visible').first().click();const correctBeforeReveal=(await memory(p)).correct;await p.evaluate(()=>{window.__recallAwards=0;document.addEventListener('vduckie:hsk-word-mastered',()=>window.__recallAwards++);});await p.locator('[data-hsk-review-reveal]').click();
 assert.match(await p.locator('[data-hsk-recall-feedback]').innerText(),/Chưa đánh giá ghi nhớ/);assert.equal((await memory(p)).remembered,0);
 assert.equal(await p.evaluate(()=>window.__recallAwards),0,'revealing an answer must not emit a mastery/EXP reward');assert.equal((await memory(p)).correct,correctBeforeReveal,'reveal is not a correct recall');
 evidence.checks.push('answer reveal cannot award memory or EXP');
 await p.screenshot({path:path.join(out,'desktop-recall.png')});
 await flush(p);await flush(q);await q.reload();await ready(q);
 const mobileJournal=await journal(q);assert.ok(mobileJournal.reviews['3:努力'].recallEvents);
 assert.equal(await q.evaluate(()=>window.VDuckieHskStudyFlow.getCurrent().lessonId),'hsk2-lesson-15');
 // Shadowing is exercised through the actual screen/menu and buttons.
 await p.getByRole('button',{name:/Luyện nghe & Shadowing/}).first().click();await p.locator('[data-shadow-star]').waitFor();
 await p.locator('[data-shadow-star]').click();await p.locator('[data-shadow-next]').click();await flush(p);await flush(q);
 const shadow=await p.evaluate(()=>JSON.parse(localStorage.getItem('vduckie-shadowing-v1'))),mobileShadow=await q.evaluate(()=>JSON.parse(localStorage.getItem('vduckie-shadowing-v1')));assert.equal(mobileShadow.lastLevel,shadow.lastLevel);for(const field of ['id','index','starred','weak','group','mode','rate','showPinyin','showVi','repeats'])assert.deepEqual(mobileShadow[shadow.lastLevel][field],shadow[shadow.lastLevel][field]);
 evidence.checks.push('Shadowing position and saved line sync without uploading recordings');
 // Public practice entry; draft and deadline travel to the second device.
 await p.evaluate(()=>{window.VDuckieScreenRouter.navigate('msutong');});await p.locator('[data-practice-open]').first().click();await p.locator('[data-practice-start="1"]').click();
 await p.locator('[data-practice-answer]').first().check();await flush(p);await flush(q);
 const originalPracticeDraft=await p.evaluate(()=>JSON.parse(localStorage.getItem('vduckie-hsk-practice-exams-v2'))[window.VDuckieHSKPractice.getExamState().id].draft);
 await q.evaluate(()=>{window.VDuckieScreenRouter.navigate('msutong');});await q.locator('[data-practice-open]').first().click();assert.match(await q.locator('[data-practice-start="1"]').innerText(),/đang dở/);await q.locator('[data-practice-start="1"]').click();
 await q.locator('[data-practice-answer]').first().waitFor();assert.ok((await q.evaluate(()=>window.VDuckieHSKPractice.getExamState())).answered>=1);
 const resumedPracticeDraft=await q.evaluate(()=>JSON.parse(localStorage.getItem('vduckie-hsk-practice-exams-v2'))[window.VDuckieHSKPractice.getExamState().id].draft);
 assert.equal(resumedPracticeDraft.sessionId,originalPracticeDraft.sessionId);assert.equal(resumedPracticeDraft.deadline,originalPracticeDraft.deadline,'resuming on mobile must retain the exact original deadline');
 await q.locator('[data-practice-answer]').first().scrollIntoViewIfNeeded();await q.screenshot({path:path.join(out,'mobile-resume.png')});
 evidence.checks.push('unfinished practice answer and original timer resume on mobile');
 // Daily Learning uses its current UI/store, including a wrong answer due for review.
 const dailyTargets=[];
 for(const page of [p,q]){
  await page.evaluate(()=>window.VDuckieDailyLearning.show('daily'));
  dailyTargets.push((await page.locator('#dailyLearningPanel .focus-word>strong').innerText()).trim());
  if(page===q){
   await page.waitForFunction(()=>!!window.HanziWriter);
   await page.evaluate(()=>{window.__savedStrokeData=window.HSK_HANZI_DATA;window.HSK_HANZI_DATA={};});
   let missingRequests=0;
   const missingStroke=route=>{missingRequests++;return route.fulfill({status:404,contentType:'application/json',body:'{}'});};
   await mobile.context.route('**/hanzi-data/*.json',missingStroke);
   await page.locator('#dailyLearningPanel [data-session-next]').click();
   await page.waitForFunction(()=>document.getElementById('dailyWritingStatus')?.textContent.includes('chưa có dữ liệu nét'));
   assert.ok(missingRequests>0,'Exercise a real failed stroke-data request');
   assert.equal(await page.locator('[data-writing-replay]').isDisabled(),true);assert.equal(await page.locator('[data-writing-practice]').isDisabled(),true);
   assert.equal(await page.locator('#dailyLearningPanel [data-speak]').isEnabled(),true);
   assert.equal(await page.locator('#dailyLearningPanel [data-session-next]').isEnabled(),true);
   await page.locator('#dailyLearningPanel [data-session-next]').click();
   await mobile.context.unroute('**/hanzi-data/*.json',missingStroke);
   await page.evaluate(()=>{window.HSK_HANZI_DATA=window.__savedStrokeData;delete window.__savedStrokeData;});
   await page.locator('#dailyLearningPanel [data-session-next]').click();
   evidence.checks.push('missing verified stroke data disables animation, keeps audio and next step, and raises no page error');
  }else for(let i=0;i<3;i++)await page.locator('#dailyLearningPanel [data-session-next]').click();
 }
 assert.equal(dailyTargets[0],dailyTargets[1]);
 for(const page of [p,q]){
  const choices=await page.locator('#dailyLearningPanel [data-answer]').evaluateAll(nodes=>nodes.map(n=>n.dataset.answer));
  await page.locator('#dailyLearningPanel [data-answer]').nth(choices.findIndex(x=>x!==dailyTargets[0])).click();
 }
 await Promise.all([flush(p),flush(q)]);await flush(p);await flush(q);
 const daily=await p.evaluate(()=>window.VDuckieDailyLearning.getState()),mobileDaily=await q.evaluate(()=>window.VDuckieDailyLearning.getState());
 for(const [id,item] of Object.entries(daily.words))assert.deepEqual(mobileDaily.words[id],item);
 assert.equal(Object.keys(daily.words[dailyTargets[0]].attemptEvents).length,2);assert.equal(daily.words[dailyTargets[0]].wrong,2);
 assert.ok(daily.words[dailyTargets[0]].nextReview>daily.words[dailyTargets[0]].lastReviewed);
 evidence.checks.push('Daily answer, due date and history sync through the existing store');
 // Return to an already cached lesson, then exercise real browser offline status/cache.
 await lesson(p,1,'hsk1-lesson-01');await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await ready(p);
 await p.waitForFunction(async()=>!!(await caches.match(new URL('./.learning-offline-ready-progress-sync1',location.href).href)));
 evidence.offlineCache=await p.evaluate(async()=>{const meta={};for(const key of ['./index.html','./']){const r=await caches.match(new URL(key,location.href).href);meta[key]=r?{url:r.url,redirected:r.redirected,status:r.status}:null;}return {controller:navigator.serviceWorker.controller?.scriptURL,meta};});
 await desktop.context.setOffline(true);assert.equal(await p.evaluate(()=>navigator.onLine),false);
 await p.locator('[data-focus-stage="examples"]').click();await p.locator('[data-focus-panel="examples"] [data-hsk-content-done]').click();const writesBefore=evidence.writes;await flush(p);assert.equal(evidence.writes,writesBefore);
 await p.reload({waitUntil:'domcontentloaded'});await p.locator('[data-focus-stage="examples"]').waitFor();assert.ok((await journal(p)).lessons['hsk1-lesson-01'].content.examples);
 await desktop.context.setOffline(false);await flush(p);await flush(q);assert.ok((await journal(q)).lessons['hsk1-lesson-01'].content.examples);
 evidence.checks.push('offline edit and cached reload preserve progress; reconnect uploads it');
 // The auth provider is the only identity boundary replaced by this fixture.
 await p.evaluate(id=>window.__learningAuth.setUser(id),B);await p.waitForFunction(()=>window.VDuckieAccountSyncUtils.identity()==='00000000-0000-4000-8000-000000000222');await flush(p);
 assert.ok(!(await journal(p)).lessons['hsk1-lesson-01']?.content?.examples,'Bob must not inherit Alice work');
 await p.evaluate(()=>window.__learningAuth.setUser(''));await p.waitForFunction(()=>!window.VDuckieAccountSyncUtils.identity());
 await p.evaluate(id=>window.__learningAuth.setUser(id),A);await p.waitForFunction(()=>window.VDuckieAccountSyncUtils.identity()==='00000000-0000-4000-8000-000000000111');await flush(p);assert.ok((await journal(p)).lessons['hsk1-lesson-01'].content.examples);
 evidence.checks.push('Alice → Bob → logout → Alice isolates and restores account progress');
 for(const dev of [desktop,mobile]){const overflow=await dev.page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));assert.ok(overflow<=2);}
 assert.deepEqual(evidence.errors,[]);evidence.status='pass';
}catch(error){evidence.status='fail';evidence.failure={message:error.message,stack:error.stack};for(let i=0;i<contexts.length;i++)for(const page of contexts[i].pages()){await page.screenshot({path:path.join(out,'failure-device-'+i+'.png')}).catch(()=>{});}throw error;}
finally{await writeFile(path.join(out,'journeys.json'),JSON.stringify(evidence,null,2));for(let i=0;i<contexts.length;i++){await contexts[i].tracing.stop({path:path.join(out,'device-'+i+'.zip')});await contexts[i].close();}await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
console.log(JSON.stringify(evidence));
