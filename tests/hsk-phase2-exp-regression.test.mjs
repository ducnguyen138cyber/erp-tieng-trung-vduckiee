import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=path=>fs.readFileSync(path,'utf8');
function setup(){
  const storage=new Map(),events=[];
  const window={localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    document:{dispatchEvent:event=>events.push(event.type)},
    CustomEvent:function(type,options){this.type=type;this.detail=options.detail}};
  vm.runInNewContext(read('assets/hsk-content/hsk-study-journey-v1.js'),window);
  return {journal:window.VDuckieHskStudyJourney,storage,events};
}
test('Phase 2 records a wrong HSK vocabulary answer and makes that exact word due',()=>{
  const {journal}=setup();
  assert.equal(journal.recordWord(3,'hsk3-lesson-01','努力',false,'nǔlì','nỗ lực'),true);
  assert.equal(journal.wordStats().studied,1);
  assert.equal(journal.wordStats().weak,1);
  assert.equal(journal.wordStats().accuracy,0);
  assert.equal(journal.weakWords(3)[0].hanzi,'努力');
  assert.equal(journal.due(3)[0].hanzi,'努力');
});
test('Phase 2 keeps mistaken words weak after one correct recall and clears after spaced review',()=>{
  const {journal,storage}=setup();
  journal.recordWord(3,'hsk3-lesson-01','努力',false,'nǔlì','nỗ lực');
  journal.recordWord(3,'hsk3-lesson-01','努力',true,'nǔlì','nỗ lực');
  assert.equal(journal.wordStats().accuracy,50);
  assert.equal(journal.weakWords(3).length,1);
  journal.reviewWord(3,'努力',true);
  assert.equal(journal.weakWords(3).length,1);
  journal.reviewWord(3,'努力',true);
  assert.equal(journal.weakWords(3).length,0);
  assert.equal(journal.wordStats().attempts,4);
  assert.equal(journal.wordStats().correct,3);
  assert.ok(storage.has(journal.KEY));
});
test('EXP is emitted from verified lesson completion, not from merely opening a lesson',()=>{
  const flow=read('assets/hsk-content/hsk-study-flow-v1.js');
  const hook=read('assets/v89/exp-learning-hooks-v89.js');
  const core=read('assets/v90/exp-core-v90.js');
  assert.match(flow,/if\(result\.ok&&!alreadyCompleted\)/);
  assert.match(flow,/vduckie:hsk-learner-completed/);
  assert.match(hook,/bindPrimaryHSK\(\)/);
  assert.match(hook,/award\("lesson_complete",source\+":lesson"\)/);
  assert.match(hook,/root\.VDuckieHskStudyJourney\.load\(\)/);
  assert.match(hook,/graded:0,correct:0/);
  assert.match(core,/rpc\("award_exp"/);
  assert.doesNotMatch(flow,/awardEXP|p_exp_amount|service_role/);
});
test('Leaderboard uses actual Supabase rows and explains zero activity',()=>{
  const board=read('assets/v90/exp-board-v90.js');
  const ui=read('assets/v90/exp-leaderboard-v90.js');
  assert.match(board,/client\.rpc\("get_leaderboard"/);
  assert.match(board,/rowsData\.every\(function\(row\)/);
  assert.match(board,/Chưa ai nhận EXP/);
  assert.match(ui,/\+20 EXP/);
  assert.doesNotMatch(board,/random\(|Math\.random\(/);
});
test('language-quality audit explicitly counts unreviewed exercises and unresolved content references',()=>{
  const audit=read('scripts/audit-hsk-learning-quality.mjs');
  const runtime=read('assets/hsk-content/hsk-professional-runtime.js');
  assert.match(audit,/unreviewedExercises/);
  assert.match(audit,/missingExerciseRefs/);
  assert.match(runtime,/hsk-pro-quality-note/);
  assert.match(runtime,/linguistic-reviewed/);
});
