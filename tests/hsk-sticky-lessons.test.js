import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const css=fs.readFileSync('assets/hsk-content/hsk-professional-runtime.css','utf8');
const flags=fs.readFileSync('assets/hsk-content/hsk-content-feature-flags.js','utf8');
test('lesson navigation stays on screen and does not cover content',()=>{assert.match(css,/body\[data-hsk-prof-ready="true"\] #hsk \.hsk-pro-bottom-nav\{[\s\S]*?position:fixed!important/);assert.match(css,/#hskLesson\{padding-bottom:100px!important\}/);assert.match(css,/safe-area-inset-bottom/);assert.match(flags,/hsk-professional-runtime\.css\?v=focus3/);});
