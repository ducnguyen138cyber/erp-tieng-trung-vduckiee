'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),sandbox={};sandbox.globalThis=sandbox;
for(const p of ['assets/msutong-hsk1-v2.js','assets/curriculum/content-v1.js','assets/curriculum/progress-v1.js'])vm.runInNewContext(fs.readFileSync(path.join(root,p),'utf8'),sandbox);
const D=sandbox.VDuckieCurriculumContent,P=sandbox.VDuckieCurriculumProgress;
test('20 original lessons, stable legacy IDs, complete content and no empty books',()=>{
 assert.equal(D.lessons.length,20);assert.equal(new Set(D.lessons.map(l=>l.id)).size,20);
 for(let i=1;i<=10;i++)assert.ok(D.lessons.find(l=>l.id==='b1-u'+i));
 for(const b of D.books)assert.equal(D.lessons.filter(l=>l.book===b.id).length,10);
 for(const l of D.lessons){assert.ok(D.chapters.find(c=>c.id===l.chapter&&c.book===l.book));assert.ok(l.dialogue.length>=5,l.id);assert.equal(l.objectives.length,3);assert.ok(l.phonetics.length>50);assert.ok(l.reading.zh&&l.reading.py&&l.reading.vi);assert.ok(l.grammar.length>=2);assert.ok(l.py.every(p=>p.length>0));assert.ok(l.speak&&l.write&&l.application.zh);const qs=D.exercises(l);assert.equal(qs.length,8);assert.equal(new Set(qs.map(q=>q.id)).size,8);for(const q of qs){assert.ok(q.answer&&q.why,l.id+q.id);if(q.options){assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,q.options.length,l.id+q.id);}if(q.type==='order')assert.equal(P.normalizeAnswer(q.tokens.join('')),P.normalizeAnswer(q.answer));}}
});
test('answering again or navigating back cannot increase score',()=>{
 const m={completed:{},lessons:{}},l=D.lessons[0],q=D.exercises(l)[0];P.answer(m,l.id,q,q.answer,1);P.answer(m,l.id,q,'wrong',2);assert.equal(P.score(m.lessons[l.id],D.exercises(l)),1);assert.equal(m.lessons[l.id].answers[q.id].updatedAt,1);
});
test('cannot complete by skipping sections, leaving questions empty or failing quiz',()=>{
 const l=D.lessons[0],qs=D.exercises(l),m={completed:{},lessons:{}};assert.equal(P.complete(m,l,qs),false);const p=P.entry(m,l.id);P.sections.forEach(s=>p.sections[s]=1);qs.forEach((q,i)=>P.answer(m,l.id,q,i<5?q.answer:'incorrect'));assert.equal(P.complete(m,l,qs),false);assert.equal(Object.keys(m.completed).length,0);
});
test('six of eight answers and six confirmed sections complete exactly once',()=>{
 const l=D.lessons[0],qs=D.exercises(l),m={completed:{},lessons:{}};const p=P.entry(m,l.id);P.sections.forEach(s=>p.sections[s]=1);qs.forEach((q,i)=>P.answer(m,l.id,q,i<6?q.answer:'incorrect'));assert.equal(P.complete(m,l,qs,100),true);assert.equal(P.complete(m,l,qs,200),true);assert.equal(m.completed[l.id].completedAt,100);assert.equal(m.completed[l.id].score,6);
});
test('merge preserves old completions and independent device completions',()=>{
 const a={currentLesson:'b1-u2',updatedAt:10,completed:{'b1-u1':{completedAt:1}},lessons:{'b1-u2':{attempt:5,sections:{overview:5},answers:{a:{updatedAt:5,correct:true}},updatedAt:10}}};
 const b={currentLesson:'b2-u1',updatedAt:20,completed:{'b2-u1':{completedAt:20}},lessons:{'b1-u2':{attempt:5,sections:{vocabulary:8},answers:{b:{updatedAt:8,correct:true}},updatedAt:8}}};
 const m=P.merge(a,b);assert.equal(m.currentLesson,'b2-u1');assert.equal(Object.keys(m.completed).length,2);assert.equal(Object.keys(m.lessons['b1-u2'].sections).length,2);assert.equal(Object.keys(m.lessons['b1-u2'].answers).length,2);assert.equal(Object.keys(a.completed).length,1);
});
test('a new quiz attempt never resurrects old answers from another device',()=>{
 const a={lessons:{x:{attempt:10,answers:{old:{correct:true}},updatedAt:10}}},b={lessons:{x:{attempt:20,answers:{new:{correct:false}},updatedAt:20}}};const m=P.merge(a,b);assert.equal(Object.keys(m.lessons.x.answers).length,1);assert.ok(m.lessons.x.answers.new);assert.equal(m.lessons.x.answers.old,undefined);
});
test('Chinese punctuation and whitespace do not invalidate a correct typed answer',()=>{assert.equal(P.normalizeAnswer(' 我 去过 中国。 '),P.normalizeAnswer('我去过中国'));});
