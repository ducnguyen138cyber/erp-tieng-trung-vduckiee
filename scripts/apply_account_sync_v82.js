const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const syncPath = path.join(root, 'supabase-sync.js');

let index = fs.readFileSync(indexPath, 'utf8');
if (!index.includes('./assets/v82/account-learning-sync-v82.js?v=82.0')) {
  index = index.replace(
    /(<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[^\n]+<\/script>\s*)/,
    '$1  <script src="./assets/v82/account-learning-sync-v82.js?v=82.0"></script>\n'
  );
}
index = index.replace(
  /<script src="\.\/supabase-sync\.js\?v=[^"]+"><\/script>/,
  '<script src="./supabase-sync.js?v=82.0"></script>'
);
if (!index.includes('./assets/v82/account-learning-sync-v82.js?v=82.0') || !index.includes('./supabase-sync.js?v=82.0')) {
  throw new Error('Không thể gắn Account Learning Sync v82 vào index.html.');
}
fs.writeFileSync(indexPath, index, 'utf8');

let sync = fs.readFileSync(syncPath, 'utf8');
sync = sync.replace(
  'if (!row || !row.word_key || row.word_key === progressWordKey) return;',
  'if (!row || !row.word_key || row.word_key === progressWordKey || /^__vduckie_/.test(row.word_key) || /^__system_/.test(String(row.category || ""))) return;'
);
sync = sync.replace(
  'if (mapped.word_key && mapped.word_key !== progressWordKey) payload.push(mapped);',
  'if (mapped.word_key && mapped.word_key !== progressWordKey && !/^__vduckie_/.test(mapped.word_key) && !/^__system_/.test(String(mapped.category || ""))) payload.push(mapped);'
);
sync = sync.replace(
  'if (rows[i].word_key === progressWordKey) remoteProgress = rows[i];\n          else wordRows.push(rows[i]);',
  'if (rows[i].word_key === progressWordKey) remoteProgress = rows[i];\n          else if (/^__vduckie_/.test(String(rows[i].word_key || "")) || /^__system_/.test(String(rows[i].category || ""))) {}\n          else wordRows.push(rows[i]);'
);
for (const required of [
  '/^__vduckie_/.test(row.word_key)',
  '!/^__vduckie_/.test(mapped.word_key)',
  'else if (/^__vduckie_/.test(String(rows[i].word_key || ""))'
]) {
  if (!sync.includes(required)) throw new Error('Thiếu bản vá lọc system row: ' + required);
}
fs.writeFileSync(syncPath, sync, 'utf8');
console.log('Applied full account learning sync v82.0');
