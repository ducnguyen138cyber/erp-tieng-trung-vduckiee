import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'};
const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const filename=path.resolve(root,'.'+pathname);
  if(!filename.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});res.end(await readFile(filename));}
  catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});
await mkdir(path.join(root,'artifacts','shadowing'),{recursive:true});
try{
  for(const [device,viewport] of [['desktop',{width:1365,height:900}],['mobile',{width:390,height:844}]]){
    const context=await browser.newContext({viewport,serviceWorkers:'block'});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/offline.html');
    await page.setContent('<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body data-current-area="msutong" style="margin:0;font-family:Arial, sans-serif;background:#f8fafc"><main id="dailyLearningPanel"></main></body></html>');
    await page.addStyleTag({path:path.join(root,'assets/hsk-content/hsk-shadowing-v1.css')});
    await page.addInitScript(()=>{window.VDuckieGradedHSK={open(){window.__back=true}}});
    await page.addScriptTag({path:path.join(root,'assets/hsk-content/hsk-shadowing-v1.js')});
    await page.evaluate(()=>window.VDuckieShadowing.open(1));
    await page.locator('.shadow-hanzi').waitFor();
    assert.match(await page.locator('.shadow-hanzi').innerText(),/[一-龥]/);
    assert.ok((await page.locator('.shadow-pinyin').innerText()).length>0);
    assert.ok((await page.locator('.shadow-meaning').innerText()).length>0);
    await page.screenshot({path:path.join(root,'artifacts','shadowing',device+'-hsk1.png'),fullPage:true});
    await page.locator('[data-shadow-pinyin]').click();
    assert.equal(await page.locator('.shadow-pinyin').count(),0);
    await page.locator('[data-shadow-pinyin]').click();
    await page.locator('[data-shadow-next]').click();
    assert.match(await page.locator('.shadow-counter').innerText(),/2 \/ 40/);
    await page.locator('[data-shadow-level="2"]').click();
    await page.locator('.shadow-hanzi').waitFor();
    assert.ok((await page.locator('.shadow-pinyin').innerText()).length>0);
    await page.screenshot({path:path.join(root,'artifacts','shadowing',device+'-hsk2.png'),fullPage:true});
    await page.locator('[data-shadow-level="3"]').click();
    await page.locator('.shadow-hanzi').waitFor();
    await page.screenshot({path:path.join(root,'artifacts','shadowing',device+'-hsk3.png'),fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('SHADOWING_BROWSER_PASS',device);
    await context.close();
  }
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
