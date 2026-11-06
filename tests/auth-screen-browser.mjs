// Isolated auth UI browser regression: no production logins or real Supabase writes.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server = createServer(async (req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const filename = path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if (!filename.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  try {res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});res.end(await readFile(filename));}
  catch {res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base = 'http://127.0.0.1:'+server.address().port+'/';
const browser = await chromium.launch({headless:true});

const sdk = `(() => {
 const data={calls:[],session:null,listener:null};
 window.__authFixture=data;
 function query(){return new Proxy({}, {get(_o,key){if(key==='then')return (resolve)=>Promise.resolve({data:[],error:null}).then(resolve);return ()=>query()}})}
 window.supabase={createClient:()=>({
   auth:{
     getSession:async()=>({data:{session:data.session},error:null}),
     onAuthStateChange:(fn)=>{data.listener=fn;return {data:{subscription:{unsubscribe(){}}}}},
     signInWithOAuth:async(options)=>{data.calls.push(['google',options]);return {data:{},error:null}},
     signInWithPassword:async(options)=>{data.calls.push(['login',options]);return {data:{session:{user:{id:'mock-user',email:options.email,user_metadata:{}}}},error:null}},
     signUp:async(options)=>{data.calls.push(['register',options]);return {data:{user:{id:'mock-new'},session:null},error:null}},
     resetPasswordForEmail:async(email,options)=>{data.calls.push(['reset',email,options]);return {data:{},error:null}},
     updateUser:async(options)=>{data.calls.push(['update',options]);return {data:{user:{}},error:null}},
     signOut:async()=>({error:null})
   },
   from:()=>query(),
   rpc:async()=>({data:[],error:null})
 })};
})();`;

try {
  for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
    const ctx=await browser.newContext({viewport,serviceWorkers:'block'});
    const page=await ctx.newPage();
    page.setDefaultTimeout(18000);
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',route=>route.fulfill({contentType:'text/javascript',body:sdk}));
    await page.route('https://*.supabase.co/**',route=>route.abort());
    await page.goto(base);
    await page.locator('#cloudLogin').waitFor({state:'visible'});
    await page.locator('#cloudLogin').click();
    const auth=page.locator('#vduckieAuthScreen');
    await auth.waitFor({state:'visible'});
    assert.equal(await auth.locator('h1').textContent(),'Đăng nhập vào VDuckie');
    const isMobile=viewport.width<850;
    assert.equal(await page.locator('.vda-hero').isVisible(),!isMobile);
    assert.equal(await page.locator('.vda-mobile-tabs').isVisible(),isMobile);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'horizontal overflow');

    await page.locator('#vdaSwitch').click();
    assert.equal(await auth.locator('h1').textContent(),'Tạo tài khoản VDuckie');
    await auth.locator('#vdaName').fill('Minh Anh');
    await auth.locator('#vdaEmail').fill('test@example.com');
    await auth.locator('#vdaPassword').fill('password123');
    await auth.locator('#vdaSubmit').click();
    await auth.locator('#vdaMessage').getByText('Hãy xác nhận điều khoản trước khi tạo tài khoản.').waitFor();
    await auth.locator('#vdaTerms').check();
    await auth.locator('#vdaSubmit').click();
    await auth.locator('#vdaMessage[data-type="success"]').waitFor();
    assert.equal(await page.evaluate(()=>window.__authFixture.calls.filter(x=>x[0]==='register').length),1);

    await auth.locator('#vdaSwitch').click();
    await auth.locator('#vdaEmail').fill('test@example.com');
    await auth.locator('#vdaPassword').fill('password123');
    await auth.locator('#vdaSubmit').click();
    await auth.waitFor({state:'hidden'});
    assert.equal(await page.evaluate(()=>window.__authFixture.calls.filter(x=>x[0]==='login').length),1);

    await page.locator('#cloudLogin').click();
    await auth.locator('#vdaForgot').click();
    await auth.locator('#vdaEmail').fill('test@example.com');
    await auth.locator('#vdaSubmit').click();
    await auth.locator('#vdaMessage[data-type="success"]').waitFor();
    assert.equal(await page.evaluate(()=>window.__authFixture.calls.filter(x=>x[0]==='reset').length),1);
    await page.evaluate(()=>document.dispatchEvent(new CustomEvent('vduckie:auth-state',{detail:{event:'PASSWORD_RECOVERY',signedIn:true}})));
    await auth.locator('#vdaPassword').fill('newpassword123');
    await auth.locator('#vdaSubmit').click();
    await auth.locator('#vdaMessage[data-type="success"]').waitFor();
    assert.equal(await page.evaluate(()=>window.__authFixture.calls.filter(x=>x[0]==='update').length),1);
    await page.waitForTimeout(1300);
    await auth.waitFor({state:'hidden'});
    await ctx.close();
    console.log('AUTH UI PASS',viewport.width+'x'+viewport.height);
  }
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
