'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const {audit,norm}=require('../scripts/audit-hsk123-reliability.cjs');
const {digest,independent,validateReviewEvents}=require('../scripts/hsk123-review-policy.cjs');
const read=f=>JSON.parse(fs.readFileSync(f));
const root=process.cwd(),baseline=read('reports/hsk123/baseline.json');
const runtime=require('../assets/hsk-content/hsk-professional-runtime.js');
const records=[];for(let n=1;n<=3;n++)for(const name of ['exercises','grammar','lessons'])records.push(...read(`data/hsk/hsk${n}/${name}.json`).records);
test('corpus inventory and IDs are preserved; no unsupported review labels or confirmed audit failures remain',()=>{
 const r=audit(root);assert.deepEqual(r.levels.map(l=>l.records),[1439,509,958]);assert.deepEqual(r.items.map(x=>x.id),baseline.items.map(x=>x.id));
 assert.deepEqual(r.confirmedBySeverity,{Critical:0,High:0,Medium:0,Low:0});assert.ok(r.levels.every(l=>l.independentlyReviewed===0));
});
test('every repaired field has before/after, stable ID, version increment and non-human authorship',()=>{
 const changes=read('docs/hsk123-content-changes.json').changes;assert.equal(changes.length,2176);assert.equal(new Set(changes.map(x=>x.id)).size,changes.length);
 for(const c of changes){assert.ok(c.reason&&c.references.length);assert.equal(c.independentHumanReview,false);assert.equal(c.fields.contentVersion.after,c.fields.contentVersion.before+1);const d=read(c.file),r=(d.records||d.entries).find(r=>r.id===c.id);assert.ok(r,c.id);for(const [field,v] of Object.entries(c.fields))assert.deepEqual(r[field],v.after,c.id+' '+field);}
});
test('all 474 numbered-Pinyin repairs preserve the authored Hanzi, tone-mark Pinyin and Vietnamese meaning',()=>{
 const fixes=read('docs/hsk123-content-changes.json').changes.filter(x=>x.fields.pinyinNumber&&/^hsk[23]-v-/.test(x.id));assert.equal(fixes.length,474);
 for(const c of fixes){assert.ok(!c.fields.pinyinTone&&!c.fields.simplified&&!c.fields.meaningVi);assert.match(c.fields.pinyinNumber.after,/^[a-zv]+[1-5]( [a-zv]+[1-5])*$/);}
 assert.equal(read('data/hsk/hsk2/vocabulary/hsk2-v-0101-0150.json').records[0].pinyinNumber,'men2 kou3');
});
test('21 unrelated HSK3 keys cannot grade either the old wrong key or a valid free response as wrong',()=>{
 const byId=new Map(records.map(x=>[x.id,x]));for(const f of read('docs/hsk123-confirmed-findings.json').findings.filter(f=>!f.discoveredAfterBaseline)){const r=byId.get(f.id);assert.equal(typeof r.answer,'object');assert.ok(r.answer.rubric.meaning);assert.equal(runtime.canGradeExercise(r),false);assert.notEqual(r.stimulus?.sourceZh,f.beforeSource);assert.ok(r.stimulus.meaningVi);}
});
test('inference/production use rubric; dictation and finite choices retain explicit answer checks',()=>{
 for(const r of records.filter(x=>x.recordType==='exercise')){
  if(['vocabulary-sentence','usage-explanation','controlled-translation','reading-explanation'].includes(r.format))assert.equal(runtime.canGradeExercise(r),false,r.id);
  if(['listen-dictation','listen-final-line'].includes(r.format)){assert.equal(runtime.canGradeExercise(r),true,r.id);assert.ok(norm(r.stimulus.scriptZh).includes(norm(r.answer)),r.id);}
  if(r.options.length)assert.ok(r.options.includes(r.answer),r.id);
 }
});
test('legacy labels, machine state, stale versions and incomplete approvals never establish independent review',()=>{
 const r={id:'q',hskLevel:1,answer:'好',contentVersion:2};
 for(const reviewStatus of ['linguistic-reviewed','verified','machine-checked','approved'])assert.equal(runtime.independentReview({...r,reviewStatus}),false);
 const e={status:'human-reviewed',independent:true,reviewerId:'teacher-example',reviewedAt:'2026-11-13',reference:'https://example.test/review/1',contentVersion:2};
 assert.equal(runtime.independentReview({...r,reviewEvidence:e}),true);
 for(const bad of [{contentVersion:1},{reviewerId:''},{reviewedAt:'invalid'},{status:'machine-checked'},{independent:false},{status:'approved',approverId:'teacher-example'}]){const x={...r,reviewEvidence:{...e,...bad}};assert.equal(runtime.independentReview(x),false);assert.equal(independent(x),false);}
 const event={...e,id:r.id,state:'human-reviewed',recordSha256:digest(r)};assert.ok(validateReviewEvents([event],[r]).some(x=>x.rule==='review-transition'));
 const machine={id:r.id,state:'machine-checked',contentVersion:2,recordSha256:digest(r),checks:[{name:'schema',result:'pass'}]};
 assert.deepEqual(validateReviewEvents([machine,event],[r]),[]);assert.ok(validateReviewEvents([machine,{...event,contentVersion:1}],[r]).some(x=>x.rule==='stale-review'));
});
async function domCourse(level){const dom=new JSDOM('<div id="hskLevels"></div><div id="hskLessonList"></div><div id="hskLesson"></div><div id="hskProgress"></div><div id="hskJourney"></div>',{url:'https://example.test/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};w.fetch=async url=>({ok:true,json:async()=>read(String(url).replace(/^\.\//,''))});w.eval(fs.readFileSync('assets/hsk-content/hsk-study-journey-v1.js','utf8'));w.eval(fs.readFileSync('assets/hsk-content/hsk-study-flow-v1.js','utf8'));w.eval(fs.readFileSync('assets/hsk-content/hsk-professional-runtime.js','utf8'));await w.VDuckieHskProfessionalRuntime.selectLevel(level,false);return dom;}
test('HSK1–3 listening text is hidden until a non-empty response; rubric never returns Boolean correctness',async()=>{
 for(const level of [1,2,3]){const dom=await domCourse(level);try{const w=dom.window,rows=read(`data/hsk/hsk${level}/exercises.json`).records;const listening=rows.find(x=>x.skill==='listening');w.VDuckieHskProfessionalRuntime.selectLesson(listening.id.split('-exercise')[0],false);let article=w.document.querySelector(`[data-pro-exercise="${listening.id}"]`);assert.ok(article);const transcript=article.querySelector('[data-pro-transcript]');assert.equal(transcript.hidden,true);
 article.querySelector('[data-pro-check]').click();assert.equal(transcript.hidden,true);article.querySelector('input,textarea').value=typeof listening.answer==='string'?listening.answer:'Ý nghe được';article.querySelector('[data-pro-check]').click();assert.equal(transcript.hidden,false);
 const open=rows.find(x=>x.answer?.rubric);w.VDuckieHskProfessionalRuntime.selectLesson(open.id.split('-exercise')[0],false);article=w.document.querySelector(`[data-pro-exercise="${open.id}"]`);article.querySelector('textarea').value='Một cách diễn đạt hợp lệ khác';article.querySelector('[data-pro-check]').click();assert.match(article.querySelector('[data-pro-feedback]').textContent,/Tiêu chí tự đối chiếu/);assert.equal(w.VDuckieHskStudyJourney.lesson(open.id.split('-exercise')[0]).answers[open.id].correct,null);
 }finally{dom.window.close();}}
});
test('historical completion remains stored unchanged while new mastery requires independent evidence',async()=>{
 const dom=await domCourse(1);try{const w=dom.window,j=w.VDuckieHskStudyJourney,k=j.KEY;const old={lessons:{'hsk1-lesson-01':{level:1,completedAt:123,answers:{old:{correct:true}},masteryAnswers:{old:{verified:true,correct:true}}}}};w.localStorage.setItem(k,JSON.stringify(old));w.VDuckieHskProfessionalRuntime.selectLesson('hsk1-lesson-01',false);assert.equal(j.lesson('hsk1-lesson-01').completedAt,123);assert.equal(j.lesson('hsk1-lesson-01').masteryAnswers.old.correct,true);assert.match(w.document.querySelector('#hskLesson').textContent,/Chưa đủ dữ liệu đánh giá/);assert.equal(j.stats('hsk1-lesson-01',[],[]).mastered,false);
 }finally{dom.window.close();}
});
test('12 listening sequence/attitude mismatches now ask the matching source detail and self-review meaning',()=>{
 const byId=new Map(records.map(x=>[x.id,x]));const findings=read('docs/hsk123-confirmed-findings.json').findings.filter(f=>f.rule==='listening-question-skill-mismatch');assert.equal(findings.length,12);
 for(const f of findings){const e=byId.get(f.id),l=byId.get(f.id.split('-exercise')[0]),content=l.sections.find(s=>s.type==='listening').content,qa=content.answerKey.find(q=>q.answer===f.beforeAnswer);assert.equal(e.format,'listen-detail');assert.equal(e.stimulus.questionVi,qa.qVi);assert.match(e.prompt,new RegExp(qa.qVi.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.equal(e.answer.referenceAnswer,f.beforeAnswer);assert.equal(runtime.canGradeExercise(e),false);}
});
test('all 27 confirmed HSK3 unrelated correction keys are removed from automatic grading',()=>{
 const byId=new Map(records.map(x=>[x.id,x]));const findings=read('docs/hsk123-confirmed-findings.json').findings.filter(f=>!f.rule||f.rule==='answer-unrelated-to-source');assert.equal(findings.length,27);
 for(const f of findings){const e=byId.get(f.id);assert.ok(e.answer.rubric);assert.ok(e.stimulus.meaningVi);assert.equal(runtime.canGradeExercise(e),false);}
});
test('semantic reading/listening paraphrases and free corrections are never exact-string graded',()=>{
 for(const e of records.filter(x=>x.recordType==='exercise'&&!x.options.length)){
  if((e.skill==='reading'&&!/chép|tìm cụm/i.test(e.prompt))||(e.skill==='listening'&&!['listen-fill','listen-dictation','listen-final-line'].includes(e.format)&&e.id!=='hsk2-lesson-01-exercise-1')||['error-correction','grammar-error-correction'].includes(e.format))assert.equal(runtime.canGradeExercise(e),false,e.id);
 }
 const byId=new Map(records.map(x=>[x.id,x]));for(const [id,answer] of [['hsk1-lesson-12-exercise-2','下午三点我们见。'],['hsk1-lesson-13-exercise-2','每天八点我上班。'],['hsk2-lesson-10-exercise-3','请把票拿过来，我在这里。'],['hsk2-lesson-26-exercise-3','你往右还是往左？']])assert.ok(byId.get(id).acceptedAnswers.includes(answer),id);
});
test('audit CLI fails on a new Critical key defect even when it writes an updated report',()=>{
 const os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');const temp=fs.mkdtempSync(path.join(os.tmpdir(),'hsk123-blocker-'));
 try{
  fs.mkdirSync(path.join(temp,'data/hsk'),{recursive:true});for(const name of ['hsk1','hsk2','hsk3','schemas'])fs.cpSync(path.join(root,'data/hsk',name),path.join(temp,'data/hsk',name),{recursive:true});fs.copyFileSync(path.join(root,'data/hsk/sources.json'),path.join(temp,'data/hsk/sources.json'));fs.mkdirSync(path.join(temp,'scripts'));fs.copyFileSync(path.join(root,'scripts/hsk123-phonetics.py'),path.join(temp,'scripts/hsk123-phonetics.py'));
  const file=path.join(temp,'data/hsk/hsk1/exercises.json'),d=JSON.parse(fs.readFileSync(file));const e=d.records.find(e=>e.options.length);e.answer='__invalid-key-outside-options__';fs.writeFileSync(file,JSON.stringify(d));
  const result=spawnSync(process.execPath,[path.join(root,'scripts/audit-hsk123-reliability.cjs')],{cwd:temp,encoding:'utf8'});
  assert.equal(result.status,1,result.stderr);const report=JSON.parse(fs.readFileSync(path.join(temp,'reports/hsk123/current.json')));assert.ok(report.confirmedBySeverity.Critical>=1);assert.ok(report.issues.some(i=>i.rule==='answer-outside-options'&&i.id===e.id));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});

test('acceptance: all 36 HSK3 grammar tasks align meaning and structure to their own source example',()=>{
 const byId=new Map(records.map(r=>[r.id,r]));const rows=records.filter(r=>r.recordType==='exercise'&&r.hskLevel===3&&r.id.endsWith('exercise-2'));assert.equal(rows.length,36);
 for(const e of rows){const g=byId.get(e.grammarFocus[0]);assert.ok(g,e.id);const model=g.correctExamples.find(x=>x.zh===e.answer.referenceAnswer);assert.ok(model,e.id+' needs its own grammar model');assert.equal(e.stimulus.meaningVi,model.vi);assert.equal(e.stimulus.targetStructureVi,g.formula);assert.equal(runtime.canGradeExercise(e),false,e.id);}
});
test('acceptance: converted open responses retain an inspectable reference and no mastery assertion',()=>{
 const changes=read('docs/hsk123-content-changes.json').changes,byId=new Map(records.map(r=>[r.id,r]));
 for(const c of changes.filter(c=>typeof c.fields.answer?.before==='string'&&c.fields.answer?.after?.rubric)){
  const e=byId.get(c.id);assert.ok(e.answer.referenceAnswer||e.answer.answerVi||e.answer.evidenceZh,c.id+' reference missing');assert.equal(runtime.canGradeExercise(e),false);
 }
 for(const e of records.filter(r=>r.recordType==='exercise'&&r.hskLevel===3&&r.format==='usage-explanation'))assert.ok(e.answer.referenceAnswer.length>80,e.id);
});
test('acceptance: every pronunciation warning has an actionable, non-certifying review row',()=>{
 const report=read('reports/hsk123/current.json'),q=read('reports/hsk123/pronunciation-review.json');assert.equal(q.rows.length,430);assert.equal(q.counts['confirmed-error'],1);
 assert.deepEqual(q.rows.filter(r=>!r.confirmedError).map(r=>r.id).sort(),report.issues.filter(i=>!i.confirmed).map(i=>i.id).sort());
 for(const r of q.rows){assert.ok(r.hanzi&&r.pinyin&&r.meaningVi&&r.sourceSentence&&r.reasonVi&&r.references.length,r.id);assert.equal(r.reviewStatus,'unreviewed');if(r.confirmedError)assert.equal(r.status,'fixed');for(const c of r.comparisons)assert.match(c.character,/[\u3400-\u9fff]/);}
});
test('context regression: adverb 只剩 uses zhi3, animal classifier 只 retains zhi1',()=>{
 const sentences=read('data/hsk/hsk1/sentences/hsk1-s-0801-0900.json').records;
 const r=sentences.find(r=>r.id==='hsk1-s-0858');assert.equal(r.chinese,'这杯水只剩一半。');assert.equal(r.pinyinTone,'zhè bēi shuǐ zhǐ shèng yí bàn');assert.match(r.pinyinNumber,/zhi3 sheng4/);
 const classifier=read('data/hsk/hsk1/vocabulary/hsk1-v-0251-0300.json').records.find(r=>r.id==='hsk1-v-0287');assert.equal(classifier.pinyinTone,'zhī');
});
