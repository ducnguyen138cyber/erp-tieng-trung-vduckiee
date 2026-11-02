import { chromium } from 'playwright';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<!doctype html><html><head></head><body><header class="top"><div class="brand">VDuckie</div><div class="top-actions">Tài khoản</div></header></body></html>');
  await page.evaluate(()=>{
    window.HSK_DICTIONARY_TERMS=[
      {hanzi:'努力',pinyin:'nǔ lì',meanings:['cố gắng','nỗ lực'],levels:['3']},
      {hanzi:'学习',pinyin:'xué xí',meanings:['học tập'],levels:['1']},
      {hanzi:'你好',pinyin:'nǐ hǎo',meanings:['xin chào'],levels:['1']}
    ];
    window.HanziWriter={create(el,character,options){el.setAttribute('data-real-character',character);options.onLoadCharDataSuccess({strokes:[1,2]});return {animateCharacter(){},quiz(){},highlightStroke(){},pauseAnimation(){},resumeAnimation(){}}}};
  });
  await page.addStyleTag({path:resolve('assets/search/header-chinese-search.css')});
  await page.addStyleTag({path:resolve('assets/search/dictionary-extras.css')});
  await page.addScriptTag({path:resolve('assets/search/header-chinese-search.js')});
  await page.addScriptTag({path:resolve('assets/search/dictionary-extras.js')});
  const input=page.locator('#vsearchInput');
  for(const query of ['cố gắng','co gang','努力','nu li','nǔ lì','nu3 li4']){
   await input.fill(query);await page.waitForTimeout(160);
   assert.equal((await page.locator('[data-vsearch-result="0"] b').textContent()).trim(),'努力',query);
  }
  await page.locator('[data-vsearch-result="0"]').click();
  await page.locator('#vsearchTitle').waitFor();
  assert.equal((await page.locator('#vsearchStrokeCanvas').getAttribute('data-real-character')),'努');
  await page.locator('[data-vsearch-next]').click();
  assert.equal((await page.locator('#vsearchStrokeCanvas').getAttribute('data-real-character')),'力');
  await page.locator('[data-vsearch-save]').click();
  assert.match(await page.locator('#vsearchSaveStatus').textContent(),/Đăng nhập Google/);
  await page.locator('[data-vsearch-quiz]').click();
  assert.match(await page.locator('#vsearchStrokeStatus').textContent(),/Vẽ các nét/);
  assert.deepEqual(errors,[],'uncaught errors');
  await page.close();
 }
 console.log('PASS: desktop/mobile Chinese–Vietnamese search, detail, stroke controls, unauthenticated save feedback');
}finally{await browser.close()}
