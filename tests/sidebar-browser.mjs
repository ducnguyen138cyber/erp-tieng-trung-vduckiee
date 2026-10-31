// Full application regression with an isolated, explicit Supabase test double.
// No real Google session, production RPC write, or real learner data is used.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!filename.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  try { response.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream' }); response.end(await readFile(filename)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true });
const results = [];

function sdkFixture(authenticated) {
  return `(() => {
    const user = ${authenticated ? JSON.stringify({ id: '00000000-0000-4000-8000-000000000001', email: 'test@example.invalid', user_metadata: { full_name: 'Sidebar Test' } }) : 'null'};
    const session = user ? { user, access_token: 'isolated-test-session' } : null;
    window.__sidebarTest = { calls: [], oauth: [], fail: false };
    const missions = [
      {mission_code:'study_5_days', title:'Học đủ 5 ngày', reward_exp:100, current_value:0, target_value:5},
      {mission_code:'review_10_words', title:'Ôn 10 từ vựng', reward_exp:50, current_value:0, target_value:10},
      {mission_code:'complete_quiz', title:'Làm 1 bài kiểm tra', reward_exp:50, current_value:0, target_value:1}
    ];
    const row = { rank:1, display_name:'Sidebar Test', period_exp:150, total_exp:350 };
    const query = () => new Proxy({}, {get(_obj, key) {
      if (key === 'then') return (resolve, reject) => Promise.resolve({data:[], error:null}).then(resolve,reject);
      return () => query();
    }});
    window.supabase = {createClient() {return {
      auth: {
        getSession: async () => ({data:{session}, error:null}),
        onAuthStateChange: () => ({data:{subscription:{unsubscribe(){}}}}),
        signInWithOAuth: async options => {window.__sidebarTest.oauth.push(options); return {data:{}, error:null}},
        signOut: async () => ({error:null})
      },
      from: query,
      rpc: async (name,args) => {
        window.__sidebarTest.calls.push({name,args});
        if(window.__sidebarTest.fail && name === 'get_leaderboard') return {data:null,error:{code:'PGRST202',message:'function get_leaderboard missing from schema cache'}};
        return {error:null,data:name === 'get_my_exp' ? 350 : name === 'get_weekly_missions' ? missions : name === 'get_leaderboard' ? [row] : name === 'get_my_rank' ? [row] : null};
      }
    }}};
  })();`;
}

