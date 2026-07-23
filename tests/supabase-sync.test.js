const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("supabase-sync.js", "utf8");

function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function element() {
  const classes = new Set();
  return {
    textContent: "",
    className: "",
    disabled: false,
    listeners: {},
    classList: {
      add(value) { classes.add(value); },
      remove(value) { classes.delete(value); },
      contains(value) { return classes.has(value); }
    },
    addEventListener(type, listener) { this.listeners[type] = listener; }
  };
}

async function boot({ configured, signedIn }) {
  const ids = {
    cloudLogin: element(),
    cloudLogout: element(),
    cloudIdentity: element(),
    cloudSyncStatus: element()
  };
  const documentListeners = {};
  const upserts = [];
  const remoteRows = [{
    word_key: "库存",
    hanzi: "库存",
    pinyin: "kù cún",
    near_vi: "",
    meaning_vi: "Tồn kho",
    category: "Kho",
    note: "",
    example_zh: "",
    example_vi: "",
    is_known: true,
    is_saved: false,
    known_updated_at: "2026-07-17T01:00:00.000Z",
    saved_updated_at: null
  }];
  const user = signedIn ? {
    id: "9a65e956-2e3d-4b5f-a393-7c4ce6cdba03",
    email: "student@example.com",
    user_metadata: { full_name: "Student One" }
  } : null;
  const authListeners = [];
  const client = {
    auth: {
      async getSession() { return { data: { session: user ? { user } : null }, error: null }; },
      onAuthStateChange(listener) { authListeners.push(listener); },
      async signInWithOAuth() { return { error: null }; },
      async signOut() { return { error: null }; }
    },
    from(table) {
      assert.equal(table, "user_words");
      return {
        async select() { return { data: remoteRows, error: null }; },
        async upsert(rows, options) {
          upserts.push({ rows, options });
          return { error: null };
        }
      };
    }
  };
  let clientCreates = 0;
  let merged = null;
  const window = {
    VDUCKIE_SUPABASE_CONFIG: configured ? {
      url: "https://project-ref.supabase.co",
      publishableKey: "sb_publishable_test",
      redirectUrl: "https://example.test/app/"
    } : {
      url: "https://YOUR_PROJECT_REF.supabase.co",
      publishableKey: "YOUR_SUPABASE_PUBLISHABLE_KEY"
    },
    supabase: {
      createClient() { clientCreates += 1; return client; }
    },
    VDuckieLocalLearning: {
      mergeRemote(rows) { merged = rows; },
      prepareForCloud() {
        return [{
          word_key: "库存",
          hanzi: "库存",
          is_known: true,
          is_saved: false,
          known_updated_at: "2026-07-17T01:00:00.000Z"
        }];
      }
    },
    location: {
      hostname: "example.test",
      origin: "https://example.test",
      pathname: "/app/",
      href: "https://example.test/app/?area=erp"
    },
    history: { replaceState() {} },
    addEventListener() {},
    setTimeout,
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {}
  };
  const context = {
    window,
    document: {
      readyState: "complete",
      getElementById(id) { return ids[id] || null; },
      addEventListener(type, listener) { documentListeners[type] = listener; }
    },
    localStorage: storage(),
    sessionStorage: storage(),
    navigator: { onLine: true },
    history: window.history,
    URL,
    console,
    setTimeout,
    clearTimeout
  };
  vm.runInNewContext(source, context, { filename: "supabase-sync.js" });
  await new Promise((resolve) => setTimeout(resolve, 20));
  return { ids, clientCreates, merged, upserts, documentListeners };
}

(async () => {
  const disabled = await boot({ configured: false, signedIn: false });
  assert.equal(disabled.clientCreates, 0);
  assert.equal(disabled.ids.cloudLogin.disabled, true);
  assert.match(disabled.ids.cloudLogin.textContent, /Chưa cấu hình/);

  const active = await boot({ configured: true, signedIn: true });
  assert.equal(active.clientCreates, 1);
  assert.equal(active.ids.cloudIdentity.textContent, "Student One");
  assert.deepEqual(Array.from(active.merged, (row) => row.word_key), ["库存"]);
  assert.equal(active.upserts.length, 2);
  const wordUpsert = active.upserts.find((entry) => entry.rows.some((row) => row.word_key === "库存"));
  const progressUpsert = active.upserts.find((entry) => entry.rows.some((row) => row.word_key === "__vduckie_hsk_progress_v1__"));
  assert.ok(wordUpsert);
  assert.ok(progressUpsert);
  assert.equal(wordUpsert.options.onConflict, "user_id,word_key");
  assert.equal(wordUpsert.rows[0].user_id, "9a65e956-2e3d-4b5f-a393-7c4ce6cdba03");
  assert.equal(active.ids.cloudSyncStatus.textContent, "Đã đồng bộ từ vựng và tiến độ");

  const sql = fs.readFileSync("supabase/schema.sql", "utf8");
  assert.match(sql, /enable row level security/i);
  assert.equal((sql.match(/\(select auth\.uid\(\)\) = user_id/g) || []).length, 5);
  assert.match(sql, /revoke all on table public\.user_words from anon/i);

  console.log("Supabase sync tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
