import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/hsk-content/hsk-study-journey-v1.js','utf8');
function setup(storage=new Map()){
  let clock=1800000000000;
  const context={localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    Date:{now:()=>clock},document:{dispatchEvent(){}},CustomEvent:function(){}};
  vm.runInNewContext(source,context);
  return {j:context.VDuckieHskStudyJourney,storage,advance:days=>clock+=days*86400000};
}
const ids=['q1','q2','q3','q4','q5'];
test('mastery requires every verified answer and exact 80%; opening, rubric and legacy completion give no mastery',()=>{
  const {j,storage}=setup();
  storage.set(j.KEY,JSON.stringify({lessons:{old:{level:1,completedAt:123,answers:{q1:{correct:true}}}}}));
  assert.equal(j.stats('old',1).completed,true);
  assert.equal(j.stats('old',1).mastered,false);
  j.visit(1,'new');assert.equal(j.stats('new',ids,ids).mastered,false);
  ids.forEach((id,i)=>j.recordAnswer(1,'new',id,i<4,true));
  j.recordAnswer(1,'new','rubric',null,true);
  assert.equal(j.stats('new',ids,ids).mastered,false);
  assert.equal(j.complete(1,'new',ids,[],{verifiedIds:ids}).mastered,true);
  j.recordAnswer(1,'partial','q1',true,true);j.complete(1,'partial',1,[]);
  assert.equal(j.stats('partial',ids,ids).mastered,false);
  j.recordAnswer(2,'unverified','q1',true,false);j.complete(2,'unverified',1,[]);
  assert.equal(j.stats('unverified',1).mastered,false);
});
test('answer reveal and correcting/rechecking cannot replace first-attempt evidence; an explicit retry can',()=>{
  const {j}=setup();
  ids.forEach(id=>j.recordAnswer(2,'lesson',id,false,true));
  ids.forEach(id=>j.recordAnswer(2,'lesson',id,true,true));
  assert.equal(j.complete(2,'lesson',ids,[],{verifiedIds:ids}).mastered,false);
  assert.equal(j.stats('lesson',ids,ids).verifiedCorrect,0);
  assert.equal(j.stats('lesson',ids,ids).correct,5);
  j.retry('lesson');assert.equal(j.stats('lesson',ids,ids).completed,true);
  ids.forEach((id,i)=>j.recordAnswer(2,'lesson',id,i<3,true));
  assert.equal(j.stats('lesson',ids,ids).mastered,false);
  j.retry('lesson');ids.forEach(id=>j.recordAnswer(2,'lesson',id,true,true));
  assert.equal(j.stats('lesson',ids,ids).mastered,true);
});
test('new completion requires acknowledged content and exact required exercise IDs; old completions remain intact',()=>{
  const {j}=setup();
  j.recordAnswer(1,'lesson','unrelated',true,true);
  assert.equal(j.complete(1,'lesson',['q1'],[],{content:['words']}).reason,'unfinished-content');
  j.contentDone(1,'lesson','words');
  assert.equal(j.complete(1,'lesson',['q1'],[],{content:['words']}).reason,'unfinished-practice');
  j.recordAnswer(1,'lesson','q1',false,true);
  assert.equal(j.complete(1,'lesson',['q1'],[],{content:['words']}).ok,true);
});
test('SRS prioritizes due weak words by mistakes and preserves 1–3–7–14–30 days without promoting encountered words',()=>{
  const {j,advance}=setup();
  j.complete(3,'lesson',0,[{hanzi:'学习'},{hanzi:'努力'}]);
  assert.equal(j.wordStats().remembered,0);assert.equal(j.due().length,0);
  j.recordWord(3,'lesson','努力',false);j.recordWord(3,'lesson','努力',false);
  j.recordWord(3,'lesson','学习',false);
  assert.equal(j.due()[0].hanzi,'努力');
  j.reviewWord(3,'努力',false);assert.equal(j.due()[0].hanzi,'学习');
  j.reviewWord(3,'努力',true);assert.equal(j.weakWords().length,2);
  j.reviewWord(3,'努力',true);assert.equal(j.wordStats().remembered,1);
  j.complete(3,'fresh',0,[{hanzi:'今天'}]);
  for(const days of [1,3,7,14,30]){
    const word=j.due(3,true).find(w=>w.hanzi==='今天');
    assert.equal(word.nextAt-word.lastAt,days*86400000);
    advance(days);j.reviewWord(3,'今天',true);
  }
});
test('lesson stage/card/exercise and evidence round-trip through the existing account profile transport',()=>{
  const {j,storage}=setup();
  j.visit(3,'hsk3-lesson-02');j.position(3,'hsk3-lesson-02',{stage:'practice',cards:{0:3},exerciseId:'q2'});
  j.recordAnswer(3,'hsk3-lesson-02','q1',false,true);j.contentDone(3,'hsk3-lesson-02','words');
  const context={console};vm.runInNewContext(fs.readFileSync('assets/v82/account-learning-sync-v82.js','utf8'),context);
  const utils=context.VDuckieAccountSyncUtils;
  assert.equal(utils.isSyncableKey(j.KEY),true);
  const profile={version:2,fields:{[j.KEY]:{value:storage.get(j.KEY),updatedAt:10}}};
  const merged=utils.merge({version:2,fields:{}},profile);
  const remote=setup(new Map([[j.KEY,merged.fields[j.KEY].value]])).j;
  assert.equal(remote.current().lessonId,'hsk3-lesson-02');
  assert.equal(remote.lesson('hsk3-lesson-02').position.stage,'practice');
  assert.equal(remote.lesson('hsk3-lesson-02').position.cards[0],3);
  assert.equal(remote.lesson('hsk3-lesson-02').position.exerciseId,'q2');
  assert.equal(remote.stats('hsk3-lesson-02',['q1'],['q1']).verifiedCorrect,0);
});

