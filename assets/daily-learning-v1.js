(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_DAILY_LEARNING_V1__) return;
  root.__VDUCKIE_DAILY_LEARNING_V1__ = true;

  var STORAGE_KEY = "vduckie-daily-learning-v1";
  var DAY = 86400000;
  var STAGES = ["Mới", "Đang học", "Quen", "Vững", "Đã thuộc"];
  var INTERVALS = [0, 1, 3, 7, 21];
  var state = load();
  var session = null;

  var BOOKS = [
    { id: "beginner-1", level: "Sơ cấp", number: 1, status: "partial", note: "Đã có lộ trình VDuckie bổ trợ; nội dung không sao chép nguyên sách.", lessons: [
      ["b1-u1", "Xin chào", "Chào hỏi và đáp lại trong tình huống đơn giản", ["Ngữ âm và thanh điệu", "Chào và tạm biệt", "Nhận mặt chữ đầu tiên"]],
      ["b1-u2", "Bạn tên là gì?", "Tên và thông tin cá nhân", ["Hỏi tên", "Giới thiệu bản thân", "Nghe phản xạ"]],
      ["b1-u3", "Rất vui khi được gặp bạn", "Làm quen và đáp lời lịch sự", ["Câu xã giao", "Đại từ nhân xưng", "Nói có hướng dẫn"]],
      ["b1-u4", "Bạn đi đâu?", "Địa điểm và hướng di chuyển", ["Hỏi nơi đến", "Động từ đi", "Nói kế hoạch ngắn"]],
      ["b1-u5", "Bạn muốn ăn gì?", "Món ăn và nhu cầu cơ bản", ["Muốn/cần", "Gọi món", "Từ vựng đồ ăn"]],
      ["b1-u6", "Bạn làm việc ở đâu?", "Công việc và nơi làm việc", ["Hỏi nghề nghiệp", "Nói nơi làm", "Liên hệ tình huống ERP"]],
      ["b1-u7", "Ngân hàng Trung Quốc ở đâu?", "Vị trí và hỏi đường", ["Ở đâu", "Từ chỉ phương vị", "Nghe chỉ đường"]],
      ["b1-u8", "Sinh nhật của bạn là ngày nào?", "Ngày tháng và sinh nhật", ["Ngày tháng", "Hỏi sinh nhật", "Số đếm"]],
      ["b1-u9", "Bạn thích phim Mỹ hay phim Trung Quốc?", "Sở thích và lựa chọn", ["Thích", "Câu hỏi hay/hoặc", "Nói sở thích"]],
      ["b1-u10", "Nhà bạn có mấy người?", "Gia đình và số lượng", ["Có", "Mấy/bao nhiêu", "Giới thiệu gia đình"]]
    ]},
    { id: "beginner-2", level: "Sơ cấp", number: 2, status: "mapped" },
    { id: "beginner-3", level: "Sơ cấp", number: 3, status: "mapped" },
    { id: "beginner-4", level: "Sơ cấp", number: 4, status: "mapped" },
    { id: "intermediate-1", level: "Trung cấp", number: 1, status: "mapped" },
    { id: "intermediate-2", level: "Trung cấp", number: 2, status: "mapped" },
    { id: "intermediate-3", level: "Trung cấp", number: 3, status: "mapped" },
    { id: "intermediate-4", level: "Trung cấp", number: 4, status: "mapped" },
    { id: "advanced-1", level: "Cao cấp", number: 1, status: "mapped" },
    { id: "advanced-2", level: "Cao cấp", number: 2, status: "mapped" },
    { id: "advanced-3", level: "Cao cấp", number: 3, status: "mapped" },
    { id: "advanced-4", level: "Cao cấp", number: 4, status: "mapped" }
  ];

  function emptyState() {
    return { version: 1, assignments: {}, words: {}, msutong: { currentBook: "beginner-1", currentLesson: "b1-u1", completed: {} }, updatedAt: 0 };
  }
  function normalize(value) {
    var base = emptyState(); value = value && typeof value === "object" ? value : {};
    base.assignments = value.assignments && typeof value.assignments === "object" ? value.assignments : {};
    base.words = value.words && typeof value.words === "object" ? value.words : {};
    base.msutong = Object.assign(base.msutong, value.msutong || {});
    base.msutong.completed = base.msutong.completed && typeof base.msutong.completed === "object" ? base.msutong.completed : {};
    base.updatedAt = Number(value.updatedAt) || 0; return base;
  }
  function load() { try { return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); } catch (error) { return emptyState(); } }
  function save(sync) {
    state.updatedAt = Date.now();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {}
    renderToday(); updateDock();
    document.dispatchEvent(new CustomEvent("vduckie:daily-learning-change", { detail: state }));
    if (sync !== false && root.VDuckieCloud && root.VDuckieCloud.saveDailyLearning) root.VDuckieCloud.saveDailyLearning(state);
  }
  function mergeRemote(remote) {
    remote = normalize(remote);
    if (remote.updatedAt > state.updatedAt) { state = remote; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {} renderToday(); updateDock(); }
    else if (state.updatedAt > remote.updatedAt && root.VDuckieCloud && root.VDuckieCloud.saveDailyLearning) root.VDuckieCloud.saveDailyLearning(state);
  }
  function dateKey(date) { var d = date || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function hash(text) { var h = 2166136261; for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function wordId(term) { return String(term[0]); }
  function meta(id) { if (!state.words[id]) state.words[id] = { stage: 0, correct: 0, wrong: 0, skills: {}, lastReviewed: 0, nextReview: 0, updatedAt: 0 }; return state.words[id]; }
  function todayTerms() {
    var terms = root.ERP_TERMS || [], key = dateKey();
    if (!state.assignments[key] || !state.assignments[key].length) {
      var unseen = terms.filter(function (term) { return !state.words[wordId(term)] || Number(state.words[wordId(term)].correct || 0) === 0; });
      var pool = unseen.length >= 5 ? unseen : terms;
      var start = pool.length ? hash(key) % pool.length : 0, selected = [];
      for (var i = 0; i < pool.length && selected.length < 5; i++) { var id = wordId(pool[(start + i * 37) % pool.length]); if (selected.indexOf(id) < 0) selected.push(id); }
      state.assignments[key] = selected; save();
    }
    return state.assignments[key].map(function (id) { return terms.find(function (term) { return wordId(term) === id; }); }).filter(Boolean);
  }
  function dueTerms() { var now = Date.now(), terms = root.ERP_TERMS || []; return terms.filter(function (term) { var m = state.words[wordId(term)]; return m && m.correct > 0 && Number(m.nextReview || 0) <= now; }); }
  function todayDone() { return todayTerms().filter(function (term) { var m = meta(wordId(term)); return m.lastReviewed && dateKey(new Date(m.lastReviewed)) === dateKey() && m.correct >= 3; }).length; }
  function currentLesson() { var book = BOOKS.find(function (item) { return item.id === state.msutong.currentBook; }) || BOOKS[0]; var lessons = book.lessons || []; return lessons.find(function (lesson) { return lesson[0] === state.msutong.currentLesson; }) || lessons[0]; }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function speak(text) { if (!root.speechSynthesis) return; root.speechSynthesis.cancel(); var utterance = new SpeechSynthesisUtterance(text); utterance.lang = "zh-CN"; utterance.rate = 0.85; root.speechSynthesis.speak(utterance); }

  function renderToday() {
    var hub = document.getElementById("homeHub"); if (!hub) return;
    var lesson = currentLesson(), due = dueTerms().length, done = todayDone();
    hub.innerHTML = '<section class="daily-today"><header class="daily-heading"><div><span class="daily-task-kicker">HÔM NAY HỌC GÌ?</span><h1>Học một chút, nhớ thật lâu.</h1><p>MSUTONG trên lớp + 5 từ ERP mới + những từ đến hạn ôn.</p></div><span class="daily-date">' + new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" }) + '</span></header><div class="daily-grid">' +
      '<article class="daily-task primary"><span class="daily-task-kicker">MSUTONG · LỘ TRÌNH CHÍNH</span><h2>' + esc(lesson ? lesson[1] : "Sơ cấp 1") + '</h2><p>' + esc(lesson ? lesson[2] : "Tiếp tục bài đang học") + '</p><div class="daily-task-progress"><span><b>Tiến độ</b><b>' + Object.keys(state.msutong.completed).length + '/10</b></span><div class="daily-bar"><i style="width:' + Math.min(100, Object.keys(state.msutong.completed).length * 10) + '%"></i></div><button class="daily-action" data-daily-nav="msutong">Tiếp tục MSUTONG →</button></div></article>' +
      '<article class="daily-task"><span class="daily-task-kicker">ERP · 5 TỪ MỚI</span><h2>' + done + ' / 5 hôm nay</h2><p>Nhớ mặt chữ, pinyin và nghĩa Việt qua nhiều lượt gọi lại.</p><div class="daily-task-progress"><div class="daily-bar"><i style="width:' + done * 20 + '%"></i></div><button class="daily-action" data-daily-nav="daily">' + (done ? "Học tiếp" : "Bắt đầu") + ' +5</button></div></article>' +
      '<article class="daily-task"><span class="daily-task-kicker">ÔN TẬP CÁCH QUÃNG</span><h2>' + due + ' từ cần ôn</h2><p>Trả lời sai quay lại sớm; từ vững được giãn lịch ôn lâu hơn.</p><div class="daily-task-progress"><button class="daily-action" data-daily-nav="review">Ôn ngay ↻</button></div></article></div>' +
      '<div class="daily-summary"><span class="daily-pill">🦆 VDuckie đồng hành</span><span class="daily-pill">🔥 ' + totalMastered() + ' từ đã thuộc</span><span class="daily-pill">☁ Tiến độ dùng chung phone/PC khi đăng nhập</span></div></section>';
    bindNav(hub);
  }
  function totalMastered() { return Object.keys(state.words).filter(function (id) { return Number(state.words[id].stage || 0) >= 4; }).length; }
  function panel() { var node = document.getElementById("dailyLearningPanel"); if (!node) { node = document.createElement("section"); node.id = "dailyLearningPanel"; node.className = "panel daily-panel hidden"; var main = document.querySelector(".study-center main"); if (main) main.insertBefore(node, main.firstChild); } return node; }
  function showPanel(kind) {
    if (root.ERPAreaNavigation && root.ERPAreaNavigation.home) root.ERPAreaNavigation.home();
    var hub = document.getElementById("homeHub"); if (hub) hub.className = "home-hub hidden";
    var node = panel(); node.className = "panel daily-panel";
    if (kind === "msutong") renderRoadmap(node); else if (kind === "profile") renderProfile(node); else startSession(kind === "review", node);
    document.body.setAttribute("data-current-area", kind); root.scrollTo(0, 0);
  }
  function closePanel() { var node = panel(); node.className = "panel daily-panel hidden"; if (root.ERPAreaNavigation && root.ERPAreaNavigation.home) root.ERPAreaNavigation.home(); renderToday(); }
  function header(title, subtitle) { return '<header class="daily-panel-head"><div><span class="daily-task-kicker">VDUCKIE DAILY</span><h1>' + esc(title) + '</h1><p>' + esc(subtitle) + '</p></div><button class="daily-back" type="button" data-daily-close>← Hôm nay</button></header>'; }
  function renderRoadmap(node) {
    var html = header("Lộ trình MSUTONG", "12 quyển: 4 sơ cấp, 4 trung cấp, 4 cao cấp. Phần chưa đủ nguồn được ghi rõ, không giả làm nội dung hoàn chỉnh.") + '<div class="msutong-books">';
    BOOKS.forEach(function (book) { var open = book.id === state.msutong.currentBook, label = book.status === "partial" ? "Nội dung một phần" : "Đã ánh xạ lộ trình"; html += '<article class="msutong-book"><button type="button" data-book="' + book.id + '"><span class="msutong-book-number">' + book.number + '</span><span><strong>' + book.level + ' ' + book.number + '</strong><small>' + esc(book.note || "Biết vị trí trong bộ sách; chờ nguồn hợp pháp để bổ sung bài.") + '</small></span><i class="content-status ' + book.status + '">' + label + '</i></button>' + (open && book.lessons ? '<div class="msutong-lessons">' + book.lessons.map(function (lesson, index) { var done = !!state.msutong.completed[lesson[0]], current = lesson[0] === state.msutong.currentLesson; return '<button type="button" class="msutong-lesson' + (done ? " done" : "") + (current ? " current" : "") + '" data-lesson="' + lesson[0] + '"><span>' + (done ? "✓" : index + 1) + '</span><span><strong>' + esc(lesson[1]) + '</strong><small>' + esc(lesson[2]) + '</small></span><b>›</b></button>'; }).join("") + '</div>' : "") + '</article>'; });
    node.innerHTML = html + '</div>'; bindClose(node);
    node.querySelectorAll("[data-book]").forEach(function (button) { button.onclick = function () { var book = BOOKS.find(function (item) { return item.id === button.dataset.book; }); if (!book.lessons) return; state.msutong.currentBook = book.id; save(); renderRoadmap(node); }; });
    node.querySelectorAll("[data-lesson]").forEach(function (button) { button.onclick = function () { state.msutong.currentLesson = button.dataset.lesson; save(); renderLesson(node); }; });
  }
  function renderLesson(node) { var lesson = currentLesson(); if (!lesson) return renderRoadmap(node); node.innerHTML = header(lesson[1], lesson[2]) + '<article class="lesson-detail"><span class="content-status partial">VDuckie bổ trợ · không phải bản sao giáo trình</span><h2>' + esc(lesson[1]) + '</h2><div class="lesson-objectives">' + lesson[3].map(function (item) { return '<div class="lesson-objective">✓ ' + esc(item) + '</div>'; }).join("") + '</div><p class="lesson-note">Lộ trình dựa trên cấu trúc công khai của bộ MSUTONG. Hội thoại và bài tập chi tiết sẽ được VDuckie viết nguyên bản khi có đủ nguồn xác minh hợp pháp.</p><button class="daily-action" id="completeMsutongLesson">' + (state.msutong.completed[lesson[0]] ? "✓ Đã hoàn thành" : "Đánh dấu hoàn thành") + '</button></article>'; bindClose(node); document.getElementById("completeMsutongLesson").onclick = function () { state.msutong.completed[lesson[0]] = Date.now(); var book = BOOKS[0], idx = book.lessons.findIndex(function (item) { return item[0] === lesson[0]; }); if (book.lessons[idx + 1]) state.msutong.currentLesson = book.lessons[idx + 1][0]; save(); renderRoadmap(node); }; }

  function buildExercises(terms) { var all = root.ERP_TERMS || [], out = []; terms.forEach(function (term) { ["meaning", "pinyin", "write"].forEach(function (mode) { out.push({ term: term, mode: mode, distractors: all.filter(function (x) { return x[0] !== term[0]; }).slice(hash(term[0] + mode) % Math.max(1, all.length - 4), hash(term[0] + mode) % Math.max(1, all.length - 4) + 3) }); }); }); return out; }
  function startSession(review, node) { var terms = review ? dueTerms() : todayTerms(); session = { review: review, exercises: buildExercises(terms), index: 0, answered: false }; if (!terms.length) { node.innerHTML = header(review ? "Ôn tập" : "ERP Daily 5", "Không có mục nào đang chờ.") + '<div class="daily-empty"><h2>Hôm nay xong rồi 🎉</h2><p>Quay lại ngày mai để nhận từ mới và lịch ôn tiếp theo.</p></div>'; return bindClose(node); } renderExercise(node); }
  function renderExercise(node) { var ex = session.exercises[session.index], term = ex.term, mode = ex.mode, m = meta(wordId(term)); var prompt = mode === "meaning" ? "Chọn nghĩa tiếng Việt" : mode === "pinyin" ? "Chọn pinyin đúng" : "Gõ lại chữ Hán từ nghĩa tiếng Việt"; var body = mode === "write" ? '<span class="meaning">' + esc(term[3]) + '</span><input class="daily-input" id="dailyAnswer" autocomplete="off" placeholder="Nhập chữ Hán"><button class="daily-submit" id="dailySubmit">Kiểm tra</button>' : '<span class="hanzi">' + esc(term[0]) + '</span>' + (mode === "meaning" ? '<span class="pinyin">' + esc(term[1]) + '</span>' : "") + '<div class="daily-options">' + shuffle([term].concat(ex.distractors)).map(function (item) { var label = mode === "meaning" ? item[3] : item[1]; return '<button type="button" data-answer="' + esc(item[0]) + '">' + esc(label) + '</button>'; }).join("") + '</div>'; node.innerHTML = header(session.review ? "Ôn từ đến hạn" : "5 từ ERP hôm nay", (session.index + 1) + " / " + session.exercises.length + " · " + prompt) + '<div class="daily-session"><article class="daily-word-card">' + body + '<button class="daily-back" id="dailySpeak" type="button">♪ Nghe</button><span class="memory-stage">' + STAGES[Math.min(4, m.stage || 0)] + '</span><div class="daily-feedback" id="dailyFeedback"></div></article><div class="daily-session-nav"><button type="button" data-daily-close>Thoát</button><button type="button" id="dailyNext" disabled>Tiếp →</button></div></div>'; bindClose(node); document.getElementById("dailySpeak").onclick = function () { speak(term[0]); }; document.getElementById("dailyNext").onclick = nextExercise;
    if (mode === "write") { document.getElementById("dailySubmit").onclick = function () { answer(document.getElementById("dailyAnswer").value.trim() === term[0], mode, term, node); }; } else node.querySelectorAll("[data-answer]").forEach(function (button) { button.onclick = function () { if (session.answered) return; var correct = button.dataset.answer === term[0]; button.classList.add(correct ? "correct" : "wrong"); answer(correct, mode, term, node); }; });
  }
  function shuffle(values) { return values.slice().sort(function (a, b) { return hash(a[0] + dateKey()) - hash(b[0] + dateKey()); }); }
  function answer(correct, mode, term) { if (session.answered) return; session.answered = true; var m = meta(wordId(term)), now = Date.now(); m.skills[mode] = m.skills[mode] || { correct: 0, wrong: 0 }; if (correct) { m.correct++; m.skills[mode].correct++; if (m.correct >= [0, 3, 6, 9, 12][Math.min(4, m.stage + 1)]) m.stage = Math.min(4, m.stage + 1); } else { m.wrong++; m.skills[mode].wrong++; m.stage = Math.max(0, m.stage - 1); } m.lastReviewed = now; m.nextReview = now + (correct ? INTERVALS[Math.max(1, m.stage)] * DAY : 10 * 60000); m.updatedAt = now; save(); var feedback = document.getElementById("dailyFeedback"); feedback.className = "daily-feedback " + (correct ? "good" : "bad"); feedback.textContent = correct ? "Đúng rồi. Tiếp tục gọi lại để nhớ chắc." : "Chưa đúng: " + term[0] + " · " + term[1] + " · " + term[3]; document.getElementById("dailyNext").disabled = false; }
  function nextExercise() { session.index++; session.answered = false; if (session.index >= session.exercises.length) { var node = panel(); node.innerHTML = header("Hoàn thành phiên học", "Tiến độ đã lưu trên thiết bị và sẽ đồng bộ khi đăng nhập.") + '<div class="daily-empty"><h2>干得好! Làm tốt lắm.</h2><p>Một câu đúng chưa đủ để thuộc. VDuckie đã lên lịch đưa các từ này quay lại.</p><button class="daily-action" data-daily-close>Về Hôm nay</button></div>'; bindClose(node); return; } renderExercise(panel()); }
  function renderProfile(node) { node.innerHTML = header("VDuckie của bạn", "Thống kê học tập và các tính năng hiện có.") + '<div class="daily-summary"><span class="daily-pill">' + totalMastered() + ' từ ERP đã thuộc</span><span class="daily-pill">' + Object.keys(state.msutong.completed).length + ' bài MSUTONG hoàn thành</span><span class="daily-pill">Roast Mode vẫn hoạt động trong bài luyện</span></div>'; bindClose(node); }
  function bindClose(node) { node.querySelectorAll("[data-daily-close]").forEach(function (button) { button.onclick = closePanel; }); }
  function bindNav(scope) { (scope || document).querySelectorAll("[data-daily-nav]").forEach(function (button) { button.onclick = function () { showPanel(button.dataset.dailyNav); }; }); }
  function bindLegacyNav() { document.querySelectorAll("[data-area],[data-home],[data-view],#brandHome").forEach(function (button) { button.addEventListener("click", function () { var node = document.getElementById("dailyLearningPanel"); if (node) node.className = "panel daily-panel hidden"; }); }); }
  function updateDock() { var due = dueTerms().length, done = todayDone(), badge = document.querySelector(".dock-badge"); if (badge) { badge.textContent = due; badge.style.display = due ? "block" : "none"; } var progress = document.querySelector(".dock-five-progress"); if (progress) progress.textContent = done + "/5"; }
  function installDock() { if (document.getElementById("mobileLearningDock")) return; var dock = document.createElement("nav"); dock.id = "mobileLearningDock"; dock.className = "mobile-learning-dock"; dock.setAttribute("aria-label", "Điều hướng học hằng ngày"); dock.innerHTML = '<button data-daily-home><b>⌂</b><span>Hôm nay</span></button><button data-daily-nav="msutong"><b>路</b><span>MSUTONG</span></button><button class="daily-five" data-daily-nav="daily"><b>+5</b><span class="dock-five-progress">0/5</span></button><button data-daily-nav="review"><b>↻</b><span>Ôn tập</span><i class="dock-badge">0</i></button><button data-daily-nav="profile"><b>🦆</b><span>VDuckie</span></button>'; document.body.appendChild(dock); bindNav(dock); dock.querySelector("[data-daily-home]").onclick = closePanel; var offline = document.createElement("div"); offline.className = "daily-offline"; offline.textContent = "Đang ngoại tuyến · tiến độ chưa đồng bộ cloud"; document.body.appendChild(offline); }
  function networkState() { document.body.classList.toggle("vduckie-offline", !navigator.onLine); }
  function init() { renderToday(); installDock(); bindNav(document); bindLegacyNav(); updateDock(); networkState(); root.addEventListener("online", networkState); root.addEventListener("offline", networkState); document.addEventListener("vduckie:daily-learning-synced", function (event) { mergeRemote(event.detail); }); if (root.VDuckieCloud && root.VDuckieCloud.loadDailyLearning) root.VDuckieCloud.loadDailyLearning().then(mergeRemote); }

  root.VDuckieDailyLearning = Object.freeze({ getState: function () { return normalize(state); }, mergeRemote: mergeRemote, todayTerms: todayTerms, dueTerms: dueTerms, books: BOOKS, show: showPanel });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})(window, document);
