import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const css=fs.readFileSync('assets/design-system/blue-edtech-v1.css','utf8');
const index=fs.readFileSync('index.html','utf8');
test('theme v2 explicitly covers home, review, HSK, ranking and chat',()=>{for(const selector of ['.v865-streak-card','.v865-road-stage','.exp-podium-card','.daily-panel','.duckie-chat-panel','.home-course-card','.v90-weekly-card'])assert.ok(css.includes(selector),selector);assert.match(index,/blue-edtech-v1\.css\?v=2-clean-theme/);});
test('blue theme neutral backgrounds and accessible contrast tokens',()=>{for(const color of ['#F8FAFC','#FFFFFF','#2563EB','#0F172A','#64748B','#E2E8F0'])assert.ok(css.includes(color));assert.match(css,/\.v865-streak-card/);});
