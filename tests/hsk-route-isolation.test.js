import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const router=fs.readFileSync('assets/navigation/screen-router.js','utf8');
const css=fs.readFileSync('assets/hsk-content/hsk-professional-runtime.css','utf8');
test('HSK cannot appear on Home or any other main screen',()=>{
 new vm.Script(router);
 assert.match(router,/var hskScreen = screen === "hsk" \|\| screen === "hsk-study"/);
 assert.match(router,/if \(node && !hskScreen\) node\.classList\.add\("hidden"\)/);
 assert.match(css,/body:not\(\[data-current-area="hsk"\]\):not\(\[data-current-area="hsk-study"\]\) #hsk/);
 assert.match(css,/display:none!important/);
});