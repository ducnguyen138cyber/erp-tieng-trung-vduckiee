(function(root){
  "use strict";

  var VERSION="80.1";
  var HSK_KEY="vduckie-hsk-roast-enabled";
  var ERP_BACKUP_KEY="vduckie-erp-roast-backup-v80";
  var counters=Object.create(null);
  var scanTimer=0;
  var lastSpoken="";
  var lastSpokenAt=0;

  var BANKS={
    quizWrong:[
      "Từ “{word}” nằm ngay trong bài “{lesson}”. Đáp án đúng là “{answer}”; đừng kéo nghĩa của một từ quen mắt khác vào đây.",
      "Sai câu từ vựng của chính bài đang học rồi bro. Nhìn lại “{word}” và đối chiếu đúng với “{answer}”.",
      "Câu này chỉ kiểm tra nội dung HSK của bài “{lesson}”. “{word}” phải đi với đáp án “{answer}”.",
      "M vừa chọn theo cảm giác thay vì theo bài. Ghi lại một lần: “{word}” = “{answer}”.",
      "Roast nhẹ thôi: từ của bài “{lesson}” mà còn nhận nhầm thì quay lại thẻ từ trước khi bấm tiếp. Đúng là “{answer}”."
    ],
    grammarWrong:[
      "Dính đúng bẫy ngữ pháp của bài “{lesson}”. Mẫu cần dùng là “{rule}”; dựng khung câu rồi mới xếp từ.",
      "Các chữ có thể đều quen nhưng đứng sai vị trí thì câu vẫn sai. Xem lại mẫu “{rule}” trong chính bài này.",
      "Đừng dịch từng chữ theo thứ tự tiếng Việt. Bài “{lesson}” đang luyện mẫu “{rule}”, bám đúng cấu trúc đó.",
      "Sai ngữ pháp chứ không phải thiếu từ vựng. Quay lại ví dụ của mẫu “{rule}” rồi làm lại.",
      "Câu này không hỏi kiến thức ngoài bài. Nó chỉ hỏi mẫu HSK “{rule}” của bài “{lesson}”."
    ],
    dictationWrong:[
      "Bài nghe này thuộc “{lesson}”. Nghe lại theo từng cụm; câu đúng là “{sentence}”.",
      "Tai nghe được một nửa, tay tự viết nửa còn lại rồi bro. Bám đúng câu HSK: “{sentence}”.",
      "Câu này chỉ dùng từ trong bài đang học. Tách “{sentence}” thành từng cụm ngắn rồi chép lại.",
      "Sai ở bài nghe của chính bài đang học. Nghe lại từ khóa “{word}” trong câu “{sentence}”.",
      "Đừng đoán chữ theo âm quen. Đáp án của bài “{lesson}” là “{sentence}”; nghe lại và đối chiếu từng chữ."
    ],
    readingWrong:[
      "Đọc lại đoạn của bài “{lesson}”, khoanh từ khóa rồi mới chọn. Đáp án đúng là “{answer}”.",
      "M vừa chọn câu nghe hợp tai chứ chưa bám nội dung bài đọc. Đúng phải là “{answer}”.",
      "Bài đọc này chỉ hỏi nội dung trong đoạn. Tìm thông tin trực tiếp rồi chọn “{answer}”.",
      "Sai vì bỏ qua từ khóa của bài “{lesson}”. Đọc chậm lại một lượt; đáp án là “{answer}”.",
      "Đừng suy diễn thêm ngoài đoạn văn. Nội dung bài chỉ dẫn đến đáp án “{answer}”."
    ],
    speakingWrong:[
      "Câu mẫu của bài “{lesson}” là “{sentence}”. Tách thành từng cụm, đọc chậm rồi nối lại.",
      "Máy chưa nghe ra đúng câu HSK. Bám pinyin và nhấn rõ từ “{word}” trong “{sentence}”.",
      "Đây là luyện nói theo bài hiện tại, không phải đọc một câu ngoài bài. Nghe lại “{sentence}” rồi đọc đúng nhịp.",
      "M đang nuốt mất vài âm của câu “{sentence}”. Đọc từng từ rõ trước, tốc độ để sau.",
      "Câu mẫu đi một đường, phần nhận dạng đi đường khác. Quay lại đúng câu của bài “{lesson}”: “{sentence}”."
    ],
    writingWrong:[
      "Chữ “{word}” thuộc bài “{lesson}”. Nhìn lại hướng nét đang được gợi ý rồi viết đúng thứ tự.",
      "Sai nét không phải do chữ khó mà do đi bút vội. Viết lại “{word}” từ nét đầu.",
      "Đừng vẽ hình chữ Hán theo trí nhớ. Bám đúng thứ tự nét của “{word}” trong bài này.",
      "Nét vừa rồi đi sai hướng. Dừng một nhịp, xem mẫu của chữ “{word}” rồi thử lại.",
      "Chữ của bài HSK này cần đúng thứ tự nét, không phải giống hình là được. Làm lại “{word}”."
    ],
    correct:[
      "Đúng nội dung của bài “{lesson}”. Cứ giữ cách đọc kỹ câu hỏi như vậy.",
      "Chuẩn. M đã bám đúng từ và ngữ cảnh của bài “{lesson}”.",
      "Câu này xử lý gọn. Nội dung HSK của bài hiện tại đã nhớ đúng.",
      "Đúng rồi bro. Không đoán mò, không lôi kiến thức ngoài bài sang chịu trận.",
      "Qua câu này đẹp. Tiếp tục giữ đúng ngữ cảnh của bài “{lesson}”."
    ]
  };

  function text(value){return String(value==null?"":value).trim();}
  function clean(value){return text(value).replace(/\s+/g," ");}
  function readJson(key,fallback){try{var value=JSON.parse(root.localStorage.getItem(key)||"");return value&&typeof value==="object"?value:fallback;}catch(error){return fallback;}}
  function hskEnabled(){try{return root.localStorage.getItem(HSK_KEY)!=="0";}catch(error){return true;}}
  function setHskEnabled(value){try{root.localStorage.setItem(HSK_KEY,value?"1":"0");}catch(error){}updateToggle();if(!value&&root.speechSynthesis)root.speechSynthesis.cancel();}
  function isHskArea(){return document.body&&document.body.getAttribute("data-current-area")==="hsk";}
  function activeLevel(){var button=document.querySelector('#hskLevels [data-hsk-level].active');if(button)return Number(button.getAttribute("data-hsk-level"));return Number(readJson("erp-hsk-state-v2",{level:0}).level||0);}
  function activeLesson(){var curriculum=root.HSKCurriculum;var level=activeLevel();if(!curriculum||!curriculum.levels||level<1||level>4)return null;var active=document.querySelector('#hskLessonList [data-hsk-lesson].active');var state=readJson("erp-hsk-state-v2",{lesson:0});var index=active?Number(active.getAttribute("data-hsk-lesson")):Number(state.lesson||0);return(curriculum.levels[level]||[])[index]||null;}
  function lessonContext(){var item=activeLesson()||{};return{lesson:text(item.title)||"bài HSK đang học",item:item};}
  function fill(template,data){return template.replace(/\{(\w+)\}/g,function(match,key){return text(data[key])||"nội dung này";});}
  function nextLine(kind,data){var bank=BANKS[kind]||BANKS.quizWrong;var lessonId=text(data.lesson)||"hsk";var key=lessonId+"|"+kind;var index=counters[key]||0;counters[key]=(index+1)%bank.length;return fill(bank[index%bank.length],data);}

  function findHskToggle(){return document.querySelector('#hsk [data-v62-roast-toggle]');}
  function legacyIsOn(){try{return root.localStorage.getItem("vduckie-roast-enabled")!=="0";}catch(error){return false;}}
  function muteLegacyForHsk(){
    if(!isHskArea())return;
    var button=findHskToggle();
    if(!button)return;
    try{if(root.sessionStorage&&!root.sessionStorage.getItem(ERP_BACKUP_KEY))root.sessionStorage.setItem(ERP_BACKUP_KEY,root.localStorage.getItem("vduckie-roast-enabled")||"0");}catch(error){}
    if(legacyIsOn()&&typeof button.onclick==="function")button.onclick();
    updateToggle();
  }
  function restoreLegacyOutsideHsk(){
    if(isHskArea())return;
    var button=findHskToggle();
    var desired="0";
    try{desired=root.sessionStorage.getItem(ERP_BACKUP_KEY)||root.localStorage.getItem("vduckie-roast-enabled")||"0";}catch(error){}
    if(button&&desired==="1"&&!legacyIsOn()&&typeof button.onclick==="function")button.onclick();
    if(button&&desired==="0"&&legacyIsOn()&&typeof button.onclick==="function")button.onclick();
    try{root.sessionStorage.removeItem(ERP_BACKUP_KEY);}catch(error){}
  }
  function updateToggle(){var button=findHskToggle();if(!button)return;button.textContent=hskEnabled()?"🔥 Roast Mode HSK: BẬT":"🙂 Roast Mode HSK: TẮT";button.setAttribute("aria-pressed",hskEnabled()?"true":"false");button.className="roast-voice v62-roast-toggle "+(hskEnabled()?"on":"off");}

  function speakVietnamese(message){
    if(!hskEnabled()||!isHskArea()||!root.speechSynthesis||!root.SpeechSynthesisUtterance)return;
    var now=Date.now();if(message===lastSpoken&&now-lastSpokenAt<1200)return;lastSpoken=message;lastSpokenAt=now;
    root.speechSynthesis.cancel();
    var utterance=new root.SpeechSynthesisUtterance(message);utterance.lang="vi-VN";utterance.rate=.96;
    var voices=root.speechSynthesis.getVoices?root.speechSynthesis.getVoices():[];
    for(var i=0;i<voices.length;i++){if(/^vi/i.test(voices[i].lang||"")){utterance.voice=voices[i];break;}}
    root.speechSynthesis.speak(utterance);
  }

  function setFeedback(element,kind,data,correct){
    if(!element||!hskEnabled())return;
    var previous=element.getAttribute("data-hsk-roast-text");
    if(previous&&clean(element.textContent)===clean(previous))return;
    data=data||{};
    var message=nextLine(correct?"correct":kind,data);
    element.setAttribute("data-hsk-roast-text",message);
    element.setAttribute("data-hsk-feedback-source","hsk-lesson-context");
    element.classList.remove("hidden");
    element.textContent=message;
    speakVietnamese(message);
  }

  function contextData(extra){var base=lessonContext();extra=extra||{};return{lesson:base.lesson,word:text(extra.word)||text((base.item.words&&base.item.words[0]||[])[0]),answer:text(extra.answer),sentence:text(extra.sentence),rule:text(extra.rule)};}

  function handleQuiz(){
    root.setTimeout(function(){var card=document.querySelector("#hskLesson .hsk-quiz");if(!card)return;var feedback=card.querySelector(".hsk-quiz-feedback");if(!feedback)return;var raw=feedback.textContent||"";var wrong=/chưa đúng|sai|không đúng/i.test(raw);var correct=/chính xác|đúng/i.test(raw)&&!wrong;if(!wrong&&!correct)return;var prompt=card.querySelector(".hsk-quiz-prompt strong");var answer=card.querySelector(".hsk-quiz-option.correct");setFeedback(feedback,"quizWrong",contextData({word:prompt&&prompt.textContent,answer:answer&&answer.textContent}),correct);},220);
  }
  function handleDictation(button){
    root.setTimeout(function(){var feedback=document.getElementById("hskDictationFeedback");var input=document.getElementById("hskDictationInput");var answer=button.getAttribute("data-answer")||"";if(!feedback||!input||!input.value.trim())return;var normalize=function(value){return text(value).replace(/[\s，。！？、,.!?]/g,"");};var correct=normalize(input.value)===normalize(answer);var word=(answer.match(/[\u3400-\u9fff]{1,4}/)||[])[0]||"";setFeedback(feedback,"dictationWrong",contextData({sentence:answer,word:word}),correct);},240);
  }
  function handleReading(button){
    root.setTimeout(function(){var section=button.closest(".hsk-section");if(!section)return;var correctButton=section.querySelector('[data-hsk-reading-option][data-correct="1"]');var correct=button.getAttribute("data-correct")==="1";var feedback=section.querySelector(".hsk-v80-reading-feedback");if(!feedback){feedback=document.createElement("div");feedback.className="hsk-quiz-feedback hsk-v80-reading-feedback";(section.querySelector(".hsk-reading-card")||section).appendChild(feedback);}setFeedback(feedback,"readingWrong",contextData({answer:correctButton&&correctButton.textContent}),correct);},180);
  }
  function handleGrammar(button){
    root.setTimeout(function(){var card=button.closest("[data-v62-grammar-trap]");if(!card)return;var feedback=card.querySelector("[data-v62-order-feedback],.hsk-quiz-feedback");if(!feedback)return;var raw=feedback.textContent||"";var wrong=/sai|chưa đúng|không đúng/i.test(raw)||feedback.classList.contains("bad");var correct=/đúng|chính xác/i.test(raw)&&!wrong;var ruleNode=card.querySelector(".v62-grammar-card p");var answerNode=card.querySelector(".v62-grammar-card");setFeedback(feedback,"grammarWrong",contextData({rule:ruleNode&&ruleNode.textContent,answer:answerNode&&answerNode.getAttribute("data-answer")}),correct);},240);
  }

  function scanDynamicFeedback(){
    if(!isHskArea()||!hskEnabled())return;
    muteLegacyForHsk();
    var speaking=document.querySelector('#hskLesson [data-v62-speaking-feedback]');
    if(speaking&&/bad|medium/.test(speaking.className||"")&&speaking.textContent.trim()){
      var speakingCard=speaking.closest("[data-v62-speaking]");var sentence=speakingCard&&speakingCard.getAttribute("data-target");setFeedback(speaking,"speakingWrong",contextData({sentence:sentence,word:(text(sentence).match(/[\u3400-\u9fff]{1,4}/)||[])[0]}),false);
    }
    var writing=document.querySelector('#hskLesson #hskWritingStatus.bad');
    if(writing){var model=document.querySelector("#hskLesson .hsk-copy-model strong");setFeedback(writing,"writingWrong",contextData({word:model&&model.textContent}),false);}
  }
  function scheduleScan(){root.clearTimeout(scanTimer);scanTimer=root.setTimeout(scanDynamicFeedback,260);}

  function onClick(event){
    var button=event.target&&event.target.closest&&event.target.closest("button");if(!button)return;
    if(button.matches('#hsk [data-v62-roast-toggle]')){event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();setHskEnabled(!hskEnabled());muteLegacyForHsk();return;}
    if(!isHskArea()||!hskEnabled())return;
    if(button.getAttribute("data-hsk-option")!==null)handleQuiz();
    else if(button.getAttribute("data-hsk-action")==="dictation-check")handleDictation(button);
    else if(button.getAttribute("data-hsk-reading-option")!==null)handleReading(button);
    else if(button.getAttribute("data-v62-order-check")!==null)handleGrammar(button);
  }

  function onAreaChange(){if(isHskArea()){muteLegacyForHsk();scheduleScan();}else restoreLegacyOutsideHsk();}
  function install(){
    if(document.documentElement.getAttribute("data-hsk-roast-context-v80")==="1")return;
    document.documentElement.setAttribute("data-hsk-roast-context-v80","1");
    try{if(root.localStorage.getItem(HSK_KEY)===null)root.localStorage.setItem(HSK_KEY,root.localStorage.getItem("vduckie-roast-enabled")==="0"?"0":"1");}catch(error){}
    document.addEventListener("click",onClick,true);
    if(root.MutationObserver){
      new root.MutationObserver(onAreaChange).observe(document.body,{attributes:true,attributeFilter:["data-current-area"]});
      var lesson=document.getElementById("hskLesson");if(lesson)new root.MutationObserver(scheduleScan).observe(lesson,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class"]});
    }
    root.setInterval(function(){if(isHskArea()){muteLegacyForHsk();updateToggle();}},700);
    onAreaChange();
  }

  root.VDuckieHSKRoastContext={version:VERSION,banks:BANKS,nextLine:nextLine,enabled:hskEnabled,setEnabled:setHskEnabled,refresh:scheduleScan};
  if(typeof document==="undefined")return;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})(typeof window!=="undefined"?window:globalThis);
