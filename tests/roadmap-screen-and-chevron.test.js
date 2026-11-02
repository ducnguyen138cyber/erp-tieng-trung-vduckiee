import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const router=fs.readFileSync('assets/navigation/screen-router.js','utf8');
const screen=fs.readFileSync('assets/curriculum/hsk-roadmap-screen.js','utf8');
const css=fs.readFileSync('assets/curriculum/roadmap-and-chevron.css','utf8');
test('roadmap is independent, and HSK selection opens lesson screen',()=>{new vm.Script(router);new vm.Script(screen);assert.match(router,/data-v865-action="open-hsk"/);assert.match(router,/screen === "roadmap"/);assert.match(screen,/i<=9/);assert.match(screen,/navigate\('hsk-study'\)/);assert.match(screen,/selectLevel\(level,false\)/);});
test('compact roadmap cards and boxed arrow are styled',()=>{assert.match(css,/grid-auto-columns:126px/);assert.match(css,/\.v91-account-chevron::after/);assert.match(css,/\.hsk-map-grid/);});