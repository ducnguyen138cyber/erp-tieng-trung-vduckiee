/* Primary learner entry for HSK 1-4. Old MSUTONG state stays intact. */
(function(root,document){
  "use strict";
  var counts=[24,28,36,48,60,72],MAX_LEARNER_HSK=4;
  function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]});}
  function openLesson(level,lessonId,review){
    if(!root.VDuckieScreenRouter)return;
    root.VDuckieScreenRouter.navigate("hsk-study");
    function enter(attempt){
      var runtime=root.VDuckieHskProfessionalRuntime;
      if(!runtime||typeof runtime.selectLevel!=="function"){
        if(attempt<35)root.setTimeout(function(){enter(attempt+1);},150);
        else if(root.console&&root.console.warn)root.console.warn("HSK course is not ready yet.");
        return;
      }
      runtime.selectLevel(level,false).then(function(){
        if(lessonId&&typeof runtime.selectLesson==="function")runtime.selectLesson(lessonId,false);
        if(review&&root.VDuckieHskStudyFlow)root.VDuckieHskStudyFlow.openReview();
      }).catch(function(error){if(root.console&&root.console.error)root.console.error("HSK entry:",error);});
    }
    enter(0);
  }
  function open(){
    var host=document.getElementById("dailyLearningPanel");if(!host)return;
    host.className="panel daily-panel graded-hsk-screen";
    var previous={};try{previous=root.VDuckieDailyLearning.getState().msutong||{};}catch(error){}
    var oldCount=Object.keys(previous.completed||{}).filter(function(key){return previous.completed[key];}).length;
    var journey=root.VDuckieHskStudyJourney;
    var summary=journey?journey.summary():{current:{level:1,lessonId:""},totalCompleted:0,due:0};
    var current=summary.current;
    var studied=Number(summary.studied||0),weak=Number(summary.weak||0);
    var accuracy=summary.accuracy===null||summary.accuracy===undefined?"Chưa có bài tự kiểm tra":summary.accuracy+"% câu nhớ nghĩa đúng";
    var intro=summary.totalCompleted
      ? '<p>Bạn đã hoàn thành '+summary.totalCompleted+' bài. Tiếp tục đúng vị trí đang học hoặc chọn cấp độ khác.</p>'
      : '<p>Mới bắt đầu? Chọn HSK 1. Đã biết tiếng Trung? Chọn cấp phù hợp rồi học lần lượt: từ mới → nghe & đọc → luyện tập → lưu tiến độ.</p>';
    host.innerHTML='<section class="graded-hsk-page"><header class="graded-hsk-head"><span class="graded-hsk-eyebrow">GIÁO TRÌNH CHÍNH · HSK 1–4</span><h1>Học tiếng Trung theo từng bài</h1>'+intro+
      '<div class="hsk-entry-mastery"><span><b>'+studied+'</b> từ đã luyện</span><span><b>'+weak+'</b> từ cần ôn</span><span><b>'+esc(accuracy)+'</b></span></div>'+
      '<div class="hsk-entry-quick"><button type="button" data-graded-continue>'+(summary.totalCompleted?'Tiếp tục HSK '+current.level+' →':'Bắt đầu HSK 1 →')+'</button><button type="button" data-graded-review'+(summary.due?'':' disabled')+'>↻ Ôn từ đến hạn ('+summary.due+')</button></div>'+
      '<p class="hsk-entry-note">Kho HSK bổ trợ ở menu là nơi tra cứu sâu, không phải giáo trình chính. Kết quả tự học được lưu riêng với điểm thi và EXP.</p></header>'+
      '<div class="graded-hsk-levels">'+counts.map(function(count,i){
        var level=i+1,available=level<=MAX_LEARNER_HSK,done=journey?journey.levelCount(level):0;
        return '<article class="graded-hsk-card'+(available?'':' is-locked')+'"><span class="graded-hsk-level">CẤP ĐỘ '+level+'</span><h2>HSK '+level+'</h2>'+
          '<p>'+(available?done+'/'+count+' bài đã hoàn thành · Từ mới, ví dụ, nghe đọc và luyện tập.':'Nội dung đang kiểm duyệt, chưa mở học.')+'</p>'+
          (available?'<button type="button" data-graded-level="'+level+'">'+(done?'Học tiếp HSK ':'Học HSK ')+level+' →</button>':'<span class="graded-hsk-coming">Sắp mở</span>')+
          '</article>';
      }).join('')+'</div><section class="hsk-practice-entry"><div><b>Kho đề luyện HSK · 224 đề</b><p>HSK1: 40 câu · HSK2: 60 · HSK3: 80 · HSK4: 100. Nghe, Đọc, Viết theo cấp độ; chỉ chấm khi nộp bài, không cộng EXP.</p></div><button type="button" data-practice-open>Mở kho đề HSK →</button></section><details class="graded-hsk-legacy"><summary>Ôn lại giáo trình MSUTONG trước đây</summary><p>Tiến độ MSUTONG cũ được giữ nguyên ('+oldCount+' bài). Nếu cần học lại phần trước, mở riêng giáo trình cũ.</p><button type="button" data-graded-legacy>Ôn giáo trình cũ</button></details></section>';
    host.querySelectorAll("[data-graded-level]").forEach(function(button){
      button.addEventListener("click",function(){
        var level=Number(button.getAttribute("data-graded-level"));
        var saved=current&&Number(current.level)===level?current.lessonId:"";
        openLesson(level,saved,false);
      });
    });
    host.querySelector("[data-graded-continue]").addEventListener("click",function(){
      openLesson(Number(current.level)||1,current.lessonId,false);
    });
    host.querySelector("[data-graded-review]").addEventListener("click",function(){
      if(summary.due)openLesson(Number(current.level)||1,current.lessonId,true);
    });
    host.querySelector("[data-graded-legacy]").addEventListener("click",function(){
      if(root.VDuckieDailyLearning)root.VDuckieDailyLearning.show("msutong");
    });
    document.body.setAttribute("data-current-area","msutong");
  }
  root.VDuckieGradedHSK={open:open};
})(window,document);
