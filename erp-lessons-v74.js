(function (root) {
  "use strict";

  var content = root.ERPContentV74;
  var host = document.getElementById("erpLessonApp");
  if (!content || !host) return;

  var lessons = content.lessons || [];
  var lessonIndex = 0;
  var quizIndex = 0;
  var quizScore = 0;
  var quizAnswered = false;
  var progress = {};
  var storageKey = "vduckie-erp-v74-progress";

  try {
    progress = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (!progress || typeof progress !== "object" || progress instanceof Array) progress = {};
  } catch (error) {
    progress = {};
  }

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function termMap() {
    var map = {};
    var terms = root.ERP_TERMS || [];
    for (var i = 0; i < terms.length; i++) map[terms[i][0]] = terms[i];
    return map;
  }

  function saveProgress() {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch (error) {}
    document.dispatchEvent(new CustomEvent("vduckie:erp-lesson-progress", { detail: progress }));
  }

  function completedCount() {
    var count = 0;
    for (var i = 0; i < lessons.length; i++) if (progress[lessons[i].id]) count++;
    return count;
  }

  function speak(value) {
    if (!value || !root.speechSynthesis) return;
    root.speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = "zh-CN";
    utterance.rate = 0.72;
    var voices = root.speechSynthesis.getVoices();
    for (var i = 0; i < voices.length; i++) {
      if (/^zh/i.test(voices[i].lang)) { utterance.voice = voices[i]; break; }
    }
    root.speechSynthesis.speak(utterance);
  }

  function lessonNavigation() {
    var html = "";
    for (var i = 0; i < lessons.length; i++) {
      var item = lessons[i];
      html += '<button class="erp-module-link' + (i === lessonIndex ? " active" : "") + (progress[item.id] ? " done" : "") + '" type="button" data-module-index="' + i + '">';
      html += '<span class="erp-module-number">' + (progress[item.id] ? "✓" : esc(item.number)) + "</span>";
      html += "<span><strong>" + esc(item.title) + "</strong><small>" + esc(item.subtitle) + "</small></span></button>";
    }
    return html;
  }

  function wordCards(lesson, map) {
    var html = "";
    for (var i = 0; i < lesson.words.length; i++) {
      var term = map[lesson.words[i]];
      if (!term) continue;
      html += '<article class="erp-lesson-word"><div><strong>' + esc(term[0]) + '</strong><b>' + esc(term[1]) + '</b><i>Gần âm: ' + esc(term[2] || "—") + "</i></div>";
      html += "<p>" + esc(term[3]) + "</p>";
      html += '<button type="button" class="erp-word-speak" data-speak="' + esc(term[0]) + '" aria-label="Nghe ' + esc(term[0]) + '">♪</button></article>';
    }
    return html;
  }

  function workflow(lesson) {
    var html = "";
    for (var i = 0; i < lesson.workflow.length; i++) {
      html += '<li><span class="erp-flow-number">' + (i + 1) + "</span><span><strong>" + esc(lesson.workflow[i][0]) + "</strong><small>" + esc(lesson.workflow[i][1]) + "</small></span>";
      html += '<button type="button" class="erp-flow-speak" data-speak="' + esc(lesson.workflow[i][0]) + '">♪ Nghe</button></li>';
    }
    return html;
  }

  function quizOptions(lesson, map) {
    var word = lesson.words[quizIndex];
    var indices = [quizIndex, quizIndex + 3, quizIndex + 6, quizIndex + 8];
    var seen = {};
    var options = [];
    for (var i = 0; i < indices.length; i++) {
      var candidate = lesson.words[indices[i] % lesson.words.length];
      if (!seen[candidate]) { options.push(candidate); seen[candidate] = true; }
    }
    for (var j = 0; options.length < 4 && j < lesson.words.length; j++) {
      if (!seen[lesson.words[j]]) { options.push(lesson.words[j]); seen[lesson.words[j]] = true; }
    }
    options.sort(function (a, b) { return a.charCodeAt(0) - b.charCodeAt(0); });
    var html = "";
    for (var k = 0; k < options.length; k++) {
      var optionTerm = map[options[k]];
      if (!optionTerm) continue;
      html += '<button type="button" class="erp-module-option" data-answer="' + esc(options[k]) + '">' + esc(optionTerm[3]) + "</button>";
    }
    return { word: word, html: html };
  }

  function quizMarkup(lesson, map) {
    if (quizIndex >= 5) {
      var passed = quizScore >= 4;
      return '<div class="erp-module-result ' + (passed ? "pass" : "retry") + '"><span>' + (passed ? "✓" : "↻") + "</span><strong>" + quizScore + "/5 câu đúng</strong><p>" + (passed ? "Đã hoàn thành bài nghiệp vụ này. Tiến độ được lưu trên thiết bị." : "Cần đúng ít nhất 4 câu. Xem lại từ trọng tâm rồi thử lại nhé.") + '</p><button type="button" class="' + (passed ? "muted" : "accent") + '" data-erp-retry> Làm lại bài kiểm tra</button></div>';
    }
    var quiz = quizOptions(lesson, map);
    var term = map[quiz.word];
    return '<div class="erp-module-quiz-head"><span>CÂU ' + (quizIndex + 1) + '/5</span><strong>' + quizScore + " điểm</strong></div>" +
      '<div class="erp-module-question"><strong>' + esc(term[0]) + '</strong><span>' + esc(term[1]) + "</span><p>Chọn nghĩa đúng trong nghiệp vụ ERP.</p></div>" +
      '<div class="erp-module-options" data-right="' + esc(term[0]) + '">' + quiz.html + "</div>" +
      '<div class="erp-module-feedback hidden" id="erpModuleFeedback"></div><button type="button" class="accent erp-module-next hidden" id="erpModuleNext">Câu tiếp theo →</button>';
  }

  function render() {
    if (!lessons.length) return;
    var lesson = lessons[lessonIndex];
    var map = termMap();
    var done = completedCount();
    host.innerHTML = '<div class="erp-curriculum-summary"><div><span>CONTENT PACK V74 · KHO & SẢN XUẤT</span><h2>Học theo đúng luồng nghiệp vụ</h2><p>8 bài · 80 từ trọng tâm · 20 tình huống hội thoại. Toàn bộ 154 thuật ngữ hiện đã có câu ví dụ.</p></div><div class="erp-curriculum-score"><strong>' + done + "/" + lessons.length + '</strong><span>bài hoàn thành</span><div class="bar"><i style="width:' + Math.round(done * 100 / lessons.length) + '%"></i></div></div></div>' +
      '<div class="erp-curriculum-layout"><aside class="erp-module-list">' + lessonNavigation() + '</aside><article class="erp-module-detail">' +
      '<header class="erp-module-head"><div><span>BÀI ' + esc(lesson.number) + "</span><h2>" + esc(lesson.title) + "</h2><p>" + esc(lesson.subtitle) + '</p></div><span class="erp-module-status">' + (progress[lesson.id] ? "✓ Đã hoàn thành" : "Đang học") + "</span></header>" +
      '<div class="erp-module-goal"><strong>Mục tiêu</strong><p>' + esc(lesson.goal) + "</p><small><b>Tình huống:</b> " + esc(lesson.scenario) + "</small></div>" +
      '<div class="erp-module-section"><div class="erp-module-title"><h3>10 từ trọng tâm</h3><button type="button" class="accent" data-start-pack>Học bằng thẻ →</button></div><div class="erp-lesson-words">' + wordCards(lesson, map) + "</div></div>" +
      '<div class="erp-module-section"><div class="erp-module-title"><h3>Quy trình cần nói được</h3><span>Trung (Việt)</span></div><ol class="erp-workflow">' + workflow(lesson) + "</ol></div>" +
      '<div class="erp-module-section"><div class="erp-module-title"><h3>Kiểm tra cuối bài</h3><button type="button" class="muted" data-open-dialogue>说 Luyện: ' + esc(lesson.dialogue) + ' →</button></div><div class="erp-module-quiz">' + quizMarkup(lesson, map) + "</div></div></article></div>";
    bind();
  }

  function bind() {
    var moduleButtons = host.querySelectorAll("[data-module-index]");
    for (var i = 0; i < moduleButtons.length; i++) moduleButtons[i].onclick = function () {
      lessonIndex = Number(this.getAttribute("data-module-index"));
      quizIndex = 0; quizScore = 0; quizAnswered = false; render();
      host.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    var speakers = host.querySelectorAll("[data-speak]");
    for (var j = 0; j < speakers.length; j++) speakers[j].onclick = function () { speak(this.getAttribute("data-speak")); };

    var startPack = host.querySelector("[data-start-pack]");
    if (startPack) startPack.onclick = function () {
      if (root.VDuckieERPStudy && root.VDuckieERPStudy.startWords) root.VDuckieERPStudy.startWords(lessons[lessonIndex].words);
    };

    var openDialogue = host.querySelector("[data-open-dialogue]");
    if (openDialogue) openDialogue.onclick = function () {
      var selector = document.getElementById("dialogueScenario");
      var title = lessons[lessonIndex].dialogue;
      if (selector) {
        for (var i = 0; i < selector.options.length; i++) if (selector.options[i].text === title) { selector.selectedIndex = i; selector.dispatchEvent(new Event("change")); break; }
      }
      var navigation = document.querySelector('#erpNav [data-view="dialogue"]');
      if (navigation) navigation.click();
    };

    var options = host.querySelectorAll(".erp-module-option");
    for (var k = 0; k < options.length; k++) options[k].onclick = answerQuiz;

    var next = document.getElementById("erpModuleNext");
    if (next) next.onclick = function () { quizIndex++; quizAnswered = false; render(); };

    var retry = host.querySelector("[data-erp-retry]");
    if (retry) retry.onclick = function () { quizIndex = 0; quizScore = 0; quizAnswered = false; render(); };
  }

  function answerQuiz() {
    if (quizAnswered) return;
    quizAnswered = true;
    var lesson = lessons[lessonIndex];
    var right = lesson.words[quizIndex];
    var buttons = host.querySelectorAll(".erp-module-option");
    var selected = this.getAttribute("data-answer");
    if (selected === right) quizScore++;
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].getAttribute("data-answer") === right) buttons[i].className = "erp-module-option correct";
      else if (buttons[i] === this) buttons[i].className = "erp-module-option wrong";
      buttons[i].disabled = true;
    }
    var feedback = document.getElementById("erpModuleFeedback");
    feedback.className = "erp-module-feedback " + (selected === right ? "good" : "bad");
    feedback.textContent = selected === right ? "Đúng. Từ này dùng được ngay trong quy trình." : "Chưa đúng. Đáp án: " + (termMap()[right] || [right, "", "", ""])[3] + ".";
    var next = document.getElementById("erpModuleNext");
    next.className = "accent erp-module-next";
    if (quizIndex === 4) {
      next.textContent = "Xem kết quả →";
      if (quizScore >= 4) { progress[lesson.id] = { completed_at: new Date().toISOString(), score: quizScore }; saveProgress(); }
    }
  }

  root.VDuckieERPLessons = {
    open: function (id) {
      for (var i = 0; i < lessons.length; i++) if (lessons[i].id === id) lessonIndex = i;
      quizIndex = 0; quizScore = 0; quizAnswered = false; render();
    },
    progress: function () { return progress; }
  };

  render();
})(typeof window !== "undefined" ? window : this);
