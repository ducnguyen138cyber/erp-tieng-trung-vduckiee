const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const source=p=>fs.readFileSync(p,'utf8');
function dom(html,url='https://example.invalid/?screen=home'){const d=new JSDOM(html,{url,runScripts:'outside-only'});d.window.requestAnimationFrame=()=>0;d.window.scrollTo=()=>{};return d;}
test('Shadowing direct route owns the title despite late HSK initialization',async()=>{
 const d=dom('<title>VDuckie</title><section id="dailyLearningPanel"></section>','https://example.invalid/?screen=shadowing'),w=d.window;
 try{
  w.VDuckieDailyLearning={show(){w.document.title='Lộ trình HSK — VDuckie';}};w.VDuckieShadowing={open(){},leave(){}};
  w.eval(source('assets/navigation/screen-router.js'));
  await new Promise(r=>w.setTimeout(r,30));
  assert.equal(w.VDuckieScreenRouter.current(),'shadowing');assert.equal(w.document.title,'Luyện nghe Shadowing — VDuckie');
  w.document.title='Lộ trình HSK — VDuckie';await new Promise(r=>w.setTimeout(r,0));
  assert.equal(w.document.title,'Luyện nghe Shadowing — VDuckie');
  w.VDuckieScreenRouter.navigate('home');await new Promise(r=>w.setTimeout(r,0));assert.notEqual(w.document.title,'Luyện nghe Shadowing — VDuckie');
 }finally{w.close();}
});
test('HSK5 and HSK6 cards activate their own learner on second click',()=>{
 const d=dom('<section id="v865HomeRoadmap"><div class="v865-road-scroll"></div></section>'),w=d.window,calls=[];
 try{
  w.VDuckieScreenRouter={navigate:s=>calls.push(s)};w.VDuckieHskProfessionalRuntime={selectLevel:(n,reset)=>calls.push([n,reset])};
  w.document.querySelector('.v865-road-scroll').innerHTML=Array.from({length:8},(_,n)=>`<button class="v865-road-stage ${n===7?'locked':''}" data-v865-level="${n}"><strong>HSK ${n}</strong><small>Sẵn sàng học</small></button>`).join('');
  w.eval(source('assets/v89/hsk-roadmap-v89.4.js'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));w.VDuckieHSKRoadmapV894.enhance();
  for(const n of [5,6]){const b=w.document.querySelector(`[data-v865-level="${n}"]`);b.click();assert.equal(calls.length,0,'first click only reveals');b.click();assert.deepEqual(calls.splice(0),['hsk-study',[n,false]]);}
 }finally{w.close();}
});
test('route navigation clears foreign lesson parameters while preserving learner deep links',()=>{
 const d=dom('<aside id="studySidebar"><button data-daily-nav="review">Review</button></aside><section id="dailyLearningPanel"></section>','https://example.invalid/?screen=hsk-study&hskLevel=6&hskLesson=hsk6-lesson-02&hskTab=grammar&hskAssessment=a'),w=d.window;let dismissed=0;
 try{
  w.VDuckieDailyLearning={show(){}};w.VDuckieHeaderSearch={dismissForNavigation(){dismissed++}};
  w.eval(source('assets/navigation/screen-router.js'));
  w.document.querySelector('button').click();assert.equal(w.VDuckieScreenRouter.current(),'review');assert.equal(dismissed,1);
  assert.equal(w.location.search,'?screen=review');
  w.history.replaceState(null,'','?screen=hsk-study&hskLevel=6&hskLesson=hsk6-lesson-02');
  w.VDuckieScreenRouter.navigate('hsk-study');assert.equal(new URL(w.location.href).searchParams.get('hskLevel'),'6');
  const before=dismissed;w.dispatchEvent(new w.PopStateEvent('popstate'));assert.equal(dismissed,before,'same-screen search history must not dismiss the remaining search layer');
 }finally{w.close();}
});
test('metadata-only preselection does not fabricate a started journey in Home or its resume action',async()=>{
 const d=dom('<section id="homeHub"><div class="home-welcome-actions"><button class="home-primary-action"></button></div><div class="home-overview-grid"></div><div class="home-recommended"></div><div id="v85PersonalDashboard"><div class="v85-top"></div></div></section>'),w=d.window,calls=[];
 try{
  w.setInterval=()=>0;
  w.VDuckieHskStudyJourney={summary:()=>({current:{level:5,lessonId:'hsk5-lesson-03'},totalCompleted:0,due:0,studied:0}),current:()=>({level:5,lessonId:'hsk5-lesson-03'}),lesson:()=>({position:{tab:'vocab',index:0},visitedAt:123})};
  w.VDuckieScreenRouter={navigate:s=>calls.push(s)};w.VDuckieHskProfessionalRuntime={selectLevel:async n=>calls.push(n),selectLesson:id=>calls.push(id)};
  w.eval(source('assets/v86/home-dashboard-v86.5.js'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));w.VDuckieHomeDashboardV865.render();
  assert.equal(w.VDuckieHomeDashboardV865.todayFocusData().hasStarted,false);
  assert.doesNotMatch(w.document.querySelector('.home-primary-action').textContent,/HSK 5/);
  assert.match(w.document.querySelector('.v865-continue-card h3').textContent,/Bắt đầu học HSK 1/);
  w.document.querySelector('#v865TodayFocus [data-v865-action="continue"]').click();await Promise.resolve();
  assert.deepEqual(calls,['hsk-study',1,'hsk1-lesson-01']);
 }finally{w.close();}
});
test('community failure exits loading, retry succeeds, later failure preserves loaded words',async()=>{
 const vm=require('node:vm'),s=source('assets/v62/runtime-v70.2.js'),start=s.indexOf('function K('),end=s.indexOf('function _(',start),load=s.slice(start,end);
 const terms={innerHTML:'Đang tải dữ liệu…'},statuses=[];let fail=true,renders=0;
 const context={Array,a:false,n:[],e:'https://example.invalid/community',t:{},d:()=>terms,H:(...v)=>statuses.push(v),fetch:async()=>{if(fail)throw new Error('offline');return{ok:true,json:async()=>({terms:[{hanzi:'仓库'}]})}},B(){renders++;terms.innerHTML='仓库'}};
 vm.runInNewContext(load,context);
 await context.K(true);assert.match(terms.innerHTML,/Chưa tải được/);assert.doesNotMatch(terms.innerHTML,/Đang tải/);assert.equal(context.a,false);
 fail=false;await context.K(true);assert.equal(renders,1);assert.equal(terms.innerHTML,'仓库');
 fail=true;await context.K(true);assert.equal(terms.innerHTML,'仓库','failed refresh cannot erase previous data');assert.equal(context.a,false);
});
