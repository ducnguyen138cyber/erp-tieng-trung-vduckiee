import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const css=fs.readFileSync('assets/layout/wide-three-column-v1.css','utf8');
const entry=fs.readFileSync('index.html','utf8');
test('desktop layout expands and retains three columns',()=>{assert.match(css,/min-width:1200px/);assert.match(css,/grid-template-columns:clamp\(218px,15vw,272px\) minmax\(0,1fr\) clamp\(260px,20vw,350px\)/);assert.match(css,/\.v865-home-sidebar/);assert.match(css,/grid-column:2 \/ 4/);});
test('wide styles are loaded from the shell',()=>{assert.match(entry,/wide-three-column-v1\.css\?v=1\.0/);});
