import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain'}).end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({headless:true}),results=[];
function sdk(auth){return `(()=>{const session=${auth?JSON.stringify({user:{id:'00000000-0000-4000-8000-000000000001',user_metadata:{full_name:'Curriculum Test'}}}):'null'};window.__courseCalls=[];const query=()=>new Proxy({},{get(o,k){if(k==='then')return(r,j)=>Promise.resolve({data:[],error:null}).then(r,j);return()=>query()}});window.supabase={createClient(){return{auth:{getSession:async()=>({data:{session}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOAuth:async()=>({data:{}}),signOut:async()=>({})},from:query,rpc:async(name,args)=>{window.__courseCalls.push({name,args});return{error:null,data:name==='get_my_exp'?35:name==='get_leaderboard'||name==='get_my_rank'||name==='get_weekly_missions'?[]:name==='award_exp'?[{awarded:true,exp_awarded:args.p_activity_code==='quiz_pass'?15:20,total_exp:35}]:null}}}}})();`;}
try{
 for(const width of [1440,1024,390,320]){
  const ctx=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',route=>route.fulfill({contentType:'text/javascript',body:sdk(width===1440)}));await page.route('https://*.supabase.co/**',route=>route.abort());
  await page.addInitScript(()=>{if(!localStorage.getItem('vduckie-daily-learning-v1'))localStorage.setItem('vduckie-daily-learning-v1',JSON.stringify({version:2,updatedAt:10,msutong:{currentBook:'beginner-1',currentLesson:'b1-u1',completed:{'b1-u1':{completedAt:1,score:2}}}}));});
  await page.goto(base);await page.waitForFunction(()=>window.VDuckieCurriculum&&window.VDuckieEXPCore&&window.__VDUCKIE_EXPERIENCE_V86_READY__);
  const open=async()=>{await page.locator(width<=760?'#mobileLearningDock [data-daily-nav="msutong"]':'#studySidebar [data-daily-nav="msutong"]').click();await page.locator('#curriculumWorkspace').waitFor();};await open();
  assert.equal(await page.locator('.cu-lesson-card').count(),10);assert.equal(await page.locator('.cu-lesson-card.is-done').count(),1,'legacy completion lost');
  await page.locator('[data-cu="filter"][data-value="done"]').click();assert.equal(await page.locator('.cu-lesson-card').count(),1);
  await page.locator('[data-cu="filter"][data-value="all"]').click();await page.locator('#cuSearch').fill('sinh nhat');assert.equal(await page.locator('.cu-lesson-card').count(),1);assert.equal(await page.locator('#cuSearch').evaluate(e=>e===document.activeElement),true);
  await page.locator('#cuSearch').fill('zzzz-not-a-lesson');await page.getByRole('heading',{name:'Chưa có bài phù hợp',exact:true}).waitFor();await page.locator('[data-cu="clear"]').click();
  await page.locator('#cuBook').selectOption('beginner-2');assert.equal(await page.locator('.cu-lesson-card').count(),10);await page.locator('[data-cu="lesson"][data-value="b2-u1"]').click();assert.equal(await page.locator('.cu-toc button').count(),6);assert.equal(await page.evaluate(()=>scrollY),0,'lesson must open at its heading');
  await page.locator('[data-cu="catalogue"]').first().click();await page.locator('#cuBook').selectOption('beginner-1');await page.locator('[data-cu="lesson"][data-value="b1-u1"]').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'horizontal overflow');
  if(width===1440||width===390){
   const durations=[];const next=async()=>{const t=Date.now();await page.locator('#cuSectionNav [data-cu="next"]').click();durations.push(Date.now()-t);};
   await next();await page.getByRole('heading',{name:'Từ vựng trong bài',exact:true}).waitFor();await page.locator('[data-cu="pinyin"]').click();assert.equal(await page.locator('#curriculumWorkspace').evaluate(e=>e.classList.contains('cu-hide-pinyin')),true);
   await page.locator('[data-cu="save-word"]').first().click();await next();await next();await next();await page.getByRole('heading',{name:'Luyện tập có giải thích',exact:true}).waitFor();
   await page.locator('#cuQ-meaning-1').getByRole('button',{name:'Xin chào',exact:true}).click();
   await page.locator('[data-cu="section"][data-value="context"]').click();await page.locator('[data-cu="section"][data-value="practice"]').click();assert.match(await page.locator('#cuQuizSummary').innerText(),/1\/8 câu đúng/);
   await page.reload();await page.waitForFunction(()=>window.VDuckieCurriculum&&window.__VDUCKIE_EXPERIENCE_V86_READY__);await open();await page.locator('[data-cu="resume"]').click();await page.getByRole('heading',{name:'Luyện tập có giải thích',exact:true}).waitFor();assert.match(await page.locator('#cuQuizSummary').innerText(),/1\/8 câu đúng/,'answer/resume lost on reload');
   await page.locator('#cuQ-meaning-2').getByRole('button',{name:'Tôi',exact:true}).click();await page.locator('#cuQ-pinyin').getByRole('button',{name:'nín hǎo',exact:true}).click();await page.locator('#cuQ-grammar').getByRole('button',{name:'老师，您好！',exact:true}).click();
   await page.locator('#cuAnswer-order').fill('你们好');await page.locator('#cuAnswer-order').press('Enter');await page.locator('#cuQ-reading').getByRole('button',{name:'Giáo viên',exact:true}).click();await page.locator('#cuQ-listening').getByRole('button',{name:'Chào các bạn!',exact:true}).click();await page.locator('#cuAnswer-recall').fill('老师');await page.locator('#cuAnswer-recall').press('Enter');
   assert.match(await page.locator('#cuQuizSummary').innerText(),/8\/8 câu đúng/);await next();await page.locator('#cuWriting').fill('老师您好。你们好。我叫安娜。');await page.locator('#cuSpoken').check();await page.locator('#cuCheckedWriting').check();
   await page.waitForFunction(()=>window.VDuckieDailyLearning.getState().msutong.lessons['b1-u1'].writing==='老师您好。你们好。我叫安娜。');
   await page.evaluate(()=>{const api=window.VDuckieDailyLearning,remote=api.getState(),p=remote.msutong.lessons['b1-u1'];remote.updatedAt+=1000;remote.msutong.updatedAt+=1000;p.updatedAt-=1000;p.writing='旧草稿';p.spoken=false;api.mergeRemote(remote);});
   assert.equal(await page.evaluate(()=>window.VDuckieDailyLearning.getState().msutong.lessons['b1-u1'].writing),'老师您好。你们好。我叫安娜。','stale cloud draft replaced new writing');
   await next();await page.locator('.cu-result').waitFor();
   assert.match(await page.locator('.cu-result').innerText(),/8\/8 câu đúng/);const saved=await page.evaluate(()=>window.VDuckieDailyLearning.getState().msutong);assert.equal(saved.completed['b1-u1'].completedAt,1,'old completion overwritten');assert.equal(Object.keys(saved.lessons['b1-u1'].answers).length,8);
   if(width===1440){await page.waitForFunction(()=>window.__courseCalls.filter(c=>c.name==='award_exp').length>=2);const awards=await page.evaluate(()=>window.__courseCalls.filter(c=>c.name==='award_exp'));assert(awards.some(c=>c.args.p_source_id==='hsk:curriculum_b1-u1:quiz'));assert(awards.some(c=>c.args.p_source_id==='hsk:curriculum_b1-u1:lesson'));}
   await page.locator('[data-cu="catalogue"]').first().click();await page.locator('[data-cu="review"]').click();await page.getByRole('button',{name:'Xin chào',exact:true}).click();await page.locator('[data-cu="review-next"]').click();assert.equal(await page.evaluate(()=>window.VDuckieDailyLearning.getState().msutong.review['你好'].lastReviewedAt>0),true);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('vduckie-review-srs-v1')).words['你好'].lastReviewedAt>0),true);
   results.push({width,fullLesson:true,persisted:true,reviewLinked:true,maxNavigationMs:Math.max(...durations)});assert(Math.max(...durations)<2000,'step transition is unexpectedly slow');
  }else results.push({width,catalogueAndToc:true,noOverflow:true});
  assert.deepEqual(errors,[]);await ctx.close();
 }
 console.log(JSON.stringify({passed:true,results,auth:'Supabase SDK mocked for repeatability. Live Google OAuth is not exercised.'},null,2));
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
