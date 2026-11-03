import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile,mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{const p=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://localhost').pathname)));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();try{res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'}).end(await readFile(p))}catch{res.writeHead(404).end()}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const base='http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch({headless:true});await mkdir('artifacts/blue-edtech',{recursive:true});
try{for(const width of [1920,1366,768,390]){
 const page=await browser.newPage({viewport:{width,height:width===1920?1080:width===1366?768:900},serviceWorkers:'block'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',route=>route.fulfill({contentType:'text/javascript',body:'window.supabase={createClient(){const q=()=>new Proxy({},{get(_o,k){if(k==="then")return ok=>Promise.resolve({data:[],error:null}).then(ok);return ()=>q()}});return {auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:q,rpc:async()=>({data:[],error:null})}}}'}));
 await page.goto(base);await page.locator('.duckie-chat-launch').waitFor({state:'visible'});
 const palette=await page.evaluate(()=>({bg:getComputedStyle(document.body).backgroundColor,main:getComputedStyle(document.documentElement).getPropertyValue('--vd-primary').trim(),mascot:document.querySelector('.home-welcome-mascot')?.getAttribute('src'),horizontal:document.documentElement.scrollWidth-window.innerWidth}));
 assert.equal(palette.main.toLowerCase(),'#2563eb');
 assert.ok(palette.horizontal<15,'horizontal overflow '+width+': '+palette.horizontal);
 await page.locator('.duckie-chat-launch').click();await page.locator('#duckieChat').waitFor({state:'visible'});
 assert.ok((await page.locator('.duckie-chat-mascot').getAttribute('src')).includes('duckie-reader-2d-v2.webp'));
 await page.locator('[data-dc-min]').click();
 assert.deepEqual(errors,[],'page errors '+width);
 await page.screenshot({path:'artifacts/blue-edtech/'+width+'-home.png',fullPage:false});
 await page.close();
}
console.log('PASS: blue tokens, mascot, chat and viewport checks at 1920/1366/768/390');
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
