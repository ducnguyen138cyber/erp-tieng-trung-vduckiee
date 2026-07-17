const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets', 'v80', 'hsk-roast-context-v80.1.js'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'community.js'), 'utf8');
const context = { globalThis: null };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context);
const api = context.VDuckieHSKRoastContext;

test('provides five HSK-specific lines for every exercise type', () => {
  for (const kind of ['quizWrong', 'grammarWrong', 'dictationWrong', 'readingWrong', 'speakingWrong', 'writingWrong', 'correct']) {
    assert.equal(api.banks[kind].length, 5, `${kind} must have exactly five lines`);
  }
});

test('HSK roast banks contain no ERP listening vocabulary', () => {
  const all = Object.values(api.banks).flat().join(' ').toLowerCase();
  for (const forbidden of ['erp', 'lĩnh liệu', 'tồn kho', 'nhập kho', 'xuất kho', 'công lệnh', 'bom', 'đơn mua hàng']) {
    assert.equal(all.includes(forbidden), false, `must not contain ERP phrase: ${forbidden}`);
  }
});

test('feedback rotates five contextual lines before repeating', () => {
  const data = { lesson: 'Chào hỏi', word: '你好', answer: 'Xin chào', sentence: '你好！', rule: '吗 đặt cuối câu' };
  const lines = Array.from({ length: 5 }, () => api.nextLine('quizWrong', data));
  assert.equal(new Set(lines).size, 5);
  for (const line of lines) {
    assert.match(line, /Chào hỏi|你好|Xin chào/);
    assert.doesNotMatch(line, /\{\w+\}/);
  }
  assert.equal(api.nextLine('quizWrong', data), lines[0]);
});

test('community loader starts HSK contextual roast from the legacy runtime onload hook', () => {
  assert.match(loader, /runtime-v70\.2\.js\?v=70\.2/);
  assert.match(loader, /hsk-roast-context-v80\.1\.js\?v=80\.1/);
  assert.match(loader, /script\.onload=function\(\)\{loadFeedbackContext\(\);loadHskRoastContextV801\(\);\}/);
});
