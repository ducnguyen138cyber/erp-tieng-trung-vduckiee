import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://duckie-ui.test/',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><head></head><body></body></html>'}));
  let calls=0;
  await page.route('https://duckie-ui.test/api/duckie-chat',route=>{
    calls++;
    if(calls===1)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'AI đang bận. Thử lại nhé.'})});
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reply:'**写 (xiě)** — viết\n\n- 写信 (xiě xìn): viết thư\n<script>alert("XSS")</script>'})});
  });
  await page.goto('https://duckie-ui.test/');
  await page.addStyleTag({path:resolve('assets/ai/duckie-chat.css')});
  await page.addScriptTag({path:resolve('assets/ai/duckie-chat.js')});
  await page.locator('.duckie-chat-launch').click();
  await page.locator('.duckie-chat-form textarea').fill('Viết tiếng Trung là gì?');
  await page.locator('.duckie-chat-form button[type=submit]').click();
  await page.getByText('AI đang bận. Thử lại nhé.').waitFor();
  await page.locator('.dc-retry').click();
  await page.locator('.dc-bubble.is-assistant .dc-hanzi').first().waitFor();
  assert.ok((await page.locator('.dc-bubble.is-assistant').innerText()).includes('写'));
  assert.ok((await page.locator('.dc-bubble.is-assistant strong').count())>0);
  assert.ok((await page.locator('.dc-bubble.is-assistant .dc-listen').count())===1);
  assert.equal(await page.locator('script').count(),1,'untrusted script was never added to DOM');
  assert.equal(calls,2);
  assert.deepEqual(errors,[]);
  const box=await page.locator('#duckieChat').boundingBox();
  assert.ok(box&&box.x>=0&&box.x+box.width<=width+2,'chat is visible in viewport');
  await page.close();
 }
 console.log('PASS: Desktop/mobile Duckie Chat rendering, retry, Hanzi/TTS and XSS guard (mocked API)');
}finally{await browser.close()}
