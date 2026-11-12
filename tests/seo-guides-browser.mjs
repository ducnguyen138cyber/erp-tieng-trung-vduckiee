import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd(),out='artifacts/seo-guides';
const guides=['hoc-tieng-trung-hsk','luyen-go-pinyin','luyen-nghe-shadowing'];
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.xml':'application/xml','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 try{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain'}).end(await readFile(file));}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch();
await mkdir(out,{recursive:true});
try{
 for(const width of [1920,390,320]){
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width,height:950}}),page=await context.newPage();
  for(const slug of guides){
   assert.equal((await page.goto(base+slug+'/')).status(),200);
   await page.locator('h1').waitFor();
   assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://vduckie.pages.dev/'+slug+'/');
   assert.equal(await page.locator('article h2').count()>=5,true,'substantive guide content without JS');
   assert.equal(await page.locator('time[datetime="2026-11-12"]').isVisible(),true);
   assert.equal(await page.locator('script[src]').count(),0);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<2,'mobile page overflow');
   const destination=await page.locator('.actions a').first().getAttribute('href');
   assert(new URL(destination,page.url()).searchParams.has('screen'));
   await page.screenshot({path:`${out}/${width}-${slug}.png`});
  }
  await page.goto(base);
  assert.equal(await page.locator('main nav a').count(),3,'initial HTML must expose guide links without JS');
  await context.close();
 }
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 await page.route('**/app-shell-v88.html?*',route=>route.fulfill({status:503,body:'temporarily unavailable'}));
 await page.goto(base);
 await page.getByText(/Không mở được khu học tương tác/).waitFor();
 assert.equal(await page.locator('h1').count(),1,'app fetch failure must preserve the static introduction');
 assert.equal(await page.locator('main nav a').count(),3);
 await page.getByRole('link',{name:'Hướng dẫn luyện nghe và Shadowing',exact:true}).click();
 await page.locator('h1').waitFor();
 assert.equal(new URL(page.url()).pathname,'/luyen-nghe-shadowing/');
 // The sample link must carry an existing line ID, group and level into the app.
 const sample=await page.getByRole('link',{name:/Mở đúng câu này/}).getAttribute('href');
 const link=new URL(sample,page.url());
 assert.equal(link.searchParams.get('screen'),'shadowing');
 assert.equal(link.searchParams.get('shadowLine'),'shadow-hsk2-001');
 await context.close();
 console.log('Static guides work with JavaScript disabled at 1920/390/320 px; failed app bootstrap retains discovery links.');
}finally{await browser.close();server.close();}
