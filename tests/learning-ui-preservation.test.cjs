'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const baseline=require('./fixtures/learning-ui-baseline.json');
const read=p=>fs.readFileSync(p,'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
test('Daily stylesheet and homepage layout stay approved while learner support extends to HSK6',()=>{
 assert.equal(hash(read('assets/daily-learning-v2.css')),baseline.cssSha256);
 const home=read('assets/v86/home-dashboard-v86.5.js');
 assert.ok(home.includes('Math.min(6,Number(now.level)'));
 // Normalize the explicitly tested UX behavior fixes; all remaining Home markup,
 // styling, layout and progress logic must still match the approved baseline.
 const behaviorNormalized=home
  .replace('  if(!review&&!todayFocusData().hasStarted)saved={level:1,lessonId:"hsk1-lesson-01"};\n','')
  .replace('var sum=journey.summary(),focus=todayFocusData(),current=focus.hasStarted?sum.current:{level:1,lessonId:""},level=Number(current.level)||1;','var sum=journey.summary(),current=sum.current,level=Number(current.level)||1;')
  .replace('var summary=journal.summary(),started=todayFocusData().hasStarted;','var summary=journal.summary(),started=summary.totalCompleted||summary.studied||Object.keys(journal.lesson(summary.current.lessonId)).length;');
 const sameLayout=behaviorNormalized.replace('Math.min(6,Number(now.level)','Math.min(4,Number(now.level)').replace('{level:5,label:"HSK 5",icon:"伍",active:true},\n    {level:6,label:"HSK 6",icon:"陆",active:true}','{level:5,label:"HSK 5–6",icon:"伍",active:false}');
 assert.equal(hash(sameLayout),baseline.homeSha256);
});
test('application shell body keeps every existing block and control from main',()=>{
 const dom=new JSDOM(read('app-shell-v88.html'));
 try{
  const doc=dom.window.document;
  doc.querySelectorAll('script').forEach(s=>s.remove());
  // The two explicitly approved SEO guide links from #138 are additive.
  // Verify their exact markup, then normalize only those links against the old baseline.
  for(const [href,label] of [['./gioi-thieu/','Giới thiệu VDuckie'],['./tieng-trung-cong-xuong/','Cẩm nang công xưởng']]){
   const links=doc.querySelectorAll('.vd-seo-guides > a[href="'+href+'"]');
   assert.equal(links.length,1);
   assert.equal(links[0].outerHTML,'<a href="'+href+'">'+label+'</a>');
   links[0].remove();
  }
  assert.equal(hash(doc.body.innerHTML.replace(/\s+/g,' ').trim()),baseline.shellBodySha256);
 }finally{dom.window.close();}
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
