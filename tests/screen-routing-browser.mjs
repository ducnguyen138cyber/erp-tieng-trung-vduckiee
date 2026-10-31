// Real Chromium navigation regression; no production Supabase credentials.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const server = createServer(async (req,res) => {
  const name = path.resolve(root, '.' + (new URL(req.url,'http://localhost').pathname === '/' ? '/index.html' : decodeURIComponent(new URL(req.url,'http://localhost').pathname)));
  if (!name.startsWith(root + path.sep)) return res.writeHead(403).end();
  try { res.writeHead(200, {'Content-Type':mime[path.extname(name)]||'application/octet-stream'}).end(await readFile(name)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base = 'http://127.0.0.1:'+server.address().port+'/';
const browser = await chromium.launch({headless:true});
const failures = [];
try {
  for (const width of [1440,390]) {
    const context = await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
    const page = await context.newPage();
    const consoleErrors = [], networkFailures = [];
    page.on('pageerror', e=>consoleErrors.push(e.message));
    page.on('requestfailed', request=>{ if(new URL(request.url()).hostname==='127.0.0.1') networkFailures.push(request.url()); });
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/**', route=>route.fulfill({contentType:'text/javascript',body:`window.supabase={createClient(){const q=()=>new Proxy({}, {get(_o,k){if(k==='then')return (ok)=>Promise.resolve({data:[],error:null}).then(ok);return ()=>q();}});return {auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOAuth:async()=>({data:{},error:null})},from:q,rpc:async()=>({data:[],error:null})}}};`}));
    await page.route('https://*.supabase.co/**',route=>route.abort());
    await page.goto(base);
    await page.waitForFunction(()=>window.VDuckieScreenRouter && window.VDuckieDailyLearning && document.querySelector('#studySidebar [data-exp-nav="ranking"]'));
    async function verify(screen, visible, hidden=[]) {
      assert.equal(await page.evaluate(()=>window.VDuckieScreenRouter.current()),screen);
      assert.equal(new URL(page.url()).searchParams.get('screen'),screen);
      assert.equal(await page.locator('#studySidebar button.active').count(),1,'exclusive active sidebar item');
      assert.equal(await page.locator('#studySidebar button[aria-current="page"]').count(),1);
      await page.locator(visible).waitFor({state:'visible'});
      for(const sel of hidden) assert.equal(await page.locator(sel).isVisible(),false,sel+' should be hidden on '+screen);
    }
    async function click(selector) { await page.locator(selector).evaluate(node=>node.click()); }
    await verify('home','#homeHub',['#leaderboard','#dailyLearningPanel']);
    await click('#studySidebar [data-daily-nav="msutong"]');
    await verify('msutong','#curriculumWorkspace',['#homeHub','#leaderboard']);
    await click('#studySidebar [data-exp-nav="ranking"]');
    await verify('ranking','#leaderboard',['#homeHub','#curriculumWorkspace','#hsk','#lessons']);
    await click('#studySidebar [data-home]');
    await verify('home','#homeHub',['#leaderboard','#dailyLearningPanel']);
    await page.goBack();
    await verify('ranking','#leaderboard',['#homeHub','#dailyLearningPanel']);
    await page.goBack();
    await verify('msutong','#curriculumWorkspace',['#homeHub','#leaderboard']);
    await page.goForward();
    await verify('ranking','#leaderboard',['#homeHub','#dailyLearningPanel']);
    await page.reload();
    await page.waitForFunction(()=>window.VDuckieScreenRouter && document.getElementById('leaderboard'));
    await verify('ranking','#leaderboard',['#homeHub','#dailyLearningPanel']);
    await page.goto(base+'?screen=erp%3Aquiz');
    await page.waitForFunction(()=>window.VDuckieScreenRouter && document.getElementById('quiz'));
    await verify('erp:quiz','#quiz',['#homeHub','#leaderboard','#dailyLearningPanel']);
    await click('#studySidebar [data-view="quiz"]');
    assert.equal(new URL(page.url()).searchParams.get('screen'),'erp:quiz','same screen no duplicate navigation');
    assert.deepEqual(consoleErrors,[],'uncaught page errors');
    assert.deepEqual(networkFailures,[],'local asset requests');
    failures.push({width,passed:true});
    await context.close();
  }
  console.log(JSON.stringify({passed:true,results:failures,limits:['Supabase mocked; OAuth and live database are not exercised']})); 
} finally {await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
