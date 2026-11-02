import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const read=(p)=>fs.readFileSync(p,'utf8');
test('HSK 5/6 learner controls remain locked until content review',()=>{
 const graded=read('assets/curriculum/graded-hsk-entry.js');
 const roadmap=read('assets/curriculum/hsk-roadmap-screen.js');
 const runtime=read('assets/hsk-content/hsk-professional-runtime.js');
 new vm.Script(graded);new vm.Script(roadmap);new vm.Script(runtime);
 assert.match(graded,/MAX_LEARNER_HSK=4/);
 assert.match(roadmap,/available=i<=4/);
 assert.match(runtime,/level > 4/);
 assert.match(runtime,/config && level <= 4/);
});
test('review mode raises chat launcher above bottom action controls',()=>{
 const style=read('assets/ai/duckie-chat.css');
 assert.match(style,/body\[data-current-area="review"\] \.duckie-chat-launch/);assert.match(style,/bottom:100px/);
});
test('rank migration uses profile base and zero EXP instead of fake credits',()=>{
 const sql=read('supabase/migrations/leaderboard_include_zero_exp_profiles.sql');
 assert.match(sql,/from public\.profiles p cross join bounds b left join public\.exp_transactions t/);
 assert.match(sql,/coalesce\(sum\(t\.exp_amount\),0\)/);
 assert.match(sql,/get_my_rank/);
});
