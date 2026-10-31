import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const js=fs.readFileSync('assets/hsk-content/hsk-professional-runtime.js','utf8');
const css=fs.readFileSync('assets/hsk-content/hsk-professional-runtime.css','utf8');
test('HSK curriculum leaves learner content and navigation but removes internal development notices',()=>{
  new vm.Script(js);
  assert.match(js,/function renderLesson\(/);
  assert.match(js,/function renderSidebar\(/);
  assert.match(js,/function updateIntro\(/);
  assert.match(js,/intro\.hidden = true/);
  assert.doesNotMatch(js,/<span class="hsk-pro-readonly">/);
  assert.doesNotMatch(js,/<div class="hsk-pro-sidebar-status">/);
  assert.match(css,/#hsk \.hsk-intro[\s\S]*display:none!important/);
});
