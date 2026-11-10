// Targeted regressions for the slow-boot shared home / HSK shell.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const runtime=readFileSync(new URL('../assets/hsk-content/hsk-professional-runtime.js', import.meta.url),'utf8');
const daily=readFileSync(new URL('../assets/daily-learning-v2.js', import.meta.url),'utf8');

function functionSource(source, startMarker, endMarker){
 const from=source.indexOf(startMarker),to=source.indexOf(endMarker,from);
 assert.ok(from>=0&&to>from,'missing source for '+startMarker);
 return source.slice(from,to);
}
const urlSource=functionSource(runtime,'  function writeUrl() {','  function renderCurrent() {');
const panelSource=functionSource(daily,'  function panel() {','  function hideLegacy() {');

function hskUrl({screen='',route=''}={}){
 const changed=[];
 const url='https://vduckie.pages.dev/?'+(screen?'screen='+screen:'area=hsk');
 const root={location:{href:url,search:new URL(url).search},
   document:{body:{getAttribute(name){return name==='data-screen-route'?route:null;}}},
   history:{replaceState(...args){changed.push(args[2]);}}};
 const state={selectedLevel:1,selectedLessonId:'hsk1-lesson-01',selectedAssessmentId:''};
 runInNewContext(urlSource+';writeUrl();',{root,state,URL,URLSearchParams});
 return changed;
}

test('hidden HSK learner cannot steal the catalogue, games or home URL',()=>{
 for(const screen of ['msutong','games','home','vietnamese','daily']){
  assert.deepEqual(hskUrl({screen,route:screen}),[],screen);
  assert.deepEqual(hskUrl({screen}),[],screen+' before route initialization');
 }
});
test('explicit HSK learner and legacy HSK URL continue to update lesson deep links',()=>{
 for(const [screen,route] of [['hsk','hsk'],['hsk-study','hsk-study'],['','']]){
  const result=hskUrl({screen,route});
  assert.equal(result.length,1,screen||'legacy');
  assert.match(result[0],/hskLesson=hsk1-lesson-01/);
 }
});

function mount(available){
 let inserted=null;
 const node={id:'',className:''};
 const parent={insertBefore(child){inserted=child;}};
 const doc={
  getElementById(){return null;},
  createElement(tag){assert.equal(tag,'section');return node;},
  querySelector(selector){return selector===available?parent:null;}
 };
 const result=runInNewContext(panelSource+';panel();',{document:doc});
 return{result,node,inserted};
}
test('daily HSK panel mounts in direct, nested, or fallback study container',()=>{
 for(const selector of ['.study-center > main','.study-center main','.study-center']){
  const result=mount(selector);
  assert.equal(result.inserted,result.node,selector);
  assert.equal(result.node.id,'dailyLearningPanel');
 }
});
