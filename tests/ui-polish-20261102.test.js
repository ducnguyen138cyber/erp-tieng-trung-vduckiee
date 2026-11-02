import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync('app-shell-v88.html','utf8'),entry=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('assets/layout/ui-polish-20261102.css','utf8');
test('no redundant footer and stylesheet is injected',()=>{assert.doesNotMatch(html,/Developed by VDuckie · Trang học chạy độc lập/);assert.match(entry,/ui-polish-20261102\.css\?v=1/);});
test('menu and roadmap have substantive desktop rules',()=>{assert.match(css,/\.v91-account-dropdown\.is-open/);assert.match(css,/grid-auto-columns:minmax\(150px,166px\)/);assert.match(css,/min-height:160px/);assert.match(css,/font-size:15px/);});
