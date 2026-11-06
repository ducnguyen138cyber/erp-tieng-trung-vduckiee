'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const manifest=JSON.parse(fs.readFileSync('data/vietnamese/manifest.json','utf8'));
const units=manifest.units.map(u=>JSON.parse(fs.readFileSync('data/vietnamese/'+u.file,'utf8')));
const Progress=require('../assets/vietnamese/progress.js');
const words=units.filter(u=>u.kind==='lesson').flatMap(u=>u.words);
test('12 complete original lessons, two phonetics units and exactly 168 distinct core entries',()=>{
 assert.equal(units.length,14);assert.equal(units.filter(u=>u.kind==='lesson').length,12);assert.equal(manifest.wordCount,168);
 assert.equal(words.length,168);assert.equal(new Set(words.map(w=>w.vi.toLocaleLowerCase('vi').normalize('NFC'))).size,168);
 for(const u of units){assert.match(u.title,/[\u4e00-\u9fff]/);assert.ok(u.grammar.length>=2);assert.ok(u.dialogue.length>=2);assert.equal(u.practice.length,5);assert.equal(u.quiz.length,5);
  if(u.kind==='lesson'){assert.equal(u.words.length,14);assert.ok(u.dialogue.length>=6);}
  for(const w of u.words){for(const key of ['vi','zh','example','exampleZh'])assert.ok(w[key],u.id+' '+w.id+' '+key);assert.equal(w.vi,w.vi.normalize('NFC'));assert.match(w.zh,/[\u4e00-\u9fff]/);assert.ok(w.vi.toLocaleLowerCase('vi').split(' ').every(token=>w.example.toLocaleLowerCase('vi').includes(token)));assert.ok(!Object.hasOwn(w,'pinyin'));}
  for(const q of [...u.practice,...u.quiz]){assert.ok(q.explanation);if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.options[q.answer]);}if(q.type==='fill')assert.ok(q.answers.length);if(q.type==='order')assert.equal(q.tokens.join(' '),q.answer);}
  assert.deepEqual(new Set(u.practice.map(q=>q.type)),new Set(['listen','choice','fill','order','match']));
 }
});
test('phonetics covers 29 letters, all marked vowels, six distinct tones and no fake pronunciation scoring',()=>{
 const p1=units[0],p2=units[1];assert.equal(p1.alphabet.length,29);
 for(const c of 'ăâêôơưđ')assert.ok(p1.alphabet.some(a=>a.letter===c));
 assert.deepEqual(p2.tones.map(t=>t.name),['ngang','sắc','huyền','hỏi','ngã','nặng']);
 assert.match(p2.grammar.map(g=>g.body+g.zh).join(''),/不提供|没有自动发音评分/);
 assert.match(units.find(u=>u.id==='l05').grammar[0].body,/星期一=thứ hai/);
});
test('audio sprites cover every authored phrase and have valid ordered segments and real MP3 assets',()=>{
 const sources=JSON.parse(fs.readFileSync('data/vietnamese/audio-sources.json','utf8')),audio=JSON.parse(fs.readFileSync('data/vietnamese/audio-manifest.json','utf8'));
 assert.equal(audio.voice,'vi-VN-NamMinhNeural');assert.equal(Object.keys(audio.units).length,14);
 let count=0;
 for(const [id,texts] of Object.entries(sources)){const u=audio.units[id],file=fs.readFileSync(u.file);assert.equal(file.length,u.bytes);assert.ok(file.length>10000);let last=0;
  for(const text of texts){const seg=u.segments[text];assert.ok(seg,text);assert.ok(seg[0]>=last&&seg[1]>seg[0]&&seg[1]<=u.seconds);last=seg[1];count++;}
 }
 assert.equal(count,513);
});
test('Vietnamese is lazy and its system rows cannot enter ordinary Chinese word merges',()=>{
 const {getRuntimeSnapshot}=require('./helpers/runtime-snapshot');const source=getRuntimeSnapshot().effectiveHtml;
 assert.match(source,/assets\/vietnamese\/entry\.js\?v=1/);assert.doesNotMatch(source,/vietnamese\/(?:course\.js|progress\.js|audio\.js|manifest\.json)/);
 const sw=fs.readFileSync('service-worker.js','utf8');assert.doesNotMatch(sw,/data\/vietnamese\/|vietnamese\/audio\//);
 assert.match(fs.readFileSync('supabase-sync.js','utf8'),/\^__vduckie_/);
 assert.doesNotMatch(fs.readFileSync('assets/vietnamese/course.js','utf8'),/awardEXP|recordLearningEvent|addExp|\.rpc\(/i);
});
function memory(){const m=new Map([['erp-hsk-progress-v2','keep-hsk'],['vduckie-daily-learning-v1','keep-erp']]);return {m,getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};}
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
const settle=()=>new Promise(r=>setImmediate(r));
test('guest, existing account and new account keep separate progress through sign-out/relogin',async()=>{
 const storage=memory(),remote={},writes=[];
 const cloud={loadVietnameseProgress:async()=>remote,saveVietnameseRecords:async r=>writes.push(r)};
 const s=Progress.create({storage,cloud});s.change('l01',r=>r.best=80);s.switchAccount('alice');await s.sync();assert.equal(s.get('l01').best,0);
 s.change('l01',r=>r.best=100);await s.sync();s.switchAccount('bob');await s.sync();assert.equal(s.get('l01').best,0);
 s.switchAccount('');assert.equal(s.get('l01').best,80);s.switchAccount('alice');await s.sync();assert.equal(s.get('l01').best,100);
 assert.equal(storage.m.get('erp-hsk-progress-v2'),'keep-hsk');assert.equal(storage.m.get('vduckie-daily-learning-v1'),'keep-erp');s.dispose();
});
test('completion requires every section and a passing quiz; remote merge never downgrades achievement',()=>{
 const a={updatedAt:1,sections:{words:true,grammar:true},words:{'l01-w01':true},best:100};
 const b={updatedAt:2,sections:{dialogue:true,practice:true},words:{'l01-w02':true},best:20};
 const merged=Progress.merge({l01:a},{l01:b});assert.equal(merged.l01.best,100);assert.equal(merged.l01.completed,true);assert.equal(Object.keys(merged.l01.words).length,2);
 assert.equal(Progress.clean('l01',{sections:{words:true},best:100}).completed,false);
 assert.equal(Progress.clean('l01',{sections:{words:true,grammar:true,dialogue:true,practice:true},best:79}).completed,false);
});
test('spaced repetition schedules errors soon and successes across days; repeating today cannot inflate stage',()=>{
 const now=2000000000000,one=Progress.review({},true,now),again=Progress.review(one,true,now+1000),wrong=Progress.review(one,false,now+2000);
 assert.equal(one.stage,1);assert.equal(one.nextReview,now+86400000);assert.equal(again.stage,1);assert.equal(again.nextReview,one.nextReview);
 assert.equal(wrong.stage,0);assert.equal(wrong.nextReview,now+2000+600000);
 assert.equal(Progress.review(one,true,now+86400000).stage,2);
});
test('an account switch discards an in-flight remote read from the previous account',async()=>{
 const old=deferred();let reads=0;
 const s=Progress.create({storage:memory(),cloud:{loadVietnameseProgress:()=>++reads===1?old.promise:Promise.resolve({}),saveVietnameseRecords:async()=>{}}});
 s.switchAccount('alice');s.switchAccount('bob');await s.sync();old.resolve({l01:{updatedAt:100,best:100}});await settle();assert.equal(s.get('l01').best,0);s.dispose();
});
test('offline and failed downloads never upload a stale snapshot; local progress survives reload',async()=>{
 const storage=memory();let writes=0,online=false;const cloud={loadVietnameseProgress:async()=>{throw Error('network');},saveVietnameseRecords:async()=>writes++};
 const s=Progress.create({storage,cloud,online:()=>online});s.switchAccount('alice');s.change('l01',r=>r.best=80);await s.sync();assert.equal(writes,0);online=true;await s.sync();assert.equal(writes,0);assert.match(s.snapshot().status,/暂未同步/);s.dispose();
 const reloaded=Progress.create({storage,cloud,online:()=>false});reloaded.switchAccount('alice');assert.equal(reloaded.get('l01').best,80);reloaded.dispose();
});
test('record validation rejects foreign namespaces and preserves Vietnamese diacritics in data',()=>{
 const data=Progress.normalize({'__proto__':{},'erp:hsk':{best:100},'l01':{best:200},'l01-w01':{stage:900}});assert.deepEqual(Object.keys(data).sort(),['l01','l01-w01']);assert.equal(data.l01.best,100);assert.equal(data['l01-w01'].stage,5);
});
