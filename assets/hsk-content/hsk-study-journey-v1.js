/* VDuckie HSK study journal: learner self-study progress, separate from canonical read-only content and legacy MSUTONG. */
(function(root,factory){
  "use strict";
  var api=factory(root||{});
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.VDuckieHskStudyJourney=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  var KEY="vduckie-hsk-study-journey-v1", DAY=86400000, INTERVALS=[1,3,7,14,30];
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
    data.current={level:level,lessonId:lessonId};return emit(data);
  }
  function lesson(id){return copy(object(load().lessons[safe(id)]));}
  function recordAnswer(level,lessonId,exerciseId,correct){
    level=Number(level);lessonId=safe(lessonId);exerciseId=safe(exerciseId);
    if(level<1||level>4||!lessonId||!exerciseId)return false;
    var data=load(),entry=object(data.lessons[lessonId]);
    entry.level=level;entry.answers=object(entry.answers);
    entry.answers[exerciseId]={correct:correct===true?true:correct===false?false:null,at:now()};
    data.lessons[lessonId]=entry;data.current={level:level,lessonId:lessonId};
    return emit(data);
  }
  function stats(lessonId,total){
    var entry=object(load().lessons[safe(lessonId)]),answers=object(entry.answers);
    var records=Object.keys(answers).map(function(key){return answers[key];});
    var checked=records.length, graded=records.filter(function(x){return x&&typeof x.correct==="boolean";});
    return {total:Math.max(0,Number(total)||0),checked:checked,correct:graded.filter(function(x){return x.correct;}).length,graded:graded.length,completed:!!entry.completedAt,completedAt:Number(entry.completedAt)||0};
  }
  function reviewKey(level,hanzi){return String(level)+":"+safe(hanzi);}
  function complete(level,lessonId,total,words){
    level=Number(level);lessonId=safe(lessonId);total=Math.max(0,Number(total)||0);
    if(level<1||level>4||!lessonId)return {ok:false,reason:"invalid-lesson"};
    var data=load(),entry=object(data.lessons[lessonId]),answers=object(entry.answers),checked=Object.keys(answers).length;
    if(checked<total)return {ok:false,reason:"unfinished-practice",remaining:total-checked,checked:checked,total:total};
    if(!entry.completedAt)entry.completedAt=now();
    entry.level=level;entry.answers=answers;entry.exercises=total;
    data.lessons[lessonId]=entry;data.current={level:level,lessonId:lessonId};
    (Array.isArray(words)?words:[]).forEach(function(word){
      if(!word||!safe(word.hanzi))return;
      var key=reviewKey(level,word.hanzi);
      if(data.reviews[key])return; // finishing the same lesson never resets an established review schedule
      data.reviews[key]={level:level,lessonId:lessonId,hanzi:safe(word.hanzi),pinyin:safe(word.pinyin),meaningVi:safe(word.meaningVi),stage:0,lastAt:now(),nextAt:now()+DAY};
    });
    if(!emit(data))return {ok:false,reason:"storage-unavailable"};
    return Object.assign({ok:true},stats(lessonId,total));
  }
  function due(level,includeFuture){
    var reviews=load().reviews;var items=Object.keys(reviews).map(function(k){return reviews[k];}).filter(function(item){
      return item&&safe(item.hanzi)&&(!level||Number(item.level)===Number(level))&&
        (includeFuture||Number(item.nextAt||0)<=now());
    });
    return items.sort(function(a,b){return Number(a.nextAt)-Number(b.nextAt)||safe(a.hanzi).localeCompare(safe(b.hanzi));});
  }
  function reviewWord(level,hanzi,known){
    var data=load(),key=reviewKey(level,hanzi),item=data.reviews[key];
    if(!item)return false;
    item.stage=known?Math.min(INTERVALS.length-1,(Number(item.stage)||0)+1):0;
    item.lastAt=now();item.nextAt=now()+(known?INTERVALS[item.stage]*DAY:5*60000);
    return emit(data);
  }
  function levelCount(level){
    var lessons=load().lessons;
    return Object.keys(lessons).filter(function(id){return Number(lessons[id]&&lessons[id].level)===Number(level)&&!!lessons[id].completedAt;}).length;
  }
  function summary(){var data=load();return {current:copy(data.current),totalCompleted:Object.keys(data.lessons).filter(function(id){return !!data.lessons[id].completedAt;}).length,due:due().length};}
  return Object.freeze({KEY:KEY,load:load,current:current,visit:visit,lesson:lesson,recordAnswer:recordAnswer,stats:stats,complete:complete,due:due,reviewWord:reviewWord,levelCount:levelCount,summary:summary});
});
