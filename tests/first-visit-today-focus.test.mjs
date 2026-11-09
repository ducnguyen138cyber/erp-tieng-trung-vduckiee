import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/v86/home-dashboard-v86.5.js','utf8');
const css=fs.readFileSync('assets/v86/home-dashboard-v86.5.css','utf8');

function focus(summary){
  const local=new Map();
  const root={localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},
    VDuckieHskStudyJourney:{summary:()=>summary},
    setTimeout(){},clearTimeout(){}};
  const sandbox={window:root};
  vm.runInNewContext(source,sandbox,{filename:'home-dashboard-v86.5.js'});
  return root.VDuckieHomeDashboardV865.todayFocusData();
}
test('P1 newcomer has exactly one primary start action',()=>{
  const result=focus({current:{level:1,lessonId:''},due:0,studied:0,totalCompleted:0});
  assert.equal(result.hasStarted,false);
  assert.equal(result.action,'continue');
  assert.match(result.heading,/Hôm nay/);
  assert.match(result.cta,/HSK 1/);
});
test('P1 existing learner resumes their actual HSK lesson',()=>{
  const result=focus({current:{level:3,lessonId:'hsk3-lesson-04'},due:0,studied:52,totalCompleted:3});
  assert.equal(result.hasStarted,true);
  assert.equal(result.level,3);
  assert.match(result.detail,/Bài 4/);
  assert.match(result.cta,/HSK 3/);
});
test('P1 due reviews take priority, without fabricating progress',()=>{
  const result=focus({current:{level:2,lessonId:'hsk2-lesson-08'},due:7,studied:50,totalCompleted:4});
  assert.equal(result.action,'review-hsk');
  assert.match(result.detail,/7 từ/);
});
test('P1 existing features are retained behind optional discovery for newcomers',()=>{
  new vm.Script(source);
  assert.match(source,/data-first-visit/);
  assert.match(source,/data-discover-expanded/);
  assert.match(source,/data-v865-action="toggle-discover"/);
  assert.match(source,/vduckie-home-discover-expanded-v1/);
  assert.match(css,/data-first-visit="true"/);
  assert.match(css,/\.home-recommended/);
  assert.match(css,/#v865HomeRoadmap/);
  assert.match(source,/data-focus-signature/);
});
