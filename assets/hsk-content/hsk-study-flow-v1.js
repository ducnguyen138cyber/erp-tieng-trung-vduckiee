/* Additive HSK learner flow. The canonical HSK curriculum itself stays read-only. */
(function(root){
  "use strict";
  if(!root||!root.document||root.VDuckieHskStudyFlow)return;
  var doc=root.document, journal=root.VDuckieHskStudyJourney, current=null, reviewOpen=false, reviewKey="", bound=false;
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function q(sel){return doc.querySelector(sel);}
  function wordsFromLesson(info){
    var list=[],seen={},runtime=root.VDuckieHskProfessionalRuntime;
    (info.lesson.sections||[]).forEach(function(section){
      if(section.type!=="vocabulary")return;
      ((section.content&&section.content.focusWords)||[]).forEach(function(focus){
        var item=runtime&&runtime.resolveFocusWord?runtime.resolveFocusWord(info.data,focus):null;
        if(!item||!item.simplified||seen[item.simplified])return;
        seen[item.simplified]=true;
        list.push({hanzi:item.simplified,pinyin:item.pinyin||"",meaningVi:item.meaningVi||""});
      });
    });
    return list;
  }
  function eligibleExercise(exercise,level){
    var statuses=['verified','linguistic-reviewed'];if(level===2||level===3)statuses.push('approved');
    var runtime=root.VDuckieHskProfessionalRuntime;
    return (level>=1&&level<=3?(runtime&&runtime.independentReview&&runtime.independentReview(exercise)):statuses.indexOf(exercise.reviewStatus)>=0)&&(runtime&&runtime.canGradeExercise?runtime.canGradeExercise(exercise):typeof exercise.answer==='string');
  }
  function insufficient(info){return (info.level>=1&&info.level<=3)&&!info.verifiedIds.length;}
  function lessonStats(info){return journal.stats(info.lesson.id,info.exercises,info.verifiedIds);}
  function missingContent(info){var content=journal.lesson(info.lesson.id).content||{};return info.content.filter(function(stage){return !content[stage];});}
  function progressHtml(info){
    var stats=lessonStats(info);
    var status=insufficient(info)?(stats.completed?'✓ Đã học · ':'')+'Chưa đủ dữ liệu đánh giá':stats.mastered?'✓ Đã nắm vững':stats.completed?'✓ Đã học · Chưa nắm vững':stats.checked+'/'+stats.total+' câu đã kiểm tra';
    return '<div class="hsk-study-progress" role="status" aria-live="polite"><div><strong>Tiến độ bài học</strong><small>Học từng phần, rồi làm bài tập để xem mức độ ghi nhớ.</small></div><span class="hsk-study-chip'+(stats.mastered?' hsk-study-complete':'')+'">'+status+'</span></div>';
  }
  function finishHtml(info){
    var stats=lessonStats(info),missing=missingContent(info),remaining=Math.max(0,stats.total-stats.checked);
    var entry=journal.lesson(info.lesson.id),evidence=entry.masteryAnswers||{},answers=entry.answers||{};
    var weak=info.exercises.filter(function(id){return (evidence[id]&&evidence[id].correct===false)||(answers[id]&&answers[id].correct===false);});
    var weakWords=journal.weakWords(info.level);
    var words=wordsFromLesson(info).filter(function(word){return weakWords.some(function(item){return item.hanzi===word.hanzi;});});
    var result=stats.verifiedTotal?stats.verifiedCorrect+'/'+stats.verifiedTotal+' câu xác thực đúng ('+stats.verifiedChecked+' câu đã làm; '+Math.round(stats.verifiedCorrect*100/stats.verifiedTotal)+'%)':'Chưa có câu đủ điều kiện đánh giá nắm vững';
    var needs=weak.length?'<p>Kiến thức cần ôn (câu đã trả lời sai):</p><ul>'+weak.map(function(id){var e=info.data.exerciseById[id];return '<li>'+esc(e.skill)+': '+esc(e.prompt)+'</li>';}).join('')+'</ul>':'';
    var weakText=words.length?'<p>Từ cần ôn: '+words.map(function(w){return esc(w.hanzi)+' ('+esc(w.meaningVi)+')';}).join(', ')+'.</p>':'';
    var heading=insufficient(info)?(stats.completed?'✓ Đã học · ':'')+'Chưa đủ dữ liệu đánh giá':stats.mastered?'✓ Đã nắm vững bài học':stats.completed?'✓ Đã học · Chưa nắm vững':'Kết thúc bài học';
    var next=insufficient(info)?'Bài đang chờ kiểm duyệt đáp án. Bạn có thể ôn từ yếu hoặc học bài tiếp; làm lại không thể thay thế việc kiểm duyệt.':stats.mastered?'Bạn có thể học bài tiếp hoặc ôn từ đến hạn.':'Ôn lại kiến thức dưới đây, sau đó làm một lượt kiểm tra mới. Xem đáp án không tính là nắm vững.';
    return '<div class="hsk-study-finish'+(stats.completed?' is-done':'')+'" data-hsk-finish-panel><h4>'+heading+'</h4><p>'+result+'.</p>'+needs+weakText+'<p>'+(stats.completed?next:missing.length?'Cần xác nhận đã học: '+missing.map(function(x){return {words:'Từ mới',examples:'Nghe & đọc',extra:'Kiến thức thêm'}[x];}).join(', ')+'.':remaining?'Còn '+remaining+' câu chưa kiểm tra.':'Đủ điều kiện lưu hoàn thành nội dung và bài tập.')+'</p><div class="hsk-study-actions">'+
      (!stats.completed?'<button type="button" data-hsk-finish'+(remaining||missing.length?' disabled':'')+'>✓ Hoàn thành & lưu tiến độ</button>':'')+
      '<button type="button" data-hsk-review-open>Ôn từ đến hạn</button><button type="button" data-hsk-retry>Làm lại lượt kiểm tra</button>'+
      (stats.completed?'<button type="button" data-hsk-next-lesson'+(info.data.lessons[info.data.lessons.length-1].id===info.lesson.id?' disabled':'')+'>Học bài tiếp →</button>':'')+'</div></div>';
  }
  function railProgress(info){
    var rail=q("#hskProgress");if(!rail)return;
    var done=journal.levelCount(info.level),total=info.data.lessons.length;
    rail.innerHTML='<div class="hsk-study-rail-progress"><strong>HSK '+info.level+' · '+done+'/'+total+' bài</strong><span>Tiến độ tự học đã lưu</span><div class="hsk-study-track"><i style="width:'+Math.min(100,Math.round(done*100/Math.max(1,total)))+'%"></i></div></div>';
    var buttons=doc.querySelectorAll("#hskLessonList [data-pro-lesson]");
    buttons.forEach(function(button){
      if(button.getAttribute("data-pro-lesson")!==info.lesson.id)return;
      var finished=lessonStats(info).completed;
      button.classList.toggle("done",finished);
      if(finished&&!button.querySelector(".hsk-study-done-icon")){
        var icon=doc.createElement("i");
        icon.className="hsk-study-done-icon";icon.textContent="✓";icon.setAttribute("aria-label","Đã hoàn thành");button.appendChild(icon);
      }
    });
  }
  function dueHtml(){
    var due=journal.due();return '<button type="button" class="hsk-study-review-open" data-hsk-review-open>↻ Ôn từ HSK'+(due.length?' · '+due.length+' từ đến hạn':'')+'</button>';
  }
  function update(){
    if(!current)return;
    var host=q("#hskLesson");if(!host||!host.contains(q('[data-hsk-progress-host]')))return;
    var intro=q("[data-hsk-progress-host]");if(intro)intro.innerHTML=progressHtml(current);
    var finish=q("[data-hsk-finish-panel]");if(finish){var wrapper=doc.createElement("div");wrapper.innerHTML=finishHtml(current);finish.replaceWith(wrapper.firstChild);}
    railProgress(current);
    var reviewButton=q("#hskJourney [data-hsk-review-open]");if(reviewButton){reviewButton.textContent="↻ Ôn HSK"+(journal.due().length?" · "+journal.due().length:"");}
  }
  function reviewDrawer(){
    var rootPanel=q("#hskLesson"),existing=q("[data-hsk-review-drawer]");
    if(!rootPanel)return;
    if(!existing){
      existing=doc.createElement("section");existing.className="hsk-study-review-drawer";existing.setAttribute("data-hsk-review-drawer","");
      rootPanel.insertBefore(existing,rootPanel.firstChild);
    }
    if(!reviewOpen){existing.hidden=true;return;}
    existing.hidden=false;
    var pending=journal.due();
    if(!pending.length){
      existing.innerHTML='<div class="hsk-study-review-head"><h4>Ôn từ đến hạn</h4><button type="button" data-hsk-review-close aria-label="Đóng">×</button></div><p>Hôm nay không còn từ HSK đến hạn. Tiếp tục học một bài để tạo lịch ôn mới.</p>';
      return;
    }
    var word=pending[0];reviewKey=word.level+":"+word.hanzi;
    existing.innerHTML='<div class="hsk-study-review-head"><div><span>ÔN TẬP CÁCH QUÃNG</span><h4>Còn '+pending.length+' từ cần ôn</h4></div><button type="button" data-hsk-review-close aria-label="Đóng">×</button></div>'+
      '<p>Ưu tiên từ hay quên. Hãy tự nhớ trước khi xem nghĩa; đây là tự đánh giá ôn tập.</p><div class="hsk-study-review-word"><strong lang="zh-CN">'+esc(word.hanzi)+'</strong><span>'+esc(word.pinyin)+'</span><p data-hsk-review-meaning hidden>'+esc(word.meaningVi)+'</p></div>'+
      '<div class="hsk-study-actions"><button type="button" data-hsk-review-reveal>Xem nghĩa</button>'+
      '<button type="button" data-hsk-review-grade="0" hidden>Chưa nhớ</button><button type="button" data-hsk-review-grade="1" hidden>Đã nhớ</button></div>';
  }
  function decorate(info){
    if(!journal||!info||!info.lesson||!info.data)return;
    var host=q("#hskLesson");if(!host)return;
    current={level:Number(info.level),lesson:info.lesson,data:info.data,
      exercises:(info.lesson.practiceRefs||[]).filter(function(id){return !!info.data.exerciseById[id];})};
    current.verifiedIds=current.exercises.filter(function(id){return eligibleExercise(current.data.exerciseById[id],current.level);});
    current.content=['words','examples','extra'].filter(function(stage){var panel=host.querySelector('[data-focus-panel="'+stage+'"]');return panel&&!!panel.querySelector('.hsk-pro-section');});
    var saved=journal.lesson(current.lesson.id),position=saved.position||{};
    journal.visit(current.level,current.lesson.id);
    current.content.forEach(function(stage){
      var panel=host.querySelector('[data-focus-panel="'+stage+'"]');
      panel.insertAdjacentHTML('beforeend','<button type="button" class="hsk-study-content-done" data-hsk-content-done="'+stage+'">'+(saved.content&&saved.content[stage]?'✓ Đã học phần này':'Đánh dấu đã học phần này')+'</button>');
    });
    Object.keys(saved.answers||{}).forEach(function(id){
      var article=Array.prototype.find.call(host.querySelectorAll('[data-pro-exercise]'),function(el){return el.getAttribute('data-pro-exercise')===id;});
      if(article)article.insertAdjacentHTML('afterbegin','<p class="hsk-study-answer-status">Đã kiểm tra: '+(saved.answers[id].correct===true?'đúng':saved.answers[id].correct===false?'cần ôn lại':'đã tự đối chiếu rubric')+'.</p>');
    });
    restorePosition(host,position);
    var intro=doc.createElement("div");intro.setAttribute("data-hsk-progress-host","");
    intro.innerHTML=progressHtml(current);host.insertBefore(intro,host.firstChild);
    var practice=host.querySelector('[data-focus-panel="practice"]');
    if(practice)practice.insertAdjacentHTML("beforeend",finishHtml(current));
    railProgress(current);
    var rail=q("#hskProgress");if(rail){
      var n=q("#hskJourney [data-hsk-review-open]");
      if(!n){rail.insertAdjacentHTML("afterend",dueHtml());}
      else n.textContent="↻ Ôn HSK"+(journal.due().length?" · "+journal.due().length:"");
    }
    reviewDrawer();bind();
  }
  function restorePosition(host,position){
    var stage=['words','examples','practice','extra'].indexOf(position.stage)>=0?position.stage:'words';
    host.querySelectorAll('[data-focus-panel]').forEach(function(panel){panel.classList.toggle('hidden',panel.getAttribute('data-focus-panel')!==stage);});
    host.querySelectorAll('[data-focus-stage]').forEach(function(button){var active=button.getAttribute('data-focus-stage')===stage;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    host.querySelectorAll('.hsk-focus-vocabulary').forEach(function(group,index){
      var cards=group.querySelectorAll('[data-focus-word]'),cursor=Math.max(0,Math.min(cards.length-1,Number((position.cards||{})[index])||0));
      cards.forEach(function(card,i){card.classList.toggle('hidden',i!==cursor);});
      var prev=group.querySelector('[data-focus-prev]'),next=group.querySelector('[data-focus-next]');
      if(prev)prev.disabled=cursor===0;if(next)next.disabled=cursor===cards.length-1;
    });
    if(stage==='practice'&&position.exerciseId){
      var article=Array.prototype.find.call(host.querySelectorAll('[data-pro-exercise]'),function(el){return el.getAttribute('data-pro-exercise')===position.exerciseId;});
      if(article)root.requestAnimationFrame(function(){if(host.contains(article))article.scrollIntoView({block:'center'});});
    }
  }
  function savePosition(button){
    if(!current)return;
    var host=q('#hskLesson');if(!host||!host.contains(button))return;
    // Read after all document click handlers: microtasks can run between listeners.
    var info=current;
    root.setTimeout(function(){
      if(current!==info||!host.contains(button))return;
      var active=host.querySelector('[data-focus-stage][aria-pressed="true"]'),cards={};
      host.querySelectorAll('.hsk-focus-vocabulary').forEach(function(group,index){cards[index]=Array.prototype.findIndex.call(group.querySelectorAll('[data-focus-word]'),function(card){return !card.classList.contains('hidden');});});
      var article=button.closest('[data-pro-exercise]'),value={stage:active?active.getAttribute('data-focus-stage'):'words',cards:cards};
      if(article)value.exerciseId=article.getAttribute('data-pro-exercise');
      var previous=journal.lesson(current.lesson.id).position||{};
      if(JSON.stringify(Object.assign({},previous,value))!==JSON.stringify(previous))journal.position(current.level,current.lesson.id,value);
    },0);
  }
  function onChecked(exerciseId,correct,details){
    if(!current||current.exercises.indexOf(exerciseId)<0)return false;
    var entry=journal.lesson(current.lesson.id),previous=(entry.answers||{})[exerciseId];
    var fresh=!previous||(entry.attemptAt&&Number(previous.at)<Number(entry.attemptAt));
    if(!journal.recordAnswer(current.level,current.lesson.id,exerciseId,correct,current.verifiedIds.indexOf(exerciseId)>=0,current.verifiedIds))return false;
    var savedStatus=q('[data-pro-exercise="'+exerciseId+'"] .hsk-study-answer-status');
    if(savedStatus)savedStatus.textContent='Đã kiểm tra: '+(correct===true?'đúng':correct===false?'cần ôn lại':'đã tự đối chiếu rubric')+'.';
    if(fresh&&details&&Array.isArray(details.words)){
      var words=wordsFromLesson(current),seen={};
      details.words.forEach(function(result){
        var word=words.find(function(item){return item.hanzi===result.hanzi;});
        if(!word||seen[word.hanzi])return;seen[word.hanzi]=true;
        journal.recordWord(current.level,current.lesson.id,word.hanzi,result.correct,word.pinyin,word.meaningVi);
      });
    }
    update();return true;
  }
  function moveLesson(next){
    var runtime=root.VDuckieHskProfessionalRuntime;
    if(!runtime||!current)return;
    var ids=current.data.lessons.map(function(l){return l.id;}),i=ids.indexOf(current.lesson.id);
    if(i<0||i+next<0||i+next>=ids.length)return;
    runtime.selectLesson(ids[i+next],false);
    var start=q("#hskLesson");
    if(start&&start.scrollIntoView)start.scrollIntoView({behavior:"smooth",block:"start"});
  }
  function handle(event){
    var button=event.target&&event.target.closest?event.target.closest("button"):null;
    if(!button)return;
    savePosition(button);
    if(button.hasAttribute('data-hsk-content-done')&&current){
      if(journal.contentDone(current.level,current.lesson.id,button.getAttribute('data-hsk-content-done')))button.textContent='✓ Đã học phần này';update();return;
    }
    if(button.hasAttribute('data-hsk-retry')&&current){
      if(!journal.retry(current.lesson.id))return;
      journal.position(current.level,current.lesson.id,{stage:'practice',exerciseId:current.exercises[0]||''});
      root.VDuckieHskProfessionalRuntime.selectLesson(current.lesson.id,false);
      var practice=q('[data-focus-stage="practice"]');if(practice)practice.click();
      update();return;
    }
    if(button.hasAttribute("data-focus-choice")&&current){
      var quiz=button.closest("[data-focus-quiz]");
      if(quiz&&quiz.contains(button)){
        var expected=quiz.querySelector("[data-focus-quiz-word]");
        var hanzi=quiz.dataset.correctHanzi||expected&&expected.textContent;
        var cards=button.closest(".hsk-focus-vocabulary");
        var focusCard=cards&&Array.prototype.find.call(cards.querySelectorAll("[data-focus-word]"),function(card){
          var title=card.querySelector(".hsk-focus-word-title strong");
          return title&&title.textContent===hanzi;
        });
        if(focusCard&&hanzi){
          var word=wordsFromLesson(current).find(function(w){return w.hanzi===hanzi;});
          var correct=button.getAttribute("data-focus-choice")===hanzi;
          var old=journal.load().reviews[current.level+":"+hanzi];
          var firstCorrect=correct&&(!old||!Number(old.correct));
          var saved=journal.recordWord(current.level,current.lesson.id,hanzi,correct,
            word&&word.pinyin||"",word&&word.meaningVi||"");
          if(firstCorrect&&saved)doc.dispatchEvent(new root.CustomEvent("vduckie:hsk-word-mastered",{detail:{
            level:current.level,hanzi:hanzi,lessonId:current.lesson.id,origin:button
          }}));
          update();
        }
      }
    }
    if(button.hasAttribute("data-hsk-finish")){
      event.preventDefault();
      if(!current)return;
      var alreadyCompleted=lessonStats(current).completed;
      var result=journal.complete(current.level,current.lesson.id,current.exercises,wordsFromLesson(current),{content:current.content,verifiedIds:current.verifiedIds});
      update();
      if(result.ok&&!alreadyCompleted){
        var answers=journal.lesson(current.lesson.id).masteryAnswers||{};
        var verified=current.exercises.map(function(id){return current.data.exerciseById[id];}).filter(function(exercise){
          return exercise&&eligibleExercise(exercise,current.level)&&
            answers[exercise.id]&&typeof answers[exercise.id].correct==="boolean";
        });
        doc.dispatchEvent(new root.CustomEvent("vduckie:hsk-learner-completed",{detail:{
          level:current.level,lessonId:current.lesson.id,checked:result.checked,
          graded:verified.length,correct:verified.filter(function(exercise){return answers[exercise.id].correct;}).length
        }}));
      }
      if(result.ok){
        var stage=q('[data-focus-stage="practice"]');if(stage){stage.click();}
        var finish=q("[data-hsk-finish-panel]");if(finish&&finish.scrollIntoView)finish.scrollIntoView({behavior:"smooth",block:"nearest"});
      }
      return;
    }
    if(button.hasAttribute("data-hsk-review-open")){
      event.preventDefault();
      if(!current){
        var router=root.VDuckieScreenRouter;
        if(router)router.navigate("hsk-study");
        var saved=journal.current(),runtime=root.VDuckieHskProfessionalRuntime;
        if(runtime&&runtime.selectLevel)runtime.selectLevel(saved.level,false).then(function(){
          if(saved.lessonId)runtime.selectLesson(saved.lessonId,false);
          reviewOpen=true;reviewDrawer();
        });
        return;
      }
      reviewOpen=true;reviewDrawer();
      var drawer=q("[data-hsk-review-drawer]");if(drawer&&drawer.scrollIntoView)drawer.scrollIntoView({behavior:"smooth",block:"nearest"});
      return;
    }
    if(button.hasAttribute("data-hsk-review-close")){reviewOpen=false;reviewDrawer();return;}
    if(button.hasAttribute("data-hsk-review-reveal")){
      var meaning=q("[data-hsk-review-meaning]");if(meaning)meaning.hidden=false;
      q("[data-hsk-review-reveal]").hidden=true;
      doc.querySelectorAll("[data-hsk-review-grade]").forEach(function(b){b.hidden=false;});return;
    }
    if(button.hasAttribute("data-hsk-review-grade")){
      var first=journal.due().find(function(word){return word.level+":"+word.hanzi===reviewKey;});if(!first)return;
      var remembered=button.getAttribute("data-hsk-review-grade")==="1";
      var freshRecall=remembered&&!Number(first.correct);
      var savedReview=journal.reviewWord(first.level,first.hanzi,remembered);
      if(savedReview&&freshRecall)doc.dispatchEvent(new root.CustomEvent("vduckie:hsk-word-mastered",{detail:{
        level:first.level,hanzi:first.hanzi,lessonId:first.lessonId,origin:button
      }}));
      update();reviewDrawer();return;
    }
    if(button.hasAttribute("data-hsk-next-lesson"))moveLesson(1);
  }
  function bind(){
    if(bound)return;bound=true;
    doc.addEventListener("click",handle);
    doc.addEventListener("vduckie:account-learning-synced",function(){update();reviewDrawer();});
    doc.addEventListener('focusin',function(event){var article=event.target.closest&&event.target.closest('[data-pro-exercise]');if(article)savePosition(event.target);});
  }
  bind();
  root.VDuckieHskStudyFlow=Object.freeze({decorate:decorate,onChecked:onChecked,openReview:function(){reviewOpen=true;reviewDrawer();var drawer=q('[data-hsk-review-drawer]');if(drawer)drawer.scrollIntoView({block:'nearest'});},getCurrent:function(){return current?{level:current.level,lessonId:current.lesson.id}:null;}});
})(typeof window!=="undefined"?window:globalThis);
