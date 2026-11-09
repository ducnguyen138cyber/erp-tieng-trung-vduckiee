import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const bank=require('../assets/hsk-content/hsk-practice-bank-v1.js');
const ui=fs.readFileSync('assets/hsk-content/hsk-practice-ui-v1.js','utf8');
const css=fs.readFileSync('assets/hsk-content/hsk-practice-ui-v1.css','utf8');

test('phase 3 script parses; writing cloze uses a text input, not an empty option list',()=>{
  new vm.Script(ui,{filename:'hsk-practice-ui-v1.js'});
  assert.match(ui,/if\(q\.section==="writing"\)/);
  assert.match(ui,/data-practice-write/);
  const vocab=Array.from({length:160},(_,i)=>({
    id:'t'+i,simplified:String.fromCodePoint(0x4e00+i),pinyin:'p'+i,
    meaningVi:'nghĩa'+i,examples:[{zh:'今天学习'+String.fromCodePoint(0x4e00+i)+'，然后再练习。'}]
  }));
  for(const level of [3,4]){
    const paper=bank.build(level,3,vocab);
    assert.equal(bank.validatePaper(paper).ok,true);
    assert.ok(paper.questions.some(q=>q.type==='writing-cloze'));
  }
});
test('phase 3 audio controls use source text and do not expose an exam transcript',()=>{
  assert.match(ui,/new root\.SpeechSynthesisUtterance\(q\.audioText\|\|q\.hanzi\)/);
  assert.match(ui,/speech\.rate=audioRate/);
  assert.match(ui,/getVoices/);
  assert.match(ui,/speech\.onerror/);
  assert.match(ui,/data-practice-rate="0\.7"/);
  assert.match(ui,/data-practice-rate="0\.85"/);
  assert.match(ui,/data-practice-rate="1"/);
  assert.match(ui,/q\.section!=="listening"\)return/);
  assert.doesNotMatch(ui,/innerHTML\s*=\s*q\.audioText/);
});
test('phase 3 timer uses wall clock so background tabs do not slow the countdown',()=>{
  assert.match(ui,/deadline=Date\.now\(\)\+remaining\*1000/);
  assert.match(ui,/Math\.ceil\(\(deadline-Date\.now\(\)\)\/1000\)/);
  assert.match(ui,/remaining=secondsLeft\(\)/);
  assert.match(ui,/visibilitychange/);
  assert.match(ui,/if\(remaining===0\)finish\(true\)/);
  assert.match(ui,/stopTimer\(\);stopAudio\(\)/);
});
test('phase 3 preserves all-question layout, navigation, submission and legacy result storage',()=>{
  assert.match(ui,/data-practice-unanswered/);
  assert.match(ui,/function nextUnanswered\(\)/);
  assert.match(ui,/data-practice-go/);
  assert.match(ui,/data-practice-submit/);
  assert.match(ui,/vduckie-hsk-practice-exams-v2/);
  assert.match(ui,/no awardWordMastery, awardEXP/);
  assert.match(css,/\.hsk-exam-tools/);
  assert.match(css,/@media\(max-width:620px\)/);
});
