// Real Chromium integration, responsive screenshots/video. Network rewards are mocked here;
// the actual RPC is verified separately with tests/sql/typing-exp-rollback.sql.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),out=path.join(root,'artifacts/typing-game');await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  try{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(await readFile(file));}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/';const browser=await chromium.launch();const results=[];
const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s]/g,'');
try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:390,height:480}]){
    const name=viewport.width+'x'+viewport.height,context=await browser.newContext({viewport,serviceWorkers:'block',recordVideo:{dir:out,size:viewport}}),page=await context.newPage();
    console.log(name+': starting setup');page.setDefaultTimeout(15000);
    const errors=[],failures=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',req=>{if(req.url().startsWith(base)&&!/ABORTED/.test(req.failure()?.errorText||''))failures.push(req.url());});
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',route=>route.fulfill({contentType:'text/javascript',body:`window.supabase={createClient(){const q=()=>new Proxy({}, {get(o,k){if(k==='then')return ok=>Promise.resolve({data:[],error:null}).then(ok);return ()=>q()}});return {auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:q,rpc:async()=>({data:[],error:null})}}};`}));
    await page.route('https://*.supabase.co/**',route=>route.abort());
    await page.addInitScript(()=>{
      // Repeatable vocabulary order + heart meteors, with a REAL WebAudio context.
      Math.random=()=>.05;
      const Native=window.AudioContext;if(Native)window.AudioContext=class extends Native{
        constructor(){super();window.__typingAudio=this;window.__typingTones=0;}
        createBufferSource(){window.__typingTones++;return super.createBufferSource();}
      };
    });
    await page.goto(base+'?screen=games&area=hsk&hskLevel=1');
    await page.locator('#gamesScreen .games-card').waitFor();
    assert.equal(await page.locator('#hsk').isVisible(),false);
    assert.equal(await page.locator('#studySidebar button.active').count(),1);
    await page.screenshot({path:path.join(out,name+'-catalog.png')});
    await page.locator('[data-game-action=choose]').click();
    await page.locator('[data-level="4"]:not([disabled])').waitFor();
    assert.equal(await page.locator('[data-level]:not([disabled])').count(),4);
    for(const n of [2,3,4,1]){
      await page.locator('[data-level="'+n+'"]').click();await page.locator('[data-mode=easy]').waitFor();
      assert.equal(await page.locator('[data-game-action=start]').isDisabled(),true);
      if(n!==1){await page.locator('[data-game-action=levels]').click();}
    }
    await page.locator('[data-mode=easy]').click();
    // Only the reward boundary is mocked, preserving the actual game + UI logic.
    await page.evaluate(()=>{
      window.__typingRewardKeys=new Set();window.__typingRewardCalls=0;window.__typingRewardEXP=0;
      window.VDuckieEXP={...window.VDuckieEXP,awardWordMastery:async(level,hanzi)=>{
        window.__typingRewardCalls++;const key=level+':'+hanzi,duplicate=window.__typingRewardKeys.has(key);
        window.__typingRewardKeys.add(key);if(!duplicate)window.__typingRewardEXP+=3;
        return {awarded:!duplicate,exp_awarded:duplicate?0:3,reason:duplicate?'duplicate':'awarded'};
      }};
    });
    console.log(name+': starting real-time gameplay');
    await page.locator('[data-game-action=start]').click();
    assert.equal(await page.locator('.tg-overlay').count(),1);
    assert.equal(await page.locator('.duckie-chat-launch').isVisible(),false);
    await page.waitForTimeout(2200);
    const answer=normalize(await page.locator('.tg-meteor.is-target .tg-word>span').textContent());
    const input=page.locator('#typingPinyin');
    const planeBox=await page.locator('.tg-plane').boundingBox(),arenaBox=await page.locator('.tg-arena').boundingBox();
    assert.ok(Math.abs(planeBox.x+planeBox.width/2-arenaBox.x-arenaBox.width/2)<1,'plane is fixed in the center');
    assert.equal(await page.locator('.tg-plane').evaluate(n=>getComputedStyle(n).animationName),'none');
    assert.ok((await page.locator('.tg-plane img').getAttribute('src')).includes('airplane.svg'));
    await page.evaluate(()=>{
      const tree=document.querySelector('.tg-stage-host').shadowRoot;
      window.__typingShots=[];new MutationObserver(records=>{for(const r of records){const n=r.target;
        if(n.classList.contains('tg-bullet'))window.__typingShots.push({letter:n.dataset.letter,x:parseFloat(n.style.left),delay:(n.getAnimations()[0]?.effect.getTiming().delay||0)/1000});
      }}).observe(tree.querySelector('.tg-effects'),{subtree:true,attributes:true,attributeFilter:['data-shot']});
      window.__typingFirstGlyph=tree.querySelector('.tg-meteor.is-target i');
    });
    const prefix=answer.slice(0,2);await input.fill(prefix);
    assert.equal(await page.locator('.tg-meteor.is-target i.is-correct').count(),prefix.length);
    assert.equal(await page.evaluate(()=>window.__typingShots.length),prefix.length,'two accepted letters produce two projectiles');
    assert.equal(await page.locator('.tg-meteor.is-target i').first().evaluate(n=>n===window.__typingFirstGlyph),true,'typing reuses existing glyph nodes');
    assert.equal(await page.locator('.tg-effects').evaluate(n=>n.childElementCount),80,'bounded effect pool is allocated once');
    const wrong=answer[prefix.length]==='x'?'q':'x';await input.pressSequentially(wrong);
    assert.equal(await input.inputValue(),prefix,'incorrect key is discarded without Backspace');
    assert.equal(await input.getAttribute('aria-invalid'),'false');
    assert.equal(await page.evaluate(()=>window.__typingShots.length),prefix.length,'incorrect key never fires');
    await page.screenshot({path:path.join(out,name+'-ignored-key.png')});
    await input.pressSequentially(answer.slice(prefix.length));
    const shots=await page.evaluate(()=>window.__typingShots);
    assert.equal(shots.length,answer.length,'one projectile for every correct character');
    assert.ok(shots.every(s=>Math.abs(s.x-arenaBox.width/2)<1),'all projectiles launch from the centered airplane');
    assert.ok(shots[1].delay>shots[0].delay,'batched keys have visibly separate launch times');
    assert.equal(await page.locator('[data-score]').textContent(),'100');assert.equal(await input.inputValue(),'');
    assert.equal(await page.locator('[data-hearts]').textContent(),'♥♥♥♥');
    assert.ok(await page.evaluate(()=>window.__typingTones)>0,'real cached WebAudio buffer sources created');
    assert.equal(await page.evaluate(()=>window.__typingRewardEXP),3);
    for(let i=0;i<2;i++){
      await page.locator('.tg-meteor.is-target .tg-word>span').waitFor({timeout:2000});
      await input.fill(normalize(await page.locator('.tg-meteor.is-target .tg-word>span').textContent()));
      assert.equal(await page.locator('[data-hearts]').textContent(),'♥♥♥♥','additional heart rocks cannot exceed four lives');
    }
    const earnedBeforeReplay=await page.evaluate(()=>window.__typingRewardEXP);
    await page.locator('.tg-meteor').waitFor({timeout:2000});
    await page.waitForTimeout(2200);
    const laterPlane=await page.locator('.tg-plane').boundingBox();assert.ok(Math.abs(laterPlane.x-planeBox.x)<1,'plane does not chase another meteor');
    const inputBox=await input.boundingBox();assert.ok(inputBox.y+inputBox.height<=viewport.height,'input stays above viewport bottom');
    await page.screenshot({path:path.join(out,name+'-gameplay.png')});
    await page.locator('[data-game-action=pause]').click();const before=await page.locator('[data-time]').textContent();
    await page.waitForTimeout(1100);assert.equal(await page.locator('[data-time]').textContent(),before);
    await page.locator('[data-game-action=resume]').click();
    await page.locator('[data-game-action=sound]').click();assert.equal(await page.locator('[data-game-action=sound]').getAttribute('aria-label'),'Bật âm');
    await page.locator('[data-game-action=sound]').click();
    // A separate real tab causes the browser visibility event; the game must pause.
    const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();
    await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
    // Headless visibility differs by Chrome version; enforce the hidden property only for the event test.
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
    assert.equal(await page.locator('.tg-cover').isVisible(),true);
    await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:false}));await other.close();await page.bringToFront();await page.locator('[data-game-action=resume]').click();
    console.log(name+': checking gameover');
    if(viewport.width===1440)await page.locator('.tg-results').waitFor({timeout:70000});
    else {
      // The full timed round is covered on desktop; all viewport shapes repeat input/pause/restart.
      await page.locator('[data-game-action=pause]').click();
      await page.locator('[data-game-action=choices]').click();
      await page.locator('[data-level=\"1\"]').click();await page.locator('[data-mode=easy]').click();await page.locator('[data-game-action=start]').click();
      const repeat=normalize(await page.locator('.tg-meteor.is-target .tg-word>span').textContent());await input.pressSequentially(repeat);
      assert.equal(await page.evaluate(()=>window.__typingRewardEXP),earnedBeforeReplay);
      await page.getByRole('button',{name:'Thoát trò chơi',exact:true}).click();
    }
    if(viewport.width===1440){
    assert.ok(await page.locator('.tg-missed b').count()>0);
    await page.screenshot({path:path.join(out,name+'-results.png')});
    await page.locator('[data-game-action=restart]').click();
    assert.equal(await page.locator('.tg-overlay').count(),1);assert.equal(await page.locator('[data-score]').textContent(),'0');assert.equal(await page.locator('[data-hearts]').textContent(),'♥♥♥');
    const repeat=normalize(await page.locator('.tg-meteor.is-target .tg-word>span').textContent());await input.pressSequentially(repeat);
    assert.equal(await page.evaluate(()=>window.__typingRewardEXP),earnedBeforeReplay,'replay cannot award same word twice');
    await page.getByRole('button',{name:'Thoát trò chơi',exact:true}).click();assert.equal(await page.locator('.tg-overlay').count(),0);
    await page.waitForTimeout(800);assert.equal(await page.locator('.tg-meteor').count(),0);
    for(const key of ['medium','hard']){
      await page.locator('[data-game-action=choose]').click();await page.locator('[data-level="1"]').click();await page.locator('[data-mode='+key+']').click();await page.locator('[data-game-action=start]').click();
      const threshold=key==='medium'?7200:4500,started=Date.now();
      await page.waitForFunction(()=>document.querySelector('.tg-stage-host').shadowRoot.querySelectorAll('.tg-meteor').length===2,{},{timeout:threshold+4000});
      assert.ok(Math.abs(Date.now()-started-threshold)<1500,'staggered spawn follows configured active seconds');
      await page.getByRole('button',{name:'Thoát trò chơi',exact:true}).click();
    }
    }
    console.log(name+': completed all interactions');
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
    results.push({viewport,passed:true,checks:['hsk1-4_data','required_setup','per_character_color','wrong_key_ignored','automatic_score_once','heart_reward_max_four','centered_airplane','one_projectile_per_letter','real_webaudio','next_spawn','pause','tab_pause_simulated_visibility','restart','reward_replay_dedupe_mock','exit_cleanup','responsive_bounds','shadow_isolation','reused_glyphs','bounded_effect_pool',...(viewport.width===1440?['gameover','missed_review','medium_hard_stagger_real_time']:[])]});
    const video=page.video();await context.close();if(video)await video.saveAs(path.join(out,name+'-gameplay.webm'));
  }
  await writeFile(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{
  // Browser code can leave an in-flight HTTP request when its tab closes.
  // Close those sockets before awaiting server shutdown so CI cannot hang after PASS.
  console.log('Closing static server connections');server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
  console.log('Closing Chromium');await browser.close();console.log('Browser verification finished');
}
// Playwright's extra recording tab can leave its ffmpeg helper handle alive after
// every context/video has closed. This CLI reaches here only when all checks pass;
// exceptions bypass this line and keep their normal nonzero exit status.
process.exit(0);
