import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const bank=require('../assets/hsk-content/hsk-practice-bank-v1.js');
const read=(file)=>fs.readFileSync(file,'utf8');
function words(level){
  const dir=path.join('data','hsk','hsk'+level,'vocabulary');
  const index=JSON.parse(read(path.join(dir,'index.json')));
  const records=index.shards.flatMap(shard=>{
    const file=JSON.parse(read(path.join(dir,shard.file)));
    assert.equal(file.collectionType,'vocabulary');
    return file.records;
  });
  assert.equal(records.length,index.expectedCount,'canonical record count HSK '+level);
  return records;
}
const PLAN=[
  null,
  {listening:20,reading:20,writing:0,minutes:40},
  {listening:35,reading:25,writing:0,minutes:55},
  {listening:40,reading:30,writing:10,minutes:90},
  {listening:45,reading:40,writing:15,minutes:105}
];
test('all 224 HSK papers are fully populated, section-ordered and canonically gradable',()=>{
  assert.equal(bank.LEVELS,4);
  assert.equal(bank.PAPERS_PER_LEVEL,56);
  assert.equal(bank.TOTAL_PAPERS,224);
  const forms=new Set(),types=new Set();
  for(let level=1;level<=4;level++){
    assert.deepEqual({...bank.BLUEPRINT[level]},PLAN[level]);
    const vocab=words(level);
    const plan=PLAN[level];
    const total=plan.listening+plan.reading+plan.writing;
    for(let number=1;number<=56;number++){
      const paper=bank.build(level,number,vocab);
      assert.equal(paper.questionCount,total);
      assert.equal(paper.questions.length,total);
      assert.equal(paper.official,false,'not official HSK questions');
      assert.equal(new Set(paper.questions.map(q=>q.wordId)).size,total,'repeated word inside '+paper.id);
      const seen=new Set();
      for(let i=0;i<paper.questions.length;i++){
        const q=paper.questions[i];
        types.add(q.type);
        assert.ok(q.id&&q.hanzi&&q.answer&&q.prompt,q.id);
        assert.equal(bank.grade(q,q.answer),true,q.id);
        assert.equal(bank.grade(q,'clearly not the answer'),false,q.id);
        assert.equal(seen.has(q.id),false,q.id);
        seen.add(q.id);
        const section=i<plan.listening?'listening':
          i<plan.listening+plan.reading?'reading':'writing';
        assert.equal(q.section,section,q.id);
        if(section==='listening'){
          assert.equal(q.type,'listening');
          assert.equal(q.stimulus,'','Do not reveal the listening answer before submission');
        }
        if(section==='writing'){
          assert.equal(q.type,'writing');
          assert.equal(q.options.length,0);
        }else{
          assert.equal(q.options.length,4,q.id);
          assert.equal(new Set(q.options).size,4,q.id);
          assert.equal(q.options.filter(value=>value===q.answer).length,1,q.id);
        }
      }
      const id=paper.id+'|'+paper.questions.map(q=>q.wordId+':'+q.type).join(',');
      assert.equal(forms.has(id),false,'duplicate full paper');
      forms.add(id);
      if(number===1||number===56)assert.deepEqual(
        bank.build(level,number,vocab).questions.map(q=>q.wordId),
        paper.questions.map(q=>q.wordId),'practice seeds remain deterministic');
    }
  }
  assert.equal(forms.size,224);
  assert.deepEqual([...types].sort(),['hanzi','listening','meaning','pinyin','reading','writing']);
});
test('paper generation rejects invalid levels and incomplete banks',()=>{
  const vocab=words(1);
  for(const id of [0,57,-1,NaN])assert.throws(()=>bank.build(1,id,vocab));
  assert.throws(()=>bank.build(5,1,vocab));
  assert.throws(()=>bank.build(4,1,vocab.slice(0,20)),/incomplete/);
  assert.throws(()=>bank.build(1,1,[]),/incomplete/);
});
test('practice exam is completely EXP-free; rewards remain in the learning flow',()=>{
  const ui=read('assets/hsk-content/hsk-practice-ui-v1.js');
  assert.doesNotMatch(ui,/root\.VDuckieEXP|\.awardEXP\s*\(|\.awardWordMastery\s*\(/);
  assert.doesNotMatch(ui,/\.rpc\s*\(|rpc\(\s*['"]award_exp/);
  assert.match(ui,/function submit\(\)/);
  assert.match(ui,/function finish\(byTime\)/);
  assert.match(ui,/renderResults\(\)/);
  assert.match(ui,/finished=true;review=false;confirmSubmit=false;stopTimer\(\)/);
  assert.match(ui,/if\(missing>0&&!confirmSubmit\)/);
  assert.match(ui,/vduckie-hsk-practice-exams-v2/);
  assert.doesNotMatch(ui,/totalEXP\s*\+=/i);
  const core=read('assets/v90/exp-core-v90.js');
  const hooks=read('assets/v89/exp-learning-hooks-v89.js');
  assert.match(core,/award_word_mastery/);
  assert.match(hooks,/award\("lesson_complete",source\+":lesson"\)/);
});
test('the exam UI shows entire listening/reading/writing sections and grades only after submission',()=>{
  const ui=read('assets/hsk-content/hsk-practice-ui-v1.js');
  const css=read('assets/hsk-content/hsk-practice-ui-v1.css');
  assert.match(ui,/paper\.sections\.map\(function\(section\)/);
  assert.match(ui,/sectionQuestions\(section\)/);
  assert.match(ui,/data-practice-question/);
  assert.match(ui,/data-practice-answer/);
  assert.match(ui,/data-practice-write/);
  assert.match(ui,/data-practice-submit/);
  assert.match(ui,/data-practice-review/);
  assert.match(ui,/data-practice-listen/);
  assert.match(ui,/document\.addEventListener\("vduckie:language-change"/);
  assert.match(css,/\.hsk-exam-question-list/);
  assert.match(css,/\.hsk-exam-section-nav/);
});
test('the full-length exam entry is bundled in current PWA',()=>{
  const graded=read('assets/curriculum/graded-hsk-entry.js');
  const html=read('index.html'),worker=read('service-worker.js');
  assert.match(graded,/data-practice-open/);
  assert.match(graded,/HSK1: 40 câu/);
  assert.match(html,/hsk-practice-bank-v1\.js\?v=2/);
  assert.match(html,/hsk-practice-ui-v1\.js\?v=2/);
  assert.match(html,/hsk-practice-ui-v1\.css\?v=2/);
  assert.match(html,/graded-hsk-entry\.js\?v=public1/);
  assert.match(worker,/vduckie-pwa-v45/);
  assert.match(worker,/hsk-practice-bank-v1\.js\?v=2/);
});
