import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),out='artifacts/learning-polish';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain'}).end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}/`,report=[],browser=await chromium.launch();
await mkdir(out,{recursive:true});
try{
 for(const width of [1920,1440,1280,1024,390,320]){
  const context=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:'window.supabase={createClient(){const q=()=>new Proxy({},{get(o,k){if(k==="then")return ok=>Promise.resolve({data:[],error:null}).then(ok);return()=>q()}});return{auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:q,rpc:async()=>({data:[],error:null})}}}'}));
  await page.addInitScript(()=>localStorage.setItem('vduckie-home-discover-expanded-v1','0'));
  await page.goto(base+'?screen=hsk-study&hskLevel=3&hskLesson=hsk3-lesson-01');
  await page.locator('#hskLesson .hsk-focus-tabs').waitFor();
  await page.waitForFunction(()=>window.VDuckieScreenRouter?.current()==='hsk-study'&&window.__VDUCKIE_EXPERIENCE_V86_READY__);
  await page.waitForFunction(()=>[...document.querySelectorAll('link[rel="stylesheet"]')].every(e=>e.sheet));
  for(const level of [3,1,2,4]){
   await page.locator(`#hskLevels [data-pro-level="${level}"]`).click();
   await page.waitForFunction(n=>window.VDuckieHskProfessionalRuntime?.getState().selectedLevel===n&&document.querySelector('#hskLesson .hsk-focus-tabs'),level);
   const geometry=await page.evaluate(()=>{
    const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,width:r.width,right:r.right};};
    return{main:rect('.study-center'),lesson:rect('#hskLesson'),rail:rect('#studyRail'),parents:document.querySelector('#studyRail').parentElement.className,mainParent:document.querySelector('.study-center > main')?.parentElement.className,overflow:document.documentElement.scrollWidth-innerWidth};
   });
   assert.equal(geometry.parents,'study-layout','rail must stay in the shared layout');
   assert.equal(geometry.mainParent,'study-center','lesson main escaped its center');
   assert(geometry.overflow<2,'page overflow '+JSON.stringify(geometry));
   assert(geometry.lesson.width>=(width>980?450:width-65),'lesson collapsed: '+JSON.stringify(geometry));
   if(width>980){assert(geometry.lesson.x>=geometry.main.x-2);assert(geometry.lesson.right<=geometry.rail.x,'lesson overlaps rail');}
   if(width>980){
    const nav=await page.locator('.hsk-pro-bottom-nav').boundingBox();
    assert(nav.x>=geometry.main.x-2&&nav.x+nav.width<=geometry.main.right+2,'lesson navigation escaped its column');
   }
   await page.locator('[data-pro-next]').click();
   await page.waitForFunction(n=>window.VDuckieHskProfessionalRuntime.getState().selectedLessonId===`hsk${n}-lesson-02`,level);
   await page.locator('[data-pro-prev]').click();
   await page.waitForFunction(n=>window.VDuckieHskProfessionalRuntime.getState().selectedLessonId===`hsk${n}-lesson-01`,level);
   report.push({width,level,...geometry});
   await page.screenshot({path:`${out}/${width}-hsk${level}.png`});
  }
  // Direct lesson -> Shadowing, URL restoration and history use the full app.
  await page.locator('#hskLevels [data-pro-level="2"]').click();
  await page.locator('[data-shadow-open-level="2"]').waitFor();
  assert(!/Checkpoint|Final Assessment|Mastery Review|UNIT/.test(await page.locator('#hskJourney').innerText()),'mixed-language lesson navigation');
  await page.locator('[data-shadow-open-level="2"]').click();
  await page.locator('.shadow-hanzi').waitFor();
  assert.equal(new URL(page.url()).searchParams.get('screen'),'shadowing');
  assert.match(await page.locator('#shadowGroup').inputValue(),/hsk2-lesson-01-dialogue/);
  assert.equal(await page.locator('#shadowRecording').isVisible(),false,'empty player must stay hidden');
  assert.equal(await page.locator('[data-shadow-clear]').isVisible(),false,'empty delete control must stay hidden');
  assert.equal(await page.locator('[data-shadow-stop]').isDisabled(),true);
  await page.locator('[data-shadow-next]').click();
  const shadowURL=page.url(),shadowText=await page.locator('.shadow-hanzi').innerText();
  await page.reload();await page.locator('.shadow-hanzi').waitFor();
  assert.equal(page.url(),shadowURL);assert.equal(await page.locator('.shadow-hanzi').innerText(),shadowText);
  await page.locator('[data-shadow-back]').click();await page.locator('.graded-hsk-page').waitFor();
  await page.goBack();await page.locator('.shadow-hanzi').waitFor();
  assert.equal(await page.locator('.shadow-hanzi').innerText(),shadowText);
  await page.locator('#brandHome').click();
  await page.locator('#v865TodayFocus').waitFor();
  assert.equal(await page.locator('.daily-today').count(),0,'duplicate legacy mobile Home');
  assert.equal(await page.locator('#homeHub .home-welcome-card').isVisible(),false);
  for(const selector of ['#v865HomeSidebar','.home-library-card','.home-recommended','#v85PersonalDashboard .v85-stats'])assert.equal(await page.locator(selector).isVisible(),true,selector+' must remain visible with the old collapsed preference');
  if(width>980){
   const main=await page.locator('#v865HomeMain').boundingBox(),side=await page.locator('#v865HomeSidebar').boundingBox();
   assert(side.x>=main.x+main.width-1&&Math.abs(side.y-main.y)<4,'desktop Home must keep its right column');
  }
  assert.equal(await page.locator('#v865TodayFocus .v865-today-primary:visible').count(),1);
  const primary=await page.locator('.v865-today-primary').evaluate(e=>getComputedStyle(e).backgroundColor);
  assert.equal(primary,'rgb(37, 99, 235)','primary learning action must stand out');
  await page.screenshot({path:`${out}/${width}-home-focus.png`});
  await page.locator('[data-v865-action="toggle-discover"]').click();
  assert.equal(await page.locator('#v865HomeSidebar').isVisible(),true);
  assert.equal(await page.locator('.vi-home-invite').isVisible(),true);
  assert.equal((await page.locator('.resource-speaking').innerText()).replace(/\s+/g,' ').trim(),'224 Bài luyện HSK');
  await page.screenshot({path:`${out}/${width}-home-discover.png`});
  await page.locator('[data-v865-action="toggle-discover"]').click();
  for(const selector of ['#v865HomeSidebar','.home-library-card','.home-recommended','#v85PersonalDashboard .v85-stats'])assert.equal(await page.locator(selector).isVisible(),true,selector+' vanished after collapsing supplementary tools');
  await page.reload();await page.locator('#v865TodayFocus').waitFor();
  assert.equal(await page.locator('#v865HomeSidebar').isVisible(),true,'right rail must survive reload while collapsed');
  await page.locator('#v865TodayFocus [data-daily-nav="dictionary"]').click();
  await page.locator('#dailyDictionarySearch').fill('努力');
  await page.locator('.dictionary-example strong').filter({hasText:'只要继续努力'}).waitFor();
  assert.match(await page.locator('.dictionary-example').innerText(),/Chỉ cần tiếp tục cố gắng/);
  assert.match(await page.locator('.dictionary-example-pinyin').innerText(),/nǔ lì/);
  assert.match(await page.locator('.dictionary-meta').innerText(),/HSK 3/);
  await page.screenshot({path:`${out}/${width}-dictionary.png`});
  await page.locator('#brandHome').click();await page.locator('#v865TodayFocus [data-daily-nav="msutong"]').click();
  await page.locator('[data-practice-open]').click();await page.locator('.hsk-practice-paper').first().waitFor();
  assert.equal(await page.locator('.hsk-practice-paper').count(),56);
  assert.match(await page.locator('.hsk-practice-paper').first().innerText(),/Nghe · Đọc/);
  assert.match(await page.locator('.hsk-practice-paper').first().innerText(),/40 câu · 40 phút/);
  await page.screenshot({path:`${out}/${width}-practice-catalog.png`});
  // Native keyboard disclosure, then an actual factory lesson navigation.
  await page.goto(base+'?screen=home');await page.locator('#v865TodayFocus').waitFor();
  if(width<=980)await page.locator('#mobileMenu').click();
  await page.locator('#erpNavGroup>summary').waitFor();
  assert.equal(await page.locator('#erpNavGroup').getAttribute('open'),null);
  await page.locator('#erpNavGroup>summary').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#studySidebar [data-view="lessons"]').isVisible(),true);
  await page.locator('#studySidebar [data-view="lessons"]').click();await page.locator('#lessons').waitFor({state:'visible'});
  assert.equal(new URL(page.url()).searchParams.get('screen'),'erp:lessons');
  await page.reload();await page.locator('#lessons').waitFor({state:'visible'});
  assert.notEqual(await page.locator('#erpNavGroup').getAttribute('open'),null,'active factory route must expand its menu');
  assert.deepEqual(errors,[],'uncaught browser errors');
  await context.close();
 }
}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();server.close();}
console.log('PASS: shared HSK1–4 layout at 1440, 1280, 1024, 390 and 320px');