try {
  for (const authenticated of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(20000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/**', route => route.fulfill({ contentType: 'text/javascript', body: sdkFixture(authenticated) }));
    await page.route('https://*.supabase.co/**', route => route.abort());
    await page.goto(base);
    await page.waitForFunction(() => window.VDuckieHomeEXP90 && window.__VDUCKIE_EXPERIENCE_V86_READY__);
    const home = async () => {
      await page.locator('#studySidebar [data-home]').click();
      await page.locator('#v865HomeSidebar [data-exp-mission]').first().waitFor({state:'visible'});
    };
    await home();
    if (authenticated) await page.waitForFunction(() => document.querySelector('#expHeaderAccount')?.textContent.includes('350'));
    await page.waitForFunction(() => document.querySelector('#expMiniList')?.textContent.includes('Sidebar Test'));

    // Inspect actual browser event listeners, rather than inferring from markup.
    const cdp = await context.newCDPSession(page);
    const { result: doc } = await cdp.send('Runtime.evaluate', { expression: 'document' });
    const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: doc.objectId });
    assert(listeners.some(listener => listener.type === 'click' && listener.useCapture), 'sidebar capture listener missing');

    // An unrelated DOM mutation must not replace/focus-drop the mission button.
    const mission = await page.locator('[data-exp-mission="review_10_words"]').elementHandle();
    await mission.focus();
    await page.evaluate(() => { const node = document.createElement('span'); document.body.append(node); node.remove(); });
    await page.waitForTimeout(250); // Observe several animation frames of the old feedback loop.
    assert(await mission.evaluate(node => node.isConnected && document.activeElement === node), 'mission replaced by observer feedback');
    await mission.dispose();

    for (const [selector, target] of [
      ['[data-v865-action="start-streak"]', '.daily-panel'],
      ['[data-exp-mission="study_5_days"]', '.daily-panel'],
      ['[data-exp-mission="review_10_words"]', '.daily-panel'],
      ['[data-exp-mission="complete_quiz"]', '#quiz'],
      ['[data-exp-open-all]', '#leaderboard'],
      ['[data-v865-action="continue"]', '#hsk'],
    ]) {
      console.log('Testing', authenticated ? 'mock authenticated' : 'guest', selector);
      await home();
      await page.locator('#v865HomeSidebar ' + selector).click({ delay: 150 });
      if (target === '.daily-panel') {
        // Daily Learning mounts its destination as a sibling of the home hub.
        await page.getByRole('heading', {name: selector.includes('review_10') ? 'Không có từ đến hạn' : 'Giáo trình tiếng Trung', exact:true}).waitFor();
      } else await page.locator(target).waitFor({state:'visible'});
      assert.equal(await page.locator('#homeHub').isVisible(), false, selector + ' left home visible');
      results.push({session: authenticated ? 'mock authenticated' : 'guest', click:selector, passed:true});
    }

    await home();
    await page.locator('[data-exp-mission="review_10_words"]').focus();
    await page.keyboard.press('Enter');
    await page.getByRole('heading', {name:'Không có từ đến hạn',exact:true}).waitFor();
    await home();
    await page.locator('[data-exp-mission="complete_quiz"]').focus();
    await page.keyboard.press('Space');
    await page.locator('#quiz').waitFor({state:'visible'});

    // Mini board must retain both data and errors across legacy home rerenders.
    await home();
    await page.evaluate(() => window.VDuckieHomeDashboardV865.render());
    await page.waitForFunction(() => document.querySelector('#expMiniList')?.textContent.includes('Sidebar Test'));
    await page.evaluate(() => { window.__sidebarTest.fail = true; return window.VDuckieHomeEXP90.refreshMini(); });
    await page.locator('[data-exp-retry-mini]').waitFor();
    await page.evaluate(() => window.VDuckieHomeDashboardV865.render());
    await page.locator('[data-exp-retry-mini]').waitFor();
    await page.evaluate(() => { window.__sidebarTest.fail = false; });
    await page.locator('[data-exp-retry-mini]').click({delay:150});
    await page.waitForFunction(() => document.querySelector('#expMiniList')?.textContent.includes('Sidebar Test'));
    await page.locator('[data-exp-open-all]').click();
    for (const period of ['week','month','total']) {
      await page.locator('[data-exp-period="' + period + '"]').click();
      await page.waitForFunction(value => window.__sidebarTest.calls.some(call => call.name === 'get_leaderboard' && call.args.p_period === value), period);
      assert.equal(await page.locator('[data-exp-period="'+period+'"]').getAttribute('aria-selected'), 'true');
    }

    // Google initiation and EXP contract only; this is not a live OAuth login.
    if (!authenticated) {
      await page.locator('#expLoginButton').click();
      await page.waitForFunction(() => window.__sidebarTest.oauth.length > 0);
      const oauth = await page.evaluate(() => window.__sidebarTest.oauth[0]);
      assert.equal(oauth.provider, 'google');
      assert.equal(oauth.options.redirectTo, base);
    } else {
      const award = await page.evaluate(() => window.VDuckieEXP.awardEXP('quiz_pass','test:quiz'));
      assert.equal(award.awarded, false); // mock returns no award; no fabricated success
      const call = await page.evaluate(() => window.__sidebarTest.calls.find(call => call.name === 'award_exp'));
      assert.deepEqual(call.args, {p_activity_code:'quiz_pass',p_source_id:'test:quiz'});
    }
    assert.deepEqual(errors, [], 'uncaught browser errors');
    await context.close();
  }
  console.log(JSON.stringify({passed:true, results, limitations:['Supabase SDK mocked; live Google OAuth, production EXP and database migration are NOT verified.']}, null, 2));
} finally { await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
