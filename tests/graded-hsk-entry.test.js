import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const shell=fs.readFileSync('app-shell-v88.html','utf8');
const entry=fs.readFileSync('index.html','utf8');
const catalog=fs.readFileSync('assets/curriculum/graded-hsk-entry.js','utf8');
const router=fs.readFileSync('assets/navigation/screen-router.js','utf8');
test('HSK curriculum is labeled and mounted before the main router',()=>{
 assert.match(shell,/<span>Giáo trình HSK<\/span>/);
 assert.match(catalog,/VDuckieGradedHSK=\{open:open\}/);
 assert.match(router,/screen === "msutong" && root.VDuckieGradedHSK/);
 assert.ok(entry.indexOf('graded-hsk-entry.js')<entry.lastIndexOf('screen-router.js'));
 new vm.Script(catalog);new vm.Script(router);
});
test('HSK 1–4 uses the primary learner and keeps legacy MSUTONG progress separate',()=>{
 assert.match(catalog,/counts=\[24,28,36,48,60,72\],MAX_LEARNER_HSK=4/);
 assert.match(catalog,/runtime.selectLevel\(level,false\)/);
 assert.match(catalog,/previous.completed/);
 assert.match(catalog,/VDuckieHskStudyJourney/);
 assert.match(catalog,/data-graded-continue/);
 assert.match(catalog,/data-graded-review/);
 assert.match(catalog,/data-graded-legacy/);
 assert.doesNotMatch(catalog,/localStorage\.setItem|updateCurriculum|\.saveDailyLearning\(/);
});
