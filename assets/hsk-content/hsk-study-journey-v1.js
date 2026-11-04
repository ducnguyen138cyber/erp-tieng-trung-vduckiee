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
  function recordWordAttempt(level,lessonId,word,correct){
    level=Number(level);lessonId=safe(lessonId);word=object(word);
    var hanzi=safe(word.hanzi);
    if(level<1||level>4||!lessonId||!hanzi||typeof correct!=="boolean")return false;
    var data=load(),key=reviewKey(level,hanzi),previous=object(data.reviews[key]);
    var entry=Object.assign({level:level,lessonId:lessonId,hanzi:hanzi,pinyin:safe(word.pinyin),
      meaningVi:safe(word.meaningVi),stage:0,attempts:0,mistakes:0,streak:0,weak:false},previous);
    entry.attempts=(Number(entry.attempts)||0)+1;
    if(!correct){entry.mistakes=(Number(entry.mistakes)||0)+1;entry.streak=0;entry.weak=true;entry.stage=0;entry.nextAt=now();}
    else {
      entry.streak=(Number(entry.streak)||0)+1;
      if(entry.weak&&entry.streak<2)entry.nextAt=now()+5*60000;
      else {entry.weak=false;entry.stage=Math.min(INTERVALS.length-1,(Number(entry.stage)||0)+1);entry.nextAt=now()+INTERVALS[entry.stage]*DAY;}
    }
    entry.lastAt=now();
    data.reviews[key]=entry;
    return emit(data);
  }
  function weakWords(level){
    var reviews=load().reviews;
    return Object.keys(reviews).map(function(key){return reviews[key];}).filter(function(item){
      return item&&item.weak===true&&(!level||Number(item.level)===Number(level));
    }).sort(function(a,b){return Number(b.mistakes||0)-Number(a.mistakes||0)||Number(a.nextAt||0)-Number(b.nextAt||0);});
  }
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
    item.attempts=(Number(item.attempts)||0)+1;
    if(known){
      item.streak=(Number(item.streak)||0)+1;
      if(item.weak&&item.streak<2)item.nextAt=now()+5*60000;
      else {item.weak=false;item.stage=Math.min(INTERVALS.length-1,(Number(item.stage)||0)+1);
        item.nextAt=now()+INTERVALS[item.stage]*DAY;}
    }else{
      item.mistakes=(Number(item.mistakes)||0)+1;
      item.streak=0;item.weak=true;item.stage=0;item.nextAt=now()+5*60000;
    }
    item.lastAt=now();
    return emit(data);
  }
  function levelCount(level){
    var lessons=load().lessons;
    return Object.keys(lessons).filter(function(id){return Number(lessons[id]&&lessons[id].level)===Number(level)&&!!lessons[id].completedAt;}).length;
  }
  function summary(){
    var data=load(),entries=Object.keys(data.lessons).map(function(id){return data.lessons[id];});
    var answers=[];entries.forEach(function(item){Object.keys(object(item.answers)).forEach(function(id){
      var answer=item.answers[id];if(answer&&typeof answer.correct==="boolean")answers.push(answer.correct);
    });});
    var reviews=Object.keys(data.reviews).map(function(key){return data.reviews[key];});
    var correct=answers.filter(Boolean).length;
    return {current:copy(data.current),totalCompleted:entries.filter(function(x){return !!x.completedAt;}).length,
      due:due().length,weak:reviews.filter(function(x){return x&&x.weak===true;}).length,
      reviewedWords:reviews.length,knownWords:reviews.filter(function(x){return x&&!x.weak&&Number(x.stage||0)>=2;}).length,
      gradedAnswers:answers.length,correctAnswers:correct,
      accuracy:answers.length?Math.round(100*correct/answers.length):null};
  }
  return Object.freeze({KEY:KEY,load:load,current:current,visit:visit,lesson:lesson,recordAnswer:recordAnswer,
    recordWordAttempt:recordWordAttempt,weakWords:weakWords,stats:stats,complete:complete,due:due,
    reviewWord:reviewWord,levelCount:levelCount,summary:summary});
});
