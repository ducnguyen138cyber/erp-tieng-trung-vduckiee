const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const syncPath = path.join(root, 'supabase-sync.js');
const profilePath = path.join(root, 'assets', 'v82', 'account-learning-sync-v82.js');

let index = fs.readFileSync(indexPath, 'utf8');
if (!index.includes('./assets/v82/account-learning-sync-v82.js?v=82.1')) {
  index = index.replace(
    /<script src="\.\/assets\/v82\/account-learning-sync-v82\.js\?v=[^"]+"><\/script>/,
    '<script src="./assets/v82/account-learning-sync-v82.js?v=82.1"></script>'
  );
}
if (!index.includes('./assets/v82/account-learning-sync-v82.js?v=82.1')) {
  index = index.replace(
    /(<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[^\n]+<\/script>\s*)/,
    '$1  <script src="./assets/v82/account-learning-sync-v82.js?v=82.1"></script>\n'
  );
}
index = index.replace(
  /<script src="\.\/supabase-sync\.js\?v=[^"]+"><\/script>/,
  '<script src="./supabase-sync.js?v=82.1"></script>'
);
if (!index.includes('./assets/v82/account-learning-sync-v82.js?v=82.1') || !index.includes('./supabase-sync.js?v=82.1')) {
  throw new Error('Không thể gắn Account Learning Sync v82.1 vào index.html.');
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

let profile = fs.readFileSync(profilePath, 'utf8');
profile = profile.replace('var VERSION = "82.0";', 'var VERSION = "82.1";');
const oldSessionHandler = `  function handleSession(nextSession) {
    session = nextSession || null;
    if (!session || !session.user) {
      lastLocalProfile = null;
      return;
    }
    var userId = session.user.id;
    lastLocalProfile = captureProfile(userId, readProfileCache(userId));
    writeProfileCache(userId, lastLocalProfile);
    synchronizeProfile();
  }`;
const isolatedSessionHandler = `  function profileHasFields(profile) {
    return Object.keys(normalizeProfile(profile).fields).length > 0;
  }

  function removeSyncableValues() {
    var keys = [];
    try {
      for (var i = 0; i < root.localStorage.length; i++) {
        var key = root.localStorage.key(i);
        if (isSyncableKey(key)) keys.push(key);
      }
      for (var j = 0; j < keys.length; j++) root.localStorage.removeItem(keys[j]);
    } catch (error) {}
  }

  function switchLocalProfile(nextUserId) {
    var previousUserId = "";
    try { previousUserId = root.localStorage.getItem(ACTIVE_USER_KEY) || ""; } catch (error) {}
    var current = captureProfile(previousUserId || "anonymous", readProfileCache(previousUserId || "anonymous"));
    if (previousUserId) writeProfileCache(previousUserId, current);
    else writeProfileCache("anonymous", current);

    var cached = readProfileCache(nextUserId);
    if (!profileHasFields(cached) && !previousUserId) cached = readProfileCache("anonymous");
    removeSyncableValues();
    applyProfile(cached, nextUserId);
    return cached;
  }

  function handleSession(nextSession) {
    var previousSession = session;
    var previousUserId = previousSession && previousSession.user ? previousSession.user.id : "";
    session = nextSession || null;
    if (!session || !session.user) {
      if (previousUserId) writeProfileCache(previousUserId, captureProfile(previousUserId, lastLocalProfile || readProfileCache(previousUserId)));
      var anonymous = readProfileCache("anonymous");
      removeSyncableValues();
      applyProfile(anonymous, "");
      lastLocalProfile = anonymous;
      return;
    }
    var userId = session.user.id;
    var activeUser = "";
    try { activeUser = root.localStorage.getItem(ACTIVE_USER_KEY) || ""; } catch (error) {}
    var selected = activeUser === userId
      ? readProfileCache(userId)
      : switchLocalProfile(userId);
    lastLocalProfile = captureProfile(userId, selected);
    writeProfileCache(userId, lastLocalProfile);
    synchronizeProfile();
  }`;
if (profile.includes(oldSessionHandler)) profile = profile.replace(oldSessionHandler, isolatedSessionHandler);
for (const required of ['function switchLocalProfile(nextUserId)', 'removeSyncableValues();', 'readProfileCache("anonymous")', 'var VERSION = "82.1";']) {
  if (!profile.includes(required)) throw new Error('Thiếu bản vá tách dữ liệu tài khoản: ' + required);
}
fs.writeFileSync(profilePath, profile, 'utf8');
console.log('Applied isolated full account learning sync v82.1');
