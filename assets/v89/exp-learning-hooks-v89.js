(function (root, document) {
  "use strict";
  var knownERP = {};
  var observedHSK = "";
  var dailyCount = null;
  function byId(id) { return document.getElementById(id); }
  function award(code, source) { return root.VDuckieEXP.awardEXP(code, source); }
  function clean(value) { return String(value || "").replace(/[\s，。！？、,.!?]/g, ""); }
  function hskPreviewReadOnly() {
    return !!(
      (root.HSKCurriculum && root.HSKCurriculum.previewMode === "canonical") ||
      (document.body && document.body.getAttribute("data-hsk-curriculum-preview") === "canonical")
    );
  }
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
      if (hskPreviewReadOnly()) return;
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
          if (hskPreviewReadOnly()) return;
          var input = byId("hskDictationInput"), answer = button.getAttribute("data-answer");
          if (input && input.value.trim() && clean(input.value) === clean(answer)) award("dictation_complete", hskSource("dictation"));
        }, 0);
      }
    }, true);
    var host = byId("hskLesson");
    if (host && root.MutationObserver) new MutationObserver(function () {
      if (hskPreviewReadOnly()) { observedHSK = ""; return; }
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
  function awardPrimaryHSK(info){
    info=info||{};
    var id=String(info.lessonId||"");
    if(!/^hsk[1-4]-lesson-[0-9]{2,3}$/.test(id))return Promise.resolve();
    var source="hsk:"+id;
    return award("lesson_complete",source+":lesson").then(function(result){
      // Quiz EXP requires at least three automatically graded answers and >=70% accuracy.
      if(Number(info.graded||0)>=3&&Number(info.correct||0)/Number(info.graded)>=0.7){
        return award("quiz_pass",source+":quiz");
      }
      return result;
    });
  }
  function bindPrimaryHSK(){
    document.addEventListener("vduckie:hsk-learner-completed",function(event){
      awardPrimaryHSK(event.detail);
    });
    // Reconcile previously finished HSK lessons after login or account sync.
    // The database's unique dedupe key prevents repeat EXP for the same completion.
    var processing=false;
    function reconcile(){
      if(processing||!root.VDuckieEXPCore||!root.VDuckieEXPCore.session()||
         !root.VDuckieEXPCore.session().user||!root.VDuckieHskStudyJourney)return;
      var journal=root.VDuckieHskStudyJourney.load(),pending=[];
      Object.keys(journal.lessons||{}).forEach(function(id){
        var lesson=journal.lessons[id];
        if(!lesson||!lesson.completedAt||!/^hsk[1-4]-lesson-[0-9]{2,3}$/.test(id))return;
        // Historic local study journals do not store exercise review-status proof.
        // Recover only the one-time lesson completion bonus, never infer a quiz pass.
        pending.push({lessonId:id,graded:0,correct:0});
      });
      if(!pending.length)return;
      processing=true;
      var chain=Promise.resolve();
      pending.slice(0,136).forEach(function(item){chain=chain.then(function(){return awardPrimaryHSK(item);});});
      chain.finally(function(){processing=false;});
    }
    if(root.VDuckieEXPCore&&typeof root.VDuckieEXPCore.onSession==="function"){
      root.VDuckieEXPCore.onSession(function(session){if(session&&session.user)reconcile();});
    }
    document.addEventListener("vduckie:account-learning-synced",reconcile);
  }
  function bindWordMastery(){
    var inFlight={};
    document.addEventListener("vduckie:hsk-word-mastered",function(event){
      var detail=event.detail||{},level=Number(detail.level),hanzi=String(detail.hanzi||"").trim();
      if(level<1||level>4||!hanzi||!root.VDuckieEXP||!root.VDuckieEXP.awardWordMastery)return;
      var key=level+":"+hanzi;
      if(inFlight[key])return;
      inFlight[key]=true;
      root.VDuckieEXP.awardWordMastery(level,hanzi,detail.origin||null).finally(function(){delete inFlight[key];});
    });
    // Reconcile words already recalled locally, without granting points to unverified page visits.
    // Server dedupe makes this safe to retry after sign-in and account profile sync.
    var reconciling=false,lastUser="";
    function reconcileWords(){
      var core=root.VDuckieEXPCore,journey=root.VDuckieHskStudyJourney;
      var session=core&&core.session&&core.session();
      if(reconciling||!session||!session.user||!journey||!root.VDuckieEXP.awardWordMastery)return;
      var user=session.user.id;
      var saved=journey.load().reviews||{},eligible=Object.keys(saved).map(function(key){return saved[key];})
        .filter(function(item){return item&&Number(item.correct)>0&&Number(item.level)>=1&&Number(item.level)<=4&&item.hanzi;});
      if(!eligible.length)return;
      reconciling=true;
      var chain=Promise.resolve();
      eligible.slice(0,10).forEach(function(item){
        chain=chain.then(function(){return root.VDuckieEXP.awardWordMastery(item.level,item.hanzi);});
      });
      chain.finally(function(){reconciling=false;lastUser=user;});
    }
    if(root.VDuckieEXPCore&&typeof root.VDuckieEXPCore.onSession==="function"){
      root.VDuckieEXPCore.onSession(function(session){if(session&&session.user&&session.user.id!==lastUser)reconcileWords();});
    }
    document.addEventListener("vduckie:account-learning-synced",reconcileWords);
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
  function init() { bindERP(); bindHSK(); bindPrimaryHSK(); bindWordMastery(); bindDailyGoal(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(window, document);
