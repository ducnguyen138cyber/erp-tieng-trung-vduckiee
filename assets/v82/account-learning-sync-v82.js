(function (root) {
  "use strict";

  var VERSION = "82.0";
  var PROFILE_WORD_KEY = "__vduckie_learning_profile_v2__";
  var PROFILE_CATEGORY = "__system_learning_profile__";
  var CACHE_PREFIX = "vduckie-learning-profile-cache-v2:";
  var ACTIVE_USER_KEY = "vduckie-learning-profile-active-user-v2";
  var RELOAD_GUARD_PREFIX = "vduckie-learning-profile-applied-v2:";
  var client = null;
  var session = null;
  var started = false;
  var applying = false;
  var pollTimer = null;
  var uploadTimer = null;
  var lastLocalProfile = null;

  var EXPLICIT_KEYS = {
    "vduckie-erp-v74-progress": true,
    "vduckie-roast-enabled": true,
    "vduckie-hsk-roast-enabled": true,
    "vduckie-hsk-section-progress-v1": true,
    "vduckie-erp-study-progress-v1": true,
    "vduckie-exercise-results-v1": true,
    "vduckie-review-srs-v1": true,
    "vduckie-study-activity-v1": true,
    "vduckie-study-goals-v1": true,
    "vduckie-learning-settings-v1": true
  };

  var EXCLUDED_KEYS = {
    "vduckie-cloud-queue-v1": true,
    "vduckie-hsk-active-user-v1": true,
    "vduckie-learning-profile-active-user-v2": true,
    "erp-hsk-progress-v2": true,
    "erp-hsk-state-v2": true,
    "vduckie-hsk-progress-meta-v1": true
  };

  function text(value) {
    return String(value == null ? "" : value);
  }

  function now() {
    return Date.now ? Date.now() : new Date().getTime();
  }

  function parseJson(value, fallback) {
    try {
      var parsed = JSON.parse(value || "");
      return parsed == null ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function clone(value) {
    return parseJson(JSON.stringify(value), value);
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function stableStringify(value) {
    if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
    if (isPlainObject(value)) {
      var keys = Object.keys(value).sort();
      var parts = [];
      for (var i = 0; i < keys.length; i++) parts.push(JSON.stringify(keys[i]) + ":" + stableStringify(value[keys[i]]));
      return "{" + parts.join(",") + "}";
    }
    return JSON.stringify(value);
  }

  function hash(value) {
    value = text(value);
    var result = 2166136261;
    for (var i = 0; i < value.length; i++) {
      result ^= value.charCodeAt(i);
      result += (result << 1) + (result << 4) + (result << 7) + (result << 8) + (result << 24);
    }
    return (result >>> 0).toString(36);
  }

  function isSyncableKey(key) {
    key = text(key);
    if (!key || EXCLUDED_KEYS[key]) return false;
    if (key.indexOf(CACHE_PREFIX) === 0 || key.indexOf("vduckie-hsk-account-cache-v1:") === 0) return false;
    if (/^(sb-|supabase\.|supabase-|vduckie-auth-|vduckie-cloud-|vduckie-learning-profile-)/i.test(key)) return false;
    if (EXPLICIT_KEYS[key]) return true;
    return /^(vduckie|erp)-(?:hsk-section|erp-study|lesson|course|module|quiz|exercise|result|weak|review|srs|streak|activity|goal|setting|preference|personal|custom|note|history|achievement|roast)/i.test(key);
  }

  function normalizeField(field) {
    if (!field || typeof field !== "object") return { value: null, updatedAt: 0 };
    return {
      value: field.value === null ? null : text(field.value),
      updatedAt: Math.max(0, Number(field.updatedAt) || 0)
    };
  }

  function normalizeProfile(profile) {
    profile = profile && typeof profile === "object" ? profile : {};
    var output = { version: 2, fields: {}, updatedAt: Math.max(0, Number(profile.updatedAt) || 0) };
    var fields = profile.fields && typeof profile.fields === "object" ? profile.fields : {};
    var keys = Object.keys(fields);
    for (var i = 0; i < keys.length; i++) {
      if (isSyncableKey(keys[i])) {
        output.fields[keys[i]] = normalizeField(fields[keys[i]]);
        output.updatedAt = Math.max(output.updatedAt, output.fields[keys[i]].updatedAt);
      }
    }
    return output;
  }

  function mergeJsonValues(leftText, rightText) {
    var left = parseJson(leftText, null);
    var right = parseJson(rightText, null);
    if (left === null || right === null) return rightText;
    if (Array.isArray(left) && Array.isArray(right)) {
      var seen = {};
      var output = [];
      var joined = left.concat(right);
      for (var i = 0; i < joined.length; i++) {
        var signature = stableStringify(joined[i]);
        if (!seen[signature]) {
          seen[signature] = true;
          output.push(joined[i]);
        }
      }
      return JSON.stringify(output);
    }
    if (isPlainObject(left) && isPlainObject(right)) {
      var merged = clone(left) || {};
      var keys = Object.keys(right);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        if (isPlainObject(merged[key]) && isPlainObject(right[key])) {
          merged[key] = parseJson(mergeJsonValues(JSON.stringify(merged[key]), JSON.stringify(right[key])), right[key]);
        } else if (Array.isArray(merged[key]) && Array.isArray(right[key])) {
          merged[key] = parseJson(mergeJsonValues(JSON.stringify(merged[key]), JSON.stringify(right[key])), right[key]);
        } else if (typeof merged[key] === "undefined") {
          merged[key] = right[key];
        } else if (/completed|done|known|saved/i.test(key) && typeof merged[key] === "boolean" && typeof right[key] === "boolean") {
          merged[key] = merged[key] || right[key];
        } else if (/best|highest|max/i.test(key) && typeof merged[key] === "number" && typeof right[key] === "number") {
          merged[key] = Math.max(merged[key], right[key]);
        } else {
          merged[key] = right[key];
        }
      }
      return JSON.stringify(merged);
    }
    return rightText;
  }

  function shouldUnionKey(key) {
    return /progress|lesson|course|module|exercise|result|weak|review|srs|streak|activity|personal|custom|note|history|achievement/i.test(key) && !/state|setting|preference/i.test(key);
  }

  function mergeProfiles(localValue, remoteValue) {
    var local = normalizeProfile(localValue);
    var remote = normalizeProfile(remoteValue);
    var merged = { version: 2, fields: {}, updatedAt: 0 };
    var keys = Object.keys(local.fields).concat(Object.keys(remote.fields));
    var seen = {};
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (seen[key]) continue;
      seen[key] = true;
      var left = local.fields[key];
      var right = remote.fields[key];
      if (!left) merged.fields[key] = right;
      else if (!right) merged.fields[key] = left;
      else if (right.updatedAt > left.updatedAt) merged.fields[key] = right;
      else if (left.updatedAt > right.updatedAt) merged.fields[key] = left;
      else if (left.value === right.value) merged.fields[key] = left;
      else if (shouldUnionKey(key) && left.value !== null && right.value !== null) {
        merged.fields[key] = { value: mergeJsonValues(left.value, right.value), updatedAt: left.updatedAt };
      } else {
        merged.fields[key] = right;
      }
      merged.updatedAt = Math.max(merged.updatedAt, merged.fields[key].updatedAt);
    }
    return merged;
  }

  function cacheKey(userId) {
    return CACHE_PREFIX + (userId || "anonymous");
  }

  function readProfileCache(userId) {
    try {
      return normalizeProfile(parseJson(root.localStorage.getItem(cacheKey(userId)), {}));
    } catch (error) {
      return normalizeProfile({});
    }
  }

  function writeProfileCache(userId, profile) {
    try {
      root.localStorage.setItem(cacheKey(userId), JSON.stringify(normalizeProfile(profile)));
    } catch (error) {}
  }

  function captureProfile(userId, previous) {
    previous = normalizeProfile(previous || readProfileCache(userId));
    var profile = { version: 2, fields: {}, updatedAt: previous.updatedAt };
    var seen = {};
    var currentTime = now();
    try {
      for (var i = 0; i < root.localStorage.length; i++) {
        var key = root.localStorage.key(i);
        if (!isSyncableKey(key)) continue;
        seen[key] = true;
        var value = root.localStorage.getItem(key);
        var oldField = previous.fields[key];
        var updatedAt = oldField && oldField.value === value ? oldField.updatedAt : currentTime;
        profile.fields[key] = { value: value, updatedAt: updatedAt || currentTime };
        profile.updatedAt = Math.max(profile.updatedAt, profile.fields[key].updatedAt);
      }
    } catch (error) {}
    var oldKeys = Object.keys(previous.fields);
    for (var j = 0; j < oldKeys.length; j++) {
      if (!seen[oldKeys[j]]) {
        profile.fields[oldKeys[j]] = previous.fields[oldKeys[j]].value === null
          ? previous.fields[oldKeys[j]]
          : { value: null, updatedAt: currentTime };
        profile.updatedAt = Math.max(profile.updatedAt, profile.fields[oldKeys[j]].updatedAt);
      }
    }
    return normalizeProfile(profile);
  }

  function profileRow(profile, userId) {
    profile = normalizeProfile(profile);
    var iso = profile.updatedAt ? new Date(profile.updatedAt).toISOString() : null;
    return {
      user_id: userId,
      word_key: PROFILE_WORD_KEY,
      hanzi: "LEARNING_PROFILE",
      pinyin: "",
      near_vi: "",
      meaning_vi: "Hồ sơ học tập đồng bộ theo tài khoản",
      category: PROFILE_CATEGORY,
      note: JSON.stringify(profile),
      example_zh: "",
      example_vi: "",
      is_known: false,
      is_saved: false,
      known_updated_at: iso,
      saved_updated_at: iso
    };
  }

  function parseProfileRow(row) {
    if (!row || row.word_key !== PROFILE_WORD_KEY) return normalizeProfile({});
    return normalizeProfile(parseJson(row.note, {}));
  }

  function setStatus(message, kind) {
    if (!root.document) return;
    var element = root.document.getElementById("cloudSyncStatus");
    if (!element) return;
    element.textContent = message;
    element.className = "cloud-sync-status" + (kind ? " " + kind : "");
  }

  function applyProfile(profile, userId) {
    profile = normalizeProfile(profile);
    var changed = [];
    applying = true;
    try {
      var keys = Object.keys(profile.fields);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var field = profile.fields[key];
        var current = root.localStorage.getItem(key);
        if (field.value === null) {
          if (current !== null) {
            root.localStorage.removeItem(key);
            changed.push(key);
          }
        } else if (current !== field.value) {
          root.localStorage.setItem(key, field.value);
          changed.push(key);
        }
      }
      writeProfileCache(userId, profile);
      root.localStorage.setItem(ACTIVE_USER_KEY, userId || "");
    } catch (error) {}
    applying = false;
    lastLocalProfile = profile;
    if (root.document) {
      try {
        root.document.dispatchEvent(new CustomEvent("vduckie:account-learning-synced", {
          detail: { version: VERSION, userId: userId, changedKeys: changed.slice(), profile: profile }
        }));
      } catch (error) {}
    }
    return changed;
  }

  function remoteWinningKeys(localValue, remoteValue) {
    var local = normalizeProfile(localValue);
    var remote = normalizeProfile(remoteValue);
    var output = [];
    var keys = Object.keys(remote.fields);
    for (var i = 0; i < keys.length; i++) {
      var left = local.fields[keys[i]];
      if (!left || remote.fields[keys[i]].updatedAt > left.updatedAt) output.push(keys[i]);
    }
    return output;
  }

  function maybeReload(userId, profile, changed, winning) {
    if (!changed.length || !winning.length || !root.location || typeof root.location.reload !== "function") return;
    var important = false;
    for (var i = 0; i < changed.length; i++) {
      if (/progress|lesson|course|module|section|setting|preference|roast/i.test(changed[i])) important = true;
    }
    if (!important) return;
    var signature = hash(stableStringify(profile));
    var key = RELOAD_GUARD_PREFIX + userId;
    try {
      if (root.sessionStorage.getItem(key) === signature) return;
      root.sessionStorage.setItem(key, signature);
    } catch (error) {}
    root.setTimeout(function () { root.location.reload(); }, 250);
  }

  function upsertProfile(profile) {
    if (!client || !session || !session.user || !root.navigator || !root.navigator.onLine) return Promise.resolve();
    return client.from("user_words").upsert([profileRow(profile, session.user.id)], {
      onConflict: "user_id,word_key"
    }).then(function (result) {
      if (result.error) throw result.error;
    });
  }

  function fetchRemoteProfile() {
    if (!client || !session || !session.user) return Promise.resolve(null);
    return client.from("user_words")
      .select("word_key,note,category,known_updated_at,saved_updated_at")
      .eq("word_key", PROFILE_WORD_KEY)
      .then(function (result) {
        if (result.error) throw result.error;
        return result.data && result.data.length ? result.data[0] : null;
      });
  }

  function synchronizeProfile() {
    if (!client || !session || !session.user) return Promise.resolve();
    var userId = session.user.id;
    var cached = readProfileCache(userId);
    var local = captureProfile(userId, cached);
    setStatus("Đang đồng bộ toàn bộ dữ liệu học…", "waiting");
    return fetchRemoteProfile().then(function (row) {
      var remote = parseProfileRow(row);
      var winning = remoteWinningKeys(local, remote);
      var merged = mergeProfiles(local, remote);
      var changed = applyProfile(merged, userId);
      return upsertProfile(merged).then(function () {
        setStatus("Đã đồng bộ toàn bộ dữ liệu học", "good");
        maybeReload(userId, merged, changed, winning);
      });
    }).catch(function (error) {
      console.error("VDuckie full learning profile sync failed", error);
      setStatus(root.navigator && root.navigator.onLine ? "Lỗi đồng bộ dữ liệu học" : "Chờ có mạng", root.navigator && root.navigator.onLine ? "bad" : "waiting");
    });
  }

  function scheduleUpload() {
    if (!session || !session.user || applying) return;
    root.clearTimeout(uploadTimer);
    uploadTimer = root.setTimeout(function () {
      var next = captureProfile(session.user.id, lastLocalProfile || readProfileCache(session.user.id));
      if (stableStringify(next) === stableStringify(lastLocalProfile || {})) return;
      lastLocalProfile = next;
      writeProfileCache(session.user.id, next);
      upsertProfile(next).then(function () {
        setStatus("Đã đồng bộ toàn bộ dữ liệu học", "good");
      }).catch(function (error) {
        console.error("VDuckie profile upload failed", error);
        setStatus("Lỗi đồng bộ dữ liệu học", "bad");
      });
    }, 600);
  }

  function updateJsonKey(key, updater) {
    var current = parseJson(root.localStorage.getItem(key), {});
    var next = updater(isPlainObject(current) ? current : {}) || current;
    root.localStorage.setItem(key, JSON.stringify(next));
    scheduleUpload();
    return next;
  }

  function dateKey(value) {
    var date = value || new Date();
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart ? String(date.getMonth() + 1).padStart(2, "0") : (date.getMonth() + 1 < 10 ? "0" : "") + (date.getMonth() + 1);
    var day = String(date.getDate()).padStart ? String(date.getDate()).padStart(2, "0") : (date.getDate() < 10 ? "0" : "") + date.getDate();
    return year + "-" + month + "-" + day;
  }

  function calculateStreak(dates, today) {
    var streak = 0;
    var cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (dates[dateKey(cursor)]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function touchActivity(kind) {
    var currentTime = now();
    updateJsonKey("vduckie-study-activity-v1", function (activity) {
      activity.version = 1;
      activity.dates = isPlainObject(activity.dates) ? activity.dates : {};
      var today = dateKey(new Date(currentTime));
      activity.dates[today] = Number(activity.dates[today] || 0) + 1;
      activity.lastStudyAt = currentTime;
      activity.lastActivity = kind || "study";
      activity.totalActions = Number(activity.totalActions || 0) + 1;
      activity.currentStreak = calculateStreak(activity.dates, new Date(currentTime));
      activity.longestStreak = Math.max(Number(activity.longestStreak || 0), activity.currentStreak);
      return activity;
    });
  }

  function ensureDefaults() {
    if (!root.localStorage.getItem("vduckie-study-goals-v1")) {
      root.localStorage.setItem("vduckie-study-goals-v1", JSON.stringify({ version: 1, dailyWords: 10, dailyMinutes: 15, dailyLessons: 1, updatedAt: now() }));
    }
    updateJsonKey("vduckie-learning-settings-v1", function (settings) {
      settings.version = 1;
      settings.roastErp = root.localStorage.getItem("vduckie-roast-enabled") !== "0";
      settings.roastHsk = root.localStorage.getItem("vduckie-hsk-roast-enabled") !== "0";
      settings.updatedAt = now();
      return settings;
    });
  }

  function activeHskLessonId() {
    var state = parseJson(root.localStorage.getItem("erp-hsk-state-v2"), { level: 0, lesson: 0 });
    var curriculum = root.HSKCurriculum;
    if (curriculum && curriculum.levels && curriculum.levels[state.level] && curriculum.levels[state.level][state.lesson]) {
      var lesson = curriculum.levels[state.level][state.lesson];
      return text(lesson.id || ("hsk" + state.level + "-" + state.lesson));
    }
    return "hsk" + Number(state.level || 0) + "-" + Number(state.lesson || 0);
  }

  function sectionName(button) {
    if (!button) return "lesson";
    var action = button.getAttribute("data-hsk-action") || "";
    if (action.indexOf("dictation") !== -1) return "dictation";
    if (button.hasAttribute("data-hsk-option")) return "quiz";
    if (button.hasAttribute("data-hsk-reading-option")) return "reading";
    if (button.hasAttribute("data-v62-speaking-start") || button.hasAttribute("data-v62-speaking-listen")) return "speaking";
    if (button.hasAttribute("data-v62-order-check")) return "grammar";
    var section = button.closest && button.closest(".hsk-section");
    var heading = section && section.querySelector("h4");
    var label = text(heading && heading.textContent).toLowerCase();
    if (/hán tự|nét|viết/.test(label)) return "hanzi";
    if (/từ mới|từ vựng/.test(label)) return "vocabulary";
    if (/nghe/.test(label)) return "listening";
    if (/đọc/.test(label)) return "reading";
    if (/nói|hskk/.test(label)) return "speaking";
    if (/ngữ pháp/.test(label)) return "grammar";
    return "lesson";
  }

  function recordHskSection(section, completed) {
    var lessonId = activeHskLessonId();
    var currentTime = now();
    updateJsonKey("vduckie-hsk-section-progress-v1", function (all) {
      all.version = 1;
      all.lessons = isPlainObject(all.lessons) ? all.lessons : {};
      var lesson = isPlainObject(all.lessons[lessonId]) ? all.lessons[lessonId] : { sections: {} };
      lesson.sections = isPlainObject(lesson.sections) ? lesson.sections : {};
      var item = isPlainObject(lesson.sections[section]) ? lesson.sections[section] : {};
      item.visits = Number(item.visits || 0) + 1;
      item.lastVisitedAt = currentTime;
      if (completed) item.completedAt = currentTime;
      lesson.sections[section] = item;
      lesson.lastSection = section;
      lesson.updatedAt = currentTime;
      all.lessons[lessonId] = lesson;
      all.updatedAt = currentTime;
      return all;
    });
    touchActivity("hsk:" + section);
  }

  function recordExercise(context, type, correct, word, score) {
    var currentTime = now();
    var key = context + ":" + activeHskLessonId() + ":" + type;
    updateJsonKey("vduckie-exercise-results-v1", function (all) {
      all.version = 1;
      all.items = isPlainObject(all.items) ? all.items : {};
      var item = isPlainObject(all.items[key]) ? all.items[key] : {};
      item.attempts = Number(item.attempts || 0) + 1;
      item.correct = Number(item.correct || 0) + (correct ? 1 : 0);
      item.wrong = Number(item.wrong || 0) + (correct ? 0 : 1);
      item.lastResult = correct ? "correct" : "wrong";
      item.lastAt = currentTime;
      if (typeof score === "number") item.bestScore = Math.max(Number(item.bestScore || 0), score);
      all.items[key] = item;
      all.updatedAt = currentTime;
      return all;
    });
    if (word) recordReviewWord(word, correct, context);
    touchActivity(context + ":" + type);
  }

  function recordReviewWord(word, correct, source) {
    word = text(word).trim();
    if (!word) return;
    var currentTime = now();
    updateJsonKey("vduckie-review-srs-v1", function (all) {
      all.version = 1;
      all.words = isPlainObject(all.words) ? all.words : {};
      var item = isPlainObject(all.words[word]) ? all.words[word] : { intervalDays: 0, correctCount: 0, wrongCount: 0 };
      if (correct) {
        item.correctCount = Number(item.correctCount || 0) + 1;
        item.intervalDays = Math.max(1, Number(item.intervalDays || 0) * 2 || 1);
        item.difficulty = Math.max(0, Number(item.difficulty || 0) - 1);
      } else {
        item.wrongCount = Number(item.wrongCount || 0) + 1;
        item.intervalDays = 1;
        item.difficulty = Number(item.difficulty || 0) + 1;
      }
      item.source = source;
      item.lastReviewedAt = currentTime;
      item.nextReviewAt = currentTime + item.intervalDays * 86400000;
      all.words[word] = item;
      all.updatedAt = currentTime;
      return all;
    });
  }

  function handleStudyClick(event) {
    var button = event.target && event.target.closest ? event.target.closest("button") : null;
    if (!button) return;
    if (button.closest && button.closest("#hskLesson")) {
      var section = sectionName(button);
      recordHskSection(section, false);
      if (button.hasAttribute("data-hsk-option")) {
        root.setTimeout(function () {
          var card = button.closest(".hsk-quiz");
          var correct = button.classList.contains("correct");
          var wordNode = card && card.querySelector(".hsk-quiz-prompt strong");
          recordExercise("hsk", "quiz", correct, wordNode && wordNode.textContent);
          if (correct) recordHskSection("quiz", true);
        }, 220);
      } else if (button.getAttribute("data-hsk-action") === "dictation-check") {
        root.setTimeout(function () {
          var feedback = root.document.getElementById("hskDictationFeedback");
          var answer = button.getAttribute("data-answer") || "";
          var correct = feedback && /good|chính xác|đúng/i.test((feedback.className || "") + " " + (feedback.textContent || "")) && !/bad|sai|chưa đúng/i.test((feedback.className || "") + " " + (feedback.textContent || ""));
          recordExercise("hsk", "dictation", correct, answer);
          if (correct) recordHskSection("dictation", true);
        }, 300);
      } else if (button.hasAttribute("data-hsk-reading-option")) {
        var readingCorrect = button.getAttribute("data-correct") === "1";
        recordExercise("hsk", "reading", readingCorrect, "");
        if (readingCorrect) recordHskSection("reading", true);
      } else if (button.hasAttribute("data-v62-order-check")) {
        root.setTimeout(function () {
          var card = button.closest("[data-v62-grammar-trap]");
          var feedback = card && card.querySelector("[data-v62-order-feedback]");
          var correct = feedback && /good|chính xác|đúng/i.test((feedback.className || "") + " " + (feedback.textContent || "")) && !/bad|sai|chưa đúng/i.test((feedback.className || "") + " " + (feedback.textContent || ""));
          recordExercise("hsk", "grammar", correct, "");
          if (correct) recordHskSection("grammar", true);
        }, 300);
      }
      return;
    }
    if (button.closest && button.closest("#erpLessonApp")) {
      touchActivity("erp:lesson");
      if (button.classList.contains("erp-module-option")) {
        root.setTimeout(function () {
          var card = button.closest(".erp-module-quiz");
          var wordNode = card && card.querySelector(".erp-module-question strong");
          recordExercise("erp", "quiz", button.classList.contains("correct"), wordNode && wordNode.textContent);
        }, 220);
      }
    }
  }

  function handleLearningChange(event) {
    var detail = event && event.detail ? event.detail : {};
    var word = detail.word_key || detail.hanzi || "";
    if (word) recordReviewWord(word, !!detail.is_known, "dictionary");
    touchActivity("dictionary");
  }

  function startTracking() {
    ensureDefaults();
    if (root.document) {
      root.document.addEventListener("click", handleStudyClick, true);
      root.document.addEventListener("vduckie:learning-change", handleLearningChange);
      root.document.addEventListener("vduckie:erp-lesson-progress", function (event) {
        root.localStorage.setItem("vduckie-erp-study-progress-v1", JSON.stringify({ version: 1, lessons: event.detail || {}, updatedAt: now() }));
        touchActivity("erp:completed");
      });
      root.document.addEventListener("vduckie:hsk-progress-synced", scheduleUpload);
    }
    root.addEventListener("storage", function (event) {
      if (event && isSyncableKey(event.key)) scheduleUpload();
    });
    root.addEventListener("online", synchronizeProfile);
    root.addEventListener("beforeunload", function () {
      if (session && session.user) {
        var profile = captureProfile(session.user.id, lastLocalProfile || readProfileCache(session.user.id));
        writeProfileCache(session.user.id, profile);
      }
    });
    pollTimer = root.setInterval(function () {
      if (!session || !session.user || applying) return;
      var next = captureProfile(session.user.id, lastLocalProfile || readProfileCache(session.user.id));
      if (stableStringify(next) !== stableStringify(lastLocalProfile || {})) scheduleUpload();
    }, 800);
  }

  function handleSession(nextSession) {
    session = nextSession || null;
    if (!session || !session.user) {
      lastLocalProfile = null;
      return;
    }
    var userId = session.user.id;
    lastLocalProfile = captureProfile(userId, readProfileCache(userId));
    writeProfileCache(userId, lastLocalProfile);
    synchronizeProfile();
  }

  function attachClient(nextClient) {
    if (!nextClient || started) return;
    started = true;
    client = nextClient;
    startTracking();
    client.auth.getSession().then(function (result) {
      if (!result.error) handleSession(result.data.session);
    });
    client.auth.onAuthStateChange(function (_event, nextSession) {
      root.setTimeout(function () { handleSession(nextSession); }, 0);
    });
  }

  function wrapSupabaseFactory() {
    if (!root.supabase || typeof root.supabase.createClient !== "function") return false;
    if (root.supabase.__vduckieAccountSyncWrapped) return true;
    var original = root.supabase.createClient;
    root.supabase.createClient = function () {
      var created = original.apply(this, arguments);
      root.setTimeout(function () { attachClient(created); }, 0);
      return created;
    };
    root.supabase.__vduckieAccountSyncWrapped = true;
    return true;
  }

  root.VDuckieAccountSyncUtils = {
    version: VERSION,
    profileWordKey: PROFILE_WORD_KEY,
    isSyncableKey: isSyncableKey,
    normalize: normalizeProfile,
    merge: mergeProfiles,
    mergeJsonValues: mergeJsonValues,
    profileRow: profileRow,
    parseProfileRow: parseProfileRow,
    calculateStreak: calculateStreak,
    stableString: stableStringify
  };

  if (!root.document) return;
  if (!wrapSupabaseFactory()) {
    var attempts = 0;
    var wait = root.setInterval(function () {
      attempts++;
      if (wrapSupabaseFactory() || attempts > 100) root.clearInterval(wait);
    }, 25);
  }
})(typeof window !== "undefined" ? window : globalThis);
