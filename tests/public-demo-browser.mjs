// Real-browser regression for the public mobile/factory/game demo.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import T from '../assets/games/typing-engine.js';
const root=process.cwd(),out=path.join(root,'artifacts/public-demo');await mkdir(out,{recursive:true});
const bank=JSON.parse(await readFile('data/games/sentences.json','utf8')).sentences;
const files=JSON.parse(await readFile('data/hsk/hsk1/vocabulary/index.json','utf8')).shards;
const vocabulary=(await Promise.all(files.map(f=>readFile('data/hsk/hsk1/vocabulary/'+f.file,'utf8').then(JSON.parse)))).flatMap(x=>x.records);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';const browser=await chromium.launch(),results=[];
try{
for(const viewport of [{width:1440,height:900},{width:320,height:740},{width:390,height:844},{width:844,height:390}]){
 const name=viewport.width+'x'+viewport.height,context=await browser.newContext({viewport,serviceWorkers:'block',recordVideo:{dir:out,size:viewport}}),page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',route=>route.fulfill({contentType:'text/javascript',body:`window.supabase={createClient(){const q=()=>new Proxy({}, {get(o,k){if(k==='then')return ok=>Promise.resolve({data:[],error:null}).then(ok);return ()=>q()}});return {auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:q,rpc:async()=>({data:[],error:null})}}};`}));
 await page.route('https://*.supabase.co/**',route=>route.abort());await page.addInitScript(()=>{Math.random=()=>.05;});
 await page.goto(base);await page.waitForFunction(()=>window.__VDUCKIE_EXPERIENCE_V86_READY__&&window.VDuckieMobileMenu);
 assert.equal(await page.locator('.v85-profile').count(),0);
 assert.doesNotMatch(await page.locator('body').innerText(),/CÁ NHÂN HÓA · V85|CONTENT PACK V74|Supabase sync|PWA dùng chung|Cần chạy migration/);
 assert.equal(await page.locator('script[src*="/developer"]').count(),0);
 const mobile=viewport.width<=980,toggle=page.locator('#mobileMenu');
 if(mobile){
  await toggle.click();await page.locator('body.vd-menu-open').waitFor();
  assert.equal(await page.locator('#studySidebar').getAttribute('aria-modal'),'true');
  await page.waitForFunction(()=>document.getElementById('studySidebar').getBoundingClientRect().x>=-1);
  assert.ok((await page.locator('#studySidebar').boundingBox()).x>=-1);
  await page.screenshot({path:path.join(out,name+'-menu.png')});
  await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await toggle.evaluate(n=>document.activeElement===n),true);
  await toggle.click();const backdropPoint=await page.evaluate(()=>{for(let x=innerWidth-1;x>=0;x--)if(document.elementFromPoint(x,120)?.id==='sidebarBackdrop')return {x,y:120};return null;});assert.ok(backdropPoint,'an exposed backdrop accepts pointer input');await page.mouse.click(backdropPoint.x-3,backdropPoint.y);assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await toggle.click();const close=page.locator('#sidebarClose');await close.focus();await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('#studySidebar').evaluate(n=>n.contains(document.activeElement)),true);
 }else assert.equal(await toggle.isVisible(),false);
 await page.locator('#studySidebar [data-view=lessons]').click();
 await page.locator('#erpLessonApp .erp-module-link').first().waitFor();
 if(mobile)assert.equal(await toggle.getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('#studySidebar button.active').count(),1);
 assert.equal(await page.locator('.erp-module-link').count(),12);
 for(const index of [8,9,10,11]){await page.locator('.erp-module-link').nth(index).click();assert.equal(await page.locator('.erp-lesson-word').count(),10);}
 await page.screenshot({path:path.join(out,name+'-factory.png')});
 if(mobile)await toggle.click();await page.locator('#studySidebar [data-daily-nav=games]').click();await page.locator('[data-game-action=sentences]').waitFor();
 await page.evaluate(()=>{window.__demoAwards=0;const a=async()=>{window.__demoAwards++;return {awarded:true}};window.VDuckieEXP={...window.VDuckieEXP,awardWordMastery:a,awardEXP:a,recordLearningEvent:a};});
 for(const prompt of ['guided','hanzi','vietnamese']){
  await page.locator('[data-game-action=choose]').click();await page.locator('[data-level="1"]').click();await page.locator('[data-mode=hard]').click();await page.locator('[data-prompt='+prompt+']').click();await page.locator('[data-game-action=start]').click();
  const meteor=page.locator('.tg-meteor.is-target');await meteor.waitFor();
  const text=await meteor.innerText();let word;
  if(prompt==='vietnamese'){assert.equal(await meteor.locator('.tg-word strong,.tg-word i').count(),0);assert.doesNotMatch(text,/[\u4e00-\u9fff]/);const vi=await meteor.locator('.tg-meaning').textContent();word=vocabulary.find(w=>w.meaningVi.split(/[;；]/)[0]===vi);}
  else{const hanzi=await meteor.locator('.tg-word strong').textContent();word=vocabulary.find(w=>w.simplified===hanzi);assert.equal(await meteor.locator('.tg-word i').count()>0,prompt==='guided');}
  assert.ok(word,'prompt resolves to a published vocabulary word');
  const input=page.locator('#typingPinyin'),answer=T.normalize(word.pinyinTone||word.pinyin);await input.fill(answer.slice(0,1));await input.pressSequentially('zz');assert.equal(await input.inputValue(),answer.slice(0,1));await input.fill(answer);assert.equal(await page.locator('[data-score]').textContent(),'100');
  if(prompt!=='guided')assert.match(await page.locator('.tg-feedback').innerText(),new RegExp(word.simplified));
  await page.screenshot({path:path.join(out,name+'-'+prompt+'.png')});await page.getByRole('button',{name:'Thoát trò chơi',exact:true}).click();assert.equal(await page.locator('.tg-overlay').count(),0);
 }
 await page.locator('[data-game-action=sentences]').click();
 for(const topic of ['basic','daily','factory']){
  await page.locator('[data-topic='+topic+']').click();await page.locator('[data-sentence-action=start]').click();
  const limit=topic==='basic'?10:2;
  for(let i=0;i<limit;i++){
   const prompt=await page.locator('.sg-prompt').innerText(),s=bank.find(s=>s.vi===prompt);assert.ok(s);assert.equal(await page.locator('.sg-answer').textContent(),'');assert.equal(await page.locator('.sg-hanzi').count(),0);
   const input=page.locator('#sentencePinyin'),answer=T.normalize(s.answers.at(-1).pinyin),mask=page.locator('.sg-mask');
   assert.equal(await page.locator('.sg-slot.is-correct').count(),0);assert.equal(await page.locator('.sg-caret').count(),1);assert.doesNotMatch(await mask.innerText(),/[a-z]/i);
   assert.deepEqual(await page.locator('.sg-syllable').allTextContents(),s.answers[0].pinyin.trim().split(/\s+/).map(p=>'*'.repeat(T.normalize(p).length)));
   assert.equal(await mask.getAttribute('aria-hidden'),'true');assert.equal(await input.evaluate(n=>getComputedStyle(n).color),'rgba(0, 0, 0, 0)');
   await input.pressSequentially(answer[0]);assert.equal(await page.locator('.sg-slot.is-correct').textContent(),answer[0]);assert.equal(await page.locator('.sg-slot.is-correct').evaluate(n=>getComputedStyle(n).color),'rgb(21, 148, 85)');
   // Freeze the finite error animation to verify both feedback color and movement.
   await input.pressSequentially('#');assert.equal(await input.inputValue(),answer[0]);
   const error=await page.locator('.sg-slot.is-current').evaluate(n=>{const a=n.getAnimations()[0];if(!a)return null;a.pause();a.currentTime=100;return {duration:a.effect.getTiming().duration,color:getComputedStyle(n).color,frames:a.effect.getKeyframes()};});
   assert.ok(error,'wrong character animates current star');assert.equal(error.duration,420);assert.equal(error.color,'rgb(220, 38, 38)');assert.ok(error.frames.some(f=>f.transform==='translateX(-3px)'));
   await input.pressSequentially('#');assert.equal(await input.inputValue(),answer[0]);assert.doesNotMatch(await mask.innerText(),/#/);
   await input.press('Backspace');assert.equal(await input.inputValue(),'');assert.equal(await page.locator('.sg-slot.is-correct').count(),0);assert.equal(await page.locator('.sg-slot.is-current').evaluate(n=>n.getAnimations().length),0);
   const layout=await mask.evaluate(n=>({width:n.clientWidth,scroll:n.scrollWidth,font:parseFloat(getComputedStyle(n).fontSize),box:n.parentElement.getBoundingClientRect().height}));assert.ok(layout.scroll<=layout.width+1);assert.ok(layout.font<=(viewport.width<=650?28:42));assert.ok(layout.box>=90);
   if(i===0){await input.pressSequentially(answer.slice(0,Math.min(6,answer.length-1)));await input.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,name+'-'+topic+'-masked.png')});}
   if(i===0&&topic==='factory'){
    await page.emulateMedia({reducedMotion:'reduce'});await input.pressSequentially('#');const frames=await page.locator('.sg-slot.is-current').evaluate(n=>n.getAnimations()[0].effect.getKeyframes());assert.ok(frames.every(f=>f.transform==='none'||/^translateX\(0(?:px)?\)$/.test(f.transform)));await page.emulateMedia({reducedMotion:'no-preference'});
   }
   if(i===1){await page.locator('[data-sentence-action=skip]').click();}else{await input.fill(answer);assert.equal(await page.locator('.sg-hanzi').textContent(),s.answers.at(-1).hanzi);assert.equal(await input.getAttribute('readonly'),'');}
   if(i===0)assert.equal(await page.locator('[data-sg-summary]').textContent(),'Đúng 1 câu · 100 điểm');
   assert.ok(await page.locator('.sg-pinyin').isVisible());assert.equal(await page.locator('.duckie-chat-launch').isVisible(),false);
   if(i===0){if(viewport.width===390)await page.setViewportSize({width:390,height:480});await input.scrollIntoViewIfNeeded();const box=await input.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=(viewport.width===390?480:viewport.height));await page.screenshot({path:path.join(out,name+'-'+topic+'-sentence.png')});if(viewport.width===390)await page.setViewportSize(viewport);}
   await page.locator('[data-sentence-action=next]').click();
  }
  if(topic==='basic'){await page.locator('.sg-results').waitFor();assert.match(await page.locator('.sg-results').innerText(),/900/);assert.equal(await page.locator('.sg-review').count(),1);await page.locator('[data-sentence-action=start]').click();assert.equal(await page.locator('[data-sg-score]').textContent(),'0');}
  await page.locator('[data-sentence-action=choices]').click();
 }
 await page.locator('[data-sentence-action=exit]').click();assert.equal(await page.locator('.sg-card').count(),0);assert.equal(await page.locator('.games-card').count(),2);assert.equal(await page.evaluate(()=>window.__demoAwards),0);assert.deepEqual(errors,[]);
 results.push({viewport,passed:true,checks:['mobile_drawer_keyboard_backdrop_autoclose','one_active_route','no_private_panel_or_developer_scripts','12_factory_modules','three_word_prompt_modes','wrong_keys_ignored','hidden_answers_not_in_DOM','three_sentence_topics','masked_syllables_green_prefix_caret','red_star_shake_wrong_key_hidden','compact_mobile_wrap_reduced_motion','alternative_answer','ten_sentence_result_review_restart','reduced_keyboard_viewport','zero_EXP']});console.log(name+' PASS');await context.close();
}
await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await browser.close();}
process.exit(0);