test('learner UI restores stage/card, shows weak questions, and saves the position after runtime click handlers',async()=>{
  const {createRequire}=await import('node:module');
  const {JSDOM}=createRequire(import.meta.url)('jsdom');
  const dom=new JSDOM('<div id="hskLesson"><button data-focus-stage="words" aria-pressed="true"></button><button data-focus-stage="practice" aria-pressed="false"></button><div data-focus-panel="words"><section class="hsk-pro-section hsk-focus-vocabulary"><div data-focus-word></div><div data-focus-word class="hidden"></div><div data-focus-word class="hidden"></div><button data-focus-prev></button><button data-focus-next>Next</button></section></div><div data-focus-panel="practice" class="hidden"><article data-pro-exercise="q1"></article></div></div>',{url:'https://example.test',runScripts:'outside-only',pretendToBeVisual:true});
  try{
    const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};
    w.eval(source);w.eval(fs.readFileSync('assets/hsk-content/hsk-study-flow-v1.js','utf8'));
    const info={level:1,lesson:{id:'lesson',sections:[],practiceRefs:['q1']},data:{lessons:[{id:'lesson'}],exerciseById:{q1:{id:'q1',skill:'grammar',prompt:'Sắp xếp câu',answer:'好',reviewStatus:'verified'}}}};
    w.VDuckieHskStudyJourney.recordAnswer(1,'lesson','q1',false,true,['q1']);
    w.VDuckieHskStudyFlow.decorate(info);
    assert.match(w.document.querySelector('[data-hsk-finish-panel]').textContent,/Sắp xếp câu/);
    assert.equal(w.document.querySelector('[data-hsk-finish]').disabled,true);
    w.document.querySelector('[data-hsk-content-done]').click();
    assert.equal(w.document.querySelector('[data-hsk-finish]').disabled,false);
    // Professional runtime is registered after the additive learner flow.
    w.document.addEventListener('click',event=>{
      if(!event.target.hasAttribute('data-focus-next'))return;
      w.document.querySelectorAll('[data-focus-word]').forEach((card,i)=>card.classList.toggle('hidden',i!==2));
    });
    w.document.querySelector('[data-focus-next]').click();
    await new Promise(resolve=>setTimeout(resolve,20));
    assert.equal(w.VDuckieHskStudyJourney.lesson('lesson').position.cards[0],2);
    w.VDuckieHskStudyJourney.position(1,'lesson',{stage:'practice',exerciseId:'q1'});
    // Re-render, as Học tiếp does. Decoration restores the practice panel.
    w.document.querySelectorAll('[data-hsk-progress-host],[data-hsk-finish-panel],[data-hsk-content-done]').forEach(el=>el.remove());
    w.VDuckieHskStudyFlow.decorate(info);
    assert.equal(w.document.querySelector('[data-focus-panel="practice"]').classList.contains('hidden'),false);
    assert.equal(w.document.querySelector('[data-focus-panel="words"]').classList.contains('hidden'),true);
    assert.equal(w.document.querySelectorAll('[data-focus-word]')[2].classList.contains('hidden'),false);
    assert.match(w.document.querySelector('[data-pro-exercise]').textContent,/cần ôn lại/);
  }finally{dom.window.close();}
});

test('homepage prioritizes resume and due review beside the main learning action',async()=>{
  const {createRequire}=await import('node:module');
  const {JSDOM}=createRequire(import.meta.url)('jsdom');
  const dom=new JSDOM('<section id="homeHub"><div class="vi-home-invite"><button class="home-primary-action">学越南语</button></div><div class="home-welcome-actions"><button class="home-primary-action" data-daily-nav="msutong">Start</button></div><div class="home-overview-grid"></div><div class="home-recommended"></div></section>',{url:'https://example.test',runScripts:'outside-only'});
  try{
    const w=dom.window;w.eval(source);
    w.VDuckieHskStudyJourney.visit(3,'hsk3-lesson-02');
    w.VDuckieHskStudyJourney.position(3,'hsk3-lesson-02',{stage:'words',cards:{0:2}});
    w.VDuckieHskStudyJourney.recordWord(3,'hsk3-lesson-02','努力',false,'nǔlì','nỗ lực');
    w.eval(fs.readFileSync('assets/v86/home-dashboard-v86.5.js','utf8'));
    w.VDuckieHomeDashboardV865.render();
    const hero=w.document.querySelector('.home-welcome-actions .home-primary-action');
    assert.equal(w.document.querySelector('.vi-home-invite button').textContent,'学越南语');
    assert.match(hero.textContent,/Học tiếp HSK 3/);
    assert.equal(hero.getAttribute('data-v865-action'),'continue');
    assert.equal(hero.hasAttribute('data-daily-nav'),false);
    assert.equal(hero.nextElementSibling.getAttribute('data-v865-action'),'review-hsk');
    assert.match(hero.nextElementSibling.textContent,/\(1\)/);
    assert.equal(hero.nextElementSibling.disabled,false);
  }finally{dom.window.close();}
});
