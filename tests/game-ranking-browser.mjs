// Full app navigation and game submission UI. Supabase is isolated/mocked here;
// tests/sql/game-ranking-rollback.sql separately verifies real database behavior.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),out=path.join(root,'artifacts/game-ranking');await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();try{res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'}).end(await readFile(p));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';const browser=await chromium.launch();
function fixture(auth){return `(() => {
 const user = ${auth?JSON.stringify({id:'00000000-0000-4000-8000-000000000001',email:'qa@example.invalid',user_metadata:{full_name:'Người kiểm thử'}}):'null'};
 const session = user ? {user,access_token:'test-session'} : null;
 window.__rankTest={calls:[],fail:false,empty:true};
 const q=()=>new Proxy({},{get(o,k){return k==='then'?(ok,fail)=>Promise.resolve({data:[],error:null}).then(ok,fail):()=>q();}});
 const row={rank:1,display_name:'Người kiểm thử',period_exp:3,total_exp:349};
 window.supabase={createClient(){return {
   auth:{getSession:async()=>({data:{session},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({error:null})},
   from:q,
   rpc:async(name,args)=>{
     window.__rankTest.calls.push({name,args});
     if(name==='get_game_leaderboard'){
       if(window.__rankTest.fail)return {data:null,error:{message:'offline'}};
       const r={rank:1,display_name:'<img src=x onerror=alert(1)>',score:600,completed:6,accuracy:95,is_me:!!user};
       return {data:{rows:window.__rankTest.empty?[]:[r],mine:user&&!window.__rankTest.empty?r:null},error:null};
     }
     return {error:null,data:name==='get_my_exp'?349:name==='get_leaderboard'||name==='get_my_rank'?[row]:name==='get_weekly_missions'?[]:name==='start_game_run'?{run_id:'test-run'}:name==='submit_game_run'?{score:100,duplicate:false}:null};
   }
 };}};
})()`;}

try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:fixture(true)}));await page.route('https://*.supabase.co/**',r=>r.abort());
  await page.goto(base+'?screen=games');await page.locator('[data-game-action=rankings]').click();await page.locator('.gr-empty').waitFor();
  assert.equal(new URL(page.url()).searchParams.get('screen'),'game-ranking');assert.equal(await page.locator('#studySidebar button.active').count(),1);assert.equal(await page.locator('#homeHub').isVisible(),false);
  await page.locator('[data-game-filter=level]').selectOption('3');await page.locator('[data-game-filter=mode]').selectOption('hard');await page.locator('[data-game-filter=prompt]').selectOption('hanzi');await page.locator('[data-game-filter=period]').selectOption('total');
  await page.reload();await page.locator('.gr-empty').waitFor();assert.equal(await page.locator('[data-game-filter=level]').inputValue(),'3');assert.equal(await page.locator('[data-game-filter=mode]').inputValue(),'hard');assert.equal(await page.locator('[data-game-filter=period]').inputValue(),'total');
  await page.screenshot({path:path.join(out,width+'-empty.png'),fullPage:true});
  await page.evaluate(()=>{window.__rankTest.fail=true;});await page.locator('[data-game-filter=mode]').selectOption('easy');await page.locator('[data-game-rank-retry]').waitFor();
  await page.evaluate(()=>{window.__rankTest.fail=false;window.__rankTest.empty=false;});await page.locator('[data-game-rank-retry]').click();await page.locator('.gr-row').waitFor();assert.equal(await page.locator('.gr-row img').count(),0);assert.match(await page.locator('.gr-row').textContent(),/<img src=x/);
  await page.locator('[data-game-filter=game]').selectOption('sentences');await page.locator('[data-game-filter=topic]').selectOption('factory');await page.locator('.gr-row').waitFor();
  assert.ok(await page.evaluate(()=>window.__rankTest.calls.some(c=>c.name==='get_game_leaderboard'&&c.args.p_game==='sentences'&&c.args.p_category==='factory')));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');await page.screenshot({path:path.join(out,width+'-board.png'),fullPage:true});
  await page.locator('#gamesScreen [data-daily-nav=games]').click();await page.locator('.games-card').first().waitFor();await page.goBack();await page.locator('.gr-row').waitFor();await page.goForward();await page.locator('.games-card').first().waitFor();
  // Real typing round + real result view, accelerated engine clock only; network
  // calls are mocked and assertions inspect the exact submission payload.
  await page.locator('[data-game-action=choose]').click();await page.locator('[data-level="1"]').click();await page.locator('[data-mode=easy]').click();
  await page.evaluate(()=>{const step=window.VDuckieTypingEngine.Game.prototype.step;window.VDuckieTypingEngine.Game.prototype.step=function(n){window.__rankingGame=this;return step.call(this,n);};});
  await page.locator('[data-game-action=start]').click();await page.locator('#typingPinyin').waitFor();
  const answer=await page.evaluate(()=>window.VDuckieTypingEngine.normalize(window.__rankingGame.target().word.pinyin));await page.locator('#typingPinyin').fill(answer);await page.evaluate(()=>window.__rankingGame.step(180));
  await page.locator('[data-game-save]').filter({hasText:'Đã lưu 100 điểm'}).waitFor();
  const call=await page.evaluate(()=>window.__rankTest.calls.find(c=>c.name==='submit_game_run'));assert.equal(call.args.p_result.completed,1);assert.deepEqual(call.args.p_result.combos,[1]);
  assert.equal(await page.evaluate(()=>window.__rankTest.calls.filter(c=>/award_|record_learning|claim_weekly/.test(c.name)).length),0,'games do not award EXP or missions');
  await page.locator('.tg-results [data-game-action=rankings]').click();await page.locator('.gr-row').waitFor();assert.equal(await page.locator('[data-game-filter=game]').inputValue(),'typing');assert.equal(await page.locator('[data-game-filter=level]').inputValue(),'1');
  // The protected home panels must survive a full ranking/game/navigation trip.
  await page.locator('#studySidebar [data-home]').evaluate(n=>n.click());await page.locator('#homeHub').waitFor();
  await page.locator('#expMiniList .v90-mini-row').first().waitFor();assert.match(await page.locator('#expHeaderAccount').textContent(),/349 EXP tổng/);assert.match(await page.locator('#expMiniList').textContent(),/3 EXP tuần/);
  for(const selector of ['.vi-home-invite','.home-welcome-card','.home-library-card'])assert.equal(await page.locator(selector).isVisible(),true,selector);
  if(width===1440){assert.equal(await page.locator('#v865HomeSidebar').isVisible(),true);await page.screenshot({path:path.join(out,width+'-home.png'),fullPage:true});}
  assert.deepEqual(errors,[]);await context.close();console.log(width+': game board filters, reload/history, save, EXP isolation, home passed');
 }
 const guest=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await guest.newPage();await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:fixture(false)}));await page.route('https://*.supabase.co/**',r=>r.abort());await page.goto(base+'?screen=game-ranking');await page.locator('.gr-empty').waitFor();assert.match(await page.locator('.gr-mine').textContent(),/Đăng nhập/);await guest.close();
 console.log('Game ranking browser verification passed; Supabase mocked.');
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
