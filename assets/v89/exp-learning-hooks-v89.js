(function (root, document) {
  "use strict";
  var knownERP = {};
  var observedHSK = "";
  var dailyCount = null;
  function byId(id) { return document.getElementById(id); }
  function award(code, source) { return root.VDuckieEXP.awardEXP(code, source); }
  function clean(value) { return String(value || "").replace(/[\s，。！？、,.!?]/g, ""); }
  function readERP() {
    try { var value = JSON.parse(localStorage.getItem("vduckie-erp-v74-progress") || "{}"); return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
    catch (error) { return {}; }
  }
  function hskSource(suffix) {
    var state = { level: 0, lesson: 0 };
    try { state = JSON.parse(localStorage.getItem("erp-hsk-state-v2") || "{}"); } catch (error) {}
    var id = "l" + Number(state.level || 0) + "-n" + Number(state.lesson || 0);
    try {
      var levels = root.HSKCurriculum && root.HSKCurriculum.levels;
      var lesson = levels && levels[Number(state.level || 0)] && levels[Number(state.level || 0)][Number(state.lesson || 0)];
      if (lesson && lesson.id) id = String(lesson.id);
    } catch (error) {}
    return "hsk:" + id + ":" + suffix;
  }
  function bindERP() {
    knownERP = readERP();
    document.addEventListener("vduckie:erp-lesson-progress", function (event) {
      var progress = event.detail || {};
      Object.keys(progress).forEach(function (id) {
        var item = progress[id], previous = knownERP[id];
        if (!item || Number(item.score || 0) < 4) return;
        var lesson = "erp:" + id + ":lesson";
        if (!previous) {
          award("lesson_complete", lesson);
          award("quiz_pass", "erp:" + id + ":quiz");
        } else if (String(previous.completed_at || "") !== String(item.completed_at || "")) award("lesson_review", lesson);
      });
      knownERP = JSON.parse(JSON.stringify(progress));
    });
  }
  function bindHSK() {
    document.addEventListener("click", function (event) {
      var button = event.target.closest ? event.target.closest("#hskLesson button") : null;
      if (!button) return;
      var action = button.getAttribute("data-hsk-action");
      if (action === "section-complete" || action === "complete") {
        var source = hskSource("lesson"), id = source.split(":")[1];
        setTimeout(function () {
          var completed = {};
          try { completed = JSON.parse(localStorage.getItem("erp-hsk-progress-v2") || "{}"); } catch (error) {}
          if (completed[id]) award("lesson_complete", source);
        }, 0);
      }
      if (action === "dictation-check") {
        setTimeout(function () {
          var input = byId("hskDictationInput"), answer = button.getAttribute("data-answer");
          if (input && input.value.trim() && clean(input.value) === clean(answer)) award("dictation_complete", hskSource("dictation"));
        }, 0);
      }
    }, true);
    var host = byId("hskLesson");
    if (host && root.MutationObserver) new MutationObserver(function () {
      var passed = host.querySelector(".hsk-result.pass");
      if (!passed) { observedHSK = ""; return; }
      var quiz = hskSource("quiz");
      if (observedHSK === quiz) return;
      observedHSK = quiz;
      var lesson = hskSource("lesson");
      award("lesson_complete", lesson);
      award("quiz_pass", quiz).then(function (result) {
        if (!result.awarded && result.reason === "duplicate") award("lesson_review", lesson);
      });
    }).observe(host, { childList: true, subtree: true });
  }
  function bindDailyGoal() {
    var done = byId("doneCount"); if (!done || !root.MutationObserver) return;
    dailyCount = Number(done.textContent || 0);
    new MutationObserver(function () {
      var current = Number(done.textContent || 0), target = Number((byId("targetCount") || {}).textContent || 10);
      if (dailyCount !== null && dailyCount < target && current >= target) award("daily_goal", "daily-words");
      dailyCount = current;
    }).observe(done, { childList: true, characterData: true, subtree: true });
  }
  function init() { bindERP(); bindHSK(); bindDailyGoal(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(window, document);
