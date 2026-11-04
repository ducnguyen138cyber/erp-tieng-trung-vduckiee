import {chromium} from 'playwright';import {createServer} from 'node:http';import {readFile,mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {inspectVisuals} from './helpers/visual-audit.mjs';
const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const f=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://localhost').pathname)));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();try{const bytes=await readFile(f);res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'text/plain'}).end(bytes)}catch{if(!res.headersSent)res.writeHead(404);res.end()}});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base=process.env.VISUAL_BASE_URL||`http://127.0.0.1:${server.address().port}/`,live=!!process.env.VISUAL_BASE_URL,observe=process.env.VISUAL_OBSERVE_ONLY==='1';
const browser=await chromium.launch({headless:true}),report=[],outDir='artifacts/brand-runtime/'+(observe?'baseline':live?'deployment':'candidate');await mkdir(outDir,{recursive:true});
try{for(const width of (observe?[1440]:[1440,390])){
 const context=await browser.newContext({viewport:{width,height:950},serviceWorkers:live?'allow':'block'}),page=await context.newPage(),errors=[],network=[],failed=[],consoleEntries=[];
 page.setDefaultTimeout(20000);page.on('console',m=>{if(['error','warning'].includes(m.type()))consoleEntries.push({type:m.type(),text:m.text()})});page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(new URL(r.url()).origin===new URL(base).origin)network.push({url:new URL(r.url()).pathname+new URL(r.url()).search,status:r.status(),sw:r.fromServiceWorker()})});page.on('requestfailed',r=>{if(new URL(r.url()).origin===new URL(base).origin&&!/ERR_ABORTED/i.test(r.failure()?.errorText||''))failed.push({url:r.url(),error:r.failure()?.errorText})});
 if(!live){await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:'window.supabase={createClient(){const q=()=>new Proxy({},{get(o,k){if(k==="then")return ok=>Promise.resolve({data:[],error:null}).then(ok);return()=>q()}});return{auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:q,rpc:async()=>({data:[],error:null})}}}'}));}
 const open=async screen=>{await page.goto(base+'?screen='+encodeURIComponent(screen));await page.locator('.duckie-chat-launch').waitFor();await page.waitForFunction(()=>window.VDuckieScreenRouter&&window.__VDUCKIE_EXPERIENCE_V86_READY__&&window.VDuckieHskProfessionalRuntime?.getState().mounted);await page.waitForFunction(()=>[...document.querySelectorAll('link[rel="stylesheet"]')].every(e=>e.sheet));if(screen==='home'){try{await page.locator(width<=980?'#homeHub .daily-today:visible':'#homeHub .home-overview-grid').first().waitFor({state:'visible'});}catch(error){console.log('HOME_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>({url:location.href,html:document.documentElement.className,body:document.body.className,home:document.querySelector('#homeHub')?.outerHTML.slice(0,3000),chain:[...document.querySelectorAll('#homeHub,#v865HomeShell,#v865HomeMain,.home-overview-grid,.study-center,.study-layout')].map(e=>({tag:e.tagName,id:e.id,cls:e.className,display:getComputedStyle(e).display,rect:e.getBoundingClientRect().toJSON()}))}))));await page.screenshot({path:`${outDir}/${width}-home-failure.png`});throw error;}}};
 const check=async name=>{await page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));const view=await inspectVisuals(page);report.push({width,screen:name,...view});console.log(JSON.stringify({width,screen:name,issues:view.issues,inspected:view.inspected}));await page.screenshot({path:`${outDir}/${width}-${name}.png`});if(!observe){assert.equal(view.theme,'hsk-rail-mascot-stability-20261103');assert(view.overflow<2,'horizontal overflow');for(const img of view.mascots){assert(/duckie-(reader|flashcards|writing|listening|speaking)-2d-v[23]\.webp|duckie-speaking-two-wings-v4\.svg/.test(img.src),name+' invalid mascot');assert(img.loaded,name+' mascot failed to load');}}};
 async function checkLanguages(){
   await page.waitForFunction(()=>!!window.VDuckieInterfaceI18n?.setLanguage);
   const headline=page.locator('#homeHubTitle');
   const before=await page.evaluate(()=>performance.getEntriesByType('navigation').length);
   const langControl=page.locator('#vdUiLanguageGuest .vd-i18n-guest-trigger');
   await langControl.waitFor({state:'visible'});
   for(const [code,heading,resource,recommended] of [
      ['zh','与 VDuckie 开启学习之旅','每天都有新内容','为你推荐的课程'],
      ['en','Start your journey with VDuckie','Everything you need to learn daily','Recommended lessons'],
      ['vi','Bắt đầu hành trình cùng VDuckie','Đủ món để học mỗi ngày','Bài học đề xuất cho bạn']]){
     await langControl.click();
     await page.locator('[data-vd-guest-lang="'+code+'"]').click();
     await page.waitForFunction(expected=>document.querySelector('#homeHubTitle')?.textContent===expected,heading);
     assert.equal((await headline.textContent()).trim(),heading,'hero i18n '+code);
     assert.equal((await page.locator('.home-library-card .home-card-heading h2').textContent()).trim(),resource,'resources i18n '+code);
     assert.equal((await page.locator('#homeRecommendedTitle').textContent()).trim(),recommended,'recommendations i18n '+code);
     assert.equal(await page.evaluate(()=>window.VDuckieInterfaceI18n.getLanguage()),code);
     assert.equal(await page.evaluate(()=>performance.getEntriesByType('navigation').length),before,'language switch caused reload');
     if(code==='zh'||code==='en'){
       const expectedRec=code==='zh'?'每个人都有自己的学习路线':'Everyone has a different learning path';
       const expectedReview=code==='zh'?'根据你的错题调整练习':'Practice adapts to your mistakes';
       await page.waitForFunction(expected=>document.querySelector('#v85PersonalDashboard .v85-recommend h3')?.textContent===expected,expectedRec);
       await page.waitForFunction(expected=>document.querySelector('#v86PremiumLearning .v86-adaptive h3')?.textContent===expected,expectedReview);
       if(code==='zh'){
         await page.waitForFunction(()=>document.querySelector('#v86PremiumLearning .v86-adaptive-meta .v86-chip')?.textContent.startsWith('难度：'));
         const flashes=await page.evaluate(async()=>{
           const failures=[];
           const expected=[
             ['#v85PersonalDashboard .v85-recommend h3','每个人都有自己的学习路线'],
             ['#v86PremiumLearning .v86-adaptive h3','根据你的错题调整练习']
           ];
           const observe=new MutationObserver(()=>{
             for(const [selector,zh] of expected){
               const value=document.querySelector(selector)?.textContent.trim();
               if(value&&value!==zh)failures.push(selector+': '+value);
             }
           });
           observe.observe(document.body,{childList:true,subtree:true,characterData:true});
           document.dispatchEvent(new CustomEvent('vduckie:learning-change'));
           document.dispatchEvent(new CustomEvent('vduckie:adaptive-change'));
           await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
           observe.disconnect();
           return failures;
         });
         assert.deepEqual(flashes,[],'Vietnamese flash when personalized cards are rerendered');
       }
     }
     await page.screenshot({path:outDir+'/'+width+'-home-'+code+'.png'});
   }
   console.log('PASS: desktop/mobile VI -> ZH -> EN UI switch, no reload and stable titles');
 }
 await open('home');if(!observe)await page.waitForFunction(()=>[...document.querySelectorAll('.home-resource-tile img,.home-course-art img')].every(e=>e.complete&&e.naturalWidth>0));await check('home');
 if(!observe)await checkLanguages();
 if(!observe){assert.equal(await page.locator('link[rel="icon"]').count(),1);assert((await page.locator('link[rel="icon"]').getAttribute('href')).includes('duckie-reader-icon-32.png'));if(width>980)assert.equal(new Set(await page.locator('.home-resource-tile img').evaluateAll(es=>es.map(e=>e.getAttribute('src')))).size,4);}
 if(!observe&&width>980){assert.equal(await page.locator('.v86-adaptive').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(239, 246, 255)');assert.equal(await page.locator('.v86-adaptive').evaluate(e=>getComputedStyle(e).backgroundImage),'none');}
 if(!observe)assert.equal(await page.locator('.duckie-chat-launch').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(219, 234, 254)');
 if(!observe){await open('erp:lessons');await page.locator('.erp-module-goal').waitFor();
  for(let i=0;i<8;i++){await page.locator(`[data-module-index="${i}"]`).click();await check('erp-lesson-'+(i+1));assert.equal(await page.locator('.erp-module-goal').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(239, 246, 255)');}
  if(!live){const right=await page.locator('.erp-module-options').getAttribute('data-right');const buttons=await page.locator('.erp-module-option').all();for(const button of buttons){if(await button.getAttribute('data-answer')!==right){await button.click();break;}};await check('erp-answer-feedback');}
 }

 if(!observe){for(const screen of ['community','personal','glossary','quiz','dialogue','cards']){
  await open('erp:'+screen);await page.locator('#'+screen).waitFor({state:'visible'});
  assert(await page.locator('#'+screen).evaluate(e=>parseFloat(getComputedStyle(e).paddingLeft))>=16,screen+' missing padding');
  const counter=await page.locator('.journey-score').evaluate(e=>[e.querySelector('strong'),...e.querySelectorAll('strong>span')].map(x=>getComputedStyle(x).fontSize));assert.equal(new Set(counter).size,1,'counter slash and digits differ');
  if(screen==='community'||screen==='personal'){const button=page.locator(screen==='community'?'#submitCommunity':'#saveNew');assert(await button.evaluate(e=>e.getBoundingClientRect().height)>=44,screen+' submit/save target is too small');assert.equal(await button.evaluate(e=>getComputedStyle(e).borderTopWidth),'1px');}
  if(screen==='glossary'){await page.locator('#search').fill('库存');await page.locator('#filters [data-category="Kho"]').click();}
  if(screen==='dialogue'){assert.equal(await page.locator('.dialogue-bubble').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(239, 246, 255)');await page.locator('#showDialogueHint').click();}
  if(screen==='cards'){await page.locator('#flashcard').click();await page.locator('#cardBack').waitFor({state:'visible'});}
  if(screen==='quiz'&&!live)await page.locator('#quizOptions button').first().click();
  await check('erp-'+screen);
 }}
 await open('msutong');await page.locator('.graded-hsk-page').waitFor();
 if(!observe){
   await page.evaluate(()=>window.VDuckieInterfaceI18n.setLanguage('zh'));
   await page.waitForFunction(()=>document.querySelector('.graded-hsk-card p')?.textContent.includes('课'));
   assert.match(await page.locator('.hsk-entry-note').textContent(),/HSK 补充资源/);
   await page.evaluate(()=>window.VDuckieInterfaceI18n.setLanguage('vi'));
 }
 await check('curriculum');
 if(!observe){
   await page.locator('[data-practice-open]').click();
   await page.locator('.hsk-practice-paper').first().waitFor();
   assert.equal(await page.locator('.hsk-practice-paper').count(),56,'HSK1 must show 56 playable practice papers');
   await page.locator('[data-practice-level="3"]').click();
   assert.equal(await page.locator('.hsk-practice-paper').count(),56,'HSK3 must show 56 practice papers');
   await page.locator('[data-practice-level="1"]').click();
   await page.locator('[data-practice-start="1"]').click();
   await page.locator('.hsk-practice-question').waitFor();
   assert.match(await page.locator('.hsk-practice-progress').textContent(),/1 \/ 24/);
   if(await page.locator('[data-practice-choice]').count())await page.locator('[data-practice-choice]').first().click();
   else{await page.locator('#hskPracticeAnswer').fill('汉字');await page.locator('[data-practice-write] button').click();}
   await page.locator('[data-practice-next]:not([disabled])').waitFor();
   assert.match(await page.locator('.hsk-practice-feedback').textContent(),/Đáp án:/);
   await page.locator('[data-practice-catalog]').click();
   assert.equal(await page.locator('.hsk-practice-paper').count(),56);
   await page.locator('[data-practice-close]').click();
   await page.locator('.graded-hsk-page').waitFor();
 }
 await page.getByRole('button',{name:'Học HSK 1 →',exact:true}).click();await page.locator('.hsk-focus-tabs').waitFor();
 if(!observe){
   await page.evaluate(()=>window.VDuckieInterfaceI18n.setLanguage('zh'));
   await page.waitForFunction(()=>document.querySelector('.hsk-focus-word-title > span')?.textContent.startsWith('单词 '));
   assert.equal((await page.locator('.hsk-focus-intro').first().textContent()).trim(),'听发音 → 猜意思 → 看例句 → 回忆。');
   assert.deepEqual(await page.locator('.hsk-focus-tabs button').allTextContents(),['1 · 生词','2 · 听读','3 · 练习','4 · 补充知识']);
   const prePaint=await page.evaluate(async()=>{
     const element=document.querySelector('.hsk-focus-intro');
     element.textContent='Nghe → đoán nghĩa → xem ví dụ → thử nhớ lại.';
     await new Promise(done=>requestAnimationFrame(done));
     return element.textContent.trim();
   });
   assert.equal(prePaint,'听发音 → 猜意思 → 看例句 → 回忆。','HSK text should retranslate before the next browser paint');
   assert.match((await page.locator('.hsk-focus-details summary').first().textContent()).trim(),/使用例句/);
   await page.evaluate(()=>window.VDuckieInterfaceI18n.setLanguage('vi'));
 }
 await check('hsk-words');
 for(const stage of ['examples','practice','extra']){await page.locator(`[data-focus-stage="${stage}"]`).click();await check('hsk-'+stage);}
 await open('daily');await page.locator('.learning-session').waitFor();
 if(!observe){
   await page.evaluate(()=>window.VDuckieInterfaceI18n.setLanguage('zh'));
   await page.waitForFunction(()=>document.querySelector('.learning-session .focus-kicker')?.textContent.trim()==='认识新词');
   assert.match(await page.locator('.learning-session-nav').textContent(),/返回/);
   await page.evaluate(()=>window.VDuckieInterfaceI18n.setLanguage('vi'));
 }
 await check('daily');
 await open('review');await page.locator('#dailyLearningPanel:not(.hidden)').waitFor();await check('review');
 await open('dictionary');await page.locator('#dailyDictionarySearch').fill('学习');await page.locator('#dailyDictionarySearch').press('Enter');
 if(!observe){
   await page.evaluate(()=>window.VDuckieInterfaceI18n.setLanguage('zh'));
   await page.waitForFunction(()=>document.querySelector('.dictionary-screen h1')?.textContent==='中越词典');
   await page.waitForFunction(()=>/条结果/.test(document.querySelector('#dailyDictionaryStatus')?.textContent||''));
   assert.equal((await page.locator('.dictionary-screen .focus-kicker').textContent()).trim(),'独立词汇查询');
   const words=await page.locator('.dictionary-word p').allTextContents();
   assert(words.every(Boolean),'Dictionary meanings must still be available');
   await page.evaluate(()=>window.VDuckieInterfaceI18n.setLanguage('vi'));
 }
 await check('dictionary');
 await open('ranking');await page.locator('#leaderboard').waitFor();
 if(!observe){
   await page.evaluate(()=>window.VDuckieInterfaceI18n.setLanguage('zh'));
   await page.waitForFunction(()=>document.querySelector('#leaderboard .exp-award-guide')?.textContent.startsWith('正确记住'));
   assert.match(await page.locator('#leaderboard .exp-board-head p').first().textContent(),/每周和每月 EXP/);
   await page.evaluate(()=>window.VDuckieInterfaceI18n.setLanguage('vi'));
 }
 for(const period of ['week','month','total']){await page.locator(`[data-exp-period="${period}"]`).click();await check('ranking-'+period);}
 await open('profile');
 if(!observe){
   await page.evaluate(()=>window.VDuckieInterfaceI18n.setLanguage('zh'));
   await page.waitForFunction(()=>document.querySelector('.profile-screen h1')?.textContent==='我的 VDuckie');
   assert.match(await page.locator('.profile-signature strong').textContent(),/已掌握/);
   await page.evaluate(()=>window.VDuckieInterfaceI18n.setLanguage('vi'));
 }
 await check('profile');
 await page.locator('.duckie-chat-launch').click();await page.locator('#duckieChat').waitFor();await check('chat');
 if(!observe){await page.addStyleTag({content:'body .duckie-chat-panel .dc-greeting{background:#f5f1e8!important;color:#18352e!important}'});assert.equal(await page.locator('.dc-greeting').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(239, 246, 255)','late injected CSS beat the brand layer');assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(network.filter(r=>r.status>=400),[]);}
 let storage=null;if(live){storage=await page.evaluate(async()=>({controller:navigator.serviceWorker.controller?.scriptURL||null,registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({scope:r.scope,active:r.active?.scriptURL||null,updateViaCache:r.updateViaCache})),caches:await caches.keys()}));await page.reload();await page.locator('.duckie-chat-launch').waitFor();await check('warm-reload');}
 console.log(JSON.stringify({width,serviceWorker:storage,consoleEntries,networkErrors:network.filter(r=>r.status>=400),failed,loadedVisualAssets:network.filter(r=>/design-system|mascot|service-worker/.test(r.url))}));
 report.push({width,errors,consoleEntries,failed,network,serviceWorker:storage});await context.close();
}await writeFile(outDir+'/report.json',JSON.stringify(report,null,2));if(!observe)assert.equal(report.filter(r=>r.issues?.length).length,0,'Screens with legacy paint; inspect the JSON report above');console.log('PASS: visual audit completed; '+(live?'live network + SW/cache recorded':'isolated SDK, learning logic unchanged'));}finally{await writeFile(outDir+'/report.json',JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(ok=>server.close(ok));}
