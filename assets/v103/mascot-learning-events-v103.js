(function(root,document){
  "use strict";
  if(root.__VDUCKIE_MASCOT_LEARNING_EVENTS_V103__)return;root.__VDUCKIE_MASCOT_LEARNING_EVENTS_V103__=true;
  var lastPronunciation="",lastStreak=null;
  function emit(event,source){document.dispatchEvent(new CustomEvent("vduckie:mascot-event",{detail:{event:event,options:{source:source||"learning-ui"}}}))}
  function normalized(value){return String(value||"").replace(/[\s，。！？、,.!?]/g,"")}
  document.addEventListener("click",function(event){
    var button=event.target.closest&&event.target.closest("button");if(!button)return;
    if(button.matches(".erp-module-option")){root.setTimeout(function(){emit(button.classList.contains("wrong")?"wrong-answer":"correct-answer","erp-quiz")},0);return}
    if(button.hasAttribute("data-hsk-option")){root.setTimeout(function(){var lesson=document.getElementById("hskLesson");emit(lesson&&lesson.querySelector(".hsk-quiz-option.wrong")?"wrong-answer":"correct-answer","hsk-quiz")},20);return}
    if(button.hasAttribute("data-hsk-reading-option")){root.setTimeout(function(){emit(button.classList.contains("wrong")?"wrong-answer":"correct-answer","hsk-reading")},0);return}
    if(button.getAttribute("data-hsk-action")==="dictation-check"){var input=document.getElementById("hskDictationInput");emit(input&&normalized(input.value)===normalized(button.getAttribute("data-answer"))?"correct-answer":"wrong-answer","hsk-dictation");return}
    var action=button.getAttribute("data-hsk-action");
    if(action==="section-complete"||action==="complete")emit("lesson-complete","hsk-lesson");
    if(button.hasAttribute("data-erp-complete"))emit("lesson-complete","erp-lesson");
  },true);
  function inspectPronunciation(){
    var feedback=document.querySelector("#pronunciationFeedback, [data-v62-speaking-feedback]");if(!feedback)return;
    var signature=feedback.className+"|"+feedback.textContent;if(signature===lastPronunciation)return;lastPronunciation=signature;
    if(feedback.classList.contains("good"))emit("pronunciation-good","pronunciation");
    else if(feedback.classList.contains("bad")&&feedback.textContent.trim())emit("pronunciation-wrong","pronunciation");
  }
  if(root.MutationObserver)new MutationObserver(function(){root.setTimeout(inspectPronunciation,0)}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["class"]});
  document.addEventListener("vduckie:retention-change",function(event){var value=event.detail&&event.detail.value;if(!value||typeof value.current!=="number")return;if(lastStreak!==null){if(value.current>lastStreak)emit("streak-increased","retention");else if(value.current<lastStreak)emit("streak-lost","retention")}lastStreak=value.current});
})(window,document);
