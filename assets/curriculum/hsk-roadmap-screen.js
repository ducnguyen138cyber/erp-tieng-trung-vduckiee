/* Dedicated HSK roadmap screen, separate from Home and lesson content. */
(function(root,document){
"use strict";
function open(){
 var host=document.getElementById("hskRoadmapScreen");
 if(!host){
  host=document.createElement("section");
  host.id="hskRoadmapScreen";
  host.className="hsk-full-roadmap";
  var center=document.querySelector(".study-center");
  if(!center)return;
  center.insertBefore(host,center.firstChild);
 }
 host.hidden=false;
 host.classList.remove("hidden");
 var cards=[];
 for(var i=1;i<=9;i++){
  var available=i<=6;
  cards.push('<article class="hsk-map-level'+(available?'':' is-locked')+'"><span class="hsk-map-kicker">CẤP ĐỘ '+i+'</span><h2>HSK '+i+'</h2><p>'+(available?'Học từ vựng, nghe đọc, ngữ pháp và luyện tập.':'Đang xây dựng nội dung.')+'</p>'+(available?'<button type="button" data-map-level="'+i+'">Chọn HSK '+i+' →</button>':'<span class="hsk-map-coming">Sắp mở</span>')+'</article>');
 }
 host.innerHTML='<div class="hsk-full-roadmap-inner"><header class="hsk-map-head"><div><span class="hsk-map-kicker">LỘ TRÌNH TIẾNG TRUNG</span><h1>Chọn cấp độ HSK</h1><p>Đi từng cấp độ từ HSK 1 đến HSK 9. Chọn một trình độ để bắt đầu bài học tương ứng.</p></div><button type="button" data-map-back>← Trang chủ</button></header><div class="hsk-map-grid">'+cards.join('')+'</div></div>';
 host.querySelector('[data-map-back]').addEventListener('click',function(){root.VDuckieScreenRouter.navigate('home')});
 host.querySelectorAll('[data-map-level]').forEach(function(button){
  button.addEventListener('click',function(){
   var level=Number(button.getAttribute('data-map-level'));
   root.VDuckieScreenRouter.navigate('hsk-study');
   if(root.VDuckieHskProfessionalRuntime)root.VDuckieHskProfessionalRuntime.selectLevel(level,false);
  });
 });
}
root.VDuckieHSKRoadmap={open:open};
})(window,document);
