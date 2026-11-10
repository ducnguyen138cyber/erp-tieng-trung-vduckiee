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
 for(const width of [1440,1280,1024,390,320]){
  const context=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:'window.supabase={createClient(){const q=()=>new Proxy({},{get(o,k){if(k==="then")return ok=>Promise.resolve({data:[],error:null}).then(ok);return()=>q()}});return{auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:q,rpc:async()=>({data:[],error:null})}}}'}));
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
   report.push({width,level,...geometry});
   await page.screenshot({path:`${out}/${width}-hsk${level}.png`});
  }
  assert.deepEqual(errors,[],'uncaught browser errors');
  await context.close();
 }
}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();server.close();}
console.log('PASS: shared HSK1–4 layout at 1440, 1280, 1024, 390 and 320px');
