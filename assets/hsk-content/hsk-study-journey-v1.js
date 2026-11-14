/* VDuckie HSK study journal: learner self-study progress, separate from canonical read-only content and legacy MSUTONG. */
(function(root,factory){
  "use strict";
  var api=factory(root||{});
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.VDuckieHskStudyJourney=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  var KEY="vduckie-hsk-study-journey-v1", DAY=86400000;
  var memory=root.VDuckieLearningProgressMerge || (typeof require==="function"?require("../v82/learning-progress-merge-v1.js"):null);
  function safe(value){return String(value==null?"":value).trim();}
  function now(){return Date.now();}
  function empty(){return {version:1,current:{level:1,lessonId:""},lessons:{},reviews:{},updatedAt:0};}
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function object(value){return value&&typeof value==="object"&&!Array.isArray(value)?value:{};}
  function load(){
    var saved;try{saved=JSON.parse(root.localStorage.getItem(KEY)||"{}");}catch(error){saved={};}
    saved=object(saved);var base=empty();
    base.current=Object.assign(base.current,object(saved.current));
    base.current.level=Math.max(1,Math.min(4,Number(base.current.level)||1));
    base.current.lessonId=safe(base.current.lessonId);
    base.lessons=object(saved.lessons);base.reviews=object(saved.reviews);
    base.updatedAt=Number(saved.updatedAt)||0;return base;
  }
  function emit(data){
    data.updatedAt=now();
    try{root.localStorage.setItem(KEY,JSON.stringify(data));}catch(error){return false;}
    try{root.document.dispatchEvent(new root.CustomEvent("vduckie:hsk-study-journey-change",{detail:copy(data)}));}catch(error){}
    return true;
  }
  function current(){return copy(load().current);}
  function visit(level,lessonId){
    level=Number(level);lessonId=safe(lessonId);
    if(level<1||level>4||!lessonId)return false;
    var data=load();
    if(data.current.level===level&&data.current.lessonId===lessonId)return true;
    data.current={level:level,lessonId:lessonId,updatedAt:now()};return emit(data);
  }
  function lesson(id){return copy(object(load().lessons[safe(id)]));}
  function position(level,lessonId,value){
    var data=load(),entry=object(data.lessons[safe(lessonId)]);
    if(!lessonId||Number(level)<1||Number(level)>4)return false;
    entry.level=Number(level);entry.position=Object.assign({},object(entry.position),object(value),{updatedAt:now()});entry.updatedAt=now();
    data.lessons[lessonId]=entry;data.current={level:Number(level),lessonId:lessonId,updatedAt:now()};return emit(data);
  }
  function contentDone(level,lessonId,stage){
    if(['words','examples','extra'].indexOf(stage)<0)return false;
    var data=load(),entry=object(data.lessons[safe(lessonId)]);
    entry.level=Number(level);entry.content=object(entry.content);entry.content[stage]=now();
    data.lessons[lessonId]=entry;data.current={level:Number(level),lessonId:lessonId,updatedAt:now()};return emit(data);
  }
  function retry(lessonId){
    var data=load(),entry=object(data.lessons[safe(lessonId)]);
    entry.masteryAnswers={};entry.attemptAt=now();data.lessons[lessonId]=entry;return emit(data);
  }
  function recordAnswer(level,lessonId,exerciseId,correct,verified,verifiedIds){
    level=Number(level);lessonId=safe(lessonId);exerciseId=safe(exerciseId);
    if(level<1||level>4||!lessonId||!exerciseId)return false;
    var data=load(),entry=object(data.lessons[lessonId]);
    entry.level=level;entry.answers=object(entry.answers);
    if(Array.isArray(verifiedIds))entry.verifiedIds=verifiedIds.slice();
    entry.answers[exerciseId]={correct:correct===true?true:correct===false?false:null,at:now()};
    entry.updatedAt=now();entry.answerHistory=object(entry.answerHistory);
    if(memory)entry.answerHistory[memory.eventId()]={exerciseId:exerciseId,correct:entry.answers[exerciseId].correct,at:now(),attemptAt:Number(entry.attemptAt)||0};
    // First submitted answer in this attempt only. Revealing/correcting an answer is practice.
    entry.masteryAnswers=object(entry.masteryAnswers);
    if(verified===true&&typeof correct==='boolean'&&!entry.masteryAnswers[exerciseId]){
      entry.masteryAnswers[exerciseId]={correct:correct,at:now(),verified:true};
    }
    data.lessons[lessonId]=entry;data.current={level:level,lessonId:lessonId,updatedAt:now()};
    return emit(data);
  }
  function stats(lessonId,total,verifiedIds){
    var entry=object(load().lessons[safe(lessonId)]),answers=object(entry.answers);
    var ids=Array.isArray(total)?total:null;
    var records=(ids||Object.keys(answers)).map(function(key){return answers[key];}).filter(Boolean);
    var checked=records.length, graded=records.filter(function(x){return x&&typeof x.correct==="boolean";});
    var evidence=object(entry.masteryAnswers),required=verifiedIds||entry.verifiedIds||Object.keys(evidence);
    var tested=required.map(function(id){return evidence[id];}).filter(function(x){return x&&x.verified===true&&typeof x.correct==='boolean';});
    var correct=tested.filter(function(x){return x.correct;}).length;
    var mastered=!!entry.completedAt&&required.length>0&&tested.length===required.length&&correct/tested.length>=.8;
    return {total:ids?ids.length:Math.max(0,Number(total)||0),checked:checked,correct:graded.filter(function(x){return x.correct;}).length,graded:graded.length,completed:!!entry.completedAt,completedAt:Number(entry.completedAt)||0,
      mastered:mastered,verifiedTotal:required.length,verifiedChecked:tested.length,verifiedCorrect:correct,accuracy:tested.length?Math.round(correct*100/tested.length):null};
  }
  function reviewKey(level,hanzi){return String(level)+":"+safe(hanzi);}
  function complete(level,lessonId,total,words,requirements){
    var ids=Array.isArray(total)?total:null;
    level=Number(level);lessonId=safe(lessonId);total=ids?ids.length:Math.max(0,Number(total)||0);
    if(level<1||level>4||!lessonId)return {ok:false,reason:"invalid-lesson"};
    var data=load(),entry=object(data.lessons[lessonId]),answers=object(entry.answers),checked=(ids||Object.keys(answers)).filter(function(id){return !!answers[id];}).length;
    var missing=((requirements&&requirements.content)||[]).filter(function(stage){return !object(entry.content)[stage];});
    if(!entry.completedAt&&missing.length)return {ok:false,reason:'unfinished-content',remaining:missing.length};
    if(checked<total)return {ok:false,reason:"unfinished-practice",remaining:total-checked,checked:checked,total:total};
    if(!entry.completedAt)entry.completedAt=now();
    entry.level=level;entry.answers=answers;entry.exercises=total;
    if(requirements&&Array.isArray(requirements.verifiedIds))entry.verifiedIds=requirements.verifiedIds.slice();
    data.lessons[lessonId]=entry;data.current={level:level,lessonId:lessonId,updatedAt:now()};
    (Array.isArray(words)?words:[]).forEach(function(word){
      if(!word||!safe(word.hanzi))return;
      var key=reviewKey(level,word.hanzi);
      if(data.reviews[key])return; // finishing the same lesson never resets an established review schedule
      data.reviews[key]={level:level,lessonId:lessonId,hanzi:safe(word.hanzi),pinyin:safe(word.pinyin),meaningVi:safe(word.meaningVi),stage:0,lastAt:now(),nextAt:now()+DAY};
    });
    if(!emit(data))return {ok:false,reason:"storage-unavailable"};
    return Object.assign({ok:true},stats(lessonId,ids||total,requirements&&requirements.verifiedIds));
  }
  function due(level,includeFuture){
    var reviews=load().reviews;var items=Object.keys(reviews).map(function(k){return reviews[k];}).filter(function(item){
      return item&&safe(item.hanzi)&&(!level||Number(item.level)===Number(level))&&
        (includeFuture||Number(item.nextAt||0)<=now());
    });
    return items.sort(function(a,b){return Number(!!b.weak)-Number(!!a.weak)||Number(b.mistakes||0)-Number(a.mistakes||0)||Number(a.nextAt)-Number(b.nextAt)||safe(a.hanzi).localeCompare(safe(b.hanzi));});
  }
  function reviewWord(level,hanzi,known,options){
    var data=load(),key=reviewKey(level,hanzi),item=data.reviews[key];
    if(!item||!memory)return false;
    var event={id:memory.eventId(),at:now(),kind:options&&options.exposed?'reveal':'review',correct:known===true,retrieval:!!(options&&options.retrieval)};
    data.reviews[key]=memory.wordEvent(item,event);
    return emit(data);
  }
  function recordWord(level,lessonId,hanzi,correct,pinyin,meaningVi){
    level=Number(level);lessonId=safe(lessonId);hanzi=safe(hanzi);
    if(level<1||level>4||!lessonId||!hanzi||typeof correct!=='boolean'||!memory)return false;
    var data=load(),key=reviewKey(level,hanzi),item=object(data.reviews[key]);
    item.level=level;item.lessonId=lessonId;item.hanzi=hanzi;
    item.pinyin=safe(pinyin)||safe(item.pinyin);item.meaningVi=safe(meaningVi)||safe(item.meaningVi);
    data.reviews[key]=memory.wordEvent(item,{id:memory.eventId(),at:now(),kind:'study',correct:correct});
    return emit(data);
  }
  function wordStats(){
    var reviews=load().reviews,words=Object.keys(reviews).map(function(key){return reviews[key];}).filter(Boolean);
    var correct=0,attempts=0;
    words.forEach(function(word){attempts+=Number(word.attempts)||0;correct+=Number(word.correct)||0;});
    return {seen:words.length,attempted:words.filter(function(word){return Number(word.attempts)>0;}).length,studied:words.length,remembered:words.filter(function(word){return !word.weak&&Number(word.spacedRecalls)>=3;}).length,weak:words.filter(function(word){return !!word.weak;}).length,
      attempts:attempts,correct:correct,accuracy:attempts?Math.round(correct*100/attempts):null};
  }
  function weakWords(level){
    var reviews=load().reviews;
    return Object.keys(reviews).map(function(key){return reviews[key];}).filter(function(item){
      return item&&item.weak&&(!level||Number(item.level)===Number(level));
    }).sort(function(a,b){return Number(b.mistakes||0)-Number(a.mistakes||0);});
  }
  function levelCount(level){
    var lessons=load().lessons;
    return Object.keys(lessons).filter(function(id){return Number(lessons[id]&&lessons[id].level)===Number(level)&&!!lessons[id].completedAt;}).length;
  }
  function summary(){var data=load();return Object.assign({current:copy(data.current),totalCompleted:Object.keys(data.lessons).filter(function(id){return !!data.lessons[id].completedAt;}).length,due:due().length},wordStats());}
  return Object.freeze({KEY:KEY,load:load,current:current,visit:visit,position:position,contentDone:contentDone,retry:retry,lesson:lesson,recordAnswer:recordAnswer,stats:stats,complete:complete,due:due,reviewWord:reviewWord,recordWord:recordWord,wordStats:wordStats,weakWords:weakWords,levelCount:levelCount,summary:summary});
});
