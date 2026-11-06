'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const Progress=require('../assets/vietnamese/progress.js');
const wait=()=>new Promise(r=>setImmediate(r));
async function boot({saved={},user='',search='?screen=vietnamese',network=true}={}){
 const dom=new JSDOM('<!doctype html><html lang="vi"><head></head><body><button id="cloudLogin">登录</button><div class="study-center"><section id="vietnameseScreen" lang="zh-CN" translate="no"></section></div></body></html>',{url:'https://example.test/'+search,runScripts:'outside-only'});
 const w=dom.window;w.scrollTo=function(){};for(const[k,v]of Object.entries(saved))w.localStorage.setItem(k,v);
 w.VDuckieVIProgress=Progress;w.VDuckieScreenRouter={navigate:s=>w.__screen=s};
 w.VDuckieVIAudio={stop(){},play:async(_u,_t,_s,notify)=>{notify('播放完毕');return true;},device:async()=>false};
 const remote={},writes=[];w.__identity=user;w.VDuckieCloud={vietnameseIdentity:()=>({userId:w.__identity}),loadVietnameseProgress:async()=>remote[w.__identity]||{},saveVietnameseRecords:async rows=>{writes.push({user:w.__identity,rows});for(const r of rows)(remote[w.__identity]||= {})[r.key]=r.value;}};
 const requests=[];w.fetch=async url=>{requests.push(url);if(!network)throw Error('offline');return {ok:true,json:async()=>JSON.parse(fs.readFileSync(String(url).replace('./','').split('?')[0],'utf8'))};};
 w.eval(fs.readFileSync('assets/vietnamese/course.js','utf8'));await w.VDuckieVICourse.open();await wait();await wait();
 const click=(action,attr='')=>{const button=w.document.querySelector('[data-vi-action="'+action+'"]'+attr);assert.ok(button,'missing '+action+' '+attr);button.click();};
 return {dom,w,click,requests,writes,remote,async settle(){await wait();await wait();},saved(){return Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return[k,w.localStorage.getItem(k)];}));}};
}
const lesson=JSON.parse(fs.readFileSync('data/vietnamese/lessons/l01.json','utf8'));
function answer(h,q,wrong=false){
 const d=h.w.document;
 if(q.options){if(q.type==='listen')h.click('listen-text');d.querySelector('input[value="'+(wrong?(q.answer+1)%q.options.length:q.answer)+'"]').click();}
 else if(q.type==='fill')d.querySelector('[data-vi-fill]').value=wrong?'xin chao':q.answers[0];
 else if(q.type==='order')for(let i=0;i<q.tokens.length;i++)h.click('order-add','[data-token="'+i+'"]');
 else for(let i=0;i<q.pairs.length;i++){h.click('match-left','[data-index="'+i+'"]');h.click('match-right','[data-index="'+i+'"]');}
 h.click('check');assert.match(d.querySelector('.vi-feedback').textContent,/答对|再巩固/);h.click('next-question');
}
test('all five exercise types work, completion persists after reload and unrelated progress stays untouched',async()=>{
 const h=await boot({saved:{'erp-hsk-progress-v2':'old-hsk','vduckie-daily-learning-v1':'old-erp'}});h.click('unit','[data-unit="l01"]');await h.settle();
 assert.match(h.w.document.querySelector('h1').textContent,/打招呼/);
 h.click('reveal');assert.match(h.w.document.querySelector('.vi-word-meaning').textContent,/你好/);
 h.click('bookmark');h.click('known');
 for(let i=0;i<lesson.words.length;i++)h.click('next-word');
 h.click('grammar-done');h.click('dialogue-done');
 for(const q of lesson.practice)answer(h,q);
 assert.match(h.w.document.querySelector('.vi-result').textContent,/100/);h.click('quiz-start');
 for(const q of lesson.quiz)answer(h,q);
 const record=JSON.parse(h.w.localStorage.getItem('vduckie-vietnamese-v1:guest')).l01;
 assert.equal(record.completed,true);assert.equal(record.best,100);
 const saved=h.saved();h.w.VDuckieVICourse.leave();h.dom.window.close();
 const again=await boot({saved});assert.match(again.w.document.querySelector('[data-vi-progress]').textContent,/1 \/ 14/);
 assert.equal(again.w.localStorage.getItem('erp-hsk-progress-v2'),'old-hsk');assert.equal(again.w.localStorage.getItem('vduckie-daily-learning-v1'),'old-erp');
 again.dom.window.close();
});
test('missing Vietnamese accents are rejected and wrong answers enter review without awarding EXP',async()=>{
 const h=await boot({search:'?screen=vietnamese&viUnit=l01&viTab=quiz'});await h.settle();
 answer(h,lesson.quiz[0]);answer(h,lesson.quiz[1]);
 const q=lesson.quiz[2];assert.equal(q.type,'fill');h.w.document.querySelector('[data-vi-fill]').value='Xin chao';h.click('check');assert.match(h.w.document.querySelector('.vi-feedback').textContent,/再巩固/);
 const rows=JSON.parse(h.w.localStorage.getItem('vduckie-vietnamese-v1:guest'));assert.equal(rows['l01-w01'].wrong,1);assert.ok(rows['l01-w01'].nextReview>Date.now());assert.notEqual(rows.l01?.completed,true);h.dom.window.close();
});
test('a new user starts empty; signing out and back in restores only the right user and Chinese return works',async()=>{
 const saved={'vduckie-vietnamese-v1:alice':JSON.stringify({l01:{updatedAt:1,best:100,sections:{words:true,grammar:true,dialogue:true,practice:true}}})};
 const h=await boot({saved,user:'alice'});assert.match(h.w.document.querySelector('[data-vi-progress]').textContent,/1 \/ 14/);
 h.w.__identity='bob';h.w.document.dispatchEvent(new h.w.CustomEvent('vduckie:auth-state',{detail:{userId:'bob'}}));await h.settle();assert.match(h.w.document.querySelector('[data-vi-progress]').textContent,/0 \/ 14/);
 h.w.__identity='';h.w.document.dispatchEvent(new h.w.CustomEvent('vduckie:auth-state'));await h.settle();assert.match(h.w.document.querySelector('.vi-sync').textContent,/游客/);
 h.w.__identity='alice';h.w.document.dispatchEvent(new h.w.CustomEvent('vduckie:auth-state'));await h.settle();assert.match(h.w.document.querySelector('[data-vi-progress]').textContent,/1 \/ 14/);
 h.click('chinese');assert.equal(h.w.__screen,'home');h.dom.window.close();
});
test('only manifest and selected lesson data are fetched, tab keyboard navigation works and transient errors are retryable',async()=>{
 const h=await boot();assert.deepEqual(h.requests,['./data/vietnamese/manifest.json?v=1']);h.click('unit','[data-unit="l02"]');await h.settle();assert.equal(h.requests.length,2);
 const t=h.w.document.querySelector('#vi-tab-words');t.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(h.w.document.querySelector('#vi-tab-grammar').getAttribute('aria-selected'),'true');
 assert.equal(h.w.document.querySelector('#vietnameseScreen').getAttribute('lang'),'zh-CN');assert.equal(h.w.document.documentElement.lang,'vi'); // Mount lang is owned by entry, content never changes whole-site language.
 h.dom.window.close();
 const error=await boot({network:false});assert.match(error.w.document.body.textContent,/暂时无法打开/);assert.ok(error.w.document.querySelector('button[data-vi-action="reload"]'));error.dom.window.close();
});

