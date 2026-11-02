import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const screen=fs.readFileSync('assets/curriculum/hsk-roadmap-screen.js','utf8');
const router=fs.readFileSync('assets/navigation/screen-router.js','utf8');
const css=fs.readFileSync('assets/curriculum/roadmap-and-chevron.css','utf8');
test('roadmap is independent of Daily Learning panel',()=>{
  new vm.Script(screen);new vm.Script(router);
  assert.match(screen,/getElementById\("hskRoadmapScreen"\)/);
  assert.doesNotMatch(screen,/VDuckieDailyLearning\.show/);
  assert.match(router,/id !== "hskRoadmapScreen"/);
  assert.match(router,/hide\("hskRoadmapScreen"\)/);
});
test('account menu uses trigger width and aligns right',()=>{
  assert.match(css,/width:252px!important/);
  assert.match(css,/right:0!important;left:auto!important/);
});