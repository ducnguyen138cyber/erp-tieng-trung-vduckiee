import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const bank=require('../assets/hsk-content/hsk-practice-bank-v1.js');
const ui=fs.readFileSync('assets/hsk-content/hsk-practice-ui-v1.js','utf8');
const records=Array.from({length:180},(_,i)=>({
  id:'phase4-'+i,simplified:String.fromCodePoint(0x4e00+i),
  pinyin:'p'+i,meaningVi:'nghĩa '+i,
  examples:[{zh:'我们学习'+String.fromCodePoint(0x4e00+i)+'，然后复习。'}]
}));

test('224 paper variants score all sections correctly and retain stable legacy percentages',()=>{
  for(let level=1;level<=4;level++)for(let n=1;n<=56;n++){
    const paper=bank.build(level,n,records);
    const all=Object.fromEntries(paper.questions.map(q=>[q.id,q.answer]));
    const perfect=bank.scorePaper(paper,all);
    assert.equal(perfect.correct,paper.questionCount);
    assert.equal(perfect.answered,paper.questionCount);
    assert.equal(perfect.score,perfect.max);
    assert.equal(perfect.percent,100);
    assert.deepEqual(perfect.incorrectIds,[]);
    for(const sec of paper.sections)assert.equal(perfect.totals[sec].points,100);

    const empty=bank.scorePaper(paper,{});
    assert.equal(empty.score,0);
    assert.equal(empty.percent,0);
    assert.equal(empty.answered,0);
    assert.equal(empty.incorrectIds.length,paper.questionCount);
    assert.equal(empty.passed,false);

    const one={};
    one[paper.questions[0].id]=paper.questions[0].answer;
    const partial=bank.scorePaper(paper,one);
    assert.equal(partial.correct,1);
    assert.equal(partial.answered,1);
    assert.equal(partial.incorrectIds.length,paper.questionCount-1);
    assert.equal(partial.reviewStatus,'unreviewed');
  }
});

test('explanations only reuse source vocabulary and contextual sentences',()=>{
  const paper=bank.build(4,1,records);
  for(const question of paper.questions){
    const hint=bank.explainQuestion(question);
    assert.ok(hint.includes(question.hanzi),question.id);
    assert.ok(hint.includes(question.pinyin),question.id);
    assert.ok(hint.includes(question.meaning),question.id);
    if(['reading-cloze','writing-cloze','listening-sentence'].includes(question.type))
      assert.ok(hint.includes(question.example),question.id);
    assert.equal(question.reviewStatus,'unreviewed');
  }
});

test('UI saves last attempt detail while preserving existing score fields and EXP-free behavior',()=>{
  new vm.Script(ui);
  assert.match(ui,/attempts:Math\.min\(999/);
  assert.match(ui,/best:Math\.max\(score/);
  assert.match(ui,/last:score,date:stamp/);
  assert.match(ui,/lastDetail:\{version:1/);
  assert.match(ui,/incorrectIds:result\.incorrectIds\.slice\(0,100\)/);
  assert.match(ui,/Object\.assign\(\{\},old,data\[paper\.id\]\)/);
  assert.match(ui,/return bank\.scorePaper\(paper,answers\)/);
  assert.match(ui,/bank\.explainQuestion\(q\)/);
  assert.match(ui,/save\(r,byTime\)/);
  assert.match(ui,/no awardWordMastery, awardEXP/);
  assert.doesNotMatch(ui,/\.rpc\s*\(/);
});