test('a successful real playback is not mislabeled as a reading alternative after grading',async()=>{
 const h=await boot({search:'?screen=vietnamese&viUnit=l01&viTab=practice'});await h.settle();
 h.click('listen');await h.settle();h.w.document.querySelector('input[value="0"]').click();h.click('check');
 assert.match(h.w.document.querySelector('.vi-feedback').textContent,/答对/);
 assert.match(h.w.document.querySelector('.vi-listen small').textContent,/作答后显示原文/);
 assert.doesNotMatch(h.w.document.querySelector('.vi-listen small').textContent,/文字替代/);h.dom.window.close();
});

test('cloud hydration refreshes course completion and Continue resumes the last lesson step',async()=>{
 const h=await boot({user:'alice'});h.remote.alice={position:{updatedAt:2000,unit:'l03',tab:'dialogue'},l01:{updatedAt:2000,best:100,sections:{words:true,grammar:true,dialogue:true,practice:true}}};
 h.click('sync');await h.settle();await h.settle();assert.match(h.w.document.querySelector('[data-vi-progress]').textContent,/1 \/ 14/);
 const resume=h.w.document.querySelector('.vi-hero [data-vi-action="unit"]');assert.equal(resume.dataset.unit,'l03');resume.click();await h.settle();
 assert.equal(h.w.document.querySelector('#vi-tab-dialogue').getAttribute('aria-selected'),'true');h.dom.window.close();
});
