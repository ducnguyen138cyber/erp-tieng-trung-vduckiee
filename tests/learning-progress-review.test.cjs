'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const m=require('../assets/v82/learning-progress-merge-v1.js');
const DAY=86400000;
function store(){let clock=1800000000000;const values=new Map(),ctx={Date:{now:()=>clock},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},document:{dispatchEvent(){}},CustomEvent:function(){}};vm.runInNewContext(fs.readFileSync('assets/v82/learning-progress-merge-v1.js','utf8'),ctx);vm.runInNewContext(fs.readFileSync('assets/hsk-content/hsk-study-journey-v1.js','utf8'),ctx);return {j:ctx.VDuckieHskStudyJourney,values,advance:d=>clock+=d*DAY};}
function database(){
 const rows=new Map();let revision=0,conflicts=0,writes=0;
 const client={from(){let op='select',payload,filters={};const q={select(){return q;},eq(k,v){filters[k]=v;return q;},insert(v){op='insert';payload=v[0];return q;},update(v){op='update';payload=v;return q;},async maybeSingle(){const row=rows.get(filters.user_id+'|'+filters.word_key);await new Promise(setImmediate);return {data:row?structuredClone(row):null,error:null};},then(ok,bad){return Promise.resolve().then(()=>{const key=(payload.user_id||filters.user_id)+'|'+(payload.word_key||filters.word_key),old=rows.get(key);if(op==='insert'&&old){conflicts++;return {data:null,error:{code:'23505'}};}if(op==='update'&&(!old||old.updated_at!==filters.updated_at)){conflicts++;return {data:[],error:null};}writes++;rows.set(key,{...payload,updated_at:String(++revision)});return {data:[{word_key:payload.word_key}],error:null};}).then(ok,bad);}};return q;}};
 return {client,rows,get conflicts(){return conflicts;},get writes(){return writes;}};
}
const row=(value,userId)=>({user_id:userId,word_key:'profile',note:JSON.stringify(value)});
const options=(db,value,userId='alice')=>({client:db.client,userId,key:'profile',value,merge:m.journal,row,current:()=>true});
test('two devices retain disjoint lessons and per-exercise results regardless of profile timestamps',()=>{
 const a={updatedAt:1000,current:{lessonId:'A',updatedAt:1100},lessons:{A:{completedAt:100,position:{stage:'words',updatedAt:900},answers:{q1:{correct:false,at:900}}}},reviews:{}},b={updatedAt:5000,current:{lessonId:'B',updatedAt:700},lessons:{B:{completedAt:200},A:{position:{stage:'practice',updatedAt:600},answers:{q2:{correct:true,at:800}}}},reviews:{}};
 const merged=m.journal(a,b);assert.deepEqual(Object.keys(merged.lessons).sort(),['A','B']);assert.equal(merged.lessons.A.position.stage,'words');assert.equal(merged.current.lessonId,'A');assert.equal(merged.lessons.A.answers.q1.correct,false);assert.equal(merged.lessons.A.answers.q2.correct,true);
 assert.equal(m.stable(merged),m.stable(m.journal(b,a)));assert.equal(m.stable(merged),m.stable(m.journal(merged,merged)));
});
test('a newer explicit retry cannot inherit old successful mastery; old completion remains stored',()=>{
 const a={lessons:{A:{completedAt:111,attemptAt:10,masteryAnswers:{q:{correct:true,at:11,verified:true}}}}},b={lessons:{A:{attemptAt:20,masteryAnswers:{q:{correct:false,at:21,verified:true}}}}};
 const out=m.journal(a,b).lessons.A;assert.equal(out.completedAt,111);assert.equal(out.masteryAnswers.q.correct,false);assert.equal(out.attemptAt,20);
});
test('offline concurrent mistakes have distinct history and are not collapsed or counted twice',()=>{
 const base={hanzi:'努力',level:3,lastAt:10,nextAt:20};const a=m.wordEvent(base,{id:'device-a',at:100,kind:'study',correct:false}),b=m.wordEvent(base,{id:'device-b',at:101,kind:'study',correct:false});
 const out=m.journal({reviews:{word:a}},{reviews:{word:b}}).reviews.word;assert.equal(out.mistakes,2);assert.equal(out.attempts,2);assert.equal(out.weak,true);assert.equal(Object.keys(out.recallEvents).length,2);assert.equal(m.journal({reviews:{word:out}},{reviews:{word:out}}).reviews.word.attempts,2);
});
test('viewing an answer, same-day correct answers and legacy stage never count as remembered',()=>{
 const {j,values}=store();values.set(j.KEY,JSON.stringify({reviews:{'3:努力':{hanzi:'努力',level:3,stage:4,correct:99,nextAt:1}}}));assert.equal(j.wordStats().remembered,0);
 j.recordWord(3,'A','努力',false);j.reviewWord(3,'努力',true,{exposed:true});j.reviewWord(3,'努力',true,{retrieval:true});assert.equal(j.wordStats().remembered,0);assert.equal(j.load().reviews['3:努力'].spacedRecalls,0);
});
test('only independent recall after the due interval advances memory through 1,3,7 day reviews',()=>{
 const {j,advance}=store();j.recordWord(2,'A','学习',true,'xuéxí','học tập');assert.equal(j.wordStats().remembered,0);
 for(const [i,days] of [1,3,7].entries()){
  advance(days);j.reviewWord(2,'学习',true,{retrieval:true});assert.equal(j.load().reviews['2:学习'].spacedRecalls,i+1);assert.equal(j.wordStats().remembered,i===2?1:0);
  j.reviewWord(2,'学习',true,{retrieval:true});assert.equal(j.load().reviews['2:学习'].spacedRecalls,i+1,'repeated same-day recall cannot advance');
 }
 j.recordWord(2,'A','学习',false);assert.equal(j.wordStats().remembered,0);assert.ok(j.due(2).some(w=>w.hanzi==='学习'));
});
test('Shadowing removes saved marks with tombstones while retaining another level and its marks',()=>{
 const a={1:{starred:{x:true},flagChanges:{starred:{x:{value:true,at:1}}}}},b={1:{starred:{x:false},flagChanges:{starred:{x:{value:false,at:2}}}},2:{weak:{y:true}}};
 const out=m.shadow(a,b);assert.equal(out[1].starred.x,false);assert.equal(out[2].weak.y,true);
});
test('practice preserves best/history and merges answers of the same resumed draft without new time',()=>{
 const a={paper:{best:80,attempts:2,legacyAttempts:1,attemptHistory:{one:{at:1}},draft:{sessionId:'draft',deadline:200,updatedAt:10,answers:{a:{value:'你',at:10}}}}},b={paper:{best:50,attempts:2,legacyAttempts:1,attemptHistory:{two:{at:2}},draft:{sessionId:'draft',deadline:300,updatedAt:20,answers:{b:{value:'好',at:20}}}}};
 const out=m.practice(a,b).paper;assert.equal(out.best,80);assert.equal(out.attempts,3);assert.equal(Object.keys(out.attemptHistory).length,2);assert.equal(out.draft.deadline,200);assert.equal(out.draft.answers.a.value,'你');assert.equal(out.draft.answers.b.value,'好');
});
test('Daily preserves independently learned words and completed lessons',()=>{
 const out=m.daily({updatedAt:20,words:{a:{wrong:2,updatedAt:20}},msutong:{completed:{A:1}}},{updatedAt:30,words:{b:{correct:1,updatedAt:30}},msutong:{completed:{B:2}}});assert.ok(out.words.a&&out.words.b);assert.ok(out.msutong.completed.A&&out.msutong.completed.B);
});
test('CAS retries simultaneous first writes and overlapping updates instead of last-writer data loss',async()=>{
 const db=database();await Promise.all([m.persistRow(options(db,{lessons:{A:{completedAt:10}},updatedAt:10})),m.persistRow(options(db,{lessons:{B:{completedAt:20}},updatedAt:20}))]);let out=JSON.parse(db.rows.get('alice|profile').note);assert.ok(out.lessons.A&&out.lessons.B);assert.ok(db.conflicts>=1);
 await Promise.all([m.persistRow(options(db,{lessons:{C:{completedAt:30}},updatedAt:30})),m.persistRow(options(db,{lessons:{D:{completedAt:40}},updatedAt:40}))]);out=JSON.parse(db.rows.get('alice|profile').note);assert.deepEqual(Object.keys(out.lessons).sort(),['A','B','C','D']);
});
test('account identity changes stop pending writes and distinct owners never share rows',async()=>{
 const db=database();await Promise.all([m.persistRow(options(db,{lessons:{A:{completedAt:10}}},'alice')),m.persistRow(options(db,{lessons:{B:{completedAt:20}}},'bob'))]);assert.ok(!JSON.parse(db.rows.get('alice|profile').note).lessons.B);assert.ok(!JSON.parse(db.rows.get('bob|profile').note).lessons.A);
 const count=db.writes;await m.persistRow({...options(db,{lessons:{private:{completedAt:1}}}),current:()=>false});assert.equal(db.writes,count);
});
module.exports={database};
