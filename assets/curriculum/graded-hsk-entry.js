/* Graded HSK curriculum entry. Legacy MSUTONG progress is never modified. */
(function(root,document){
 "use strict";
 var levels=[24,28,36,48,60,72];
 function open(){
  var host=document.getElementById("dailyLearningPanel");
  if(!host)return;
  host.className="panel daily-panel graded-hsk-screen";
  var saved={};
  try{saved=root.VDuckieDailyLearning.getState().msutong||{};}catch(e){}
  var completed=Object.keys(saved.completed||{}).filter(function(k){return saved.completed[k];}).length;
  host.innerHTML='<section class="graded-hsk-page"><header class="graded-hsk-head"><span class="graded-hsk-eyebrow">HỌC THEO CẤP ĐỘ · THỰC HÀNH MỖI NGÀY</span><h1>Giáo trình HSK</h1><p>Chọn trình độ để học từng bài, từng từ, nghe câu ví dụ và luyện nhớ bằng bài tập.</p></header><div class="graded-hsk-levels">'+
    levels.map(function(count,i){var level=i+1;return '<article class="graded-hsk-card"><span class="graded-hsk-level">CẤP ĐỘ '+level+'</span><h2>HSK '+level+'</h2><p>'+count+' bài học · Từ mới, ví dụ, nghe đọc và bài luyện.</p><button type="button" data-graded-level="'+level+'">Học HSK '+level+' →</button></article>';}).join('')+
    '</div><details class="graded-hsk-legacy"><summary>Bài học MSUTONG trước đây</summary><p>Tiến độ học cũ của bạn vẫn được giữ nguyên ('+completed+' bài hoàn thành). Nếu cần ôn lại các bài cũ, bấm mở giáo trình trước đây.</p><button type="button" data-graded-legacy>Ôn giáo trình cũ</button></details></section>';
  host.querySelectorAll('[data-graded-level]').forEach(function(button){
   button.addEventListener('click',function(){
    var level=Number(button.getAttribute('data-graded-level'));
    root.VDuckieScreenRouter.navigate('hsk');
    var runtime=root.VDuckieHskProfessionalRuntime;
    if(runtime&&typeof runtime.selectLevel==='function')runtime.selectLevel(level,false);
   });
  });
  host.querySelector('[data-graded-legacy]').addEventListener('click',function(){
   root.VDuckieDailyLearning.show('msutong');
  });
  document.body.setAttribute('data-current-area','msutong');
 }
 root.VDuckieGradedHSK={open:open};
})(window,document);
