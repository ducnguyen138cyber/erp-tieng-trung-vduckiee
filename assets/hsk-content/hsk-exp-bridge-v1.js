/* EXP bridge for verified HSK lesson attempts. Server award_exp enforces unique sources/daily caps. */
(function(root,document){
"use strict";
if(!root||!document||root.VDuckieHskEXPBridge)return;
var timer=null,busy=false,limitPerPass=20;
function journal(){return root.VDuckieHskStudyJourney;}
function session(){var core=root.VDuckieEXPCore;return core&&typeof core.session==="function"?core.session():null;}
function key(userId){return "vduckie-hsk-exp-receipts-v1:"+userId;}
function receipts(userId){try{return JSON.parse(root.localStorage.getItem(key(userId))||"{}")||{};}catch(e){return {};}}
function saveReceipt(userId,source){try{var data=receipts(userId);data[source]=Date.now();root.localStorage.setItem(key(userId),JSON.stringify(data));}catch(e){}}
function earnedActions(){
 var j=journal();if(!j)return [];
 var entries=j.load().lessons||{},actions=[];
 Object.keys(entries).sort().forEach(function(id){
  var e=entries[id],answers=e&&e.answers||{},checked=Object.keys(answers).length;
  var total=Number(e&&e.exercises||0);
  if(!e||!e.completedAt||total<1||checked<total||!/^hsk[1-4]-lesson-[0-9]+$/.test(id))return;
  var graded=Object.keys(answers).map(function(k){return answers[k]&&answers[k].correct;}).filter(function(x){return typeof x==="boolean";});
  var correct=graded.filter(Boolean).length;
  actions.push({activity:"lesson_complete",source:"hsk:"+id+":lesson"});
  if(graded.length>=3&&correct/graded.length>=0.8)actions.push({activity:"quiz_pass",source:"hsk:"+id+":quiz"});
 });
 return actions;
}
function scan(){
 if(busy||!root.VDuckieEXP||typeof root.VDuckieEXP.awardEXP!=="function")return Promise.resolve([]);
 var s=session();if(!s||!s.user||!s.user.id)return Promise.resolve([]);
 var userId=s.user.id;
 var confirmed=receipts(userId);
 var eligible=earnedActions().filter(function(a){return !confirmed[a.source];}).slice(0,limitPerPass);
 if(!eligible.length)return Promise.resolve([]);
 busy=true;var results=[];
 var chain=Promise.resolve();
 eligible.forEach(function(action){chain=chain.then(function(){
   return root.VDuckieEXP.awardEXP(action.activity,action.source).then(function(r){
     results.push({source:action.source,awarded:!!r.awarded,reason:r.reason});
     if(r.awarded||r.reason==="duplicate")saveReceipt(userId,action.source);
   });
 });});
 return chain.catch(function(err){if(root.console&&root.console.warn)root.console.warn("HSK EXP reconciliation:",err);return results;}).finally(function(){busy=false;});
}
function schedule(){if(timer)root.clearTimeout(timer);timer=root.setTimeout(function(){timer=null;scan();},250);}
document.addEventListener("vduckie:hsk-study-journey-change",schedule);
document.addEventListener("vduckie:account-learning-synced",schedule);
document.addEventListener("vduckie:exp-session",schedule);
root.addEventListener("online",schedule);
root.VDuckieHskEXPBridge=Object.freeze({scan:scan,earnedActions:earnedActions});
schedule();
})(window,document);
