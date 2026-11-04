/* Real interactive HSK practice UI: 4 levels × 56 seeded forms.
 * XP only via existing authenticated Supabase RPC; animation lives in EXP core.
 */
(function (root, document) {
  "use strict";
  if (!root || !document) return;
  var bank = root.VDuckieHSKPracticeBank;
  if (!bank) return;
  var cache = Object.create(null), requestSeq = 0;
  var level = 1, page = null, step = 0, marks = [], answered = false, finished = false, dictationRewardTried = false, audioFallback = false;
  function byId(id) { return document.getElementById(id); }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g,function(ch){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
  }); }
  function locale() { return root.VDuckieInterfaceI18n && root.VDuckieInterfaceI18n.getLanguage() || "vi"; }
  function label(vi,zh,en) { var l=locale();return l==="zh"?zh:l==="en"?en:vi; }
  function panel() { return byId("dailyLearningPanel"); }
  function decorate(html) {
    var host = panel(); if (!host) return;
    host.className = "panel daily-panel graded-hsk-screen hsk-practice-screen";
    host.innerHTML = html;
    document.body.setAttribute("data-current-area","msutong");
  }
  function loading(text) {
    decorate('<section class="hsk-practice-container"><p class="hsk-practice-wait">'+esc(text)+'</p></section>');
  }
  function getWords(hsk) {
    if (cache[hsk]) return cache[hsk];
    var dir = "./data/hsk/hsk"+hsk+"/vocabulary/";
    cache[hsk] = root.fetch(dir+"index.json").then(function (res) {
      if (!res.ok) throw new Error("Cannot load HSK vocabulary index: " + res.status);
      return res.json();
    }).then(function (idx) {
      if (!Array.isArray(idx.shards)||!idx.shards.length)throw new Error("Missing HSK vocabulary shards");
      return Promise.all(idx.shards.map(function(shard){
        if (!/^[a-z0-9_-]+\.json$/i.test(shard.file))throw new Error("Invalid vocabulary shard");
        return root.fetch(dir+shard.file).then(function(r){
          if(!r.ok)throw new Error("Cannot load HSK words: "+shard.file);
          return r.json();
        }).then(function(json){return json.records||[];});
      })).then(function(parts){return parts.reduce(function(a,b){return a.concat(b)},[]);});
    }).catch(function(err){delete cache[hsk];throw err;});
    return cache[hsk];
  }
  function progress() {
    try { var obj=JSON.parse(root.localStorage.getItem("vduckie-hsk-practice-results-v1")||"{}");
      return obj&&typeof obj==="object"&&!Array.isArray(obj)?obj:{}; }
    catch(e){return {};}
  }
  function saveResult(score) {
    try {
      var key=page.id, stored=progress(), previous=stored[key]||{};
      stored[key]={attempts:Math.min(999,Number(previous.attempts||0)+1),
        best:Math.max(score,Number(previous.best||0)),last:score,date:new Date().toISOString()};
      root.localStorage.setItem("vduckie-hsk-practice-results-v1",JSON.stringify(stored));
    }catch(error){ /* Local history is optional; results still show. */ }
  }
  function shellHeader(title,detail) {
    return '<header class="hsk-practice-header"><div><span class="hsk-practice-kicker">HSK PRACTICE · VDUCKIE</span><h2>'+
      esc(title)+'</h2><p>'+esc(detail)+'</p></div><button type="button" class="hsk-practice-back" data-practice-close>'+
      esc(label("← Giáo trình HSK","← 返回 HSK 课程","← HSK curriculum"))+'</button></header>';
  }
  function catalog() {
    requestSeq++;
    page = null; finished=false; level=Number(level)||1;
    var results=progress();
    var nav='<div class="hsk-practice-levels" role="tablist" aria-label="HSK levels">'+
      [1,2,3,4].map(function(l){
        return '<button role="tab" aria-selected="'+(l===level)+'" type="button" class="'+(l===level?'active':'')+'" data-practice-level="'+l+'">HSK '+l+'</button>';
      }).join("")+'</div>';
    var list=[];
    for(var i=1;i<=bank.PAPERS_PER_LEVEL;i++){
      var id="hsk"+level+"-practice-"+String(i).padStart(2,"0"),result=results[id];
      list.push('<button class="hsk-practice-paper" type="button" data-practice-start="'+i+'"><b>'+
        esc(label("Đề","第","Paper"))+' '+String(i).padStart(2,"0")+'</b><small>'+
        (result?esc(label("Cao nhất: ","最高：","Best: "))+Math.round(result.best)+'%':esc(label("Chưa làm","尚未作答","Not attempted")))+
        '</small></button>');
    }
    decorate('<section class="hsk-practice-container">'+shellHeader(
      label("Kho đề luyện HSK · 224 đề","HSK 模拟练习题库 · 224 套","HSK practice bank · 224 papers"),
      label("HSK 1–4 · 56 mã đề mỗi cấp · 24 câu/đề · chấm điểm và giải thích ngay.",
      "HSK 1–4 · 每级 56 套 · 每套 24 题 · 即时评分与解析。",
      "HSK 1–4 · 56 forms per level · 24 questions each · instant scoring."))+
      '<p class="hsk-practice-disclaimer">'+esc(label(
      "Đây là bộ đề mô phỏng do VDuckie tạo từ thư viện từ vựng đang có, không phải 224 đề chính thức hoặc 224 ngân hàng câu hỏi hoàn toàn khác nhau. Các mã đề có thể trùng từ.",
      "此为 VDuckie 根据现有词库生成的练习卷，并非 224 套官方试卷或完全独立的题库；不同试卷可能出现重复词汇。",
      "Original practice variants generated from the VDuckie word bank, not 224 official exams or fully independent question banks. Words can repeat across papers."))+'</p>'+
      nav+'<div class="hsk-practice-catalog">'+list.join("")+'</div></section>');
  }
  function start(l,number){
    level=Number(l);step=0;marks=[];answered=false;finished=false;dictationRewardTried=false;audioFallback=false;
    var token=++requestSeq;
    loading(label("Đang nạp câu hỏi…","正在加载题目…","Loading questions…"));
    getWords(level).then(function(records){
      if(token!==requestSeq||document.body.getAttribute("data-current-area")!=="msutong")return;
      page=bank.build(level,number,records);renderQuestion();
    }).catch(function(error){
      if(token!==requestSeq)return;
      decorate('<section class="hsk-practice-container">'+shellHeader(
        label("Không tải được đề","无法加载试卷","Unable to load paper"),
        String(error&&error.message||error))+
        '<button type="button" data-practice-catalog>'+esc(label("Trở về danh sách","返回列表","Back to papers"))+'</button></section>');
    });
  }
  function listen() {
    if(!page||finished)return;
    var question=page.questions[step];
    if(!question||question.type!=="listening")return;
    if(!root.speechSynthesis||!root.SpeechSynthesisUtterance){
      var fallback=byId("hskPracticeAudioFallback");
      if(fallback)fallback.textContent=label("Thiết bị không hỗ trợ phát âm; từ cần nghe: ","设备不支持语音；目标词：","Speech unavailable; target: ")+question.hanzi;
      audioFallback=true;
      return;
    }
    root.speechSynthesis.cancel();
    var speech=new root.SpeechSynthesisUtterance(question.hanzi);
    speech.lang="zh-CN";speech.rate=.84;
    root.speechSynthesis.speak(speech);
  }
  function renderQuestion() {
    if(!page||!panel())return;
    var q=page.questions[step], percent=Math.round(100*step/page.questions.length);
    var title=label("HSK "+level+" · Đề "+page.number,"HSK "+level+" · 第 "+page.number+" 套","HSK "+level+" · Paper "+page.number);
    var heading=shellHeader(title,label("Làm đúng câu hỏi để ghi nhận kiến thức. Điểm thưởng chỉ cộng khi Supabase xác nhận.",
      "正确答题可记录学习成果；只有 Supabase 确认后才会显示 EXP 奖励。",
      "Correct answers show learning progress; EXP appears only when Supabase confirms it."));
    var progressHtml='<div class="hsk-practice-progress"><span>'+esc(label("Câu ","第 ","Question "))+String(step+1)+' / '+page.questions.length+'</span>'+
      '<span>'+Math.round(100*step/page.questions.length)+'%</span><div class="hsk-practice-track"><i style="width:'+percent+'%"></i></div></div>';
    var prompt = q.type==="meaning"?label("Chọn nghĩa đúng của từ tiếng Trung.","选择这个汉语词的正确释义。","Choose the word's correct meaning."):
      q.type==="hanzi"?label("Chọn chữ Hán tương ứng với nghĩa.","根据释义选择正确的汉字。","Choose the matching Hanzi."):
      q.type==="pinyin"?label("Chọn Pinyin có thanh điệu chính xác.","选择正确的声调拼音。","Choose the correct tone-marked pinyin."):
      q.type==="listening"?label("Nghe phát âm và chọn chữ Hán được đọc.","听发音并选择对应的汉字。","Listen and choose the spoken Hanzi."):
      q.type==="reading"?label("Đọc câu và chọn nghĩa của từ được hỏi.","阅读句子并选择目标词的正确释义。","Read the sentence and choose the target word's meaning."):
      label("Viết chữ Hán cho từ dưới đây.","根据提示填写汉字。","Write the Hanzi for this word.");
    var stimulus=q.type==="listening"?
      '<button type="button" class="hsk-practice-audio" data-practice-listen>🔊 '+esc(label("Nghe từ","播放发音","Play audio"))+'</button>'+
      '<p id="hskPracticeAudioFallback" class="hsk-practice-fallback" aria-live="polite"></p>':
      '<div class="hsk-practice-stimulus'+(q.type==="hanzi"||q.type==="writing"||q.type==="reading"?' is-meaning':'')+'">'+esc(q.stimulus)+'</div>';
    var answers=q.type==="writing"?
      '<form class="hsk-practice-writing" data-practice-write><label for="hskPracticeAnswer">'+esc(label("Nhập chữ Hán","输入汉字","Type Hanzi"))+
      '</label><input id="hskPracticeAnswer" type="text" lang="zh-CN" autocomplete="off" spellcheck="false" required placeholder="汉字">'+
      '<button type="submit">'+esc(label("Kiểm tra câu trả lời","检查答案","Check answer"))+'</button></form>':
      '<div class="hsk-practice-answers">'+q.options.map(function(o,i){
        return '<button type="button" class="hsk-practice-choice" data-practice-choice="'+i+'">'+
          '<span>'+String.fromCharCode(65+i)+'</span>'+esc(o)+'</button>';
      }).join("")+'</div>';
    decorate('<section class="hsk-practice-container">'+heading+progressHtml+
      '<div class="hsk-practice-question"><span class="hsk-practice-kind">'+esc(q.type.toUpperCase())+
      '</span><h3>'+esc(prompt)+'</h3>'+stimulus+answers+
      '<div class="hsk-practice-feedback" id="hskPracticeFeedback" aria-live="polite"></div>'+
      '<div class="hsk-practice-actions"><button type="button" data-practice-catalog>'+
      esc(label("Danh sách đề","试卷列表","Paper list"))+'</button><button type="button" class="primary" data-practice-next disabled>'+
      esc(step===page.questions.length-1?label("Xem kết quả","查看结果","See results"):
      label("Câu tiếp →","下一题 →","Next →"))+'</button></div></div></section>');
    if(answered&&marks[step])paintAnswer(q,marks[step].answer,marks[step].correct);
  }
  function paintAnswer(q,answer,right) {
    var buttons=panel().querySelectorAll("[data-practice-choice]");
    Array.prototype.forEach.call(buttons,function(button){
      var idx=Number(button.getAttribute("data-practice-choice"));
      button.disabled=true;
      if(q.options[idx]===q.answer)button.classList.add("correct");
      else if(q.options[idx]===answer)button.classList.add("wrong");
    });
    var writer=byId("hskPracticeAnswer");
    if(writer)writer.disabled=true;
    var form=panel().querySelector("[data-practice-write] button");
    if(form)form.disabled=true;
    var feedback=byId("hskPracticeFeedback");
    if(feedback){
      feedback.className="hsk-practice-feedback "+(right?"correct":"wrong");
      feedback.innerHTML='<strong>'+esc(right?
        label("Chính xác!","回答正确！","Correct!"):
        label("Chưa chính xác.","回答不正确。","Not quite."))+'</strong><p>'+
        esc(label("Đáp án: ","正确答案：","Answer: "))+esc(q.answer)+'</p>'+
        '<p>'+esc(q.hanzi+" · "+q.pinyin+" · "+q.meaning)+'</p>';
    }
    var next=panel().querySelector("[data-practice-next]");
    if(next)next.disabled=false;
  }
  function submit(answer,anchor) {
    if(!page||answered||finished)return;
    var q=page.questions[step], right=bank.grade(q,answer);
    answered=true;marks.push({id:q.id,answer:answer,correct:right,wordId:q.wordId});
    paintAnswer(q,answer,right);
    // Only a verified positive Supabase award displays floating EXP.
    // MCQ first correct word: +5 per distinct word (server deduped).
    // Written Hanzi: +10 for first correct dictation in this paper (server deduped).
    if(right && root.VDuckieEXP){
      if(q.type==="writing"&&!dictationRewardTried && typeof root.VDuckieEXP.awardEXP==="function"){
        dictationRewardTried=true;
        root.VDuckieEXP.awardEXP("dictation_complete",
          "hsk:practice-l"+page.level+"-p"+String(page.number).padStart(2,"0")+":dictation").catch(function(){});
      } else if(q.type!=="writing"&&!(q.type==="listening"&&audioFallback)&&
        typeof root.VDuckieEXP.awardWordMastery==="function"){
        root.VDuckieEXP.awardWordMastery(page.level,q.hanzi,anchor||null).catch(function(){});
      }
    }
  }
  function finish(restoreOnly) {
    if(!page||(finished&&!restoreOnly))return;
    if(!restoreOnly)finished=true;
    var correct=marks.filter(function(x){return x.correct;}).length;
    var score=Math.round(correct*100/page.questions.length);
    if(!restoreOnly)saveResult(score);
    var pass=score>=70;
    decorate('<section class="hsk-practice-container">'+shellHeader(
      label("Kết quả luyện tập","练习成绩","Practice result"),
      label("HSK "+page.level+" · Đề "+page.number,"HSK "+page.level+" · 第 "+page.number+" 套","HSK "+page.level+" · Paper "+page.number))+
      '<div class="hsk-practice-result"><div class="hsk-practice-score">'+score+'%</div><h3>'+
      esc(pass?label("Đạt mục tiêu luyện tập","达到练习目标","Practice target met"):
      label("Cần ôn thêm","建议继续复习","Keep reviewing"))+'</h3><p>'+correct+'/'+page.questions.length+' '+
      esc(label("câu đúng.","题正确。","correct answers."))+'</p><p>'+
      esc(label("Đây là điểm luyện tập, không phải điểm thi HSK chính thức.","此分数仅供练习参考，并非官方 HSK 成绩。",
      "This practice score is not an official HSK result."))+'</p><div class="hsk-practice-result-buttons">'+
      '<button type="button" data-practice-again>'+esc(label("Làm lại đề","重做本套","Retry paper"))+'</button>'+
      '<button type="button" data-practice-catalog>'+esc(label("Chọn đề khác","选择其他试卷","Choose another paper"))+'</button></div></div></section>');
    // Existing server awards 15 EXP for a qualifying, first-time quiz pass.
    // New attempts and client-side scores cannot bypass the server dedupe key.
    if(!restoreOnly&&pass&&root.VDuckieEXP&&typeof root.VDuckieEXP.awardEXP==="function"){
      var source="hsk:practice-l"+page.level+"-p"+String(page.number).padStart(2,"0")+":quiz";
      root.VDuckieEXP.awardEXP("quiz_pass",source).catch(function(){});
    }
  }
  function onClick(event) {
    var button=event.target.closest&&event.target.closest("button");if(!button)return;
    if(button.hasAttribute("data-practice-open")){open();return;}
    var host=panel();if(!host||!host.contains(button))return;
    if(button.hasAttribute("data-practice-close")){
      if(root.VDuckieGradedHSK)root.VDuckieGradedHSK.open();return;
    }
    if(button.hasAttribute("data-practice-level")){level=Number(button.dataset.practiceLevel);catalog();return;}
    if(button.hasAttribute("data-practice-catalog")){catalog();return;}
    if(button.hasAttribute("data-practice-start")){start(level,Number(button.dataset.practiceStart));return;}
    if(button.hasAttribute("data-practice-again")){start(page.level,page.number);return;}
    if(button.hasAttribute("data-practice-listen")){listen();return;}
    if(button.hasAttribute("data-practice-choice")){
      var choice=page&&page.questions[step]&&page.questions[step].options[Number(button.dataset.practiceChoice)];
      if(choice!==undefined)submit(choice,button);
      return;
    }
    if(button.hasAttribute("data-practice-next")&&!button.disabled){
      if(step+1>=page.questions.length)finish();
      else {step++;answered=false;audioFallback=false;renderQuestion();}
    }
  }
  function onSubmit(event) {
    if(!event.target.matches||!event.target.matches("[data-practice-write]"))return;
    event.preventDefault();
    var input=byId("hskPracticeAnswer");
    if(input)submit(input.value,event.target.querySelector("button"));
  }
  function open(l) { level=(Number(l)>=1&&Number(l)<=4)?Number(l):1;catalog(); }
  document.addEventListener("click",onClick);
  document.addEventListener("submit",onSubmit);
  document.addEventListener("vduckie:language-change",function(){
    var host=panel();
    if(!host||!host.classList.contains("hsk-practice-screen"))return;
    if(finished)finish(true);
    else if(page)renderQuestion();
    else catalog();
  });
  root.VDuckieHSKPractice=Object.freeze({open:open,build:bank.build,config:{papers:bank.TOTAL_PAPERS,perLevel:bank.PAPERS_PER_LEVEL,questions:bank.QUESTIONS_PER_PAPER}});
})(window,document);
