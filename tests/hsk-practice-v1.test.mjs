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
test('catalog contains 224 functional exams: 56 each for HSK1–4',()=>{
  assert.equal(bank.LEVELS,4);
  assert.equal(bank.PAPERS_PER_LEVEL,56);
  assert.equal(bank.TOTAL_PAPERS,224);
  assert.equal(bank.QUESTIONS_PER_PAPER,24);
  const forms=[],types=new Set();
  for(let level=1;level<=4;level++){
    const vocab=words(level);
    for(let num=1;num<=56;num++){
      const exam=bank.build(level,num,vocab);
      assert.equal(exam.questionCount,24);
      assert.equal(exam.questions.length,24);
      assert.equal(new Set(exam.questions.map(q=>q.wordId)).size,24,
        'duplicate words in '+exam.id);
      const realQuestionIds=new Set();
      for(const q of exam.questions){
        types.add(q.type);
        assert.ok(q.id&&q.hanzi&&q.answer&&q.prompt,q.id);
        assert.equal(bank.grade(q,q.answer),true,q.id);
        assert.equal(bank.grade(q,'clearly not the correct answer'),false,q.id);
        assert.ok(!realQuestionIds.has(q.id));
        realQuestionIds.add(q.id);
        if(q.type==='writing'){
          assert.equal(q.options.length,0);
        } else {
          assert.equal(q.options.length,4,q.id);
          assert.equal(new Set(q.options).size,4,q.id);
          assert.equal(q.options.filter(opt=>opt===q.answer).length,1,q.id);
        }
        if(q.type==='listening')assert.equal(q.stimulus,'','No listening answer leaks in initial prompt');
      }
      forms.push(exam.id+'|'+exam.questions.map(q=>q.wordId+':'+q.type).join(','));
      assert.equal(bank.build(level,num,vocab).questions.map(q=>q.wordId).join('|'),
        exam.questions.map(q=>q.wordId).join('|'),'paper seed must be stable');
    }
  }
  assert.equal(new Set(forms).size,224);
  assert.deepEqual([...types].sort(),['hanzi','listening','meaning','pinyin','reading','writing']);
});
test('invalid paper numbers and corrupt source files never create empty fake exams',()=>{
  const list=words(1);
  for(const id of [0,57,-1,NaN])assert.throws(()=>bank.build(1,id,list));
  assert.throws(()=>bank.build(5,1,list));
  assert.throws(()=>bank.build(1,1,[]),/incomplete/);
});
test('quiz completion uses actual backend awards and does not manufacture EXP in the client',()=>{
  const ui=read('assets/hsk-content/hsk-practice-ui-v1.js');
  assert.match(ui,/if\(right && root\.VDuckieEXP\)/);
  assert.match(ui,/q\.type==="writing"&&!dictationRewardTried/);
  assert.match(ui,/awardEXP\("dictation_complete"/);
  assert.match(ui,/awardWordMastery\(page\.level,q\.hanzi/);
  assert.match(ui,/if\(!restoreOnly&&pass&&root\.VDuckieEXP/);
  assert.match(ui,/awardEXP\("quiz_pass",source\)/);
  assert.doesNotMatch(ui,/localStorage\.setItem\(["']exp|\.totalEXP\s*\+=/i);
  const core=read('assets/v90/exp-core-v90.js');
  assert.match(core,/if\(row&&row\.awarded&&Number\(row\.exp_awarded\)>0\)/);
  assert.match(core,/floatAward\(row\.exp_awarded,anchor\)/);
  const hooks=read('assets/v89/exp-learning-hooks-v89.js');
  assert.match(hooks,/award\("lesson_complete",source\+":lesson"\)/);
});
test('practice is reachable from the HSK curriculum and precached with PWA v34',()=>{
  const graded=read('assets/curriculum/graded-hsk-entry.js');
  const html=read('index.html'),sw=read('service-worker.js');
  assert.match(graded,/data-practice-open/);
  assert.match(html,/hsk-practice-bank-v1\.js\?v=2/);
  assert.match(html,/hsk-practice-ui-v1\.js\?v=2/);
  assert.match(html,/hsk-practice-ui-v1\.css\?v=2/);
  assert.match(html,/graded-hsk-entry\.js\?v=practice2/);
  assert.match(sw,/vduckie-pwa-v36/);
  assert.match(sw,/hsk-practice-bank-v1\.js\?v=2/);
});
