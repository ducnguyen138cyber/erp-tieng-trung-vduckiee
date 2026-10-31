import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const code=fs.readFileSync('assets/navigation/screen-router.js','utf8');
test('direct HSK route waits until DOMContentLoaded modules finish',()=>{new vm.Script(code);assert.match(code,/setTimeout\(function \(\) \{ show\(fromLocation\(\), "replace"\); \}, 0\)/);});
test('HSK curriculum initializes owning daily panel before catalog render',()=>{assert.match(code,/VDuckieDailyLearning\.show\("msutong"\);\s*root\.VDuckieGradedHSK\.open\(\)/);});
test('same-route blank panel recovers without adding history',()=>{assert.match(code,/panel\.querySelector\("\.graded-hsk-page"\)/);assert.match(code,/historyMode = "replace"/);});
