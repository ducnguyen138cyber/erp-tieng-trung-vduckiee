import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),out='artifacts/mobile-search',report=[];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/search-fixture')return res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}header{position:sticky;top:0;background:white;display:flex}#background{height:2500px}</style></head><body><div id="appShell"><header class="top"><div>VDuckie</div><div class="top-actions"><button>Menu</button></div></header><main id="background">Nội dung học</main></div></body></html>');
 const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain'}).end(await readFile(file))}catch{res.writeHead(404).end()}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}`;
await mkdir(out,{recursive:true});
async function geometry(page,selector,width,height){
 await page.waitForFunction(({selector,width,height})=>{const r=document.querySelector(selector)?.getBoundingClientRect();return r&&r.x>=-1&&r.right<=width+1&&r.y>=-1&&r.bottom<=height+1},{selector,width,height},{timeout:3000});
 const box=await page.locator(selector).boundingBox();
 assert(box.x>=-1&&box.x+box.width<=width+1,`${selector} horizontal overflow ${JSON.stringify(box)}`);
 assert(box.y>=-1&&box.y+box.height<=height+1,`${selector} outside visible viewport ${JSON.stringify(box)}`);
 return box;
}
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch();
  try{
   for(const width of [320,390,844]){
    const context=await browser.newContext({viewport:{width,height:850},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/search-fixture');
    await page.evaluate(()=>{window.HSK_DICTIONARY_TERMS=[{hanzi:'努力',pinyin:'nǔ lì',meanings:['cố gắng'],levels:['3']},{hanzi:'你好',pinyin:'nǐ hǎo',meanings:['xin chào'],levels:['1']}]});
    await page.addStyleTag({path:path.resolve('assets/search/header-chinese-search.css')});
    await page.addScriptTag({path:path.resolve('assets/search/header-chinese-search.js')});
    const input=page.locator('#vsearchInput');
    assert(Number.parseFloat(await input.evaluate(e=>getComputedStyle(e).fontSize))>=16,'input size must be set BEFORE focus');
    await page.evaluate(()=>scrollTo(0,600));
    const scroll=await page.evaluate(()=>scrollY);
    const tap=await input.boundingBox();
    assert(tap.y>=0&&tap.y+tap.height<=850,'sticky input stays visible at the original scroll offset');
    await input.evaluate(e=>e.addEventListener('pointerdown',()=>window.pointerStartScroll=scrollY,{once:true,capture:true}));
    await page.touchscreen.tap(tap.x+10,tap.y+10);
    console.log('search opened',JSON.stringify({engine,width,expectedScroll:scroll,...await page.evaluate(()=>({pointerScroll:window.pointerStartScroll,bodyTop:document.body.style.top,scrollY}))}));
    await page.locator('#vsearchMobileScreen').waitFor();
    assert.equal(await input.evaluate(e=>document.activeElement===e),true,'tap keeps keyboard input focused');
    assert.equal(await page.locator('#appShell').evaluate(e=>e.inert),true,'background is inert');
    await geometry(page,'#vsearchMobileScreen',width,850);
    for(const query of ['cố gắng','co gang','努力','nu li','nǔ lì','nu3 li4']){
     await input.fill(query);
     await page.waitForFunction(()=>document.querySelector('[data-vsearch-result="0"] b')?.textContent==='努力');
    }
    await page.screenshot({path:`${out}/${engine}-${width}-results.png`});
    // Composition must not open a result while the learner confirms a Chinese character.
    await input.evaluate(e=>{e.dispatchEvent(new CompositionEvent('compositionstart'));e.value='你好';e.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true}))});
    await page.waitForTimeout(180);
    assert.equal(await page.locator('#vsearchDetail').count(),0);
    assert.equal(await page.locator('[data-vsearch-result="0"] b').textContent(),'努力');
    await input.evaluate(e=>e.dispatchEvent(new CompositionEvent('compositionend',{data:'你好'})));
    await page.waitForFunction(()=>document.querySelector('[data-vsearch-result="0"] b')?.textContent==='你好');
    // Resize exercises viewport clipping; actual iOS keyboard zoom still needs a device check.
    await page.setViewportSize({width,height:430});
    await geometry(page,'#vsearchMobileScreen',width,430);
    await page.locator('[data-vsearch-result="0"]').tap();
    await page.locator('#vsearchTitle').waitFor();
    assert.equal(await input.evaluate(e=>document.activeElement===e),false,'detail blurs keyboard input');
    await geometry(page,'.vsearch-detail',width,430);
    await page.screenshot({path:`${out}/${engine}-${width}-detail.png`});
    await page.locator('[data-vsearch-close]').tap();
    await page.locator('#vsearchDetail').waitFor({state:'detached'});
    assert.equal(await input.inputValue(),'你好','return retains query');
    assert.equal(await input.evaluate(e=>document.activeElement===e),false,'return does not raise keyboard');
    await page.locator('[data-vsearch-result="0"]').tap();
    await page.goBack();
    await page.locator('#vsearchDetail').waitFor({state:'detached'});
    await page.locator('[data-vsearch-back]').tap();
    await page.locator('#vsearchMobileScreen').waitFor({state:'detached'});
    assert.equal(await page.locator('#appShell').evaluate(e=>e.inert),false);
    assert.equal(await page.locator('.top #vsearchInput').count(),1);
    console.log('search closed',JSON.stringify({engine,width,expectedScroll:scroll,...await page.evaluate(()=>({scrollY,bodyTop:document.body.style.top,restoration:history.scrollRestoration}))}));
    await page.waitForFunction(y=>Math.abs(scrollY-y)<2,scroll,{timeout:3000});
    assert(Math.abs(await page.evaluate(()=>scrollY)-scroll)<2,'restore original page scroll');
    // Late external lookup and debounce cannot reopen the closed search surface.
    await page.evaluate(()=>{window.VDuckieExpandedDictionary={lookup:()=>new Promise(resolve=>window.finishLookup=resolve)}});
    await input.tap();await input.fill('zzzzz');
    await page.waitForFunction(()=>typeof window.finishLookup==='function');
    await page.locator('[data-vsearch-back]').tap();
    await page.locator('#vsearchMobileScreen').waitFor({state:'detached'});
    await page.evaluate(()=>window.finishLookup([{hanzi:'测试',pinyin:'cè shì',meanings:{hsk:['thử nghiệm']}}]));
    await page.waitForTimeout(180);
    assert.equal(await page.locator('#vsearchList').isVisible(),false);
    assert.deepEqual(errors,[]);
    report.push({engine,width,fixture:'pass'});await context.close();
   }
   // All production styles and the real route handler must cooperate with overlay history.
   for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:850},isMobile:width<950,hasTouch:width<950,serviceWorkers:'block'}),page=await context.newPage();
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:'window.supabase={createClient(){const q=()=>new Proxy({},{get(o,k){if(k==="then")return ok=>Promise.resolve({data:[],error:null}).then(ok);return()=>q()}});return{auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:q,rpc:async()=>({data:[],error:null})}}}'}));
    await page.goto(base+'/?screen=home');
    await page.waitForFunction(()=>window.VDuckieScreenRouter&&window.VDuckieHeaderSearch?.search('你好').length&&window.__VDUCKIE_EXPERIENCE_V86_READY__);
    await page.waitForFunction(()=>[...document.querySelectorAll('link[rel="stylesheet"]')].every(e=>e.sheet));
    const input=page.locator('#vsearchInput'),url=page.url();
    const before=await page.locator('#appShell').evaluate(e=>e.getBoundingClientRect().width);
    await input.click();await input.fill('ni hao');
    await page.locator('[data-vsearch-result="0"]').waitFor();
    if(width<950){
     await geometry(page,'#vsearchMobileScreen',width,850);
     assert(Number.parseFloat(await input.evaluate(e=>getComputedStyle(e).fontSize))>=16);
    }else assert.equal(await page.locator('#vsearchMobileScreen').count(),0,'desktop keeps inline search');
    await page.screenshot({path:`${out}/${engine}-${width}-full-app-search.png`});
    await page.locator('[data-vsearch-result="0"]').click();
    await page.locator('#vsearchTitle').waitFor();
    await geometry(page,'.vsearch-detail',width,850);
    await page.locator('[data-vsearch-close]').click();
    await page.locator('#vsearchDetail').waitFor({state:'detached'});
    if(width<950){await page.goBack();await page.locator('#vsearchMobileScreen').waitFor({state:'detached'})}
    assert.equal(page.url(),url,'search preserves underlying route');
    assert.equal(await page.evaluate(()=>window.VDuckieScreenRouter.current()),'home');
    assert.equal(await page.locator('#appShell').evaluate(e=>e.getBoundingClientRect().width),before,'home layout is restored');
    assert.equal(await page.locator('.top #vsearchInput').count(),1);
    report.push({engine,width,fullApp:'pass'});await context.close();
   }
  }finally{await browser.close()}
 }
 console.log('PASS: mobile search in Chromium and WebKit, IME, visible viewport, history, scroll, async cancellation and full app/desktop');
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await new Promise(done=>server.close(done))}
