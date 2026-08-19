(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_DAILY_LEARNING_V2__) return;
  root.__VDUCKIE_DAILY_LEARNING_V2__ = true;

  var STORAGE_KEY = "vduckie-daily-learning-v1";
  var DAY = 86400000;
  var INTERVALS = [0, 1, 3, 7, 21];
  var STAGES = ["Mới", "Đang học", "Quen", "Vững", "Đã thuộc"];
  var state = load();
  var active = null;
  var writer = null;
  var navBound = false;

  function emptyState() {
    return { version: 2, assignments: {}, words: {}, msutong: { currentBook: "beginner-1", currentLesson: "b1-u1", completed: {} }, updatedAt: 0 };
  }
  function normalize(value) {
    var base = emptyState();
    value = value && typeof value === "object" ? value : {};
    base.assignments = value.assignments && typeof value.assignments === "object" ? value.assignments : {};
    base.words = value.words && typeof value.words === "object" ? value.words : {};
    base.msutong = Object.assign(base.msutong, value.msutong || {});
    base.msutong.completed = base.msutong.completed && typeof base.msutong.completed === "object" ? base.msutong.completed : {};
    base.updatedAt = Number(value.updatedAt) || 0;
    return base;
  }
  function load() { try { return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); } catch (error) { return emptyState(); } }
  function save(sync) {
    state.version = 2;
    state.updatedAt = Date.now();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {}
    renderToday(); updateDock();
    try { document.dispatchEvent(new CustomEvent("vduckie:daily-learning-change", { detail: state })); } catch (error) {}
    if (sync !== false && root.VDuckieCloud && root.VDuckieCloud.saveDailyLearning) root.VDuckieCloud.saveDailyLearning(state);
  }
  function mergeRemote(remote) {
    remote = normalize(remote);
    if (remote.updatedAt > state.updatedAt) { state = remote; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {} renderToday(); updateDock(); }
    else if (state.updatedAt > remote.updatedAt && root.VDuckieCloud && root.VDuckieCloud.saveDailyLearning) root.VDuckieCloud.saveDailyLearning(state);
  }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function dateKey(date) { var d = date || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function hash(text) { var h = 2166136261; for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function wordId(term) { return String(term && term[0] || ""); }
  function meta(id) {
    if (!state.words[id]) state.words[id] = { stage: 0, correct: 0, wrong: 0, skills: {}, lastReviewed: 0, nextReview: 0, updatedAt: 0 };
    return state.words[id];
  }
  function terms() { return Array.isArray(root.ERP_TERMS) ? root.ERP_TERMS : []; }
  function todayTerms() {
    var all = terms(), key = dateKey();
    if (!state.assignments[key] || !state.assignments[key].length) {
      var unseen = all.filter(function (term) { return !state.words[wordId(term)] || Number(state.words[wordId(term)].correct || 0) === 0; });
      var pool = unseen.length >= 5 ? unseen : all;
      var start = pool.length ? hash(key) % pool.length : 0, selected = [];
      for (var i = 0; i < pool.length && selected.length < 5; i++) {
        var id = wordId(pool[(start + i * 37) % pool.length]);
        if (selected.indexOf(id) < 0) selected.push(id);
      }
      state.assignments[key] = selected;
      save();
    }
    return state.assignments[key].map(function (id) { return all.find(function (term) { return wordId(term) === id; }); }).filter(Boolean);
  }
  function dueTerms() {
    var now = Date.now();
    return terms().filter(function (term) { var item = state.words[wordId(term)]; return item && item.correct > 0 && Number(item.nextReview || 0) <= now; });
  }
  function completedToday() {
    return todayTerms().filter(function (term) { var item = meta(wordId(term)); return item.lastReviewed && dateKey(new Date(item.lastReviewed)) === dateKey() && item.correct >= 3; }).length;
  }
  function lessons() { return root.VDuckieMSUTONG && root.VDuckieMSUTONG.lessons || []; }
  function currentLesson() { var list = lessons(); return list.find(function (lesson) { return lesson.id === state.msutong.currentLesson; }) || list[0]; }
  function totalMastered() { return Object.keys(state.words).filter(function (id) { return Number(state.words[id].stage || 0) >= 4; }).length; }
  function speak(value) {
    if (!value || !root.speechSynthesis) return;
    root.speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(value); utterance.lang = "zh-CN"; utterance.rate = 0.72;
    var voices = root.speechSynthesis.getVoices();
    for (var i = 0; i < voices.length; i++) if (/^zh/i.test(voices[i].lang || "")) { utterance.voice = voices[i]; break; }
    root.speechSynthesis.speak(utterance);
  }
  function reading(value, fallback) {
    try { var generated = root.Pronunciation && root.Pronunciation.generate && root.Pronunciation.generate(value); if (generated && generated.pinyin) return generated.pinyin; } catch (error) {}
    return fallback || "";
  }

  function renderToday() {
    var hub = document.getElementById("homeHub"); if (!hub) return;
    var lesson = currentLesson(), due = dueTerms().length, done = completedToday(), lessonDone = Object.keys(state.msutong.completed).length;
    hub.innerHTML = '<section class="daily-today app-screen"><header class="daily-heading"><div><span class="daily-task-kicker">HÔM NAY</span><h1>Mở, học, hoàn thành.</h1><p>Chỉ ba việc cần tập trung hôm nay.</p></div><span class="daily-date">' + new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" }) + '</span></header><div class="daily-grid">' +
      task("primary", "MSUTONG · SƠ CẤP 1", lesson ? lesson.title : "Bài đầu tiên", lesson ? lesson.goal : "Bắt đầu lộ trình", lessonDone + "/10 bài", lessonDone * 10, "Tiếp tục", "msutong") +
      task("", "ERP · 5 TỪ MỚI", done + " / 5 hôm nay", "Dạy trước, luyện chữ, ghép cụm rồi mới kiểm tra.", done + "/5 từ", done * 20, "Học ngay", "daily") +
      task("", "ÔN TẬP", due + " từ đến hạn", due ? "VDuckie ưu tiên đúng loại lỗi bạn từng mắc." : "Hiện chưa có từ nào đến hạn.", due ? due + " từ" : "Đã xong", due ? 18 : 100, due ? "Ôn ngay" : "Xem", "review") +
      '</div><div class="daily-summary"><span class="daily-pill">' + totalMastered() + ' từ ERP đã thuộc</span><span class="daily-pill">' + lessonDone + '/10 bài MSUTONG</span><span class="daily-pill">Tiến độ dùng chung khi đăng nhập</span></div></section>';
    bindNav(hub);
  }
  function task(classes, kicker, title, copy, progress, width, action, kind) {
    return '<article class="daily-task ' + classes + '"><span class="daily-task-kicker">' + esc(kicker) + '</span><h2>' + esc(title) + '</h2><p>' + esc(copy) + '</p><div class="daily-task-progress"><span><b>Tiến độ</b><b>' + esc(progress) + '</b></span><div class="daily-bar"><i style="width:' + Math.min(100, width) + '%"></i></div><button class="daily-action" type="button" data-daily-nav="' + kind + '">' + esc(action) + ' →</button></div></article>';
  }
  function panel() {
    var node = document.getElementById("dailyLearningPanel");
    if (!node) { node = document.createElement("section"); node.id = "dailyLearningPanel"; node.className = "panel daily-panel hidden"; var main = document.querySelector(".study-center main"); if (main) main.insertBefore(node, main.firstChild); }
    return node;
  }
  function hideLegacy() {
    if (root.ERPAreaNavigation && root.ERPAreaNavigation.home) root.ERPAreaNavigation.home();
    var hub = document.getElementById("homeHub"); if (hub) hub.className = "home-hub hidden";
    panel().className = "panel daily-panel";
    closeMenu(); root.scrollTo(0, 0);
  }
  function showPanel(kind) {
    hideLegacy();
    document.body.setAttribute("data-current-area", kind);
    if (kind === "msutong") renderRoadmap();
    else if (kind === "profile") renderProfile();
    else if (kind === "dictionary") renderDictionary();
    else startDaily(kind === "review");
  }
  function closePanel() {
    active = null; writer = null;
    var node = panel(); node.className = "panel daily-panel hidden";
    if (root.ERPAreaNavigation && root.ERPAreaNavigation.home) root.ERPAreaNavigation.home();
    renderToday(); closeMenu();
  }
  function sessionHeader(label, index, total) {
    var percent = total ? Math.round((index + 1) * 100 / total) : 0;
    return '<header class="learning-session-head"><button type="button" class="session-exit" data-session-exit aria-label="Thoát">×</button><div><span>' + esc(label) + '</span><strong>' + (index + 1) + ' / ' + total + '</strong></div><div class="session-progress" role="progressbar" aria-valuenow="' + percent + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + percent + '%"></i></div></header>';
  }
  function sessionNav(canNext, nextLabel) {
    return '<footer class="learning-session-nav"><button type="button" data-session-prev>← Quay lại</button><button type="button" class="primary" data-session-next' + (canNext ? "" : " disabled") + '>' + esc(nextLabel || "Tiếp") + ' →</button></footer>';
  }
  function bindSessionNavigation(render) {
    var node = panel(), exit = node.querySelector("[data-session-exit]"), prev = node.querySelector("[data-session-prev]"), next = node.querySelector("[data-session-next]");
    if (exit) exit.onclick = closePanel;
    if (prev) prev.onclick = function () { if (active.index > 0) { active.index--; active.answered = false; render(); } else closePanel(); };
    if (next) next.onclick = function () { if (next.disabled) return; active.index++; active.answered = false; render(); };
  }

  function contextFor(term) {
    var word = term[0], phrase;
    if (/领料/.test(word)) phrase = word.indexOf("数量") >= 0 ? word : word + "数量";
    else if (/入库/.test(word)) phrase = word.indexOf("数量") >= 0 ? word : word + "数量";
    else if (/出库/.test(word)) phrase = word.indexOf("数量") >= 0 ? word : word + "数量";
    else if (/库存/.test(word)) phrase = /查询|不足|期初/.test(word) ? word : word + "数量";
    else if (/差异/.test(word)) phrase = word.indexOf("原因") >= 0 ? word : word + "原因";
    else if (/工单/.test(word)) phrase = word.indexOf("生产") >= 0 ? word : "生产" + word;
    else if (/编码/.test(word)) phrase = word.indexOf("物料") >= 0 ? word : "物料" + word;
    else if (/数量/.test(word)) phrase = word;
    else phrase = word + (/检查|确认|审核|审批/.test(word) ? "结果" : term[4] === "生产" ? "计划" : term[4] === "Kho" ? "记录" : "资料");
    var sentence = term[6] || "请确认" + phrase + "。";
    var vi = term[7] || "Vui lòng xác nhận " + String(term[3] || "").toLowerCase() + ".";
    return { phrase: phrase, phraseVi: String(term[3] || "") + " trong nghiệp vụ", sentence: sentence, sentenceVi: vi, sentencePinyin: reading(sentence, term[1]) };
  }
  function dailyPlan(selected, review) {
    var plan = [];
    if (review) {
      selected.forEach(function (term, index) { var item = meta(wordId(term)), weak = weakestSkill(item); plan.push({ type: weak === "sentence" ? "sentence" : "quiz", term: term, mode: weak, label: "Ôn từ đến hạn " + (index + 1) }); });
      plan.push({ type: "result", label: "Kết quả" });
      return plan;
    }
    selected.forEach(function (term, index) {
      plan.push({ type: "intro", term: term, label: "Làm quen từ " + (index + 1) });
      plan.push({ type: "writing", term: term, label: "Cách viết " + (index + 1) });
      if (index > 0) plan.push({ type: "quiz", term: selected[index - 1], mode: index % 2 ? "meaning" : "pinyin", label: "Gọi lại từ " + index });
      plan.push({ type: "phrase", term: term, label: "Ghép cụm ERP" });
      plan.push({ type: "sentence", term: term, label: "Đặt vào câu ERP" });
    });
    selected.forEach(function (term, index) { plan.push({ type: "quiz", term: term, mode: ["meaning", "pinyin", "write"][index % 3], final: true, label: "Kiểm tra cuối" }); });
    plan.push({ type: "result", label: "Kết quả" });
    return plan;
  }
  function weakestSkill(item) {
    var keys = ["meaning", "pinyin", "write", "sentence"], selected = keys[0], highest = -1;
    keys.forEach(function (key) { var skill = item.skills[key] || {}, errors = Number(skill.wrong || 0) - Number(skill.correct || 0) * 0.2; if (errors > highest) { highest = errors; selected = key; } });
    return selected;
  }
  function startDaily(review) {
    var selected = review ? dueTerms() : todayTerms();
    if (!selected.length) { active = { kind: "empty", review: review }; return renderDailyEmpty(review); }
    active = { kind: "daily", review: review, terms: selected, plan: dailyPlan(selected, review), index: 0, answered: false, correct: 0, wrong: 0, weak: {} };
    renderDailyStep();
  }
  function renderDailyEmpty(review) {
    panel().innerHTML = '<div class="learning-empty app-screen"><button type="button" class="session-exit" data-session-exit>×</button><span class="result-mark">✓</span><h1>' + (review ? "Không có từ đến hạn" : "Hôm nay đã xong") + '</h1><p>VDuckie sẽ đưa từ quay lại đúng lịch. Không cần học dồn.</p><button class="daily-action" data-session-exit>Về Hôm nay</button></div>';
    panel().querySelectorAll("[data-session-exit]").forEach(function (button) { button.onclick = closePanel; });
  }
  function renderDailyStep() {
    if (!active || active.kind !== "daily") return;
    var step = active.plan[active.index];
    if (!step) { active.index = active.plan.length - 1; step = active.plan[active.index]; }
    if (step.type === "result") return renderDailyResult();
    var term = step.term, ctx = contextFor(term), body = "", canNext = step.type !== "quiz" && step.type !== "sentence";
    if (step.type === "intro") {
      body = '<div class="focus-word"><span class="focus-kicker">GẶP TỪ MỚI</span><strong>' + esc(term[0]) + '</strong><b>' + esc(term[1]) + '</b><p>' + esc(term[3]) + '</p><button type="button" class="audio-action" data-speak="' + esc(term[0]) + '">♪ Nghe phát âm</button><small>' + esc(term[5] || "Từ dùng trong nghiệp vụ ERP.") + '</small></div>';
    } else if (step.type === "writing") {
      var chars = String(term[0]).match(/[\u3400-\u9fff]/g) || [];
      if ((active.charIndex || 0) >= chars.length) active.charIndex = 0;
      var selectedChar = chars[active.charIndex || 0] || chars[0];
      body = '<div class="writing-focus"><span class="focus-kicker">THỨ TỰ NÉT</span><div class="writing-word-pills">' + chars.map(function (char, index) { return '<button type="button" class="' + (char === selectedChar ? "active" : "") + '" data-writing-char="' + index + '">' + char + '</button>'; }).join("") + '</div><div id="dailyStrokeTarget" class="daily-stroke-target" aria-label="Luyện viết chữ ' + esc(selectedChar) + '"></div><p id="dailyWritingStatus">Xem nét mẫu hoặc tự viết theo trên màn hình.</p><div class="writing-actions"><button type="button" data-writing-replay>▶ Xem viết mẫu</button><button type="button" data-writing-practice>✍ Tự viết</button><button type="button" data-speak="' + esc(term[0]) + '">♪ Nghe từ</button></div><small>Phiên bản này hướng dẫn và cho viết theo; chưa chấm hình dáng chữ tự do.</small></div>';
    } else if (step.type === "phrase") {
      body = '<div class="context-focus"><span class="focus-kicker">KHÔNG HỌC TỪ CÔ LẬP</span><span class="context-source">' + esc(term[0]) + '</span><span class="context-arrow">＋</span><strong>' + esc(ctx.phrase) + '</strong><b>' + esc(reading(ctx.phrase, term[1])) + '</b><p>' + esc(ctx.phraseVi) + '</p><button type="button" class="audio-action" data-speak="' + esc(ctx.phrase) + '">♪ Nghe cụm từ</button></div>';
    } else if (step.type === "sentence") {
      var blank = ctx.sentence.replace(term[0], "____");
      body = '<div class="question-focus"><span class="focus-kicker">ĐIỀN TỪ VÀO CÂU ERP</span><h2>' + esc(blank) + '</h2><p>' + esc(ctx.sentenceVi) + '</p><div class="daily-options">' + optionTerms(term, active.terms).map(function (item) { return '<button type="button" data-answer="' + esc(item[0]) + '">' + esc(item[0]) + '<small>' + esc(item[1]) + '</small></button>'; }).join("") + '</div><div class="daily-feedback" id="dailyFeedback"></div></div>';
    } else {
      body = renderDailyQuestion(step, term);
    }
    panel().innerHTML = '<div class="learning-session app-screen">' + sessionHeader(active.review ? "Ôn tập thích ứng" : "Daily ERP +5", active.index, active.plan.length) + '<main class="learning-step">' + body + '</main>' + sessionNav(canNext, step.type === "intro" ? "Tao đã xem" : "Tiếp") + '</div>';
    bindSessionNavigation(renderDailyStep); bindSpeak();
    if (step.type === "writing") setupDailyWriting(term);
    if (step.type === "quiz" || step.type === "sentence") bindDailyAnswers(step, term);
  }
  function renderDailyQuestion(step, term) {
    var mode = step.mode || "meaning";
    if (mode === "write") return '<div class="question-focus"><span class="focus-kicker">NHỚ CHỮ HÁN</span><h2>' + esc(term[3]) + '</h2><b>' + esc(term[1]) + '</b><input class="daily-input" id="dailyAnswer" autocomplete="off" placeholder="Gõ chữ Hán"><button type="button" class="daily-submit" id="dailySubmit">Kiểm tra</button><div class="daily-feedback" id="dailyFeedback"></div></div>';
    var prompt = mode === "pinyin" ? "Pinyin đúng của " + term[0] + " là gì?" : term[0] + " nghĩa là gì?";
    return '<div class="question-focus"><span class="focus-kicker">' + (step.final ? "KIỂM TRA CUỐI" : "GỌI LẠI") + '</span><h2>' + esc(prompt) + '</h2><div class="daily-options">' + optionTerms(term, terms()).map(function (item) { return '<button type="button" data-answer="' + esc(item[0]) + '">' + esc(mode === "pinyin" ? item[1] : item[3]) + '</button>'; }).join("") + '</div><div class="daily-feedback" id="dailyFeedback"></div></div>';
  }
  function optionTerms(right, pool) {
    var list = [right], start = hash(right[0] + dateKey()) % Math.max(1, pool.length);
    for (var i = 0; i < pool.length && list.length < 4; i++) { var item = pool[(start + i * 17) % pool.length]; if (item && !list.some(function (value) { return value[0] === item[0]; })) list.push(item); }
    return list.sort(function (a, b) { return hash(a[0] + right[0]) - hash(b[0] + right[0]); });
  }
  function bindDailyAnswers(step, term) {
    var buttons = panel().querySelectorAll("[data-answer]");
    buttons.forEach(function (button) { button.onclick = function () { if (active.answered) return; var correct = button.dataset.answer === term[0]; button.classList.add(correct ? "correct" : "wrong"); finishDailyAnswer(correct, step.mode || "sentence", term); }; });
    var submit = document.getElementById("dailySubmit");
    if (submit) submit.onclick = function () { if (active.answered) return; finishDailyAnswer(document.getElementById("dailyAnswer").value.trim() === term[0], "write", term); };
  }
  function finishDailyAnswer(correct, skill, term) {
    active.answered = true;
    var item = meta(wordId(term)), now = Date.now(); item.skills[skill] = item.skills[skill] || { correct: 0, wrong: 0 };
    if (correct) { active.correct++; item.correct++; item.skills[skill].correct++; if (item.correct >= [0, 3, 6, 9, 12][Math.min(4, item.stage + 1)]) item.stage = Math.min(4, item.stage + 1); }
    else { active.wrong++; active.weak[wordId(term)] = true; item.wrong++; item.skills[skill].wrong++; item.stage = Math.max(0, item.stage - 1); }
    item.lastReviewed = now; item.nextReview = now + (correct ? INTERVALS[Math.max(1, item.stage)] * DAY : 10 * 60000); item.updatedAt = now; save();
    var feedback = document.getElementById("dailyFeedback");
    if (feedback) { feedback.className = "daily-feedback " + (correct ? "good" : "bad"); feedback.textContent = correct ? "Đúng. Từ này vẫn sẽ quay lại để nhớ chắc." : "Chưa đúng: " + term[0] + " · " + term[1] + " · " + term[3]; }
    panel().querySelectorAll("[data-answer]").forEach(function (button) { if (button.dataset.answer === term[0]) button.classList.add("correct"); button.disabled = true; });
    var next = panel().querySelector("[data-session-next]"); if (next) next.disabled = false;
  }
  function renderDailyResult() {
    var weak = Object.keys(active.weak).length, learned = active.terms.length;
    panel().innerHTML = '<div class="learning-result app-screen"><span class="result-mark">✓</span><span class="focus-kicker">HOÀN THÀNH PHIÊN</span><h1>' + (active.review ? "Ôn tập xong!" : learned + " từ ERP hôm nay") + '</h1><div class="result-stats"><div><strong>' + active.correct + '</strong><span>Lượt đúng</span></div><div><strong>' + active.wrong + '</strong><span>Lượt sai</span></div><div><strong>' + weak + '</strong><span>Từ cần ôn thêm</span></div></div><p>Một câu đúng chưa được tính là đã thuộc. Từ yếu đã được hẹn quay lại sớm hơn.</p><div class="result-actions">' + (weak ? '<button type="button" data-review-weak>Ôn từ yếu</button>' : "") + '<button type="button" class="primary" data-session-exit>Về Hôm nay</button></div></div>';
    var exit = panel().querySelector("[data-session-exit]"); if (exit) exit.onclick = closePanel;
    var retry = panel().querySelector("[data-review-weak]"); if (retry) retry.onclick = function () { var selected = active.terms.filter(function (term) { return active.weak[wordId(term)]; }); active = { kind: "daily", review: true, terms: selected, plan: dailyPlan(selected, true), index: 0, answered: false, correct: 0, wrong: 0, weak: {} }; renderDailyStep(); };
  }

  function loadCharacterData(character, complete, fail) {
    if (root.HSK_HANZI_DATA && root.HSK_HANZI_DATA[character]) return complete(root.HSK_HANZI_DATA[character]);
    root.fetch("./hanzi-data/" + encodeURIComponent(character) + ".json").then(function (response) { if (!response.ok) throw new Error("missing"); return response.json(); }).then(complete).catch(fail);
  }
  function setupDailyWriting(term) {
    var chars = String(term[0]).match(/[\u3400-\u9fff]/g) || [], selected = chars[active.charIndex || 0] || chars[0], status = document.getElementById("dailyWritingStatus");
    panel().querySelectorAll("[data-writing-char]").forEach(function (button) { button.onclick = function () { active.charIndex = Number(button.dataset.writingChar); renderDailyStep(); }; });
    if (!root.HanziWriter || !selected) { if (status) status.textContent = "Chữ này chưa có dữ liệu nét; vẫn có thể nghe và chép vào vở."; return; }
    try {
      writer = root.HanziWriter.create("dailyStrokeTarget", selected, { renderer: "svg", width: 244, height: 244, padding: 28, showOutline: true, showCharacter: false, strokeColor: "#18352e", outlineColor: "#d9d2c5", highlightColor: "#c7673c", drawingColor: "#c7673c", drawingWidth: 5, charDataLoader: loadCharacterData });
      var replay = panel().querySelector("[data-writing-replay]"), practice = panel().querySelector("[data-writing-practice]");
      if (replay) replay.onclick = function () { writer.animateCharacter(); if (status) status.textContent = "Đang chạy thứ tự nét của chữ " + selected + "."; };
      if (practice) practice.onclick = function () { writer.quiz({ showHintAfterMisses: 2, onComplete: function () { if (status) status.textContent = "Đã viết hết các nét. Hãy viết lại một lần vào vở."; } }); if (status) status.textContent = "Viết theo từng nét trong ô vuông."; };
    } catch (error) { if (status) status.textContent = "Chữ này chưa có hoạt ảnh nét. Hãy chép lại theo mẫu."; }
  }

  function renderRoadmap() {
    var list = lessons(), node = panel(), complete = Object.keys(state.msutong.completed).length;
    node.innerHTML = '<div class="roadmap-screen app-screen"><header class="screen-title"><div><span class="focus-kicker">LỘ TRÌNH CHÍNH</span><h1>MSUTONG · Sơ cấp 1</h1><p>10 bài có nội dung học thật. Các quyển sau mới chỉ là roadmap.</p></div><button type="button" data-session-exit>×</button></header><div class="roadmap-progress"><span><b>' + complete + '/10 bài hoàn thành</b><i>Nội dung VDuckie nguyên bản theo chủ đề công khai</i></span><div class="daily-bar"><i style="width:' + complete * 10 + '%"></i></div></div><div class="lesson-picker">' + list.map(function (lesson, index) { var done = !!state.msutong.completed[lesson.id], current = lesson.id === state.msutong.currentLesson; return '<button type="button" class="lesson-choice' + (done ? " done" : "") + (current ? " current" : "") + '" data-msutong-lesson="' + lesson.id + '"><span>' + (done ? "✓" : index + 1) + '</span><div><strong>' + esc(lesson.title) + '</strong><small>' + esc(lesson.zhTitle) + ' · ' + lesson.words.length + ' từ · ' + lesson.grammar.length + ' mẫu ngữ pháp</small></div><b>›</b></button>'; }).join("") + '</div><div class="future-roadmap"><strong>Roadmap tiếp theo</strong><span>Sơ cấp 2–4 · Trung cấp 1–4 · Cao cấp 1–4</span><small>Chưa có nội dung học hoàn chỉnh</small></div></div>';
    node.querySelector("[data-session-exit]").onclick = closePanel;
    node.querySelectorAll("[data-msutong-lesson]").forEach(function (button) { button.onclick = function () { state.msutong.currentLesson = button.dataset.msutongLesson; save(); startMsutong(button.dataset.msutongLesson); }; });
  }
  function msutongPlan(lesson) {
    var plan = [{ type: "overview" }];
    lesson.words.forEach(function (word) { plan.push({ type: "word", word: word }); });
    lesson.grammar.forEach(function (rule) { plan.push({ type: "grammar", rule: rule }); });
    plan.push({ type: "dialogue" });
    plan.push({ type: "msuQuiz", mode: "meaning", word: lesson.words[0] });
    plan.push({ type: "msuQuiz", mode: "pinyin", word: lesson.words[1] });
    plan.push({ type: "msuQuiz", mode: "sentence", word: lesson.words[2] });
    plan.push({ type: "msuResult" });
    return plan;
  }
  function startMsutong(id) {
    var lesson = lessons().find(function (item) { return item.id === id; }) || currentLesson();
    active = { kind: "msutong", lesson: lesson, plan: msutongPlan(lesson), index: 0, answered: false, score: 0, wrong: 0 };
    renderMsutongStep();
  }
  function renderMsutongStep() {
    if (!active || active.kind !== "msutong") return;
    var step = active.plan[active.index], lesson = active.lesson;
    if (!step) return renderRoadmap();
    if (step.type === "msuResult") return renderMsutongResult();
    var body = "", canNext = step.type !== "msuQuiz";
    if (step.type === "overview") body = '<div class="lesson-overview"><span class="focus-kicker">' + esc(lesson.zhTitle) + '</span><h1>' + esc(lesson.title) + '</h1><p>' + esc(lesson.goal) + '</p><div class="lesson-overview-meta"><span>' + lesson.words.length + ' từ mới</span><span>' + lesson.grammar.length + ' mẫu ngữ pháp</span><span>Hội thoại + 3 bài tập</span></div><small>Bài bổ trợ VDuckie nguyên bản, bám thứ tự chủ đề công khai của MSUTONG Sơ cấp 1.</small></div>';
    else if (step.type === "word") { var word = step.word; body = '<div class="focus-word"><span class="focus-kicker">TỪ VỰNG</span><strong>' + esc(word[0]) + '</strong><b>' + esc(word[1]) + '</b><p>' + esc(word[2]) + '</p><button type="button" class="audio-action" data-speak="' + esc(word[0]) + '">♪ Nghe phát âm</button></div>'; }
    else if (step.type === "grammar") { var rule = step.rule; body = '<div class="grammar-focus"><span class="focus-kicker">NGỮ PHÁP</span><h2>' + esc(rule[0]) + '</h2><p>' + esc(rule[1]) + '</p><div><strong>' + esc(rule[2]) + '</strong><b>' + esc(reading(rule[2], "")) + '</b><span>' + esc(rule[3]) + '</span><button type="button" class="audio-action" data-speak="' + esc(rule[2]) + '">♪ Nghe ví dụ</button></div></div>'; }
    else if (step.type === "dialogue") body = '<div class="dialogue-focus"><span class="focus-kicker">HỘI THOẠI VD<small>UCKIE</small></span><h2>Nghe rồi đọc theo từng lượt</h2>' + lesson.dialogue.map(function (line) { return '<article><span>' + esc(line[0]) + '</span><div><strong>' + esc(line[1]) + '</strong><b>' + esc(line[2]) + '</b><p>' + esc(line[3]) + '</p></div><button type="button" data-speak="' + esc(line[1]) + '">♪</button></article>'; }).join("") + '</div>';
    else body = renderMsutongQuiz(step, lesson);
    panel().innerHTML = '<div class="learning-session app-screen">' + sessionHeader("MSUTONG · " + lesson.title, active.index, active.plan.length) + '<main class="learning-step">' + body + '</main>' + sessionNav(canNext, "Tiếp") + '</div>';
    bindSessionNavigation(renderMsutongStep); bindSpeak();
    if (step.type === "msuQuiz") bindMsutongAnswers(step);
  }
  function renderMsutongQuiz(step, lesson) {
    var word = step.word, prompt, options;
    if (step.mode === "pinyin") { prompt = "Pinyin đúng của " + word[0] + " là gì?"; options = lesson.words.map(function (item) { return [item[0], item[1]]; }); }
    else if (step.mode === "sentence") { var line = lesson.dialogue[0]; prompt = line[1].replace(word[0], "____"); if (prompt === line[1]) prompt = "Chọn chữ Hán đúng với: " + word[2]; options = lesson.words.map(function (item) { return [item[0], item[0]]; }); }
    else { prompt = word[0] + " nghĩa là gì?"; options = lesson.words.map(function (item) { return [item[0], item[2]]; }); }
    options = options.slice(0, 4); if (!options.some(function (item) { return item[0] === word[0]; })) options[3] = [word[0], step.mode === "pinyin" ? word[1] : step.mode === "sentence" ? word[0] : word[2]];
    options.sort(function (a, b) { return hash(a[0] + word[0]) - hash(b[0] + word[0]); });
    return '<div class="question-focus"><span class="focus-kicker">BÀI TẬP ' + esc(step.mode.toUpperCase()) + '</span><h2>' + esc(prompt) + '</h2><div class="daily-options">' + options.map(function (item) { return '<button type="button" data-answer="' + esc(item[0]) + '">' + esc(item[1]) + '</button>'; }).join("") + '</div><div class="daily-feedback" id="dailyFeedback"></div></div>';
  }
  function bindMsutongAnswers(step) {
    panel().querySelectorAll("[data-answer]").forEach(function (button) { button.onclick = function () { if (active.answered) return; active.answered = true; var correct = button.dataset.answer === step.word[0]; if (correct) active.score++; else active.wrong++; button.classList.add(correct ? "correct" : "wrong"); panel().querySelectorAll("[data-answer]").forEach(function (item) { if (item.dataset.answer === step.word[0]) item.classList.add("correct"); item.disabled = true; }); var feedback = document.getElementById("dailyFeedback"); feedback.className = "daily-feedback " + (correct ? "good" : "bad"); feedback.textContent = correct ? "Đúng rồi." : "Chưa đúng: " + step.word[0] + " · " + step.word[1] + " · " + step.word[2]; panel().querySelector("[data-session-next]").disabled = false; }; });
  }
  function renderMsutongResult() {
    var lesson = active.lesson, passed = active.score >= 2;
    if (passed) { state.msutong.completed[lesson.id] = { completedAt: Date.now(), score: active.score }; var list = lessons(), index = list.findIndex(function (item) { return item.id === lesson.id; }); if (list[index + 1]) state.msutong.currentLesson = list[index + 1].id; save(); }
    panel().innerHTML = '<div class="learning-result app-screen"><span class="result-mark">' + (passed ? "✓" : "↻") + '</span><span class="focus-kicker">' + (passed ? "HOÀN THÀNH BÀI" : "CẦN ÔN LẠI") + '</span><h1>' + esc(lesson.title) + '</h1><div class="result-stats"><div><strong>' + active.score + '/3</strong><span>Bài tập đúng</span></div><div><strong>' + lesson.words.length + '</strong><span>Từ đã học</span></div><div><strong>' + lesson.grammar.length + '</strong><span>Mẫu ngữ pháp</span></div></div><p>' + (passed ? "Tiến độ đã được lưu. Bài tiếp theo đã sẵn sàng." : "Cần đúng ít nhất 2/3. Xem lại từ và hội thoại rồi thử lại.") + '</p><div class="result-actions"><button type="button" data-msu-retry>' + (passed ? "Học lại" : "Ôn lại bài") + '</button><button type="button" class="primary" data-msu-roadmap>' + (passed ? "Bài tiếp theo" : "Về lộ trình") + '</button></div></div>';
    panel().querySelector("[data-msu-retry]").onclick = function () { startMsutong(lesson.id); };
    panel().querySelector("[data-msu-roadmap]").onclick = function () { if (passed && state.msutong.currentLesson !== lesson.id) startMsutong(state.msutong.currentLesson); else renderRoadmap(); };
  }

  function normalizeDictionarySearch(value) {
    var normalized = String(value == null ? "" : value).toLowerCase();
    if (normalized.normalize) normalized = normalized.normalize("NFD");
    return normalized.replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/ü/g, "u").replace(/\s+/g, " ").trim();
  }
  function dictionaryRecords() {
    var map = Object.create(null), records = [];
    function add(term, source) {
      if (!term || !term[0]) return;
      var key = String(term[0]), record = map[key];
      if (!record) {
        record = { term: [key, term[1] || "", term[2] || "", term[3] || "", term[4] || "", term[5] || "", term[6] || "", term[7] || ""], sources: [] };
        map[key] = record; records.push(record);
      } else {
        for (var index = 1; index < 8; index++) if (!record.term[index] && term[index]) record.term[index] = term[index];
      }
      if (source && record.sources.indexOf(source) < 0) record.sources.push(source);
    }
    terms().forEach(function (term) { add(term, "ERP"); });
    lessons().forEach(function (lesson) { lesson.words.forEach(function (word) { add([word[0], word[1], "", word[2], "HSK1", "MSUTONG Sơ cấp 1", "", ""], "HSK1"); }); });
    var unified = root.VDuckieDictionary && root.VDuckieDictionary.records;
    if (Array.isArray(unified)) unified.forEach(function (item) {
      var meanings = [].concat(item.meanings && item.meanings.erp || [], item.meanings && item.meanings.hsk || []);
      var examples = [].concat(item.examples && item.examples.erp || [], item.examples && item.examples.hsk || []);
      var example = examples[0] || {};
      add([item.hanzi, item.pinyin, item.nearVi, meanings[0] || "", (item.erpCategories || [])[0] || (item.hskLevel ? "HSK " + item.hskLevel : "Từ điển"), (item.notes || [])[0] || "", example.zh || "", example.vi || ""], (item.sources || []).join(" + "));
    });
    records.forEach(function (record) { record.search = normalizeDictionarySearch(record.term.join(" ") + " " + record.sources.join(" ")); });
    return records;
  }
  function personalWords() {
    try {
      var values = JSON.parse(localStorage.getItem("erp-lite-personal") || "[]"), output = Object.create(null);
      if (Array.isArray(values)) values.forEach(function (term) { if (term && term[0]) output[term[0]] = true; });
      return output;
    } catch (error) { return Object.create(null); }
  }
  function saveDictionaryWord(record) {
    var term = record.term, saved = personalWords();
    if (saved[term[0]]) return;
    var timestamp = new Date().toISOString();
    var row = { word_key: term[0], hanzi: term[0], pinyin: term[1], near_vi: term[2], meaning_vi: term[3], category: term[4], note: term[5], example_zh: term[6], example_vi: term[7], is_known: false, is_saved: true, known_updated_at: null, saved_updated_at: timestamp };
    if (root.VDuckieLocalLearning && typeof root.VDuckieLocalLearning.mergeRemote === "function") root.VDuckieLocalLearning.mergeRemote([row]);
    else {
      var list = [];
      try { list = JSON.parse(localStorage.getItem("erp-lite-personal") || "[]"); if (!Array.isArray(list)) list = []; } catch (error) { list = []; }
      list.push(term.slice(0));
      try { localStorage.setItem("erp-lite-personal", JSON.stringify(list)); } catch (error) {}
    }
    try { document.dispatchEvent(new CustomEvent("vduckie:learning-change", { detail: row })); } catch (error) {}
  }
  function renderDictionaryResults(query) {
    var results = document.getElementById("dailyDictionaryResults"), status = document.getElementById("dailyDictionaryStatus");
    if (!results) return;
    var all = dictionaryRecords(), needle = normalizeDictionarySearch(query), matches = all.filter(function (record) { return !needle || record.search.indexOf(needle) >= 0; });
    var shown = matches.slice(0, 50), saved = personalWords();
    if (status) status.textContent = matches.length + " kết quả" + (matches.length > shown.length ? " · đang hiện 50 kết quả đầu" : "");
    results.innerHTML = shown.length ? shown.map(function (record) {
      var term = record.term, isSaved = !!saved[term[0]];
      return '<article class="dictionary-card"><div class="dictionary-word"><strong>' + esc(term[0]) + '</strong><div><b>' + esc(term[1] || "Chưa có pinyin") + '</b><p>' + esc(term[3] || "Chưa có nghĩa Việt") + '</p></div></div><div class="dictionary-meta"><span>' + esc(term[4] || record.sources.join(" · ") || "Từ điển") + '</span>' + (term[5] ? '<small>' + esc(term[5]) + '</small>' : "") + '</div>' + (term[6] ? '<div class="dictionary-example"><strong>' + esc(term[6]) + '</strong>' + (term[7] ? '<span>' + esc(term[7]) + '</span>' : "") + '</div>' : "") + '<div class="dictionary-actions"><button type="button" data-speak="' + esc(term[0]) + '">♪ Nghe</button><button type="button" class="' + (isSaved ? "saved" : "") + '" data-dictionary-save="' + esc(term[0]) + '"' + (isSaved ? " disabled" : "") + '>' + (isSaved ? "✓ Đã lưu" : "+ Sổ từ") + '</button></div></article>';
    }).join("") : '<div class="dictionary-empty"><strong>Không tìm thấy từ phù hợp.</strong><span>Thử chữ Hán, pinyin không dấu hoặc nghĩa tiếng Việt khác.</span></div>';
    bindSpeak();
    results.querySelectorAll("[data-dictionary-save]").forEach(function (button) { button.onclick = function () { var record = all.find(function (item) { return item.term[0] === button.dataset.dictionarySave; }); if (record) { saveDictionaryWord(record); renderDictionaryResults(document.getElementById("dailyDictionarySearch").value); } }; });
  }
  function renderDictionary() {
    panel().innerHTML = '<div class="dictionary-screen app-screen"><header class="screen-title"><div><span class="focus-kicker">TRA CỨU RIÊNG</span><h1>Từ điển Trung – Việt</h1><p>Tra chữ Hán, pinyin hoặc nghĩa Việt; nghe và lưu thẳng vào Sổ từ.</p></div><button type="button" data-session-exit>×</button></header><div class="dictionary-search"><label for="dailyDictionarySearch">Tìm từ</label><div><input id="dailyDictionarySearch" type="search" autocomplete="off" placeholder="Ví dụ: 领料, lingliao, lĩnh liệu"><button type="button" id="dailyDictionaryClear" aria-label="Xóa tìm kiếm">×</button></div><span id="dailyDictionaryStatus" aria-live="polite"></span></div><div class="dictionary-results" id="dailyDictionaryResults"></div></div>';
    panel().querySelector("[data-session-exit]").onclick = closePanel;
    var input = document.getElementById("dailyDictionarySearch"), timer = 0;
    input.oninput = function () { root.clearTimeout(timer); timer = root.setTimeout(function () { renderDictionaryResults(input.value); }, 80); };
    document.getElementById("dailyDictionaryClear").onclick = function () { input.value = ""; renderDictionaryResults(""); input.focus(); };
    renderDictionaryResults("");
  }

  function renderProfile() {
    panel().innerHTML = '<div class="profile-screen app-screen"><header class="screen-title"><div><span class="focus-kicker">HỒ SƠ HỌC TẬP</span><h1>VDuckie của bạn</h1></div><button type="button" data-session-exit>×</button></header><div class="profile-signature"><img src="./assets/vduckie-logo.png?v=1" alt="VDuckie"><div><strong>' + totalMastered() + ' từ ERP đã thuộc</strong><span>' + Object.keys(state.msutong.completed).length + '/10 bài MSUTONG Sơ cấp 1 hoàn thành</span></div></div><div class="daily-summary"><span class="daily-pill">Roast Mode vẫn hoạt động</span><span class="daily-pill">Supabase sync khi đăng nhập</span><span class="daily-pill">PWA dùng chung tiến độ</span></div></div>';
    panel().querySelector("[data-session-exit]").onclick = closePanel;
  }
  function bindSpeak() { panel().querySelectorAll("[data-speak]").forEach(function (button) { button.onclick = function () { speak(button.dataset.speak); }; }); }
  function bindNav() {
    if (navBound) return;
    navBound = true;
    document.addEventListener("click", function (event) {
      var button = event.target && event.target.closest && event.target.closest("[data-daily-nav]");
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showPanel(button.getAttribute("data-daily-nav"));
    }, true);
  }
  function closeMenu() { document.body.classList.remove("sidebar-open"); var button = document.getElementById("mobileMenu"); if (button) button.setAttribute("aria-expanded", "false"); }
  function bindLegacyClose() {
    document.querySelectorAll("[data-area],[data-home],[data-view],[data-open-dictionary],#brandHome").forEach(function (button) {
      button.addEventListener("click", function () {
        active = null;
        var node = document.getElementById("dailyLearningPanel"); if (node) node.className = "panel daily-panel hidden";
        closeMenu();
      });
    });
  }
  function installDock() {
    if (document.getElementById("mobileLearningDock")) return;
    var dock = document.createElement("nav"); dock.id = "mobileLearningDock"; dock.className = "mobile-learning-dock"; dock.setAttribute("aria-label", "Điều hướng học hằng ngày");
    dock.innerHTML = '<button data-daily-home><b>⌂</b><span>Hôm nay</span></button><button data-daily-nav="msutong"><b>路</b><span>MSUTONG</span></button><button class="daily-five" data-daily-nav="daily"><b>+5</b><span class="dock-five-progress">0/5 ERP</span></button><button data-daily-nav="review"><b>↻</b><span>Ôn tập</span><i class="dock-badge">0</i></button><button data-daily-nav="profile" class="signature-dock"><img src="./assets/vduckie-logo.png?v=1" alt="VDuckie"><span>VDuckie</span></button>';
    document.body.appendChild(dock); bindNav(dock); dock.querySelector("[data-daily-home]").onclick = closePanel;
    var offline = document.createElement("div"); offline.className = "daily-offline"; offline.textContent = "Đang ngoại tuyến · tiến độ chưa đồng bộ cloud"; document.body.appendChild(offline);
  }
  function updateDock() { var badge = document.querySelector(".dock-badge"), due = dueTerms().length; if (badge) { badge.textContent = due; badge.style.display = due ? "block" : "none"; } var progress = document.querySelector(".dock-five-progress"); if (progress) progress.textContent = completedToday() + "/5 ERP"; }
  function networkState() { document.body.classList.toggle("vduckie-offline", !navigator.onLine); }
  function init() {
    renderToday(); installDock(); bindNav(document); bindLegacyClose(); updateDock(); networkState();
    root.addEventListener("online", networkState); root.addEventListener("offline", networkState);
    document.addEventListener("vduckie:daily-learning-synced", function (event) { mergeRemote(event.detail); });
    if (root.VDuckieCloud && root.VDuckieCloud.loadDailyLearning) root.VDuckieCloud.loadDailyLearning().then(mergeRemote);
  }
  root.VDuckieDailyLearning = Object.freeze({ getState: function () { return normalize(state); }, mergeRemote: mergeRemote, todayTerms: todayTerms, dueTerms: dueTerms, show: showPanel, msutongLessons: lessons });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})(window, document);
