import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('dictionary detail and free tutor use the blue and white surfaces', () => {
  const dictionary = read('assets/search/header-chinese-search.css');
  const assistant = read('assets/ai/free-learning-assistant.css');
  const extras = read('assets/search/dictionary-extras.css');
  assert.match(dictionary, /\.vsearch-detail\{box-sizing:border-box/);
  assert.match(dictionary, /\.vsearch-example-pinyin\{display:block/);
  assert.match(assistant, /\.va-panel\{box-sizing:border-box/);
  assert.match(assistant, /\.va-tabs button\[aria-current="page"\]/);
  assert.match(extras, /\.vsearch-notebook\{background:#fff/);
});

test('ERP, HSK and unified dictionary do not display approximate Vietnamese pronunciation', () => {
  const shell = read('app-shell-v88.html');
  const hsk = read('hsk-lessons.js');
  const dictionary = read('assets/v79/unified-dictionary-v79.part3.txt');
  assert.doesNotMatch(shell, /Gần âm:|Âm gần Việt|Đọc gần:/i);
  assert.doesNotMatch(hsk, /Gần âm:/);
  assert.doesNotMatch(dictionary, /dictionary-near|Đọc gần:|cách đọc gần/i);
  assert.match(shell, /id="newNear" type="hidden"/);
  assert.match(shell, /id="communityNear" type="hidden"/);
  assert.match(shell, /\$\("quizPinyin"\)\.textContent=t\[1\]/);
  assert.match(read('assets/search/header-chinese-search.js'), /node\.textContent=generated&&generated\.pinyin\?generated\.pinyin/);
});

test('ranking and HSK support align without changing any learning state', () => {
  const css = read('assets/design-system/remaining-interface-polish-20261103.css');
  assert.match(css, /#leaderboard \.exp-board-head/);
  assert.match(css, /#leaderboard \.exp-row/);
  assert.match(css, /#hskJourney #hskLevels/);
  assert.match(css, /#hskJourney \.hsk-levels::before/);
  assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length);
  assert.doesNotMatch(css, /localStorage|sessionStorage|supabase|fetch\(/i);
});

test('PWA loads exact refreshed visual assets', () => {
  const index = read('index.html');
  const worker = read('service-worker.js');
  assert.match(index, /remaining-interface-polish-20261103\.css\?v=1/);
  assert.match(index, /header-chinese-search\.css\?v=2/);
  assert.match(index, /free-learning-assistant\.css\?v=2/);
  assert.match(worker, /vduckie-pwa-v24/);
  assert.match(worker, /remaining-interface-polish-20261103\.css\?v=1/);
});
