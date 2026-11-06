import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const js=fs.readFileSync('assets/v89/hsk-roadmap-v89.4.js','utf8');
const css=fs.readFileSync('assets/v89/hsk-full-card-flip-v1.css','utf8');
const index=fs.readFileSync('index.html','utf8');
test('whole HSK card flips, with a back-face learning CTA',()=>{
 new vm.Script(js);
 assert.match(js,/hsk-full-flip-inner/);
 assert.match(js,/hsk-full-flip-front/);
 assert.match(js,/hsk-full-flip-back/);
 assert.match(js,/Tiếp tục học/);
 assert.match(js,/Học ngay/);
 assert.match(js,/root.addEventListener\("click", handleCardFlip, true\)/);
 assert.match(css,/rotateY\(180deg\)/);
 assert.match(index,/hsk-full-card-flip-v1\.css/);
 assert.match(index,/hsk-roadmap-v89\.4\.js\?v=[\w.-]+/);
});
