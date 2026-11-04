/* Additive HSK learner flow. The canonical HSK curriculum itself stays read-only. */
(function(root){
  "use strict";
  if(!root||!root.document||root.VDuckieHskStudyFlow)return;
  var doc=root.document, journal=root.VDuckieHskStudyJourney, current=null, reviewOpen=false, bound=false;
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
  function progressHtml(info){
    var stats=journal.stats(info.lesson.id,info.exercises.length),done=stats.completed;
    var summary=done?'<span class="hsk-study-chip hsk-study-complete">✓ Đã hoàn thành bài</span>':
      '<span class="hsk-study-chip">'+stats.checked+'/'+stats.total+' câu đã kiểm tra</span>';
    var weak=journal.weakWords(info.level).length;
    return '<div class="hsk-study-progress" role="status" aria-live="polite"><div><strong>Tiến độ bài học</strong><small>'+(weak?'HSK '+info.level+': '+weak+' từ đang cần ôn lại.':'Làm quiz nhớ nghĩa để phát hiện từ chưa thuộc.')+'</small></div>'+summary+'</div>';
  }
  function finishHtml(info){
    var stats=journal.stats(info.lesson.id,info.exercises.length);
    var remaining=Math.max(0,stats.total-stats.checked),done=stats.completed;
    var percent=stats.graded?Math.round(stats.correct/stats.graded*100):null;
    if(done)return '<div class="hsk-study-finish is-done" data-hsk-finish-panel><h4>✓ Hoàn thành bài học</h4><p>Bạn đã kiểm tra '+stats.checked+'/'+stats.total+' câu'+(percent!==null?'; đúng '+stats.correct+'/'+stats.graded+' câu có đáp án':'')+'. Từ mới của bài đã được đưa vào lịch ôn.</p><div class="hsk-study-actions"><button type="button" data-hsk-review-open>Ôn từ HSK</button><button type="button" data-hsk-next-lesson>Học bài tiếp →</button></div></div>';
    return '<div class="hsk-study-finish" data-hsk-finish-panel><h4>Kết thúc bài học</h4><p>'+(remaining?'Còn '+remaining+' câu chưa kiểm tra. Làm và kiểm tra hết các câu để lưu hoàn thành.':'Đã kiểm tra đủ câu. Hãy lưu bài học và quay lại ôn từ vào ngày mai.')+'</p><button type="button" data-hsk-finish'+(remaining?' disabled':'')+'>✓ Hoàn thành & lưu tiến độ</button></div>';
  }
  function railProgress(info){
    var rail=q("#hskProgress");if(!rail)return;
    var done=journal.levelCount(info.level),total=info.data.lessons.length;
    rail.innerHTML='<div class="hsk-study-rail-progress"><strong>HSK '+info.level+' · '+done+'/'+total+' bài</strong><span>Tiến độ tự học đã lưu</span><div class="hsk-study-track"><i style="width:'+Math.min(100,Math.round(done*100/Math.max(1,total)))+'%"></i></div></div>';
    var buttons=doc.querySelectorAll("#hskLessonList [data-pro-lesson]");
    buttons.forEach(function(button){
      if(button.getAttribute("data-pro-lesson")!==info.lesson.id)return;
      var finished=journal.stats(info.lesson.id,info.exercises.length).completed;
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
    var word=pending[0];
    existing.innerHTML='<div class="hsk-study-review-head"><div><span>ÔN TẬP CÁCH QUÃNG</span><h4>Còn '+pending.length+' từ cần ôn</h4></div><button type="button" data-hsk-review-close aria-label="Đóng">×</button></div>'+
      '<div class="hsk-study-review-word"><strong lang="zh-CN">'+esc(word.hanzi)+'</strong><span>'+esc(word.pinyin)+'</span><p data-hsk-review-meaning hidden>'+esc(word.meaningVi)+'</p></div>'+
      '<div class="hsk-study-actions"><button type="button" data-hsk-review-reveal>Xem nghĩa</button>'+
      '<button type="button" data-hsk-review-grade="0" hidden>Chưa nhớ</button><button type="button" data-hsk-review-grade="1" hidden>Đã nhớ</button></div>';
  }
  function decorate(info){
    if(!journal||!info||!info.lesson||!info.data)return;
    var host=q("#hskLesson");if(!host)return;
    current={level:Number(info.level),lesson:info.lesson,data:info.data,
      exercises:(info.lesson.practiceRefs||[]).filter(function(id){return !!info.data.exerciseById[id];})};
    journal.visit(current.level,current.lesson.id);
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
  function onChecked(exerciseId,correct){
    if(!current||current.exercises.indexOf(exerciseId)<0)return false;
    if(!journal.recordAnswer(current.level,current.lesson.id,exerciseId,correct))return false;
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
          journal.recordWord(current.level,current.lesson.id,hanzi,correct,
            word&&word.pinyin||"",word&&word.meaningVi||"");
          update();
        }
      }
    }
    if(button.hasAttribute("data-hsk-finish")){
      event.preventDefault();
      if(!current)return;
      var alreadyCompleted=journal.stats(current.lesson.id,current.exercises.length).completed;
      var result=journal.complete(current.level,current.lesson.id,current.exercises.length,wordsFromLesson(current));
      update();
      if(result.ok&&!alreadyCompleted){
        var answers=journal.lesson(current.lesson.id).answers||{};
        var verified=current.exercises.map(function(id){return current.data.exerciseById[id];}).filter(function(exercise){
          return exercise&&['linguistic-reviewed','verified'].indexOf(exercise.reviewStatus)!==-1&&
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
      var first=journal.due()[0];if(!first)return;
      journal.reviewWord(first.level,first.hanzi,button.getAttribute("data-hsk-review-grade")==="1");
      update();reviewDrawer();return;
    }
    if(button.hasAttribute("data-hsk-next-lesson"))moveLesson(1);
  }
  function bind(){
    if(bound)return;bound=true;
    doc.addEventListener("click",handle);
    doc.addEventListener("vduckie:account-learning-synced",function(){update();reviewDrawer();});
  }
  bind();
  root.VDuckieHskStudyFlow=Object.freeze({decorate:decorate,onChecked:onChecked,openReview:function(){reviewOpen=true;reviewDrawer();},getCurrent:function(){return current?{level:current.level,lessonId:current.lesson.id}:null;}});
})(typeof window!=="undefined"?window:globalThis);
