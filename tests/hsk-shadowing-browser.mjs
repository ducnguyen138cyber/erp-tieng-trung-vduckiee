import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'};
const server=createServer(async(req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),filename=path.resolve(root,'.'+pathname);
 if(!filename.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});res.end(await readFile(filename));}
 catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
// Synthetic capture tests MediaRecorder integration, not physical mic quality.
const browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const data=Object.fromEntries(await Promise.all([2,3].map(async level=>[level,JSON.parse(await readFile(path.join(root,`data/shadowing/hsk${level}-v1.json`),'utf8'))])));
await mkdir(path.join(root,'artifacts/shadowing'),{recursive:true});
try{
 for(const [device,viewport] of [['desktop',{width:1365,height:900}],['mobile',{width:390,height:844}],['small-mobile',{width:320,height:740}]]){
  const context=await browser.newContext({viewport,serviceWorkers:'block',permissions:['microphone']});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(base+'/offline.html');
  await page.setContent('<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body data-current-area="msutong" style="margin:0;font-family:Arial,sans-serif;background:#f8fafc"><main id="dailyLearningPanel"></main></body></html>');
  await page.evaluate(()=>{
   window.__spoken=[];window.__cancel=0;
   window.VDuckieGradedHSK={open(){window.__back=true}};
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
    getVoices(){return [{lang:'zh-CN',name:'test voice'}]},cancel(){window.__cancel++},
    speak(u){window.__spoken.push({text:u.text,rate:u.rate});setTimeout(()=>u.onend?.(),10)}
   }});
   window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
  });
  await page.addStyleTag({path:path.join(root,'assets/hsk-content/hsk-shadowing-v1.css')});
  await page.addScriptTag({path:path.join(root,'assets/hsk-content/hsk-shadowing-v1.js')});
  await page.evaluate(()=>window.VDuckieShadowing.open(1));await page.locator('.shadow-hanzi').waitFor();
  assert.match(await page.locator('.shadow-counter').innerText(),/1 \/ 900/);
  await page.selectOption('#shadowGroup','unit-2');assert.match(await page.locator('.shadow-counter').innerText(),/1 \/ 25/);
  await page.evaluate(()=>localStorage.setItem('vduckie-shadowing-v1',JSON.stringify({
   2:{id:'hsk2-lesson-07-dialogue-2',group:'hsk2-lesson-07-dialogue',mode:'all',starred:{'hsk2-lesson-07-dialogue-2':true},weak:{'hsk2-lesson-07-dialogue-2':true},custom:'preserved'},
   3:{id:'shadow-hsk3-005',starred:{'shadow-hsk3-005':true}}
  })));
  for(const level of [2,3]){
   await page.locator(`[data-shadow-level="${level}"]`).click();await page.locator('.shadow-hanzi').waitFor();
   const dataset=data[level];
   assert.equal(await page.locator('#shadowGroup option').count(),dataset.lessons.length+1);
   assert.match(await page.locator('.shadow-coverage').innerText(),new RegExp(`${dataset.records.length}/${dataset.records.length}`));
   if(level===2){
    assert.equal(await page.locator('.shadow-hanzi').innerText(),'在五楼。楼前面有超市，后面有公园。');
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('vduckie-shadowing-v1')));
    assert.equal(state[2].id,'hsk2-lesson-07-dialogue-1');assert.equal(state[2].starred[state[2].id],true);
    assert.equal(state[2].weak[state[2].id],true);assert.equal(state[2].custom,'preserved');assert.equal(state[3].id,'shadow-hsk3-005');
   }
   // First, middle and last lessons, with every turn checked against the data.
   for(const lesson of [dataset.lessons[0],dataset.lessons[Math.floor(dataset.lessons.length/2)],dataset.lessons.at(-1)]){
    const turns=dataset.records.filter(r=>r.sourceLessonId===lesson.id);
    await page.selectOption('#shadowGroup',turns[0].sourceSectionId);
    for(let i=0;i<turns.length;i++){
     assert.equal(await page.locator('.shadow-hanzi').innerText(),turns[i].hanzi);
     assert.equal(await page.locator('.shadow-pinyin').innerText(),turns[i].pinyin);
     assert.equal(await page.locator('.shadow-meaning').innerText(),turns[i].vi);
     if(i<turns.length-1)await page.locator('[data-shadow-next]').click();
    }
   }
   assert.equal(await page.locator('[data-shadow-next]').isDisabled(),true);
   await page.locator('[data-shadow-star]').click();await page.locator('[data-shadow-weak]').click();
   await page.locator('[data-shadow-mode="starred"]').click();assert.equal(await page.locator('.shadow-hanzi').count(),1);
   await page.locator('[data-shadow-mode="weak"]').click();assert.equal(await page.locator('.shadow-hanzi').count(),1);
   await page.locator('[data-shadow-mode="all"]').click();
   await page.screenshot({path:path.join(root,'artifacts/shadowing',`${device}-hsk${level}-complete.png`),fullPage:true});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no horizontal overflow');
  }
  await page.locator('[data-shadow-repeat]').click();await page.locator('[data-shadow-rate]').click();
  await page.locator('[data-shadow-play]').click();await page.waitForFunction(()=>window.__spoken.length===3);
  assert.ok((await page.evaluate(()=>window.__spoken)).every(x=>x.rate===0.7));
  await page.locator('[data-shadow-play]').click();await page.locator('[data-shadow-stop]').click();
  const stopped=await page.evaluate(()=>window.__spoken.length);await page.waitForTimeout(750);
  assert.equal(await page.evaluate(()=>window.__spoken.length),stopped,'stop cancels pending repeats');
  await page.locator('[data-shadow-pinyin]').click();await page.locator('[data-shadow-vi]').click();
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('vduckie-shadowing-v1'))[3]);
  await page.evaluate(()=>window.VDuckieShadowing.open(3));await page.locator('.shadow-hanzi').waitFor();
  assert.equal(await page.locator('.shadow-pinyin').count(),0);assert.equal(await page.locator('.shadow-meaning').count(),0);
  assert.match(await page.locator('[data-shadow-rate]').innerText(),/0.7/);assert.match(await page.locator('[data-shadow-repeat]').innerText(),/3/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('vduckie-shadowing-v1'))[3].id),before.id);
  await page.locator('[data-shadow-record]').click();await page.locator('#shadowStatus').filter({hasText:'Đang ghi âm'}).waitFor();
  await page.waitForTimeout(400);await page.locator('[data-shadow-stop]').click();
  await page.waitForFunction(()=>document.getElementById('shadowRecording').getAttribute('src')?.startsWith('blob:'));
  await page.locator('[data-shadow-next]').click();assert.equal(await page.locator('#shadowRecording').getAttribute('src'),null);
  await page.evaluate(()=>Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:async()=>{throw new DOMException('Denied','NotAllowedError')}}));
  await page.locator('[data-shadow-record]').click();await page.locator('#shadowStatus').filter({hasText:'quyền ghi âm'}).waitFor();
  assert.deepEqual(errors,[]);assert.ok(!requests.some(url=>url.endsWith('/lessons.json')),'compact loads avoid full course payloads');
  console.log('SHADOWING_COMPLETE_BROWSER_PASS',device,'content / migration / filters / repeat / capture / denied permission');
  await context.close();
 }
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
