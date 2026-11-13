import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const records=(level,file)=>JSON.parse(read(`data/hsk/hsk${level}/${file}.json`)).records;
async function learner(level,fixture=false,direct=false){
 const dom=new JSDOM('<div id="hsk"><div id="hskLesson"></div><div id="hskLevels"></div><div id="hskLessonList"></div><div id="hskJourney"><div id="hskProgress"></div></div></div>',{url:`https://example.test/?hskLevel=${level}`,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};
 w.fetch=async p=>{const data=JSON.parse(read(String(p).replace(/^\.\//,'')));if(fixture&&String(p).endsWith('exercises.json'))for(const e of data.records){if(e.id.startsWith(`hsk${level}-lesson-01-`)&&typeof e.answer==='string'){e.reviewStatus='approved';e.reviewEvidence={status:'approved',independent:true,reviewerId:'test-fixture-reviewer',approverId:'test-fixture-approver',reviewedAt:'2026-11-13',reference:'https://example.test/fixture-only',contentVersion:e.contentVersion};}}return{ok:true,json:async()=>data};};
 for(const p of ['hsk-study-journey-v1.js','hsk-study-flow-v1.js','hsk-professional-runtime.js'])w.eval(read('assets/hsk-content/'+p));
 if(direct)await w.VDuckieHskProfessionalRuntime.selectLevel(level,false);else await w.VDuckieHskProfessionalRuntime.mount(true);
 return {dom,w,doc:w.document,j:w.VDuckieHskStudyJourney,click:s=>w.document.querySelector(s).click()};
}
test('inventory: all 28 HSK2 and 36 HSK3 lessons lack independent review evidence; no metadata promotion',()=>{
 for(const [level,count] of [[2,28],[3,36]]){
  const es=records(level,'exercises'),idx=Object.fromEntries(es.map(e=>[e.id,e]));
  const affected=records(level,'lessons').filter(l=>!l.practiceRefs.some(id=>['verified','linguistic-reviewed','approved'].includes(idx[id].reviewStatus)));
  assert.equal(affected.length,count);assert.ok(es.every(e=>e.reviewStatus==='unreviewed'));
  const report=JSON.parse(read('reports/hsk23-assessment-quality.json'));assert.equal(report.levels[`hsk${level}`].affectedAfter,affected.length);assert.equal(report.levels[`hsk${level}`].eligibleLessonsAfter,0);
  const runtime=createRequire(import.meta.url)('../assets/hsk-content/hsk-professional-runtime.js');if(level===2)assert.equal(es.filter(e=>Array.isArray(e.answer)&&runtime.canGradeExercise(e)).length,9);
  const ed=JSON.parse(read(`data/hsk/hsk${level}/editorial-c${level+1}.json`));
  assert.equal(ed.editorialSampling.humanSignoffRequired,true);
 }
});
test('HSK2 matching presents all patterns, rejects incomplete answers, grades order-independently and records weak words once',async()=>{
 const r=await learner(2);try{
  const id='hsk2-lesson-01-exercise-4',article=r.doc.querySelector(`[data-pro-exercise="${id}"]`),selects=article.querySelectorAll('select');
  assert.equal(selects.length,3);r.click(`[data-pro-check="${id}"]`);assert.equal(r.j.stats('hsk2-lesson-01',6,[]).checked,0);
  const choices=['啊','不好意思','不错'];selects.forEach((s,i)=>s.value=choices[i]);r.click(`[data-pro-check="${id}"]`);
  assert.equal(r.j.lesson('hsk2-lesson-01').answers[id].correct,false);
  assert.ok(r.j.weakWords(2).some(w=>w.hanzi==='啊'));const attempts=r.j.wordStats().attempts;
  r.click(`[data-pro-check="${id}"]`);assert.equal(r.j.wordStats().attempts,attempts);
  ['不错','不好意思','啊'].forEach((v,i)=>selects[i].value=v);r.click(`[data-pro-check="${id}"]`);
  assert.equal(r.j.lesson('hsk2-lesson-01').answers[id].correct,true);
  assert.match(r.doc.querySelector('[data-hsk-progress-host]').textContent,/Chưa đủ dữ liệu/);
  assert.equal(r.j.stats('hsk2-lesson-01',6,[]).mastered,false);
  r.click('[data-hsk-review-open]');assert.match(r.doc.querySelector('[data-hsk-review-drawer]').textContent,/cần ôn/);
 }finally{r.dom.window.close();}
});
test('HSK2 accepts transcript-supported alias and shows cloze/context without exposing HSK3 after-answer transcripts',async()=>{
 const r=await learner(2);try{
  r.doc.querySelector('[data-pro-input-for="hsk2-lesson-01-exercise-1"]').value='李老师';r.click('[data-pro-check="hsk2-lesson-01-exercise-1"]');
  assert.equal(r.j.lesson('hsk2-lesson-01').answers['hsk2-lesson-01-exercise-1'].correct,true);
  r.w.VDuckieHskProfessionalRuntime.selectLesson('hsk2-lesson-28',false);
  assert.match(r.doc.querySelector('[data-pro-exercise="hsk2-lesson-28-exercise-1"]').textContent,/我去____两次广州/);
  await r.w.VDuckieHskProfessionalRuntime.selectLevel(3,false);
  const a=r.doc.querySelector('[data-pro-exercise="hsk3-lesson-01-exercise-3"]');assert.equal(a.querySelector('[data-pro-transcript]').hidden,true);
  a.querySelector('input,textarea').value='không biết';r.click('[data-pro-check="hsk3-lesson-01-exercise-3"]');assert.equal(a.querySelector('[data-pro-transcript]').hidden,false);
 }finally{r.dom.window.close();}
});
test('bounded HSK3 open-task corrections require self-review, never exact-match a single exemplar or append percent to prose',async()=>{
 const r=await learner(3);try{
  const id='hsk3-lesson-01-exercise-2',a=r.doc.querySelector(`[data-pro-exercise="${id}"]`);
  assert.ok(a.querySelector('textarea'));a.querySelector('textarea').value='我把书放在桌子上了。';r.click(`[data-pro-check="${id}"]`);
  assert.equal(r.j.lesson('hsk3-lesson-01').answers[id].correct,null);
  assert.match(a.textContent,/chờ kiểm duyệt/);assert.doesNotMatch(a.textContent,/nhiệm vụ\.%/);
  const v='hsk3-lesson-01-exercise-1';r.doc.querySelector(`[data-pro-input-for="${v}"]`).value='不认识';r.click(`[data-pro-check="${v}"]`);
  assert.ok(r.j.weakWords(3).some(w=>w.hanzi==='阿姨'));
 }finally{r.dom.window.close();}
});
test('isolated synthetic review-evidence fixture proves mastery gate and retry without duplicate completion events; live content stays unreviewed',async()=>{
 const r=await learner(2,true);try{
  const id='hsk2-lesson-01',es=records(2,'exercises').filter(e=>e.id.startsWith(id+'-'));
  let completions=0;r.doc.addEventListener('vduckie:hsk-learner-completed',()=>completions++);
  for(const stage of ['words','examples','extra'])r.click(`[data-hsk-content-done="${stage}"]`);
  for(const e of es){const a=r.doc.querySelector(`[data-pro-exercise="${e.id}"]`);if(Array.isArray(e.answer)){['不错','不好意思','啊'].forEach((v,i)=>a.querySelectorAll('select')[i].value=v);}else a.querySelector('input,textarea').value=typeof e.answer==='string'?e.answer:'Nội dung tự luyện.';r.click(`[data-pro-check="${e.id}"]`);}
  r.click('[data-hsk-finish]');assert.equal(completions,1);assert.match(r.doc.querySelector('[data-hsk-finish-panel]').textContent,/Đã nắm vững/);
  r.click('[data-hsk-retry]');r.doc.querySelector(`[data-pro-input-for="${es[0].id}"]`).value='sai';r.click(`[data-pro-check="${es[0].id}"]`);
  assert.equal(completions,1);assert.doesNotMatch(r.doc.querySelector('[data-hsk-finish-panel]').textContent,/✓ Đã nắm vững/);
 }finally{r.dom.window.close();}
});

test('direct Học tiếp entry binds exercise controls before boot mount, including after retry',async()=>{
 const r=await learner(3,false,true);try{
  const id='hsk3-lesson-01-exercise-1';
  r.j.recordAnswer(3,'hsk3-lesson-01',id,false,false);
  r.j.position(3,'hsk3-lesson-01',{stage:'practice',exerciseId:'hsk3-lesson-01-exercise-7'});
  r.click('[data-hsk-retry]');assert.equal(r.j.lesson('hsk3-lesson-01').position.exerciseId,id);r.doc.querySelector(`[data-pro-input-for="${id}"]`).value='阿姨';r.click(`[data-pro-check="${id}"]`);
  assert.equal(r.j.lesson('hsk3-lesson-01').answers[id].correct,true);
  assert.match(r.doc.querySelector(`[data-pro-feedback="${id}"]`).textContent,/Đúng/);
  assert.match(r.doc.querySelector(`[data-pro-exercise="${id}"] .hsk-study-answer-status`).textContent,/đúng/);
 }finally{r.dom.window.close();}
});
