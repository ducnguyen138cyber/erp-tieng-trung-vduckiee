import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=(name)=>fs.readFileSync(name,'utf8');
test('home resource catalog uses requested HSK exam tile and no obsolete Adam label',()=>{
  const html=read('app-shell-v88.html');
  assert.match(html,/<strong>200\+<\/strong><span>Đề HSK thực chiến<\/span>/);
  assert.doesNotMatch(html,/60<\/strong><span>Câu Adam/);
});
test('mic Duckie uses a two-wing asset in every centralized reference',()=>{
  const files=['app-shell-v88.html','assets/v95/mascot-manifest-v95.js','service-worker.js'];
  for(const file of files){
    const source=read(file);
    assert.match(source,/duckie-speaking-two-wings-v4\.svg\?v=4\.0/,file);
    assert.doesNotMatch(source,/duckie-speaking-2d-v3\.webp/,file);
  }
  const svg=read('assets/mascot/duckie-speaking-two-wings-v4.svg');
  assert.match(svg,/both wings fully present/);
  assert.match(svg,/microphone body/);
  assert.match(svg,/M127 342/);
  assert.match(svg,/M307 342/);
  const swap=read('assets/design-system/mascot-swap-v1.js');
  assert.match(swap,/role==="speaking"/);
  assert.match(swap,/legacy guard/);
});
test('word mastery +5 EXP happens through a restricted RPC with dedupe and a 50 EXP daily cap',()=>{
  const sql=read('supabase/migrations/20261104_award_hsk_word_mastery_exp.sql');
  assert.match(sql,/auth\.uid\(\)/);
  assert.match(sql,/exp_awarded:=case when awarded then 5/);
  assert.match(sql,/v_today_exp\+5>50/);
  assert.match(sql,/on conflict\(user_id,dedupe_key\) do nothing/);
  assert.match(sql,/grant execute on function public\.award_word_mastery\(integer,text\) to authenticated/);
  assert.match(sql,/revoke all on function public\.award_word_mastery\(integer,text\) from public,anon/);
  assert.doesNotMatch(sql,/service_role/i);
});
test('first correct recall or SRS confirmation emits learner evidence, passive viewing does not',()=>{
  const flow=read('assets/hsk-content/hsk-study-flow-v1.js');
  const hooks=read('assets/v89/exp-learning-hooks-v89.js');
  assert.match(flow,/firstCorrect&&saved/);
  assert.match(flow,/savedReview&&freshRecall/);
  assert.match(flow,/vduckie:hsk-word-mastered/);
  assert.match(hooks,/awardWordMastery/);
  assert.match(hooks,/bindWordMastery\(\)/);
  assert.match(hooks,/account-learning-synced/);
});
test('EXP feedback is a non-modal float and client scripts still parse',()=>{
  const core=read('assets/v90/exp-core-v90.js');
  const css=read('assets/v90/exp-floating-feedback-v91.css');
  assert.match(core,/floatAward\(row\.exp_awarded,anchor\)/);
  assert.match(core,/award_word_mastery/);
  assert.match(css,/pointer-events:none/);
  assert.match(css,/@keyframes vduckie-exp-float-up/);
  assert.doesNotMatch(core,/if \(row\.awarded\) showToast/);
  for(const file of ['assets/v90/exp-core-v90.js','assets/v89/exp-learning-hooks-v89.js','assets/design-system/mascot-swap-v1.js'])
    assert.doesNotThrow(()=>new vm.Script(read(file)),file);
});
test('all new assets have cache-busted public entrypoints and current PWA cache',()=>{
  const index=read('index.html'),worker=read('service-worker.js');
  assert.match(index,/exp-floating-feedback-v91\.css\?v=1/);
  assert.match(index,/exp-core-v90\.js\?v=word-float1/);
  assert.match(index,/mascot-swap-v1\.js\?v=9/);
  assert.match(worker,/vduckie-pwa-v34/);
  assert.match(worker,/duckie-speaking-two-wings-v4\.svg\?v=4\.0/);
});
