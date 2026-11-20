import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),out=path.join(root,'artifacts/sentence-hsk');await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();try{const data=await readFile(p);res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';let browser;
const sdk=`(()=>{const user={id:'00000000-0000-4000-8000-000000000001',user_metadata:{full_name:'Matching QA'}},session={user,access_token:'test-session'};window.__sentenceCalls=[];const q=()=>new Proxy({},{get(o,k){return k==='then'?(ok,bad)=>Promise.resolve({data:[],error:null}).then(ok,bad):()=>q()}});window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:q,rpc:async(name,args)=>{window.__sentenceCalls.push({name,args});return {error:null,data:name==='get_my_exp'?349:name==='start_game_run'?{run_id:'test-run'}:name==='submit_game_run'?{score:args.p_result.completed*100}:name==='get_game_leaderboard'?{rows:[],mine:null}:[]};}};}};})()`;
const catalog=JSON.parse(await readFile('data/games/sentence-catalog.json','utf8')),banks=new Map();for(const row of catalog.levels)banks.set(row.level,JSON.parse(await readFile('data/games/'+row.file,'utf8')).sentences);
try{
 for(const [engine,type,width,height] of [['chromium',chromium,1440,950],['chromium',chromium,390,850],['chromium',chromium,320,740],['webkit',webkit,390,850]]){
  browser=await type.launch();const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage(),errors=[],requested=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/data\/games\/sentences-hsk/.test(r.url()))requested.push(r.url());});page.setDefaultTimeout(20000);
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:sdk}));await page.route('https://*.supabase.co/**',r=>r.abort());await page.route('https://erp-tieng-trung.vduckie.chatgpt.site/api/community-terms',r=>r.fulfill({json:{terms:[]},headers:{'access-control-allow-origin':'*'}}));
  await page.goto(base+'?screen=games');await page.locator('[data-game-action=sentences]').click();await page.locator('[data-sentence-action=start]:not([disabled])').waitFor();assert.equal(await page.locator('.sg-hsk-levels [data-topic^=hsk]').count(),6);assert(requested.every(u=>u.includes('sentences-hsk1.json')),'opening setup only fetches the selected level');
  const seen=new Set();
  async function answer(level){const vi=await page.locator('.sg-prompt').textContent(),item=banks.get(level).find(s=>s.vi===vi);assert(item,'prompt belongs to chosen HSK');assert(!seen.has(item.id),'no repeated prompt across games/reloads');seen.add(item.id);assert.equal(await page.locator('.sg-hanzi').count(),0,'Chinese answer stays hidden before input');await page.locator('#sentencePinyin').fill(item.answers[0].pinyin);await page.locator('.sg-answer.is-revealed').waitFor();assert.equal(await page.locator('.sg-hanzi').textContent(),item.answers[0].hanzi);return item;}
  for(let level=1;level<=6;level++){
   await page.locator('[data-topic=hsk'+level+']').click();await page.locator('[data-sentence-action=start]:not([disabled])').click();assert.match(await page.locator('.sg-head').textContent(),new RegExp('HSK '+level));await answer(level);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow');await page.screenshot({path:path.join(out,engine+'-'+width+'-hsk'+level+'.png')});await page.locator('[data-sentence-action=choices]').click();
  }
  await page.locator('[data-topic=hsk2]').click();
  for(let game=0;game<2;game++){
   await page.locator('[data-sentence-action=start]:not([disabled])').click();for(let q=0;q<10;q++){await answer(2);await page.locator('[data-sentence-action=next]').click();}await page.locator('.sg-results').waitFor();assert.match(await page.locator('.sg-results').textContent(),/1000/);if(game===0)await page.locator('[data-sentence-action=choices]').click();
  }
  assert(await page.evaluate(()=>window.__sentenceCalls.some(c=>c.name==='start_game_run'&&c.args.p_game==='sentences'&&c.args.p_category==='hsk2')),'ranking category follows HSK');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('vduckie:sentence-seen:v2')));assert(stored.length>=26);await page.reload();await page.locator('[data-game-action=sentences]').click();await page.locator('[data-topic=hsk2][aria-pressed=true]').waitFor();await page.locator('[data-sentence-action=start]:not([disabled])').click();await answer(2);assert.deepEqual(errors,[]);await page.locator('[data-sentence-action=exit]').click();await page.locator('.games-hub').waitFor();assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('vd-sentence-playing')),false);await context.close();await browser.close();browser=null;console.log('PASS graded sentences',engine,width,'fresh prompts:',seen.size);
 }
}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
