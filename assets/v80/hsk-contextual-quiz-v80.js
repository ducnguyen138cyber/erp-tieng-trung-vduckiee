(function(root){
  "use strict";

  var VERSION="80.0";
  var PROGRESS_KEY="erp-hsk-progress-v2";
  var STATE_KEY="erp-hsk-state-v2";
  var states=Object.create(null);
  var observer=null;
  var patchTimer=0;

  function text(value){return String(value==null?"":value).trim();}
  function escapeHtml(value){return text(value).replace(/[&<>"']/g,function(character){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character];});}
  function unique(list){var output=[];for(var i=0;i<list.length;i++){var value=text(list[i]);if(value&&output.indexOf(value)===-1)output.push(value);}return output;}
  function hash(value){var result=2166136261;value=text(value);for(var i=0;i<value.length;i++){result^=value.charCodeAt(i);result+=(result<<1)+(result<<4)+(result<<7)+(result<<8)+(result<<24);}return result>>>0;}
  function rotate(list,offset){if(!list.length)return[];offset=((offset%list.length)+list.length)%list.length;return list.slice(offset).concat(list.slice(0,offset));}
  function seededShuffle(list,seed){var output=list.slice();var value=seed>>>0;for(var i=output.length-1;i>0;i--){value=(value*1664525+1013904223)>>>0;var j=value%(i+1);var swap=output[i];output[i]=output[j];output[j]=swap;}return output;}
  function replaceFirst(source,target,replacement){source=text(source);target=text(target);var index=source.indexOf(target);if(index<0)return replacement+" · "+source;return source.slice(0,index)+replacement+source.slice(index+target.length);}

  function optionSet(correct,candidates,seed){
    var values=unique([correct].concat(candidates||[]));
    var fallback=["—","Không có trong bài","Chưa học ở bài này","Đáp án khác"];
    for(var i=0;values.length<4&&i<fallback.length;i++)if(values.indexOf(fallback[i])===-1)values.push(fallback[i]);
    values=seededShuffle(values.slice(0,4),seed);
    return{options:values,correctIndex:values.indexOf(correct)};
  }

  function wordAt(words,index){return words[((index%words.length)+words.length)%words.length]||["","","","",""];}
  function grammarAt(grammar,index){return grammar.length?grammar[((index%grammar.length)+grammar.length)%grammar.length]:null;}

  function buildQuestions(item,round){
    item=item||{};
    round=Math.max(0,Number(round)||0);
    var words=Array.isArray(item.words)?item.words.filter(function(word){return word&&word[0];}):[];
    var grammar=Array.isArray(item.grammar)?item.grammar.filter(function(rule){return rule&&rule[0];}):[];
    if(!words.length)return[];
    var base=(hash(item.id||item.title||"hsk")+round*5)%words.length;
    var ordered=rotate(words,base);
    var lessonTitle=text(item.title)||"bài đang học";
    var questions=[];

    var w1=wordAt(ordered,0);
    var q1=optionSet(w1[2],ordered.slice(1).map(function(word){return word[2];}),hash(lessonTitle+round+"meaning"));
    questions.push({
      type:"meaning",focus:w1[0],prompt:"Trong bài “"+lessonTitle+"”, “"+w1[0]+"” có nghĩa là gì?",options:q1.options,correctIndex:q1.correctIndex,
      explanation:w1[0]+" = "+w1[2]+".",
      roastWrong:"Sai đúng chỗ từ mới rồi bro. “"+w1[0]+"” trong bài này là “"+w1[2]+"”. Nhìn lại thẻ từ của chính bài “"+lessonTitle+"”, đừng đoán theo từ quen mắt."
    });

    var w2=wordAt(ordered,1);
    var q2=optionSet(w2[0],ordered.filter(function(word){return word!==w2;}).map(function(word){return word[0];}),hash(lessonTitle+round+"hanzi"));
    questions.push({
      type:"hanzi",focus:w2[0],prompt:"Chọn chữ Hán đúng với nghĩa: “"+w2[2]+"”.",options:q2.options,correctIndex:q2.correctIndex,
      explanation:"“"+w2[2]+"” được viết là “"+w2[0]+"” ("+w2[1]+").",
      roastWrong:"Chữ của bài này đang đứng ngay trước mặt mà vẫn chọn lệch. “"+w2[2]+"” phải là “"+w2[0]+"”, pinyin “"+w2[1]+"”."
    });

    var w3=wordAt(ordered,2);
    var sentence3=text(w3[3])||("我学习"+w3[0]+"。");
    var q3=optionSet(w3[0],ordered.filter(function(word){return word!==w3;}).map(function(word){return word[0];}),hash(lessonTitle+round+"blank"));
    questions.push({
      type:"blank",focus:w3[0],prompt:"Điền từ của bài vào chỗ trống: “"+replaceFirst(sentence3,w3[0],"____")+"”",options:q3.options,correctIndex:q3.correctIndex,
      explanation:"Câu mẫu đúng: "+sentence3+(w3[4]?" · "+w3[4]:""),
      roastWrong:"Câu mẫu này thuộc đúng bài “"+lessonTitle+"”. Chỗ trống cần “"+w3[0]+"”, không phải kéo một từ ngoài ngữ cảnh vào cho đủ chỗ."
    });

    var rule=grammarAt(grammar,round);
    if(rule){
      var grammarCandidates=grammar.filter(function(candidate){return candidate!==rule;}).map(function(candidate){return candidate[2];});
      for(var gi=0;grammarCandidates.length<3&&gi<ordered.length;gi++)grammarCandidates.push(ordered[gi][3]);
      var q4=optionSet(rule[2],grammarCandidates,hash(lessonTitle+round+"grammar"));
      questions.push({
        type:"grammar",focus:rule[0],prompt:"Câu nào minh họa đúng mẫu ngữ pháp “"+rule[0]+"”?",options:q4.options,correctIndex:q4.correctIndex,
        explanation:rule[0]+": "+rule[2]+(rule[3]?" · "+rule[3]:""),
        roastWrong:"Dính bẫy ngữ pháp của chính bài rồi. Mẫu “"+rule[0]+"” đi với câu “"+rule[2]+"”. Dựng khung câu trước rồi mới chọn."
      });
    }else{
      var w4=wordAt(ordered,3);
      var q4Fallback=optionSet(w4[1],ordered.filter(function(word){return word!==w4;}).map(function(word){return word[1];}),hash(lessonTitle+round+"pinyin"));
      questions.push({type:"pinyin",focus:w4[0],prompt:"Pinyin đúng của “"+w4[0]+"” là gì?",options:q4Fallback.options,correctIndex:q4Fallback.correctIndex,explanation:w4[0]+" đọc là "+w4[1]+".",roastWrong:"Sai pinyin của từ ngay trong bài rồi. “"+w4[0]+"” đọc là “"+w4[1]+"”."});
    }

    var w5=wordAt(ordered,4);
    var correctSentence=text(w5[3])||w5[0];
    var vietnameseSentence=text(w5[4])||w5[2];
    var q5=optionSet(correctSentence,ordered.filter(function(word){return word!==w5;}).map(function(word){return text(word[3])||word[0];}),hash(lessonTitle+round+"sentence"));
    questions.push({
      type:"sentence",focus:w5[0],prompt:"Chọn câu tiếng Trung đúng với: “"+vietnameseSentence+"”",options:q5.options,correctIndex:q5.correctIndex,
      explanation:correctSentence+" · "+vietnameseSentence,
      roastWrong:"Đây là câu mẫu của bài “"+lessonTitle+"”: “"+correctSentence+"”. Đọc cả câu và đối chiếu nghĩa, đừng chỉ chộp một chữ quen."
    });

    return questions.slice(0,5);
  }

  root.VDuckieHSKQuizV80Utils={version:VERSION,buildQuestions:buildQuestions,optionSet:optionSet};
  if(typeof document==="undefined")return;

  function readJson(key,fallback){try{var value=JSON.parse(root.localStorage.getItem(key)||"");return value&&typeof value==="object"?value:fallback;}catch(error){return fallback;}}
  function activeLevel(){var button=document.querySelector('#hskLevels [data-hsk-level].active');if(button)return Number(button.getAttribute("data-hsk-level"));return Number(readJson(STATE_KEY,{level:0}).level||0);}
  function activeLessonIndex(){var button=document.querySelector('#hskLessonList [data-hsk-lesson].active');if(button)return Number(button.getAttribute("data-hsk-lesson"));return Number(readJson(STATE_KEY,{lesson:0}).lesson||0);}
  function currentInfo(){var curriculum=root.HSKCurriculum;var level=activeLevel();if(!curriculum||!curriculum.levels||level<1||level>4)return null;var lessons=curriculum.levels[level]||[];var index=activeLessonIndex();var item=lessons[index];return item?{level:level,index:index,item:item}:null;}
  function roastEnabled(){try{return root.localStorage.getItem("vduckie-roast-enabled")!=="0";}catch(error){return true;}}
  function stateFor(item){var id=item.id||item.title;if(!states[id])states[id]={lessonId:id,round:0,index:0,score:0,answered:false,selected:-1,questions:buildQuestions(item,0)};return states[id];}
  function resetState(item,nextRound){var id=item.id||item.title;var previous=states[id];var round=nextRound?(previous?previous.round+1:1):0;states[id]={lessonId:id,round:round,index:0,score:0,answered:false,selected:-1,questions:buildQuestions(item,round)};return states[id];}

  function markCompleted(item){var completed=readJson(PROGRESS_KEY,{});completed[item.id]=true;try{root.localStorage.setItem(PROGRESS_KEY,JSON.stringify(completed));}catch(error){}}
  function removeLegacyTrap(lesson){
    var traps=lesson.querySelectorAll(".v62-grammar-trap,[data-v62-grammar-trap]");
    for(var i=0;i<traps.length;i++)if(traps[i].getAttribute("data-v80-sentinel")!=="1"&&traps[i].parentNode)traps[i].parentNode.removeChild(traps[i]);
    if(!lesson.querySelector('[data-v80-sentinel="1"]')){
      var sentinel=document.createElement("span");
      sentinel.hidden=true;
      sentinel.setAttribute("aria-hidden","true");
      sentinel.setAttribute("data-v62-grammar-trap","disabled-by-v80");
      sentinel.setAttribute("data-v80-sentinel","1");
      lesson.appendChild(sentinel);
    }
  }

  function feedbackHtml(question,correct){
    var message=correct?(roastEnabled()?"Đúng câu này. Ít nhất m vẫn nhớ nội dung của đúng bài đang học.":"Chính xác. "+question.explanation):(roastEnabled()?question.roastWrong:"Chưa đúng. "+question.explanation);
    return '<div class="hsk-quiz-feedback '+(correct?"good":"bad")+'" data-v80-feedback-kind="'+escapeHtml(question.type)+'"><strong>'+(correct?"Chính xác.":"Chưa đúng.")+'</strong> '+escapeHtml(message)+'</div>';
  }

  function renderQuiz(section,info,state){
    var item=info.item;
    var questions=state.questions;
    section.setAttribute("data-v80-contextual-quiz",VERSION);
    section.setAttribute("data-v80-lesson",item.id||item.title||"");
    if(state.index>=questions.length){
      var passed=state.score>=4;
      if(passed)markCompleted(item);
      section.innerHTML='<div class="hsk-quiz-head"><h4>Kiểm tra cuối bài · 5 câu theo bài học</h4><span class="step">'+(passed?"ĐÃ QUA BÀI":"LÀM LẠI ĐỂ ĐẠT 4/5")+'</span></div><div class="hsk-result '+(passed?"pass":"retry")+'"><strong>'+state.score+'/5</strong><h4>'+(passed?"Đã qua bài":"Chưa qua bài")+'</h4><p>'+(passed?"Cả 5 câu đều được dựng từ từ mới, câu mẫu và ngữ pháp của bài này.":"Làm lại sẽ chuyển sang một vòng câu khác nhưng vẫn chỉ dùng nội dung của bài này.")+'</p><div class="hsk-actions" style="justify-content:center"><button class="muted" data-hsk-v80-action="restart">Làm lại vòng khác</button>'+(passed?'<button class="accent" data-hsk-v80-action="next-lesson">Bài tiếp theo →</button>':"")+'</div></div>';
      return;
    }
    var question=questions[state.index];
    var html='<div class="hsk-quiz-head"><h4>Kiểm tra cuối bài · Câu '+(state.index+1)+'/5</h4><span class="step">5 CÂU RIÊNG CỦA BÀI · CẦN ĐÚNG 4/5</span></div><div class="hsk-v80-context"><span>Bài '+escapeHtml(item.title||"")+'</span><small>Toàn bộ câu hỏi và đáp án chỉ lấy từ bài đang học.</small></div><div class="hsk-quiz-prompt hsk-v80-prompt"><strong>'+escapeHtml(question.prompt)+'</strong></div><div class="hsk-quiz-options">';
    for(var i=0;i<question.options.length;i++){
      var className="hsk-quiz-option";
      if(state.answered&&i===question.correctIndex)className+=" correct";
      else if(state.answered&&i===state.selected)className+=" wrong";
      html+='<button class="'+className+'" data-hsk-v80-option="'+i+'"'+(state.answered?" disabled":"")+'>'+escapeHtml(question.options[i])+'</button>';
    }
    html+='</div>';
    if(state.answered){var correct=state.selected===question.correctIndex;html+=feedbackHtml(question,correct)+'<div class="hsk-actions" style="margin-top:10px"><button class="accent" data-hsk-v80-action="next-question">Câu tiếp theo →</button></div>';}
    section.innerHTML=html;
  }

  function patch(){
    var lesson=document.getElementById("hskLesson");
    var info=currentInfo();
    if(!lesson||!info)return;
    removeLegacyTrap(lesson);
    var section=lesson.querySelector(".hsk-quiz");
    if(!section||!info.item.words||!info.item.words.length)return;
    var state=stateFor(info.item);
    renderQuiz(section,info,state);
  }
  function schedulePatch(){root.clearTimeout(patchTimer);patchTimer=root.setTimeout(patch,30);}

  function handleClick(event){
    var button=event.target&&event.target.closest&&event.target.closest("button");
    if(!button)return;
    var option=button.getAttribute("data-hsk-v80-option");
    var action=button.getAttribute("data-hsk-v80-action");
    if(option===null&&action===null)return;
    event.preventDefault();
    event.stopPropagation();
    if(event.stopImmediatePropagation)event.stopImmediatePropagation();
    var info=currentInfo();
    if(!info)return;
    var state=stateFor(info.item);
    if(option!==null&&!state.answered){
      state.selected=Number(option);
      state.answered=true;
      if(state.selected===state.questions[state.index].correctIndex)state.score++;
      patch();
      return;
    }
    if(action==="next-question"){
      state.index++;
      state.answered=false;
      state.selected=-1;
      patch();
    }else if(action==="restart"){
      resetState(info.item,true);
      patch();
    }else if(action==="next-lesson"){
      var next=document.querySelector('#hskLesson .hsk-lesson-head [data-hsk-action="next-lesson"]');
      if(next)next.click();
    }
  }

  function install(){
    var lesson=document.getElementById("hskLesson");
    if(!lesson){root.setTimeout(install,60);return;}
    if(document.documentElement.getAttribute("data-hsk-quiz-v80")==="1"){schedulePatch();return;}
    document.documentElement.setAttribute("data-hsk-quiz-v80","1");
    document.addEventListener("click",handleClick,true);
    if(root.MutationObserver){observer=new MutationObserver(schedulePatch);observer.observe(lesson,{childList:true,subtree:false});}
    root.addEventListener("vduckie:hsk-dictionary-ready",schedulePatch);
    root.addEventListener("hashchange",schedulePatch);
    schedulePatch();
  }

  root.VDuckieHSKQuizV80={version:VERSION,patch:patch,resetCurrent:function(){var info=currentInfo();if(info){resetState(info.item,true);patch();}}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})(typeof window!=="undefined"?window:globalThis);
