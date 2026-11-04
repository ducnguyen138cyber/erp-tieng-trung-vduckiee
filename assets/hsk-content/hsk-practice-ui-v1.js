/* VDuckie HSK full-paper practice: sectioned exam view, NO EXP awards.
 * Distinct from HSK curriculum learning rewards: a correct practice answer,
 * submission, retry, or review must never trigger any Supabase award RPC.
 */
(function(root,document){
  "use strict";
  if(!root||!document||!root.VDuckieHSKPracticeBank)return;
  var bank=root.VDuckieHSKPracticeBank,cache=Object.create(null),seq=0;
  var level=1,paper=null,answers=Object.create(null),finished=false,review=false;
  var remaining=0,clock=null,confirmSubmit=false,loadingPaper=false;

  function el(id){return document.getElementById(id);}
  function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,function(ch){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
  });}
  function lang(){return root.VDuckieInterfaceI18n&&root.VDuckieInterfaceI18n.getLanguage()||"vi";}
  function t(vi,zh,en){return lang()==="zh"?zh:lang()==="en"?en:vi;}
  function host(){return el("dailyLearningPanel");}
  function mount(html){
    var node=host();if(!node)return;
    node.className="panel daily-panel graded-hsk-screen hsk-practice-screen";
    node.innerHTML=html;
    document.body.setAttribute("data-current-area","msutong");
  }
  function stopTimer(){if(clock!==null&&root.clearInterval)root.clearInterval(clock);clock=null;}
  function timeText(seconds){
    var m=Math.floor(Math.max(0,seconds)/60),s=Math.max(0,seconds)%60;
    return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
  }
  function updateTimer(){
    var target=el("hskPracticeClock");
    if(target)target.textContent=timeText(remaining);
  }
  function tick(){
    if(!paper||finished)return;
    remaining=Math.max(0,remaining-1);
    updateTimer();
    if(remaining===0)finish(true);
  }
  function startTimer(){
    stopTimer();
    if(typeof root.setInterval==="function")clock=root.setInterval(tick,1000);
  }
  function getWords(hsk){
    if(cache[hsk])return cache[hsk];
    var directory="./data/hsk/hsk"+hsk+"/vocabulary/";
    cache[hsk]=root.fetch(directory+"index.json").then(function(resp){
      if(!resp.ok)throw new Error("Cannot load vocabulary index ("+resp.status+")");
      return resp.json();
    }).then(function(index){
      if(!index||!Array.isArray(index.shards)||!index.shards.length)throw new Error("Missing vocabulary shards");
      return Promise.all(index.shards.map(function(shard){
        if(!/^[a-z0-9_-]+\.json$/i.test(shard.file))throw new Error("Invalid source filename");
        return root.fetch(directory+shard.file).then(function(resp){
          if(!resp.ok)throw new Error("Unable to load "+shard.file);
          return resp.json();
        }).then(function(data){return data.records||[];});
      })).then(function(parts){return parts.reduce(function(out,rows){return out.concat(rows);},[]);});
    }).catch(function(error){delete cache[hsk];throw error;});
    return cache[hsk];
  }
  function progress(){
    try{
      var value=JSON.parse(root.localStorage.getItem("vduckie-hsk-practice-exams-v2")||"{}");
      return value&&typeof value==="object"&&!Array.isArray(value)?value:{};
    }catch(e){return {};}
  }
  function save(score){
    try{
      var data=progress(),old=data[paper.id]||{};
      data[paper.id]={attempts:Math.min(999,Number(old.attempts||0)+1),
        best:Math.max(score,Number(old.best||0)),last:score,date:new Date().toISOString()};
      root.localStorage.setItem("vduckie-hsk-practice-exams-v2",JSON.stringify(data));
    }catch(e){/* Browser may disable storage; no impact on examination. */}
  }
  function sectionTitle(section){
    return section==="listening"?t("Phần 1 · Nghe","第一部分 · 听力","Part 1 · Listening"):
      section==="reading"?t("Phần 2 · Đọc","第二部分 · 阅读","Part 2 · Reading"):
      t("Phần 3 · Viết","第三部分 · 书写","Part 3 · Writing");
  }
  function countAnswers(){
    if(!paper)return 0;
    return paper.questions.filter(function(q){
      return Object.prototype.hasOwnProperty.call(answers,q.id)&&String(answers[q.id]).trim()!=="";
    }).length;
  }
  function header(title,subtitle){
    return '<header class="hsk-practice-header"><div><span class="hsk-practice-kicker">'+
      esc(t("ĐỀ LUYỆN HSK · VDUCKIE","HSK 模拟试卷 · VDUCKIE","HSK PRACTICE PAPER · VDUCKIE"))+
      '</span><h2>'+esc(title)+'</h2><p>'+esc(subtitle)+'</p></div>'+
      '<button type="button" class="hsk-practice-back" data-practice-close>'+
      esc(t("← Giáo trình HSK","← 返回 HSK 课程","← HSK curriculum"))+'</button></header>';
  }
  function catalog(){
    ++seq;stopTimer();paper=null;answers=Object.create(null);finished=false;review=false;confirmSubmit=false;loadingPaper=false;
    var saved=progress(),plan=bank.BLUEPRINT[level],total=plan.listening+plan.reading+plan.writing;
    var tabs='<div class="hsk-practice-levels" role="tablist" aria-label="HSK">'+
      [1,2,3,4].map(function(n){
        return '<button type="button" role="tab" aria-selected="'+(n===level)+'" class="'+(n===level?'active':'')+
          '" data-practice-level="'+n+'">HSK '+n+'</button>';
      }).join("")+'</div>';
    var cards=[];
    for(var n=1;n<=bank.PAPERS_PER_LEVEL;n++){
      var key="hsk"+level+"-practice-"+String(n).padStart(2,"0"),stat=saved[key];
      cards.push('<button type="button" class="hsk-practice-paper" data-practice-start="'+n+'"><b>'+
        esc(t("Đề","第","Paper"))+' '+String(n).padStart(2,"0")+'</b><small>'+
        (stat?esc(t("Cao nhất: ","最佳：","Best: "))+Math.round(stat.best)+'%':
        esc(t("Chưa làm","尚未作答","Not attempted")))+
        '</small></button>');
    }
    mount('<section class="hsk-practice-container">'+header(
      t("Kho đề luyện HSK · 224 mã đề","HSK 模拟练习 · 224 套","HSK practice · 224 paper variants"),
      t("Chọn cấp độ và mã đề để bắt đầu.","请选择考试等级与试卷。","Choose a level and a practice paper."))+
      '<p class="hsk-practice-disclaimer">'+esc(t(
        "Đề mô phỏng theo số lượng câu HSK phổ biến, được tạo từ từ vựng VDuckie. Phần nghe dùng giọng đọc TTS, không phải audio hay đề thi chính thức. Làm đề không cộng EXP.",
        "基于 VDuckie 词库、按常见 HSK 题量生成的模拟练习。听力为 TTS 朗读，并非官方试卷或录音。练习不奖励 EXP。",
        "Original vocabulary practice using familiar HSK section lengths. Listening uses TTS, not official audio. Practice exams do not earn EXP."))+'</p>'+
      '<div class="hsk-practice-catalog-meta">'+esc(t("Cấu trúc cấp này: ","本级结构：","This level: ")+
        plan.listening+" "+t("Nghe","听力","listening")+" · "+plan.reading+" "+t("Đọc","阅读","reading")+
        (plan.writing?" · "+plan.writing+" "+t("Viết","书写","writing"):"")+
        " · "+total+" "+t("câu","题","questions"))+'</div>'+tabs+
      '<div class="hsk-practice-catalog">'+cards.join("")+'</div></section>');
  }
  function questionPrompt(q){
    if(q.type==="listening")return t("Nghe và chọn chữ Hán đúng.","听发音，选择正确的汉字。","Listen and select the matching Hanzi.");
    if(q.type==="meaning")return t("Chọn nghĩa đúng.","选择正确的释义。","Choose the correct meaning.");
    if(q.type==="hanzi")return t("Chọn chữ Hán đúng.","选择正确的汉字。","Choose the correct Hanzi.");
    if(q.type==="pinyin")return t("Chọn Pinyin đúng.","选择正确的拼音。","Choose the correct Pinyin.");
    if(q.type==="reading")return t("Đọc và chọn nghĩa đúng.","阅读并选择正确的释义。","Read and choose the correct meaning.");
    return t("Viết chữ Hán tương ứng.","填写正确的汉字。","Write the Hanzi.");
  }
  function answerOptions(q){
    var selected=Object.prototype.hasOwnProperty.call(answers,q.id)?String(answers[q.id]):"";
    if(q.type==="writing"){
      return '<label class="hsk-exam-write-label" for="'+esc(q.id)+'">'+
        esc(t("Nhập chữ Hán","输入汉字","Write Hanzi"))+'</label><input id="'+esc(q.id)+
        '" data-practice-write="'+esc(q.id)+'" class="hsk-exam-input" type="text" lang="zh-CN" autocomplete="off" spellcheck="false" placeholder="汉字"'+
        (finished?' disabled':'')+' value="'+esc(selected)+'">';
    }
    return '<div class="hsk-exam-choices">'+q.options.map(function(option,i){
      var key=String(i);
      return '<label class="hsk-exam-choice'+(selected===option?' is-selected':'')+'"><input type="radio" name="'+esc(q.id)+
        '" data-practice-answer="'+esc(q.id)+'" value="'+i+'"'+(selected===option?' checked':'')+
        (finished?' disabled':'')+'><span class="hsk-exam-letter">'+String.fromCharCode(65+i)+
        '</span><span>'+esc(option)+'</span></label>';
    }).join("")+'</div>';
  }
  function renderCard(q,index){
    var listening=q.section==="listening",wrote=q.type==="writing";
    var stimulus=listening?'<div class="hsk-exam-audio"><button type="button" data-practice-listen="'+index+'"'+
      (finished?' disabled':'')+' aria-label="'+esc(t("Nghe câu "+q.sectionNumber,"播放第 "+q.sectionNumber+" 题","Play question "+q.sectionNumber))+
      '">🔊 '+esc(t("Nghe câu "+q.sectionNumber,"播放第 "+q.sectionNumber+" 题","Play item "+q.sectionNumber))+'</button></div>':
      '<div class="hsk-exam-stimulus'+(q.type==="meaning"||q.type==="pinyin"?' is-hanzi':'')+'">'+esc(q.stimulus)+'</div>';
    var reviewHtml="";
    if(finished){
      var answer=answers[q.id]||"",correct=bank.grade(q,answer);
      reviewHtml='<div class="hsk-exam-review '+(correct?'is-correct':'is-incorrect')+'"><strong>'+
        esc(correct?t("✓ Đúng","✓ 正确","✓ Correct"):t("✗ Chưa đúng","✗ 错误","✗ Incorrect"))+
        '</strong><span>'+esc(t("Đáp án: ","正确答案：","Answer: "))+esc(q.answer)+
        '</span><small>'+esc(q.hanzi+" · "+q.pinyin+" · "+q.meaning)+'</small></div>';
    }
    return '<article class="hsk-practice-question hsk-exam-question" id="hsk-exam-q'+(index+1)+
      '" data-practice-question="'+esc(q.id)+'"><div class="hsk-exam-q-head"><span>'+
      esc(t("Câu ","第 ","Question "))+q.sectionNumber+'</span><small>'+esc(questionPrompt(q))+'</small></div>'+
      stimulus+answerOptions(q)+reviewHtml+'</article>';
  }
  function sectionQuestions(section){
    return paper.questions.map(function(q,i){return q.section===section?renderCard(q,i):"";}).join("");
  }
  function updateCounters(){
    if(!paper)return;
    var done=countAnswers(),n=el("hskPracticeDone"),status=el("hskPracticeStatus"),bar=el("hskPracticeBar");
    if(n)n.textContent=done+"/"+paper.questionCount;
    if(bar)bar.style.width=Math.round(100*done/paper.questionCount)+"%";
    if(status&&!finished)status.textContent=t("Đã làm ","已完成 ","Answered ")+done+"/"+paper.questionCount+
      " · "+t("Còn ","剩余 ","Remaining ")+(paper.questionCount-done);
  }
  function renderExam(){
    if(!paper)return;
    var heading=t("HSK "+level+" · Đề "+paper.number,"HSK "+level+" · 第 "+paper.number+" 套","HSK "+level+" · Paper "+paper.number);
    var nav='<nav class="hsk-exam-section-nav" aria-label="Exam sections">'+
      paper.sections.map(function(section){
        return '<button type="button" data-practice-go="'+section+'">'+esc(sectionTitle(section))+
          ' <b>'+paper.blueprint[section]+'</b></button>';
      }).join("")+'</nav>';
    var body=paper.sections.map(function(section){
      return '<section class="hsk-exam-section" id="hsk-exam-'+section+'"><div class="hsk-exam-section-header"><div><h3>'+
        esc(sectionTitle(section))+'</h3><p>'+esc(section==="listening"?
          t("Bấm nghe riêng từng câu và chọn đáp án. Audio sử dụng TTS.","逐题播放 TTS 音频并选择答案。","Play each TTS item and answer."):
          section==="reading"?t("Đọc và trả lời tất cả câu hỏi.","阅读并回答全部问题。","Read and answer all items."):
          t("Gõ chữ Hán phù hợp vào mỗi ô.","在每题中填写正确的汉字。","Enter the appropriate Hanzi for each item."))+
        '</p></div><strong>'+paper.blueprint[section]+' '+esc(t("câu","题","questions"))+
        '</strong></div><div class="hsk-exam-question-list">'+sectionQuestions(section)+'</div></section>';
    }).join("");
    var control=finished?'<button type="button" class="hsk-exam-submit" data-practice-results>'+
      esc(t("← Quay lại kết quả","← 返回成绩","← Back to results"))+'</button>':
      '<div class="hsk-exam-submit-bar"><span id="hskPracticeStatus" role="status" aria-live="polite"></span>'+
      '<button type="button" class="hsk-exam-submit" data-practice-submit>'+esc(t("Nộp bài và chấm điểm","提交试卷并评分","Submit exam for grading"))+
      '</button></div><p id="hskPracticeSubmitWarning" class="hsk-exam-warning" role="status"></p>';
    mount('<section class="hsk-practice-container">'+header(heading,t(
      "Đề mô phỏng. Mọi câu hỏi và các phần thi đều hiển thị; chỉ xem đáp án sau khi nộp. Không cộng EXP.",
      "模拟试卷：全部题目可见，交卷后才显示答案，不奖励 EXP。",
      "All sections are visible; answers are revealed only after submission. No EXP."))+
      '<div class="hsk-exam-status"><div><span>'+esc(t("Đã trả lời","已作答","Answered"))+
      '</span><strong id="hskPracticeDone"></strong></div><div><span>'+esc(t("Còn lại","剩余时间","Time left"))+
      '</span><strong id="hskPracticeClock">'+timeText(remaining)+'</strong></div></div>'+
      '<div class="hsk-practice-track"><i id="hskPracticeBar"></i></div>'+nav+body+control+'</section>');
    updateCounters();updateTimer();
  }
  function start(nextLevel,number){
    stopTimer();level=Number(nextLevel);var token=++seq;
    paper=null;answers=Object.create(null);finished=false;review=false;confirmSubmit=false;loadingPaper=true;
    mount('<section class="hsk-practice-container"><p class="hsk-practice-wait">'+esc(t("Đang tải đề…","正在加载试卷…","Loading paper…"))+'</p></section>');
    getWords(level).then(function(records){
      if(token!==seq||document.body.getAttribute("data-current-area")!=="msutong")return;
      paper=bank.build(level,number,records);remaining=paper.blueprint.minutes*60;
      loadingPaper=false;renderExam();startTimer();
    }).catch(function(error){
      if(token!==seq)return;
      loadingPaper=false;
      mount('<section class="hsk-practice-container">'+header(
        t("Không thể tải đề","无法加载试卷","Cannot load paper"),String(error&&error.message||error))+
        '<button type="button" data-practice-catalog>'+esc(t("Trở lại danh sách","返回试卷列表","Back to papers"))+
        '</button></section>');
    });
  }
  function play(index){
    if(!paper||finished)return;
    var q=paper.questions[index];if(!q||q.type!=="listening")return;
    if(!root.speechSynthesis||!root.SpeechSynthesisUtterance){
      var msg=el("hskPracticeSubmitWarning");
      if(msg)msg.textContent=t("Trình duyệt không hỗ trợ đọc tiếng Trung.","此浏览器不支持语音合成。","Speech synthesis is not supported here.");
      return;
    }
    root.speechSynthesis.cancel();
    var voice=new root.SpeechSynthesisUtterance(q.hanzi);
    voice.lang="zh-CN";voice.rate=.85;
    root.speechSynthesis.speak(voice);
  }
  function results(){
    var totals={},all=0;
    paper.sections.forEach(function(section){
      var qs=paper.questions.filter(function(q){return q.section===section;});
      var correct=qs.filter(function(q){return bank.grade(q,answers[q.id]||"");}).length;
      totals[section]={correct:correct,total:qs.length,points:Math.round(100*correct/qs.length)};
      all+=totals[section].points;
    });
    var max=paper.sections.length*100,score=all,passed=score>=max*.6;
    return {totals:totals,max:max,score:score,percent:Math.round(100*score/max),
      correct:paper.questions.filter(function(q){return bank.grade(q,answers[q.id]||"");}).length,
      passed:passed};
  }
  function renderResults(){
    if(!paper)return;
    var r=results();
    var lines=paper.sections.map(function(section){
      var part=r.totals[section];
      return '<tr><td>'+esc(sectionTitle(section))+'</td><td>'+part.correct+'/'+part.total+
        '</td><td>'+part.points+'/100</td></tr>';
    }).join("");
    mount('<section class="hsk-practice-container">'+header(
      t("Kết quả HSK "+level+" · Đề "+paper.number,"HSK "+level+" · 第 "+paper.number+" 套成绩",
        "HSK "+level+" · Paper "+paper.number+" results"),
      t("Điểm mô phỏng chỉ để luyện tập, không phải chứng chỉ hoặc điểm HSK chính thức.",
        "成绩仅供练习参考，不代表官方 HSK 成绩。","Practice score only; not an official HSK result."))+
      '<div class="hsk-practice-result"><div class="hsk-practice-score">'+r.score+'/'+r.max+'</div>'+
      '<h3>'+esc(r.passed?t("Đạt mức luyện tập","达到练习目标","Practice target met"):
        t("Nên ôn thêm","建议继续复习","Keep reviewing"))+'</h3>'+
      '<p>'+r.correct+'/'+paper.questionCount+' '+esc(t("câu đúng","题正确","correct answers"))+
      ' · '+r.percent+'%</p><table class="hsk-exam-score-table"><thead><tr><th>'+
      esc(t("Phần thi","考试部分","Section"))+'</th><th>'+esc(t("Câu đúng","答对","Correct"))+
      '</th><th>'+esc(t("Điểm","分数","Score"))+'</th></tr></thead><tbody>'+lines+
      '</tbody></table><p>'+esc(t("Làm đề và đạt điểm cao không cộng EXP. Học từ mới và hoàn thành bài HSK trong giáo trình vẫn được thưởng như bình thường.",
        "模拟考试不奖励 EXP。词汇学习与课程完成仍可依照规则获得奖励。",
        "Practice papers award no EXP; qualifying word learning and curriculum lessons still do."))+
      '</p><div class="hsk-practice-result-buttons">'+
      '<button type="button" data-practice-review>'+esc(t("Xem đáp án toàn đề","查看全卷答案","Review all answers"))+
      '</button><button type="button" data-practice-again>'+esc(t("Làm lại đề","重做本卷","Retry paper"))+
      '</button><button type="button" data-practice-catalog>'+esc(t("Chọn đề khác","选择其他试卷","Choose another paper"))+
      '</button></div></div></section>');
  }
  function finish(byTime){
    if(!paper||finished)return;
    finished=true;review=false;confirmSubmit=false;stopTimer();
    var r=results();save(r.percent);
    // Exams are deliberately EXP-free: no awardWordMastery, awardEXP,
    // quiz_pass or dictation_complete RPC is called anywhere in this module.
    renderResults();
  }
  function submit(){
    if(!paper||finished)return;
    var missing=paper.questionCount-countAnswers(),warning=el("hskPracticeSubmitWarning");
    if(missing>0&&!confirmSubmit){
      confirmSubmit=true;
      if(warning)warning.textContent=t("Còn "+missing+" câu chưa làm. Bấm Nộp bài lần nữa để chấm cả câu bỏ trống là sai.",
        "还有 "+missing+" 题未作答。再次点击提交将把空题按错误计分。",
        missing+" questions unanswered. Click Submit again to grade blanks as incorrect.");
      return;
    }
    finish(false);
  }
  function scrollSection(section){
    var node=el("hsk-exam-"+section);
    if(node&&node.scrollIntoView)node.scrollIntoView({behavior:"smooth",block:"start"});
  }
  function onClick(event){
    var button=event.target&&event.target.closest&&event.target.closest("button");
    if(!button)return;
    if(button.hasAttribute("data-practice-open")){event.preventDefault();open();return;}
    var node=host();if(!node||!node.contains(button))return;
    if(button.hasAttribute("data-practice-close")){stopTimer();++seq;if(root.VDuckieGradedHSK)root.VDuckieGradedHSK.open();return;}
    if(button.hasAttribute("data-practice-level")){level=Number(button.getAttribute("data-practice-level"));catalog();return;}
    if(button.hasAttribute("data-practice-catalog")){catalog();return;}
    if(button.hasAttribute("data-practice-start")){start(level,Number(button.getAttribute("data-practice-start")));return;}
    if(button.hasAttribute("data-practice-again")){start(paper.level,paper.number);return;}
    if(button.hasAttribute("data-practice-listen")){play(Number(button.getAttribute("data-practice-listen")));return;}
    if(button.hasAttribute("data-practice-go")){scrollSection(button.getAttribute("data-practice-go"));return;}
    if(button.hasAttribute("data-practice-submit")){submit();return;}
    if(button.hasAttribute("data-practice-review")&&finished){review=true;renderExam();return;}
    if(button.hasAttribute("data-practice-results")&&finished){review=false;renderResults();}
  }
  function onChange(event){
    if(!paper||finished||!event.target.matches||!event.target.matches("[data-practice-answer]"))return;
    var input=event.target,id=input.getAttribute("data-practice-answer");
    var q=paper.questions.find(function(item){return item.id===id;});
    if(!q)return;
    var option=q.options[Number(input.value)];
    if(option===undefined)return;
    answers[id]=option;confirmSubmit=false;
    var card=input.closest(".hsk-exam-question");
    if(card)Array.prototype.forEach.call(card.querySelectorAll(".hsk-exam-choice"),function(label){
      label.classList.toggle("is-selected",!!label.querySelector("input:checked"));
    });
    var warning=el("hskPracticeSubmitWarning");if(warning)warning.textContent="";
    updateCounters();
  }
  function onInput(event){
    if(!paper||finished||!event.target.matches||!event.target.matches("[data-practice-write]"))return;
    answers[event.target.getAttribute("data-practice-write")]=event.target.value;
    confirmSubmit=false;var warning=el("hskPracticeSubmitWarning");
    if(warning)warning.textContent="";
    updateCounters();
  }
  function open(l){
    level=Number(l)>=1&&Number(l)<=4?Number(l):1;
    catalog();
  }
  document.addEventListener("click",onClick);
  document.addEventListener("change",onChange);
  document.addEventListener("input",onInput);
  document.addEventListener("vduckie:language-change",function(){
    var node=host();
    if(!node||!node.classList.contains("hsk-practice-screen"))return;
    if(finished){if(review)renderExam();else renderResults();}
    else if(paper)renderExam();
    else if(!loadingPaper)catalog();
  });
  root.VDuckieHSKPractice=Object.freeze({open:open,build:bank.build,
    config:{papers:bank.TOTAL_PAPERS,perLevel:bank.PAPERS_PER_LEVEL,blueprint:bank.BLUEPRINT},
    // Tests/read-only observability; no reward functions are exposed.
    getExamState:function(){return paper?{id:paper.id,total:paper.questionCount,answered:countAnswers(),submitted:finished}:null;}
  });
})(window,document);
