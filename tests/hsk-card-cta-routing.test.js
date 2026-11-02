import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const card=fs.readFileSync('assets/v89/hsk-roadmap-v89.4.js','utf8');
const route=fs.readFileSync('assets/navigation/screen-router.js','utf8');
const css=fs.readFileSync('assets/layout/hsk-route-cta-fix.css','utf8');
test('HSK card CTA navigates to selected level, not legacy Home section',()=>{new vm.Script(card);new vm.Script(route);assert.match(card,/VDuckieScreenRouter.navigate\("hsk-study"\)/);assert.match(card,/runtime.selectLevel\(level, false\)/);assert.match(card,/stopImmediatePropagation/);assert.match(route,/\["homeHub","homeJourney","erpHero","erpJourney","hskRoadmapScreen"\]\.forEach\(hide\)/);});
test('sync notice and off-screen lesson toolbar cannot leak',()=>{assert.match(css,/\.cloud-auth-copy\{display:none!important\}/);assert.match(css,/body:not\(\[data-current-area="hsk"\]\):not\(\[data-current-area="hsk-study"\]\)/);});
