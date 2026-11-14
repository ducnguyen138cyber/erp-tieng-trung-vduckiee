'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const baseline=require('./fixtures/learning-ui-baseline.json');
const read=p=>fs.readFileSync(p,'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
test('Daily stylesheet and complete homepage renderer match the approved main interface',()=>{
 assert.equal(hash(read('assets/daily-learning-v2.css')),baseline.cssSha256);
 assert.equal(hash(read('assets/v86/home-dashboard-v86.5.js')),baseline.homeSha256);
});
test('application shell body keeps every existing block and control from main',()=>{
 const dom=new JSDOM(read('app-shell-v88.html'));
 try{dom.window.document.querySelectorAll('script').forEach(s=>s.remove());assert.equal(hash(dom.window.document.body.innerHTML.replace(/\s+/g,' ').trim()),baseline.shellBodySha256);}finally{dom.window.close();}
});
function review(){
 const dom=new JSDOM('<div id="hskLesson"></div>',{url:'https://example.test/',runScripts:'outside-only'}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=()=>{};
 for(const p of ['assets/v82/learning-progress-merge-v1.js','assets/hsk-content/hsk-study-journey-v1.js','assets/hsk-content/hsk-study-flow-v1.js'])w.eval(read(p));
 w.VDuckieHskStudyJourney.recordWord(3,'lesson','努力',false,'nǔlì','nỗ lực');
 w.VDuckieHskStudyFlow.decorate({level:3,lesson:{id:'lesson',sections:[],practiceRefs:[]},data:{lessons:[{id:'lesson'}],exerciseById:{}}});w.VDuckieHskStudyFlow.openReview();
 return {dom,w,j:w.VDuckieHskStudyJourney,drawer:w.document.querySelector('[data-hsk-review-drawer]')};
}
test('original review markup and buttons remain, without turning reveal/self-report into verified recall or EXP',()=>{
 const p=review();try{
  assert.equal(p.drawer.innerHTML,baseline.reviewHtml);assert.equal(p.drawer.querySelector('[data-hsk-recall-input]'),null);
  let awards=0;p.w.document.addEventListener('vduckie:hsk-word-mastered',()=>awards++);
  const before=p.j.wordStats();p.drawer.querySelector('[data-hsk-review-reveal]').click();
  assert.equal(p.drawer.querySelector('[data-hsk-review-meaning]').hidden,false);
  assert.equal(p.drawer.querySelector('[data-hsk-review-grade="1"]').hidden,false);
  p.drawer.querySelector('[data-hsk-review-grade="1"]').click();
  assert.equal(p.j.wordStats().correct,before.correct);assert.equal(p.j.wordStats().remembered,0);assert.equal(awards,0);
 }finally{p.dom.window.close();}
});
test('the original not-remembered button still saves weakness and schedules an early review',()=>{
 const p=review();try{
  p.drawer.querySelector('[data-hsk-review-reveal]').click();p.drawer.querySelector('[data-hsk-review-grade="0"]').click();
  const item=p.j.load().reviews['3:努力'];assert.equal(item.weak,true);assert.equal(item.nextAt-item.lastAt,300000);assert.equal(p.j.wordStats().remembered,0);
 }finally{p.dom.window.close();}
});
