const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const entry = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const core = fs.readFileSync(path.join(root, 'assets/v89/exp-core-v89.js'), 'utf8');
const board = fs.readFileSync(path.join(root, 'assets/v89/exp-board-v89.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'assets/v89/exp-leaderboard-v89.js'), 'utf8');
const hooks = fs.readFileSync(path.join(root, 'assets/v89/exp-learning-hooks-v89.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/v89/exp-leaderboard-v89.css'), 'utf8');
const sql = fs.readFileSync(path.join(root, 'supabase/migrations/create_exp_leaderboard.sql'), 'utf8');
const frontend = [core, board, ui, hooks].join('\n');

test('entry loads the current EXP assets without changing static mascot architecture', () => {
  assert.match(entry, /app-shell-v88\.html\?v=99\.0/);
  assert.match(entry, /vduckie-welcome\.webp\?v=96\.0/);
  assert.match(entry, /exp-system-v90\.css\?v=90\.1/);
  assert.match(entry, /exp-core-v90\.js\?v=90\.0/);
  assert.match(entry, /exp-board-v90\.js\?v=90\.0/);
  assert.match(entry, /exp-leaderboard-v90\.js\?v=90\.0/);
  assert.match(entry, /exp-learning-hooks-v89\.js\?v=90\.0/);
});

test('frontend exposes activity APIs but never accepts an EXP amount', () => {
  assert.match(core, /awardEXP\(activityCode, sourceId\)/);
  assert.match(core, /getCurrentUserEXP/);
  assert.match(core, /refreshLeaderboard/);
  assert.doesNotMatch(frontend, /addEXP\s*\(/);
  assert.doesNotMatch(frontend, /service_role/i);
  assert.match(core, /metadata\.full_name \|\| metadata\.name/);
  assert.match(core, /metadata\.avatar_url \|\| metadata\.picture/);
  assert.doesNotMatch(frontend, /user\.email/);
  assert.match(ui, /expAccountName/);
  assert.match(ui, /expAccountAvatar/);
});

test('learning events connect HSK, ERP, dictation, daily goal and review', () => {
  assert.match(hooks, /vduckie:erp-lesson-progress/);
  assert.match(hooks, /section-complete/);
  assert.match(hooks, /dictation-check/);
  assert.match(hooks, /\.hsk-result\.pass/);
  assert.match(hooks, /daily_goal/);
  assert.match(hooks, /lesson_review/);
  assert.match(hooks, /knownERP = readERP\(\)/);
  assert.match(hooks, /String\(previous\.completed_at/);
});

test('SQL fixes EXP server-side and protects tables with RLS', () => {
  assert.match(sql, /when 'lesson_complete' then v_amount := 20/);
  assert.match(sql, /when 'quiz_pass' then v_amount := 15/);
  assert.match(sql, /when 'dictation_complete' then v_amount := 10/);
  assert.match(sql, /when 'daily_goal' then v_amount := 10/);
  assert.match(sql, /when 'lesson_review' then v_amount := 2/);
  assert.match(sql, /unique \(user_id, dedupe_key\)/i);
  assert.match(sql, /Asia\/Ho_Chi_Minh/);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /There is intentionally no direct insert\/update\/delete policy/);
  assert.doesNotMatch(sql, /p_exp_amount/i);
  assert.match(sql, /returns table\(rank bigint, display_name text, avatar_url text, exp bigint\)/);
  assert.doesNotMatch(board, /row\.user_id/);
  assert.match(sql, /invalid lesson source/);
  assert.match(sql, /revoke all on function public\.profile_values_from_metadata\(uuid\) from public/);
});

test('leaderboard UI supports responsive top three and top 100 list', () => {
  assert.match(css, /\.exp-podium/);
  assert.match(css, /grid-template-columns:1fr 1\.08fr 1fr/);
  assert.match(css, /text-overflow:ellipsis/);
  assert.match(board, /p_limit: 100/);
  assert.match(board, /Hạng của bạn/);
  assert.match(ui, /Tuần này/);
  assert.match(ui, /Tháng này/);
  assert.match(ui, />Tổng</);
});
