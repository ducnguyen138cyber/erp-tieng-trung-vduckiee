// Real Chromium/WebKit UI; account changes use a deterministic SDK fixture, never production logins.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();const bytes=await readFile(file),headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes'};const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),bytes.length-1):bytes.length-1;return res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1}).end(bytes.subarray(start,end+1));}res.writeHead(200,{...headers,'Content-Length':bytes.length}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port+'/';
const sdk=`(()=>{let user=null;const listeners=[],rows={},calls=[];const state={rows,calls};window.__viFixture=state;
function session(){return user?{user}:null}function emit(event){listeners.forEach(f=>f(event,session()))}
function query(){let filters=[],single=false;let proxy;proxy=new Proxy({},{get(_o,key){if(key==='then')return resolve=>Promise.resolve({data:single?null:Object.values(rows).filter(r=>r.user_id===user?.id&&filters.every(([k,v])=>r[k]===v)),error:null}).then(resolve);if(key==='eq')return(k,v)=>{filters.push([k,v]);return proxy};if(key==='maybeSingle'||key==='single')return()=>{single=true;return proxy};if(key==='upsert')return async(payload)=>{for(const row of payload){if(row.user_id!==user?.id)return {error:Error('RLS')};rows[row.user_id+'|'+row.word_key]=JSON.parse(JSON.stringify(row));calls.push(row.word_key)}return {data:[],error:null}};return()=>proxy}});return proxy}
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:session()},error:null}),onAuthStateChange:f=>{listeners.push(f);return {data:{subscription:{unsubscribe(){}}}}},signInWithPassword:async({email})=>{user={id:email.startsWith('alice')?'alice':'bob',email,user_metadata:{full_name:email.startsWith('alice')?'Alice':'Bob'}};emit('SIGNED_IN');return {data:{session:session()},error:null}},signOut:async()=>{user=null;emit('SIGNED_OUT');return {error:null}},signInWithOAuth:async()=>({data:{},error:null})},from:()=>query(),rpc:async()=>({data:[],error:null})})};})();`;
const lesson=JSON.parse(await readFile('data/vietnamese/lessons/l01.json','utf8'));
const reports=[];await mkdir('artifacts/vietnamese',{recursive:true});
try{for(const[name,engine]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(25000);const errors=[],requests=[];
  page.on('pageerror',e=>errors.push({message:e.message,stack:e.stack}));
  page.on('console',m=>{if(m.text().startsWith('VI_INSERT_BEFORE_FAILURE'))console.log(name,width,m.text());});
  page.on('request',r=>requests.push(r.url()));
  await page.addInitScript(()=>{
    const insert=Node.prototype.insertBefore;
    Node.prototype.insertBefore=function(child,reference){
      try{return insert.call(this,child,reference);}
      catch(error){
        console.error('VI_INSERT_BEFORE_FAILURE '+JSON.stringify({
          parent:this.nodeName,id:this.id,className:String(this.className||''),
          child:child?.nodeName,childId:child?.id,
          reference:reference?.nodeName,referenceId:reference?.id,
          referenceParent:reference?.parentNode?.id,
          stack:new Error('insertBefore failure').stack
        }));
        throw error;
      }
    };
  });
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:sdk}));await page.route('https://*.supabase.co/**',r=>r.abort());
  // Legacy community service is outside this module; keep its cross-origin fetch deterministic.
  await page.route('**/api/community-terms**',r=>r.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({terms:[]})}));
  if(width===390)await page.addInitScript(()=>{const original=window.matchMedia.bind(window);window.matchMedia=q=>q==='(display-mode: standalone)'?{matches:true,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){},dispatchEvent(){return true;}}:original(q);Object.defineProperty(navigator,'standalone',{get:()=>true,configurable:true});});
  const start=Date.now();await page.goto(base);await page.locator('.vi-home-invite button').waitFor({state:'visible'});const initialMs=Date.now()-start;
  assert.equal(requests.some(u=>u.includes('/data/vietnamese/')),false,'no Vietnamese content on initial Chinese home');
  await page.locator('.vi-home-invite button').click();await page.locator('#vietnameseScreen .vi-catalog').first().waitFor();assert.equal(await page.locator('#homeHub').isVisible(),false);
  assert.equal(await page.locator('#vietnameseScreen').getAttribute('lang'),'zh-CN');assert.equal(await page.locator('html').getAttribute('lang'),'vi');
  await page.locator('#vietnameseScreen [data-unit="l01"]').first().click();await page.locator('.vi-flash h2').waitFor();
  assert.equal(await page.locator('.vi-flash h2').textContent(),'xin chào');await page.locator('[data-vi-action="reveal"]').click();assert.match(await page.locator('.vi-word-meaning').textContent(),/你好/);
  await page.locator('[data-vi-action="bookmark"]').click();
  await page.locator('.vi-flash [data-vi-action="speak"]').first().click();await page.locator('[data-vi-audio-status]').filter({hasText:'播放完毕'}).waitFor({timeout:30000});
  await page.locator('#vi-tab-words').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#vi-tab-grammar').getAttribute('aria-selected'),'true');
  await page.locator('#vi-tab-dialogue').click();assert.equal(await page.locator('.vi-dialogue-line').count(),6);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'responsive overflow');assert.equal(await page.locator('#vietnameseScreen .vi-primary').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(37, 99, 235)','primary button keeps branded accessible blue');
  await page.screenshot({path:`artifacts/vietnamese/${name}-${width}-dialogue.png`,fullPage:false});
  if(name==='chromium'&&width===1440){
   await page.locator('#vi-tab-words').click();for(let i=0;i<lesson.words.length;i++)await page.locator('[data-vi-action="next-word"]').click();await page.locator('[data-vi-action="grammar-done"]').click();await page.locator('[data-vi-action="dialogue-done"]').click();
   async function answer(q){if(q.options){if(q.type==='listen')await page.locator('[data-vi-action="listen-text"]').click();await page.locator('input[name="vi-choice"][value="'+q.answer+'"]').check();}else if(q.type==='fill')await page.locator('[data-vi-fill]').fill(q.answers[0]);else if(q.type==='order'){for(let i=0;i<q.tokens.length;i++)await page.locator('[data-vi-action="order-add"][data-token="'+i+'"]').click();}else for(let i=0;i<q.pairs.length;i++){await page.locator('[data-vi-action="match-left"][data-index="'+i+'"]').click();await page.locator('[data-vi-action="match-right"][data-index="'+i+'"]').click();}await page.locator('[data-vi-action="check"]').click();await page.locator('[data-vi-action="next-question"]').click();}
   for(const q of lesson.practice)await answer(q);await page.locator('[data-vi-action="quiz-start"]').click();for(const q of lesson.quiz)await answer(q);
   assert.match(await page.locator('.vi-result').textContent(),/本单元已完成/);await page.reload();await page.locator('#vietnameseScreen .vi-lesson-head').waitFor();assert.match(await page.locator('.vi-lesson-head').textContent(),/已完成/);assert.equal(await page.locator('#hsk').isVisible(),false,'deep-linked Vietnamese must exclude HSK');assert.equal(new URL(page.url()).searchParams.has('area'),false);
   await page.locator('[data-vi-action="login"]').click();await page.locator('#vdaEmail').fill('alice@example.invalid');await page.locator('#vdaPassword').fill('fixture-password');await page.locator('#vdaSubmit').click();await page.locator('#vduckieAuthScreen').waitFor({state:'hidden'});await page.locator('.vi-sync').filter({hasText:'已登录'}).waitFor();
   assert.match(await page.locator('[data-vi-progress]').textContent(),/0 \/ 14/,'guest progress is not attached silently to a new account');
   await page.locator('#vi-tab-words').click();await page.locator('[data-vi-action="known"]').click();await page.locator('[data-vi-action="sync"]').click();await page.locator('[data-vi-sync-status]').filter({hasText:'已同步'}).waitFor();
   await page.evaluate(()=>window.VDuckieCloud.signOut());await page.locator('.vi-sync').filter({hasText:'游客'}).waitFor();
   await page.locator('[data-vi-action="login"]').click();await page.locator('#vdaEmail').fill('alice@example.invalid');await page.locator('#vdaPassword').fill('fixture-password');await page.locator('#vdaSubmit').click();await page.locator('#vduckieAuthScreen').waitFor({state:'hidden'});await page.locator('.vi-sync').filter({hasText:'已登录'}).waitFor();
   assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('vduckie-vietnamese-v1:alice'))['l01-w01'].known));
  }
  await page.locator('[data-vi-action="chinese"]').click();await page.locator('#homeHub').waitFor({state:'visible'});assert.equal(await page.locator('#vietnameseScreen').isVisible(),false);
  assert.deepEqual(errors,[],'page errors');reports.push({engine:name,width,initialMs,errors,standaloneEmulated:width===390,vietnameseInitialDataRequests:0});await context.close();
 }}finally{await browser.close();}
}}finally{server.close();}
await import('node:fs/promises').then(fs=>fs.writeFile('artifacts/vietnamese/browser-results.json',JSON.stringify(reports,null,2)));
console.log(JSON.stringify(reports));
