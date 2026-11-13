/* Merge the existing learning stores; no new account/database or mastery certificate. */
(function(root,factory){var api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VDuckieLearningProgressMerge=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 var DAY=86400000,INTERVALS=[1,3,7,14,30];
 function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}
 function copy(v){return JSON.parse(JSON.stringify(v==null?{}:v));}
 function keys(v){return Object.keys(obj(v)).filter(function(k){return !['__proto__','constructor','prototype'].includes(k);});}
 function stable(v){return Array.isArray(v)?'['+v.map(stable).join(',')+']':v&&typeof v==='object'?'{'+keys(v).sort().map(function(k){return JSON.stringify(k)+':'+stable(v[k]);}).join(',')+'}':JSON.stringify(v);}
 function stamp(v,fallback){v=obj(v);return Number(v.updatedAt||v.at||v.lastAt||v.lastReviewed)||Date.parse(v.date||v.submittedAt||'')||Number(fallback)||0;}
 function newer(a,b,ta,tb){a=obj(a);b=obj(b);if(!keys(a).length)return copy(b);if(!keys(b).length)return copy(a);var x=stamp(a,ta),y=stamp(b,tb);return copy(x>y?a:y>x?b:stable(a)>stable(b)?a:b);}
 function union(a,b){var out=Object.create(null);keys(a).concat(keys(b)).forEach(function(k){if(a&&a[k]!==undefined&&b&&b[k]!==undefined)out[k]=newer(a[k],b[k]);else out[k]=copy((a&&a[k])||(b&&b[k]));});return out;}
 function numericMap(a,b){var out={};keys(a).concat(keys(b)).forEach(function(k){out[k]=Math.max(Number(a&&a[k])||0,Number(b&&b[k])||0);});return out;}
 function latestMap(a,b,ta,tb){var out={};keys(a).concat(keys(b)).forEach(function(k){if(a&&a[k]!==undefined&&b&&b[k]!==undefined)out[k]=newer(a[k],b[k],ta,tb);else out[k]=copy((a&&a[k])||(b&&b[k]));});return out;}
 function wordState(item){
  item=copy(item);var events=obj(item.recallEvents);if(!keys(events).length)return item;
  var base=obj(item.recallBase),out=Object.assign({},item,copy(base));out.recallBase=copy(base);out.recallEvents=events;
  ['attempts','correct','mistakes','stage','lastAt','nextAt'].forEach(function(k){out[k]=Number(base[k])||0;});out.weak=!!base.weak;
  out.spacedRecalls=0;out.memoryStage=0;out.exposures=0;var anchor=Number(base.lastAt)||0;
  keys(events).map(function(id){return Object.assign({id:id},events[id]);}).sort(function(a,b){return a.at-b.at||(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id);}).forEach(function(e){
   var at=Number(e.at)||0;
   if(e.kind==='reveal'){
    out.exposures++;out.seenAt=Math.max(Number(out.seenAt)||0,at);out.nextAt=Math.max(Number(out.nextAt)||0,at+DAY);return;
   }
   out.attempts=(Number(out.attempts)||0)+1;out.correct=(Number(out.correct)||0)+(e.correct===true?1:0);
   if(e.correct!==true){out.mistakes=(Number(out.mistakes)||0)+1;out.weak=true;out.memoryStage=0;out.spacedRecalls=0;anchor=at;out.nextAt=e.kind==='study'?at:at+300000;}
   else if(e.kind==='review'&&e.retrieval===true&&at>=Number(out.nextAt||0)&&at-anchor>=DAY){
    out.spacedRecalls++;out.memoryStage=Math.min(4,out.spacedRecalls);out.stage=out.memoryStage;anchor=at;
    out.nextAt=at+INTERVALS[out.memoryStage]*DAY;if(out.spacedRecalls>=3)out.weak=false;
   }else out.nextAt=Math.max(Number(out.nextAt)||0,at+DAY);
   out.lastAt=Math.max(Number(out.lastAt)||0,at);out.updatedAt=Math.max(Number(out.updatedAt)||0,at);
  });
  return out;
 }
 function wordEvent(item,event){item=copy(item);if(!item.recallBase){item.recallBase={};['attempts','correct','mistakes','weak','stage','lastAt','nextAt'].forEach(function(k){if(item[k]!==undefined)item.recallBase[k]=item[k];});}item.recallEvents=obj(item.recallEvents);event=copy(event);event.order=Math.max(0,...keys(item.recallEvents).map(function(id){return Number(item.recallEvents[id].order)||0;}))+1;item.recallEvents[event.id]=event;return wordState(item);}
 function mergeWord(a,b,ta,tb){
  a=obj(a);b=obj(b);var out=newer(a,b,ta,tb);if(!keys(a).length)return copy(b);if(!keys(b).length)return copy(a);
  var events=union(a.recallEvents,b.recallEvents);
  if(keys(events).length){
   var bases=[a,b].filter(function(x){return x.recallBase;}).map(function(x){return x.recallBase;});
   out.recallBase=copy(bases.sort(function(x,y){return stamp(x)-stamp(y)||stable(x).localeCompare(stable(y));})[0]||{});out.recallEvents=events;out=wordState(out);
  }
  ['attempts','correct','mistakes'].forEach(function(k){out[k]=Math.max(Number(out[k])||0,Number(a[k])||0,Number(b[k])||0);});
  return out;
 }
 function mergeLesson(a,b,ta,tb){
  a=obj(a);b=obj(b);var out=newer(a,b,ta,tb);out.position=newer(a.position,b.position,stamp(a,ta),stamp(b,tb));out.content=numericMap(a.content,b.content);out.answers=latestMap(a.answers,b.answers);
  out.answerHistory=union(a.answerHistory,b.answerHistory);var completed=[a.completedAt,b.completedAt].map(Number).filter(function(x){return x>0;});if(completed.length)out.completedAt=Math.min.apply(Math,completed);
  var aa=Number(a.attemptAt)||0,bb=Number(b.attemptAt)||0;out.attemptAt=Math.max(aa,bb);
  if(aa!==bb)out.masteryAnswers=copy(aa>bb?obj(a.masteryAnswers):obj(b.masteryAnswers));
  else{out.masteryAnswers={};keys(a.masteryAnswers).concat(keys(b.masteryAnswers)).forEach(function(k){var x=obj(a.masteryAnswers)[k],y=obj(b.masteryAnswers)[k];out.masteryAnswers[k]=copy(!x?y:!y?x:Number(x.at)<Number(y.at)?x:Number(y.at)<Number(x.at)?y:x.correct===false?x:y);});}
  return out;
 }
 function journal(a,b,ta,tb){a=obj(a);b=obj(b);var out=newer(a,b,ta,tb);out.version=1;out.current=newer(a.current,b.current,a.updatedAt||ta,b.updatedAt||tb);out.lessons={};out.reviews={};
  keys(a.lessons).concat(keys(b.lessons)).forEach(function(k){out.lessons[k]=mergeLesson(obj(a.lessons)[k],obj(b.lessons)[k],a.updatedAt||ta,b.updatedAt||tb);});
  keys(a.reviews).concat(keys(b.reviews)).forEach(function(k){out.reviews[k]=mergeWord(obj(a.reviews)[k],obj(b.reviews)[k],a.updatedAt||ta,b.updatedAt||tb);});out.updatedAt=Math.max(stamp(a,ta),stamp(b,tb));return out;}
 function shadow(a,b,ta,tb){a=obj(a);b=obj(b);var out=newer(a,b,ta,tb);keys(a).concat(keys(b)).filter(function(k){return /^[123]$/.test(k);}).forEach(function(k){var x=obj(a[k]),y=obj(b[k]),entry=newer(x,y,ta,tb);entry.flagChanges={};['starred','weak'].forEach(function(kind){
   var flags=Object.assign({},obj(x[kind]),obj(y[kind])),changes=latestMap(obj(x.flagChanges)[kind],obj(y.flagChanges)[kind]);
   keys(changes).forEach(function(id){flags[id]=!!changes[id].value;});entry[kind]=flags;entry.flagChanges[kind]=changes;
  });out[k]=entry;});return out;}
 function practice(a,b,ta,tb){a=obj(a);b=obj(b);var out={};keys(a).concat(keys(b)).forEach(function(k){var x=obj(a[k]),y=obj(b[k]),entry=newer(x,y,ta,tb);entry.best=Math.max(Number(x.best)||0,Number(y.best)||0);entry.attemptHistory=union(x.attemptHistory,y.attemptHistory);entry.legacyAttempts=Math.max(Number(x.legacyAttempts)||(!x.attemptHistory?Number(x.attempts)||0:0),Number(y.legacyAttempts)||(!y.attemptHistory?Number(y.attempts)||0:0));entry.attempts=Math.max(Number(x.attempts)||0,Number(y.attempts)||0,entry.legacyAttempts+keys(entry.attemptHistory).length);if(x.draft||y.draft)entry.draft=newer(x.draft,y.draft);else delete entry.draft;
  if(x.draft&&y.draft&&x.draft.sessionId===y.draft.sessionId){entry.draft.answers=latestMap(x.draft.answers,y.draft.answers);entry.draft.deadline=Math.min(Number(x.draft.deadline)||Infinity,Number(y.draft.deadline)||Infinity);}
  if(entry.draft&&entry.attemptHistory[entry.draft.sessionId])delete entry.draft;
  out[k]=entry;});return out;}
 function dailyWordState(item){
  item=copy(item);var events=obj(item.attemptEvents);if(!keys(events).length)return item;
  var base=obj(item.attemptBase),out=Object.assign({},item,copy(base));out.attemptBase=copy(base);out.attemptEvents=events;
  out.correct=Number(base.correct)||0;out.wrong=Number(base.wrong)||0;out.stage=Number(base.stage)||0;out.skills=copy(obj(base.skills));
  keys(events).map(function(id){return Object.assign({id:id},events[id]);}).sort(function(a,b){return a.at-b.at||(Number(a.order)||0)-(Number(b.order)||0)||a.id.localeCompare(b.id);}).forEach(function(e){
   var skill=out.skills[e.skill]||(out.skills[e.skill]={correct:0,wrong:0}),at=Number(e.at)||0;
   if(e.correct===true){out.correct++;skill.correct++;if(out.correct>=[0,3,6,9,12][Math.min(4,out.stage+1)])out.stage=Math.min(4,out.stage+1);}
   else{out.wrong++;skill.wrong++;out.stage=Math.max(0,out.stage-1);}
   out.lastReviewed=at;out.nextReview=at+(e.correct===true?[0,1,3,7,21][Math.max(1,out.stage)]*DAY:600000);out.updatedAt=Math.max(Number(out.updatedAt)||0,at);
  });return out;
 }
 function dailyWordEvent(item,event){
  item=copy(item);if(!item.attemptBase){item.attemptBase={};['correct','wrong','skills','stage','lastReviewed','nextReview','updatedAt'].forEach(function(k){if(item[k]!==undefined)item.attemptBase[k]=copy(item[k]);});}
  item.attemptEvents=obj(item.attemptEvents);event=copy(event);event.order=Math.max(0,...keys(item.attemptEvents).map(function(id){return Number(item.attemptEvents[id].order)||0;}))+1;item.attemptEvents[event.id]=event;return dailyWordState(item);
 }
 function mergeDailyWord(a,b,ta,tb){
  a=obj(a);b=obj(b);var out=newer(a,b,ta,tb),events=union(a.attemptEvents,b.attemptEvents);if(!keys(events).length)return out;
  var bases=[a,b].filter(function(x){return x.attemptBase;}).map(function(x){return x.attemptBase;});
  out.attemptBase=copy(bases.sort(function(x,y){return stamp(x)-stamp(y)||stable(x).localeCompare(stable(y));})[0]||{});out.attemptEvents=events;out=dailyWordState(out);
  ['correct','wrong'].forEach(function(k){out[k]=Math.max(Number(out[k])||0,Number(a[k])||0,Number(b[k])||0);});return out;
 }
 function daily(a,b,ta,tb){a=obj(a);b=obj(b);var out=newer(a,b,ta,tb);out.updatedAt=Math.max(stamp(a,ta),stamp(b,tb));out.words={};keys(a.words).concat(keys(b.words)).forEach(function(k){out.words[k]=mergeDailyWord(obj(a.words)[k],obj(b.words)[k],a.updatedAt||ta,b.updatedAt||tb);});out.assignments=Object.assign({},obj(a.assignments),obj(b.assignments));out.msutong=newer(a.msutong,b.msutong,a.updatedAt||ta,b.updatedAt||tb);['lessons','review'].forEach(function(k){out.msutong[k]=latestMap(obj(a.msutong)[k],obj(b.msutong)[k],a.updatedAt||ta,b.updatedAt||tb);});out.msutong.completed=Object.assign({},obj(obj(a.msutong).completed),obj(obj(b.msutong).completed));
  if(root&&root.VDuckieCurriculumProgress)out.msutong=root.VDuckieCurriculumProgress.merge(Object.assign({updatedAt:a.updatedAt},obj(a.msutong)),Object.assign({updatedAt:b.updatedAt},obj(b.msutong)));
  return out;}
 var stores={'vduckie-hsk-study-journey-v1':journal,'vduckie-shadowing-v1':shadow,'vduckie-hsk-practice-exams-v2':practice,'vduckie-daily-learning-v1':daily};
 function merge(key,a,b,ta,tb){return stores[key]?stores[key](a,b,ta,tb):null;}
 async function persistRow(options){
  var value=options.value;
  for(var attempt=0;attempt<4;attempt++){
   if(!options.current())return null;
   var got=await options.client.from('user_words').select('user_id,word_key,note,updated_at').eq('user_id',options.userId).eq('word_key',options.key).maybeSingle();
   if(got.error)throw got.error;var before=got.data;
   if(before&&before.user_id!==options.userId)throw new Error('Learning profile owner mismatch');
   if(!options.current())return null;
   var local=options.getLocal?options.getLocal():value,remote={};try{remote=JSON.parse(before&&before.note||'{}');}catch(error){throw new Error('Remote learning profile is not valid JSON; preserved without overwrite');}
   value=options.merge(local,remote);
   if(before&&stable(value)===stable(remote))return value;
   var payload=options.row(value,options.userId),query;
   if(before){
    if(!before.updated_at)throw new Error('Missing server revision; refusing an unsafe profile overwrite');
    query=options.client.from('user_words').update(payload).eq('user_id',options.userId).eq('word_key',options.key).eq('updated_at',before.updated_at).select('word_key');
   }else query=options.client.from('user_words').insert([payload]).select('word_key');
   var saved=await query;if(!options.current())return null;
   if(saved.error&&saved.error.code!=='23505')throw saved.error;
   if(!saved.error&&saved.data&&saved.data.length)return value;
  }
  var conflict=new Error('Concurrent learning update; retry after reconnect');conflict.code='LEARNING_CONFLICT';throw conflict;
 }
 function eventId(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+(++eventId.sequence);}
 eventId.sequence=0;
 return Object.freeze({merge:merge,journal:journal,shadow:shadow,practice:practice,daily:daily,wordState:wordState,wordEvent:wordEvent,dailyWordEvent:dailyWordEvent,eventId:eventId,stable:stable,persistRow:persistRow});
});
